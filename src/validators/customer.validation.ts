import z from "zod";

export const createCustomerSchema = z.object({
  customerName: z
    .string()
    .min(2, "Customer name must be of atleast 2 character")
    .max(50, "Customer name must be less than 50 character"),
  email: z.string().email(),
  phoneNumber: z
    .string()
    .length(8, "Invalid phoneNumber Enter again")
    .regex(/^(17|77)\d{6}$/, {
      message: "Phone number must start with 17 or 77",
    }),
});
