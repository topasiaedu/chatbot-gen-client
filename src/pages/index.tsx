/* eslint-disable jsx-a11y/anchor-is-valid */
import NavbarSidebarLayout from "../layouts/navbar-sidebar";
import React, { useEffect } from "react";
import { useBotContext } from "../context/BotContext";
import {
  Card,
  TextInput,
  Select,
  Label,
  Button,
  FileInput,
  Badge,
  Progress,
  Tabs,
  Tooltip,
} from "flowbite-react";
import { IoIosAdd, IoMdInformationCircleOutline } from "react-icons/io";
import { BotFile, useBotFileContext } from "../context/BotFileContext";
import { supabase } from "../utils/supabaseClient";
import { useAlertContext } from "../context/AlertContext";
import { useBotModelContext } from "../context/BotModelContext";
import { IoMdClose } from "react-icons/io";
import {
  FaCloudUploadAlt,
  FaRobot,
  FaCog,
  FaFileAlt,
  FaCode,
} from "react-icons/fa";

const DashboardPage: React.FC = () => {
  const { bots, selectedBot, setSelectedBot, createBot, updateBot } =
    useBotContext();
  const { botFiles, createBotFile, deleteBotFile } = useBotFileContext();
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [createBotBool, setCreateBotBool] = React.useState(false);
  const [files, setFiles] = React.useState<FileList | null>(null);
  const { showAlert } = useAlertContext();
  const [fullScreenPreview, setFullScreenPreview] = React.useState(false);
  const { botModels } = useBotModelContext();
  const [botData, setBotData] = React.useState({
    name: "",
    description: "",
    short_desc: "",
    img: "",
    training_depth: 1,
    training_breadth: 1000,
    status: "DRAFT",
    progress: 0,
  });

  useEffect(() => {
    if (selectedBot) {
      setBotData({
        name: selectedBot.name,
        description: selectedBot.description || "",
        short_desc: selectedBot.short_desc || "",
        img: selectedBot.img || "",
        training_depth: selectedBot.training_depth || 1,
        training_breadth: selectedBot.training_breadth || 1000,
        status: selectedBot.status || "DRAFT",
        progress: selectedBot.progress || 0,
      });
    } else {
      setBotData({
        name: "",
        description: "",
        short_desc: "",
        img: "",
        training_depth: 1,
        training_breadth: 1000,
        status: "DRAFT",
        progress: 0,
      });
    }
  }, [selectedBot]);

  useEffect(() => {}, [files]);

  const handleSaveBot = async () => {
    let newBotId = "";
    if (selectedBot) {
      await updateBot({
        ...botData,
        id: selectedBot.id,
      });
    } else {
      const newBot = await createBot(botData);
      newBotId = newBot.id;
    }

    // Handle profile image
    if (profileImage) {
      const extension = profileImage.name.split(".").pop();
      const randomId =
        Math.random().toString(36).substring(7) + "." + extension;

      // Upload into supabase first
      const { data, error } = await supabase.storage
        .from("bot_files")
        .upload(randomId, profileImage);

      if (error) {
        console.error("Error uploading file:", error);
        console.error("Data:", data);
        showAlert("Error uploading file", "error");
        return;
      }

      // Update bot with the image url
      await updateBot({
        ...botData,
        id: selectedBot ? selectedBot.id : newBotId,
        img:
          "https://ldemovdvrlzrneitmwez.supabase.co/storage/v1/object/public/bot_files/" +
          randomId,
      });
    }

    // Handle files
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const extension = files[i].name.split(".").pop();
        const randomId =
          Math.random().toString(36).substring(7) + "." + extension;

        // Upload into supabase first
        const { data, error } = await supabase.storage
          .from("bot_files")
          .upload(randomId, files[i]);

        if (error) {
          console.error("Error uploading file:", error);
          console.error("Data:", data);
          showAlert("Error uploading file", "error");
          return;
        }

        // Create bot file
        await createBotFile({
          bot_id: selectedBot ? selectedBot.id : newBotId,
          file_name: files[i].name,
          file_url:
            "https://ldemovdvrlzrneitmwez.supabase.co/storage/v1/object/public/bot_files/" +
            randomId,
        });
      }
    }

    showAlert("Bot saved successfully", "success");
  };

  const startTrainingBot = async () => {
    try {
      // Change the status to TRAINING
      setBotData({ ...botData, status: "TRAINING", progress: 0 });

      // Call API to server to start training the bot with the id
      const response = await fetch(`https://cbg.whatsgenie.com/train-bot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ botId: selectedBot?.id }),
      });

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error starting bot training:", error);
    }
  };

  const handleDeleteBotFile = async (botFile: BotFile) => {
    await deleteBotFile(botFile);
  };

  // Get the status color for badges
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "TRAINING":
        return "warning";
      case "READY":
        return "success";
      case "DRAFT":
      default:
        return "gray";
    }
  };

  // Custom Badge component for consistent styling
  const StyledBadge: React.FC<{
    color: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ color, children, className = "" }) => {
    const getBgColor = () => {
      switch (color) {
        case "success":
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        case "warning":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        case "gray":
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getBgColor()} ${className}`}>
        {children}
      </span>
    );
  };

  return (
    <NavbarSidebarLayout>
      <div className="grid grid-cols-12 gap-6">
        {/* Bot Sidebar */}
        {!fullScreenPreview && (
          <div className="col-span-12 lg:col-span-2 p-4">
            <div className="mb-4">
              <h2 className="text-lg font-medium mb-3">My Chatbots</h2>
              {bots.map((bot) => (
                <Card
                  key={bot.id}
                  className={`cursor-pointer mb-3 transition-all duration-200 hover:shadow-md ${
                    selectedBot?.id === bot.id
                      ? "border-blue-500 border-l-4"
                      : ""
                  }`}
                  onClick={() => setSelectedBot(bot)}>
                  <div className="flex p-3 flex-col">
                    <div className="font-medium">{bot.name}</div>
                    {bot.status && (
                      <div className="mt-2">
                        <StyledBadge color={getStatusColor(bot.status)}>
                          {bot.status}
                        </StyledBadge>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Create a new bot Card */}
            <Card
              className="cursor-pointer mb-4 hover:bg-blue-50 dark:hover:bg-gray-700 transition duration-200 border-dashed border-2"
              onClick={() => {
                setSelectedBot(null);
                setCreateBotBool(true);
              }}>
              <div className="flex items-center p-4 justify-center">
                <IoIosAdd className="w-6 h-6 mr-2 text-blue-500" />
                <div>Create a new bot</div>
              </div>
            </Card>
          </div>
        )}

        {/* Bot Editor */}
        {(selectedBot || createBotBool) && !fullScreenPreview && (
          <div className="col-span-12 lg:col-span-6 p-4">
            <Card className="mb-4 h-[calc(100vh-8rem)] w-full overflow-y-auto hide-scrollbar shadow-sm">
              <div className="p-5">
                {/* Header with Status */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">
                      {selectedBot ? "Edit Bot" : "Create New Bot"}
                    </h2>
                    {botData?.status && (
                      <StyledBadge
                        color={getStatusColor(botData.status)}
                        className="ml-2">
                        {botData.status}
                      </StyledBadge>
                    )}
                  </div>

                  {selectedBot?.active_version && (
                    <StyledBadge color="success" className="ml-2">
                      Version:{" "}
                      {botModels.find(
                        (model) => model.id === selectedBot?.active_version
                      )?.version || "Unknown"}
                    </StyledBadge>
                  )}
                </div>

                {/* Progress Bar (Training) */}
                {botData?.status === "TRAINING" && (
                  <div className="w-full mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm font-medium mb-2">
                      Training Progress
                    </div>
                    <Progress
                      color="blue"
                      labelProgress
                      progressLabelPosition="inside"
                      progress={botData?.progress || 0}
                      size="lg"
                    />
                  </div>
                )}

                {/* Fixed height container to prevent jumping */}
                <div className="min-h-[480px]">
                  {/* Tab Navigation */}
                  <Tabs aria-label="Bot configuration tabs" style="underline">
                    {/* Basic Information Tab */}
                    <Tabs.Item active title="Basic Information" icon={FaRobot}>
                      <div className="space-y-5 mt-4">
                        {/* Info panel - consistent across tabs */}
                        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg mb-5">
                          <p className="text-sm">
                            Configure the basic details and appearance of your
                            chatbot.
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="botName" className="mb-2 block">
                            Bot Name
                          </Label>
                          <TextInput
                            id="botName"
                            name="botName"
                            placeholder="My Awesome Chat Bot"
                            value={botData.name}
                            onChange={(e) =>
                              setBotData({ ...botData, name: e.target.value })
                            }
                            className="w-full"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="botShortDescription"
                            className="mb-2 block">
                            Short Description
                          </Label>
                          <TextInput
                            id="botShortDescription"
                            name="botShortDescription"
                            placeholder="A brief description of your bot"
                            value={botData.short_desc}
                            onChange={(e) =>
                              setBotData({
                                ...botData,
                                short_desc: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This appears in the bot listings
                          </p>
                        </div>

                        <div>
                          <Label
                            htmlFor="botDescription"
                            className="mb-2 block">
                            Bot Instructions
                          </Label>
                          <TextInput
                            id="botDescription"
                            name="botDescription"
                            placeholder="Instructions for how the bot should behave"
                            value={botData.description}
                            onChange={(e) =>
                              setBotData({
                                ...botData,
                                description: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            These instructions guide how your bot will respond
                          </p>
                        </div>

                        <div className="pb-2">
                          <Label htmlFor="botImage" className="mb-2 block">
                            Bot Avatar
                          </Label>
                          <div className="flex items-center gap-4">
                            {botData.img && (
                              <div className="w-16 h-16 rounded-full overflow-hidden border">
                                <img
                                  src={botData.img}
                                  alt="Bot avatar"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <FileInput
                              id="botImage"
                              name="botImage"
                              helperText="Upload a square image for best results"
                              onChange={(e) => {
                                if (e.target.files)
                                  setProfileImage(e.target.files[0]);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </Tabs.Item>

                    {/* Training Configuration Tab */}
                    <Tabs.Item title="Training Settings" icon={FaCog}>
                      <div className="space-y-5 mt-4">
                        {/* Info panel - consistent across tabs */}
                        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg mb-5">
                          <p className="text-sm">
                            Configure how your bot processes and learns from
                            your training data. These settings affect
                            performance, cost, and accuracy.
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                          <div>
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor="trainingDepth"
                                className="mb-2 block">
                                Training Depth
                              </Label>
                              <Tooltip content="Higher depth = more thorough training but higher cost">
                                <IoMdInformationCircleOutline className="text-gray-500" />
                              </Tooltip>
                            </div>
                            <Select
                              id="trainingDepth"
                              name="trainingDepth"
                              value={botData.training_depth}
                              onChange={(e) =>
                                setBotData({
                                  ...botData,
                                  training_depth: parseInt(e.target.value),
                                })
                              }
                              className="w-full">
                              {Array.from({ length: 30 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              Higher values increase training thoroughness but
                              cost more
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor="trainingBreadth"
                                className="mb-2 block">
                                Training Breadth
                              </Label>
                              <Tooltip content="Higher breadth = less expensive but potentially less accurate">
                                <IoMdInformationCircleOutline className="text-gray-500" />
                              </Tooltip>
                            </div>
                            <Select
                              id="trainingBreadth"
                              name="trainingBreadth"
                              value={botData.training_breadth}
                              onChange={(e) =>
                                setBotData({
                                  ...botData,
                                  training_breadth: parseInt(e.target.value),
                                })
                              }
                              className="w-full">
                              {[100, 200, 500, 1000, 2000, 5000].map(
                                (value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                )
                              )}
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              Recommended: 1000 (good balance of cost vs.
                              accuracy)
                            </p>
                          </div>
                        </div>
                      </div>
                    </Tabs.Item>

                    {/* Training Data Tab */}
                    <Tabs.Item title="Training Data" icon={FaFileAlt}>
                      <div className="mt-4">
                        {/* Info panel - consistent across tabs */}
                        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg mb-5">
                          <p className="text-sm">
                            Upload documents, text files, and other content to
                            train your bot. More diverse, high-quality data
                            leads to better bot responses.
                          </p>
                        </div>

                        {/* File Upload Area */}
                        <div className="mb-5">
                          <div className="border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700">
                            <FaCloudUploadAlt className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="mb-2 text-sm text-gray-500">
                              Upload training files
                            </p>
                            <FileInput
                              id="botFiles"
                              name="botFiles"
                              multiple
                              helperText="PDF, TXT, DOCX, CSV files accepted"
                              onChange={(e) => {
                                setFiles(e.target.files);
                              }}
                            />
                          </div>
                        </div>

                        {/* Files Preview */}
                        <div className="mb-5">
                          <h3 className="text-md font-medium mb-3">
                            New Files to Upload
                          </h3>
                          {files && Array.from(files).length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {Array.from(files)
                                .filter(
                                  (file) =>
                                    !botFiles.some(
                                      (botFile) =>
                                        botFile.file_name === file.name
                                    )
                                )
                                .map((file) => (
                                  <div
                                    key={file.name}
                                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border">
                                    <div className="font-medium text-sm truncate w-full overflow-hidden whitespace-nowrap">
                                      {file.name}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              No new files selected
                            </p>
                          )}
                        </div>

                        {/* Existing Files */}
                        {selectedBot && (
                          <div>
                            <h3 className="text-md font-medium mb-3">
                              Existing Training Files
                            </h3>
                            {botFiles.filter(
                              (file) => file.bot_id === selectedBot?.id
                            ).length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {botFiles
                                  .filter(
                                    (file) => file.bot_id === selectedBot?.id
                                  )
                                  .map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border">
                                      <div className="font-medium text-sm truncate w-full overflow-hidden whitespace-nowrap">
                                        {file.file_name}
                                      </div>
                                      <button
                                        className="ml-2 text-red-500 hover:text-red-700"
                                        onClick={() =>
                                          handleDeleteBotFile(file)
                                        }>
                                        <IoMdClose />
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">
                                No training files uploaded yet
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </Tabs.Item>

                    {/* Embed Code Tab */}
                    {selectedBot && (
                      <Tabs.Item title="Embed Code" icon={FaCode}>
                        <div className="mt-4">
                          {/* Info panel - consistent across tabs */}
                          <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg mb-5">
                            <p className="text-sm">
                              Embed your chatbot on any website by copying and
                              pasting the code below.
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-5">
                            <h3 className="text-md font-medium mb-3">
                              Embed Code
                            </h3>
                            <div className="relative">
                              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-xs whitespace-pre-wrap">
                                {`<iframe 
  src="https://chatbot-gen-client.vercel.app/chat-widget/${selectedBot?.id}" 
  width="100%" 
  style="height: 500px; border: none;" 
  title="Chat Widget" 
  frameBorder="0">
</iframe>`}
                              </pre>
                              <Button
                                size="xs"
                                className="absolute top-2 right-2"
                                color="gray"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `<iframe src="https://chatbot-gen-client.vercel.app/chat-widget/${selectedBot?.id}" width="100%" style="height: 500px; border: none;" title="Chat" frameBorder="0"></iframe>`
                                  );
                                  showAlert(
                                    "Embed code copied to clipboard",
                                    "success"
                                  );
                                }}>
                                Copy
                              </Button>
                            </div>
                          </div>

                          {/* <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h3 className="text-md font-medium mb-3">
                              Preview
                            </h3>
                            <div
                              className="border rounded-md overflow-hidden"
                              style={{ height: "200px" }}>
                              <iframe
                                src={`https://chatbot-gen-client.vercel.app/chat-widget/${selectedBot.id}`}
                                width="100%"
                                style={{ height: "100%", border: "none" }}
                                title="Chat Widget Embed Preview"
                                frameBorder="0"
                              />
                            </div>
                          </div> */}
                        </div>
                      </Tabs.Item>
                    )}
                  </Tabs>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-8 border-t pt-5">
                  <Button size="md" color="blue" onClick={handleSaveBot}>
                    {selectedBot ? "Update Bot" : "Create Bot"}
                  </Button>

                  {selectedBot && (
                    <>
                      <Button
                        size="md"
                        color="purple"
                        onClick={startTrainingBot}
                        disabled={botData?.status === "TRAINING"}>
                        {botData?.status === "TRAINING"
                          ? "Training..."
                          : "Start Training"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Preview Panel */}
        {(selectedBot || createBotBool) && selectedBot?.active_version && (
          <div
            className={`h-[calc(100vh-8rem)] w-full flex flex-col justify-center items-center p-4 ${
              !fullScreenPreview ? "col-span-12 lg:col-span-4" : "col-span-12"
            }`}>
            <div className="flex items-center justify-between w-full mb-4">
              <h2 className="text-lg font-medium">Chat Widget Preview</h2>
              <Button
                size="sm"
                color="gray"
                onClick={() => setFullScreenPreview(!fullScreenPreview)}>
                {fullScreenPreview ? "Exit Full Screen" : "Full Screen Preview"}
              </Button>
            </div>
            <div className="w-full h-full border rounded-lg shadow-sm overflow-hidden">
              <iframe
                src={`https://chatbot-gen-client.vercel.app/chat-widget/${selectedBot.id}`}
                width="100%"
                style={{ height: `100%`, border: "none" }}
                title="Chat Widget Preview"
                frameBorder="0"
              />
            </div>
          </div>
        )}
      </div>
    </NavbarSidebarLayout>
  );
};

export default DashboardPage;
