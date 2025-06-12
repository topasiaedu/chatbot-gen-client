import React from "react";

/**
 * Props for the ChatHeader component
 */
interface ChatHeaderProps {
  botName: string;
}

/**
 * ChatHeader component displays the name of the bot
 */
const ChatHeader = ({ botName }: ChatHeaderProps): JSX.Element => {
  return (
    <div className="flex justify-between items-center py-4 px-4 bg-white border-b">
      <h1 className="text-xl font-semibold text-gray-800">{botName}</h1>
    </div>
  );
};

export default ChatHeader; 