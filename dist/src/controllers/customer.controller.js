import { ZodError } from "zod";
import { CustomerService } from "../services/customer.service.js";
import { createCustomerSchema } from "../validators/customer.validation.js";
const customerService = new CustomerService();
export class CustomerController {
    async createCustomer(c) {
        try {
            const body = await c.req.json();
            // 1. Validate the input data against the schema
            const validatedData = await createCustomerSchema.parseAsync(body);
            // 2. Call the service
            const result = await customerService.CreateCustomer(validatedData);
            // 3. Return successful response
            return c.json(result, result.statusCode);
        }
        catch (error) {
            // Handle Zod Validation Errors
            if (error instanceof ZodError) {
                return c.json({
                    statusCode: 400,
                    message: "Validation Error",
                    errors: error.flatten().fieldErrors
                }, 400);
            }
            // Handle errors thrown by the service (e.g., 409 Conflict)
            if (error.statusCode) {
                return c.json({
                    statusCode: error.statusCode,
                    message: error.message
                }, error.statusCode);
            }
            // Handle unknown server errors
            console.error("Error creating customer:", error);
            return c.json({
                statusCode: 500,
                message: "Internal Server Error"
            }, 500);
        }
    }
    async getAllCustomers(c) {
        try {
            const result = await customerService.GetAllCustomers();
            return c.json(result, result.statusCode);
        }
        catch (error) {
            console.error("Error fetching customers:", error);
            return c.json({
                statusCode: 500,
                message: "Internal Server Error"
            }, 500);
        }
    }
}
