/**
 * File chunking utilities for handling large file uploads
 * Splits files larger than 45MB into smaller chunks for Supabase storage
 * 
 * IMPORTANT: Media file chunks cannot be played individually!
 * - Only the first chunk contains file headers needed for playback
 * - Subsequent chunks contain raw data that cannot be played alone
 * - Backend must reassemble chunks in correct order before transcription
 * - Chunk order is preserved in the filename pattern: chunk001of003, chunk002of003, etc.
 */

/**
 * Maximum chunk size in bytes (45MB)
 */
export const MAX_CHUNK_SIZE = 45 * 1024 * 1024; // 45MB in bytes

/**
 * Maximum file size for Supabase storage (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Interface for file chunk information
 */
export interface FileChunk {
  /** The chunk data as a Blob */
  blob: Blob;
  /** Chunk index (0-based) */
  index: number;
  /** Total number of chunks for this file */
  totalChunks: number;
  /** Original file name */
  originalFileName: string;
  /** Generated chunk filename */
  chunkFileName: string;
  /** Size of this chunk in bytes */
  size: number;
}

/**
 * Interface for chunked file information
 */
export interface ChunkedFile {
  /** Original file */
  originalFile: File;
  /** Array of file chunks */
  chunks: FileChunk[];
  /** Whether the file needed to be chunked */
  wasChunked: boolean;
  /** Total size of the original file */
  totalSize: number;
}

/**
 * Check if a file needs to be chunked based on its size
 * @param file - The file to check
 * @returns True if the file needs to be chunked
 */
export const needsChunking = (file: File): boolean => {
  return file.size > MAX_CHUNK_SIZE;
};

/**
 * Generate a unique filename for a chunk
 * @param originalFileName - The original file name
 * @param chunkIndex - The index of the chunk (0-based)
 * @param totalChunks - Total number of chunks
 * @returns Generated chunk filename
 */
export const generateChunkFileName = (
  originalFileName: string,
  chunkIndex: number,
  totalChunks: number
): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const extension = originalFileName.split(".").pop();
  const nameWithoutExtension = originalFileName.replace(`.${extension}`, "");
  
  // Format: originalname_timestamp_randomid_chunk001of003.ext
  const paddedIndex = String(chunkIndex + 1).padStart(3, "0");
  const paddedTotal = String(totalChunks).padStart(3, "0");
  
  return `${nameWithoutExtension}_${timestamp}_${randomId}_chunk${paddedIndex}of${paddedTotal}.${extension}`;
};

/**
 * Split a file into chunks
 * @param file - The file to chunk
 * @returns Promise resolving to chunked file information
 */
export const chunkFile = async (file: File): Promise<ChunkedFile> => {
  // If file doesn't need chunking, return as single chunk
  if (!needsChunking(file)) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const singleFileName = `${timestamp}_${randomId}.${extension}`;
    
    return {
      originalFile: file,
      chunks: [{
        blob: file,
        index: 0,
        totalChunks: 1,
        originalFileName: file.name,
        chunkFileName: singleFileName,
        size: file.size,
      }],
      wasChunked: false,
      totalSize: file.size,
    };
  }

  // Calculate number of chunks needed
  const totalChunks = Math.ceil(file.size / MAX_CHUNK_SIZE);
  const chunks: FileChunk[] = [];

  // Create chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * MAX_CHUNK_SIZE;
    const end = Math.min(start + MAX_CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);
    
    const chunkFileName = generateChunkFileName(file.name, i, totalChunks);
    
    chunks.push({
      blob: chunkBlob,
      index: i,
      totalChunks,
      originalFileName: file.name,
      chunkFileName,
      size: chunkBlob.size,
    });
  }

  return {
    originalFile: file,
    chunks,
    wasChunked: true,
    totalSize: file.size,
  };
};

/**
 * Calculate progress for chunked file upload
 * @param completedChunks - Number of chunks completed
 * @param totalChunks - Total number of chunks
 * @returns Progress percentage (0-100)
 */
export const calculateChunkProgress = (
  completedChunks: number,
  totalChunks: number
): number => {
  if (totalChunks === 0) return 0;
  return Math.round((completedChunks / totalChunks) * 100);
};

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Validate file type for transcription
 * @param file - The file to validate
 * @returns True if the file type is supported
 */
export const isValidMediaFile = (file: File): boolean => {
  return file.type.startsWith("video/") || file.type.startsWith("audio/");
};

/**
 * Get file type icon name based on file type
 * @param file - The file to get icon for
 * @returns Icon identifier string
 */
export const getFileTypeIcon = (file: File): "video" | "audio" | "file" => {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
};
