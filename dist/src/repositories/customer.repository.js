import { prisma } from "../../lib/prisma.js";
export class CustomerRepositiory {
    async findByStoreOwnerId(storeOwnerId) {
        return await prisma.storeOwner.findUnique({
            where: {
                id: storeOwnerId,
            },
        });
    }
    async findCustomerByEmail(customerEmail) {
        // Changed findUnique to findFirst to resolve the type incompatibility 
        // where 'email' was not recognized as a sufficient unique selector.
        return await prisma.customer.findFirst({
            where: {
                email: customerEmail,
            },
        });
    }
    async create(data) {
        return await prisma.customer.create({
            data: {
                customerName: data.customerName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                address: data.address,
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
            },
        });
    }
}
