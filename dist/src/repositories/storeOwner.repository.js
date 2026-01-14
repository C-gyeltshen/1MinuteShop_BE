import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcrypt";
export class StoreOwnerRepository {
    async create(data) {
        return await prisma.storeOwner.create({
            data: {
                storeName: data.storeName,
                ownerName: data.ownerName,
                email: data.email,
                password: data.password,
                status: "ACTIVE",
            },
        });
    }
    async findById(id) {
        return await prisma.storeOwner.findUnique({
            where: {
                id: id,
            },
        });
    }
    async findByEmail(email) {
        return await prisma.storeOwner.findUnique({
            where: { email },
        });
    }
    async findByStoreName(storeName) {
        return await prisma.storeOwner.findUnique({
            where: { storeName },
        });
    }
    async findAll() {
        return await prisma.storeOwner.findMany();
    }
    async update(id, data) {
        // Remove undefined fields to avoid overwriting with undefined
        const updateData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        return await prisma.storeOwner.update({
            where: { id },
            data: updateData,
        });
    }
    async updateStoreSubDomain(id, storeSubdomain) {
        return await prisma.storeOwner.update({
            where: { id },
            data: { storeSubdomain },
        });
    }
    async updateStoreUrl(id, storeUrl) {
        return await prisma.storeOwner.update({
            where: { id },
            data: { storeUrl },
        });
    }
    async delete(id) {
        return await prisma.storeOwner.delete({
            where: { id },
        });
    }
    ///////login
    async findByEmailWithPassword(email) {
        if (!email) {
            throw new Error("Phone number is required");
        }
        const useremail = email;
        console.log("email : ", email);
        return await prisma.storeOwner.findUnique({
            where: {
                email: useremail, // This will now be recognized!
            },
            select: {
                id: true,
                storeName: true,
                ownerName: true,
                email: true,
                password: true,
                storeSubdomain: true,
            },
        });
    }
    async setLastLogin(id, date) {
        return await prisma.storeOwner.update({
            where: { id },
            data: { lastLoginAt: date },
        });
    }
    async saveRefreshToken(storeOwnerId, token, expiresAt) {
        const tokenHash = await bcrypt.hash(token, 10);
        return await prisma.refreshToken.create({
            data: {
                storeOwnerId,
                tokenHash,
                expiresAt,
            },
        });
    }
    async saveAccessToken(storeOwnerId, refreshTokenId, token, expiresAt) {
        const tokenHash = await bcrypt.hash(token, 10);
        await prisma.token.create({
            data: {
                storeOwnerId,
                RefreshTokenId: refreshTokenId,
                tokenHash,
                expiresAt,
            },
        });
    }
    async findRefreshToken(storeOwnerId, token) {
        const refreshTokens = await prisma.refreshToken.findMany({
            where: {
                storeOwnerId,
                revoked: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        for (const rt of refreshTokens) {
            const isValid = await bcrypt.compare(token, rt.tokenHash);
            if (isValid) {
                return rt;
            }
        }
        return null;
    }
    async revokeRefreshToken(tokenHash) {
        return await prisma.refreshToken.update({
            where: { id: tokenHash },
            data: { revoked: true },
        });
    }
    async revokeAllRefreshTokens(storeOwnerId) {
        return await prisma.refreshToken.updateMany({
            where: { storeOwnerId },
            data: { revoked: true },
        });
    }
}
