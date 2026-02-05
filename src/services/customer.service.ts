import { CustomerRepositiory } from "../repositories/customer.repository.js";
import type { CreateCustomerInput } from "../types/customer.types.js";

const customerRepository = new CustomerRepositiory();

export class CustomerService{
    async createCustomer(data: CreateCustomerInput){
        const validateCustomerEmail = await customerRepository.findCustomerByEmail(data.email);
        if (validateCustomerEmail){
            console.log(`Customer with the email ${data.email} already exist`)
            return {
                statusCode: 200,
                data: validateCustomerEmail
            }
        }else{
            const createCustomer = await customerRepository.create(data)
            if (!createCustomer){
                throw {
                    statusCode : 404,
                    message: 'Error creating customer record'
                }
            }else{
                return {
                    success: true,
                    data: data
                }
            }
        }
    }    
}