import z from "zod";

export const GetOrderSchema = z.object({
    storeOwnerId: z.string().uuid("Invalid store owner ID"),
    customerId: z.string().uuid("Invalid customer ID"),
    orderNumber: z.string().length(2,"Order Number must be minimum of 2 character"),
})

export const CreateOrderSchema = z.object({
    storeOwnerId: z.string().uuid("Invalid store owner ID"),
    customerId: z.string().uuid("Invalid customer ID"),
    orderNumber: z.string().min(2, "Order Number must be minimum of 2 characters"),
    totalAmount: z.number().positive("Total amount must be positive"),
    orderStatus: z.enum(["pending", "confirm", "processing", "shipped", "delivered", "cancelled"] as const).optional(),
    paymentStatus: z.enum(["pending", "received", "failed"] as const).optional(),
    paymentScreenshotUrl: z.string().url("Invalid URL").optional(),
    customerNotes: z.string().optional()
});

export const UpdateOrderStatusSchema = z.object({
    orderStatus: z.enum(["pending", "confirm", "processing", "shipped", "delivered", "cancelled"] as const).optional(),
});