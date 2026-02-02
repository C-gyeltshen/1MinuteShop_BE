import { OrderService } from "../services/order.service.js";
import { CreateOrderSchema, UpdateOrderStatusSchema } from "../validators/order.valadator.js";
const orderService = new OrderService();
export class OrderController {
    async getOrdersByStoreOwner(c) {
        try {
            const storeOwnerId = c.req.param("storeOwnerId");
            const response = await orderService.getOrderByStoreOwnerId(storeOwnerId);
            return c.json(response, 200);
        }
        catch (error) {
            return c.json({
                success: false,
                message: error.message || "Internal Server Error",
            }, error.statusCode || 500);
        }
    }
    async createOrder(c) {
        try {
            const body = await c.req.json();
            const validation = CreateOrderSchema.safeParse(body);
            if (!validation.success) {
                return c.json({
                    success: false,
                    message: "Validation Error",
                    errors: validation.error.flatten().fieldErrors
                }, 400);
            }
            const response = await orderService.createOrder(body);
            return c.json(response, 201);
        }
        catch (error) {
            return c.json({
                success: false,
                message: error.message || "Internal Server Error",
            }, error.statusCode || 500);
        }
    }
    async updateOrderStatus(c) {
        try {
            const orderId = c.req.param("orderId");
            const body = await c.req.json();
            // Validate Body
            const validation = UpdateOrderStatusSchema.safeParse(body);
            if (!validation.success) {
                return c.json({
                    success: false,
                    message: "Validation Error",
                    errors: validation.error.flatten().fieldErrors
                }, 400);
            }
            const response = await orderService.updateOrderStatus(orderId);
            return c.json(response, 200);
        }
        catch (error) {
            return c.json({
                success: false,
                message: error.message || "Internal Server Error",
            }, error.statusCode || 500);
        }
    }
}
