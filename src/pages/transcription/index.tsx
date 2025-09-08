import React, { useState, useCallback, useMemo } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import {
  Card,
  Button,
  FileInput,
  TextInput,
  Label,
  Badge,
  Modal,
  Table,
  Tabs,
  Tooltip,
  Spinner,
  Select,
} from "flowbite-react";
import {
  HiFolder,
  HiUpload,
  HiPlay,
  HiX,
  HiPlus,
  HiTrash,
  HiEye,
  HiDownload,
  HiRefresh,
  HiChat,
} from "react-icons/hi";
import { FaVideo, FaFileAlt } from "react-icons/fa";
import { AiTwotoneAudio } from "react-icons/ai";
import { useAlertContext } from "../../context/AlertContext";
import { supabase } from "../../utils/supabaseClient";
import {
  useTranscriptionFolderContext,
  TranscriptionFolder,
} from "../../context/TranscriptionFolderContext";
import {
  useTranscriptionTaskContext,
  TranscriptionTask,
} from "../../context/TranscriptionTaskContext";
import { useTranscriptionFileContext } from "../../context/TranscriptionFileContext";
import { useTranscriptionConversationContext } from "../../context/TranscriptionConversationContext";
import { useNavigate } from "react-router-dom";
import {
  chunkFile,
  needsChunking,
  formatFileSize,
  isValidMediaFile,
  calculateChunkProgress,
} from "../../utils/fileChunking";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguageDisplayName,
  formatLanguageDisplay,
} from "../../utils/languageUtils";

/**
 * Status color mapping for transcription tasks
 * Uses the new `status` field for proper status tracking
 * Server workflow: PENDING → PROCESSING → COMPLETED/FAILED
 */
const getTaskStatusColor = (task: TranscriptionTask): string => {
  switch (task.status?.toUpperCase()) {
    case "COMPLETED":
      return "success";
    case "PROCESSING":
      return "warning";
    case "FAILED":
    case "ERROR":
      return "red";
    case "PENDING":
    default:
      return "gray";
  }
};

/**
 * Status text for transcription tasks
 * Uses the new `status` field for proper status tracking
 */
const getTaskStatusText = (task: TranscriptionTask): string => {
  switch (task.status?.toUpperCase()) {
    case "COMPLETED":
      return "Completed";
    case "PROCESSING":
      return "Processing";
    case "FAILED":
    case "ERROR":
      return "Failed";
    case "PENDING":
    default:
      return "Pending";
  }
};

/**
 * Get file type icon based on media URL extension
 */
const getFileTypeIcon = (mediaUrl: string | null): React.ReactNode => {
  if (!mediaUrl) return <FaFileAlt className="w-4 h-4" />;
  
  const extension = mediaUrl.split(".").pop()?.toLowerCase() || "";
  
  if (["mp4", "avi", "mov", "mkv", "webm"].includes(extension)) {
    return <FaVideo className="w-4 h-4 text-blue-500" />;
  }
  if (["mp3", "wav", "m4a", "flac", "ogg"].includes(extension)) {
    return <AiTwotoneAudio className="w-4 h-4 text-green-500" />;
  }
  
  return <FaFileAlt className="w-4 h-4 text-gray-500" />;
};

const TranscriptionPage: React.FC = () => {
  const { showAlert } = useAlertContext();
  const navigate = useNavigate();
  
  // Context hooks
  const {
    folders,
    selectedFolder,
    setSelectedFolder,
    createFolder,
    deleteFolder,
    loading: foldersLoading,
    refresh: refreshFolders,
  } = useTranscriptionFolderContext();
  
  const {
    tasks,
    createTask,
    deleteTask,
    loading: tasksLoading,
    refresh: refreshTasks,
  } = useTranscriptionTaskContext();
  
  const {
    createFiles,
    getFilesByTaskId,
  } = useTranscriptionFileContext();
  
  useTranscriptionConversationContext();

  // Local state
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [fileLanguages, setFileLanguages] = useState<Record<string, string>>({});

  // Filter tasks by selected folder
  const filteredTasks = useMemo(() => {
    if (!selectedFolder) return tasks;
    return tasks.filter((task) => task.folder_id === selectedFolder.id);
  }, [tasks, selectedFolder]);

  /**
   * Handle file selection for upload
   */
  const handleFileSelection = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    const initialLanguages: Record<string, string> = {};
    
    Array.from(files).forEach((file) => {
      // Check if it's a video or audio file
      if (!isValidMediaFile(file)) {
        showAlert(`File "${file.name}" is not a supported media file.`, "warning");
        return;
      }
      
      // Log file size information
      console.log(`📄 File: ${file.name}`);
      console.log(`📊 Size: ${formatFileSize(file.size)}`);
      console.log(`🔧 Needs chunking: ${needsChunking(file) ? "Yes" : "No"}`);
      
      validFiles.push(file);
      // Initialize with default language (auto-detect)
      initialLanguages[file.name] = DEFAULT_LANGUAGE.code;
    });
    
    setUploadingFiles(validFiles);
    setFileLanguages(initialLanguages);
    // Reset upload progress for new files
    setUploadProgress({});
  }, [showAlert]);

  /**
   * Upload files to Supabase Storage with chunking and create transcription tasks
   */
  const handleUploadFiles = useCallback(async () => {
    console.log("🚀 Starting chunked upload process...");
    console.log("📁 Selected folder:", selectedFolder);
    console.log("📄 Files to upload:", uploadingFiles.map(f => ({ 
      name: f.name, 
      size: formatFileSize(f.size), 
      type: f.type,
      needsChunking: needsChunking(f)
    })));
    
    if (uploadingFiles.length === 0) {
      console.warn("❌ No files selected for upload");
      showAlert("Please select files to upload", "warning");
      return;
    }

    setIsUploading(true);
    console.log("⏳ Setting upload state to true");
    
    try {
      for (let fileIndex = 0; fileIndex < uploadingFiles.length; fileIndex++) {
        const file = uploadingFiles[fileIndex];
        console.log(`\n📤 Processing file ${fileIndex + 1}/${uploadingFiles.length}: ${file.name}`);
        console.log(`📊 File size: ${formatFileSize(file.size)}`);
        
        // Initialize progress for this file
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Chunk the file
        console.log("✂️ Chunking file...");
        const chunkedFile = await chunkFile(file);
        console.log(`📦 File chunked into ${chunkedFile.chunks.length} pieces`);
        
        if (chunkedFile.wasChunked) {
          console.log("🔄 Large file detected - using chunking strategy");
        } else {
          console.log("📄 Small file - uploading as single chunk");
        }
        
        // Create transcription task first
        console.log("💾 Creating transcription task in database...");
        const fileLanguage = fileLanguages[file.name] || DEFAULT_LANGUAGE.code;
        const taskData = {
          folder_id: selectedFolder?.id || null,
          result_url: null,
          status: "PENDING",
          openai_task_id: null,
          file_name: file.name,
          language: fileLanguage,
        };
        console.log("📋 Task data:", taskData);
        
        const taskResult = await createTask(taskData);
        if (!taskResult) {
          console.error("❌ Failed to create task for file:", file.name);
          showAlert(`Failed to create task for "${file.name}"`, "error");
          continue;
        }
        console.log("✅ Task created:", taskResult.id);
        
        // Upload chunks and create transcription_files records
        const transcriptionFiles = [];
        let completedChunks = 0;
        
        for (let chunkIndex = 0; chunkIndex < chunkedFile.chunks.length; chunkIndex++) {
          const chunk = chunkedFile.chunks[chunkIndex];
          console.log(`\n📤 Uploading chunk ${chunkIndex + 1}/${chunkedFile.chunks.length} for ${file.name}`);
          console.log(`📊 Chunk size: ${formatFileSize(chunk.size)}`);
          
          // Upload chunk to Supabase Storage
          console.log("☁️ Starting Supabase storage upload...");
          const uploadStartTime = Date.now();
          
          const { error: uploadError } = await supabase.storage
            .from("transcription")
            .upload(`medias/${chunk.chunkFileName}`, chunk.blob);

          const uploadDuration = Date.now() - uploadStartTime;
          console.log(`⏱️ Chunk upload completed in ${uploadDuration}ms`);

          if (uploadError) {
            console.error("❌ Chunk upload error:", uploadError);
            showAlert(`Failed to upload chunk ${chunkIndex + 1} of "${file.name}": ${uploadError.message}`, "error");
            break; // Stop processing this file
          }

          console.log("✅ Chunk uploaded successfully to storage");

          // Get public URL for chunk
          const { data: urlData } = supabase.storage
            .from("transcription")
            .getPublicUrl(`medias/${chunk.chunkFileName}`);

          console.log("📎 Chunk public URL generated:", urlData.publicUrl);
          
          // Prepare transcription file record with explicit chunk ordering metadata
          // Note: Backend can use chunk_index and total_chunks for robust reassembly
          transcriptionFiles.push({
            transcription_task_id: taskResult.id,
            media_url: urlData.publicUrl,
            chunk_index: chunk.index,
            total_chunks: chunk.totalChunks,
          });
          
          // Update progress
          completedChunks++;
          const progress = calculateChunkProgress(completedChunks, chunkedFile.chunks.length);
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          
          console.log(`📈 Progress: ${progress}% (${completedChunks}/${chunkedFile.chunks.length} chunks)`);
        }
        
        // Create all transcription_files records for this task
        if (transcriptionFiles.length > 0) {
          console.log(`💾 Creating ${transcriptionFiles.length} transcription_files records...`);
          const createdFiles = await createFiles(transcriptionFiles);
          console.log(`✅ Created ${createdFiles.length} transcription_files records`);
          
          showAlert(`Successfully uploaded "${file.name}" in ${chunkedFile.chunks.length} chunk(s)`, "success");
          console.log(`🎉 File ${file.name} processed successfully!`);
        } else {
          console.error("❌ No chunks were uploaded successfully for:", file.name);
          showAlert(`Failed to upload "${file.name}"`, "error");
        }
      }
      
      console.log("🧹 Clearing uploaded files from state");
      setUploadingFiles([]);
      setUploadProgress({});
      setFileLanguages({});
      console.log("✨ Chunked upload process completed successfully!");
      
    } catch (error) {
      console.error("💥 Upload process error:", error);
      console.error("📋 Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
      showAlert("An error occurred during upload", "error");
    } finally {
      console.log("🏁 Setting upload state to false");
      setIsUploading(false);
      setUploadProgress({});
    }
  }, [uploadingFiles, selectedFolder, fileLanguages, createTask, createFiles, showAlert]);

  /**
   * Create a new folder
   */
  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (name.length === 0) {
      showAlert("Folder name is required", "warning");
      return;
    }

    const folder = await createFolder({ name });
    if (folder) {
      setNewFolderName("");
      setShowNewFolderModal(false);
      setSelectedFolder(folder);
    }
  }, [newFolderName, createFolder, showAlert, setSelectedFolder]);

  /**
   * Delete a folder (with confirmation)
   */
  const handleDeleteFolder = useCallback(async (folder: TranscriptionFolder) => {
    const hasTasksInFolder = tasks.some((task) => task.folder_id === folder.id);
    
    if (hasTasksInFolder) {
      showAlert(
        "Cannot delete folder that contains transcription tasks. Move or delete tasks first.",
        "warning"
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      await deleteFolder(folder);
      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(null);
      }
    }
  }, [tasks, deleteFolder, selectedFolder, setSelectedFolder, showAlert]);

  /**
   * Delete a transcription task
   */
  const handleDeleteTask = useCallback(async (task: TranscriptionTask) => {
    if (window.confirm("Are you sure you want to delete this transcription task?")) {
      await deleteTask(task);
    }
  }, [deleteTask]);

  /**
   * Download transcription result
   */
  const handleDownloadResult = useCallback((task: TranscriptionTask) => {
    if (!task.result_url) {
      showAlert("No transcription result available", "warning");
      return;
    }
    
    window.open(task.result_url, "_blank");
  }, [showAlert]);

  return (
    <NavbarSidebarLayout>
      <div className="p-4 grid grid-cols-12 gap-6">
        
        {/* Folders Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <Card className="h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <HiFolder className="w-5 h-5 mr-2" />
                  Folders
                </h2>
                <Button
                  size="xs"
                  color="blue"
                  onClick={() => setShowNewFolderModal(true)}
                >
                  <HiPlus className="w-4 h-4" />
                </Button>
              </div>

              {foldersLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="md" />
                </div>
              ) : (
                <>
                  {/* All Files option */}
                  <div
                    className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                      !selectedFolder
                        ? "bg-blue-50 border border-blue-200 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedFolder(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <HiFolder className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-medium">All Files</span>
                      </div>
                      <Badge color="gray" size="sm">
                        {tasks.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Folder list */}
                  {folders.map((folder) => {
                    const taskCount = tasks.filter((task) => task.folder_id === folder.id).length;
                    
                    return (
                      <div
                        key={folder.id}
                        className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                          selectedFolder?.id === folder.id
                            ? "bg-blue-50 border border-blue-200 dark:bg-blue-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => setSelectedFolder(folder)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <HiFolder className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="text-sm font-medium truncate">
                              {folder.name}
                            </span>
                          </div>
                          <div className="flex items-center ml-2">
                            <Badge color="gray" size="sm" className="mr-2">
                              {taskCount}
                            </Badge>
                            <Button
                              size="xs"
                              color="gray"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder);
                              }}
                            >
                              <HiTrash className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-9">
          <Card className="h-[calc(100vh-8rem)]">
            <div className="p-4 h-full flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Transcription</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload video/audio files and manage transcription tasks
                    {selectedFolder && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        • {selectedFolder.name}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="blue"
                    onClick={() => navigate("/transcription-chat")}
                  >
                    <HiChat className="w-4 h-4 mr-1" />
                    Chat with Transcriptions
                  </Button>
                  <Button
                    size="sm"
                    color="gray"
                    onClick={() => {
                      refreshFolders();
                      refreshTasks();
                    }}
                  >
                    <HiRefresh className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>

                             {/* Tabs */}
               <Tabs
                 aria-label="Transcription tabs"
               >
                
                {/* Upload Tab */}
                <Tabs.Item active title="Upload Files" icon={HiUpload}>
                  <div className="space-y-6 mt-4">
                    
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
                      <div className="text-center">
                        <HiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Upload Media Files</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Select video or audio files to transcribe. Files larger than 45MB will be automatically chunked.
                        </p>
                        
                        <FileInput
                          multiple
                          accept="video/*,audio/*"
                          onChange={(e) => handleFileSelection(e.target.files)}
                          helperText="Supported formats: MP4, AVI, MOV, MP3, WAV, M4A. Large files (>45MB) will be split into chunks automatically."
                        />
                        
                        {selectedFolder && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                            Files will be uploaded to: {selectedFolder.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Selected Files Preview */}
                    {uploadingFiles.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium mb-3">Selected Files</h4>
                        <div className="space-y-2 mb-4">
                          {uploadingFiles.map((file, index) => {
                            const willBeChunked = needsChunking(file);
                            const progress = uploadProgress[file.name] || 0;
                            const isCurrentlyUploading = isUploading && progress > 0;
                            
                            return (
                              <div
                                key={index}
                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center flex-1">
                                    {getFileTypeIcon(file.name)}
                                    <div className="ml-3 flex-1">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <Button
                                          size="xs"
                                          color="gray"
                                          onClick={() => {
                                            const fileToRemove = uploadingFiles[index];
                                            setUploadingFiles((prev) =>
                                              prev.filter((_, i) => i !== index)
                                            );
                                            // Remove language setting for this file
                                            setFileLanguages((prev) => {
                                              const updated = { ...prev };
                                              delete updated[fileToRemove.name];
                                              return updated;
                                            });
                                          }}
                                          disabled={isUploading}
                                        >
                                          <HiX className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-gray-500">
                                          {formatFileSize(file.size)}
                                        </p>
                                        {willBeChunked && (
                                          <Badge color="warning" size="sm">
                                            Will be chunked
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Language Selection for this file */}
                                      <div className="mt-2">
                                        <Label 
                                          htmlFor={`language-${index}`} 
                                          value="Language:" 
                                          className="text-xs mb-1 block text-gray-600 dark:text-gray-400" 
                                        />
                                        <Select
                                          id={`language-${index}`}
                                          sizing="sm"
                                          value={fileLanguages[file.name] || DEFAULT_LANGUAGE.code}
                                          onChange={(e) => {
                                            setFileLanguages(prev => ({
                                              ...prev,
                                              [file.name]: e.target.value
                                            }));
                                          }}
                                          disabled={isUploading}
                                        >
                                          {SUPPORTED_LANGUAGES.map((lang) => (
                                            <option key={lang.code} value={lang.code}>
                                              {formatLanguageDisplay(lang.code)}
                                            </option>
                                          ))}
                                        </Select>
                                      </div>
                                      
                                      {/* Progress bar */}
                                      {isCurrentlyUploading && (
                                        <div className="mt-2">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                              Uploading chunks...
                                            </span>
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                              {progress}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                              style={{ width: `${progress}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <Button
                          color="blue"
                          onClick={handleUploadFiles}
                          disabled={isUploading}
                          className="w-full"
                        >
                          {isUploading ? (
                            <>
                              <Spinner size="sm" className="mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <HiUpload className="w-4 h-4 mr-2" />
                              Upload {uploadingFiles.length} File{uploadingFiles.length !== 1 ? "s" : ""}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </Tabs.Item>

                {/* Tasks Tab */}
                <Tabs.Item title="Transcription Tasks" icon={HiPlay}>
                  <div className="mt-4 flex-1 overflow-hidden">
                    {tasksLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="lg" />
                      </div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <HiPlay className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                          No transcription tasks
                        </h3>
                        <p className="text-gray-500 dark:text-gray-500">
                          Upload some media files to get started
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table hoverable>
                          <Table.Head>
                            <Table.HeadCell>File</Table.HeadCell>
                            <Table.HeadCell>Status</Table.HeadCell>
                            <Table.HeadCell>Created</Table.HeadCell>
                            <Table.HeadCell>Actions</Table.HeadCell>
                          </Table.Head>
                          <Table.Body className="divide-y">
                            {filteredTasks.map((task) => (
                              <Table.Row
                                key={task.id}
                                className="bg-white dark:border-gray-700 dark:bg-gray-800"
                              >
                                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                  <div className="flex items-center">
                                    {getFileTypeIcon(task.file_name || "")}
                                    <div className="ml-3">
                                      <p className="text-sm font-medium">
                                        {task.file_name || "Unknown"}
                                      </p>
                                      {task.folder_id && (
                                        <p className="text-xs text-gray-500">
                                          {folders.find((f) => f.id === task.folder_id)?.name || "Unknown Folder"}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-blue-600 dark:text-blue-400">
                                          {getFilesByTaskId(task.id).length} file chunk(s)
                                        </p>
                                        {task.language && (
                                          <Badge color="gray" size="sm">
                                            {getLanguageDisplayName(task.language)}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge color={getTaskStatusColor(task)}>
                                    {getTaskStatusText(task)}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(task.created_at).toLocaleDateString()}
                                    <br />
                                    <span className="text-xs">
                                      {new Date(task.created_at).toLocaleTimeString()}
                                    </span>
                                  </div>
                                </Table.Cell>
                                <Table.Cell>
                                  <div className="flex gap-2">
                                    {getFilesByTaskId(task.id).length > 0 && (
                                      <Tooltip content={getFilesByTaskId(task.id).length === 1 ? "View media file" : "View media chunks (individual chunks cannot be played)"}>
                                        <Button
                                          size="xs"
                                          color="gray"
                                          onClick={() => {
                                            const files = getFilesByTaskId(task.id);
                                            if (files.length === 1) {
                                              // Single file, open directly
                                              window.open(files[0].media_url!, "_blank");
                                            } else {
                                              // Multiple chunks, show alert with warning
                                              const links = files
                                                .sort((a, b) => {
                                                  // Prefer explicit chunk_index when available, fall back to extracting from URL
                                                  const aIndex = typeof a.chunk_index === "number" ? a.chunk_index : (() => {
                                                    const match = (a.media_url || "").match(/chunk(\d+)of\d+/);
                                                    return match ? parseInt(match[1]) - 1 : 0; // convert to 0-based
                                                  })();
                                                  const bIndex = typeof b.chunk_index === "number" ? b.chunk_index : (() => {
                                                    const match = (b.media_url || "").match(/chunk(\d+)of\d+/);
                                                    return match ? parseInt(match[1]) - 1 : 0; // convert to 0-based
                                                  })();
                                                  return aIndex - bIndex;
                                                })
                                                .map((f, i) => `Chunk ${i + 1}: ${f.media_url}`)
                                                .join('\n');
                                              alert(`⚠️ IMPORTANT: This file was split into ${files.length} chunks for upload.\n\nIndividual chunks cannot be played as media files.\nThe backend needs to reassemble these chunks before transcription.\n\nChunk URLs:\n${links}`);
                                            }
                                          }}
                                        >
                                          <HiEye className="w-4 h-4" />
                                        </Button>
                                      </Tooltip>
                                    )}
                                    {task.result_url && (
                                      <Tooltip content="Download result">
                                        <Button
                                          size="xs"
                                          color="green"
                                          onClick={() => handleDownloadResult(task)}
                                        >
                                          <HiDownload className="w-4 h-4" />
                                        </Button>
                                      </Tooltip>
                                    )}
                                    <Tooltip content="Delete task">
                                      <Button
                                        size="xs"
                                        color="red"
                                        onClick={() => handleDeleteTask(task)}
                                      >
                                        <HiTrash className="w-4 h-4" />
                                      </Button>
                                    </Tooltip>
                                  </div>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table>
                      </div>
                    )}
                  </div>
                </Tabs.Item>
              </Tabs>
            </div>
          </Card>
        </div>
      </div>

      {/* New Folder Modal */}
      <Modal show={showNewFolderModal} onClose={() => setShowNewFolderModal(false)}>
        <Modal.Header>Create New Folder</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName" className="mb-2 block">
                Folder Name
              </Label>
              <TextInput
                id="folderName"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="blue" onClick={handleCreateFolder}>
            Create Folder
          </Button>
          <Button color="gray" onClick={() => setShowNewFolderModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </NavbarSidebarLayout>
  );
};

export default TranscriptionPage;
