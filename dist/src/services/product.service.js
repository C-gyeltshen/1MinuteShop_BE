import { ProductRepository } from "../repositories/product.repository.js";
import { createProductSchema } from "../validators/product.valadators.js";
const productRepository = new ProductRepository();
export class ProductService {
    async createProduct(data) {
        const validated = createProductSchema.parse(data);
        const product = await productRepository.create({
            ...validated,
            // Provide a default empty string if the image URL is undefined
            productImageUrl: validated.productImageUrl || "",
            price: validated.price,
        });
        return {
            success: true,
            data: product,
            message: "Product created successfully",
        };
    }
    async getProductById(productId) {
        const product = await productRepository.findById(productId);
        if (!product) {
            throw {
                statusCode: 404,
                message: "Product not found",
            };
        }
        return {
            success: true,
            data: product,
        };
    }
    async getProductsByStoreOwner(storeOwnerId) {
        const products = await productRepository.findAllByStoreOwner(storeOwnerId);
        return {
            success: true,
            data: products,
            total: products.length,
        };
    }
    async getProductsBySubdomain(subdomain) {
        const products = await productRepository.findBySubdomain(subdomain);
        if (products.length === 0) {
            throw {
                statusCode: 404,
                message: "Pro",
            };
        }
        return {
            success: true,
            data: products,
            total: products.length,
        };
    }
    async updateProduct(productId, storeOwnerId, data) {
        const product = await productRepository.findById(productId);
        if (!product) {
            throw {
                statusCode: 404,
                message: "Product not found",
            };
        }
        if (product.storeOwnerId !== storeOwnerId) {
            throw {
                statusCode: 403,
                message: "Unauthorized to update this product",
            };
        }
        const updateData = {
            ...(data.productName && { productName: data.productName }),
            ...(data.price && { price: data.price }),
            ...(data.productImageUrl && { productImageUrl: data.productImageUrl }),
            ...(data.description && { description: data.description }),
            ...(data.stockQuantity !== undefined && {
                stockQuantity: data.stockQuantity,
            }),
        };
        const updated = await productRepository.update(productId, updateData);
        return {
            success: true,
            data: updated,
            message: "Product updated successfully",
        };
    }
    async deleteProduct(productId, storeOwnerId) {
        const product = await productRepository.findById(productId);
        if (!product) {
            throw {
                statusCode: 404,
                message: "Product not found",
            };
        }
        if (product.storeOwnerId !== storeOwnerId) {
            throw {
                statusCode: 403,
                message: "Unauthorized to delete this product",
            };
        }
        await productRepository.delete(productId);
        return {
            success: true,
            message: "Product deleted successfully",
        };
    }
    async toggleProductStatus(productId, storeOwnerId) {
        const product = await productRepository.findById(productId);
        if (!product) {
            throw {
                statusCode: 404,
                message: "Product not found",
            };
        }
        if (product.storeOwnerId !== storeOwnerId) {
            throw {
                statusCode: 403,
                message: "Unauthorized to update this product",
            };
        }
        const updated = await productRepository.update(productId, {
            isActive: !product.isActive,
        });
        return {
            success: true,
            data: updated,
            message: `Product ${updated.isActive ? "activated" : "deactivated"} successfully`,
        };
    }
    async updateStock(productId, storeOwnerId, quantity) {
        const product = await productRepository.findById(productId);
        if (!product) {
            throw {
                statusCode: 404,
                message: "Product not found",
            };
        }
        if (product.storeOwnerId !== storeOwnerId) {
            throw {
                statusCode: 403,
                message: "Unauthorized to update this product",
            };
        }
        const newStock = Math.max(0, product.stockQuantity + quantity);
        const updated = await productRepository.update(productId, {
            stockQuantity: newStock,
        });
        return {
            success: true,
            data: updated,
            message: "Stock updated successfully",
        };
    }
    async searchProducts(query, limit = 20) {
        // This requires a raw query or extended repository method
        const products = await productRepository.search(query, limit);
        return {
            success: true,
            data: products,
            total: products.length,
        };
    }
}
