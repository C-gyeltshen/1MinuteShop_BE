import { createClient, SupabaseClient } from '@supabase/supabase-js';
const BUCKET_NAME = '1MinuteShopBucket';
export class ImageUploadRepository {
    supabaseAdmin;
    constructor() {
        // Initialize Supabase Admin Client (bypasses RLS)
        this.supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    /**
     * Upload file to Supabase Storage
     */
    async uploadToStorage(data) {
        try {
            // Generate unique filename
            const fileExt = data.fileName.split(".").pop()?.toLowerCase() || "jpg";
            const timestamp = Date.now();
            const uniqueFileName = `${data.userId}-${timestamp}.${fileExt}`;
            const filePath = `products/${uniqueFileName}`;
            console.log(`[UploadRepository] Uploading to: ${filePath}`);
            console.log(`[UploadRepository] Buffer size: ${data.buffer.length} bytes`);
            // Upload to Supabase Storage using ADMIN client
            const { data: uploadData, error } = await this.supabaseAdmin.storage
                .from(BUCKET_NAME)
                .upload(filePath, data.buffer, {
                contentType: data.fileType || "image/jpeg",
                cacheControl: "3600",
                upsert: false,
            });
            if (error) {
                console.error("[UploadRepository] Supabase error:", error);
                throw new Error(`Upload failed: ${error.message}`);
            }
            console.log("[UploadRepository] Upload successful:", uploadData);
            // Get public URL
            const { data: { publicUrl }, } = this.supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);
            return {
                url: publicUrl,
                path: filePath,
            };
        }
        catch (error) {
            console.error("[UploadRepository] Error:", error);
            throw error;
        }
    }
    /**
     * Delete file from Supabase Storage
     */
    async deleteFromStorage(path) {
        try {
            console.log(`[UploadRepository] Deleting: ${path}`);
            const { error } = await this.supabaseAdmin.storage
                .from(BUCKET_NAME)
                .remove([path]);
            if (error) {
                console.error("[UploadRepository] Supabase error:", error);
                throw new Error(`Delete failed: ${error.message}`);
            }
            console.log("[UploadRepository] Delete successful");
        }
        catch (error) {
            console.error("[UploadRepository] Error:", error);
            throw error;
        }
    }
    /**
     * Get public URL for a file
     */
    getPublicUrl(path) {
        const { data: { publicUrl }, } = this.supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(path);
        return publicUrl;
    }
    /**
     * List all files in a folder
     */
    async listFiles(folder = "products") {
        try {
            const { data, error } = await this.supabaseAdmin.storage
                .from(BUCKET_NAME)
                .list(folder);
            if (error) {
                throw new Error(`List failed: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            console.error("[UploadRepository] Error listing files:", error);
            throw error;
        }
    }
}
