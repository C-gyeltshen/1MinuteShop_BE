import { prisma } from "../../lib/prisma.js";
export class OrderRepository {
    async getOrder(storeOwnerId) {
        return await prisma.order.findMany({
            where: {
                storeOwnerId: storeOwnerId,
            },
            select: {
                id: true,
                storeOwnerId: true,
                customerId: true,
                orderNumber: true,
                totalAmount: true,
                orderStatus: true,
                paymentStatus: true,
                paymentScreenshotUrl: true,
                customerNotes: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async createOrder(data) {
        return await prisma.order.create({
            data: {
                storeOwnerId: data.storeOwnerId,
                customerId: data.customerId,
                orderNumber: data.orderNumber,
                totalAmount: data.totalAmount,
                orderStatus: data.orderStatus,
                paymentStatus: data.paymentStatus,
                paymentScreenshotUrl: data.paymentScreenshotUrl,
                customerNotes: data.customerNotes
            }
        });
    }
    async findByStoreId(storeOwnerId) {
        return await prisma.storeOwner.findUnique({
            where: {
                id: storeOwnerId,
            },
            select: { id: true }
        });
    }
    // New methods for Update Status
    async findById(orderId) {
        return await prisma.order.findUnique({
            where: { id: orderId }
        });
    }
    async updateOrderStatus(orderId, status) {
        return await prisma.order.update({
            where: { id: orderId },
            data: {
                orderStatus: status
            }
        });
    }
}
