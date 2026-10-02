// Single source of truth for "is this store live?". Computed from timestamps on
// every call, so access never depends on a background job having run.

export const TRIAL_DAYS = 30;
export const MONTHLY_PRICE_BTN = Number(process.env.SUBSCRIPTION_PRICE_BTN) || 99;

const MS_IN_DAY = 24 * 60 * 60 * 1000;

export type SubscriptionState = "TRIALING" | "ACTIVE" | "EXPIRED";

export interface SubscriptionSnapshot {
  state: SubscriptionState;
  hasAccess: boolean;
  trialEndsAt: Date;
  subscriptionEndsAt: Date | null;
  accessEndsAt: Date;
  daysLeft: number;
}

interface SubscriptionFields {
  status?: string;
  trialEndsAt: Date;
  subscriptionEndsAt: Date | null;
}

export function getSubscription(owner: SubscriptionFields, now = new Date()): SubscriptionSnapshot {
  const paidUntil = owner.subscriptionEndsAt;
  const accessEndsAt =
    paidUntil && paidUntil > owner.trialEndsAt ? paidUntil : owner.trialEndsAt;

  const live = now < accessEndsAt && (owner.status === undefined || owner.status === "ACTIVE");

  let state: SubscriptionState = "EXPIRED";
  if (live) {
    state = paidUntil && now < paidUntil ? "ACTIVE" : "TRIALING";
  }

  return {
    state,
    hasAccess: live,
    trialEndsAt: owner.trialEndsAt,
    subscriptionEndsAt: paidUntil,
    accessEndsAt,
    daysLeft: live ? Math.ceil((accessEndsAt.getTime() - now.getTime()) / MS_IN_DAY) : 0,
  };
}

// Paying early must not waste remaining trial or paid time: new time is appended
// after whichever of (now, trial end, paid-through) is latest.
export function nextPeriod(owner: SubscriptionFields, months: number, now = new Date()) {
  const candidates = [now.getTime(), owner.trialEndsAt.getTime()];
  if (owner.subscriptionEndsAt) candidates.push(owner.subscriptionEndsAt.getTime());

  const periodStart = new Date(Math.max(...candidates));
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + months);

  return { periodStart, periodEnd };
}
