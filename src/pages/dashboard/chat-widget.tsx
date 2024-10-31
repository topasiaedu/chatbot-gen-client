import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useBotContext } from "../../context/BotContext";
import { Button, TextInput, DarkThemeToggle } from "flowbite-react";
import Markdown from "markdown-to-jsx";
import animationData from "./loading.json"; // Import your Lottie JSON file
import "./chat-widget.css";
import Lottie from "lottie-react";
import TypingEffect from "../../components/TypingEffect";

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

  const streamResponse = (botMessage: string) => {
    return new Promise<void>((resolve) => {
      let currentMessage = "";
      const typingInterval = 10;
      let index = 0;

      const fixedMessage = botMessage.replace(/(\d+\.)/g, "\n$1");

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
          console.log("Messages:", messages);
          resolve();
        }
      }, typingInterval);
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { text: input, sender: "user" };
    setMessages([...messages, userMessage]);
    setInput("");

    setBotIsThinking(true);

    const response = await fetch(`https://cbg.whatsgenie.com/chat-with-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        botId: bot_model_id,
        prompt: input,
        messages: messages,
      }),
    });

    const botResponse = await response.json();

    setBotIsThinking(false);

    await streamResponse(botResponse.completion);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[100vh] justify-center items-center bg-gray-50 p-4 dark:bg-gray-900">
        {/* Lottie Animation */}
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{ width: 200, height: 200 }}
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-[100vh] justify-center items-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="flex flex-col w-full max-w-7xl mb-6 space-x-3 items-center justify-center">
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
            Hi there,{" "}
            {bots.find((bot) => bot.id === bot_model_id)?.name || "the bot"}{" "}
            here!
          </div>

          <div className="text-gray-500 dark:text-gray-300 text-center">
            <TypingEffect
              text={
                bots.find((bot) => bot.id === bot_model_id)?.short_desc ||
                "I'm a bot!"
              }
              speed={25}
            />
          </div>
        </div>
        <div className="flex items-center space-x-3 w-full max-w-md">
          <TextInput
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            color="primary"
            outline={true}
            onClick={handleSend}
            className="font-medium">
            Send
          </Button>
          <DarkThemeToggle />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-[100vh] justify-center items-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="flex flex-col h-full w-full mx-auto max-w-5xl">
        <div className="text-2xl font-semibold text-gray-900 text-center header-text">
          {bots.find((bot) => bot.id === bot_model_id)?.name || "Bot"}
        </div>

        {/* <DarkThemeToggle /> */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              } space-x-3`}>
              {msg.sender !== "user" && botImage && (
                <img
                  src={botImage}
                  alt="Bot Profile"
                  // Image should be at the bottom of the message bubble
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-7xl ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white dark:bg-blue-600"
                    : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
                }`}>
                <div
                  className="markdown-content"
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.5rem",
                  }}>
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {botIsThinking && botImage && (
            <div className="flex justify-start items-center space-x-3">
              <img
                src={botImage}
                alt="Bot Profile"
                className="w-8 h-8 rounded-full" // Smaller, circular profile image
              />
              <div className="rounded-lg px-4 py-2 max-w-xs text-gray-900 dark:text-white">
                <em>
                  {bots.find((bot) => bot.id === bot_model_id)?.name || "Bot"}{" "}
                  is thinking...
                </em>
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>
        <div className="flex items-center space-x-3 p-4">
          <TextInput
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            color="primary"
            outline={true}
            onClick={handleSend}
            className="font-medium">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
