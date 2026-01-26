import { Hono } from "hono";
import { StoreOwnerController } from "../controllers/storeOwner.controller.js";
import {
  createStoreOwnerSchema,
  loginSchema,
} from "../validators/storeOwner.valadator.js";
import { validate } from "../validators/validation.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const storeOwnerRoutes = new Hono();
const controller = new StoreOwnerController();

// POST /api/store-owners/register
storeOwnerRoutes.post("/register", validate(createStoreOwnerSchema), (c) =>
  controller.register(c)
);

// POST /api/store-owners/login
storeOwnerRoutes.post("/login", validate(loginSchema), (c) =>
  controller.login(c)
);

// POST /api/store-owners/refresh - Refresh access token
storeOwnerRoutes.post("/refresh", (c) => controller.refresh(c));

// POST /api/store-owners/logout - Logout
storeOwnerRoutes.post("/logout", authMiddleware, (c) => controller.logout(c));

// GET /api/store-owners/me - Get authenticated user profile
storeOwnerRoutes.get("/me", authMiddleware, (c) => controller.getProfile(c));

// GET /api/store-ownerxs/:id - Get store owner by ID (public)
storeOwnerRoutes.get("/:id", (c) => controller.getProfileById(c));

// In routes file
storeOwnerRoutes.post("/verify-subdomain", (c) => controller.subDomain(c));


export default storeOwnerRoutes;
