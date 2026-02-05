import { z } from "zod";

export const CreateCustomerSchema = z.object({
  storeOwnerId: z.string().uuid("Invalid Customer id"),
  productName: z.string().min(2, "Product name must be at least 2 characters").max(50, "Product name must be at most 50 characters"),
  price: z.number(),
  productImageUrl: z.string(),
  description: z.string().min(2, "description must be at least of 2 character").max(10,"Description must be less than 100 character"),
  stockQuantity: z.number(),
  isActive: z.boolean()
});
