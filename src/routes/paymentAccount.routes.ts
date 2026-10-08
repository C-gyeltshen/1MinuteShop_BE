import { Hono } from "hono";
import { PaymentAccountController } from "../controllers/paymentAccount.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../validators/validation.js";
import { upsertPaymentAccountSchema } from "../validators/paymentAccount.valadator.js";

const paymentAccountRoutes = new Hono();
const controller = new PaymentAccountController();

// GET /api/payment-account/public/:subDomain - customers: where to send payment (404/409 if none)
paymentAccountRoutes.get("/public/:subDomain", (c) => controller.getPublic(c));

// GET /api/payment-account - owner: my account (data is null until added)
paymentAccountRoutes.get("/", authMiddleware, (c) => controller.getMine(c));

// PUT /api/payment-account - owner: add or replace my account
paymentAccountRoutes.put("/", authMiddleware, validate(upsertPaymentAccountSchema), (c) =>
  controller.saveMine(c),
);

export default paymentAccountRoutes;
