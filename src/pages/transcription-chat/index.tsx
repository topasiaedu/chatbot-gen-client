import React, { useState } from "react";
import { Button, Card, Badge, Modal, TextInput, Label, Spinner } from "flowbite-react";
import { 
  HiPlus, 
  HiChat, 
  HiTrash, 
  HiPencil, 
  HiX,
  HiDocumentText,
  HiClock
} from "react-icons/hi";
import { useTranscriptionConversationChatContext } from "../../context/TranscriptionConversationChatContext";
import { useTranscriptionTaskContext } from "../../context/TranscriptionTaskContext";
import ChatInput from "../../components/ChatInput";
import ChatMessageList from "../../components/ChatMessageList";
import { Message } from "../../components/ChatMessage";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import TranscriptionSelector from "../../components/TranscriptionSelector";

/**
 * TranscriptionChatPage - ChatGPT-like interface for transcription conversations
 */
const TranscriptionChatPage: React.FC = () => {
  const {
    conversations,
    currentConversation,
    messages,
    isThinking,
    isLoading,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
  } = useTranscriptionConversationChatContext();

  const { tasks } = useTranscriptionTaskContext();

  // Local state for modals and UI
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedTranscriptions, setSelectedTranscriptions] = useState<string[]>([]);
  const [newChatName, setNewChatName] = useState("");
  const [renameConversationId, setRenameConversationId] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [input, setInput] = useState("");

  // Convert messages for ChatMessageList
  const chatMessages: Message[] = messages.map((msg) => ({
    text: msg.content,
    sender: msg.role === "user" ? "user" : "bot",
  }));

  /**
   * Handle creating a new conversation
   */
  const handleCreateNewChat = async () => {
    if (!newChatName.trim()) {
      return;
    }

    if (selectedTranscriptions.length === 0) {
      return;
    }

    const conversation = await createNewConversation(newChatName.trim(), selectedTranscriptions);
    if (conversation) {
      await selectConversation(conversation.id);
      setShowNewChatModal(false);
      setNewChatName("");
      setSelectedTranscriptions([]);
    }
  };

  /**
   * Handle renaming a conversation
   */
  const handleRenameConversation = async () => {
    if (!renameValue.trim() || !renameConversationId) {
      return;
    }

    await renameConversation(renameConversationId, renameValue.trim());
    setShowRenameModal(false);
    setRenameConversationId("");
    setRenameValue("");
  };

  /**
   * Handle sending a message
   */
  const handleSend = async (message?: string): Promise<void> => {
    const messageToSend = message || input;
    if (!messageToSend.trim() || !currentConversation) return;

    await sendMessage(messageToSend);
    setInput("");
  };

  /**
   * Handle transcription selection change
   */
  const handleTranscriptionSelectionChange = (transcriptionIds: string[]) => {
    setSelectedTranscriptions(transcriptionIds);
  };

  /**
   * Start rename process
   */
  const startRename = (conversationId: string, currentName: string) => {
    setRenameConversationId(conversationId);
    setRenameValue(currentName);
    setShowRenameModal(true);
  };

  /**
   * Format conversation display name
   */
  const getConversationDisplayName = (conversation: typeof conversations[0]) => {
    if (conversation.name) return conversation.name;
    
    const transcriptionNames = conversation.transcriptions
      .map((t) => t.transcription_task?.file_name)
      .filter(Boolean)
      .slice(0, 2);
    
    if (transcriptionNames.length > 0) {
      return transcriptionNames.join(", ") + (conversation.transcriptions.length > 2 ? "..." : "");
    }
    
    return "Untitled Conversation";
  };

  /**
   * Format last message time
   */
  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <NavbarSidebarLayout>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Conversation List */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => setShowNewChatModal(true)}
            className="w-full"
            color="blue"
          >
            <HiPlus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Spinner size="md" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <HiChat className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Create your first chat!</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                    currentConversation?.id === conversation.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getConversationDisplayName(conversation)}
                      </h3>
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <HiDocumentText className="w-3 h-3 mr-1" />
                        <span>{conversation.transcriptions.length} transcription{conversation.transcriptions.length !== 1 ? "s" : ""}</span>
                        {conversation.lastMessage && (
                          <>
                            <span className="mx-1">•</span>
                            <HiClock className="w-3 h-3 mr-1" />
                            <span>{formatLastMessageTime(conversation.lastMessage.created_at || "")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons - show on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 ml-2">
                      <Button
                        size="xs"
                        color="gray"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          startRename(conversation.id, conversation.name || "");
                        }}
                      >
                        <HiPencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this conversation?")) {
                            deleteConversation(conversation.id);
                          }
                        }}
                      >
                        <HiTrash className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getConversationDisplayName(currentConversation)}
                  </h1>
                  <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <HiDocumentText className="w-4 h-4 mr-1" />
                    <span>
                      {currentConversation.transcriptions.length} transcription{currentConversation.transcriptions.length !== 1 ? "s" : ""}: {" "}
                      {currentConversation.transcriptions
                        .map((t) => t.transcription_task?.file_name)
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <HiChat className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Start the conversation
                    </h2>
                    <p className="text-gray-500 dark:text-gray-500">
                      Ask questions about your transcriptions
                    </p>
                  </div>
                </div>
              ) : (
                <ChatMessageList
                  messages={chatMessages}
                  botImage={null}
                  botIsThinking={isThinking}
                />
              )}
            </div>

            {/* Chat Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <ChatInput
                input={input}
                setInput={setInput}
                handleSend={handleSend}
                placeholder="Ask a question about your transcriptions..."
              />
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <HiChat className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Welcome to Transcription Chat
              </h2>
              <p className="text-gray-500 dark:text-gray-500 mb-6 max-w-md">
                Create a new conversation or select an existing one to start chatting with your transcriptions.
              </p>
              <Button
                onClick={() => setShowNewChatModal(true)}
                color="blue"
                size="lg"
              >
                <HiPlus className="w-5 h-5 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal show={showNewChatModal} onClose={() => setShowNewChatModal(false)} size="2xl">
        <Modal.Header>Create New Chat</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            {/* Chat Name */}
            <div>
              <Label htmlFor="chatName" className="mb-2 block">
                Chat Name
              </Label>
              <TextInput
                id="chatName"
                placeholder="Enter a name for this chat"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
              />
            </div>

            {/* Enhanced Transcription Selection */}
            <div>
              <Label className="mb-3 block">
                Select Transcriptions
              </Label>
              
              <TranscriptionSelector
                selectedTranscriptions={selectedTranscriptions}
                onSelectionChange={handleTranscriptionSelectionChange}
                maxHeight="400px"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="blue"
            onClick={handleCreateNewChat}
            disabled={!newChatName.trim() || selectedTranscriptions.length === 0}
          >
            Create Chat
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setShowNewChatModal(false);
              setNewChatName("");
              setSelectedTranscriptions([]);
            }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rename Modal */}
      <Modal show={showRenameModal} onClose={() => setShowRenameModal(false)}>
        <Modal.Header>Rename Conversation</Modal.Header>
        <Modal.Body>
          <div>
            <Label htmlFor="renameName" className="mb-2 block">
              New Name
            </Label>
            <TextInput
              id="renameName"
              placeholder="Enter new name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleRenameConversation();
                }
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="blue"
            onClick={handleRenameConversation}
            disabled={!renameValue.trim()}
          >
            Rename
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setShowRenameModal(false);
              setRenameConversationId("");
              setRenameValue("");
            }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </NavbarSidebarLayout>
  );
};

export default TranscriptionChatPage;
