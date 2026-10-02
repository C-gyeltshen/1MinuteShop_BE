import { StoreRepository } from "../repositories/store.repository.js";
import { getSubscription } from "./subscriptionAccess.js";

const storeRepository = new StoreRepository();
export class StoreService{
    async CheckSubDomain(subDomain: string){
        const validate = await storeRepository.findBySubDomain(subDomain)
        if (!validate){
            throw {
                statusCode: 404,
                message: `SubDomain ${subDomain} not found`
            }
        }
        if (!getSubscription(validate).hasAccess){
            throw {
                statusCode: 402,
                code: "STORE_UNAVAILABLE",
                message: "This store is temporarily unavailable"
            }
        }
        const { trialEndsAt, subscriptionEndsAt, ...publicData } = validate
        return {
            success: true,
            data: publicData
        }
    }
}