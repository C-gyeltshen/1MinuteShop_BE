export enum StoreOwnerStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export interface CreateStoreOwnerInput{
    storeName: string;
    ownerName: string;
    email: string;
    password: string;
    status: StoreOwnerStatus.ACTIVE
}

export interface UpdateStoreOwnerInput {
    storeName?: string;
    ownerName?: string;
    email?: string;
    password?: string;
    storeSubDomain?: string;
    status?: StoreOwnerStatus;
}

export interface StoreOwner {
    id: string;
    storeName: string;
    ownerName: string;
    email: string;
    storeSubDomain?: string;
    status: StoreOwnerStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface StoreOwnerResponse {
    success: boolean;
    message: string;
    data?: StoreOwner;
}

export interface StoreOwnerListResponse {
    success: boolean;
    message: string;
    data: StoreOwner[];
    total: number;
}

export interface StoreOwnerLoginInput{
    email: string;
    password: string;
}