import { CustomerRepository } from "../repositories/customer.repository.js";
import type { CreateCustomerInput } from "../types/customer.types.js";

const customerRepository =new CustomerRepository();
export class CustomerService{
    async CreateCustomer(data: CreateCustomerInput){
        const validateCustomer = await customerRepository.findCustomerByEmail(data)
        if (validateCustomer){
            throw {
                statusCode: 409,
                message: `customer with email : ${validateCustomer.email} already exist`
            }
        }else{
            const createCustomer = await customerRepository.create(data)
            if (createCustomer){
                return{
                    statusCode: 200,
                    data: createCustomer
                }
            }else{
                return {
                    statusCode: 404,
                    message: "Error creating customer"
                }
            }
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