import React, { useMemo, useState, useEffect } from "react";
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
 * Custom hook to detect mobile screen size
 */
const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIsMobile = (): void => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkIsMobile();

    // Add event listener for resize
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
};

/**
 * PresetPrompts component displays a list of preset questions or prompts
 * that users can select to start a conversation
 */
const PresetPrompts = ({ onSelectPrompt }: PresetPromptsProps): JSX.Element => {
  const isMobile = useIsMobile();
  
  // Generate random questions based on screen size: 2 for mobile, 4 for deskhtop
  const randomQuestions = useMemo(() => getRandomQuestions(isMobile ? 0 : 4), [isMobile]);

  return (
    <motion.div 
      className={`flex ${isMobile ? "flex-col gap-3" : "flex-row gap-6"} justify-center items-center w-full ${isMobile ? "max-w-sm" : "max-w-6xl"} ${isMobile ? "mb-4" : "mb-10"}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {randomQuestions.map((question, idx) => (
        <motion.button
          key={`${question.text}-${idx}`}
          type="button"
          onClick={() => onSelectPrompt(question.text)}
          className={`${
            isMobile 
              ? "w-full h-[140px] p-4" 
              : "w-[220px] h-[300px] p-6"
          } bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-lg flex flex-col justify-between hover:bg-white/90 dark:hover:bg-gray-900/90 transition-colors border border-gray-200 dark:border-gray-700 relative group focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans backdrop-blur-sm`}
          aria-label={question.text}
          style={isMobile ? { minHeight: "120px" } : { minWidth: "220px", minHeight: "300px" }}
          variants={cardVariants}
          whileHover="hover"
          whileTap="tap"
          custom={idx}
        >
          <motion.div 
            className={`font-semibold text-gray-900 dark:text-white ${isMobile ? "text-sm" : "text-base"} mb-1 sm:mb-2 text-left ${isMobile ? "overflow-hidden" : ""}`}
            style={isMobile ? {
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis'
            } : {}}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (idx * 0.1) }}
          >
            {question.text}
          </motion.div>
          <motion.div 
            className={`text-gray-600 dark:text-gray-300 ${isMobile ? "text-xs" : "text-sm"} ${isMobile ? "mb-2 overflow-hidden" : "mb-4"} text-left`}
            style={isMobile ? {
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis'
            } : {}}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + (idx * 0.1) }}
          >
            {question.description}
          </motion.div>
          <motion.div 
            className={`absolute ${isMobile ? "right-3 bottom-3" : "right-4 bottom-4"} text-orange-500 group-hover:text-orange-600 transition-colors`}
            variants={arrowVariants}
          >
            <svg width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} fill="none" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default PresetPrompts; 