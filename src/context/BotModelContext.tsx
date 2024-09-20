import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import isEqual from "lodash.isequal";
import { useAlertContext } from "./AlertContext";

export type BotModel = Database["public"]["Tables"]["bot_models"]["Row"];
export type BotModelUpdate =
  Database["public"]["Tables"]["bot_models"]["Update"];
export type BotModelInsert =
  Database["public"]["Tables"]["bot_models"]["Insert"];

interface BotModelContextType {
  botModels: BotModel[];
  selectedBotModel: BotModel | null;
  loading: boolean;
  setSelectedBotModel: (botModel: BotModel) => void;
  createBotModel: (botModel: BotModelInsert) => Promise<void>;
  updateBotModel: (botModel: BotModelUpdate) => Promise<void>;
  deleteBotModel: (botModel: BotModel) => Promise<void>;
}

const BotModelContext = createContext<BotModelContextType | undefined>(
  undefined
);

export const BotModelProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [botModels, setBotModels] = useState<BotModel[]>([]);
  const [selectedBotModel, setSelectedBotModel] = useState<BotModel | null>(
    null
  );
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);
    const fetchBotModels = async () => {
      const { data, error } = await supabase.from("bot_models").select("*");

      if (error) {
        showAlert(
          error.message || "An error occurred while fetching bot models",
          "error"
        );
        return;
      }

      if (!data || isEqual(botModels, data)) return;

      setBotModels(data);
    };

    fetchBotModels();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setBotModels((prev) => [...prev, payload.new]);
      } else if (payload.eventType === "UPDATE") {
        setBotModels((prev) =>
          prev.map((botModel) =>
            botModel.id === payload.new.id ? payload.new : botModel
          )
        );
      } else if (payload.eventType === "DELETE") {
        setBotModels((prev) =>
          prev.filter((botModel) => botModel.id !== payload.old.id)
        );
      }
    };

    const subscription = supabase
      .channel("bot_models")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bot_models" },
        (payload) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [botModels, showAlert]);

  const createBotModel = useCallback(
    async (botModel: BotModelInsert) => {
      const { error } = await supabase.from("bot_models").insert(botModel);

      if (error) {
        showAlert(
          error.message || "An error occurred while creating bot model",
          "error"
        );
        return;
      }

      showAlert("Bot model created successfully", "success");
    },
    [showAlert]
  );

  const updateBotModel = useCallback(
    async (botModel: BotModelUpdate) => {
      const { error } = await supabase
        .from("bot_models")
        .update(botModel)
        .match({ id: botModel.id });

      if (error) {
        showAlert(
          error.message || "An error occurred while updating bot model",
          "error"
        );
        return;
      }

      showAlert("Bot model updated successfully", "success");
    },

    [showAlert]
  );

  const deleteBotModel = useCallback(
    async (botModel: BotModel) => {
      const { error } = await supabase
        .from("bot_models")
        .delete()
        .match({ id: botModel.id });

      if (error) {
        showAlert(
          error.message || "An error occurred while deleting bot model",
          "error"
        );
        return;
      }

      showAlert("Bot model deleted successfully", "success");
    },
    [showAlert]
  );

  const value = useMemo(
    () => ({
      botModels,
      selectedBotModel,
      setSelectedBotModel,
      loading,
      createBotModel,
      updateBotModel,
      deleteBotModel,
    }),
    [
      botModels,
      selectedBotModel,
      loading,
      createBotModel,
      updateBotModel,
      deleteBotModel,
    ]
  );

  return (
    <BotModelContext.Provider value={value}>
      {children}
    </BotModelContext.Provider>
  );
};

(BotModelProvider as any).whyDidYouRender = true;

export const useBotModelContext = () => {
  const context = useContext(BotModelContext);
  if (!context) {
    throw new Error(
      "useBotModelContext must be used within a BotModelProvider"
    );
  }
  return context;
};
