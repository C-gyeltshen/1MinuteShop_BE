import { OrderRepository } from "../repositories/order.repository.js";
const orderRepository = new OrderRepository();
export class OrderService {
    async getOrderByStoreOwnerId(storeOwnerId) {
        const storeExists = await orderRepository.findByStoreId(storeOwnerId);
        if (!storeExists) {
            throw {
                statusCode: 404,
                message: "Store Owner not found"
            };
        }
        const fetchOrder = await orderRepository.getOrder(storeOwnerId);
        return {
            success: true,
            data: fetchOrder
        };
    }
    async createOrder(data) {
        const storeExists = await orderRepository.findByStoreId(data.storeOwnerId);
        if (!storeExists) {
            throw {
                statusCode: 404,
                message: "Store Owner for this order not found"
            };
        }
        const newOrder = await orderRepository.createOrder(data);
        return {
            success: true,
            message: "Order created successfully",
            data: newOrder
        };
    }
    async updateOrderStatus(orderId) {
        // 1. Check if order exists
        const order = await orderRepository.findById(orderId);
        if (!order) {
            throw {
                statusCode: 404,
                message: "Order not found"
            };
        }
        // 2. Update status
        const updatedOrder = await orderRepository.updateOrderStatus(orderId, status);
        return {
            success: true,
            message: "Order status updated successfully",
            data: updatedOrder
        };
    }
}
