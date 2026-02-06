// export interface CreateCustomerInput {
//   customerName: string;
//   email: string;
//   phoneNumber?: string | null; // Update to allow null
//   address?: string | null;     // Update to allow null
//   city?: string | null;        // Update to allow null
//   state?: string | null;       // Update to allow null
//   postalCode?: string | null;  // Update to allow null
//   country?: string | null;     // Update to allow null
// }

// export interface UpdateCustomerInput {
//   customerName?: string;
//   email?: string;
//   phoneNumber?: string | null;  // Allow null
//   address?: string | null;       // Allow null
//   city?: string | null;          // Allow null
//   state?: string | null;         // Allow null
//   postalCode?: string | null;    // Allow null
//   country?: string | null;       // Allow null
// }


// export interface CustomerResponse {
//   id: string;
//   customerName: string;
//   email: string;  // NOT nullable based on your schema
//   phoneNumber: string | null;
//   address: string | null;
//   city: string | null;
//   state: string | null;
//   postalCode: string | null;
//   country: string | null;
//   createdAt: Date;
//   updatedAt: Date;
//   _count?: {  // ADD this for the queries that include counts
//     orders: number;
//     productReviews: number;
//   };
//   orders?: Array<{  // ADD this for detailed queries
//     id: string;
//     orderNumber: string;
//     totalAmount: number;
//     orderStatus: string;
//     createdAt: Date;
//   }>;
// }

// export interface PaginationParams {
//   page?: number;
//   limit?: number;
//   search?: string;
//   sortBy?: 'customerName' | 'email' | 'createdAt' | 'updatedAt';
//   sortOrder?: 'asc' | 'desc';
// }

// export interface PaginatedCustomerResponse {
//   data: CustomerResponse[];
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }

