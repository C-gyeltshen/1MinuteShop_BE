import type { Context, Next } from "hono";
import { SubscriptionRepository } from "../repositories/subscription.repository.js";
import { getSubscription } from "../services/subscriptionAccess.js";

const subscriptionRepository = new SubscriptionRepository();

// Platform admins are store-owner accounts whose id is listed in ADMIN_OWNER_IDS
// (comma-separated UUIDs). Ids can't be claimed by registering, unlike emails.
export const isAdminId = (id: string | undefined) =>
  Boolean(id) &&
  (process.env.ADMIN_OWNER_IDS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .includes(id!);

// Must run after authMiddleware.
export const requireAdmin = async (c: Context, next: Next) => {
  if (!isAdminId(c.get("user")?.id)) {
    return c.json({ success: false, message: "Forbidden: admin only" }, 403);
  }
  await next();
};

// Blocks write actions once the trial / paid period is over. Must run after authMiddleware.
// Reads (orders, billing, profile) stay open so owners can still fulfil orders and pay.
export const requireActiveSubscription = async (c: Context, next: Next) => {
  const owner = await subscriptionRepository.findOwner(c.get("user").id);

  if (!owner) {
    return c.json({ success: false, message: "Store owner not found" }, 404);
  }

  if (!getSubscription(owner).hasAccess) {
    return c.json(
      {
        success: false,
        code: "SUBSCRIPTION_EXPIRED",
        message: "Your free trial or subscription has ended. Please renew to continue.",
      },
      402,
    );
  }

  await next();
};
