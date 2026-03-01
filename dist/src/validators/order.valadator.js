import { z } from "zod";
export const createOrderItemSchema = z.object({
    productId: z.string().uuid("Invalid Product UUID"),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(999, 'Quantity cannot exceed 999'),
});
export const validatedOrderItemSchema = z.object({
    productId: z.string().uuid("Invalid Product UUID"),
    productName: z.string().min(1, "Product name is required"),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().positive("Unit price must be positive"),
    storeSubdomain: z.string().min(1, 'Store subdomain is required'),
});
export const createOrderSchema = z.object({
    storeSubdomain: z.string().min(1, 'Store subdomain is required'),
    customerId: z.string().uuid("Invalid customer ID"),
    customerName: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(1).max(20).optional(),
    items: z
        .array(createOrderItemSchema)
        .min(1, 'At least one item is required')
        .max(50, 'Maximum 50 items per order'),
    paymentScreenshotUrl: z.string().url('Invalid payment screenshot URL'),
    shippingAddress: z.string().min(1, 'Shipping address is required').max(500),
    shippingCity: z.string().min(1, 'City is required').max(100),
    shippingState: z.string().min(1, 'State is required').max(100),
    shippingPostalCode: z.string().min(1, 'Postal code is required').max(20),
    shippingCountry: z.string().min(1, 'Country is required').max(100),
    customerNotes: z.string().max(1000).optional(),
});
// Update status schemas
export const updateOrderStatusSchema = z.object({
    orderStatus: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], { message: 'Invalid order status' }),
});
export const updatePaymentStatusSchema = z.object({
    paymentStatus: z.enum(['PENDING', 'RECEIVED', 'FAILED'], {
        message: 'Invalid payment status',
    }),
});
