-- Additive only: creates one new table, touches nothing that already exists.
-- Run this in the Supabase SQL editor BEFORE deploying the Telegram code.

CREATE TABLE IF NOT EXISTS "telegram_connections" (
  "id"                   UUID        NOT NULL DEFAULT gen_random_uuid(),
  "storeOwnerId"         UUID        NOT NULL,
  "chatId"               TEXT,
  "notificationsEnabled" BOOLEAN     NOT NULL DEFAULT true,
  "linkToken"            TEXT,
  "linkTokenExpiresAt"   TIMESTAMPTZ(6),
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "telegram_connections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "telegram_connections_storeOwnerId_fkey"
    FOREIGN KEY ("storeOwnerId") REFERENCES "StoreOwners"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "telegram_connections_storeOwnerId_key" ON "telegram_connections"("storeOwnerId");
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_connections_linkToken_key"    ON "telegram_connections"("linkToken");
