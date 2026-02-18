import type { Context } from 'hono';
import { ImageUploadService } from '../services/imageUpload.service.js';
import { uploadImageSchema, deleteImageSchema, uploadPaymentScreenshotSchema, deletePaymentScreenshotSchema } from '../validators/imageUploadValadator.js';


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

  uploadScreenshot = async (c: Context) => {
    try {
      const contentType = c.req.header('content-type') || '';

      let file: string;
      let fileName: string;
      let fileType: string | undefined;
      let userId: string;
      let orderId: string | undefined;

      if (contentType.includes('multipart/form-data')) {
        // ── Handle FormData (file input from browser/form) ──
        const formData = await c.req.formData();

        const fileField = formData.get('file');
        if (!fileField || !(fileField instanceof File)) {
          return c.json({ success: false, message: 'File is required' }, 400);
        }

        userId = (formData.get('userId') as string) || '';
        orderId = (formData.get('orderId') as string) || undefined;

        if (!userId) {
          return c.json({ success: false, message: 'User ID is required' }, 400);
        }

        // Convert File → Buffer → base64
        const arrayBuffer = await fileField.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');

        fileName = fileField.name;
        fileType = fileField.type;
        file = `data:${fileType};base64,${base64}`;

      } else if (contentType.includes('application/json')) {
        // ── Handle JSON (base64 encoded from client) ──
        const body = await c.req.json();

        if (!body.file || !body.fileName || !body.userId) {
          return c.json(
            { success: false, message: 'file, fileName, and userId are required' },
            400,
          );
        }

        file = body.file;
        fileName = body.fileName;
        fileType = body.fileType;
        userId = body.userId;
        orderId = body.orderId;

      } else {
        return c.json(
          { success: false, message: 'Unsupported content-type. Use multipart/form-data or application/json' },
          415,
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
      const normalizedType = fileType?.toLowerCase();
      if (normalizedType && !allowedTypes.includes(normalizedType)) {
        return c.json(
          { success: false, message: `Invalid file type: ${fileType}. Allowed: JPEG, PNG, WEBP, AVIF` },
          400,
        );
      }

      const result = await this.uploadService.uploadPaymentScreenshot({
        file,
        fileName,
        fileType: normalizedType,
        userId,
        orderId,
      });

      return c.json(
        {
          success: true,
          url: result.url,
          path: result.path,
          message: 'Payment screenshot uploaded successfully',
        },
        200,
      );

    } catch (error: any) {
      console.error('[PaymentUploadController] Error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Failed to upload payment screenshot',
          error: error.toString(),
        },
        500,
      );
    }
  };

  deleteScreenshot = async (c: Context) => {
    try {
      const body = await c.req.json();

      const validationResult = deletePaymentScreenshotSchema.safeParse(body);
      if (!validationResult.success) {
        return c.json(
          {
            success: false,
            message: 'Validation failed',
            errors: validationResult.error.issues,
          },
          400,
        );
      }

      await this.uploadService.deletePaymentScreenshot(validationResult.data.path);

      return c.json({ success: true, message: 'Payment screenshot deleted successfully' }, 200);

    } catch (error: any) {
      console.error('[PaymentUploadController] Error:', error);
      return c.json(
        { success: false, message: error.message || 'Failed to delete payment screenshot' },
        500,
      );
    }
  };
}