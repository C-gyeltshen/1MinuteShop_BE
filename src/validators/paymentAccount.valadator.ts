import { z } from "zod";

export const BANKS = ["BOB", "BNB", "DPNB", "TBANK", "BDBL", "DKB"] as const;

export const upsertPaymentAccountSchema = z.object({
  bank: z.enum(BANKS, { message: "Please select a bank" }),
  accountNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{6,20}$/, "Account number must be 6-20 digits")),
  accountName: z.string().trim().min(2, "Account holder name is required").max(100),
});

export type UpsertPaymentAccountInput = z.infer<typeof upsertPaymentAccountSchema>;
