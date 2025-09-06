import React, { useState, useMemo } from "react";
import { Button, Badge, TextInput, Tabs } from "flowbite-react";
import { 
  HiSearch, 
  HiFolder, 
  HiFolderOpen, 
  HiDocumentText,
  HiCheck,
  HiX
} from "react-icons/hi";
import { useTranscriptionTaskContext, TranscriptionTask } from "../context/TranscriptionTaskContext";
import { useTranscriptionFolderContext, TranscriptionFolder } from "../context/TranscriptionFolderContext";

interface TranscriptionSelectorProps {
  selectedTranscriptions: string[];
  onSelectionChange: (transcriptionIds: string[]) => void;
  maxHeight?: string;
}

/**
 * Enhanced transcription selector with folder support, search, and better UX
 */
const TranscriptionSelector: React.FC<TranscriptionSelectorProps> = ({
  selectedTranscriptions,
  onSelectionChange,
  maxHeight = "400px",
}) => {
  const { tasks } = useTranscriptionTaskContext();
  const { folders } = useTranscriptionFolderContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<TranscriptionFolder | null>(null);

  // Filter completed transcriptions
  const completedTasks = useMemo(() => {
    return tasks.filter(
      (task) => task.status?.toUpperCase() === "COMPLETED" && task.result_url
    );
  }, [tasks]);

  // Group tasks by folder
  const tasksByFolder = useMemo(() => {
    const grouped: Record<string, TranscriptionTask[]> = {
      "no-folder": [], // Tasks without folder
    };

    // Initialize folder groups
    folders.forEach((folder) => {
      grouped[folder.id] = [];
    });

    // Group tasks
    completedTasks.forEach((task) => {
      const folderId = task.folder_id || "no-folder";
      if (!grouped[folderId]) {
        grouped[folderId] = [];
      }
      grouped[folderId].push(task);
    });

    return grouped;
  }, [completedTasks, folders]);

  // Filter tasks based on search term and selected folder
  const filteredTasks = useMemo(() => {
    let tasksToFilter = completedTasks;

    // Filter by folder if selected
    if (selectedFolder) {
      tasksToFilter = tasksByFolder[selectedFolder.id] || [];
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      tasksToFilter = tasksToFilter.filter((task) =>
        (task.file_name || "").toLowerCase().includes(searchLower)
      );
    }

    return tasksToFilter;
  }, [completedTasks, tasksByFolder, selectedFolder, searchTerm]);

  // Get folder statistics
  const getFolderStats = (folderId: string) => {
    const folderTasks = tasksByFolder[folderId] || [];
    const selectedCount = folderTasks.filter((task) =>
      selectedTranscriptions.includes(task.id)
    ).length;
    return {
      total: folderTasks.length,
      selected: selectedCount,
    };
  };

  // Toggle transcription selection
  const toggleTranscription = (transcriptionId: string) => {
    const newSelection = selectedTranscriptions.includes(transcriptionId)
      ? selectedTranscriptions.filter((id) => id !== transcriptionId)
      : [...selectedTranscriptions, transcriptionId];
    
    onSelectionChange(newSelection);
  };

  // Select all in current view
  const selectAllVisible = () => {
    const visibleIds = filteredTasks.map((task) => task.id);
    const newSelection = [...new Set([...selectedTranscriptions, ...visibleIds])];
    onSelectionChange(newSelection);
  };

  // Deselect all in current view
  const deselectAllVisible = () => {
    const visibleIds = new Set(filteredTasks.map((task) => task.id));
    const newSelection = selectedTranscriptions.filter((id) => !visibleIds.has(id));
    onSelectionChange(newSelection);
  };

  // Select all in folder
  const selectAllInFolder = (folderId: string) => {
    const folderTaskIds = (tasksByFolder[folderId] || []).map((task) => task.id);
    const newSelection = [...new Set([...selectedTranscriptions, ...folderTaskIds])];
    onSelectionChange(newSelection);
  };

  // Deselect all in folder
  const deselectAllInFolder = (folderId: string) => {
    const folderTaskIds = new Set((tasksByFolder[folderId] || []).map((task) => task.id));
    const newSelection = selectedTranscriptions.filter((id) => !folderTaskIds.has(id));
    onSelectionChange(newSelection);
  };

  // Format file size
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  if (completedTasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <HiDocumentText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No completed transcriptions available</p>
        <p className="text-sm">Upload and process some audio files first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <TextInput
            placeholder="Search transcriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selection Summary and Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge color="blue">
              {selectedTranscriptions.length} selected
            </Badge>
            {filteredTasks.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                of {filteredTasks.length} shown
              </span>
            )}
          </div>
          
          {filteredTasks.length > 0 && (
            <div className="flex space-x-2">
              <Button size="xs" color="gray" onClick={selectAllVisible}>
                Select All Shown
              </Button>
              <Button size="xs" color="gray" onClick={deselectAllVisible}>
                Deselect All Shown
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Folder Tabs */}
      <Tabs aria-label="Transcription folders">
        {/* All Transcriptions Tab */}
        <Tabs.Item
          active={!selectedFolder}
          title={
            <div className="flex items-center space-x-2">
              <HiDocumentText className="w-4 h-4" />
              <span>All</span>
              <Badge color="gray" size="sm">
                {completedTasks.length}
              </Badge>
            </div>
          }
          onClick={() => setSelectedFolder(null)}
        >
          {/* Content handled below */}
        </Tabs.Item>

        {/* Folder Tabs */}
        {folders.map((folder) => {
          const stats = getFolderStats(folder.id);
          return (
            <Tabs.Item
              key={folder.id}
              active={selectedFolder?.id === folder.id}
              title={
                <div className="flex items-center space-x-2">
                  {selectedFolder?.id === folder.id ? (
                    <HiFolderOpen className="w-4 h-4" />
                  ) : (
                    <HiFolder className="w-4 h-4" />
                  )}
                  <span>{folder.name}</span>
                  <Badge color="gray" size="sm">
                    {stats.total}
                  </Badge>
                  {stats.selected > 0 && (
                    <Badge color="blue" size="sm">
                      {stats.selected}
                    </Badge>
                  )}
                </div>
              }
              onClick={() => setSelectedFolder(folder)}
            >
              {/* Content handled below */}
            </Tabs.Item>
          );
        })}

        {/* Uncategorized Tab */}
        {tasksByFolder["no-folder"]?.length > 0 && (
          <Tabs.Item
            active={selectedFolder?.id === "no-folder"}
            title={
              <div className="flex items-center space-x-2">
                <HiFolder className="w-4 h-4 opacity-50" />
                <span>Uncategorized</span>
                <Badge color="gray" size="sm">
                  {tasksByFolder["no-folder"].length}
                </Badge>
              </div>
            }
            onClick={() => setSelectedFolder({ id: "no-folder", name: "Uncategorized" } as any)}
          >
            {/* Content handled below */}
          </Tabs.Item>
        )}
      </Tabs>

      {/* Folder Actions */}
      {selectedFolder && (
        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {selectedFolder.name || "Uncategorized"}
          </h4>
          <div className="flex space-x-2">
            <Button
              size="xs"
              color="blue"
              onClick={() => selectAllInFolder(selectedFolder.id)}
            >
              <HiCheck className="w-3 h-3 mr-1" />
              Select All
            </Button>
            <Button
              size="xs"
              color="gray"
              onClick={() => deselectAllInFolder(selectedFolder.id)}
            >
              <HiX className="w-3 h-3 mr-1" />
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Transcription List */}
      <div
        className="space-y-2 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3"
        style={{ maxHeight }}
      >
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <HiDocumentText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No transcriptions found</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search term</p>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isSelected = selectedTranscriptions.includes(task.id);
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
                    : "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
                onClick={() => toggleTranscription(task.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <HiDocumentText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {task.file_name || "Unknown File"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created: {formatDate(task.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-3">
                  {isSelected ? (
                    <Badge color="blue">
                      <HiCheck className="w-3 h-3 mr-1" />
                      Selected
                    </Badge>
                  ) : (
                    <Badge color="gray">Select</Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TranscriptionSelector;
