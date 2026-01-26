import { StoreOwnerRepository } from "../repositories/storeOwner.repository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const storeOwnerRepository = new StoreOwnerRepository();
// Environment Variables
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
}
if (!JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
}
// 1 Month = 30 days | 6 Months = 180 days
const ACCESS_TOKEN_EXPIRY = "30d";
const REFRESH_TOKEN_EXPIRY = "180d";
// Milliseconds for Database Timestamps
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * MS_IN_DAY;
const SIX_MONTHS_MS = 180 * MS_IN_DAY;
export class StoreOwnerService {
    async register(data) {
        const existingEmail = await storeOwnerRepository.findByEmail(data.email);
        if (existingEmail) {
            throw new Error("Email already exist, please try with new Email");
        }
        const existingStoreName = await storeOwnerRepository.findByStoreName(data.storeName);
        if (existingStoreName) {
            throw new Error("Store Name taken try another name");
        }
        const password = await bcrypt.hash(data.password, 10);
        const owner = await storeOwnerRepository.create({ ...data, password });
        if (!owner) {
            throw new Error("Failed to create Store Owner data");
        }
        // Generate or assign the subdomain value here
        const subDomain = `${owner.storeName.replace(/\s+/g, "").toLowerCase()}`;
        const subDomainUrl = `https://${subDomain}.laso.la`;
        // Update the store subdomain in the database
        await storeOwnerRepository.updateStoreSubDomain(owner.id, subDomain);
        await storeOwnerRepository.updateStoreUrl(owner.id, subDomainUrl);
        return {
            id: owner.id,
            storeName: owner.storeName,
            ownerName: owner.ownerName,
            email: owner.email,
            status: owner.status,
            storeSubdomain: subDomainUrl,
            storeUrl: subDomain,
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
        };
    }
    async update(id, data) {
        // If password is being updated, hash it
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
    }
    async verifyStoreSubDomain(storeSubDomain) {
        const subDomain = await storeOwnerRepository.findSubDomain(storeSubDomain);
        if (subDomain)
            throw new Error("Subdomain do not exist");
        return { subDomain: subDomain };
    }
    /////////login
    async login(email, password) {
        const owner = await storeOwnerRepository.findByEmailWithPassword(email);
        if (!owner)
            throw new Error("Invalid credentials");
        const valid = await bcrypt.compare(password, owner.password);
        if (!valid)
            throw new Error("Invalid credentials");
        await storeOwnerRepository.setLastLogin(owner.id, new Date());
        // 1. Generate JWTs
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
        // 2. Calculate Expiry Dates for DB
        const accessExpiresAt = new Date(Date.now() + ONE_MONTH_MS);
        const refreshExpiresAt = new Date(Date.now() + SIX_MONTHS_MS);
        // 3. Save Refresh Token to DB
        const refreshTokenRecord = await storeOwnerRepository.saveRefreshToken(owner.id, refreshToken, refreshExpiresAt);
        // 4. Save Access Token linked to the Refresh Token session
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
                storeSubdomain: owner.storeSubdomain,
            });
            // Update the access token record in DB for the new token
            const accessExpiresAt = new Date(Date.now() + ONE_MONTH_MS);
            await storeOwnerRepository.saveAccessToken(owner.id, isValid.id, // Linked to existing refresh token ID
            newAccessToken, accessExpiresAt);
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
            // If it's an error we threw manually, just re-throw it
            if (error instanceof Error &&
                (error.message === "Token revoked or invalid" ||
                    error.message === "User inactive")) {
                throw error;
            }
            // Otherwise, log the unexpected system error and throw a generic one
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
            console.log("[JWT VERIFY] Starting JWT verification");
            console.log(`[JWT VERIFY] Token preview: ${token.substring(0, 30)}...${token.substring(token.length - 20)}`);
            console.log(`[JWT VERIFY] Token length: ${token.length}`);
            console.log(`[JWT VERIFY] JWT_SECRET available: ${process.env.JWT_SECRET ? "✓ YES" : "✗ NO"}`);
            if (!process.env.JWT_SECRET) {
                console.log("[JWT VERIFY] ERROR: JWT_SECRET is not set!");
                return null;
            }
            console.log(`[JWT VERIFY] JWT_SECRET length: ${process.env.JWT_SECRET.length}`);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("[JWT VERIFY] ✓ Token verified successfully");
            console.log(`[JWT VERIFY] Decoded payload:`, {
                id: decoded.id,
                storeName: decoded.storeName,
                email: decoded.email,
            });
            return decoded;
        }
        catch (error) {
            console.log("[JWT VERIFY] ✗ Verification failed");
            if (error instanceof jwt.JsonWebTokenError) {
                console.log(`[JWT VERIFY] JWT Error: ${error.message}`);
            }
            else if (error instanceof jwt.TokenExpiredError) {
                console.log(`[JWT VERIFY] Token expired at: ${error.expiredAt}`);
            }
            else {
                console.log(`[JWT VERIFY] Error:`, error instanceof Error ? error.message : String(error));
            }
            return null;
        }
    }
}
