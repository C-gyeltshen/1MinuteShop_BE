import { ProductRepository } from "../repositories/product.repository.js";
import type { CreateProductInput } from "../types/product.types.js";
import { createProductSchema } from "../validators/product.valadators.js";

const productRepository = new ProductRepository();

export class ProductService {
  async createProduct(data: CreateProductInput) {
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

  async getProductById(productId: string) {
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

  async getProductsByStoreOwner(storeOwnerId: string) {
    const products = await productRepository.findAllByStoreOwner(storeOwnerId);

    return {
      success: true,
      data: products,
      total: products.length,
    };
  }

  async getProductsBySubdomain(subdomain: string) {
    const products = await productRepository.findBySubdomain(subdomain);

    if (products.length === 0) {
      throw {
        statusCode: 200,
        message: "No product available",
      };
    }

    return {
      success: true,
      data: products,
      total: products.length,
    };
  }

  async updateProduct(
    productId: string,
    storeOwnerId: string,
    data: Partial<CreateProductInput>,
  ) {
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

  async deleteProduct(productId: string, storeOwnerId: string) {
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

  async toggleProductStatus(productId: string, storeOwnerId: string) {
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
    } as any);

    return {
      success: true,
      data: updated,
      message: `Product ${updated.isActive ? "activated" : "deactivated"} successfully`,
    };
  }

  async updateStock(productId: string, storeOwnerId: string, quantity: number) {
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
    } as any);

    return {
      success: true,
      data: updated,
      message: "Stock updated successfully",
    };
  }

  async searchProducts(query: string, limit: number = 20) {
    // This requires a raw query or extended repository method
    const products = await productRepository.search(query, limit);

    return {
      success: true,
      data: products,
      total: products.length,
    };
  }
}
