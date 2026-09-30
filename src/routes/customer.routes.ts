import { Hono } from "hono";
import { CustomerController } from "../controllers/customer.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const customerRoute = new Hono();
const customerController = new CustomerController();

// POST / is public (customer checkout)
customerRoute.post("/", customerController.createCustomer);

// GET / lists customer PII, so it requires a store owner login
customerRoute.get("/", authMiddleware, customerController.getAllCustomers);

export default customerRoute;