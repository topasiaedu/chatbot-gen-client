import React, { useState } from "react";
import { Button, Card, Badge } from "flowbite-react";
import { HiX, HiPlus, HiChat, HiTrash } from "react-icons/hi";
import { useTranscriptionChatContext } from "../../context/TranscriptionChatContext";
import { useTranscriptionTaskContext } from "../../context/TranscriptionTaskContext";
import ChatInput from "../../components/ChatInput";
import ChatMessageList from "../../components/ChatMessageList";
import { Message } from "../../components/ChatMessage";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";

/**
 * TranscriptionChatPage - Main page for chatting with transcriptions
 */
const TranscriptionChatPage: React.FC = () => {
  const {
    messages,
    selectedTranscriptions,
    isThinking,
    addSelectedTranscription,
    removeSelectedTranscription,
    clearSelectedTranscriptions,
    sendMessage,
    clearMessages,
  } = useTranscriptionChatContext();

  const { tasks } = useTranscriptionTaskContext();
  const [input, setInput] = useState("");
  const [showTranscriptionSelector, setShowTranscriptionSelector] = useState(false);

  // Filter completed transcriptions that have result URLs
  const availableTranscriptions = tasks.filter(
    (task) => task.status?.toUpperCase() === "COMPLETED" && task.result_url
  );

  // Convert transcription chat messages to the format expected by ChatMessageList
  const chatMessages: Message[] = messages.map((msg) => ({
    text: msg.content,
    sender: msg.role === "user" ? "user" : "bot",
  }));

  /**
   * Handle sending a message
   */
  const handleSend = async (message?: string): Promise<void> => {
    const messageToSend = message || input;
    if (!messageToSend.trim()) return;

    await sendMessage(messageToSend);
    setInput("");
  };

  /**
   * Handle adding a transcription to the chat context
   */
  const handleAddTranscription = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.result_url) return;

    addSelectedTranscription({
      id: task.id,
      fileName: task.file_name || "Unknown File",
      resultUrl: task.result_url,
      status: task.status || "unknown",
    });
  };

  /**
   * Handle removing a transcription from the chat context
   */
  const handleRemoveTranscription = (transcriptionId: string) => {
    removeSelectedTranscription(transcriptionId);
  };

  /**
   * Handle clearing all messages
   */
  const handleClearChat = () => {
    clearMessages();
  };

  return (
    <NavbarSidebarLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HiChat className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Chat with Transcriptions
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              color="gray"
              onClick={() => setShowTranscriptionSelector(!showTranscriptionSelector)}
            >
              <HiPlus className="w-4 h-4 mr-2" />
              Select Transcriptions
            </Button>
            {messages.length > 0 && (
              <Button size="sm" color="red" onClick={handleClearChat}>
                <HiTrash className="w-4 h-4 mr-2" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>

        {/* Selected Transcriptions */}
        {selectedTranscriptions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Selected Transcriptions ({selectedTranscriptions.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedTranscriptions.map((transcription) => (
                <Badge
                  key={transcription.id}
                  color="blue"
                  className="flex items-center space-x-1"
                >
                  <span>{transcription.fileName}</span>
                  <button
                    onClick={() => handleRemoveTranscription(transcription.id)}
                    className="ml-1 text-blue-800 hover:text-blue-900 dark:text-blue-200 dark:hover:text-blue-100"
                  >
                    <HiX className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Button
                size="xs"
                color="gray"
                onClick={clearSelectedTranscriptions}
                className="ml-2"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Transcription Selector */}
        {showTranscriptionSelector && (
          <Card className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Available Transcriptions
              </h3>
              <Button
                size="xs"
                color="gray"
                onClick={() => setShowTranscriptionSelector(false)}
              >
                <HiX className="w-4 h-4" />
              </Button>
            </div>
            
            {availableTranscriptions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No completed transcriptions available. Please upload and process some audio files first.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableTranscriptions.map((task) => {
                  const isSelected = selectedTranscriptions.some((t) => t.id === task.id);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isSelected
                          ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
                          : "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {task.file_name || "Unknown File"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="xs"
                        color={isSelected ? "red" : "blue"}
                        onClick={() =>
                          isSelected
                            ? handleRemoveTranscription(task.id)
                            : handleAddTranscription(task.id)
                        }
                      >
                        {isSelected ? "Remove" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <HiChat className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start a Conversation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select one or more transcriptions above and start asking questions about their content.
              </p>
              {selectedTranscriptions.length === 0 && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Please select at least one transcription to begin chatting.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex-1 overflow-hidden">
            <ChatMessageList
              messages={chatMessages}
              botImage={null}
              botIsThinking={isThinking}
            />
          </div>
        )}

        {/* Chat Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              disabled={selectedTranscriptions.length === 0}
              placeholder={
                selectedTranscriptions.length === 0
                  ? "Select transcriptions to start chatting..."
                  : "Ask a question about your transcriptions..."
              }
            />
            {selectedTranscriptions.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                You need to select at least one transcription before you can send messages.
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default TranscriptionChatPage;
