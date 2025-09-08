import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

/**
 * Type definitions for transcription files
 */
export type TranscriptionFile = Database["public"]["Tables"]["transcription_files"]["Row"];
export type TranscriptionFileInsert = Database["public"]["Tables"]["transcription_files"]["Insert"];
export type TranscriptionFileUpdate = Database["public"]["Tables"]["transcription_files"]["Update"];

/**
 * Context interface for transcription file management
 */
interface TranscriptionFileContextType {
  /** All transcription files */
  files: TranscriptionFile[];
  /** Loading state */
  loading: boolean;
  /** Create multiple transcription files for a task */
  createFiles: (files: TranscriptionFileInsert[]) => Promise<TranscriptionFile[]>;
  /** Create a single transcription file */
  createFile: (file: TranscriptionFileInsert) => Promise<TranscriptionFile | null>;
  /** Update a transcription file */
  updateFile: (file: TranscriptionFileUpdate) => Promise<void>;
  /** Delete a transcription file */
  deleteFile: (file: TranscriptionFile) => Promise<void>;
  /** Get files for a specific transcription task */
  getFilesByTaskId: (taskId: string) => TranscriptionFile[];
  /** Refresh files from database */
  refresh: () => Promise<void>;
}

const TranscriptionFileContext = createContext<TranscriptionFileContextType | undefined>(
  undefined
);

/**
 * Hook to use transcription file context
 */
export const useTranscriptionFileContext = (): TranscriptionFileContextType => {
  const context = useContext(TranscriptionFileContext);
  if (!context) {
    throw new Error("useTranscriptionFileContext must be used within a TranscriptionFileProvider");
  }
  return context;
};

/**
 * Provider component for transcription file management
 */
export const TranscriptionFileProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [files, setFiles] = useState<TranscriptionFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  /**
   * Fetch all transcription files from database
   */
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transcription_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching transcription files:", error);
      showAlert(error.message || "Failed to fetch transcription files", "error");
      setLoading(false);
      return;
    }

    console.log("✅ Fetched transcription files:", data?.length || 0);
    setFiles(data || []);
    setLoading(false);
  }, [showAlert]);

  /**
   * Set up real-time subscriptions and initial data fetch
   */
  useEffect(() => {
    fetchFiles();

    const channel = supabase
      .channel("transcription_files")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "transcription_files" },
        (payload: any) => {
          console.log("📡 Transcription files real-time update:", payload);
          
          if (payload.eventType === "INSERT" && payload.new) {
            setFiles((prev) => {
              const exists = prev.some((f) => f.id === (payload.new as TranscriptionFile).id);
              return exists ? prev : [payload.new as TranscriptionFile, ...prev];
            });
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setFiles((prev) =>
              prev.map((f) => (f.id === (payload.new as TranscriptionFile).id ? (payload.new as TranscriptionFile) : f))
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setFiles((prev) => prev.filter((f) => f.id !== (payload.old as TranscriptionFile).id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchFiles]);

  /**
   * Create multiple transcription files (for chunked uploads)
   */
  const createFiles = useCallback(
    async (fileInserts: TranscriptionFileInsert[]): Promise<TranscriptionFile[]> => {
      console.log("🎯 TranscriptionFileContext.createFiles called with:", fileInserts.length, "files");
      
      if (fileInserts.length === 0) {
        console.warn("❌ No files provided for creation");
        return [];
      }

      const { data, error } = await supabase
        .from("transcription_files")
        .insert(fileInserts)
        .select("*");

      if (error) {
        console.error("❌ Database error creating files:", error);
        showAlert(error.message || "Failed to create transcription files", "error");
        return [];
      }

      console.log("✅ Files created successfully:", data?.length || 0);
      return data as TranscriptionFile[];
    },
    [showAlert]
  );

  /**
   * Create a single transcription file
   */
  const createFile = useCallback(
    async (fileInsert: TranscriptionFileInsert): Promise<TranscriptionFile | null> => {
      console.log("🎯 TranscriptionFileContext.createFile called with:", fileInsert);
      
      const { data, error } = await supabase
        .from("transcription_files")
        .insert(fileInsert)
        .select("*")
        .single();

      if (error) {
        console.error("❌ Database error creating file:", error);
        showAlert(error.message || "Failed to create transcription file", "error");
        return null;
      }

      console.log("✅ File created successfully:", data);
      return data as TranscriptionFile;
    },
    [showAlert]
  );

  /**
   * Update a transcription file
   */
  const updateFile = useCallback(
    async (fileUpdate: TranscriptionFileUpdate): Promise<void> => {
      if (!fileUpdate.id) {
        console.error("❌ File ID is required for update");
        showAlert("File ID is required for update", "error");
        return;
      }

      console.log("🔄 Updating transcription file:", fileUpdate);

      const { error } = await supabase
        .from("transcription_files")
        .update(fileUpdate)
        .eq("id", fileUpdate.id);

      if (error) {
        console.error("❌ Database error updating file:", error);
        showAlert(error.message || "Failed to update transcription file", "error");
        return;
      }

      console.log("✅ File updated successfully");
      showAlert("Transcription file updated", "success");
    },
    [showAlert]
  );

  /**
   * Delete a transcription file
   */
  const deleteFile = useCallback(
    async (file: TranscriptionFile): Promise<void> => {
      console.log("🗑️ Deleting transcription file:", file.id);

      const { error } = await supabase
        .from("transcription_files")
        .delete()
        .eq("id", file.id);

      if (error) {
        console.error("❌ Database error deleting file:", error);
        showAlert(error.message || "Failed to delete transcription file", "error");
        return;
      }

      console.log("✅ File deleted successfully");
      showAlert("Transcription file deleted", "success");
    },
    [showAlert]
  );

  /**
   * Get files for a specific transcription task
   */
  const getFilesByTaskId = useCallback(
    (taskId: string): TranscriptionFile[] => {
      return files.filter((file) => file.transcription_task_id === taskId);
    },
    [files]
  );

  /**
   * Refresh files from database
   */
  const refresh = useCallback(async () => {
    await fetchFiles();
  }, [fetchFiles]);

  const contextValue: TranscriptionFileContextType = {
    files,
    loading,
    createFiles,
    createFile,
    updateFile,
    deleteFile,
    getFilesByTaskId,
    refresh,
  };

  return (
    <TranscriptionFileContext.Provider value={contextValue}>
      {children}
    </TranscriptionFileContext.Provider>
  );
};
