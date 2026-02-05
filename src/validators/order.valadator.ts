import { z } from "zod";
import { OrderStatus, PaymentStatus } from "../types/orders.types.js";

/**
 * Enum schemas
 * Udated to use nativeEnum to match TypeScript Enum types in Service/Controller
 */
export const OrderStatusEnum = z.nativeEnum(OrderStatus);

export const PaymentStatusEnum = z.nativeEnum(PaymentStatus);

/**
 * Schema for order item input
 */
export const OrderItemInputSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

/**
 * Schema for creating a new order
 */
export const CreateOrderSchema = z.object({
  storeOwnerId: z.string().uuid("Invalid store owner ID"),
  customerId: z.string().uuid("Invalid customer ID"),
  items: z
    .array(OrderItemInputSchema)
    .min(1, "Order must have at least one item"),
  customerNotes: z.string().max(500, "Customer notes must be at most 500 characters").optional(),
  paymentScreenshotUrl: z.string().url("Invalid payment screenshot URL").optional(),
});

/**
 * Schema for updating an order
 */
export const UpdateOrderSchema = z.object({
  orderStatus: OrderStatusEnum.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  paymentScreenshotUrl: z.string().url("Invalid payment screenshot URL").optional().nullable(),
  customerNotes: z.string().max(500, "Customer notes must be at most 500 characters").optional().nullable(),
});

/**
 * Schema for updating order status only
 */
export const UpdateOrderStatusSchema = z.object({
  orderStatus: OrderStatusEnum,
});

/**
 * Schema for updating payment status
 */
export const UpdatePaymentStatusSchema = z.object({
  paymentStatus: PaymentStatusEnum,
  paymentScreenshotUrl: z.string().url("Invalid payment screenshot URL").optional().nullable(),
});

/**
 * Schema for order filter parameters
 */
export const OrderFilterSchema = z.object({
  storeOwnerId: z.string().uuid("Invalid store owner ID").optional(),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  orderStatus: OrderStatusEnum.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.enum(['orderNumber', 'totalAmount', 'orderStatus', 'paymentStatus', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
});

/**
 * Schema for UUID validation
 */
export const UUIDSchema = z.string().uuid("Invalid UUID format");

/**
 * Schema for order number validation
 */
export const OrderNumberSchema = z.string().min(1, "Order number is required");

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof UpdatePaymentStatusSchema>;
export type OrderItemInput = z.infer<typeof OrderItemInputSchema>;
export type OrderFilterParams = z.infer<typeof OrderFilterSchema>;