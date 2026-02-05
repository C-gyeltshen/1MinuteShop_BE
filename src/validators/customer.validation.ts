import { z } from "zod";

export const CreateCustomerSchema = z.object({
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must be at most 100 characters"),
  email: z
    .string()
    .email("Invalid email address"),
  phoneNumber: z
    .string()
    .length(8, "Phone Number must be of length of 8")
    .optional()
    .nullable(),  // ADD nullable
  address: z
    .string()
    .max(200, "Address must be at most 200 characters")
    .optional()
    .nullable(),  // ADD nullable
  city: z
    .string()
    .max(100, "City must be at most 100 characters")
    .optional()
    .nullable(),  // ADD nullable
  state: z
    .string()
    .max(100, "State must be at most 100 characters")
    .optional()
    .nullable(),  // ADD nullable
  postalCode: z
    .string()
    .max(20, "Postal code must be at most 20 characters")
    .optional()
    .nullable(),  // ADD nullable
  country: z
    .string()
    .max(100, "Country must be at most 100 characters")
    .optional()
    .nullable(),  // ADD nullable
});

export const UpdateCustomerSchema = z.object({
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must be at most 100 characters")
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional(),
  phoneNumber: z
    .string()
    .length(8, "Phone Number must be of length of 8")
    .optional()
    .nullable(),  // ADD nullable
  address: z
    .string()
    .max(200, "Address must be at most 200 characters")
    .optional()
    .nullable(),  // ADD nullable
  city: z
    .string()
    .max(100, "City must be at most 100 characters")
    .optional()
    .nullable(),  // ADD nullable
  state: z
    .string()
    .max(100, "State must be at most 100 characters")
    .optional()
    .nullable(),  // ADD nullable
  postalCode: z
    .string()
    .max(20, "Postal code must be at most 20 characters")
    .optional()
    .nullable(),  // ADD nullable
  country: z
    .string()
    .max(100, "Country must be at most 100 characters")
    .optional()
    .nullable(),  // ADD nullable
});

export const UUIDSchema = z.string().uuid("Invalid UUID format");

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;