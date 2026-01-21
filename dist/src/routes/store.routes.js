import { Hono } from "hono";
import { StoreController } from "../controllers/store.controller.js";
const storeController = new StoreController();
const storeRoutes = new Hono();
storeRoutes.post("/check-subdomain", (c) => storeController.checkSubDomain(c));
export default storeRoutes;
