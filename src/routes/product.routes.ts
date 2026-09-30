import { Hono } from "hono";
import { ProductController } from "../controllers/product.controller.js";
import { authMiddleware, requireSelf } from "../middlewares/auth.middleware.js";

const productRoutes = new Hono();
const productController = new ProductController();

// POST - Create product by storeOwnerId
productRoutes.post("/store/:storeOwnerId", authMiddleware, requireSelf("storeOwnerId"), (c) => productController.createProduct(c));

// GET - Get all products by storeOwnerId
productRoutes.get("/store/:storeOwnerId", authMiddleware, requireSelf("storeOwnerId"), (c) => productController.getStoreProducts(c));

// GET - Get all products by store subdomain (public)
productRoutes.get("/subdomain/:subdomain", (c) => productController.getProductsBySubdomain(c));

// GET - Search products
productRoutes.get("/search", (c) => productController.searchProducts(c));

// GET - Get single product
productRoutes.get("/:productId", (c) => productController.getProduct(c));

// PATCH - Update product
productRoutes.patch("/:productId/store/:storeOwnerId", authMiddleware, requireSelf("storeOwnerId"), (c) => productController.updateProduct(c));

// DELETE - Delete product
productRoutes.delete("/:productId/store/:storeOwnerId", authMiddleware, requireSelf("storeOwnerId"), (c) => productController.deleteProduct(c));

// PATCH - Toggle product status (active/inactive)
productRoutes.patch("/:productId/status", authMiddleware, (c) => productController.toggleStatus(c));

// PATCH - Update product stock
productRoutes.patch("/:productId/stock", authMiddleware, (c) => productController.updateStock(c));

export default productRoutes;
