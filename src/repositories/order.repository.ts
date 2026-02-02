import { prisma } from "../../lib/prisma.js";
import type { CreteOrderInput } from "../types/orders.types.js";

export class OrderRepository {
  async getOrder(storeOwnerId: string) {
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

  async createOrder(data: CreteOrderInput) {
    return await prisma.order.create({
      data: {
        storeOwnerId: data.storeOwnerId,
        customerId: data.customerId,
        orderNumber: data.orderNumber,
        totalAmount: data.totalAmount,
        orderStatus: data.orderStatus as any,
        paymentStatus: data.paymentStatus as any,
        paymentScreenshotUrl: data.paymentScreenshotUrl,
        customerNotes: data.customerNotes
      }
    });
  }

  async findByStoreId(storeOwnerId: string) {
    return await prisma.storeOwner.findUnique({
      where: {
        id: storeOwnerId,
      },
      select: { id: true }
    });
  }

  // New methods for Update Status
  async findById(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId }
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { 
        orderStatus: status as any 
      }
    });
  }
}