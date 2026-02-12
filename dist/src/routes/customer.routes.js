import { Hono } from "hono";
import { CustomerController } from "../controllers/customer.controller.js";
const customerRoute = new Hono();
const customerController = new CustomerController();
// Map POST / to createCustomer
customerRoute.post("/", customerController.createCustomer);
// Map GET / to getAllCustomers
customerRoute.get("/", customerController.getAllCustomers);
export default customerRoute;
