import { StoreOwnerRepository } from "../repositories/storeOwner.repository.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
const storeOwnerRepository = new StoreOwnerRepository();
// Environment Variables
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
// Token expiry times
const ACCESS_TOKEN_EXPIRY = "30d"; // 30 days for access token
const REFRESH_TOKEN_EXPIRY = "180d"; // 6 months for refresh token
// Milliseconds for Database Timestamps
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * MS_IN_DAY;
const SIX_MONTHS_MS = 180 * MS_IN_DAY;
export class StoreOwnerService {
    async register(data) {
        const existingEmail = await storeOwnerRepository.findByEmail(data.email);
        if (existingEmail) {
            throw new Error("Email already exists, please try with a new email");
        }
        const existingStoreName = await storeOwnerRepository.findByStoreName(data.storeName);
        if (existingStoreName) {
            throw new Error("Store name taken, try another name");
        }
        const password = await bcrypt.hash(data.password, 10);
        const owner = await storeOwnerRepository.create({ ...data, password });
        if (!owner) {
            throw new Error("Failed to create store owner data");
        }
        // Generate subdomain and URL
        const subDomain = `${owner.storeName.replace(/\s+/g, "").toLowerCase()}`;
        const subDomainUrl = `https://${subDomain}.laso.la`;
        // Update the store subdomain in the database
        await storeOwnerRepository.updateStoreSubDomain(owner.id, subDomain);
        await storeOwnerRepository.updateStoreUrl(owner.id, subDomainUrl);
        // FIXED: Correct field mapping
        return {
            id: owner.id,
            storeName: owner.storeName,
            ownerName: owner.ownerName,
            email: owner.email,
            status: owner.status,
            storeSubdomain: subDomain,
            storeUrl: subDomainUrl
        };
    }
    async getById(id) {
        const owner = await storeOwnerRepository.findById(id);
        if (!owner) {
            throw new Error("Store owner not found");
        }
        return {
            id: owner.id,
            storeName: owner.storeName,
            ownerName: owner.ownerName,
            email: owner.email,
            status: owner.status,
            storeSubdomain: owner.storeSubdomain,
            storeUrl: owner.storeUrl
        };
    }
    async update(id, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        const updatedOwner = await storeOwnerRepository.update(id, data);
        if (!updatedOwner) {
            throw new Error("Store owner not found or update failed");
        }
        return {
            id: updatedOwner.id,
            storeName: updatedOwner.storeName,
            ownerName: updatedOwner.ownerName,
            email: updatedOwner.email,
            status: updatedOwner.status,
            storeSubdomain: updatedOwner.storeSubdomain,
        };
    }
    async delete(id) {
        const deleted = await storeOwnerRepository.delete(id);
        if (!deleted) {
            throw new Error("Store owner not found or delete failed");
        }
        return { success: true };
    }
    async getAll() {
        const allStoreData = await storeOwnerRepository.findAll();
        return allStoreData;
    }
    // FIXED: Correct logic for subdomain verification
    async verifyStoreSubDomain(storeSubDomain) {
        const subDomain = await storeOwnerRepository.findSubDomain(storeSubDomain);
        if (!subDomain) {
            throw new Error("Subdomain does not exist");
        }
        return {
            exists: true,
            storeOwner: {
                id: subDomain.id,
                storeName: subDomain.storeName,
                storeSubdomain: subDomain.storeSubdomain,
                storeUrl: subDomain.storeUrl
            }
        };
    }
    async login(email, password) {
        const owner = await storeOwnerRepository.findByEmailWithPassword(email);
        if (!owner)
            throw new Error("Invalid credentials");
        const valid = await bcrypt.compare(password, owner.password);
        if (!valid)
            throw new Error("Invalid credentials");
        await storeOwnerRepository.setLastLogin(owner.id, new Date());
        // Generate JWTs
        const accessToken = this.generateAccessToken({
            id: owner.id,
            storeName: owner.storeName,
            email: owner.email,
            storeSubdomain: owner.storeSubdomain,
        });
        const refreshToken = this.generateRefreshToken({
            id: owner.id,
            storeName: owner.storeName,
            email: owner.email,
            storeSubdomain: owner.storeSubdomain,
        });
        // Token expiry times
        const accessExpiresAt = new Date(Date.now() + ONE_MONTH_MS);
        const refreshExpiresAt = new Date(Date.now() + SIX_MONTHS_MS);
        // Save tokens to DB
        const refreshTokenRecord = await storeOwnerRepository.saveRefreshToken(owner.id, refreshToken, refreshExpiresAt);
        await storeOwnerRepository.saveAccessToken(owner.id, refreshTokenRecord.id, accessToken, accessExpiresAt);
        return {
            accessToken,
            refreshToken,
            user: {
                id: owner.id,
                storeName: owner.storeName,
                email: owner.email,
                storeSubdomain: owner.storeSubdomain,
            },
        };
    }
    async refresh(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            // Verify token exists in DB and hasn't been revoked/expired
            const isValid = await storeOwnerRepository.findRefreshToken(decoded.id, refreshToken);
            if (!isValid)
                throw new Error("Token revoked or invalid");
            const owner = await storeOwnerRepository.findById(decoded.id);
            if (!owner)
                throw new Error("User inactive");
            // Generate new access token
            const newAccessToken = this.generateAccessToken({
                id: owner.id,
                storeName: owner.storeName,
                email: owner.email,
                storeSubdomain: owner.storeSubdomain
            });
            // Update access token expiry
            const accessExpiresAt = new Date(Date.now() + ONE_MONTH_MS);
            await storeOwnerRepository.saveAccessToken(owner.id, isValid.id, newAccessToken, accessExpiresAt);
            return {
                accessToken: newAccessToken,
                user: {
                    id: owner.id,
                    storeName: owner.storeName,
                    email: owner.email,
                    storeSubdomain: owner.storeSubdomain,
                    createdAt: owner.createdAt,
                },
            };
        }
        catch (error) {
            if (error instanceof Error &&
                (error.message === "Token revoked or invalid" ||
                    error.message === "User inactive")) {
                throw error;
            }
            console.error("JWT Refresh System Error:", error);
            throw new Error("Invalid refresh token", { cause: error });
        }
    }
    async logout(storeOwnerId) {
        await storeOwnerRepository.revokeAllRefreshTokens(storeOwnerId);
        return { success: true };
    }
    async getProfile(id) {
        const owner = await storeOwnerRepository.findById(id);
        if (!owner)
            throw new Error("Store owner not found");
        return {
            id: owner.id,
            storeName: owner.storeName,
            ownerName: owner.ownerName,
            email: owner.email,
            storeSubdomain: owner.storeSubdomain,
            storeUrl: owner.storeUrl,
            createdAt: owner.createdAt,
        };
    }
    generateAccessToken(payload) {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });
    }
    generateRefreshToken(payload) {
        return jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        });
    }
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch {
            return null;
        }
    }
}
