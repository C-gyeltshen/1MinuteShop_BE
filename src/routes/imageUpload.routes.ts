import { Hono } from 'hono';
import { UploadController } from '../controllers/imageUpload.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const upload = new Hono();
const uploadController = new UploadController();

// POST /api/upload/image
upload.post('/image', authMiddleware, uploadController.uploadImage);

// DELETE /api/upload/image
upload.delete('/image', authMiddleware, uploadController.deleteImage);

// POST /api/upload/payment-screenshot (public: customer checkout)
upload.post('/payment-screenshot', uploadController.uploadScreenshot);

// DELETE /api/upload/payment-screenshot
upload.delete('/payment-screenshot', authMiddleware, uploadController.deleteScreenshot);


export default upload;