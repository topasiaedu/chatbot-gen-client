import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useBotContext } from "../../context/BotContext";
import { processMessageText, streamResponse } from "../../components/ChatMessageUtils";
import LoadingScreen from "../../components/LoadingScreen";
import ChatHeader from "../../components/ChatHeader";
import ChatMessageList from "../../components/ChatMessageList";
import ChatInput from "../../components/ChatInput";
import WelcomeScreen from "../../components/WelcomeScreen";
import { Message } from "../../components/ChatMessage";

import "./chat-widget.css";

/**
 * ChatWidget component - Provides a ChatGPT-like chat interface for interacting with AI bots
 * @returns React component
 */
const ChatWidget: React.FC = () => {
  const { bot_model_id } = useParams<{ bot_model_id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [botIsThinking, setBotIsThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const { bots } = useBotContext();
  const [botImage, setBotImage] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading for 2 seconds
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(loadingTimer);
  }, [bot_model_id]);

  useEffect(() => {
    if (bot_model_id) {
      setBotImage(bots.find((bot) => bot.id === bot_model_id)?.img || null);
    }
  }, [bot_model_id, bots]);

  // Optimized update function for streaming messages
  const updateLastMessage = useCallback((text: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], text };
      }
      return updated;
    });
  }, []);

  /**
   * Handles sending a message to the bot and processing its response
   */
  const handleSend = async (message?: string): Promise<void> => {
    const messageToSend = message || input;
    if (!messageToSend.trim()) return;
    
    const userMessage = { text: messageToSend, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setBotIsThinking(true);

    try {
      const response = await fetch(`https://cbg.whatsgenie.com/chat-with-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: bot_model_id,
          prompt: messageToSend,
          messages: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get bot response");
      }

      const botResponse = await response.json();
      setBotIsThinking(false);
      
      // Add empty bot message
      setMessages((prev) => [...prev, { text: "", sender: "bot" }]);
      
      // Stream the response with optimized update function
      await streamResponse(
        botResponse.completion, 
        updateLastMessage,
        20 // Increased typing speed to reduce re-renders (from 1ms to 20ms)
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setBotIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error processing your request. Please try again.",
          sender: "bot",
        },
      ]);
    }
  };

  /**
   * Handles clicking a preset question
   * @param question - The preset question to send
   */
  const handlePresetQuestion = (question: string): void => {
    setInput(question);
    handleSend(question);
  };

  // Show loading screen while data is being fetched
  if (loading) {
    return <LoadingScreen />;
  }

  // Get bot name and avatar (fallback to placeholder if not found)
  const botName = bots.find((bot) => bot.id === bot_model_id)?.name || "Bot";
  const botAvatar = bots.find((bot) => bot.id === bot_model_id)?.img || "https://randomuser.me/api/portraits/women/44.jpg";

  // Show welcome screen if no messages
  if (messages.length === 0) {
    return (
      <WelcomeScreen
        botName={botName}
        botAvatar={botAvatar}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handlePresetQuestion={handlePresetQuestion}
      />
    );
  }

  // Show chat interface if there are messages
  return (
    <div className="flex flex-col min-h-screen w-full justify-between items-center bg-gray-100 dark:bg-gray-900 font-sans px-2 sm:px-4">
      {/* Header */}
      <ChatHeader botName={botName} />
      
      {/* Messages */}
      <div className="flex-1 w-full max-w-4xl mx-auto overflow-hidden">
        <ChatMessageList 
          messages={messages} 
          botImage={botImage} 
          botIsThinking={botIsThinking} 
        />
      </div>
      
      {/* Input area */}
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pb-4 sm:pb-6">
        <ChatInput 
          input={input} 
          setInput={setInput} 
          handleSend={handleSend} 
        />
      </div>
    </div>
  );
};

export default ChatWidget;
