import { Hono } from "hono";
import { OrderController } from "../controllers/order.controller.js";
import { authMiddleware, requireSelf } from "../middlewares/auth.middleware.js";

const orderRoutes = new Hono();
const orderController = new OrderController();

// POST - Create order (public: customer checkout)
orderRoutes.post("/", (c) => orderController.createOrder(c));

// GET - Order confirmation by order id (public: customer success page, limited fields)
orderRoutes.get("/confirmation/:orderId", (c) =>
  orderController.getOrderConfirmation(c),
);

// GET - Get orders by store owner id (owner only)
orderRoutes.get("/:id", authMiddleware, requireSelf("id"), (c) =>
  orderController.getOrder(c),
);

// PATCH - Update order status (owner of the order only)
orderRoutes.patch("/:id/status", authMiddleware, (c) =>
  orderController.updateOrderStatus(c),
);

// PATCH - Update payment status (owner of the order only)
orderRoutes.patch("/:id/payment-status", authMiddleware, (c) =>
  orderController.updatePaymentStatus(c),
);

export default orderRoutes;
