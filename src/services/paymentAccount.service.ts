import { PaymentAccountRepository } from "../repositories/paymentAccount.repository.js";
import { StoreRepository } from "../repositories/store.repository.js";
import type { UpsertPaymentAccountInput } from "../validators/paymentAccount.valadator.js";

const paymentAccountRepository = new PaymentAccountRepository();
const storeRepository = new StoreRepository();

const toResponse = (a: { bank: string; accountNumber: string; accountName: string }) => ({
  bank: a.bank,
  accountNumber: a.accountNumber,
  accountName: a.accountName,
});

export class PaymentAccountService {
  // null when the owner has not added an account yet
  async get(storeOwnerId: string) {
    const account = await paymentAccountRepository.findByStoreOwnerId(storeOwnerId);
    return { message: "Payment account retrieved successfully", data: account ? toResponse(account) : null };
  }

  async save(storeOwnerId: string, input: UpsertPaymentAccountInput) {
    const account = await paymentAccountRepository.upsert(storeOwnerId, input);
    return { message: "Payment account saved successfully", data: toResponse(account) };
  }

  // Public: what a customer sees at checkout
  async getPublic(subDomain: string) {
    const store = await storeRepository.findBySubDomain(subDomain);
    if (!store) throw { statusCode: 404, message: `SubDomain ${subDomain} not found` };

    const account = await paymentAccountRepository.findByStoreOwnerId(store.id);
    if (!account) {
      throw {
        statusCode: 409,
        code: "PAYMENT_ACCOUNT_REQUIRED",
        message: "This store is not accepting orders yet",
      };
    }
    return { data: toResponse(account) };
  }
}
