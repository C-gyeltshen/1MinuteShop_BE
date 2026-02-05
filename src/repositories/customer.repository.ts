import { prisma } from "../../lib/prisma.js";
import type { CreateCustomerInput, UpdateCustomerInput, PaginationParams } from "../types/customer.types.js";

export class CustomerRepository {
  /**
   * Find a store owner by ID
   */
async findStoreOwnerById(storeOwnerId: string) {
    return await prisma.storeOwner.findUnique({
      where: {
        id: storeOwnerId,
      },
    });
  }

  /**
   * Find a customer by email
   */
  async findCustomerByEmail(customerEmail: string) {
    return await prisma.customer.findUnique({
      where: {
        email: customerEmail,
      },
    });
  }


  /**
   * Find a customer by ID
   */
  async findCustomerById(customerId: string) {
    return await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            orderStatus: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Last 5 orders
        },
        _count: {
          select: {
            orders: true,
            productReviews: true,
          },
        },
      },
    });
  }

  /**
   * Create a new customer
   */
  async create(data: CreateCustomerInput) {
    return await prisma.customer.create({
      data: {
        customerName: data.customerName,
        email: data.email,
        phoneNumber: data.phoneNumber ?? null,  // FIX: Convert undefined to null
        address: data.address ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        postalCode: data.postalCode ?? null,
        country: data.country ?? null,
      },
    });
  }


  /**
   * Update an existing customer
   */
async update(customerId: string, data: UpdateCustomerInput) {
    return await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        ...(data.customerName !== undefined && { customerName: data.customerName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
        ...(data.country !== undefined && { country: data.country }),
      },
    });
  }


  /**
   * Delete a customer
   */
  async delete(customerId: string) {
    return await prisma.customer.delete({
      where: {
        id: customerId,
      },
    });
  }

  /**
   * Get all customers with pagination and search
   */
  async findAll(params: PaginationParams) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { customerName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phoneNumber: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          _count: {
            select: {
              orders: true,
              productReviews: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(customerId: string) {
    const stats = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        _count: {
          select: {
            orders: true,
            productReviews: true,
          },
        },
        orders: {
          select: {
            totalAmount: true,
            orderStatus: true,
          },
        },
      },
    });

    if (!stats) return null;

    const totalSpent = stats.orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    const completedOrders = stats.orders.filter(
      (order) => order.orderStatus === 'DELIVERED'
    ).length;

    return {
      totalOrders: stats._count.orders,
      totalReviews: stats._count.productReviews,
      totalSpent,
      completedOrders,
    };
  }

  /**
   * Check if customer has any orders
   */
  async hasOrders(customerId: string): Promise<boolean> {
    const count = await prisma.order.count({
      where: {
        customerId,
      },
    });
    return count > 0;
  }
}