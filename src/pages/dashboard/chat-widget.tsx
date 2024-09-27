import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useBotContext } from "../../context/BotContext";
import { Button, TextInput } from "flowbite-react";

const ChatWidget: React.FC = () => {
  const { bot_model_id } = useParams<{ bot_model_id: string }>();
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const messageEndRef = useRef<HTMLDivElement | null>(null); // Ref for the message container
  const { bots } = useBotContext();

  useEffect(() => {
    if (bot_model_id) {
      console.log("Bot model ID:", bot_model_id);
    }
  }, [bot_model_id]);

  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Trigger scrolling when the messages array changes

  const handleSend = async () => {
    if (!input.trim()) return;
    setInput("");

    const userMessage = { text: input, sender: "user" };
    setMessages([...messages, userMessage]);

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
    console.log("Bot response:", botResponse);
    setMessages([
      ...messages,
      userMessage,
      { text: botResponse.completion, sender: "bot" },
    ]);
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-[100vh] justify-center items-center bg-gray-50 p-4">
        <div className="text-2xl font-semibold text-gray-900 mb-6">
          Start chatting with{" "}
          {bots.find((bot) => bot.id === bot_model_id)?.name || "the bot"}!
        </div>

        {/* Input with Flowbite TextInput and a clean button */}
        <div className="flex items-center space-x-3 w-full max-w-md">
          <TextInput
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            onKeyPress={(e) => e.key === "Enter" && handleSend}
          />

          <Button
            color="blue"
            outline={true}
            onClick={handleSend}
            className="font-medium">
            Send
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100vh] justify-center items-center bg-gray-50 p-4">
      {/* Chat area container that takes up full available height */}
      <div className="flex flex-col h-full w-full max-w-md mx-auto">
        {/* Message area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}>
              <div
                className={`rounded-lg px-4 py-2 max-w-xs ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Dummy div to capture the scroll position */}
          <div ref={messageEndRef} />
        </div>

        {/* Input area */}
        <div className="flex items-center space-x-3 p-4">
          <input
            type="text"
            className="flex-1 bg-white border-0 focus:outline-none rounded-full py-2 px-4 shadow-sm"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
