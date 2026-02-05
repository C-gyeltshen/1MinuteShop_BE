import { CustomerRepositiory } from "../repositories/customer.repository.js";
const customerRepository = new CustomerRepositiory();
export class CustomerService {
    async createCustomer(data) {
        const validateStoreOwner = await customerRepository.findByStoreOwnerId(data.storeOwnerId);
        if (!validateStoreOwner) {
            throw {
                statusCode: 404,
                message: "Store Owner Id not found"
            };
        }
        const validateCustomerEmail = await customerRepository.findCustomerByEmail(data.email);
        if (validateCustomerEmail) {
            console.log(`Customer with the email ${data.email} already exist`);
        }
        else {
            const createCustomer = await customerRepository.create(data);
            if (!createCustomer) {
                throw {
                    statusCode: 404,
                    message: 'Error creating customer record'
                };
            }
            else {
                return {
                    success: true,
                    data: data
                };
            }
        }
    }
}
