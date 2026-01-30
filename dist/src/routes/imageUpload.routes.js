import { Hono } from 'hono';
import { UploadController } from '../controllers/imageUpload.controller.js';
const upload = new Hono();
const uploadController = new UploadController();
// POST /api/upload/image
upload.post('/image', uploadController.uploadImage);
// DELETE /api/upload/image
upload.delete('/image', uploadController.deleteImage);
export default upload;
