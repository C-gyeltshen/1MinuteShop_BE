import { CustomerRepository } from "../repositories/customer.repository.js";
const customerRepository = new CustomerRepository();
export class CustomerService {
    /**
     * Create a new customer
     */
    async createCustomer(data) {
        // Check if customer with email already exists
        const existingCustomer = await customerRepository.findCustomerByEmail(data.email);
        if (existingCustomer) {
            throw {
                statusCode: 409,
                message: `Customer with email ${data.email} already exists`,
                data: existingCustomer,
            };
        }
        // Create the customer
        const customer = await customerRepository.create(data);
        if (!customer) {
            throw {
                statusCode: 500,
                message: "Error creating customer record",
            };
        }
        return {
            success: true,
            statusCode: 201,
            message: "Customer created successfully",
            data: customer,
        };
    }
    /**
     * Get customer by ID with details
     */
    async getCustomerById(customerId) {
        const customer = await customerRepository.findCustomerById(customerId);
        if (!customer) {
            throw {
                statusCode: 404,
                message: "Customer not found",
            };
        }
        return {
            success: true,
            statusCode: 200,
            data: customer,
        };
    }
    /**
     * Get all customers with pagination
     */
    async getAllCustomers(params) {
        const result = await customerRepository.findAll(params);
        return {
            success: true,
            statusCode: 200,
            data: result,
        };
    }
    /**
     * Update customer information
     */
    async updateCustomer(customerId, data) {
        // Check if customer exists
        const existingCustomer = await customerRepository.findCustomerById(customerId);
        if (!existingCustomer) {
            throw {
                statusCode: 404,
                message: "Customer not found",
            };
        }
        // If email is being updated, check if it's already taken by another customer
        if (data.email && data.email !== existingCustomer.email) {
            const customerWithEmail = await customerRepository.findCustomerByEmail(data.email);
            if (customerWithEmail && customerWithEmail.id !== customerId) {
                throw {
                    statusCode: 409,
                    message: `Email ${data.email} is already taken by another customer`,
                };
            }
        }
        // Update the customer
        const updatedCustomer = await customerRepository.update(customerId, data);
        return {
            success: true,
            statusCode: 200,
            message: "Customer updated successfully",
            data: updatedCustomer,
        };
    }
    /**
     * Delete a customer
     */
    async deleteCustomer(customerId) {
        // Check if customer exists
        const customer = await customerRepository.findCustomerById(customerId);
        if (!customer) {
            throw {
                statusCode: 404,
                message: "Customer not found",
            };
        }
        // Check if customer has orders
        const hasOrders = await customerRepository.hasOrders(customerId);
        if (hasOrders) {
            throw {
                statusCode: 400,
                message: "Cannot delete customer with existing orders. Please delete or reassign orders first.",
            };
        }
        // Delete the customer
        await customerRepository.delete(customerId);
        return {
            success: true,
            statusCode: 200,
            message: "Customer deleted successfully",
        };
    }
    /**
     * Get customer statistics
     */
    async getCustomerStats(customerId) {
        const customer = await customerRepository.findCustomerById(customerId);
        if (!customer) {
            throw {
                statusCode: 404,
                message: "Customer not found",
            };
        }
        const stats = await customerRepository.getCustomerStats(customerId);
        return {
            success: true,
            statusCode: 200,
            data: stats,
        };
    }
    /**
     * Search customers by email
     */
    async searchCustomerByEmail(email) {
        const customer = await customerRepository.findCustomerByEmail(email);
        if (!customer) {
            throw {
                statusCode: 404,
                message: "Customer not found",
            };
        }
        return {
            success: true,
            statusCode: 200,
            data: customer,
        };
    }
}
