import { z } from "zod";
import { OrderService } from "../services/order.service.js";
import { createOrderSchema } from "../validators/order.valadator.js";
import type { Context } from "hono";

const orderService = new OrderService();

export class OrderController {
  async createOrder(c: Context) {
    try {
      // Get and validate input
      const body = await c.req.json();
      const validatedInput = createOrderSchema.parse(body);

      // Delegate to service
      const result = await orderService.create(validatedInput);

      return c.json(
        {
          success: true,
          message: result.message,
          data: result.data,
        },
        result.statusCode as any
      );
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getAllOrder(c: Context) {
    try {
      const result = await orderService.getAll();
      return c.json(
        {
          success: true,
          statusCode: 200,
          data: result.data,
        },
        result.statusCode as any
      );
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getOrder(c: Context) {
    try {
      const storeOwnerId = c.req.param("id"); // Changed from "storeOwnerId" to "id" to match route param

      const result = await orderService.getOrdersByStoreOwnerId(storeOwnerId);
      return c.json(
        {
          success: true,
          message: result.message,
          data: result.data,
        },
        result.statusCode as any
      );
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  private handleError(c: Context, error: unknown) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          message: "Validation error",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      );
    }

    // Handle custom service errors
    if (error && typeof error === "object" && "statusCode" in error) {
      return c.json(
        {
          success: false,
          message: (error as any).message || "An error occurred",
        },
        (error as any).statusCode || 500
      );
    }

    // Handle unexpected errors
    console.error("Controller error:", error);
    return c.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      500
    );
  }
}