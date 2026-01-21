import { StoreRepository } from "../repositories/store.repository.js";

const storeRepository = new StoreRepository();
export class StoreService{
    async CheckSubDomain(subDomain: string){
        const validate = storeRepository.findBySubDomain(subDomain)
        if (!validate){
            throw {
                statusCode: 404,
                message: `SubDomain ${subDomain} not found`
            }
        }
        return {
            success: true,
            data: validate
        }
    }
}