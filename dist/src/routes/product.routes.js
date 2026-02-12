import { Hono } from "hono";
import { ProductController } from "../controllers/product.controller.js";
const productRoutes = new Hono();
const productController = new ProductController();
// POST - Create product by storeOwnerId
productRoutes.post("/store/:storeOwnerId", (c) => productController.createProduct(c));
// GET - Get all products by storeOwnerId
productRoutes.get("/store/:storeOwnerId", (c) => productController.getStoreProducts(c));
// GET - Get all products by store subdomain (public)
productRoutes.get("/subdomain/:subdomain", (c) => productController.getProductsBySubdomain(c));
// GET - Get single product
productRoutes.get("/:productId", (c) => productController.getProduct(c));
// PUT - Update product
productRoutes.put("/:productId", (c) => productController.updateProduct(c));
// DELETE - Delete product
productRoutes.delete("/:productId", (c) => productController.deleteProduct(c));
// PATCH - Toggle product status (active/inactive)
productRoutes.patch("/:productId/status", (c) => productController.toggleStatus(c));
// PATCH - Update product stock
productRoutes.patch("/:productId/stock", (c) => productController.updateStock(c));
// GET - Search products
productRoutes.get("/search", (c) => productController.searchProducts(c));
export default productRoutes;
