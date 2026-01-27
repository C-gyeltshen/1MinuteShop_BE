import { prisma } from "../../lib/prisma.js";
import type {
  CreateStoreOwnerInput,
  UpdateStoreOwnerInput,
} from "../types/storeOwner.types.js";
import bcrypt from "bcrypt";

export class StoreOwnerRepository {
  async create(data: CreateStoreOwnerInput) {
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

  async findById(id: string) {
    return await prisma.storeOwner.findUnique({
      where: {
        id: id,
      },
    });
  }

  async findByEmail(email: string) {
    return await prisma.storeOwner.findUnique({
      where: { email },
    });
  }

  async findByStoreName(storeName: string) {
    return await prisma.storeOwner.findUnique({
      where: { storeName },
    });
  }

  async findAll() {
    return await prisma.storeOwner.findMany();
  }

  async update(id: string, data: UpdateStoreOwnerInput) {
    // Remove undefined fields to avoid overwriting with undefined
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );

    return await prisma.storeOwner.update({
      where: { id },
      data: updateData,
    });
  }

  async updateStoreSubDomain(id: string, storeSubdomain: string) {
    return await prisma.storeOwner.update({
      where: { id },
      data: { storeSubdomain },
    });
  }
  async updateStoreUrl(id: string, storeUrl: string) {
    return await prisma.storeOwner.update({
      where: { id },
      data: { storeUrl },
    });
  }

  async delete(id: string) {
    return await prisma.storeOwner.delete({
      where: { id },
    });
  }

  ///////login
  async findByEmailWithPassword(email: string) {
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

  async setLastLogin(id: string, date: Date) {
    return await prisma.storeOwner.update({
      where: { id },
      data: { lastLoginAt: date },
    });
  }

  async saveRefreshToken(storeOwnerId: string, token: string, expiresAt: Date) {
    const tokenHash = await bcrypt.hash(token, 10);
    return await prisma.refreshToken.create({
      data: {
        storeOwnerId,
        tokenHash,
        expiresAt,
      },
    });
  }
  async saveAccessToken(
    storeOwnerId: string,
    refreshTokenId: string,
    token: string,
    expiresAt: Date,
  ) {
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
  async findRefreshToken(storeOwnerId: string, token: string) {
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

  async revokeRefreshToken(tokenHash: string) {
    return await prisma.refreshToken.update({
      where: { id: tokenHash },
      data: { revoked: true },
    });
  }

  async revokeAllRefreshTokens(storeOwnerId: string) {
    return await prisma.refreshToken.updateMany({
      where: { storeOwnerId },
      data: { revoked: true },
    });
  }

  // others

  async findSubDomain(storeSubdomain: string) {
    return await prisma.storeOwner.findUnique({
      where: { storeSubdomain },
    });
  }

  async isAccessTokenValid(
    storeOwnerId: string,
    token: string,
  ): Promise<boolean> {
    // Get all non-revoked refresh tokens for this user
    const refreshTokens = await prisma.refreshToken.findMany({
      where: {
        storeOwnerId,
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        tokens: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
        },
      },
    });

    // Check if the provided token matches any valid access token
    for (const rt of refreshTokens) {
      for (const accessToken of rt.tokens) {
        const isMatch = await bcrypt.compare(token, accessToken.tokenHash);
        if (isMatch) {
          return true;
        }
      }
    }

    return false;
  }

}
