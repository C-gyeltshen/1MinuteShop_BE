import { prisma } from "../../lib/prisma.js";
import type { UpsertPaymentAccountInput } from "../validators/paymentAccount.valadator.js";

export class PaymentAccountRepository {
  async findByStoreOwnerId(storeOwnerId: string) {
    return await prisma.storePaymentAccount.findUnique({ where: { storeOwnerId } });
  }

  async upsert(storeOwnerId: string, data: UpsertPaymentAccountInput) {
    return await prisma.storePaymentAccount.upsert({
      where: { storeOwnerId },
      create: { storeOwnerId, ...data },
      update: data,
    });
  }
}
