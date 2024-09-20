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

export type BotFile = Database["public"]["Tables"]["bot_files"]["Row"];
export type BotFileUpdate = Database["public"]["Tables"]["bot_files"]["Update"];
export type BotFileInsert = Database["public"]["Tables"]["bot_files"]["Insert"];

interface BotFileContextType {
  botFiles: BotFile[];
  selectedBotFile: BotFile | null;
  loading: boolean;
  setSelectedBotFile: (botFile: BotFile) => void;
  createBotFile: (botFile: BotFileInsert) => Promise<void>;
  updateBotFile: (botFile: BotFileUpdate) => Promise<void>;
  deleteBotFile: (botFile: BotFile) => Promise<void>;
}

const BotFileContext = createContext<BotFileContextType | undefined>(undefined);

export const BotFileProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [botFiles, setBotFiles] = useState<BotFile[]>([]);
  const [selectedBotFile, setSelectedBotFile] = useState<BotFile | null>(null);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);
    const fetchBotFiles = async () => {
      const { data, error } = await supabase.from("bot_files").select("*");

      if (error) {
        showAlert(
          error.message || "An error occurred while fetching bot files",
          "error"
        );
        return;
      }

      if (!data || isEqual(botFiles, data)) return;

      setBotFiles(data);
    };

    fetchBotFiles();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setBotFiles((prev) => [...prev, payload.new]);
      } else if (payload.eventType === "UPDATE") {
        setBotFiles((prev) =>
          prev.map((botFile) =>
            botFile.id === payload.new.id ? payload.new : botFile
          )
        );
      } else if (payload.eventType === "DELETE") {
        setBotFiles((prev) =>
          prev.filter((botFile) => botFile.id !== payload.old.id)
        );
      }
    };

    const subscription = supabase
      .channel("bot_files")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bot_files" },
        (payload) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [botFiles, showAlert]);

  const createBotFile = useCallback(
    async (botFile: BotFileInsert) => {
      const { error } = await supabase.from("bot_files").insert([botFile]);

      if (error) {
        showAlert(
          error.message || "An error occurred while creating bot file",
          "error"
        );
        return;
      }

      showAlert("Bot file created successfully", "success");
    },
    [showAlert]
  );

  const updateBotFile = useCallback(
    async (botFile: BotFileUpdate) => {
      const { error } = await supabase
        .from("bot_files")
        .update(botFile)
        .match({ id: botFile.id });

      if (error) {
        showAlert(
          error.message || "An error occurred while updating bot file",
          "error"
        );
        return;
      }

      showAlert("Bot file updated successfully", "success");
    },
    [showAlert]
  );

  const deleteBotFile = useCallback(
    async (botFile: BotFile) => {
      const { error } = await supabase
        .from("bot_files")
        .delete()
        .match({ id: botFile.id });

      if (error) {
        showAlert(
          error.message || "An error occurred while deleting bot file",
          "error"
        );
        return;
      }

      showAlert("Bot file deleted successfully", "success");
    },
    [showAlert]
  );

  const value = useMemo(
    () => ({
      botFiles,
      selectedBotFile,
      setSelectedBotFile,
      loading,
      createBotFile,
      updateBotFile,
      deleteBotFile,
    }),
    [
      botFiles,
      selectedBotFile,
      loading,
      createBotFile,
      updateBotFile,
      deleteBotFile,
    ]
  );

  return (
    <BotFileContext.Provider value={value}>{children}</BotFileContext.Provider>
  );
};

(BotFileProvider as any).whyDidYouRender = true;

export const useBotFileContext = () => {
  const context = useContext(BotFileContext);

  if (!context) {
    throw new Error("useBotFileContext must be used within a BotFileProvider");
  }

  return context;
};
