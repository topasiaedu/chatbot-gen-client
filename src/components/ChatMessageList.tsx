import React, { useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import ChatMessage, { Message } from "./ChatMessage";
import ThinkingIndicator from "./ThinkingIndicator";

/**
 * Props for the ChatMessageList component
 */
interface ChatMessageListProps {
  messages: Message[];
  botImage: string | null;
  botIsThinking: boolean;
}

/**
 * Animation variants for the message container
 */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      when: "beforeChildren"
    }
  }
};

/**
 * Animation variants for the scroll indicator
 */
const scrollIndicatorVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      delay: 0.5,
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * ChatMessageList component that renders all messages in the chat
 * with auto-scrolling to the most recent message
 */
const ChatMessageList = ({ 
  messages, 
  botImage, 
  botIsThinking 
}: ChatMessageListProps): JSX.Element => {
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimized scroll function with debouncing
  const scrollToBottom = useCallback((): void => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50); // Small delay to prevent excessive scrolling during streaming
  }, []);
  
  useEffect(() => {
    scrollToBottom();
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages.length, botIsThinking, scrollToBottom]); // Only trigger on message count change, not content
  
  return (
    <motion.div
      ref={messageContainerRef}
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 font-sans w-full max-h-[75vh] overflow-y-auto hide-scrollbar"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={`${message.sender}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
              duration: 0.2,
              delay: index < 3 ? index * 0.05 : 0
            }}
          >
            <ChatMessage 
              message={message} 
              botImage={botImage} 
            />
          </motion.div>
        ))}
        
        {/* Bot is thinking indicator */}
        {botIsThinking && (
          <motion.div
            key="thinking-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ThinkingIndicator botImage={botImage} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* New messages indicator (when there are several messages) */}
      {messages.length > 5 && (
        <AnimatePresence>
          {/* <motion.div
            className="sticky bottom-0 w-full flex justify-center"
            variants={scrollIndicatorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              onClick={scrollToBottom}
              className="bg-orange-500 text-white rounded-full shadow-lg p-2 flex items-center justify-center hover:bg-orange-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                />
              </svg>
            </motion.button>
          </motion.div> */}
        </AnimatePresence>
      )}
      
      {/* Invisible element for scrolling to bottom */}
      <div ref={messageEndRef} />
    </motion.div>
  );
};

export default ChatMessageList; 