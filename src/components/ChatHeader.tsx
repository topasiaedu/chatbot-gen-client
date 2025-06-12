import React from "react";
import { DarkThemeToggle } from "flowbite-react";

/**
 * Props for the ChatHeader component
 */
interface ChatHeaderProps {
  botName: string;
}

/**
 * ChatHeader component displays the name of the bot and a theme toggle switch
 */
const ChatHeader = ({ botName }: ChatHeaderProps): JSX.Element => {
  return (
    <div className="sticky top-0 z-10 p-3 sm:p-4 backdrop-blur-sm w-full">
      <div className="relative flex items-center justify-center">
        <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center header-text font-sans">
          {botName}
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <DarkThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader; 