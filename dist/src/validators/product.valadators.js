import z from "zod";
export const createProductSchema = z.object({
    storeOwnerId: z.string().uuid("Invalid store owner ID"),
    productName: z
        .string()
        .min(2, "Product name must be at least 2 characters")
        .max(100, "Product name must be at most 100 characters")
        .trim(),
    price: z
        .string()
        .or(z.number())
        .transform((val) => String(val))
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Price must be a valid positive number",
    }),
    productImageUrl: z
        .string()
        .url("Product image URL must be a valid URL")
        .optional()
        .or(z.literal("")),
    description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description must be at most 1000 characters")
        .optional()
        .or(z.literal("")),
    stockQuantity: z
        .number()
        .or(z.string().transform(Number))
        .refine((val) => Number.isInteger(val) && val >= 0, {
        message: "Stock quantity must be a non-negative integer",
    }),
});
export const updateProductSchema = createProductSchema.partial();
export const updateStockSchema = z.object({
    quantity: z
        .number()
        .int("Quantity must be an integer")
        .refine((val) => val !== 0, {
        message: "Quantity cannot be zero",
    }),
});
export const searchProductSchema = z.object({
    q: z
        .string()
        .min(1, "Search query required")
        .max(100, "Search query too long"),
    limit: z.number().int().min(1).max(100).default(20),
});
