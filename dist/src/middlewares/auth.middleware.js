import { StoreOwnerService } from "../services/storeOwner.service.js";
const storeOwnerService = new StoreOwnerService();
export const authMiddleware = async (c, next) => {
    console.log("\n" + "=".repeat(60));
    console.log("[AUTH MIDDLEWARE] Starting authentication check");
    console.log("=".repeat(60));
    console.log(`[AUTH] Request URL: ${c.req.url}`);
    console.log(`[AUTH] Request Method: ${c.req.method}`);
    // Log all headers
    console.log("[AUTH] All headers received:");
    const headerNames = ["authorization", "cookie", "origin", "referer", "user-agent"];
    headerNames.forEach(name => {
        const value = c.req.header(name);
        if (value) {
            console.log(`  ${name}: ${value.substring(0, 100)}`);
        }
    });
    let token;
    // Check Authorization header first
    const authHeader = c.req.header("Authorization");
    console.log(`[AUTH] Authorization header: ${authHeader ? "✓ present" : "✗ missing"}`);
    if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
        console.log("[AUTH] Token extracted from Authorization header");
    }
    else {
        // Try to get token from cookies
        const cookieHeader = c.req.header("Cookie");
        console.log(`[AUTH] Cookie header: ${cookieHeader ? "✓ present" : "✗ missing"}`);
        if (cookieHeader) {
            console.log(`[AUTH] Raw cookie header: ${cookieHeader}`);
            const cookies = Object.fromEntries(cookieHeader.split(";").map((cookie) => {
                const [name, ...rest] = cookie.trim().split("=");
                return [name, rest.join("=")];
            }));
            console.log(`[AUTH] Parsed cookies:`, Object.keys(cookies));
            token = cookies["accessToken"];
            if (token) {
                console.log(`[AUTH] accessToken found in cookies`);
                console.log(`[AUTH] Token starts with: ${token.substring(0, 50)}`);
                console.log(`[AUTH] Token length: ${token.length}`);
            }
            else {
                console.log(`[AUTH] accessToken NOT found in cookies. Available keys:`, Object.keys(cookies));
            }
        }
        else {
            console.log("[AUTH] No Cookie header found");
        }
    }
    console.log(`[AUTH] Final token status: ${token ? "✓ FOUND" : "✗ NOT FOUND"}`);
    if (!token) {
        console.log("[AUTH] ✗ FAILED - No token provided");
        console.log("=".repeat(60) + "\n");
        return c.json({ error: "Unauthorized - no token provided" }, 401);
    }
    // Attempt to verify token
    console.log("[AUTH] Attempting to verify token...");
    const decoded = storeOwnerService.verifyAccessToken(token);
    if (!decoded) {
        console.log("[AUTH] ✗ FAILED - Token verification returned null");
        console.log(`[AUTH] JWT_SECRET env var: ${process.env.JWT_SECRET ? "✓ SET" : "✗ NOT SET"}`);
        console.log("=".repeat(60) + "\n");
        return c.json({ error: "Invalid token" }, 401);
    }
    console.log("[AUTH] ✓ SUCCESS - Token verified");
    console.log(`[AUTH] User ID: ${decoded.id}`);
    console.log(`[AUTH] Store Name: ${decoded.storeName}`);
    console.log("=".repeat(60) + "\n");
    c.set("user", decoded);
    await next();
};
