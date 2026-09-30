import { prisma } from "../../lib/prisma.js";

export class TelegramRepository {
  async findByStoreOwnerId(storeOwnerId: string) {
    return await prisma.telegramConnection.findUnique({
      where: { storeOwnerId },
    });
  }

  async findByLinkToken(linkToken: string) {
    return await prisma.telegramConnection.findUnique({
      where: { linkToken },
    });
  }

  // Starts (or restarts) linking: stores a fresh one-time token, keeps any existing chat until replaced
  async saveLinkToken(storeOwnerId: string, linkToken: string, linkTokenExpiresAt: Date) {
    return await prisma.telegramConnection.upsert({
      where: { storeOwnerId },
      create: { storeOwnerId, linkToken, linkTokenExpiresAt },
      update: { linkToken, linkTokenExpiresAt },
    });
  }

  async completeLink(id: string, chatId: string) {
    return await prisma.telegramConnection.update({
      where: { id },
      data: {
        chatId,
        notificationsEnabled: true,
        linkToken: null,
        linkTokenExpiresAt: null,
      },
    });
  }

  async setEnabled(storeOwnerId: string, notificationsEnabled: boolean) {
    return await prisma.telegramConnection.update({
      where: { storeOwnerId },
      data: { notificationsEnabled },
    });
  }

  async remove(storeOwnerId: string) {
    return await prisma.telegramConnection.deleteMany({
      where: { storeOwnerId },
    });
  }
}
