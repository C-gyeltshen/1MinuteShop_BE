import type { Context } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { StoreOwnerService } from "../services/storeOwner.service.js";
import type { CreateStoreOwnerSchema } from "../validators/storeOwner.valadator.js";
import { StoreOwnerStatus } from "../types/storeOwner.types.js";

const IS_PROD = process.env.NODE_ENV === "production";

function setAuthCookies(c: Context, accessToken: string, refreshToken: string) {
  const base = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "None" : "Lax",
    path: "/",
  } as const;

  setCookie(c, "accessToken", accessToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
  setCookie(c, "refreshToken", refreshToken, { ...base, maxAge: 60 * 60 * 24 * 180 });
}

function clearAuthCookies(c: Context) {
  const base = { httpOnly: true, secure: IS_PROD, sameSite: IS_PROD ? "None" : "Lax", path: "/" } as const;
  deleteCookie(c, "accessToken", base);
  deleteCookie(c, "refreshToken", base);
}

const storeOwnerService = new StoreOwnerService();

export class StoreOwnerController {
  async register(c: Context) {
    try {
      const data = c.get("validatedData") as CreateStoreOwnerSchema;
      const owner = await storeOwnerService.register({
        ...data,
        status: StoreOwnerStatus.ACTIVE,
      });

      const { accessToken, refreshToken, user } = await storeOwnerService.login(
        data.email,
        data.password,
      );

      setAuthCookies(c, accessToken, refreshToken);
      return c.json({ success: true, data: { user } }, 201);
    } catch (error: any) {
      // ... error handling
    }
  }

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
      const { subDomain } = await c.req.json();

      if (!subDomain) {
        return c.json({ success: false, error: "Subdomain is required" }, 400);
      }

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

  async login(c: Context) {
    try {
      const { email, password } = c.get("validatedData");
      const { accessToken, refreshToken, user } = await storeOwnerService.login(
        email,
        password,
      );

      setAuthCookies(c, accessToken, refreshToken);
      return c.json({ success: true, data: { user } }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 401);
    }
  }

  async refresh(c: Context) {
    try {
      const tokenFromCookie = getCookie(c, "refreshToken");

      if (!tokenFromCookie) {
        return c.json({ success: false, error: "Refresh token required" }, 401);
      }

      const { accessToken, user } = await storeOwnerService.refresh(tokenFromCookie);

      setCookie(c, "accessToken", accessToken, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: IS_PROD ? "None" : "Lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return c.json({ success: true, data: { user } }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 401);
    }
  }

  async logout(c: Context) {
    try {
      const user = c.get("user");
      await storeOwnerService.logout(user.id);
      clearAuthCookies(c);
      return c.json({ success: true, message: "Logged out successfully" }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 400);
    }
  }

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

  async getProfileById(c: Context) {
    try {
      const id = c.req.param("id");
      const profile = await storeOwnerService.getProfile(id);
      return c.json({ success: true, data: profile }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 404);
    }
  }

  async getStoreData(c: Context){
    try{
      const subDomain = c.req.param("subDomain");
      const result = await storeOwnerService.getStoreData(subDomain);
      return c.json({success: true, data: result }, 200)
    }catch(error: any){
      return c.json({ success: false, error: error.message }, 404);
    }
  }

}
