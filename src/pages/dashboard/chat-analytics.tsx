import React, { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Label,
  Modal,
  Select,
  TextInput,
  Timeline,
  Tooltip,
} from "flowbite-react";
import {
  HiChartBar,
  HiChatAlt2,
  HiRefresh,
  HiSearch,
  HiUser,
  HiUsers,
  HiQuestionMarkCircle,
  HiCalendar,
  HiEye,
  HiDownload,
  HiX,
  HiChat,
} from "react-icons/hi";
import { useBotContext } from "../../context/BotContext";
import { useChatContext } from "../../context/ChatContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";

/**
 * Comprehensive Q&A Modal Component to show ALL questions and answers from ALL users
 */
const AllQAModal: React.FC<{
  conversations: Array<{
    userEmail: string;
    messages: Array<{
      id: string;
      message_text: string;
      sender: string;
      created_at: string | null;
    }>;
    lastActivity: string;
    messageCount: number;
  }>;
  isOpen: boolean;
  onClose: () => void;
}> = ({ conversations, isOpen, onClose }) => {
  // Aggregate all Q&A pairs from all conversations
  const allQAPairs: Array<{
    question: string;
    answer: string;
    questionTime: string;
    answerTime: string;
    userEmail: string;
    questionId: string;
  }> = [];

  conversations.forEach((conversation) => {
    const messages = [...conversation.messages].sort(
      (a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()
    );

    for (let i = 0; i < messages.length - 1; i++) {
      const currentMessage = messages[i];
      const nextMessage = messages[i + 1];

      if (currentMessage.sender === "user" && nextMessage.sender === "bot") {
        allQAPairs.push({
          question: currentMessage.message_text,
          answer: nextMessage.message_text,
          questionTime: currentMessage.created_at || "",
          answerTime: nextMessage.created_at || "",
          userEmail: conversation.userEmail,
          questionId: currentMessage.id,
        });
      }
    }

    // Handle unanswered questions
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === "user") {
      const hasMatchingAnswer = allQAPairs.some(pair => 
        pair.questionId === lastMessage.id
      );
      if (!hasMatchingAnswer) {
        allQAPairs.push({
          question: lastMessage.message_text,
          answer: "No response yet",
          questionTime: lastMessage.created_at || "",
          answerTime: "",
          userEmail: conversation.userEmail,
          questionId: lastMessage.id,
        });
      }
    }
  });

  // Sort by most recent questions first
  allQAPairs.sort((a, b) => new Date(b.questionTime).getTime() - new Date(a.questionTime).getTime());

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Calculate statistics
  const totalQuestions = allQAPairs.length;
  const answeredQuestions = allQAPairs.filter(pair => pair.answer !== "No response yet").length;
  const uniqueUsers = new Set(allQAPairs.map(pair => pair.userEmail)).size;

  return (
    <Modal show={isOpen} onClose={onClose} size="6xl">
      <Modal.Header>
        <div className="flex items-center space-x-3">
          <HiChat className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Complete Q&A Analysis - All Users
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalQuestions} total questions from {uniqueUsers} users • {answeredQuestions} answered • {totalQuestions - answeredQuestions} pending
            </p>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="max-h-96 space-y-4 overflow-y-auto">
          {allQAPairs.length > 0 ? (
            allQAPairs.map((pair, index) => (
              <div key={pair.questionId} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                {/* User Info Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge color="gray" size="sm">{pair.userEmail}</Badge>
                    <Badge color="blue" size="sm">Q#{index + 1}</Badge>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(pair.questionTime)}
                  </span>
                </div>

                {/* Question */}
                <div className="mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <HiUser className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        User Question
                      </h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {pair.question}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Bot Response */}
                <div className="border-l-2 border-gray-200 pl-4 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      pair.answer === "No response yet" 
                        ? "bg-red-100 dark:bg-red-900" 
                        : "bg-green-100 dark:bg-green-900"
                    }`}>
                      <HiChatAlt2 className={`h-4 w-4 ${
                        pair.answer === "No response yet"
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          pair.answer === "No response yet"
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}>
                          Bot Response
                        </h4>
                        {pair.answerTime && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(pair.answerTime)}
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-sm ${
                        pair.answer === "No response yet" 
                          ? "italic text-red-400 dark:text-red-500" 
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {pair.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <HiChatAlt2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No Q&A pairs found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No conversations with question-answer pairs available.
              </p>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-between">
          <div className="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Total Questions: {totalQuestions}</span>
            <span>Answered: {answeredQuestions}</span>
            <span>Response Rate: {totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0}%</span>
          </div>
          <Button color="gray" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

/**
 * Q&A Modal Component to show questions and answers in a clean format
 */
const QAModal: React.FC<{
  conversation: {
    userEmail: string;
    messages: Array<{
      id: string;
      message_text: string;
      sender: string;
      created_at: string | null;
    }>;
    lastActivity: string;
    messageCount: number;
  };
  isOpen: boolean;
  onClose: () => void;
}> = ({ conversation, isOpen, onClose }) => {
  // Group messages into Q&A pairs
  const qaPairs: Array<{
    question: string;
    answer: string;
    questionTime: string;
    answerTime: string;
  }> = [];

  const messages = [...conversation.messages].sort(
    (a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()
  );

  for (let i = 0; i < messages.length - 1; i++) {
    const currentMessage = messages[i];
    const nextMessage = messages[i + 1];

    if (currentMessage.sender === "user" && nextMessage.sender === "bot") {
      qaPairs.push({
        question: currentMessage.message_text,
        answer: nextMessage.message_text,
        questionTime: currentMessage.created_at || "",
        answerTime: nextMessage.created_at || "",
      });
    }
  }

  // Handle case where last message is a user question without bot response
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.sender === "user") {
    const hasMatchingAnswer = qaPairs.some(pair => 
      pair.question === lastMessage.message_text
    );
    if (!hasMatchingAnswer) {
      qaPairs.push({
        question: lastMessage.message_text,
        answer: "No response yet",
        questionTime: lastMessage.created_at || "",
        answerTime: "",
      });
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="4xl">
      <Modal.Header>
        <div className="flex items-center space-x-3">
          <HiChat className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Q&A Analysis for {conversation.userEmail}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {qaPairs.length} question-answer pairs found
            </p>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="max-h-96 space-y-4 overflow-y-auto">
          {qaPairs.length > 0 ? (
            qaPairs.map((pair, index) => (
              <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <HiUser className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Question #{index + 1}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(pair.questionTime)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {pair.question}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-l-2 border-gray-200 pl-4 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <HiChatAlt2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-green-600 dark:text-green-400">
                          Bot Response
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(pair.answerTime)}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm ${
                        pair.answer === "No response yet" 
                          ? "italic text-gray-400 dark:text-gray-500" 
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {pair.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <HiChatAlt2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No Q&A pairs found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This conversation doesn&apos;t contain any question-answer pairs.
              </p>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total messages: {conversation.messageCount} | 
            Q&A pairs: {qaPairs.length} |
            Last activity: {formatDate(conversation.lastActivity)}
          </div>
          <Button color="gray" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

/**
 * Component to display a conversation thread between user and bot
 */
const ConversationCard: React.FC<{
  conversation: {
    userEmail: string;
    messages: Array<{
      id: string;
      message_text: string;
      sender: string;
      created_at: string | null;
    }>;
    lastActivity: string;
    messageCount: number;
  };
  onExpand: () => void;
  isExpanded: boolean;
  onViewQA: () => void;
}> = ({ conversation, onExpand, isExpanded, onViewQA }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const userMessages = conversation.messages.filter(m => m.sender === "user");
  const botMessages = conversation.messages.filter(m => m.sender === "bot");

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <HiUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {conversation.userEmail}
            </p>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
              Last activity: {formatDate(conversation.lastActivity)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge color="blue">{conversation.messageCount} messages</Badge>
          <Badge color="green">{userMessages.length} questions</Badge>
          <Badge color="purple">{botMessages.length} responses</Badge>
          
          <Tooltip content="View Q&A Analysis">
            <Button size="xs" color="blue" onClick={onViewQA}>
              <HiChat className="mr-1 h-3 w-3" />
              Q&A
            </Button>
          </Tooltip>
          
          <Tooltip content="View Timeline">
            <Button size="xs" color="gray" onClick={onExpand}>
              <HiEye className="mr-1 h-3 w-3" />
              {isExpanded ? "Hide" : "Timeline"}
            </Button>
          </Tooltip>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t pt-4">
          <Timeline>
            {conversation.messages.map((message, index) => (
              <Timeline.Item key={message.id}>
                <Timeline.Point
                  icon={message.sender === "user" ? HiUser : HiChatAlt2}
                />
                <Timeline.Content>
                  <Timeline.Time>
                    {formatDate(message.created_at || "")}
                  </Timeline.Time>
                  <Timeline.Title
                    className={
                      message.sender === "user"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-green-600 dark:text-green-400"
                    }
                  >
                    {message.sender === "user" ? "User Question" : "Bot Response"}
                  </Timeline.Title>
                  <Timeline.Body className="max-h-32 overflow-y-auto">
                    {message.message_text}
                  </Timeline.Body>
                </Timeline.Content>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      )}
    </Card>
  );
};

/**
 * Statistics card component for displaying key metrics
 */
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
}> = ({ title, value, icon: Icon, color, description }) => (
  <Card>
    <div className="flex items-center">
      <div className={`flex-shrink-0 rounded-full p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4 w-0 flex-1">
        <dl>
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </dt>
          <dd className="text-lg font-medium text-gray-900 dark:text-white">
            {value}
          </dd>
          {description && (
            <dd className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </dd>
          )}
        </dl>
      </div>
    </div>
  </Card>
);

/**
 * Main Chat Analytics Page Component
 */
const ChatAnalyticsPage: React.FC = () => {
  const { bots, loading: botsLoading } = useBotContext();
  const {
    analytics,
    loading: chatLoading,
    selectedBotId,
    setSelectedBotId,
    refreshData,
    searchTerm,
    setSearchTerm,
    filteredConversations,
  } = useChatContext();

  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [qaModalConversation, setQaModalConversation] = useState<{
    userEmail: string;
    messages: Array<{
      id: string;
      message_text: string;
      sender: string;
      created_at: string | null;
    }>;
    lastActivity: string;
    messageCount: number;
  } | null>(null);
  const [showAllQAModal, setShowAllQAModal] = useState(false);

  /**
   * Handle bot selection change
   */
  const handleBotChange = (botId: string) => {
    setSelectedBotId(botId);
    setExpandedConversation(null); // Reset expanded conversation
  };

  /**
   * Export conversations to CSV
   */
  const exportToCSV = () => {
    if (!filteredConversations.length) return;

    const csvHeaders = ["User Email", "Message", "Sender", "Timestamp"];
    const csvData = filteredConversations.flatMap(conv =>
      conv.messages.map(msg => [
        conv.userEmail,
        `"${msg.message_text.replace(/"/g, '""')}"`, // Escape quotes
        msg.sender,
        msg.created_at || "",
      ])
    );

    const csvContent = [
      csvHeaders.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-analytics-${selectedBotId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const selectedBot = bots.find(bot => bot.id === selectedBotId);

  return (
    <NavbarSidebarLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            Chat Analytics Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor bot performance and analyze user interactions
          </p>
        </div>

        {/* Bot Selection */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <Label htmlFor="bot-select" className="mb-2 block">
                  Select Bot to Analyze
                </Label>
                <Select
                  id="bot-select"
                  value={selectedBotId || ""}
                  onChange={(e) => handleBotChange(e.target.value)}
                  disabled={botsLoading}
                  className="w-64"
                >
                  <option value="">Choose a bot...</option>
                  {bots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name}
                    </option>
                  ))}
                </Select>
              </div>
              {selectedBot && (
                <div className="flex items-center space-x-2">
                  <Badge color="blue" size="lg">
                    {selectedBot.name}
                  </Badge>
                  <Tooltip content="Refresh data">
                    <Button
                      size="sm"
                      color="gray"
                      onClick={refreshData}
                      disabled={chatLoading}
                    >
                      <HiRefresh className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </Card>

        {selectedBotId && (
          <>
            {/* Analytics Overview */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Messages"
                value={analytics.totalMessages}
                icon={HiChatAlt2}
                color="bg-blue-500"
              />
              <StatCard
                title="Conversations"
                value={analytics.totalConversations}
                icon={HiUsers}
                color="bg-green-500"
              />
              <StatCard
                title="Unique Users"
                value={analytics.uniqueUsers}
                icon={HiUser}
                color="bg-purple-500"
              />
              <StatCard
                title="Avg. Messages/Conv."
                value={analytics.averageMessagesPerConversation}
                icon={HiChartBar}
                color="bg-orange-500"
              />
            </div>

            {/* Most Frequent Questions */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Most Frequent Questions
                  </h3>
                  <HiQuestionMarkCircle className="h-5 w-5 text-gray-400" />
                </div>
                {analytics.mostFrequentQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.mostFrequentQuestions.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {item.question}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Asked {item.count} times ({item.percentage}%)
                          </p>
                        </div>
                        <Badge color="blue">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No questions found yet.
                  </p>
                )}
              </Card>

              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recent Activity (7 days)
                  </h3>
                  <HiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-2">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                      <Badge color={activity.messageCount > 0 ? "green" : "gray"}>
                        {activity.messageCount} messages
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Conversations List */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  User Conversations
                </h3>
                <div className="flex items-center space-x-2">
                  <Tooltip content="View all Q&A pairs from all users">
                    <Button size="sm" color="blue" onClick={() => setShowAllQAModal(true)}>
                      <HiChat className="mr-2 h-4 w-4" />
                      View All Q&A
                    </Button>
                  </Tooltip>
                  <Button size="sm" color="gray" onClick={exportToCSV}>
                    <HiDownload className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <TextInput
                  icon={HiSearch}
                  placeholder="Search conversations by email or message content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {chatLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {filteredConversations.map((conversation) => (
                    <ConversationCard
                      key={conversation.userEmail}
                      conversation={conversation}
                      onExpand={() =>
                        setExpandedConversation(
                          expandedConversation === conversation.userEmail
                            ? null
                            : conversation.userEmail
                        )
                      }
                      isExpanded={expandedConversation === conversation.userEmail}
                      onViewQA={() => setQaModalConversation(conversation)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <HiChatAlt2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No conversations found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "This bot hasn't received any messages yet."}
                  </p>
                </div>
              )}
            </Card>
          </>
        )}

        {!selectedBotId && (
          <Card>
            <div className="py-8 text-center">
              <HiChartBar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Select a Bot to View Analytics
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose a bot from the dropdown above to start analyzing chat data.
              </p>
            </div>
          </Card>
        )}

        {/* Individual Q&A Modal */}
        {qaModalConversation && (
          <QAModal
            conversation={qaModalConversation}
            isOpen={!!qaModalConversation}
            onClose={() => setQaModalConversation(null)}
          />
        )}

        {/* All Q&A Modal */}
        <AllQAModal
          conversations={filteredConversations}
          isOpen={showAllQAModal}
          onClose={() => setShowAllQAModal(false)}
        />
      </div>
    </NavbarSidebarLayout>
  );
};

export default ChatAnalyticsPage; 