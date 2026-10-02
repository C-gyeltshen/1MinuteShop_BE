import { Hono } from "hono";
import { SubscriptionController } from "../controllers/subscription.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const subscriptionRoutes = new Hono();
const controller = new SubscriptionController();

subscriptionRoutes.use("*", authMiddleware);

// GET  /api/subscription           - trial / paid status, price, whether a payment is pending
subscriptionRoutes.get("/", (c) => controller.getStatus(c));
// GET  /api/subscription/payments  - my payment history
subscriptionRoutes.get("/payments", (c) => controller.listMine(c));
// POST /api/subscription/payments  - submit screenshot (multipart)
subscriptionRoutes.post("/payments", (c) => controller.submitPayment(c));

export default subscriptionRoutes;
