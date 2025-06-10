import React from "react";
import { motion, Variants } from "framer-motion";

/**
 * Props for the ThinkingIndicator component
 */
interface ThinkingIndicatorProps {
  botImage?: string | null;
}

/**
 * Animation variants for the container
 */
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 }
  }
};

/**
 * Animation variants for the bot avatar
 */
const avatarVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

/**
 * Animation variants for the message bubble
 */
const bubbleVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 500,
      damping: 25,
      delay: 0.1
    }
  }
};

/**
 * Animation variants for the dots
 */
const dotVariants: Variants = {
  hidden: { y: 0, opacity: 0.5 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      duration: 0.3
    }
  }
};

/**
 * ThinkingIndicator component shows an animated "bot is thinking" indicator
 * with three animated dots
 */
const ThinkingIndicator = ({ botImage }: ThinkingIndicatorProps): JSX.Element => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex justify-start items-center space-x-3 font-sans"
    >
      {botImage && (
        <motion.div
          variants={avatarVariants}
          className="flex-shrink-0 mr-1"
        >
          <motion.img
            src={botImage}
            alt="Bot Profile"
            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm bg-purple-500"
            animate={{ 
              rotate: [0, -3, 0, 3, 0],
              scale: [1, 1.05, 1, 1.05, 1]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
      <motion.div
        variants={bubbleVariants}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2 shadow-sm font-sans"
        animate={{ 
          boxShadow: ["0 1px 2px rgba(0,0,0,0.1)", "0 3px 6px rgba(0,0,0,0.15)", "0 1px 2px rgba(0,0,0,0.1)"]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="flex space-x-2">
          <motion.div
            variants={dotVariants}
            animate={{ y: [0, -8, 0] }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              delay: 0,
              ease: [0.4, 0, 0.6, 1]
            }}
            className="dot w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
          ></motion.div>
          <motion.div
            variants={dotVariants}
            animate={{ y: [0, -8, 0] }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              delay: 0.15,
              ease: [0.4, 0, 0.6, 1]
            }}
            className="dot w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
          ></motion.div>
          <motion.div
            variants={dotVariants}
            animate={{ y: [0, -8, 0] }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              delay: 0.3,
              ease: [0.4, 0, 0.6, 1]
            }}
            className="dot w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
          ></motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ThinkingIndicator; 