import { Hono } from "hono";
import { OrderController } from "../controllers/order.controller.js";
const orderRoutes = new Hono();
const orderController = new OrderController();
// GET api/orders/store-owner/:storeOwnerId
orderRoutes.get("/store-owner/:storeOwnerId", (c) => orderController.getOrdersByStoreOwner(c));
// POST api/orders
orderRoutes.post("/", (c) => orderController.createOrder(c));
// PATCH api/orders/:orderId/status
orderRoutes.patch("/:orderId/status", (c) => orderController.updateOrderStatus(c));
export default orderRoutes;
