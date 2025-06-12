import React, { FormEvent, ChangeEvent, KeyboardEvent, useState } from "react";
import {
  PRESET_QUESTIONS,
  QuestionCategory,
  PresetQuestion,
} from "../constants/presetQuestions";

/**
 * Props for the ChatInput component
 */
interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  placeholder?: string;
}

/**
 * ChatInput component provides a textarea input with send button
 * for users to type and send messages, along with preset question suggestions
 */
const ChatInput = ({
  input,
  setInput,
  handleSend,
  placeholder = "Type a message...",
}: ChatInputProps): JSX.Element => {
  const [showPresetQuestions, setShowPresetQuestions] =
    useState<boolean>(false);

  // Handle form submission
  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (input.trim()) {
      handleSend();
    }
  };

  // Handle input change
  const onChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value);
  };

  // Handle key down events
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSend();
      }
    }

    // Close modal on Escape key
    if (e.key === "Escape") {
      setShowPresetQuestions(false);
    }
  };

  /**
   * Handle preset question selection
   */
  const handleQuestionSelect = (question: string): void => {
    setInput(question);
    setShowPresetQuestions(false);
  };

  /**
   * Toggle preset questions modal
   */
  const togglePresetQuestions = (): void => {
    setShowPresetQuestions(!showPresetQuestions);
  };

  return (
    <>
      {/* Preset Questions Modal */}
      {showPresetQuestions && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowPresetQuestions(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1 sm:gap-2">
                  <span className="text-lg sm:text-xl">💡</span>
                  <span className="hidden sm:inline">Frequently Asked Questions</span>
                  <span className="sm:hidden">FAQ</span>
                </h2>
                <button
                  onClick={() => setShowPresetQuestions(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                  aria-label="Close">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                Click any question to use it as your message
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-8">
              {PRESET_QUESTIONS.map((category, categoryIndex) => (
                <div key={categoryIndex} className="space-y-2 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-xl">{category.icon}</span>
                    {category.title}
                  </h3>
                  <div className="grid gap-2 sm:gap-3">
                    {category.questions.map((question, questionIndex) => (
                      <button
                        key={questionIndex}
                        onClick={() => handleQuestionSelect(question.text)}
                        className="text-left p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-transparent hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200 group">
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 leading-relaxed mb-1 sm:mb-2 font-medium">
                          &ldquo;{question.text}&rdquo;
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {question.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <form className="flex flex-col items-center w-full relative" onSubmit={onSubmit}>
        {/* Preset Questions Button - Positioned Absolutely */}
        <button
          type="button"
          onClick={togglePresetQuestions}
          className="absolute top-[-45px] sm:top-[-50px] right-2 sm:right-4 z-10 flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors duration-200 text-xs sm:text-sm font-medium">
          <span className="text-sm sm:text-base">💡</span>
          <span className="hidden sm:inline">Frequently Asked Questions</span>
          <span className="sm:hidden">FAQ</span>
        </button>

        <div className="relative w-full px-3 sm:px-4 py-3 sm:py-4">
          <textarea
            value={input}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full rounded-xl sm:rounded-2xl px-4 sm:px-7 pr-12 sm:pr-16 py-4 sm:py-6 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white shadow-md placeholder-gray-500 dark:placeholder-gray-400 font-sans resize-none"
            style={{
              minHeight: "70px",
              boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
            }}
            autoComplete="off"
            autoFocus={false}
            rows={3}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={`absolute bottom-6 sm:bottom-10 right-6 sm:right-10 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-lg transition-colors duration-200 ${
              !input.trim() ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Send">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
            </svg>
          </button>
        </div>
      </form>
    </>
  );
};

export default ChatInput;
