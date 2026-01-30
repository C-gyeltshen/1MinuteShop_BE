import type { Context } from "hono";
import { ProductService } from "../services/product.service.js";

const productService = new ProductService();

export class ProductController {
  async createProduct(c: Context) {
    try {
      const body = await c.req.json();
      
      // CHANGE: Check c.req.param("storeOwnerId") first
      // Priority: URL Param -> Auth Context -> JSON Body
      const storeOwnerId = c.req.param("storeOwnerId") || c.get("storeOwnerId") || body.storeOwnerId;

      if (!storeOwnerId) {
        return c.json(
          {
            success: false,
            message: "Store owner ID is required or authentication failed",
          },
          401
        );
      }

      const result = await productService.createProduct({
        ...body,
        storeOwnerId,
      });
      return c.json(result, 201); 
    } catch (error: any) {
      // Handle Zod Validation Errors specifically
      if (error.name === "ZodError" || (Array.isArray(error.issues) && error.issues.length > 0)) {
        return c.json(
          {
            success: false,
            message: "Validation failed",
            errors: error.issues || error.errors, // Return structured validation issues
          },
          400
        );
      }

      return c.json(
        {
          success: false,
          message: error.message || "Failed to create product",
        },
        error.statusCode || 500
      );
    }
  }

  async getProduct(c: Context) {
    try {
      const productId = c.req.param("productId");
      const result = await productService.getProductById(productId);
      return c.json(result, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: error.message || "Failed to fetch product",
        },
        error.statusCode || 500
      );
    }
  }

  async getStoreProducts(c: Context) {
    try {
      // Changed from c.get("storeOwnerId") to c.req.param("storeOwnerId")
      const storeOwnerId = c.req.param("storeOwnerId");
      
      if (!storeOwnerId) {
        return c.json(
          {
            success: false,
            message: "Store Owner ID is required",
          },
          400
        );
      }

      const result = await productService.getProductsByStoreOwner(storeOwnerId);
      return c.json(result, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: error.message || "Failed to fetch products",
        },
        500
      );
    }
  }

  async getProductsBySubdomain(c: Context) {
    try {
      const subdomain = c.req.param("subdomain");

      if (!subdomain || subdomain.trim() === "") {
        return c.json(
          {
            success: false,
            message: "Subdomain is required",
          },
          400
        );
      }

      const result = await productService.getProductsBySubdomain(subdomain);
      return c.json(result, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: error.message || "Failed to fetch products",
        },
        error.statusCode || 500
      );
    }
  }

  async updateProduct(c: Context) {
    try {
      const productId = c.req.param("productId");
      const storeOwnerId = c.get("storeOwnerId");
      const body = await c.req.json();

      const result = await productService.updateProduct(
        productId,
        storeOwnerId,
        body
      );

      return c.json(result, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: error.message || "Failed to update product",
        },
        error.statusCode || 500
      );
    }
  }

  async deleteProduct(c: Context) {
    try {
      const productId = c.req.param("productId");
      const storeOwnerId = c.get("storeOwnerId");

      const result = await productService.deleteProduct(productId, storeOwnerId);
      return c.json(result, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: error.message || "Failed to delete product",
        },
        error.statusCode || 500
      );
    }
  }

  async toggleStatus(c: Context) {
    try {
      const productId = c.req.param("productId");
      const storeOwnerId = c.get("storeOwnerId");

      const result = await productService.toggleProductStatus(
        productId,
        storeOwnerId
      );

      return c.json(result, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: error.message || "Failed to toggle product status",
        },
        error.statusCode || 500
      );
    }
  }

  async updateStock(c: Context) {
    try {
      const productId = c.req.param("productId");
      const storeOwnerId = c.get("storeOwnerId");
      const { quantity } = await c.req.json();

      if (typeof quantity !== "number") {
        return c.json(
          {
            success: false,
            message: "Quantity must be a number",
          },
          400
        );
      }

      const result = await productService.updateStock(
        productId,
        storeOwnerId,
        quantity
      );

      return c.json(result, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: error.message || "Failed to update stock",
        },
        error.statusCode || 500
      );
    }
  }

  async searchProducts(c: Context) {
    try {
      const query = c.req.query("q") || "";
      const limit = parseInt(c.req.query("limit") || "20");

      if (!query.trim()) {
        return c.json(
          {
            success: false,
            message: "Search query is required",
          },
          400
        );
      }

      const result = await productService.searchProducts(query, limit);
      return c.json(result, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: error.message || "Failed to search products",
        },
        500
      );
    }
  }
}