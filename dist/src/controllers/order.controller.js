import { OrderService } from "../services/order.service.js";
import { CreateOrderSchema, UpdateOrderSchema, UpdateOrderStatusSchema, UpdatePaymentStatusSchema, UUIDSchema, OrderNumberSchema, } from "../validators/order.valadator.js";
import { ZodError } from "zod";
import { OrderStatus, PaymentStatus } from "@prisma/client";
const orderService = new OrderService();
export class OrderController {
    /**
     * Create a new order
     * POST /api/orders
     */
    async createOrder(c) {
        try {
            const body = await c.req.json();
            // Validate request body
            const validatedData = CreateOrderSchema.parse(body);
            const result = await orderService.createOrder(validatedData);
            return c.json({
                success: result.success,
                message: result.message,
                data: result.data,
            }, 201);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Validation error",
                    // FIX: Use .issues instead of .errors
                    errors: error.issues.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Get all orders with filters
     * GET /api/orders?page=1&limit=10&orderStatus=PENDING&paymentStatus=PENDING
     */
    async getAllOrders(c) {
        try {
            const page = parseInt(c.req.query("page") || "1");
            const limit = parseInt(c.req.query("limit") || "10");
            const search = c.req.query("search") || "";
            const sortBy = c.req.query("sortBy") || "createdAt";
            const sortOrder = c.req.query("sortOrder") || "desc";
            const storeOwnerId = c.req.query("storeOwnerId");
            const customerId = c.req.query("customerId");
            const orderStatus = c.req.query("orderStatus");
            const paymentStatus = c.req.query("paymentStatus");
            const startDate = c.req.query("startDate");
            const endDate = c.req.query("endDate");
            const result = await orderService.getAllOrders({
                page,
                limit,
                search,
                sortBy,
                sortOrder,
                storeOwnerId,
                customerId,
                orderStatus,
                paymentStatus,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Get order by ID
     * GET /api/orders/:id
     */
    async getOrderById(c) {
        try {
            const orderId = c.req.param("id");
            // Validate UUID
            UUIDSchema.parse(orderId);
            const result = await orderService.getOrderById(orderId);
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid order ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Get order by order number
     * GET /api/orders/store/:storeOwnerId/number/:orderNumber
     */
    async getOrderByNumber(c) {
        try {
            const storeOwnerId = c.req.param("storeOwnerId");
            const orderNumber = c.req.param("orderNumber");
            // Validate
            UUIDSchema.parse(storeOwnerId);
            OrderNumberSchema.parse(orderNumber);
            const result = await orderService.getOrderByNumber(storeOwnerId, orderNumber);
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid parameters",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Get orders for a customer
     * GET /api/orders/customer/:customerId
     */
    async getCustomerOrders(c) {
        try {
            const customerId = c.req.param("customerId");
            const page = parseInt(c.req.query("page") || "1");
            const limit = parseInt(c.req.query("limit") || "10");
            // Validate UUID
            UUIDSchema.parse(customerId);
            const result = await orderService.getCustomerOrders(customerId, page, limit);
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid customer ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Get orders for a store owner
     * GET /api/orders/store/:storeOwnerId
     */
    async getStoreOrders(c) {
        try {
            const storeOwnerId = c.req.param("storeOwnerId");
            const page = parseInt(c.req.query("page") || "1");
            const limit = parseInt(c.req.query("limit") || "10");
            // Validate UUID
            UUIDSchema.parse(storeOwnerId);
            const result = await orderService.getStoreOrders(storeOwnerId, page, limit);
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid store owner ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Update order
     * PUT /api/orders/:id
     */
    async updateOrder(c) {
        try {
            const orderId = c.req.param("id");
            const body = await c.req.json();
            // Validate UUID
            UUIDSchema.parse(orderId);
            // Validate request body
            const validatedData = UpdateOrderSchema.parse(body);
            const result = await orderService.updateOrder(orderId, validatedData);
            return c.json({
                success: result.success,
                message: result.message,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Validation error",
                    // FIX: Use .issues instead of .errors
                    errors: error.issues.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Update order status
     * PATCH /api/orders/:id/status
     */
    async updateOrderStatus(c) {
        try {
            const orderId = c.req.param("id");
            const body = await c.req.json();
            // Validate UUID
            UUIDSchema.parse(orderId);
            // Validate request body
            const validatedData = UpdateOrderStatusSchema.parse(body);
            const result = await orderService.updateOrderStatus(orderId, validatedData.orderStatus);
            return c.json({
                success: result.success,
                message: result.message,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Validation error",
                    // FIX: Use .issues instead of .errors
                    errors: error.issues.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Update payment status
     * PATCH /api/orders/:id/payment
     */
    async updatePaymentStatus(c) {
        try {
            const orderId = c.req.param("id");
            const body = await c.req.json();
            // Validate UUID
            UUIDSchema.parse(orderId);
            // Validate request body
            const validatedData = UpdatePaymentStatusSchema.parse(body);
            const result = await orderService.updatePaymentStatus(orderId, validatedData.paymentStatus, validatedData.paymentScreenshotUrl);
            return c.json({
                success: result.success,
                message: result.message,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Validation error",
                    // FIX: Use .issues instead of .errors
                    errors: error.issues.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Cancel order
     * POST /api/orders/:id/cancel
     */
    async cancelOrder(c) {
        try {
            const orderId = c.req.param("id");
            // Validate UUID
            UUIDSchema.parse(orderId);
            const result = await orderService.cancelOrder(orderId);
            return c.json({
                success: result.success,
                message: result.message,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid order ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Delete order
     * DELETE /api/orders/:id
     */
    async deleteOrder(c) {
        try {
            const orderId = c.req.param("id");
            // Validate UUID
            UUIDSchema.parse(orderId);
            const result = await orderService.deleteOrder(orderId);
            return c.json({
                success: result.success,
                message: result.message,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid order ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Get store statistics
     * GET /api/orders/store/:storeOwnerId/statistics
     */
    async getStoreStatistics(c) {
        try {
            const storeOwnerId = c.req.param("storeOwnerId");
            // Validate UUID
            UUIDSchema.parse(storeOwnerId);
            const result = await orderService.getStoreStatistics(storeOwnerId);
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid store owner ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Get customer order summary
     * GET /api/orders/customer/:customerId/summary
     */
    async getCustomerOrderSummary(c) {
        try {
            const customerId = c.req.param("customerId");
            // Validate UUID
            UUIDSchema.parse(customerId);
            const result = await orderService.getCustomerOrderSummary(customerId);
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid customer ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
}
