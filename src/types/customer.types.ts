export interface CreateCustomerInput{
    storeOwnerId: string;
    customerName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}