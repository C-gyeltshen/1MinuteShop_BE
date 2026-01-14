// import { CreateStoreOwnerSchema } from './storeOwner.valadator';
import z from "zod";

export enum StoreOwnerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export const createStoreOwnerSchema = z.object({
  storeName: z.string().min(2, "Store name must be of length 2 characters"),
  ownerName: z
    .string()
    .min(2, "Store owner naem must be of length 2 characters"),
  email: z.string().email(),
  password: z.string().min(6, "Password must cntain 6 character"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required"),
});

export type CreateStoreOwnerSchema = z.infer<typeof createStoreOwnerSchema>
export type LoginSchema = z.infer<typeof loginSchema>
