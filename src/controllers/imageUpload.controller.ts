import type { Context } from 'hono';
import { ImageUploadService } from '../services/imageUpload.service.js';
import { uploadImageSchema, deleteImageSchema } from '../validators/imageUploadValadator.js';

export class UploadController {
  private uploadService: ImageUploadService;

  constructor() {
    this.uploadService = new ImageUploadService();
  }

  uploadImage = async (c: Context) => {
    try {
      const body = await c.req.json();

      // Validate request body
      const validationResult = uploadImageSchema.safeParse(body);
      
      if (!validationResult.success) {
        return c.json({ 
          success: false, 
          message: 'Validation failed',
          errors: validationResult.error.issues
        }, 400);
      }

      const { file, fileName, fileType, userId } = validationResult.data;

      // Call service to handle upload
      const result = await this.uploadService.uploadProductImage({
        file,
        fileName,
        fileType,
        userId
      });

      return c.json({ 
        success: true, 
        url: result.url,
        path: result.path,
        message: 'Image uploaded successfully'
      }, 200);

    } catch (error: any) {
      console.error('[UploadController] Error:', error);
      return c.json({ 
        success: false, 
        message: error.message || 'Failed to upload image',
        error: error.toString()
      }, 500);
    }
  };

  /**
   * Delete image from Supabase Storage
   * DELETE /api/upload/image
   */
  deleteImage = async (c: Context) => {
    try {
      const body = await c.req.json();

      // Validate request body
      const validationResult = deleteImageSchema.safeParse(body);
      
      if (!validationResult.success) {
        return c.json({ 
          success: false, 
          message: 'Validation failed',
          errors: validationResult.error.issues
        }, 400);
      }

      const { path } = validationResult.data;

      await this.uploadService.deleteProductImage(path);

      return c.json({ 
        success: true, 
        message: 'Image deleted successfully' 
      }, 200);

    } catch (error: any) {
      console.error('[UploadController] Error:', error);
      return c.json({ 
        success: false, 
        message: error.message || 'Failed to delete image' 
      }, 500);
    }
  };
}