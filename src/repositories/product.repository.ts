import { prisma } from "../../lib/prisma.js";
import type { CreateProductInput } from "../types/product.types.js";

export class ProductRepository {
  async create(data: CreateProductInput) {
    return await prisma.product.create({
      data: {
        storeOwnerId: data.storeOwnerId,
        productName: data.productName,
        price: data.price,
        productImageUrl: data.productImageUrl,
        description: data.description,
        stockQuantity: data.stockQuantity,
      },
    });
  }

  async findById(productId: string) {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: {
        StoreOwner: {
          select: {
            id: true,
            storeName: true,
            // Add other fields you want to expose
          },
        },
      },
    });
  }

  async findAllByStoreOwner(storeOwnerId: string) {
    return await prisma.product.findMany({
      where: { storeOwnerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findStoreIdBySubDomain(subdomain: string){
    return await prisma.storeOwner.findUnique({
        where: {storeSubdomain: subdomain},
        select: {
            id : true
        }
    })
  }

async findBySubdomain(subdomain: string) {
  return await prisma.product.findMany({
    where: {
      StoreOwner: {
        storeSubdomain: subdomain.toLowerCase(),
      },
      isActive: true,
    },
    include: {
      StoreOwner: {
        select: {
          id: true,
          storeName: true,
          storeSubdomain: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}


  async findAllByStoreOwnerPaginated(
    storeOwnerId: string,
    skip: number,
    take: number
  ) {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { storeOwnerId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({
        where: { storeOwnerId },
      }),
    ]);

    return { products, total };
  }

  async update(productId: string, data: Partial<CreateProductInput>) {
    return await prisma.product.update({
      where: { id: productId },
      data,
    });
  }

  async delete(productId: string) {
    return await prisma.product.delete({
      where: { id: productId },
    });
  }

  // Search products by name or description
  async search(query: string, limit: number = 20) {
    return await prisma.product.findMany({
      where: {
        OR: [
          {
            productName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        isActive: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  // Get active products for a store
  async findActiveByStoreOwner(storeOwnerId: string) {
    return await prisma.product.findMany({
      where: {
        storeOwnerId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Bulk update stock (for orders, cart checkout, etc.)
  async updateStockBulk(updates: { productId: string; quantity: number }[]) {
    const results = await Promise.all(
      updates.map((update) =>
        prisma.product.update({
          where: { id: update.productId },
          data: {
            stockQuantity: {
              increment: update.quantity,
            },
          },
        })
      )
    );
    return results;
  }

  // Get low stock products
  async getLowStockProducts(storeOwnerId: string, threshold: number = 10) {
    return await prisma.product.findMany({
      where: {
        storeOwnerId,
        stockQuantity: {
          lte: threshold,
        },
        isActive: true,
      },
      orderBy: { stockQuantity: "asc" },
    });
  }

  // Get products with reviews/ratings (aggregate)
  async findByIdWithStats(productId: string) {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productReviews: {
          select: {
            id: true,
            rating: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                email: true,
                // Add other customer fields
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            productReviews: true,
          },
        },
      },
    });
  }
}