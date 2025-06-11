import React from "react";
import { motion } from "framer-motion";
import PresetPrompts from "./PresetPrompts";
import ChatInput from "./ChatInput";
import { DarkThemeToggle } from "flowbite-react";

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
      className="flex flex-col min-h-screen w-full justify-between items-center font-sans bg-gray-50 dark:bg-gray-900"
      initial="hidden"
      animate="visible"
      variants={containerVariants}>
      {/* Nav with DarkThemeToggle on the most right */}
      <motion.div
        className="flex justify-end w-full p-4"
        variants={itemVariants}>
        <DarkThemeToggle />
      </motion.div>

      {/* Header Section */}
      <motion.div
        className="flex flex-col items-center justify-center mb-8"
        variants={containerVariants}>
        {/* Avatar and Emoji */}
        <motion.div className="flex items-center mb-4" variants={itemVariants}>
          <motion.img
            src={botAvatar}
            alt="Bot Avatar"
            className="w-24 h-24 rounded-full border-4 border-white shadow-md mr-3 object-cover bg-purple-500"
            variants={avatarVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          />
        </motion.div>

        {/* Headline */}
        <motion.div
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-2 drop-shadow-lg"
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
          , How can I help
          <br />
          you make progress today?
        </motion.div>

        {/* Sub Headline */}
        <motion.div
          className="text-base md:text-lg text-gray-900 dark:text-white text-center max-w-2xl mb-4"
          variants={itemVariants}>
          Start with one of the popular prompts below, or feel free to use your
          own to get started!
        </motion.div>

        {/* Preset Prompt Cards */}
        <motion.div variants={itemVariants}>
          <PresetPrompts onSelectPrompt={handlePresetQuestion} />
        </motion.div>
      </motion.div>

      <ChatInput
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        placeholder="Type your question or tell me what you need help with!"
      />
    </motion.div>
  );
};

export default WelcomeScreen;
