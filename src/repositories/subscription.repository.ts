import { prisma } from "../../lib/prisma.js";
import type { SubscriptionPaymentStatus } from "@prisma/client";
import { nextPeriod } from "../services/subscriptionAccess.js";

const ownerSelect = {
  id: true,
  storeName: true,
  ownerName: true,
  email: true,
  storeSubdomain: true,
  status: true,
  trialEndsAt: true,
  subscriptionEndsAt: true,
} as const;

export class SubscriptionRepository {
  async findOwner(storeOwnerId: string) {
    return await prisma.storeOwner.findUnique({
      where: { id: storeOwnerId },
      select: ownerSelect,
    });
  }

  async findPendingForOwner(storeOwnerId: string) {
    return await prisma.subscriptionPayment.findFirst({
      where: { storeOwnerId, status: "PENDING" },
    });
  }

  async create(data: {
    storeOwnerId: string;
    months: number;
    amount: number;
    reference?: string;
    screenshotPath: string;
  }) {
    return await prisma.subscriptionPayment.create({ data });
  }

  async listForOwner(storeOwnerId: string) {
    return await prisma.subscriptionPayment.findMany({
      where: { storeOwnerId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async listAll(status?: SubscriptionPaymentStatus) {
    return await prisma.subscriptionPayment.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { StoreOwner: { select: ownerSelect } },
    });
  }

  async findById(id: string) {
    return await prisma.subscriptionPayment.findUnique({
      where: { id },
      include: { StoreOwner: { select: ownerSelect } },
    });
  }

  async counts() {
    const grouped = await prisma.subscriptionPayment.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    return Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  }

  // Approve atomically: the PENDING guard makes a double-click / two admins safe.
  async approve(id: string, adminId: string) {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.subscriptionPayment.findUnique({
        where: { id },
        include: { StoreOwner: { select: ownerSelect } },
      });
      if (!payment || payment.status !== "PENDING") return null;

      const { periodStart, periodEnd } = nextPeriod(payment.StoreOwner, payment.months);

      const claimed = await tx.subscriptionPayment.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status: "APPROVED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          periodStart,
          periodEnd,
        },
      });
      if (claimed.count === 0) return null;

      await tx.storeOwner.update({
        where: { id: payment.storeOwnerId },
        data: { subscriptionEndsAt: periodEnd },
      });

      return { payment, periodStart, periodEnd };
    });
  }

  async reject(id: string, adminId: string, reason: string) {
    const claimed = await prisma.subscriptionPayment.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
    });
    return claimed.count > 0;
  }
}
