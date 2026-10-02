import { randomUUID } from "node:crypto";
import type { SubscriptionPaymentStatus } from "@prisma/client";
import { SubscriptionRepository } from "../repositories/subscription.repository.js";
import { SubscriptionStorageRepository } from "../repositories/subscriptionStorage.repository.js";
import { TelegramService } from "./telegram.service.js";
import { MONTHLY_PRICE_BTN, getSubscription } from "./subscriptionAccess.js";

const subscriptionRepository = new SubscriptionRepository();
const storage = new SubscriptionStorageRepository();
const telegramService = new TelegramService();

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_MONTHS = 12;
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// Checks the real bytes, not just the client-declared MIME type.
function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString("ascii") === "ftypavif") return "image/avif";
  return null;
}

export class SubscriptionService {
  async getStatus(storeOwnerId: string) {
    const owner = await subscriptionRepository.findOwner(storeOwnerId);
    if (!owner) throw { statusCode: 404, message: "Store owner not found" };

    const pending = await subscriptionRepository.findPendingForOwner(storeOwnerId);

    return {
      ...getSubscription(owner),
      monthlyPrice: MONTHLY_PRICE_BTN,
      currency: "BTN",
      hasPendingPayment: Boolean(pending),
      paymentInstructions: process.env.SUBSCRIPTION_PAYMENT_INSTRUCTIONS ?? null,
    };
  }

  async listMine(storeOwnerId: string) {
    return await subscriptionRepository.listForOwner(storeOwnerId);
  }

  async submitPayment(
    storeOwnerId: string,
    input: { file: File; months: number; reference?: string },
  ) {
    const owner = await subscriptionRepository.findOwner(storeOwnerId);
    if (!owner) throw { statusCode: 404, message: "Store owner not found" };

    if (!Number.isInteger(input.months) || input.months < 1 || input.months > MAX_MONTHS) {
      throw { statusCode: 400, message: `Months must be between 1 and ${MAX_MONTHS}` };
    }

    if (await subscriptionRepository.findPendingForOwner(storeOwnerId)) {
      throw {
        statusCode: 409,
        message: "You already have a payment waiting for review. Please wait for it to be processed.",
      };
    }

    if (input.file.size > MAX_FILE_BYTES) {
      throw { statusCode: 400, message: "Screenshot must be smaller than 5MB" };
    }
    const buffer = Buffer.from(await input.file.arrayBuffer());
    const type = sniffImageType(buffer);
    if (!type) {
      throw { statusCode: 400, message: "Screenshot must be a JPEG, PNG, WEBP or AVIF image" };
    }

    const screenshotPath = `${storeOwnerId}/${Date.now()}-${randomUUID()}.${EXT_BY_TYPE[type]}`;
    await storage.upload(screenshotPath, buffer, type);

    let payment;
    try {
      payment = await subscriptionRepository.create({
        storeOwnerId,
        months: input.months,
        amount: MONTHLY_PRICE_BTN * input.months,
        reference: input.reference?.trim().slice(0, 100) || undefined,
        screenshotPath,
      });
    } catch (error: any) {
      await storage.remove(screenshotPath).catch(() => {});
      // Unique partial index: two requests raced past the pending check
      if (error?.code === "P2002") {
        throw { statusCode: 409, message: "You already have a payment waiting for review." };
      }
      throw error;
    }

    // Fire-and-forget: a Telegram outage must not fail the owner's submission
    void telegramService
      .notifyAdminSubscriptionRequest({
        storeName: owner.storeName,
        ownerName: owner.ownerName,
        email: owner.email,
        months: payment.months,
        amount: Number(payment.amount),
        reference: payment.reference,
      })
      .catch((e) => console.error("Admin Telegram notify failed:", e));

    return payment;
  }

  // ── Admin ───────────────────────────────────────────────────────────────

  async adminList(status?: SubscriptionPaymentStatus) {
    const [payments, counts] = await Promise.all([
      subscriptionRepository.listAll(status),
      subscriptionRepository.counts(),
    ]);

    const data = await Promise.all(
      payments.map(async ({ StoreOwner, screenshotPath, ...payment }) => ({
        ...payment,
        storeOwner: {
          id: StoreOwner.id,
          storeName: StoreOwner.storeName,
          ownerName: StoreOwner.ownerName,
          email: StoreOwner.email,
          storeSubdomain: StoreOwner.storeSubdomain,
          ...getSubscription(StoreOwner),
        },
        screenshotUrl: await storage.signedUrl(screenshotPath),
      })),
    );

    return {
      data,
      counts: {
        PENDING: counts.PENDING ?? 0,
        APPROVED: counts.APPROVED ?? 0,
        REJECTED: counts.REJECTED ?? 0,
      },
    };
  }

  async approve(paymentId: string, adminId: string) {
    const result = await subscriptionRepository.approve(paymentId, adminId);
    if (!result) {
      throw { statusCode: 409, message: "Payment not found or already reviewed" };
    }

    void telegramService
      .notifyOwnerSubscriptionReviewed(result.payment.storeOwnerId, {
        approved: true,
        accessEndsAt: result.periodEnd,
      })
      .catch((e) => console.error("Owner Telegram notify failed:", e));

    return { periodStart: result.periodStart, periodEnd: result.periodEnd };
  }

  async reject(paymentId: string, adminId: string, reason: string) {
    const payment = await subscriptionRepository.findById(paymentId);
    if (!payment) throw { statusCode: 404, message: "Payment not found" };

    const ok = await subscriptionRepository.reject(paymentId, adminId, reason);
    if (!ok) throw { statusCode: 409, message: "Payment already reviewed" };

    void telegramService
      .notifyOwnerSubscriptionReviewed(payment.storeOwnerId, { approved: false, reason })
      .catch((e) => console.error("Owner Telegram notify failed:", e));
  }
}
