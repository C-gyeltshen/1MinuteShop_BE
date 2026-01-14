import type { Context, Next } from "hono";

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    // Log the error for debugging
    console.error("Unhandled error:", err);
    // Respond with a generic error message
    return c.json(
      {
        success: false,
        message: err?.message || "Internal Server Error",
      },
      500
    );
  }
};
