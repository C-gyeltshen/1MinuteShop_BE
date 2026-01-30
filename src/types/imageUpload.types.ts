
export interface UploadImageDTO {
  file: string;          // Base64 encoded image
  fileName: string;      // Original filename
  fileType?: string;     // MIME type (e.g., 'image/jpeg')
  userId: string;        // User ID for organizing uploads
}

export interface UploadResponse {
  url: string;           // Public URL of uploaded file
  path: string;          // Storage path
}


export interface DeleteImageRequest {
  path: string;          // Storage path to delete
}