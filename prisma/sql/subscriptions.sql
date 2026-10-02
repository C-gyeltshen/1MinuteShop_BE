-- Additive only. Run in the Supabase SQL editor BEFORE deploying the subscription code.
--
-- Existing owners get a fresh 30-day trial starting at the moment this runs
-- (ADD COLUMN ... DEFAULT fills existing rows with now() + 30 days), so nobody
-- is locked out the instant this ships.

ALTER TABLE "StoreOwners"
  ADD COLUMN IF NOT EXISTS "trialEndsAt"        TIMESTAMPTZ(6) NOT NULL DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMPTZ(6);

DO $$ BEGIN
  CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "subscription_payments" (
  "id"             UUID           NOT NULL DEFAULT gen_random_uuid(),
  "storeOwnerId"   UUID           NOT NULL,
  "months"         INTEGER        NOT NULL DEFAULT 1,
  "amount"         DECIMAL(10,2)  NOT NULL,
  "reference"      TEXT,
  "screenshotPath" TEXT           NOT NULL,
  "status"         "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "rejectReason"   TEXT,
  "reviewedBy"     UUID,
  "reviewedAt"     TIMESTAMPTZ(6),
  "periodStart"    TIMESTAMPTZ(6),
  "periodEnd"      TIMESTAMPTZ(6),
  "createdAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)   NOT NULL,
  CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscription_payments_storeOwnerId_fkey"
    FOREIGN KEY ("storeOwnerId") REFERENCES "StoreOwners"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "subscription_payments_storeOwnerId_idx" ON "subscription_payments"("storeOwnerId");
CREATE INDEX IF NOT EXISTS "subscription_payments_status_idx"       ON "subscription_payments"("status");
CREATE INDEX IF NOT EXISTS "subscription_payments_createdAt_idx"    ON "subscription_payments"("createdAt");

-- At most one PENDING request per owner (enforced in the DB, not just in code).
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_payments_one_pending_per_owner"
  ON "subscription_payments"("storeOwnerId") WHERE "status" = 'PENDING';
