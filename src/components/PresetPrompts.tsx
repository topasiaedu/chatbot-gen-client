import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { getRandomQuestions, PresetQuestion } from "../constants/presetQuestions";

/**
 * Props for the PresetPrompts component
 */
interface PresetPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

/**
 * Animation variants for container
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

/**
 * Animation variants for individual cards
 */
const cardVariants = {
  hidden: { 
    y: 50, 
    opacity: 0, 
    scale: 0.9 
  },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15
    }
  },
  tap: {
    scale: 0.98,
    boxShadow: "0 15px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 8px -5px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.1 }
  }
};

/**
 * Animation variants for the arrow icon
 */
const arrowVariants = {
  hidden: { x: -5, opacity: 0.5 },
  visible: { x: 0, opacity: 1 },
  hover: { 
    x: 3,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15
    }
  }
};

/**
 * PresetPrompts component displays a list of preset questions or prompts
 * that users can select to start a conversation
 */
const PresetPrompts = ({ onSelectPrompt }: PresetPromptsProps): JSX.Element => {
  // Generate random questions once using useMemo to avoid regenerating on every render
  const randomQuestions = useMemo(() => getRandomQuestions(4), []);

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full max-w-7xl mx-auto mb-6 sm:mb-8 lg:mb-10 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {randomQuestions.map((question, idx) => (
        <motion.button
          key={`${question.text}-${idx}`}
          type="button"
          onClick={() => onSelectPrompt(question.text)}
          className="w-full bg-white/70 dark:bg-gray-900/70 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 flex flex-col justify-between hover:bg-white/90 dark:hover:bg-gray-900/90 transition-colors border border-gray-200 dark:border-gray-700 relative group focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans backdrop-blur-sm min-h-[200px] sm:min-h-[240px] lg:min-h-[280px]"
          aria-label={question.text}
          variants={cardVariants}
          whileHover="hover"
          whileTap="tap"
          custom={idx}
        >
          <motion.div 
            className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base lg:text-base mb-2 text-left"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (idx * 0.1) }}
          >
            {question.text}
          </motion.div>
          <motion.div 
            className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-4 text-left flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + (idx * 0.1) }}
          >
            {question.description}
          </motion.div>
          <motion.div 
            className="absolute right-3 sm:right-4 bottom-3 sm:bottom-4 text-orange-500 group-hover:text-orange-600 transition-colors"
            variants={arrowVariants}
          >
            <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default PresetPrompts; 