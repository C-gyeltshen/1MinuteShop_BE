import { CustomerService } from "../services/customer.service.js";
import { ZodError } from "zod";
import { CreateCustomerSchema, UpdateCustomerSchema, UUIDSchema } from "../validators/customer.validation.js";
const customerService = new CustomerService();
export class CustomerController {
    /**
     * Create a new customer
     * POST /api/customers
     */
    async createCustomer(c) {
        try {
            const body = await c.req.json();
            // Validate request body
            const validatedData = CreateCustomerSchema.parse(body);
            const result = await customerService.createCustomer(validatedData);
            return c.json({
                success: result.success,
                message: result.message,
                data: result.data,
            }, 201);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Validation error",
                    // Fixed: use 'issues' instead of 'errors'
                    errors: error.issues.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Get all customers with pagination
     * GET /api/customers?page=1&limit=10&search=&sortBy=createdAt&sortOrder=desc
     */
    /**
     * Get customer by ID
     * GET /api/customers/:id
     */
    async getCustomerById(c) {
        try {
            const customerId = c.req.param("id");
            // Validate UUID
            UUIDSchema.parse(customerId);
            const result = await customerService.getCustomerById(customerId);
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid customer ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Update customer
     * PUT /api/customers/:id
     */
    async updateCustomer(c) {
        try {
            const customerId = c.req.param("id");
            const body = await c.req.json();
            // Validate UUID
            UUIDSchema.parse(customerId);
            // Validate request body
            const validatedData = UpdateCustomerSchema.parse(body);
            const result = await customerService.updateCustomer(customerId, validatedData);
            return c.json({
                success: result.success,
                message: result.message,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Validation error",
                    // Fixed: use 'issues' instead of 'errors'
                    errors: error.issues.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Delete customer
     * DELETE /api/customers/:id
     */
    async deleteCustomer(c) {
        try {
            const customerId = c.req.param("id");
            // Validate UUID
            UUIDSchema.parse(customerId);
            const result = await customerService.deleteCustomer(customerId);
            return c.json({
                success: result.success,
                message: result.message,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid customer ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Get customer statistics
     * GET /api/customers/:id/stats
     */
    async getCustomerStats(c) {
        try {
            const customerId = c.req.param("id");
            // Validate UUID
            UUIDSchema.parse(customerId);
            const result = await customerService.getCustomerStats(customerId);
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid customer ID format",
                }, 400);
            }
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
    /**
     * Search customer by email
     * GET /api/customers/search/email?email=test@example.com
     */
    async searchCustomerByEmail(c) {
        try {
            const email = c.req.query("email");
            if (!email) {
                return c.json({
                    success: false,
                    message: "Email query parameter is required",
                }, 400);
            }
            const result = await customerService.searchCustomerByEmail(email);
            return c.json({
                success: result.success,
                data: result.data,
            }, 200);
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            return c.json({
                success: false,
                message: error.message || "Internal server error",
            }, statusCode);
        }
    }
}
