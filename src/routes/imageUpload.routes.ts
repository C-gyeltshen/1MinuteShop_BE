import { Hono } from 'hono';
import { UploadController } from '../controllers/imageUpload.controller.js';

const upload = new Hono();
const uploadController = new UploadController();

// POST /api/upload/image
upload.post('/image', uploadController.uploadImage);

// DELETE /api/upload/image
upload.delete('/image', uploadController.deleteImage);

// POST /api/upload/payment-screenshot
upload.post('/payment-screenshot', uploadController.uploadScreenshot);

// DELETE /api/upload/payment-screenshot
upload.delete('/payment-screenshot', uploadController.deleteScreenshot);


export default upload;