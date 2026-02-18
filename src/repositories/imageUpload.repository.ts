import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = '1MinuteShopBucket';
const PAYMENTS_FOLDER = 'payments';

export class ImageUploadRepository {
  private supabaseAdmin: SupabaseClient;

  constructor() {
    // Initialize Supabase Admin Client (bypasses RLS)
    this.supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadToStorage(data: {
    buffer: Buffer;
    fileName: string;
    fileType?: string;
    userId: string;
  }) {
    try {
      // Generate unique filename
      const fileExt = data.fileName.split(".").pop()?.toLowerCase() || "jpg";
      const timestamp = Date.now();
      const uniqueFileName = `${data.userId}-${timestamp}.${fileExt}`;
      const filePath = `products/${uniqueFileName}`;

      console.log(`[UploadRepository] Uploading to: ${filePath}`);
      console.log(
        `[UploadRepository] Buffer size: ${data.buffer.length} bytes`,
      );

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
      const {
        data: { publicUrl },
      } = this.supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
      };
    } catch (error: any) {
      console.error("[UploadRepository] Error:", error);
      throw error;
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFromStorage(path: string) {
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
    } catch (error: any) {
      console.error("[UploadRepository] Error:", error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): string {
    const {
      data: { publicUrl },
    } = this.supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(path);

    return publicUrl;
  }

  /**
   * List all files in a folder
   */
  async listFiles(folder: string = "products") {
    try {
      const { data, error } = await this.supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(folder);

      if (error) {
        throw new Error(`List failed: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error("[UploadRepository] Error listing files:", error);
      throw error;
    }
  }


/////payment image upload
  async uploadPaymentScreenshot(data: {
    buffer: Buffer;
    fileName: string;
    fileType?: string;
    userId: string;
    orderId?: string;
  }) {
    try {
      const fileExt = data.fileName.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      // Include orderId in filename if provided for traceability
      const uniqueFileName = data.orderId
        ? `${data.userId}-order-${data.orderId}-${timestamp}.${fileExt}`
        : `${data.userId}-${timestamp}.${fileExt}`;
      const filePath = `${PAYMENTS_FOLDER}/${uniqueFileName}`;

      console.log(`[PaymentUploadRepository] Uploading to: ${filePath}`);
      console.log(`[PaymentUploadRepository] Buffer size: ${data.buffer.length} bytes`);

      const { data: uploadData, error } = await this.supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, data.buffer, {
          contentType: data.fileType || 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('[PaymentUploadRepository] Supabase error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('[PaymentUploadRepository] Upload successful:', uploadData);

      const {
        data: { publicUrl },
      } = this.supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
      };
    } catch (error: any) {
      console.error('[PaymentUploadRepository] Error:', error);
      throw error;
    }
  }

  async deletePaymentScreenshot(path: string) {
    try {
      console.log(`[PaymentUploadRepository] Deleting: ${path}`);

      const { error } = await this.supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('[PaymentUploadRepository] Supabase error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }

      console.log('[PaymentUploadRepository] Delete successful');
    } catch (error: any) {
      console.error('[PaymentUploadRepository] Error:', error);
      throw error;
    }
  }

}