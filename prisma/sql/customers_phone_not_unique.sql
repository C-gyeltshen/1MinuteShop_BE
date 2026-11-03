-- Fixes: POST /api/customers -> 500, "Unique constraint failed on the fields: (phoneNumber)".
-- A new email with a phone number already on file (family member, new email address)
-- was rejected. Email stays unique; phone no longer is. Run in the Supabase SQL editor.

ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_phoneNumber_key";
DROP INDEX IF EXISTS "customers_phoneNumber_key";

CREATE INDEX IF NOT EXISTS "customers_phoneNumber_idx" ON "customers"("phoneNumber");
