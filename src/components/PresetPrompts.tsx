import React from "react";
import { motion } from "framer-motion";

/**
 * Type definition for a preset prompt
 */
export type PresetPrompt = {
  id: number;
  title: string;
  description: string;
};

/**
 * Props for the PresetPrompts component
 */
interface PresetPromptsProps {
  presets: ReadonlyArray<PresetPrompt>;
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
const PresetPrompts = ({ presets, onSelectPrompt }: PresetPromptsProps): JSX.Element => {
  return (
    <motion.div 
      className="flex flex-row gap-6 justify-center items-center w-full max-w-6xl mb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {presets.map((prompt, idx) => (
        <motion.button
          key={prompt.id}
          type="button"
          onClick={() => onSelectPrompt(prompt.title)}
          className="w-[220px] h-[300px] bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:bg-white/90 dark:hover:bg-gray-900/90 transition-colors border border-gray-200 dark:border-gray-700 relative group focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans backdrop-blur-sm"
          aria-label={prompt.title}
          style={{ minWidth: "220px", minHeight: "300px" }}
          variants={cardVariants}
          whileHover="hover"
          whileTap="tap"
          custom={idx}
        >
          <motion.div 
            className="font-semibold text-gray-900 dark:text-white text-base mb-2 text-left"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (idx * 0.1) }}
          >
            {prompt.title}
          </motion.div>
          <motion.div 
            className="text-gray-600 dark:text-gray-300 text-sm mb-4 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + (idx * 0.1) }}
          >
            {prompt.description}
          </motion.div>
          <motion.div 
            className="absolute right-4 bottom-4 text-orange-500 group-hover:text-orange-600 transition-colors"
            variants={arrowVariants}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.button>
      ))}
    </motion.div>
  );
};

/**
 * Default preset prompts for Zi Wei Dou Shu
 */
export const DEFAULT_PRESET_PROMPTS: ReadonlyArray<PresetPrompt> = [
  {
    id: 1,
    title: "What is Zi Wei Dou Shu?",
    description: "Learn the basics and history of Zi Wei Dou Shu (Purple Star Astrology).",
  },
  {
    id: 2,
    title: "What does my chart say about my wealth potential?",
    description: "Explore your wealth palace and financial prospects using Zi Wei Dou Shu.",
  },
  {
    id: 3,
    title: "When is the best timing for important decisions?",
    description: "Use Zi Wei Dou Shu to identify auspicious periods for major life choices.",
  },
  {
    id: 4,
    title: "Can you interpret my Zi Wei Dou Shu chart?",
    description: "Get a personalized reading and understand your destiny map.",
  },
];

export default PresetPrompts; 