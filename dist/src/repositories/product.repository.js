import { prisma } from "../../lib/prisma.js";
export class ProductRepository {
    async create(data) {
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
    async findById(productId) {
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
    async findAllByStoreOwner(storeOwnerId) {
        return await prisma.product.findMany({
            where: { storeOwnerId },
            orderBy: { createdAt: "desc" },
        });
    }
    async findStoreIdBySubDomain(subdomain) {
        return await prisma.storeOwner.findUnique({
            where: { storeSubdomain: subdomain },
            select: {
                id: true
            }
        });
    }
    async findBySubdomain(subdomain) {
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
    async findAllByStoreOwnerPaginated(storeOwnerId, skip, take) {
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
    async update(productId, data) {
        return await prisma.product.update({
            where: { id: productId },
            data,
        });
    }
    async delete(productId) {
        return await prisma.product.delete({
            where: { id: productId },
        });
    }
    // Search products by name or description
    async search(query, limit = 20) {
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
    async findActiveByStoreOwner(storeOwnerId) {
        return await prisma.product.findMany({
            where: {
                storeOwnerId,
                isActive: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }
    // Bulk update stock (for orders, cart checkout, etc.)
    async updateStockBulk(updates) {
        const results = await Promise.all(updates.map((update) => prisma.product.update({
            where: { id: update.productId },
            data: {
                stockQuantity: {
                    increment: update.quantity,
                },
            },
        })));
        return results;
    }
    // Get low stock products
    async getLowStockProducts(storeOwnerId, threshold = 10) {
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
    async findByIdWithStats(productId) {
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
