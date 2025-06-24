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

export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type ChatMessageInsert = Database["public"]["Tables"]["chat_messages"]["Insert"];

interface ChatAnalytics {
  totalMessages: number;
  totalConversations: number;
  uniqueUsers: number;
  averageMessagesPerConversation: number;
  mostActiveUser: string;
  mostFrequentQuestions: Array<{
    question: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    date: string;
    messageCount: number;
  }>;
}

interface ConversationGroup {
  userEmail: string;
  messages: ChatMessage[];
  lastActivity: string;
  messageCount: number;
}

interface ChatContextType {
  messages: ChatMessage[];
  conversations: ConversationGroup[];
  analytics: ChatAnalytics;
  loading: boolean;
  selectedBotId: string | null;
  setSelectedBotId: (botId: string | null) => void;
  refreshData: () => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredConversations: ConversationGroup[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showAlert } = useAlertContext();

  // Group messages into conversations by user email
  const conversations = useMemo<ConversationGroup[]>(() => {
    const grouped = messages.reduce((acc, message) => {
      if (!acc[message.user_email]) {
        acc[message.user_email] = [];
      }
      acc[message.user_email].push(message);
      return acc;
    }, {} as Record<string, ChatMessage[]>);

    return Object.entries(grouped).map(([userEmail, msgs]) => {
      // Sort messages by creation date
      const sortedMessages = msgs.sort(
        (a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()
      );

      return {
        userEmail,
        messages: sortedMessages,
        lastActivity: sortedMessages[sortedMessages.length - 1]?.created_at || "",
        messageCount: msgs.length,
      };
    }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [messages]);

  // Filter conversations based on search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;

    return conversations.filter(conversation =>
      conversation.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.messages.some(msg =>
        msg.message_text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [conversations, searchTerm]);

  // Calculate analytics
  const analytics = useMemo<ChatAnalytics>(() => {
    const totalMessages = messages.length;
    const totalConversations = conversations.length;
    const uniqueUsers = new Set(messages.map(m => m.user_email)).size;
    const averageMessagesPerConversation = totalConversations > 0 
      ? Math.round((totalMessages / totalConversations) * 100) / 100 
      : 0;

    // Find most active user
    const userMessageCounts = messages.reduce((acc, message) => {
      acc[message.user_email] = (acc[message.user_email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveUser = Object.entries(userMessageCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A";

    // Most frequent user questions (only sender === "user")
    const userQuestions = messages
      .filter(m => m.sender === "user")
      .map(m => m.message_text.toLowerCase().trim());

    const questionCounts = userQuestions.reduce((acc, question) => {
      acc[question] = (acc[question] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalUserQuestions = userQuestions.length;
    const mostFrequentQuestions = Object.entries(questionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([question, count]) => ({
        question: question.charAt(0).toUpperCase() + question.slice(1),
        count,
        percentage: totalUserQuestions > 0 ? Math.round((count / totalUserQuestions) * 100 * 100) / 100 : 0,
      }));

    // Recent activity (last 7 days)
    const now = new Date();
    const recentActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const messageCount = messages.filter(m => {
        const messageDate = new Date(m.created_at || "").toISOString().split('T')[0];
        return messageDate === dateString;
      }).length;

      return {
        date: dateString,
        messageCount,
      };
    }).reverse();

    return {
      totalMessages,
      totalConversations,
      uniqueUsers,
      averageMessagesPerConversation,
      mostActiveUser,
      mostFrequentQuestions,
      recentActivity,
    };
  }, [messages, conversations]);

  const fetchMessages = useCallback(async () => {
    if (!selectedBotId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("bot_id", selectedBotId)
        .order("created_at", { ascending: true });

      if (error) {
        showAlert(
          error.message || "An error occurred while fetching chat messages",
          "error"
        );
        return;
      }

      setMessages(data || []);
    } catch (err) {
      showAlert("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedBotId, showAlert]);

  const refreshData = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time updates
  useEffect(() => {
    if (!selectedBotId) return;

    const handleChanges = (payload: any) => {
      if (payload.new?.bot_id !== selectedBotId) return;

      if (payload.eventType === "INSERT") {
        setMessages((prev) => [...prev, payload.new]);
      } else if (payload.eventType === "UPDATE") {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
        );
      } else if (payload.eventType === "DELETE") {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel(`chat_messages_${selectedBotId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        handleChanges
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedBotId]);

  const value = useMemo(
    () => ({
      messages,
      conversations,
      analytics,
      loading,
      selectedBotId,
      setSelectedBotId,
      refreshData,
      searchTerm,
      setSearchTerm,
      filteredConversations,
    }),
    [
      messages,
      conversations,
      analytics,
      loading,
      selectedBotId,
      refreshData,
      searchTerm,
      filteredConversations,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }

  return context;
}; 