export interface CreateOrderInput {
  storeOwnerId: string;
  customerId: string;
  items: OrderItemInput[];
  customerNotes?: string;
  paymentScreenshotUrl?: string;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateOrderInput {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentScreenshotUrl?: string | null; // Updated to allow null
  customerNotes?: string | null;        // Updated to allow null
}

export interface UpdateOrderStatusInput {
  orderStatus: OrderStatus;
}

export interface UpdatePaymentStatusInput {
  paymentStatus: PaymentStatus;
  paymentScreenshotUrl?: string | null; // Updated to allow null
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  FAILED = 'FAILED',
}

export interface OrderResponse {
  id: string;
  storeOwnerId: string;
  customerId: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentScreenshotUrl?: string | null;
  customerNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithDetailsResponse extends OrderResponse {
  customer: {
    id: string;
    customerName: string;
    email: string;
    phoneNumber?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  orderItems: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      productName: string;
      productImageUrl?: string | null;
      description?: string | null;
    };
  }[];
}

export interface OrderFilterParams {
  storeOwnerId?: string;
  customerId?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'orderNumber' | 'totalAmount' | 'orderStatus' | 'paymentStatus' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedOrderResponse {
  data: OrderWithDetailsResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: {
    status: OrderStatus;
    count: number;
    totalAmount: number;
  }[];
  ordersByPaymentStatus: {
    status: PaymentStatus;
    count: number;
    totalAmount: number;
  }[];
  recentOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface CustomerOrderSummary {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  orders: OrderResponse[];
}