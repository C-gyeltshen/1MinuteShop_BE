import { ImageUploadRepository } from "../repositories/imageUpload.repository.js";
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
];
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
    async uploadPaymentScreenshot(data) {
        try {
            console.log(`[PaymentUploadService] Uploading screenshot for user: ${data.userId}`);
            // Strip base64 prefix and create buffer
            const base64Data = data.file.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const fileSizeInMB = buffer.length / (1024 * 1024);
            if (fileSizeInMB > 10) {
                throw new Error('File size must be less than 10MB');
            }
            const normalizedFileType = data.fileType?.toLowerCase();
            if (normalizedFileType && !ALLOWED_TYPES.includes(normalizedFileType)) {
                throw new Error(`Invalid file type: ${data.fileType}. Allowed types: JPEG, PNG, WEBP, AVIF`);
            }
            const result = await this.uploadRepository.uploadPaymentScreenshot({
                buffer,
                fileName: data.fileName,
                fileType: normalizedFileType,
                userId: data.userId,
                orderId: data.orderId,
            });
            console.log(`[PaymentUploadService] Upload successful: ${result.url}`);
            return result;
        }
        catch (error) {
            console.error('[PaymentUploadService] Error:', error);
            throw error;
        }
    }
    async deletePaymentScreenshot(path) {
        try {
            console.log(`[PaymentUploadService] Deleting screenshot: ${path}`);
            await this.uploadRepository.deletePaymentScreenshot(path);
            console.log('[PaymentUploadService] Delete successful');
        }
        catch (error) {
            console.error('[PaymentUploadService] Error:', error);
            throw error;
        }
    }
}
