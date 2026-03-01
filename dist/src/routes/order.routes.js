import { Hono } from "hono";
import { OrderController } from "../controllers/order.controller.js";
const orderRoutes = new Hono();
const orderController = new OrderController();
// POST - Create order
orderRoutes.post("/", (c) => orderController.createOrder(c));
// GET - Get all orders
orderRoutes.get("/", (c) => orderController.getAllOrder(c));
// GET - Get order by store owner id
orderRoutes.get("/:id", (c) => orderController.getOrder(c));
// PATCH - Update order status
orderRoutes.patch("/:id/status", (c) => orderController.updateOrderStatus(c));
// PATCH - Update payment status
orderRoutes.patch("/:id/payment-status", (c) => orderController.updatePaymentStatus(c));
export default orderRoutes;
