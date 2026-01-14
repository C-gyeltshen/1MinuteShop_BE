import { StoreOwnerService } from "../services/storeOwner.service.js";
import { StoreOwnerStatus } from "../types/storeOwner.types.js";
const storeOwnerService = new StoreOwnerService();
function buildCookieAttributes(c, maxAgeSeconds) {
    const reqUrl = new URL(c.req.url);
    const origin = c.req.header("origin");
    const isHttps = reqUrl.protocol === "https:" ||
        (origin ? origin.startsWith("https://") : false);
    // Determine cross-site by comparing origins (scheme+host+port)
    let isCrossSite = false;
    try {
        if (origin) {
            const backendOrigin = `${reqUrl.protocol}//${reqUrl.host}`;
            isCrossSite = origin !== backendOrigin;
        }
    }
    catch {
        isCrossSite = false;
    }
    // SameSite strategy: use None only when cross-site over HTTPS; else Lax
    const sameSite = isCrossSite && isHttps ? "None" : "Lax";
    const secure = isHttps ? "Secure; " : "";
    return `HttpOnly; ${secure}SameSite=${sameSite}; Path=/; Max-Age=${maxAgeSeconds}`;
}
export class StoreOwnerController {
    async register(c) {
        try {
            const data = c.get("validatedData");
            const owner = await storeOwnerService.register({
                ...data,
                status: StoreOwnerStatus.ACTIVE,
            });
            // Auto-login after successful registration
            try {
                const { accessToken, refreshToken, user } = await storeOwnerService.login(data.email, data.password);
                const accessAttrs = buildCookieAttributes(c, 30 * 24 * 60 * 60); // 30 days
                const refreshAttrs = buildCookieAttributes(c, 6 * 30 * 24 * 60 * 60); // 180 days
                // Set HttpOnly cookies
                c.header("Set-Cookie", `accessToken=${accessToken}; ${accessAttrs}`);
                c.header("Set-Cookie", `refreshToken=${refreshToken}; ${refreshAttrs}`, { append: true });
                return c.json({ success: true, data: user }, 201);
            }
            catch (loginError) {
                console.error("Auto-login failed after registration:", loginError);
                // Registration succeeded but auto-login failed, return user data anyway
                return c.json({
                    success: true,
                    data: owner,
                    warning: "Registration successful but auto-login failed. Please login manually.",
                }, 201);
            }
        }
        catch (error) {
            return c.json({ success: false, error: error?.message || "Registration failed" }, 400);
        }
    }
    // Get store owner by ID
    async getById(c) {
        try {
            const id = c.req.param("id");
            const owner = await storeOwnerService.getById(id);
            if (!owner) {
                return c.json({ success: false, error: "Store owner not found" }, 404);
            }
            return c.json({ success: true, data: owner }, 200);
        }
        catch (error) {
            return c.json({
                success: false,
                error: error?.message || "Error fetching store owner",
            }, 400);
        }
    }
    // Update store owner
    async update(c) {
        try {
            const id = c.req.param("id");
            const data = c.get("validatedData");
            const updatedOwner = await storeOwnerService.update(id, data);
            return c.json({ success: true, data: updatedOwner }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error?.message || "Update failed" }, 400);
        }
    }
    // Delete store owner
    async delete(c) {
        try {
            const id = c.req.param("id");
            await storeOwnerService.delete(id);
            return c.json({ success: true, message: "Store owner deleted" }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error?.message || "Delete failed" }, 400);
        }
    }
    // Login
    async login(c) {
        try {
            const { email, password } = c.get("validatedData");
            const { accessToken, refreshToken, user } = await storeOwnerService.login(email, password);
            const accessAttrs = buildCookieAttributes(c, 30 * 24 * 60 * 60); // 30 days
            const refreshAttrs = buildCookieAttributes(c, 6 * 30 * 24 * 60 * 60); // 180 days
            // Set HttpOnly cookies
            c.header("Set-Cookie", `accessToken=${accessToken}; ${accessAttrs}`);
            c.header("Set-Cookie", `refreshToken=${refreshToken}; ${refreshAttrs}`, {
                append: true,
            });
            return c.json({ success: true, data: user }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 401);
        }
    }
    // Refresh token
    async refresh(c) {
        try {
            const cookies = c.req.header("Cookie");
            const refreshToken = this.extractCookie(cookies, "refreshToken");
            if (!refreshToken) {
                return c.json({ success: false, error: "No refresh token" }, 401);
            }
            const { accessToken, user } = await storeOwnerService.refresh(refreshToken);
            // Set new access token cookie
            const accessAttrs = buildCookieAttributes(c, 30 * 24 * 60 * 60);
            c.header("Set-Cookie", `accessToken=${accessToken}; ${accessAttrs}`);
            return c.json({ success: true, data: user }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 401);
        }
    }
    // Logout
    async logout(c) {
        try {
            const user = c.get("user");
            await storeOwnerService.logout(user.id);
            // Clear cookies
            const accessAttrs = buildCookieAttributes(c, 0);
            const refreshAttrs = buildCookieAttributes(c, 0);
            c.header("Set-Cookie", `accessToken=; ${accessAttrs}`);
            c.header("Set-Cookie", `refreshToken=; ${refreshAttrs}`, {
                append: true,
            });
            return c.json({ success: true, message: "Logged out successfully" }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 400);
        }
    }
    // Get profile (authenticated)
    async getProfile(c) {
        try {
            const user = c.get("user"); // Get user from auth middleware
            if (!user.id) {
                return c.json({ success: false, error: "Unauthorized" }, 401);
            }
            const profile = await storeOwnerService.getProfile(user.id);
            return c.json({ success: true, data: profile }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 404);
        }
    }
    // Get profile by ID (public)
    async getProfileById(c) {
        try {
            const id = c.req.param("id");
            const profile = await storeOwnerService.getProfile(id);
            return c.json({ success: true, data: profile }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 404);
        }
    }
    // Helper: Extract cookie from header
    extractCookie(cookieHeader, name) {
        if (!cookieHeader)
            return null;
        const cookies = cookieHeader.split(";");
        for (const cookie of cookies) {
            const [key, value] = cookie.trim().split("=");
            if (key === name)
                return value;
        }
        return null;
    }
}
