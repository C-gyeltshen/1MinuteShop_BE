import { Hono } from "hono";
import storeOwnerRoutes from "./storeOwner.routes.js";
import productRoutes from "./product.routes.js";
import storeRoutes from "./store.routes.js";
const router = new Hono();
// Register all routes
router.route("/store-owners", storeOwnerRoutes);
router.route("/products", productRoutes);
router.route("/stores", storeRoutes);
export default router;
