import { StoreService } from "../services/store.service.js";
import { checkSubDomainSchema } from "../validators/store.valadators.js";
const storeService = new StoreService();
export class StoreController {
    async checkSubDomain(c) {
        try {
            const body = await c.req.json();
            const parsed = checkSubDomainSchema.safeParse(body);
            if (!parsed.success) {
                return c.json({ success: false, message: parsed.error.issues[0].message }, 400);
            }
            const { subDomain } = parsed.data;
            const result = await storeService.CheckSubDomain(subDomain);
            return c.json(result, 200);
        }
        catch (err) {
            return c.json({ success: false, message: err.message || "Internal server error" }, err.statusCode || 500);
        }
    }
}
