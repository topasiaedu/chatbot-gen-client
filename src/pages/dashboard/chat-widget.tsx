import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const ChatWidget: React.FC = () => {
  const { bot_model_id } = useParams<{ bot_model_id: string }>();
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const messageEndRef = useRef<HTMLDivElement | null>(null); // Ref for the message container

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

    const response = await fetch(`http://localhost:8000/chat-with-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        botId: bot_model_id,
        prompt: input,
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
