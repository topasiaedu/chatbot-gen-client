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
import { useAlertContext } from "./AlertContext";


export type TranscriptionConversation =
  Database["public"]["Tables"]["transcription_conversations"]["Row"];
export type TranscriptionConversationInsert =
  Database["public"]["Tables"]["transcription_conversations"]["Insert"];
export type TranscriptionConversationUpdate =
  Database["public"]["Tables"]["transcription_conversations"]["Update"];

interface TranscriptionConversationWithJoins extends TranscriptionConversation {
  transcription_task?: Database["public"]["Tables"]["transciption_task"]["Row"] | null;
}

interface TranscriptionConversationContextType {
  items: TranscriptionConversationWithJoins[];
  loading: boolean;
  createLink: (
    input: TranscriptionConversationInsert
  ) => Promise<TranscriptionConversation | null>;
  updateLink: (input: TranscriptionConversationUpdate) => Promise<void>;
  deleteLink: (row: TranscriptionConversation) => Promise<void>;
  refresh: () => Promise<void>;
}

const TranscriptionConversationContext = createContext<
  TranscriptionConversationContextType | undefined
>(undefined);

export const TranscriptionConversationProvider: React.FC<
  PropsWithChildren<{}>
> = ({ children }) => {
  const [items, setItems] = useState<TranscriptionConversationWithJoins[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transcription_conversations")
      .select("*, transciption_task(*)")
      .order("created_at", { ascending: false });

    if (error) {
      showAlert(
        error.message || "Failed to fetch transcription conversation links",
        "error"
      );
      setLoading(false);
      return;
    }

    const mapped: TranscriptionConversationWithJoins[] = (data || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (row: any) => {
        const { transciption_task, ...rest } = row;
        const task = (transciption_task || null) as
          | Database["public"]["Tables"]["transciption_task"]["Row"]
          | null;
        return { ...(rest as TranscriptionConversation), transcription_task: task };
      }
    );

    setItems(mapped);
    setLoading(false);
  }, [showAlert]);

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("transcription_conversations")
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "transcription_conversations",
        },
        (payload: any) => {
          if (payload.eventType === "INSERT" && payload.new) {
            setItems((prev) => [{ ...(payload.new as TranscriptionConversation) }, ...prev]);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setItems((prev) =>
              prev.map((it) =>
                it.id === (payload.new as TranscriptionConversation).id
                  ? { ...(payload.new as TranscriptionConversation) }
                  : it
              )
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setItems((prev) =>
              prev.filter((it) => it.id !== (payload.old as TranscriptionConversation).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchItems]);

  const createLink = useCallback(
    async (input: TranscriptionConversationInsert) => {
      const { conversation_id, transcription_id } = input;
      if (!transcription_id) {
        showAlert("transcription_id is required", "warning");
        return null;
      }

      const { data, error } = await supabase
        .from("transcription_conversations")
        .insert({ conversation_id: conversation_id || null, transcription_id })
        .select("*")
        .single();

      if (error) {
        showAlert(
          error.message || "Failed to link transcription to conversation",
          "error"
        );
        return null;
      }

      showAlert("Linked transcription to conversation", "success");
      return data as TranscriptionConversation;
    },
    [showAlert]
  );

  const updateLink = useCallback(
    async (input: TranscriptionConversationUpdate) => {
      if (!input.id) {
        showAlert("id is required to update link", "warning");
        return;
      }

      const { error } = await supabase
        .from("transcription_conversations")
        .update({
          conversation_id: input.conversation_id || null,
          transcription_id: input.transcription_id || null,
        })
        .eq("id", input.id);

      if (error) {
        showAlert(error.message || "Failed to update link", "error");
        return;
      }

      showAlert("Updated link", "success");
    },
    [showAlert]
  );

  const deleteLink = useCallback(
    async (row: TranscriptionConversation) => {
      if (!row.id) {
        showAlert("id is required to delete link", "warning");
        return;
      }

      const { error } = await supabase
        .from("transcription_conversations")
        .delete()
        .eq("id", row.id);

      if (error) {
        showAlert(error.message || "Failed to delete link", "error");
        return;
      }

      showAlert("Deleted link", "success");
    },
    [showAlert]
  );

  const value = useMemo<TranscriptionConversationContextType>(
    () => ({ items, loading, createLink, updateLink, deleteLink, refresh: fetchItems }),
    [items, loading, createLink, updateLink, deleteLink, fetchItems]
  );

  return (
    <TranscriptionConversationContext.Provider value={value}>
      {children}
    </TranscriptionConversationContext.Provider>
  );
};

(TranscriptionConversationProvider as unknown as { whyDidYouRender?: boolean }).whyDidYouRender = true;

export const useTranscriptionConversationContext = () => {
  const context = useContext(TranscriptionConversationContext);
  if (!context) {
    throw new Error(
      "useTranscriptionConversationContext must be used within a TranscriptionConversationProvider"
    );
  }
  return context;
};


