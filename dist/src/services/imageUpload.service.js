import { ImageUploadRepository } from "../repositories/imageUpload.repository.js";
export class ImageUploadService {
    uploadRepository;
    constructor() {
        this.uploadRepository = new ImageUploadRepository();
    }
    async uploadProductImage(data) {
        try {
            console.log(`[UploadService] Uploading image for user: ${data.userId}`);
            // Validate file size (10MB max)
            const base64Data = data.file.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            const fileSizeInMB = buffer.length / (1024 * 1024);
            if (fileSizeInMB > 10) {
                throw new Error("File size must be less than 10MB");
            }
            // Validate file type
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
                "image/avif", // Added support for AVIF
            ];
            const normalizedFileType = data.fileType?.toLowerCase();
            if (normalizedFileType && !allowedTypes.includes(normalizedFileType)) {
                throw new Error(`Invalid file type: ${data.fileType}. Allowed types: JPEG, PNG, GIF, WEBP, AVIF`);
            }
            // Upload to Supabase
            const result = await this.uploadRepository.uploadToStorage({
                buffer,
                fileName: data.fileName,
                fileType: normalizedFileType,
                userId: data.userId,
            });
            console.log(`[UploadService] Upload successful: ${result.url}`);
            return result;
        }
        catch (error) {
            console.error("[UploadService] Error:", error);
            throw error;
        }
    }
    /**
     * Delete product image from Supabase Storage
     */
    async deleteProductImage(path) {
        try {
            console.log(`[UploadService] Deleting image: ${path}`);
            await this.uploadRepository.deleteFromStorage(path);
            console.log(`[UploadService] Delete successful`);
        }
        catch (error) {
            console.error("[UploadService] Error:", error);
            throw error;
        }
    }
    /**
     * Update product image (delete old, upload new)
     */
    async updateProductImage(oldPath, newImageData) {
        try {
            // Delete old image if exists
            if (oldPath) {
                await this.deleteProductImage(oldPath);
            }
            // Upload new image
            const result = await this.uploadProductImage(newImageData);
            return result;
        }
        catch (error) {
            console.error("[UploadService] Error updating image:", error);
            throw error;
        }
    }
}
