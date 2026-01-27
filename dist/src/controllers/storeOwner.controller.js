import { StoreOwnerService } from "../services/storeOwner.service.js";
import { StoreOwnerStatus } from "../types/storeOwner.types.js";
const storeOwnerService = new StoreOwnerService();
export class StoreOwnerController {
    async register(c) {
        try {
            const data = c.get("validatedData");
            const owner = await storeOwnerService.register({
                ...data,
                status: StoreOwnerStatus.ACTIVE,
            });
            const { accessToken, refreshToken, user } = await storeOwnerService.login(data.email, data.password);
            // Return tokens in body instead of cookies
            return c.json({
                success: true,
                data: { user, accessToken, refreshToken },
            }, 201);
        }
        catch (error) {
            // ... error handling
        }
    }
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
    async subDomain(c) {
        try {
            const { subDomain } = await c.req.json();
            if (!subDomain) {
                return c.json({ success: false, error: "Subdomain is required" }, 400);
            }
            const result = await storeOwnerService.verifyStoreSubDomain(subDomain);
            return c.json({ success: true, data: result }, 200);
        }
        catch (error) {
            return c.json({
                success: false,
                error: error?.message || "Error verifying subdomain",
            }, 400);
        }
    }
    async login(c) {
        try {
            const { email, password } = c.get("validatedData");
            const { accessToken, refreshToken, user } = await storeOwnerService.login(email, password);
            // Return tokens in body
            return c.json({
                success: true,
                data: { user, accessToken, refreshToken },
            }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 401);
        }
    }
    async refresh(c) {
        try {
            // Expect refreshToken in the request body instead of cookies
            const { refreshToken: tokenFromBody } = await c.req.json();
            if (!tokenFromBody) {
                return c.json({ success: false, error: "Refresh token required" }, 401);
            }
            // Fix: Destructure only what the service actually returns
            const { accessToken, user } = await storeOwnerService.refresh(tokenFromBody);
            return c.json({
                success: true,
                data: {
                    user,
                    accessToken,
                    refreshToken: tokenFromBody, // Return the existing refresh token back to the client
                },
            }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 401);
        }
    }
    async logout(c) {
        try {
            const user = c.get("user");
            await storeOwnerService.logout(user.id);
            // No cookies to clear anymore
            return c.json({ success: true, message: "Logged out successfully" }, 200);
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 400);
        }
    }
    async getProfile(c) {
        try {
            const user = c.get("user");
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
