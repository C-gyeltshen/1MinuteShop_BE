// src/validators/upload.validators.ts
import { z } from 'zod';
/**
 * Validator for image upload request
 */
export const uploadImageSchema = z.object({
    file: z.string().min(1, 'File is required'),
    fileName: z.string().min(1, 'File name is required'),
    fileType: z.string().optional(),
    userId: z.string().min(1, 'User ID is required')
});
/**
 * Validator for image delete request
 */
export const deleteImageSchema = z.object({
    path: z.string().min(1, 'Path is required')
});
