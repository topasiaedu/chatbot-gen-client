import React from "react";
import { SafeMarkdown, getMarkdownOptions } from "./MarkdownRenderer";

/**
 * Type definition for a chat message
 */
export interface Message {
  text: string;
  sender: string;
}

/**
 * Props for the ChatMessage component
 */
interface ChatMessageProps {
  message: Message;
  botImage: string | null;
}

/**
 * ChatMessage component displays a single message in the chat
 * with proper styling based on sender (user or bot)
 */
const ChatMessage = ({ message, botImage }: ChatMessageProps): JSX.Element => {
  const markdownOptions = getMarkdownOptions();
  const isUser = message.sender === "user";
  
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      {!isUser && botImage && (
        <div
          className="flex-shrink-0 mr-3 mt-1"
        >
          <img
            src={botImage}
            alt="Bot Profile"
            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm bg-purple-500"
          />
        </div>
      )}
      <div
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-500/60 text-white dark:bg-blue-600/60 max-w-md shadow-sm"
            : "bg-white/60 text-gray-900 dark:bg-gray-800/60 dark:text-white border border-gray-200 dark:border-gray-700 max-w-2xl shadow-sm"
        } font-sans`}
      >
        <div className="markdown-content">
          <SafeMarkdown content={message.text} options={markdownOptions} />
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 