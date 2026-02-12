import { prisma } from "../../lib/prisma.js";
export class StoreRepository {
    async findBySubDomain(subDomain) {
        return await prisma.storeOwner.findUnique({
            where: { storeSubdomain: subDomain },
            select: {
                id: true,
                storeSubdomain: true,
                storeName: true,
                status: true
            }
        });
    }
}
