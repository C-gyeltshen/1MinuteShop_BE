import { prisma } from "../../lib/prisma.js";
export class CustomerRepository {
    async findCustomerByEmail(data) {
        return await prisma.customer.findUnique({
            where: {
                email: data.email,
            },
            select: {
                customerName: true,
                email: true,
                phoneNumber: true,
            },
        });
    }
    async create(data) {
        return await prisma.customer.create({
            data: {
                customerName: data.customerName,
                email: data.email,
                phoneNumber: data.phoneNumber,
            },
        });
    }
    async findAll() {
        return await prisma.customer.findMany({
            select: {
                id: true, // Assuming you want the ID as well
                customerName: true,
                email: true,
                phoneNumber: true,
                createdAt: true,
            },
        });
    }
    async findCustomerById(customerId) {
        return await prisma.customer.findUnique({
            where: {
                id: customerId,
            },
            select: {
                id: true,
                customerName: true,
            },
        });
    }
}
