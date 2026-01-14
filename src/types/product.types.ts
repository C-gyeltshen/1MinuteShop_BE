export interface CreateProductInput {
  storeOwnerId: string;
  productName: string;
  price: string;
  productImageUrl?: string;
  description?: string;
  stockQuantity: number;
}

export interface UpdateProductInput {
  productName?: string;
  price?: string;
  productImageUrl?: string;
  description?: string;
  stockQuantity?: number;
}

export interface SearchProductParams {
  q: string;
  limit?: number;
  offset?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}