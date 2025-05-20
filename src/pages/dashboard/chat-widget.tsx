import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useBotContext } from "../../context/BotContext";
import { Button, TextInput, DarkThemeToggle } from "flowbite-react";
import Markdown from "markdown-to-jsx";
import animationData from "./loading.json"; // Import your Lottie JSON file
import "./chat-widget.css";
import Lottie from "lottie-react";
import TypingEffect from "../../components/TypingEffect";
// Import Prism.js for syntax highlighting
import Prism from "prismjs";
// You may need to import specific language support
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";
// Import a Prism theme (choose one that matches ChatGPT style)
import "prismjs/themes/prism-tomorrow.css";

/**
 * Custom code block component for enhanced markdown rendering with Prism.js
 */
const CodeBlock = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const language = className ? className.replace("language-", "") : "";

  // Apply Prism highlighting when component mounts or children change
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [children]);

  // Function to copy code to clipboard
  const copyToClipboard = () => {
    if (navigator.clipboard && children) {
      navigator.clipboard
        .writeText(children)
        .then(() => {
          // Could add a toast or notification here
          console.log("Code copied to clipboard");
        })
        .catch((error) => {
          console.error("Failed to copy code: ", error);
        });
    }
  };

  return (
    <pre className={`relative group ${className || ""}`}>
      <button
        onClick={copyToClipboard}
        className="copy-button absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 
        text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        Copy
      </button>
      <code ref={codeRef} className={language ? `language-${language}` : ""}>
        {children}
      </code>
    </pre>
  );
};

/**
 * Component for inline code rendering
 */
const InlineCode = ({ children }: { children: React.ReactNode }) => {
  return (
    <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm">
      {children}
    </code>
  );
};

/**
 * ChatWidget component - Provides a ChatGPT-like chat interface for interacting with AI bots
 * @returns React component
 */
const ChatWidget: React.FC = () => {
  const { bot_model_id } = useParams<{ bot_model_id: string }>();
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [botIsThinking, setBotIsThinking] = useState(false);
  const [loading, setLoading] = useState(true); // State to control loading screen
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const { bots } = useBotContext();
  const [botImage, setBotImage] = useState<string | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  // Define custom markdown components for better rendering
  const markdownOptions = {
    overrides: {
      pre: {
        component: CodeBlock,
      },
      code: {
        component: InlineCode,
      },
      h1: {
        props: {
          className: "text-2xl font-bold mt-6 mb-4",
        },
      },
      h2: {
        props: {
          className: "text-xl font-bold mt-6 mb-3",
        },
      },
      h3: {
        props: {
          className: "text-lg font-bold mt-4 mb-2",
        },
      },
      p: {
        props: {
          className: "my-3",
        },
      },
      ul: {
        props: {
          className: "list-disc pl-6 my-3",
        },
      },
      ol: {
        props: {
          className: "list-decimal pl-6 my-3",
        },
      },
      li: {
        props: {
          className: "my-1",
        },
      },
      a: {
        props: {
          className: "text-blue-600 hover:underline dark:text-blue-400",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      },
      blockquote: {
        props: {
          className:
            "border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-3 py-2 italic",
        },
      },
      hr: {
        props: {
          className: "my-4 border-gray-300 dark:border-gray-600",
        },
      },
      table: {
        props: {
          className: "min-w-full my-6 border-collapse",
        },
      },
      th: {
        props: {
          className:
            "border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700",
        },
      },
      td: {
        props: {
          className: "border border-gray-300 dark:border-gray-600 px-4 py-2",
        },
      },
    },
  };

  useEffect(() => {
    // if (bot_model_id) {
    // }
    // Simulate loading for 2 seconds
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Adjust this duration as needed

    return () => clearTimeout(loadingTimer); // Cleanup timer on component unmount
  }, [bot_model_id]);

  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (bot_model_id) {
      setBotImage(bots.find((bot) => bot.id === bot_model_id)?.img || null);
      console.log("Bot Image:", botImage);
    }
  }, [botImage, bot_model_id, bots]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Processes code blocks and formats them appropriately
   * @param message - The message to process for code blocks
   * @returns Processed message with proper code block formatting
   */
  const processMessageText = (message: string): string => {
    // Log the original message for debugging
    console.log("Original message:", message);

    // Helper function to escape special markdown characters in numbers
    const escapeNumbersInText = (text: string): string => {
      // Find patterns like "number." at the end of sentences or followed by spaces
      return text.replace(/(\d+)\.(?!\d)/g, "$1\\.");
    };

    // First, escape numbers that might be mistaken as list items
    let processedMessage = escapeNumbersInText(message);

    // Then add spacing around actual list items that we want to keep as lists
    // Look for lines that start with a number followed by a period and a space
    processedMessage = processedMessage.replace(/^(\d+\.\s)/gm, "\n$1");

    // Improve code block formatting
    // Make sure code blocks have proper language annotation and formatting
    processedMessage = processedMessage.replace(/```(\w+)?/g, (match, lang) => {
      if (!lang) return "```text";
      return match;
    });

    // Log the processed message for debugging
    console.log("Processed message:", processedMessage);

    return processedMessage;
  };

  /**
   * Streams the bot response with a typing effect
   * @param botMessage - The message to display with typing effect
   * @returns Promise that resolves when typing is complete
   */
  const streamResponse = (botMessage: string) => {
    return new Promise<void>((resolve) => {
      let currentMessage = "";
      const typingInterval = 10;
      let index = 0;

      // Process the message for better formatting
      const fixedMessage = processMessageText(botMessage);

      // Log the processed message that will be displayed
      console.log("Final message to be displayed:", fixedMessage);

      setMessages((prev) => [...prev, { text: "", sender: "bot" }]);

      const typingEffect = setInterval(() => {
        if (index < fixedMessage.length) {
          currentMessage += fixedMessage[index];
          setMessages((prev) => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1].text = currentMessage;
            return updatedMessages;
          });
          index++;
        } else {
          clearInterval(typingEffect);
          // Log final state of messages for debugging
          console.log("Completed message rendering");
          resolve();
        }
      }, typingInterval);
    });
  };

  /**
   * Handles sending a message to the bot and processing its response
   */
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { text: input, sender: "user" };
    setMessages([...messages, userMessage]);
    setInput("");

    setBotIsThinking(true);

    try {
      const response = await fetch(`https://cbg.whatsgenie.com/chat-with-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: bot_model_id,
          prompt: input,
          messages: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get bot response");
      }

      const botResponse = await response.json();
      setBotIsThinking(false);
      await streamResponse(botResponse.completion);
    } catch (error) {
      console.error("Error sending message:", error);
      setBotIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error processing your request. Please try again.",
          sender: "bot",
        },
      ]);
    }
  };

  // Loading screen with animation
  if (loading) {
    return (
      <div className="flex flex-col h-[100vh] justify-center items-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="rounded-2xl p-8">
          <Lottie
            animationData={animationData}
            loop
            autoplay
            style={{ width: 180, height: 180 }}
          />
          <div className="text-center text-gray-600 dark:text-gray-300 mt-4 font-medium">
            Loading chat...
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-[100vh] bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 p-4 backdrop-blur-sm">
          <div className="relative flex items-center justify-center">
            <div className="text-xl font-semibold text-gray-900 dark:text-white text-center header-text">
              {bots.find((bot) => bot.id === bot_model_id)?.name || "Bot"}
            </div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              <DarkThemeToggle />
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 justify-center items-center p-4">
          <div className="flex flex-col w-full max-w-3xl mb-6 items-center justify-center p-8 rounded-2xl shadow-sm">
            {botImage && (
              <img
                src={botImage}
                alt="Bot Profile"
                className="w-20 h-20 rounded-full object-cover mb-6 border-2 border-gray-200 dark:border-gray-700 shadow-md"
              />
            )}
            <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Hi there,{" "}
              {bots.find((bot) => bot.id === bot_model_id)?.name || "the bot"}{" "}
              here!
            </div>

            <div className="text-gray-600 dark:text-gray-300 text-center max-w-xl">
              <TypingEffect
                text={
                  bots.find((bot) => bot.id === bot_model_id)?.short_desc ||
                  "I'm a bot!"
                }
                speed={25}
              />
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="p-3">
          <div className="flex items-center space-x-3 max-w-3xl mx-auto relative">
            <TextInput
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-full shadow-sm py-2 px-4 pr-12 border-0 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              sizing="md"
            />
            <Button
              color={input.trim() ? "primary" : "gray"}
              onClick={handleSend}
              className={`absolute right-2 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white ${
                input.trim() ? "pulse-animation" : ""
              }`}
              disabled={!input.trim()}>
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
              </svg>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-[100vh] bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 backdrop-blur-sm ">
        <div className="relative flex items-center justify-center">
          <div className="text-xl font-semibold text-gray-900 dark:text-white text-center header-text">
            {bots.find((bot) => bot.id === bot_model_id)?.name || "Bot"}
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <DarkThemeToggle />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}>
            {msg.sender !== "user" && botImage && (
              <div className="flex-shrink-0 mr-3 mt-1">
                <img
                  src={botImage}
                  alt="Bot Profile"
                  className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                />
              </div>
            )}
            <div
              className={`rounded-2xl px-4 py-3 ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white dark:bg-blue-600 max-w-md shadow-sm"
                  : "bg-white text-gray-900 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 max-w-2xl shadow-sm"
              }`}>
              <div className="markdown-content">
                <SafeMarkdown content={msg.text} options={markdownOptions} />
              </div>
            </div>
          </div>
        ))}
        {/* Bot is thinking indicator */}
        {botIsThinking && (
          <div className="flex justify-start items-center space-x-3">
            {botImage && (
              <div className="flex-shrink-0 mr-1">
                <img
                  src={botImage}
                  alt="Bot Profile"
                  className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                />
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2 shadow-sm">
              <div className="flex space-x-2">
                <div
                  className="dot w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}></div>
                <div
                  className="dot w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}></div>
                <div
                  className="dot w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                  style={{ animationDelay: "600ms" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3">
        <div className="flex items-center space-x-3 max-w-3xl mx-auto relative">
          <TextInput
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-full shadow-sm py-2 px-4 pr-12 border-0 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            sizing="md"
          />
          <Button
            color={input.trim() ? "primary" : "gray"}
            onClick={handleSend}
            className={`absolute right-2 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white ${
              input.trim() ? "pulse-animation" : ""
            }`}
            disabled={!input.trim()}>
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Safely renders markdown content with error handling
 */
const SafeMarkdown = ({
  content,
  options,
}: {
  content: string;
  options: any;
}) => {
  try {
    return <Markdown options={options}>{content}</Markdown>;
  } catch (error) {
    console.error("Error rendering markdown:", error);
    // If markdown rendering fails, return plain text
    return <div className="whitespace-pre-wrap">{content}</div>;
  }
};

export default ChatWidget;
