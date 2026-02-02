import { Hono } from "hono";
import storeOwnerRoutes from "./storeOwner.routes.js";
import productRoutes from "./product.routes.js";
import storeRoutes from "./store.routes.js";
import uploadRoutes from "./imageUpload.routes.js";
import orderRoutes from "./order.routes.js";

const router = new Hono();

// Register all routes

router.route("/store-owners", storeOwnerRoutes);
router.route("/products", productRoutes)
router.route("/stores", storeRoutes);
router.route('/upload', uploadRoutes);
router.route('/orders', orderRoutes);
export default router;
