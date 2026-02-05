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
        return await prisma.customer.findUnique({
            where: {
                email: customerEmail
            }
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
