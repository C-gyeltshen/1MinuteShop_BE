import { Hono } from "hono";
import { SubscriptionController } from "../controllers/subscription.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/subscription.middleware.js";

const adminRoutes = new Hono();
const controller = new SubscriptionController();

adminRoutes.use("*", authMiddleware, requireAdmin);

// GET   /api/admin/subscription-payments?status=PENDING
adminRoutes.get("/subscription-payments", (c) => controller.adminList(c));
// PATCH /api/admin/subscription-payments/:id/approve
adminRoutes.patch("/subscription-payments/:id/approve", (c) => controller.approve(c));
// PATCH /api/admin/subscription-payments/:id/reject   { reason }
adminRoutes.patch("/subscription-payments/:id/reject", (c) => controller.reject(c));

export default adminRoutes;
