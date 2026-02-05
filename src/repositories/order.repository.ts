import { prisma } from "../../lib/prisma.js";
import type { 
  CreateOrderInput, 
  UpdateOrderInput, 
  OrderFilterParams,
  OrderStatus,
  PaymentStatus
} from "../types/orders.types.js";

export class OrderRepository {
  /**
   * Generate unique order number for a store
   */
  async generateOrderNumber(storeOwnerId: string): Promise<string> {
    const lastOrder = await prisma.order.findFirst({
      where: { storeOwnerId },
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });

    if (!lastOrder) {
      return 'ORD-0001';
    }

    const lastNumber = parseInt(lastOrder.orderNumber.split('-')[1] || '0');
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `ORD-${newNumber}`;
  }

  /**
   * Create a new order with items
   */
  async create(data: CreateOrderInput) {
    const orderNumber = await this.generateOrderNumber(data.storeOwnerId);

    // Calculate total amount
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    return await prisma.order.create({
      data: {
        storeOwnerId: data.storeOwnerId,
        customerId: data.customerId,
        orderNumber,
        totalAmount,
        customerNotes: data.customerNotes,
        paymentScreenshotUrl: data.paymentScreenshotUrl,
        orderItems: {
          create: data.items.map((item) => ({
            storeOwnerId: data.storeOwnerId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                productImageUrl: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find order by ID with full details
   */
  async findById(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                productImageUrl: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find order by order number and store owner
   */
  async findByOrderNumber(storeOwnerId: string, orderNumber: string) {
    return await prisma.order.findUnique({
      where: {
        storeOwnerId_orderNumber: {
          storeOwnerId,
          orderNumber,
        },
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                productImageUrl: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update order
   */
  async update(orderId: string, data: UpdateOrderInput) {
    return await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(data.orderStatus && { orderStatus: data.orderStatus }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
        ...(data.paymentScreenshotUrl !== undefined && { 
          paymentScreenshotUrl: data.paymentScreenshotUrl 
        }),
        ...(data.customerNotes !== undefined && { 
          customerNotes: data.customerNotes 
        }),
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                productImageUrl: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update order status only
   */
  async updateStatus(orderId: string, orderStatus: OrderStatus) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus },
    });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string, 
    paymentStatus: PaymentStatus, 
    paymentScreenshotUrl?: string | null
  ) {
    return await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        ...(paymentScreenshotUrl !== undefined && { paymentScreenshotUrl }),
      },
    });
  }

  /**
   * Delete order (cascade deletes order items)
   */
  async delete(orderId: string) {
    return await prisma.order.delete({
      where: { id: orderId },
    });
  }

  /**
   * Get all orders with filtering and pagination
   */
  async findAll(params: OrderFilterParams) {
    const {
      storeOwnerId,
      customerId,
      orderStatus,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (storeOwnerId) where.storeOwnerId = storeOwnerId;
    if (customerId) where.customerId = customerId;
    if (orderStatus) where.orderStatus = orderStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' as const } },
        { customer: { customerName: { contains: search, mode: 'insensitive' as const } } },
        { customer: { email: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  productName: true,
                  productImageUrl: true,
                  description: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get orders for a specific customer
   */
  async findByCustomer(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
        },
      }),
      prisma.order.count({ where: { customerId } }),
    ]);

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get orders for a specific store owner
   */
  async findByStoreOwner(storeOwnerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { storeOwnerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
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
        },
      }),
      prisma.order.count({ where: { storeOwnerId } }),
    ]);

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order statistics for a store
   */
  async getStoreStatistics(storeOwnerId: string) {
    const [
      totalOrders,
      ordersByStatus,
      ordersByPaymentStatus,
      recentOrders,
    ] = await Promise.all([
      // Total orders and revenue
      prisma.order.aggregate({
        where: { storeOwnerId },
        _count: true,
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
      // Orders by status
      prisma.order.groupBy({
        by: ['orderStatus'],
        where: { storeOwnerId },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // Orders by payment status
      prisma.order.groupBy({
        by: ['paymentStatus'],
        where: { storeOwnerId },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // Recent orders (last 30 days)
      prisma.order.count({
        where: {
          storeOwnerId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalOrders: totalOrders._count,
      totalRevenue: Number(totalOrders._sum.totalAmount || 0),
      averageOrderValue: Number(totalOrders._avg.totalAmount || 0),
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.orderStatus,
        count: item._count,
        totalAmount: Number(item._sum.totalAmount || 0),
      })),
      ordersByPaymentStatus: ordersByPaymentStatus.map((item) => ({
        status: item.paymentStatus,
        count: item._count,
        totalAmount: Number(item._sum.totalAmount || 0),
      })),
      recentOrders,
      pendingOrders: ordersByStatus.find(s => s.orderStatus === 'PENDING')?._count || 0,
      completedOrders: ordersByStatus.find(s => s.orderStatus === 'DELIVERED')?._count || 0,
    };
  }

  /**
   * Get customer order summary
   */
  async getCustomerOrderSummary(customerId: string) {
    const [customer, orders, stats] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          customerName: true,
        },
      }),
      prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.order.aggregate({
        where: { customerId },
        _count: true,
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
    ]);

    const lastOrder = orders[0];

    return {
      customerId,
      customerName: customer?.customerName || 'Unknown',
      totalOrders: stats._count,
      totalSpent: Number(stats._sum.totalAmount || 0),
      averageOrderValue: Number(stats._avg.totalAmount || 0),
      lastOrderDate: lastOrder?.createdAt,
      orders,
    };
  }

  /**
   * Check if store owner exists
   */
  async storeOwnerExists(storeOwnerId: string): Promise<boolean> {
    const count = await prisma.storeOwner.count({
      where: { id: storeOwnerId },
    });
    return count > 0;
  }

  /**
   * Check if customer exists
   */
  async customerExists(customerId: string): Promise<boolean> {
    const count = await prisma.customer.count({
      where: { id: customerId },
    });
    return count > 0;
  }

  /**
   * Check if product exists and has enough stock
   */
  async validateProduct(productId: string, quantity: number): Promise<{
    exists: boolean;
    hasStock: boolean;
    product?: any;
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        productName: true,
        price: true,
        stockQuantity: true,
        isActive: true,
      },
    });

    if (!product) {
      return { exists: false, hasStock: false };
    }

    return {
      exists: true,
      hasStock: product.stockQuantity >= quantity && product.isActive,
      product,
    };
  }

  /**
   * Update product stock after order
   */
  async updateProductStock(productId: string, quantity: number) {
    return await prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: {
          decrement: quantity,
        },
      },
    });
  }

  /**
   * Restore product stock (for cancelled orders)
   */
  async restoreProductStock(orderId: string) {
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });

    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }
  }
}