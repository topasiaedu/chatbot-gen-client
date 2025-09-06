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
import { useAuthContext } from "./AuthContext";

// Database types
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"];
export type TranscriptionConversation = Database["public"]["Tables"]["transcription_conversations"]["Row"];
export type TranscriptionConversationInsert = Database["public"]["Tables"]["transcription_conversations"]["Insert"];
export type TranscriptionChatMessage = Database["public"]["Tables"]["transcription_chat_messages"]["Row"];
export type TranscriptionChatMessageInsert = Database["public"]["Tables"]["transcription_chat_messages"]["Insert"];

/**
 * Conversation details for transcription chat
 */
export interface ConversationWithDetails extends Conversation {
  transcriptions: Array<{
    id: string;
    transcription_task: {
      id: string;
      file_name: string | null;
      result_url: string | null;
      status: string | null;
    } | null;
  }>;
  messages: TranscriptionChatMessage[];
  lastMessage?: TranscriptionChatMessage;
}

/**
 * Message for the chat interface (UI representation)
 */
export interface ChatUIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  conversation_id: string;
}

interface TranscriptionConversationChatContextType {
  conversations: ConversationWithDetails[];
  currentConversation: ConversationWithDetails | null;
  messages: ChatUIMessage[];
  isLoading: boolean;
  isThinking: boolean;
  
  // Conversation management
  createNewConversation: (name: string, transcriptionIds: string[]) => Promise<ConversationWithDetails | null>;
  selectConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  renameConversation: (conversationId: string, newName: string) => Promise<void>;
  
  // Message management
  sendMessage: (content: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  
  // Utility
  refreshConversations: () => Promise<void>;
}

const TranscriptionConversationChatContext = createContext<TranscriptionConversationChatContextType | undefined>(
  undefined
);

/**
 * Provider for managing transcription conversations with ChatGPT-like interface
 */
export const TranscriptionConversationChatProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  
  const { showAlert } = useAlertContext();
  const { user } = useAuthContext();

  /**
   * Load all conversations for the current user
   */
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get conversations with transcription links
      const { data: conversationsData, error: conversationsError } = await supabase
        .from("conversations")
        .select(`
          *,
          transcription_conversations (
            id,
            transcription_id,
            transciption_task (
              id,
              file_name,
              result_url,
              status
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (conversationsError) {
        throw conversationsError;
      }

      // Get latest message for each conversation
      const conversationsWithDetails: ConversationWithDetails[] = [];
      
      for (const conv of conversationsData || []) {
        // Get latest message for this conversation
        const { data: latestMessage } = await supabase
          .from("transcription_chat_messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        conversationsWithDetails.push({
          ...conv,
          transcriptions: (conv.transcription_conversations || []).map((tc: any) => ({
            id: tc.id,
            transcription_task: tc.transciption_task,
          })),
          messages: [],
          lastMessage: latestMessage || undefined,
        });
      }

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error loading conversations:", error);
      showAlert("Failed to load conversations", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, showAlert]);

  /**
   * Create a new conversation with selected transcriptions
   */
  const createNewConversation = useCallback(
    async (name: string, transcriptionIds: string[]): Promise<ConversationWithDetails | null> => {
      if (!user?.id) {
        showAlert("User not authenticated", "error");
        return null;
      }

      if (transcriptionIds.length === 0) {
        showAlert("Please select at least one transcription", "warning");
        return null;
      }

      try {
        // Create conversation in conversations table
        const { data: conversation, error: conversationError } = await supabase
          .from("conversations")
          .insert({
            name: name.trim(),
            user_id: user.id,
          })
          .select("*")
          .single();

        if (conversationError) {
          throw conversationError;
        }

        // Link transcriptions to conversation
        const transcriptionLinks = transcriptionIds.map((transcriptionId) => ({
          conversation_id: conversation.id,
          transcription_id: transcriptionId,
        }));

        const { data: linkedTranscriptions, error: linkError } = await supabase
          .from("transcription_conversations")
          .insert(transcriptionLinks)
          .select(`
            id,
            transcription_id,
            transciption_task (
              id,
              file_name,
              result_url,
              status
            )
          `);

        if (linkError) {
          throw linkError;
        }

        const newConversation: ConversationWithDetails = {
          ...conversation,
          transcriptions: (linkedTranscriptions || []).map((tc: any) => ({
            id: tc.id,
            transcription_task: tc.transciption_task,
          })),
          messages: [],
        };

        setConversations((prev) => [newConversation, ...prev]);
        showAlert("Conversation created successfully", "success");
        
        return newConversation;
      } catch (error) {
        console.error("Error creating conversation:", error);
        showAlert("Failed to create conversation", "error");
        return null;
      }
    },
    [user?.id, showAlert]
  );

  /**
   * Select and load a conversation
   */
  const selectConversation = useCallback(async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      showAlert("Conversation not found", "error");
      return;
    }

    setCurrentConversation(conversation);
    await loadMessages(conversationId);
  }, [conversations, showAlert]);

  /**
   * Load messages for a conversation
   */
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      const { data: messagesData, error } = await supabase
        .from("transcription_chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      const chatMessages: ChatUIMessage[] = (messagesData || []).map((msg) => ({
        id: msg.id,
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.message_text,
        timestamp: new Date(msg.created_at || ""),
        conversation_id: msg.conversation_id || "",
      }));

      setMessages(chatMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      showAlert("Failed to load messages", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  /**
   * Send a message in the current conversation
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentConversation || !user?.email) {
        showAlert("No conversation selected or user not authenticated", "error");
        return;
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        showAlert("Please enter a message", "warning");
        return;
      }

      // Add user message to UI immediately
      const userMessage: ChatUIMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: trimmedContent,
        timestamp: new Date(),
        conversation_id: currentConversation.id,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsThinking(true);

      try {
        // Save user message to database
        const { data: savedUserMessage, error: saveError } = await supabase
          .from("transcription_chat_messages")
          .insert({
            conversation_id: currentConversation.id,
            message_text: trimmedContent,
            sender: "user",
            user_email: user.email,
          })
          .select("*")
          .single();

        if (saveError) {
          throw saveError;
        }

        // Update the temporary message with real ID
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, id: savedUserMessage.id }
              : msg
          )
        );

        // Get transcription URLs for API call
        const transcriptionUrls = currentConversation.transcriptions
          .filter((t) => t.transcription_task?.result_url && t.transcription_task?.status?.toUpperCase() === "COMPLETED")
          .map((t) => t.transcription_task!.result_url!);

        if (transcriptionUrls.length === 0) {
          throw new Error("No completed transcriptions available for this conversation");
        }

        // Prepare message history for API
        const messageHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Call transcription chat API
        const response = await fetch("https://cbg.whatsgenie.com/chat-with-transcriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: trimmedContent,
            transcriptionUrls,
            messages: messageHistory,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setIsThinking(false);

        const responseContent = typeof data.completion === "string" ? data.completion : data.response || "No response received";

        // Save assistant message to database
        const { data: savedAssistantMessage, error: assistantSaveError } = await supabase
          .from("transcription_chat_messages")
          .insert({
            conversation_id: currentConversation.id,
            message_text: responseContent,
            sender: "assistant",
            user_email: user.email,
          })
          .select("*")
          .single();

        if (assistantSaveError) {
          throw assistantSaveError;
        }

        // Add assistant message to UI
        const assistantMessage: ChatUIMessage = {
          id: savedAssistantMessage.id,
          role: "assistant",
          content: responseContent,
          timestamp: new Date(savedAssistantMessage.created_at || ""),
          conversation_id: currentConversation.id,
        };

        setMessages((prev) => [...prev, assistantMessage]);

      } catch (error) {
        console.error("Error sending message:", error);
        setIsThinking(false);
        
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        showAlert(`Failed to send message: ${errorMessage}`, "error");
        
        // Add error message to UI
        const errorResponse: ChatUIMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
          conversation_id: currentConversation.id,
        };

        setMessages((prev) => [...prev, errorResponse]);
      }
    },
    [currentConversation, user?.email, messages, showAlert]
  );

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        // Delete conversation record (cascade will handle linked records)
        const { error } = await supabase
          .from("conversations")
          .delete()
          .eq("id", conversationId);

        if (error) {
          throw error;
        }

        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }

        showAlert("Conversation deleted", "success");
      } catch (error) {
        console.error("Error deleting conversation:", error);
        showAlert("Failed to delete conversation", "error");
      }
    },
    [currentConversation?.id, showAlert]
  );

  /**
   * Rename a conversation
   */
  const renameConversation = useCallback(
    async (conversationId: string, newName: string) => {
      try {
        const { error } = await supabase
          .from("conversations")
          .update({ name: newName.trim() })
          .eq("id", conversationId);

        if (error) {
          throw error;
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, name: newName.trim() } : c
          )
        );

        if (currentConversation?.id === conversationId) {
          setCurrentConversation((prev) =>
            prev ? { ...prev, name: newName.trim() } : null
          );
        }

        showAlert("Conversation renamed", "success");
      } catch (error) {
        console.error("Error renaming conversation:", error);
        showAlert("Failed to rename conversation", "error");
      }
    },
    [currentConversation?.id, showAlert]
  );

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  const value = useMemo<TranscriptionConversationChatContextType>(
    () => ({
      conversations,
      currentConversation,
      messages,
      isLoading,
      isThinking,
      createNewConversation,
      selectConversation,
      deleteConversation,
      renameConversation,
      sendMessage,
      loadMessages,
      refreshConversations,
    }),
    [
      conversations,
      currentConversation,
      messages,
      isLoading,
      isThinking,
      createNewConversation,
      selectConversation,
      deleteConversation,
      renameConversation,
      sendMessage,
      loadMessages,
      refreshConversations,
    ]
  );

  return (
    <TranscriptionConversationChatContext.Provider value={value}>
      {children}
    </TranscriptionConversationChatContext.Provider>
  );
};

export const useTranscriptionConversationChatContext = () => {
  const context = useContext(TranscriptionConversationChatContext);
  if (!context) {
    throw new Error(
      "useTranscriptionConversationChatContext must be used within a TranscriptionConversationChatProvider"
    );
  }
  return context;
};
