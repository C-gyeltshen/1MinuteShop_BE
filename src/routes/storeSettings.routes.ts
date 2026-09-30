import { Hono } from "hono";
import { StoreSettingsController } from "../controllers/storeSettings.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../validators/validation.js";
import { updateStoreSettingsSchema } from "../validators/storeSettings.valadator.js";

const storeSettingsRoutes = new Hono();
const controller = new StoreSettingsController();

// GET /api/store-settings - Get the authenticated owner's settings
storeSettingsRoutes.get("/", authMiddleware, (c) => controller.getSettings(c));

// PUT /api/store-settings - Create or update the authenticated owner's settings
storeSettingsRoutes.put("/", authMiddleware, validate(updateStoreSettingsSchema), (c) =>
  controller.updateSettings(c),
);

export default storeSettingsRoutes;
