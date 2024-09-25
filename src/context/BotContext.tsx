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

export type Bot = Database["public"]["Tables"]["bots"]["Row"];
export type BotUpdate = Database["public"]["Tables"]["bots"]["Update"];
export type BotInsert = Database["public"]["Tables"]["bots"]["Insert"];

interface BotContextType {
  bots: Bot[];
  selectedBot: Bot | null;
  loading: boolean;
  setSelectedBot: (bot: Bot | null) => void;
  createBot: (bot: BotInsert) => Promise<Bot>;
  updateBot: (bot: BotUpdate) => Promise<void>;
  deleteBot: (bot: Bot) => Promise<void>;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export const BotProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);
    const fetchBots = async () => {
      const { data, error } = await supabase.from("bots").select("*");

      if (error) {
        showAlert(
          error.message || "An error occurred while fetching bots",
          "error"
        );
        return;
      }

      if (!data || isEqual(bots, data)) return;

      setBots(data);
    };

    fetchBots();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setBots((prev) => [...prev, payload.new]);  
      } else if (payload.eventType === "UPDATE") {
        setBots((prev) =>
          prev.map((bot) => (bot.id === payload.new.id ? payload.new : bot))
        );
      } else if (payload.eventType === "DELETE") {
        setBots((prev) => prev.filter((bot) => bot.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel("bots")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bots" },
        (payload) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [bots, showAlert]);

  const createBot = useCallback(
    async (bot: BotInsert) => {
      const { data, error } = await supabase.from("bots").insert(bot).select("*").single();

      if (error) {
        showAlert(
          error.message || "An error occurred while creating the bot",
          "error"
        );
      }

      return data as Bot;
    },
    [showAlert]
  );

  const updateBot = useCallback(
    async (bot: BotUpdate) => {
      const { error } = await supabase
        .from("bots")
        .update(bot)
        .match({ id: bot.id });

      if (error) {
        showAlert(
          error.message || "An error occurred while updating the bot",
          "error"
        );
      }
    },
    [showAlert]
  );

  const deleteBot = useCallback(
    async (bot: Bot) => {
      const { error } = await supabase
        .from("bots")
        .delete()
        .match({ id: bot.id });

      if (error) {
        showAlert(
          error.message || "An error occurred while deleting the bot",
          "error"
        );
      }
    },
    [showAlert]
  );

  const value = useMemo(
    () => ({
      bots,
      selectedBot,
      setSelectedBot,
      loading,
      createBot,
      updateBot,
      deleteBot,
    }),
    [bots, selectedBot, loading, createBot, updateBot, deleteBot]
  );

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
};

// Add the whyDidYouRender property after defining the component
(BotProvider as any).whyDidYouRender = true; // Add this line

export const useBotContext = () => {
  const context = useContext(BotContext);

  if (!context) {
    throw new Error("useBotContext must be used within a BotProvider");
  }

  return context;
};
