import z from "zod";

export const checkSubDomainSchema = z.object({
    subDomain: z.string().min(2, "subdomain must be atleast 2 character")
})

export type CheckSubDomainSchema = z.infer<typeof checkSubDomainSchema>