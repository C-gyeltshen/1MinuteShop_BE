import type { Context } from "hono";
import { StoreOwnerService } from "../services/storeOwner.service.js";
import type { CreateStoreOwnerSchema } from "../validators/storeOwner.valadator.js";
import { StoreOwnerStatus } from "../types/storeOwner.types.js";

const storeOwnerService = new StoreOwnerService();

// Set cookies with SameSite=None (no explicit Domain - let browser handle it)
function buildCookieAttributes(maxAgeSeconds: number): string {
  const attrs = `Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAgeSeconds}`;
  console.log(`[COOKIE] Set-Cookie attributes: ${attrs}`);
  return attrs;
}

export class StoreOwnerController {
  async register(c: Context) {
    try {
      const data = c.get("validatedData") as CreateStoreOwnerSchema;
      const owner = await storeOwnerService.register({
        ...data,
        status: StoreOwnerStatus.ACTIVE,
      });

      try {
        const { accessToken, refreshToken, user } =
          await storeOwnerService.login(data.email, data.password);

        const accessAttrs = buildCookieAttributes(30 * 24 * 60 * 60);
        const refreshAttrs = buildCookieAttributes(6 * 30 * 24 * 60 * 60);

        c.header("Set-Cookie", `accessToken=${accessToken}; ${accessAttrs}`);
        c.header(
          "Set-Cookie",
          `refreshToken=${refreshToken}; ${refreshAttrs}`,
          {
            append: true,
          },
        );

        console.log("[REGISTER] Auto-login cookies set successfully");
        return c.json({ success: true, data: user }, 201);
      } catch (loginError: any) {
        console.error("Auto-login failed after registration:", loginError);
        return c.json(
          {
            success: true,
            data: owner,
            warning:
              "Registration successful but auto-login failed. Please login manually.",
          },
          201,
        );
      }
    } catch (error: any) {
      return c.json(
        { success: false, error: error?.message || "Registration failed" },
        400,
      );
    }
  }

  // Get store owner by ID
  async getById(c: Context) {
    try {
      const id = c.req.param("id");
      const owner = await storeOwnerService.getById(id);
      if (!owner) {
        return c.json({ success: false, error: "Store owner not found" }, 404);
      }
      return c.json({ success: true, data: owner }, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error?.message || "Error fetching store owner",
        },
        400,
      );
    }
  }

  // Update store owner
  async update(c: Context) {
    try {
      const id = c.req.param("id");
      const data = c.get("validatedData");
      const updatedOwner = await storeOwnerService.update(id, data);
      return c.json({ success: true, data: updatedOwner }, 200);
    } catch (error: any) {
      return c.json(
        { success: false, error: error?.message || "Update failed" },
        400,
      );
    }
  }

  // Delete store owner
  async delete(c: Context) {
    try {
      const id = c.req.param("id");
      await storeOwnerService.delete(id);
      return c.json({ success: true, message: "Store owner deleted" }, 200);
    } catch (error: any) {
      return c.json(
        { success: false, error: error?.message || "Delete failed" },
        400,
      );
    }
  }

  async subDomain(c: Context) {
    try {
      // Get subdomain from request body
      const { subDomain } = await c.req.json();

      if (!subDomain) {
        return c.json({ success: false, error: "Subdomain is required" }, 400);
      }

      // Verify subdomain existence using the service
      const result = await storeOwnerService.verifyStoreSubDomain(subDomain);

      return c.json({ success: true, data: result }, 200);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error?.message || "Error verifying subdomain",
        },
        400,
      );
    }
  }

  // Login
  async login(c: Context) {
    try {
      const { email, password } = c.get("validatedData") as {
        email: string;
        password: string;
      };

      const { accessToken, refreshToken, user } = await storeOwnerService.login(
        email,
        password,
      );

      const accessAttrs = buildCookieAttributes(30 * 24 * 60 * 60); // 30 days
      const refreshAttrs = buildCookieAttributes(6 * 30 * 24 * 60 * 60); // 180 days

      c.header("Set-Cookie", `accessToken=${accessToken}; ${accessAttrs}`);
      c.header("Set-Cookie", `refreshToken=${refreshToken}; ${refreshAttrs}`, {
        append: true,
      });

      console.log("[LOGIN] ✓ Cookies set successfully");
      console.log(`[LOGIN] Access: accessToken=...; ${accessAttrs}`);
      console.log(`[LOGIN] Refresh: refreshToken=...; ${refreshAttrs}`);

      return c.json({ success: true, data: user }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 401);
    }
  }

  // Refresh token
  async refresh(c: Context) {
    try {
      const cookies = c.req.header("Cookie");
      const refreshToken = this.extractCookie(cookies, "refreshToken");

      if (!refreshToken) {
        return c.json({ success: false, error: "No refresh token" }, 401);
      }

      const { accessToken, user } =
        await storeOwnerService.refresh(refreshToken);

      const accessAttrs = buildCookieAttributes(30 * 24 * 60 * 60);
      c.header("Set-Cookie", `accessToken=${accessToken}; ${accessAttrs}`);

      return c.json({ success: true, data: user }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 401);
    }
  }

  // Logout
  async logout(c: Context) {
    try {
      const user = c.get("user");
      await storeOwnerService.logout(user.id);

      // Clear cookies by setting Max-Age=0
      const clearAttrs = buildCookieAttributes(0);

      c.header("Set-Cookie", `accessToken=; ${clearAttrs}`);
      c.header("Set-Cookie", `refreshToken=; ${clearAttrs}`, {
        append: true,
      });

      return c.json({ success: true, message: "Logged out successfully" }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 400);
    }
  }

  // Get profile (authenticated)
  async getProfile(c: Context) {
    try {
      const user = c.get("user");

      if (!user.id) {
        return c.json({ success: false, error: "Unauthorized" }, 401);
      }

      const profile = await storeOwnerService.getProfile(user.id);
      return c.json({ success: true, data: profile }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 404);
    }
  }

  // Get profile by ID (public)
  async getProfileById(c: Context) {
    try {
      const id = c.req.param("id");
      const profile = await storeOwnerService.getProfile(id);
      return c.json({ success: true, data: profile }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 404);
    }
  }

  // Helper: Extract cookie from header
  private extractCookie(
    cookieHeader: string | undefined,
    name: string,
  ): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";");
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === name) return value;
    }
    return null;
  }
}