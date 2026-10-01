import { CustomerRepository } from "../repositories/customer.repository.js";
import type { CreateCustomerInput } from "../types/customer.types.js";

const customerRepository =new CustomerRepository();
export class CustomerService{
    async CreateCustomer(data: CreateCustomerInput){
        const existing = await customerRepository.findCustomerByEmail(data)
        if (existing){
            return {
                statusCode: 200,
                data: existing
            }
        }

        const createCustomer = await customerRepository.create(data)
        if (createCustomer){
            return {
                statusCode: 201,
                data: createCustomer
            }
        }

        return {
            statusCode: 500,
            message: "Error creating customer"
        }
    }

    async GetAllCustomers() {
        const customers = await customerRepository.findAll();
        
        if (!customers) {
            return {
                statusCode: 404,
                message: "No customers found",
                data: []
            };
        }

        return {
            statusCode: 200,
            data: customers
        };
    }
}