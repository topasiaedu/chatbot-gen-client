import React from "react";
import { motion } from "framer-motion";
import PresetPrompts from "./PresetPrompts";
import ChatInput from "./ChatInput";

/**
 * Props for the WelcomeScreen component
 */
interface WelcomeScreenProps {
  botName: string;
  botAvatar: string;
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  handlePresetQuestion: (question: string) => void;
}

/**
 * Animation variants for container elements
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.2,
      duration: 0.4,
    },
  },
};

/**
 * Animation variants for child elements
 */
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

/**
 * Animation variants for avatar
 */
const avatarVariants = {
  hidden: { scale: 0, rotate: -20, opacity: 0 },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

/**
 * WelcomeScreen component displays the initial screen when no messages exist
 * Shows the bot avatar, a welcome message, preset prompts, and input field
 */
const WelcomeScreen = ({
  botName,
  botAvatar,
  input,
  setInput,
  handleSend,
  handlePresetQuestion,
}: WelcomeScreenProps): JSX.Element => {
  return (
    <motion.div
      className="flex flex-col min-h-screen w-full justify-between items-center font-sans bg-gray-50 px-3 sm:px-4 md:px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}>
      {/* Header Section */}
      <motion.div
        className="flex flex-col items-center justify-center mb-4 sm:mb-6 md:mb-8 px-4 sm:px-6 flex-1"
        variants={containerVariants}>
        {/* Avatar and Emoji */}
        <motion.div className="flex items-center mb-3 sm:mb-4" variants={itemVariants}>
          <motion.img
            src={botAvatar}
            alt="Bot Avatar"
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-2 sm:border-4 border-white shadow-md object-cover bg-purple-500"
            variants={avatarVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          />
        </motion.div>

        {/* Headline */}
        <motion.div
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2 sm:mb-3 drop-shadow-lg px-2"
          variants={itemVariants}>
          Hi there{" "}
          <motion.span
            className="align-middle"
            initial={{ rotate: -10 }}
            animate={{ rotate: 10 }}
            transition={{
              duration: 0.5,
              repeat: 1,
              repeatType: "reverse",
              delay: 0.5,
            }}>
            👋
          </motion.span>
          , How can I help you make progress today?
        </motion.div>

        {/* Sub Headline */}
        <motion.div
          className="text-sm sm:text-base md:text-lg text-gray-900 text-center max-w-xl sm:max-w-2xl mb-4 sm:mb-6 px-2"
          variants={itemVariants}>
          Start with one of the popular prompts below, or feel free to use your
          own to get started!
        </motion.div>

        {/* Preset Prompt Cards */}
        <motion.div variants={itemVariants} className="w-full max-w-7xl">
          <PresetPrompts onSelectPrompt={handlePresetQuestion} />
        </motion.div>
      </motion.div>

      {/* Fixed positioned input area with proper mobile spacing */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-4 sm:pb-6">
        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          placeholder="Type your question or tell me what you need help with!"
        />
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
