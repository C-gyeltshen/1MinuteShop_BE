import { prisma } from "../../lib/prisma.js";
import type {
  CreateOrderWithItemsInput,
} from "../types/orders.types.js";

export class OrderRepository {
  async createOrderWithItems(data: CreateOrderWithItemsInput) {
    return await prisma.$transaction(async (tx) => {
      // Create the order with items
      const order = await tx.order.create({
        data: {
          storeSubdomain: data.storeSubdomain,
          customerId: data.customerId,
          totalAmount: data.totalAmount,
          paymentScreenshotUrl: data.paymentScreenshotUrl,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          shippingState: data.shippingState,
          shippingPostalCode: data.shippingPostalCode,
          shippingCountry: data.shippingCountry,
          customerNotes: data.customerNotes,
          orderItems: {
            create: data.items.map((item) => ({
              productId: item.productId,
              storeSubdomain: data.storeSubdomain,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  productName: true,
                  productImageUrl: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              customerName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      // Update stock quantities
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Create activity log
      await tx.activityLog.create({
        data: {
          storeOwnerId: data.storeOwnerId,
          actionType: "ORDER_CREATED",
          entityType: "ORDER",
          entityId: order.id,
          description: `New order #${order.orderNumber} created by ${data.customerName}`,
          userType: "CUSTOMER",
        },
      });

      // Return formatted order data
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        customer: order.customer,
        items: order.orderItems.map((item) => ({
          productId: item.productId,
          productName: item.product.productName,
          productImage: item.product.productImageUrl,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        shipping: {
          address: order.shippingAddress,
          city: order.shippingCity,
          state: order.shippingState,
          postalCode: order.shippingPostalCode,
          country: order.shippingCountry,
        },
        createdAt: order.createdAt,
      };
    });
  }

  async getAll() {
    return await prisma.order.findMany({});
  }
  async findByStoreOwnerId(storeOwnerId: string) {
    return await prisma.order.findMany({
      where: {
        StoreOwner: {
          id: storeOwnerId
        }
      },
      select: {
        id: true,
        orderNumber: true,
        orderStatus: true,
        paymentStatus: true,
        totalAmount: true,
        storeSubdomain: true,
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                productName: true,
                productImageUrl: true
              }
            }
          }
        }
      }
    });
  }
}
