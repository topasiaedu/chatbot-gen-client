import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useAlertContext } from "./AlertContext";

/**
 * Message interface for transcription chat
 */
export interface TranscriptionChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  id: string;
}

/**
 * Selected transcription for chat context
 */
export interface SelectedTranscription {
  id: string;
  fileName: string;
  resultUrl: string;
  status: string;
}

interface TranscriptionChatContextType {
  messages: TranscriptionChatMessage[];
  selectedTranscriptions: SelectedTranscription[];
  isLoading: boolean;
  isThinking: boolean;
  addSelectedTranscription: (transcription: SelectedTranscription) => void;
  removeSelectedTranscription: (transcriptionId: string) => void;
  clearSelectedTranscriptions: () => void;
  sendMessage: (prompt: string) => Promise<void>;
  clearMessages: () => void;
  updateLastMessage: (content: string) => void;
}

const TranscriptionChatContext = createContext<TranscriptionChatContextType | undefined>(
  undefined
);

/**
 * Provider for managing transcription chat state and API interactions
 */
export const TranscriptionChatProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [messages, setMessages] = useState<TranscriptionChatMessage[]>([]);
  const [selectedTranscriptions, setSelectedTranscriptions] = useState<SelectedTranscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  /**
   * Add a transcription to the selected list for chat context
   */
  const addSelectedTranscription = useCallback((transcription: SelectedTranscription) => {
    setSelectedTranscriptions((prev) => {
      // Check if already selected
      if (prev.some((t) => t.id === transcription.id)) {
        return prev;
      }
      return [...prev, transcription];
    });
  }, []);

  /**
   * Remove a transcription from the selected list
   */
  const removeSelectedTranscription = useCallback((transcriptionId: string) => {
    setSelectedTranscriptions((prev) => prev.filter((t) => t.id !== transcriptionId));
  }, []);

  /**
   * Clear all selected transcriptions
   */
  const clearSelectedTranscriptions = useCallback(() => {
    setSelectedTranscriptions([]);
  }, []);

  /**
   * Clear all chat messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Update the content of the last message (for streaming responses)
   */
  const updateLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        content,
      };
      return updated;
    });
  }, []);

  /**
   * Send a message to the transcription chat API
   */
  const sendMessage = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) {
        showAlert("Please enter a message", "warning");
        return;
      }

      if (selectedTranscriptions.length === 0) {
        showAlert("Please select at least one transcription to chat with", "warning");
        return;
      }

      // Add user message
      const userMessage: TranscriptionChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: prompt.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsThinking(true);
      setIsLoading(true);

      try {
        // Prepare transcription URLs for the API
        const transcriptionUrls = selectedTranscriptions
          .filter((t) => t.resultUrl && t.status?.toUpperCase() === "COMPLETED")
          .map((t) => t.resultUrl);

        if (transcriptionUrls.length === 0) {
          throw new Error("No completed transcriptions available for chat");
        }

        // Prepare messages history for the API (excluding current message)
        const messagesHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch("https://cbg.whatsgenie.com/chat-with-transcriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            transcriptionUrls,
            messages: messagesHistory,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setIsThinking(false);

        // Add assistant message
        const assistantMessage: TranscriptionChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Stream the response if it's a string, otherwise use it directly
        const responseContent = typeof data.completion === "string" ? data.completion : data.response || "No response received";
        
        // For now, we'll set the full response at once
        // In the future, you could implement streaming here
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: responseContent,
            };
          }
          return updated;
        });

      } catch (error) {
        console.error("Error sending message to transcription chat:", error);
        setIsThinking(false);
        
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        showAlert(`Failed to send message: ${errorMessage}`, "error");
        
        // Add error message
        const errorResponse: TranscriptionChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTranscriptions, messages, showAlert]
  );

  const value = useMemo<TranscriptionChatContextType>(
    () => ({
      messages,
      selectedTranscriptions,
      isLoading,
      isThinking,
      addSelectedTranscription,
      removeSelectedTranscription,
      clearSelectedTranscriptions,
      sendMessage,
      clearMessages,
      updateLastMessage,
    }),
    [
      messages,
      selectedTranscriptions,
      isLoading,
      isThinking,
      addSelectedTranscription,
      removeSelectedTranscription,
      clearSelectedTranscriptions,
      sendMessage,
      clearMessages,
      updateLastMessage,
    ]
  );

  return (
    <TranscriptionChatContext.Provider value={value}>
      {children}
    </TranscriptionChatContext.Provider>
  );
};

export const useTranscriptionChatContext = () => {
  const context = useContext(TranscriptionChatContext);
  if (!context) {
    throw new Error(
      "useTranscriptionChatContext must be used within a TranscriptionChatProvider"
    );
  }
  return context;
};
