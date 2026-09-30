import type { Context, Next } from "hono";
import { StoreOwnerService } from "../services/storeOwner.service.js";

const storeOwnerService = new StoreOwnerService();

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: No Bearer token provided" }, 401);
  }

  const token = authHeader.slice(7);
  const decoded = storeOwnerService.verifyAccessToken(token);
  
  if (!decoded) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("user", decoded);
  await next();
};

/**
 * Requires the authenticated user's id to match the given route param
 * (e.g. /store/:storeOwnerId). Must run after authMiddleware.
 */
export const requireSelf = (paramName: string) => async (c: Context, next: Next) => {
  const user = c.get("user");

  if (!user || c.req.param(paramName) !== user.id) {
    return c.json({ error: "Forbidden: you can only access your own store" }, 403);
  }

  await next();
};
