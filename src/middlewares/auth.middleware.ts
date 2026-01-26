
import type { Context, Next } from "hono";
import { StoreOwnerService } from "../services/storeOwner.service.js";

const storeOwnerService = new StoreOwnerService();

export const authMiddleware = async (c: Context, next: Next) => {
  console.log("\n========== AUTH MIDDLEWARE DEBUG ==========");
  
  let token: string | undefined;
  const authHeader = c.req.header("Authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookieHeader = c.req.header("Cookie");
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          return [name, rest.join("=")];
        })
      );
      token = cookies["accessToken"];
    }
  }

  console.log("[TOKEN] Received token:", token ? "✓ yes" : "✗ no");
  if (token) {
    console.log("[TOKEN] First 50 chars:", token.substring(0, 50));
    console.log("[TOKEN] Length:", token.length);
  }

  if (!token) {
    return c.json({ error: "Unauthorized - no token" }, 401);
  }

  console.log("[VERIFY] Attempting to verify token...");
  const decoded = storeOwnerService.verifyAccessToken(token);
  
  if (!decoded) {
    console.log("[VERIFY] ✗ Token verification failed");
    console.log("[VERIFY] JWT_SECRET available:", !!process.env.JWT_SECRET);
    console.log("[VERIFY] JWT_SECRET length:", process.env.JWT_SECRET?.length || 0);
    console.log("=========================================\n");
    return c.json({ error: "Invalid token" }, 401);
  }

  console.log("[VERIFY] ✓ Token valid - User:", decoded.id);
  console.log("=========================================\n");
  c.set("user", decoded);
  await next();
};