import React, { FormEvent, ChangeEvent } from "react";

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
 * for users to type and send messages
 */
const ChatInput = ({
  input,
  setInput,
  handleSend,
  placeholder = "Type a message..."
}: ChatInputProps): JSX.Element => {
  
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
  
  return (
    <form
      className="flex flex-col items-center w-full"
      onSubmit={onSubmit}
    >
      <div className="relative w-full px-4 py-4">
        <textarea
          value={input}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl px-7 pr-16 py-6 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white shadow-md placeholder-gray-500 dark:placeholder-gray-400 font-sans resize-none"
          style={{ minHeight: "90px", boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)" }}
          autoComplete="off"
          autoFocus={false}
          rows={4}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className={`absolute bottom-10 right-10 rounded-full w-12 h-12 flex items-center justify-center bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-lg transition-colors duration-200 ${!input.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label="Send"
        >
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
          </svg>
        </button>
      </div>
    </form>
  );
};

export default ChatInput; 