import { z } from "zod";

export const updateStoreSettingsSchema = z.object({
  storeDescription: z.string().trim().max(1000).optional(),
  contactEmail: z.union([z.literal(""), z.string().trim().email()]).optional(),
  contactPhone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(255).optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  taxPercentage: z.number().min(0).max(100).optional(),
  shippingEnabled: z.boolean().optional(),
  shippingCost: z.number().min(0).optional(),
});

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
