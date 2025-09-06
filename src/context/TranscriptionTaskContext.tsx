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


// Schema note: table is spelled "transciption_task" in database.types.ts
export type TranscriptionTask =
  Database["public"]["Tables"]["transciption_task"]["Row"];
export type TranscriptionTaskInsert =
  Database["public"]["Tables"]["transciption_task"]["Insert"];
export type TranscriptionTaskUpdate =
  Database["public"]["Tables"]["transciption_task"]["Update"];

interface TranscriptionTaskContextType {
  tasks: TranscriptionTask[];
  loading: boolean;
  selectedTask: TranscriptionTask | null;
  setSelectedTask: (task: TranscriptionTask | null) => void;
  createTask: (input: TranscriptionTaskInsert) => Promise<TranscriptionTask | null>;
  updateTask: (input: TranscriptionTaskUpdate) => Promise<void>;
  deleteTask: (task: TranscriptionTask) => Promise<void>;
  refresh: () => Promise<void>;
}

const TranscriptionTaskContext = createContext<TranscriptionTaskContextType | undefined>(
  undefined
);

export const TranscriptionTaskProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<TranscriptionTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TranscriptionTask | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transciption_task")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showAlert(error.message || "Failed to fetch transcription tasks", "error");
      setLoading(false);
      return;
    }

    setTasks(data || []);
    setLoading(false);
  }, [showAlert]);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel("transciption_task")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "transciption_task" },
        (payload: any) => {
          if (payload.eventType === "INSERT" && payload.new) {
            setTasks((prev) => {
              const exists = prev.some((t) => t.id === (payload.new as TranscriptionTask).id);
              return exists ? prev : [payload.new as TranscriptionTask, ...prev];
            });
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setTasks((prev) =>
              prev.map((t) => (t.id === (payload.new as TranscriptionTask).id ? (payload.new as TranscriptionTask) : t))
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setTasks((prev) => prev.filter((t) => t.id !== (payload.old as TranscriptionTask).id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchTasks]);

  const createTask = useCallback(
    async (input: TranscriptionTaskInsert) => {
      console.log("🎯 TranscriptionTaskContext.createTask called with:", input);
      
      // Minimal validation: at least one of folder or media url should be provided
      const mediaUrl = input.media_url ? input.media_url.trim() : "";
      if (mediaUrl.length === 0) {
        console.error("❌ Media URL is empty or missing");
        showAlert("Media URL is required to create a task", "warning");
        return null;
      }

      const payload: TranscriptionTaskInsert = {
        folder_id: input.folder_id || null,
        media_url: mediaUrl,
        result_url: input.result_url || null,
        status: input.status || "PENDING",
        openai_task_id: input.openai_task_id || null,
        file_name: input.file_name || null,
      };

      console.log("📝 Inserting task with payload:", payload);
      console.log("🗃️ Targeting table: transciption_task");

      const { data, error } = await supabase
        .from("transciption_task")
        .insert(payload)
        .select("*")
        .single();

      console.log("📊 Supabase response:", { data, error });

      if (error) {
        console.error("❌ Database error:", error);
        showAlert(error.message || "Failed to create transcription task", "error");
        return null;
      }

      console.log("✅ Task created successfully:", data);
      showAlert("Transcription task created", "success");
      return data as TranscriptionTask;
    },
    [showAlert]
  );

  const updateTask = useCallback(
    async (input: TranscriptionTaskUpdate) => {
      if (!input.id) {
        showAlert("Task id is required for update", "warning");
        return;
      }

      const payload: TranscriptionTaskUpdate = { ...input };
      if (typeof payload.media_url === "string") {
        payload.media_url = payload.media_url.trim();
      }
      if (typeof payload.result_url === "string") {
        payload.result_url = payload.result_url.trim();
      }

      const { error } = await supabase
        .from("transciption_task")
        .update(payload)
        .eq("id", input.id);

      if (error) {
        showAlert(error.message || "Failed to update transcription task", "error");
        return;
      }

      showAlert("Transcription task updated", "success");
    },
    [showAlert]
  );

  const deleteTask = useCallback(
    async (task: TranscriptionTask) => {
      if (!task.id) {
        showAlert("Task id is required for deletion", "warning");
        return;
      }

      const { error } = await supabase
        .from("transciption_task")
        .delete()
        .eq("id", task.id);

      if (error) {
        showAlert(error.message || "Failed to delete transcription task", "error");
        return;
      }

      showAlert("Transcription task deleted", "success");
    },
    [showAlert]
  );

  const refresh = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  const value = useMemo<TranscriptionTaskContextType>(
    () => ({
      tasks,
      loading,
      selectedTask,
      setSelectedTask,
      createTask,
      updateTask,
      deleteTask,
      refresh,
    }),
    [tasks, loading, selectedTask, createTask, updateTask, deleteTask, refresh]
  );

  return (
    <TranscriptionTaskContext.Provider value={value}>
      {children}
    </TranscriptionTaskContext.Provider>
  );
};

(TranscriptionTaskProvider as unknown as { whyDidYouRender?: boolean }).whyDidYouRender = true;

export const useTranscriptionTaskContext = () => {
  const context = useContext(TranscriptionTaskContext);
  if (!context) {
    throw new Error(
      "useTranscriptionTaskContext must be used within a TranscriptionTaskProvider"
    );
  }
  return context;
};


