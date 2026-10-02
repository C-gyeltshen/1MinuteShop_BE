import { CustomerRepository } from "../repositories/customer.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { StoreRepository } from "../repositories/store.repository.js";
import type {
  CreateOrderInput,
  OrderStatus,
  PaymentStatus,
  ValidatedOrderItem,
} from "../types/orders.types.js";
import { StoreOwnerRepository } from "../repositories/storeOwner.repository.js";
import { TelegramService } from "./telegram.service.js";
import { getSubscription } from "./subscriptionAccess.js";
import type { UpdateOrderStatusInput, UpdatePaymentStatusInput } from "../validators/order.valadator.js";

const customerRepository = new CustomerRepository();
const productRepository = new ProductRepository();
const orderRepository = new OrderRepository();
const storeRepository = new StoreRepository();
const storeOwnerRepository = new StoreOwnerRepository();
const telegramService = new TelegramService();

export class OrderService {
  async create(data: CreateOrderInput) {
    try {
      // 1. Validate or create customer
      let customer = await customerRepository.findCustomerById(data.customerId);

      if (!customer) {
        // Check if customer data is provided for creation
        if (!data.customerName || !data.email || !data.phoneNumber) {
          throw {
            statusCode: 400,
            message:
              "Customer not found and customer details not provided for creation",
          };
        }

        // Create customer
        customer = await customerRepository.create({
          customerName: data.customerName,
          email: data.email,
          phoneNumber: data.phoneNumber,
        });

        if (!customer) {
          throw {
            statusCode: 500,
            message: "Error creating customer",
          };
        }
      }

      // 2. Validate store exists and is active
      const store = await storeRepository.findBySubDomain(data.storeSubdomain);

      if (!store) {
        throw {
          statusCode: 404,
          message: "Store not found",
        };
      }

      if (store.status !== "ACTIVE") {
        throw {
          statusCode: 400,
          message: "Store is not active",
        };
      }

      if (!getSubscription(store).hasAccess) {
        throw {
          statusCode: 402,
          message: "This store is not accepting orders right now",
        };
      }

      // 3. Validate products and calculate totals
      const validatedItems: ValidatedOrderItem[] = [];
      let totalAmount = 0;

      for (const item of data.items) {
        const product = await productRepository.findById(item.productId);

        if (!product) {
          throw {
            statusCode: 404,
            message: `Product with ID ${item.productId} not found`,
          };
        }

        if (!product.isActive) {
          throw {
            statusCode: 400,
            message: `Product ${product.productName} is not available`,
          };
        }

        if (product.stockQuantity < item.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for ${product.productName}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
          };
        }

        // Calculate prices
        const unitPrice = Number(product.price);
        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
          productId: item.productId,
          productName: product.productName,
          quantity: item.quantity,
          unitPrice,
          storeSubdomain: data.storeSubdomain,
        });
      }

      // 4. Create order with transaction
      const order = await orderRepository.createOrderWithItems({
        storeSubdomain: data.storeSubdomain,
        storeOwnerId: store.id,
        customerId: data.customerId,
        customerName: customer.customerName,
        totalAmount,
        items: validatedItems,
        paymentScreenshotUrl: data.paymentScreenshotUrl,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountry: data.shippingCountry,
        customerNotes: data.customerNotes,
      });

      // Notify the store owner on Telegram. Not awaited: the order is already
      // committed, so a Telegram failure must never affect the customer's checkout.
      void telegramService
        .notifyNewOrder(store.id, {
          storeName: store.storeName,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          customerName: order.customer.customerName,
          customerPhone: order.customer.phoneNumber,
          city: order.shipping.city,
          items: order.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
          })),
        })
        .catch((err) => console.error("Order notification failed:", err?.message ?? err));

      return {
        statusCode: 201,
        message: "Order created successfully",
        data: order,
      };
    } catch (error: any) {
      // Re-throw custom errors
      if (error.statusCode) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Order service error:", error);
      throw {
        statusCode: 500,
        message:
          error.message ||
          "An unexpected error occurred while creating the order",
      };
    }
  }

  async getAll() {
    const allOrders = await orderRepository.getAll();
    if (!allOrders) {
      throw {
        statusCode: 404,
        message: "error fetching all order data",
      };
    } else {
      return {
        statusCode: 200,
        data: allOrders,
      };
    }
  }

  async getOrdersByStoreOwnerId(storeOwnerId: string) {
    try {
      const result = await orderRepository.findByStoreOwnerId(storeOwnerId);
      return {
        statusCode: 200,
        message: "Orders retrieved successfully",
        data: result,
      };
    } catch (error: any) {
      console.error("Get orders error:", error);
      throw {
        statusCode: 500,
        message: error.message || "Failed to retrieve orders",
      };
    }
  }

  async getOrderConfirmation(orderId: string) {
    const order = await orderRepository.findConfirmationById(orderId);

    if (!order) {
      throw { statusCode: 404, message: "Order not found" };
    }

    return {
      statusCode: 200,
      message: "Order retrieved successfully",
      data: {
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        customerName: order.customer.customerName,
        email: order.customer.email,
        createdAt: order.createdAt,
      },
    };
  }

  async updateOrderStatus(
    orderId: string,
    data: UpdateOrderStatusInput,
    storeOwnerId: string,
  ) {
  try {
    // Validate order exists and belongs to the requesting store owner
    const order = await orderRepository.exists(orderId);

    if (!order || order.storeOwnerId !== storeOwnerId) {
      throw {
        statusCode: 404,
        message: "Order not found",
      };
    }

    // Update order status
    const updatedOrder = await orderRepository.updateOrderStatus(
      orderId,
      data.orderStatus as OrderStatus
    );

    return {
      statusCode: 200,
      message: "Order status updated successfully",
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        orderStatus: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentStatus,
        totalAmount: Number(updatedOrder.totalAmount),
        customer: updatedOrder.customer as any,
        items: (updatedOrder.orderItems as any).map((item: any) => ({
          productId: item.productId,
          productName: item.product.productName,
          productImage: item.product.productImageUrl,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        updatedAt: updatedOrder.updatedAt,
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error("Order service error:", error);
    throw {
      statusCode: 500,
      message:
        error.message ||
        "An unexpected error occurred while updating order status",
    };
  }
}

async updatePaymentStatus(
  orderId: string,
  data: UpdatePaymentStatusInput,
  storeOwnerId: string,
) {
  try {
    // Validate order exists and belongs to the requesting store owner
    const order = await orderRepository.findById(orderId);

    if (!order || order.storeOwnerId !== storeOwnerId) {
      throw {
        statusCode: 404,
        message: "Order not found",
      };
    }

    // Update payment status
    const updatedOrder = await orderRepository.updatePaymentStatus(
      orderId,
      data.paymentStatus as PaymentStatus
    );

    return {
      statusCode: 200,
      message: "Payment status updated successfully",
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        orderStatus: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentStatus,
        totalAmount: Number(updatedOrder.totalAmount),
        customer: updatedOrder.customer as any,
        items: (updatedOrder.orderItems as any).map((item: any) => ({
          productId: item.productId,
          productName: item.product.productName,
          productImage: item.product.productImageUrl,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        updatedAt: updatedOrder.updatedAt,
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error("Order service error:", error);
    throw {
      statusCode: 500,
      message:
        error.message ||
        "An unexpected error occurred while updating payment status",
    };
  }
}
}
