import { prisma } from "../../lib/prisma.js";
import type { UpdateStoreSettingsInput } from "../validators/storeSettings.valadator.js";

export class StoreSettingsRepository {
  async findByStoreOwnerId(storeOwnerId: string) {
    return await prisma.storeSettings.findUnique({
      where: { storeOwnerId },
    });
  }

  async upsert(storeOwnerId: string, data: UpdateStoreSettingsInput) {
    return await prisma.storeSettings.upsert({
      where: { storeOwnerId },
      create: { storeOwnerId, ...data },
      update: data,
    });
  }
}
