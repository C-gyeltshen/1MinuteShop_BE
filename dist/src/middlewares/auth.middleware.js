import { StoreOwnerService } from "../services/storeOwner.service.js";
import { StoreOwnerRepository } from "../repositories/storeOwner.repository.js";
const storeOwnerService = new StoreOwnerService();
const storeOwnerRepository = new StoreOwnerRepository();
export const authMiddleware = async (c, next) => {
    let token;
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
    }
    else {
        // Try to get token from cookies
        const cookieHeader = c.req.header("Cookie");
        if (cookieHeader) {
            const cookies = Object.fromEntries(cookieHeader.split(";").map((cookie) => {
                const [name, ...rest] = cookie.trim().split("=");
                return [name, rest.join("=")];
            }));
            token = cookies["accessToken"];
        }
    }
    if (!token) {
        return c.json({ error: "Unauthorized - No token provided" }, 401);
    }
    // Verify JWT signature and expiry
    const decoded = storeOwnerService.verifyAccessToken(token);
    if (!decoded) {
        return c.json({ error: "Invalid or expired token" }, 401);
    }
    // NEW: Check if token is revoked in database
    try {
        const isValid = await storeOwnerRepository.isAccessTokenValid(decoded.id, token);
        if (!isValid) {
            return c.json({ error: "Token has been revoked" }, 401);
        }
    }
    catch (error) {
        console.error("Token validation error:", error);
        return c.json({ error: "Token validation failed" }, 401);
    }
    c.set("user", decoded);
    await next();
};
