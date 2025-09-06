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


export type TranscriptionFolder =
  Database["public"]["Tables"]["transcription_folders"]["Row"];
export type TranscriptionFolderInsert =
  Database["public"]["Tables"]["transcription_folders"]["Insert"];
export type TranscriptionFolderUpdate =
  Database["public"]["Tables"]["transcription_folders"]["Update"];

interface TranscriptionFolderContextType {
  folders: TranscriptionFolder[];
  selectedFolder: TranscriptionFolder | null;
  loading: boolean;
  setSelectedFolder: (folder: TranscriptionFolder | null) => void;
  createFolder: (input: TranscriptionFolderInsert) => Promise<TranscriptionFolder | null>;
  updateFolder: (input: TranscriptionFolderUpdate) => Promise<void>;
  deleteFolder: (folder: TranscriptionFolder) => Promise<void>;
  refresh: () => Promise<void>;
}

const TranscriptionFolderContext =
  createContext<TranscriptionFolderContextType | undefined>(undefined);

/**
 * Provider that exposes CRUD and realtime updates for `transcription_folders`.
 */
export const TranscriptionFolderProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [folders, setFolders] = useState<TranscriptionFolder[]>([]);
  const [selectedFolder, setSelectedFolder] =
    useState<TranscriptionFolder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  /**
   * Fetch all folders from the database.
   */
  const fetchFolders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transcription_folders")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      showAlert(error.message || "Failed to fetch folders", "error");
      setLoading(false);
      return;
    }

    setFolders(data || []);
    setLoading(false);
  }, [showAlert]);

  useEffect(() => {
    // Initial fetch
    fetchFolders();

    // Realtime subscription for create/update/delete
    const channel = supabase
      .channel("transcription_folders")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "transcription_folders" },
        (payload: any) => {
          if (payload.eventType === "INSERT" && payload.new) {
            setFolders((prev) => {
              const exists = prev.some((f) => f.id === payload.new?.id);
              return exists ? prev : [...prev, payload.new as TranscriptionFolder];
            });
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setFolders((prev) =>
              prev.map((f) => (f.id === (payload.new as TranscriptionFolder).id ? (payload.new as TranscriptionFolder) : f))
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setFolders((prev) => prev.filter((f) => f.id !== (payload.old as TranscriptionFolder).id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchFolders]);

  /**
   * Create a new folder with basic input validation.
   */
  const createFolder = useCallback(
    async (input: TranscriptionFolderInsert) => {
      const name = typeof input.name === "string" ? input.name.trim() : "";
      if (name.length === 0) {
        showAlert("Folder name is required", "warning");
        return null;
      }

      const { data, error } = await supabase
        .from("transcription_folders")
        .insert({ name })
        .select("*")
        .single();

      if (error) {
        showAlert(error.message || "Failed to create folder", "error");
        return null;
      }

      showAlert("Folder created", "success");
      return data as TranscriptionFolder;
    },
    [showAlert]
  );

  /**
   * Update an existing folder. The `id` field must be provided.
   */
  const updateFolder = useCallback(
    async (input: TranscriptionFolderUpdate) => {
      if (!input.id) {
        showAlert("Folder id is required for update", "warning");
        return;
      }

      const payload: TranscriptionFolderUpdate = { ...input };
      if (typeof payload.name === "string") {
        payload.name = payload.name.trim();
      }

      const { error } = await supabase
        .from("transcription_folders")
        .update(payload)
        .eq("id", input.id);

      if (error) {
        showAlert(error.message || "Failed to update folder", "error");
        return;
      }

      showAlert("Folder updated", "success");
    },
    [showAlert]
  );

  /**
   * Delete a folder by `id`.
   */
  const deleteFolder = useCallback(
    async (folder: TranscriptionFolder) => {
      if (!folder.id) {
        showAlert("Folder id is required for deletion", "warning");
        return;
      }

      const { error } = await supabase
        .from("transcription_folders")
        .delete()
        .eq("id", folder.id);

      if (error) {
        showAlert(error.message || "Failed to delete folder", "error");
        return;
      }

      showAlert("Folder deleted", "success");
    },
    [showAlert]
  );

  const refresh = useCallback(async () => {
    await fetchFolders();
  }, [fetchFolders]);

  const value = useMemo<TranscriptionFolderContextType>(
    () => ({
      folders,
      selectedFolder,
      loading,
      setSelectedFolder,
      createFolder,
      updateFolder,
      deleteFolder,
      refresh,
    }),
    [folders, selectedFolder, loading, createFolder, updateFolder, deleteFolder, refresh]
  );

  return (
    <TranscriptionFolderContext.Provider value={value}>
      {children}
    </TranscriptionFolderContext.Provider>
  );
};

(TranscriptionFolderProvider as unknown as { whyDidYouRender?: boolean }).whyDidYouRender = true;

export const useTranscriptionFolderContext = () => {
  const context = useContext(TranscriptionFolderContext);
  if (!context) {
    throw new Error(
      "useTranscriptionFolderContext must be used within a TranscriptionFolderProvider"
    );
  }
  return context;
};


