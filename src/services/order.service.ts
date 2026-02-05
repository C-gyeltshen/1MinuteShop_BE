import { OrderRepository } from "../repositories/order.repository.js";
import {
  type CreateOrderInput,
  type UpdateOrderInput,
  type OrderFilterParams,
  OrderStatus,
  type PaymentStatus,
} from "../types/orders.types.js";

const orderRepository = new OrderRepository();

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderInput) {
    // Validate store owner exists
    const storeOwnerExists = await orderRepository.storeOwnerExists(data.storeOwnerId);
    if (!storeOwnerExists) {
      throw {
        statusCode: 404,
        message: "Store owner not found",
      };
    }

    // Validate customer exists
    const customerExists = await orderRepository.customerExists(data.customerId);
    if (!customerExists) {
      throw {
        statusCode: 404,
        message: "Customer not found",
      };
    }

    // Validate all products and stock
    for (const item of data.items) {
      const validation = await orderRepository.validateProduct(
        item.productId,
        item.quantity
      );

      if (!validation.exists) {
        throw {
          statusCode: 404,
          message: `Product with ID ${item.productId} not found`,
        };
      }

      if (!validation.hasStock) {
        throw {
          statusCode: 400,
          message: `Product "${validation.product?.productName}" does not have enough stock. Available: ${validation.product?.stockQuantity}, Requested: ${item.quantity}`,
        };
      }
    }

    // Create the order
    const order = await orderRepository.create(data);

    // Update product stock
    for (const item of data.items) {
      await orderRepository.updateProductStock(item.productId, item.quantity);
    }

    return {
      success: true,
      message: "Order created successfully",
      data: order,
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string) {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw {
        statusCode: 404,
        message: "Order not found",
      };
    }

    return {
      success: true,
      data: order,
    };
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(storeOwnerId: string, orderNumber: string) {
    const order = await orderRepository.findByOrderNumber(storeOwnerId, orderNumber);

    if (!order) {
      throw {
        statusCode: 404,
        message: "Order not found",
      };
    }

    return {
      success: true,
      data: order,
    };
  }

  /**
   * Get all orders with filters
   */
  async getAllOrders(params: OrderFilterParams) {
    const result = await orderRepository.findAll(params);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get orders for a customer
   */
  async getCustomerOrders(customerId: string, page = 1, limit = 10) {
    const customerExists = await orderRepository.customerExists(customerId);
    if (!customerExists) {
      throw {
        statusCode: 404,
        message: "Customer not found",
      };
    }

    const result = await orderRepository.findByCustomer(customerId, page, limit);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get orders for a store owner
   */
  async getStoreOrders(storeOwnerId: string, page = 1, limit = 10) {
    const storeOwnerExists = await orderRepository.storeOwnerExists(storeOwnerId);
    if (!storeOwnerExists) {
      throw {
        statusCode: 404,
        message: "Store owner not found",
      };
    }

    const result = await orderRepository.findByStoreOwner(storeOwnerId, page, limit);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, data: UpdateOrderInput) {
    const existingOrder = await orderRepository.findById(orderId);

    if (!existingOrder) {
      throw {
        statusCode: 404,
        message: "Order not found",
      };
    }

    // If cancelling order, restore stock
    if (data.orderStatus === 'CANCELLED' && existingOrder.orderStatus !== 'CANCELLED') {
      await orderRepository.restoreProductStock(orderId);
    }

    const updatedOrder = await orderRepository.update(orderId, data);

    return {
      success: true,
      message: "Order updated successfully",
      data: updatedOrder,
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, orderStatus: OrderStatus) {
    const existingOrder = await orderRepository.findById(orderId);

    if (!existingOrder) {
      throw {
        statusCode: 404,
        message: "Order not found",
      };
    }

    // Business rules for status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const currentStatus = existingOrder.orderStatus as OrderStatus;
    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(orderStatus)) {
      throw {
        statusCode: 400,
        message: `Cannot transition from ${currentStatus} to ${orderStatus}`,
      };
    }

    // If cancelling order, restore stock
    if (orderStatus === 'CANCELLED') {
      await orderRepository.restoreProductStock(orderId);
    }

    const updatedOrder = await orderRepository.updateStatus(orderId, orderStatus);

    return {
      success: true,
      message: `Order status updated to ${orderStatus}`,
      data: updatedOrder,
    };
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentScreenshotUrl?: string | null
  ) {
    const existingOrder = await orderRepository.findById(orderId);

    if (!existingOrder) {
      throw {
        statusCode: 404,
        message: "Order not found",
      };
    }

    const updatedOrder = await orderRepository.updatePaymentStatus(
      orderId,
      paymentStatus,
      paymentScreenshotUrl
    );

    return {
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: updatedOrder,
    };
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string) {
    const existingOrder = await orderRepository.findById(orderId);

    if (!existingOrder) {
      throw {
        statusCode: 404,
        message: "Order not found",
      };
    }

    if (existingOrder.orderStatus === 'DELIVERED') {
      throw {
        statusCode: 400,
        message: "Cannot cancel a delivered order",
      };
    }

    if (existingOrder.orderStatus === 'CANCELLED') {
      throw {
        statusCode: 400,
        message: "Order is already cancelled",
      };
    }

    // Restore stock
    await orderRepository.restoreProductStock(orderId);

    const updatedOrder = await orderRepository.updateStatus(orderId, OrderStatus.CANCELLED);

    return {
      success: true,
      message: "Order cancelled successfully",
      data: updatedOrder,
    };
  }

  /**
   * Delete order (admin only - use with caution)
   */
  async deleteOrder(orderId: string) {
    const existingOrder = await orderRepository.findById(orderId);

    if (!existingOrder) {
      throw {
        statusCode: 404,
        message: "Order not found",
      };
    }

    // Only allow deletion of cancelled orders
    if (existingOrder.orderStatus !== 'CANCELLED') {
      throw {
        statusCode: 400,
        message: "Only cancelled orders can be deleted. Please cancel the order first.",
      };
    }

    await orderRepository.delete(orderId);

    return {
      success: true,
      message: "Order deleted successfully",
    };
  }

  /**
   * Get store statistics
   */
  async getStoreStatistics(storeOwnerId: string) {
    const storeOwnerExists = await orderRepository.storeOwnerExists(storeOwnerId);
    if (!storeOwnerExists) {
      throw {
        statusCode: 404,
        message: "Store owner not found",
      };
    }

    const stats = await orderRepository.getStoreStatistics(storeOwnerId);

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get customer order summary
   */
  async getCustomerOrderSummary(customerId: string) {
    const customerExists = await orderRepository.customerExists(customerId);
    if (!customerExists) {
      throw {
        statusCode: 404,
        message: "Customer not found",
      };
    }

    const summary = await orderRepository.getCustomerOrderSummary(customerId);

    return {
      success: true,
      data: summary,
    };
  }
}