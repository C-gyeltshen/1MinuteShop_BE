import { Hono } from "hono";
import { TelegramController } from "../controllers/telegram.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const telegramRoutes = new Hono();
const controller = new TelegramController();

// POST /api/telegram/webhook - Called by Telegram (secret-token protected, no JWT)
telegramRoutes.post("/webhook", (c) => controller.webhook(c));

// Everything below is for the logged-in store owner
telegramRoutes.get("/status", authMiddleware, (c) => controller.getStatus(c));
telegramRoutes.post("/link", authMiddleware, (c) => controller.createLink(c));
telegramRoutes.patch("/settings", authMiddleware, (c) => controller.updateSettings(c));
telegramRoutes.post("/test", authMiddleware, (c) => controller.sendTest(c));
telegramRoutes.delete("/connection", authMiddleware, (c) => controller.disconnect(c));

export default telegramRoutes;
