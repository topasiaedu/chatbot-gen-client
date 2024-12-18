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
} from "flowbite-react";
import { IoIosAdd } from "react-icons/io";
import { BotFile, useBotFileContext } from "../context/BotFileContext";
import { supabase } from "../utils/supabaseClient";
import { useAlertContext } from "../context/AlertContext";
import { useBotModelContext } from "../context/BotModelContext";
import { IoMdClose } from "react-icons/io";

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
          "Content-Type": "application/json", // Set the correct header for JSON data
        },
        body: JSON.stringify({ modelId: selectedBot?.id }), // Convert the body to a JSON string
      });

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json(); // Assuming the response is in JSON format
      console.log(data);
    } catch (error) {
      console.error("Error starting bot training:", error);
    }
  };

  const handleDeleteBotFile = async (botFile: BotFile) => {
    await deleteBotFile(botFile);
  };

  return (
    <NavbarSidebarLayout>
      {/* 3 Column - Bot Sidebar - Bot Info - Preview */}
      {/* Bot Info and preview will only come out when there is a bot selected */}
      <div className="grid grid-cols-12 gap-6">
        {!fullScreenPreview && (
          <div className="col-span-12 lg:col-span-2 p-4 ">
            {bots.map((bot) => (
              <Card
                key={bot.id}
                className={`cursor-pointer mb-4 ${
                  selectedBot?.id === bot.id ? "bg-theme-1" : ""
                }`}
                onClick={() => setSelectedBot(bot)}>
                <div className="flex p-4 flex-col">
                  <div className="font-medium">{bot.name}</div>
                  {/* <div className="text-gray-600 text-xs">{bot.description}</div> */}
                </div>
              </Card>
            ))}

            {/* Create a new bot Card */}
            <Card
              className="cursor-pointer mb-4 hover:bg-theme-1 transition duration-200"
              onClick={() => {
                setSelectedBot(null);
                setCreateBotBool(true);
              }}>
              <div className="flex items-center p-4">
                <IoIosAdd className="w-6 h-6 mr-2" />
                <div>Create a new bot</div>
              </div>
            </Card>
          </div>
        )}
        {/* Bot Info */}
        {(selectedBot || createBotBool) && !fullScreenPreview && (
          <div className="col-span-12 lg:col-span-6 p-4 ">
            <Card className="cursor-pointer mb-4 h-[calc(100vh-8rem)] w-full overflow-y-auto hide-scrollbar">
              <div className="flex p-4 gap-4 flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="intro-y text-lg font-medium">
                      Bot Information
                    </h2>
                    <Badge
                      color={botData?.status === "TRAINING" ? "yellow" : "gray"}
                      className="ml-2">
                      {botData?.status}
                    </Badge>

                    {/* Show progress bar if bot is training */}
                    {botData?.status === "TRAINING" && (
                      <div className="w-full ml-4">
                        <Progress
                          color="blue"
                          labelProgress
                          progress={botData?.progress || 0} // Ensure the progress is between 0 and 100
                        />
                      </div>
                    )}
                  </div>
                  <Badge
                    color={selectedBot?.active_version ? "green" : "red"}
                    className="ml-2">
                    {selectedBot?.active_version
                      ? botModels.find(
                          (model) => model.id === selectedBot?.active_version
                        )?.version
                      : "No Active Version"}
                  </Badge>
                </div>
                <Tabs aria-label="Default tabs">
                  <Tabs.Item active title="Bot Information">
                    <div>
                      <Label htmlFor="botName">Bot Name</Label>
                      <TextInput
                        id="botName"
                        name="botName"
                        placeholder="My Awesome Chat Bot"
                        value={botData.name}
                        onChange={(e) =>
                          setBotData({ ...botData, name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="botShortDescription">
                        Bot Description
                      </Label>
                      <TextInput
                        id="botShortDescription"
                        name="botShortDescription"
                        placeholder="A brief description of the bot"
                        value={botData.short_desc}
                        onChange={(e) =>
                          setBotData({
                            ...botData,
                            short_desc: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="botDescription">Bot Instruction</Label>
                      <TextInput
                        id="botDescription"
                        name="botDescription"
                        placeholder="A brief description of the bot"
                        value={botData.description}
                        onChange={(e) =>
                          setBotData({
                            ...botData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="botImage">Bot Image</Label>
                      <FileInput
                        id="botImage"
                        name="botImage"
                        onChange={(e) => {
                          if (e.target.files)
                            setProfileImage(e.target.files[0]);
                        }}
                      />
                    </div>
                  </Tabs.Item>
                  <Tabs.Item active title="Bot Information">

                    <div>
                      <Label htmlFor="trainingDepth">Training Depth</Label>
                      <Select
                        id="trainingDepth"
                        name="trainingDepth"
                        value={botData.training_depth}
                        onChange={(e) =>
                          setBotData({
                            ...botData,
                            training_depth: parseInt(e.target.value),
                          })
                        }>
                        {/* 1-30 */}
                        {Array.from({ length: 30 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </Select>
                      {/* Small note saying that the higher the training depth the more expensive it is to train the bot or generate the dataset */}
                      <p className="text-xs text-gray-500">
                        The higher the training depth the more expensive it is
                        to train the bot or generate the dataset (default is 1)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="trainingBreadth">Training Breadth</Label>
                      <Select
                        id="trainingBreadth"
                        name="trainingBreadth"
                        value={botData.training_breadth}
                        onChange={(e) =>
                          setBotData({
                            ...botData,
                            training_breadth: parseInt(e.target.value),
                          })
                        }>
                        {/* 100, 200, 500, 1000, 2000, 5000 */}
                        {[100, 200, 500, 1000, 2000, 5000].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </Select>

                      {/* Small note saying that the higher the training breadth the less expensive it is to train the bot or generate the dataset, recommended 1000, but it will be less accurate the higher it is */}
                      <p className="text-xs text-gray-500">
                        The higher the training breadth the less expensive it is
                        to train the bot or generate the dataset, recommended
                        1000, but it will be less accurate the higher it is
                      </p>
                    </div>
                  </Tabs.Item>
                  <Tabs.Item active title="Bot Information">

                    {/* Training Data */}
                    <div className="flex justify-between items-center">
                      <h2 className="intro-y text-lg font-medium">
                        Training Data
                      </h2>
                      <FileInput
                        id="botFiles"
                        name="botFiles"
                        multiple
                        onChange={(e) => {
                          setFiles(e.target.files);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {files &&
                        Array.from(files)
                          .filter(
                            // Check if there is duplicate name with botFiles
                            (file) =>
                              !botFiles.some(
                                (botFile) => botFile.file_name === file.name
                              )
                          )
                          .map((file) => (
                            <div
                              key={file.name}
                              className="flex items-center p-4 bg-gray-100 dark:bg-gray-600 rounded-md">
                              <div
                                className="font-medium text-ellipsis text-sm
                          ">
                                {file.name}
                              </div>
                            </div>
                          ))}
                      {botFiles
                        .filter((file) => file.bot_id === selectedBot?.id)
                        .map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center p-4 bg-gray-100 dark:bg-gray-600 rounded-md">
                            <div className="font-medium text-sm truncate w-full overflow-hidden whitespace-nowrap">
                              {file.file_name}
                            </div>
                            <IoMdClose
                              className="cursor-pointer text-red-500"
                              onClick={() => handleDeleteBotFile(file)}
                            />
                          </div>
                        ))}
                    </div>
                  </Tabs.Item>
                </Tabs>
                {/* Save Button */}
                <div className="flex">
                  <Button size="sm" color="primary" onClick={handleSaveBot}>
                    Save Bot
                  </Button>

                  {/* Start Training */}
                  <Button
                    size="sm"
                    color="purple"
                    className="ml-2"
                    onClick={startTrainingBot}
                    disabled={botData?.status === "TRAINING"}>
                    Start Training
                  </Button>
                  {/* Copy Embed Code Button */}
                  {/* Copy the html to clipboard */}
                  <Button
                    size="sm"
                    color="secondary"
                    className="ml-2"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `<iframe src="https://chatbot-gen-client.vercel.app/chat-widget/${selectedBot?.id}" width="100%" style="height: 500px; border: none;" title="Chat" frameBorder="0"></iframe>`
                      );
                      showAlert("Embed code copied to clipboard", "success");
                    }}>
                    Copy Embed Code
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        {/* Preview */}
        {(selectedBot || createBotBool) && selectedBot?.active_version && (
          <div
            className={`h-[calc(100vh-8rem)] w-full flex flex-col justify-center items-center p-4 ${
              !fullScreenPreview ? "col-span-12 lg:col-span-4" : "col-span-12"
            }`}>
            <div className="flex items-center justify-between w-full">
              <h2 className="intro-y text-lg font-medium">
                Chat Widget Preview
              </h2>
              <Button
                size="sm"
                color="primary"
                className="ml-2"
                onClick={() => setFullScreenPreview(!fullScreenPreview)}>
                {fullScreenPreview ? "Exit Full Screen" : "Full Screen Preview"}
              </Button>
            </div>
            <iframe
              src={`https://chatbot-gen-client.vercel.app/chat-widget/${selectedBot.id}`}
              // src={`http://localhost:3000/chat-widget/${selectedBot.id}`}
              width="100%"
              style={{ height: `calc(100vh - 8rem)`, border: "none" }}
              title="Chat"
              frameBorder="0"
            />
          </div>
        )}
      </div>
    </NavbarSidebarLayout>
  );
};

export default DashboardPage;
