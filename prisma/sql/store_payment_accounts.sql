-- Additive only: one new enum + one new table, touches nothing that already exists.
-- Run this in the Supabase SQL editor BEFORE deploying the payment-account code.
--
-- Existing stores have no row here, so they cannot take orders until the owner
-- adds payment account details in Dashboard -> Settings.

DO $$ BEGIN
  CREATE TYPE "Bank" AS ENUM ('BOB', 'BNB', 'DPNB', 'TBANK', 'BDBL', 'DKB');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "store_payment_accounts" (
  "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
  "storeOwnerId"  UUID         NOT NULL,
  "bank"          "Bank"       NOT NULL,
  "accountNumber" TEXT         NOT NULL,
  "accountName"   TEXT         NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "store_payment_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "store_payment_accounts_storeOwnerId_fkey"
    FOREIGN KEY ("storeOwnerId") REFERENCES "StoreOwners"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "store_payment_accounts_storeOwnerId_key"
  ON "store_payment_accounts"("storeOwnerId");
