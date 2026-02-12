// Enum interface

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

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface ValidatedOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  storeSubdomain: string;
}

// Create Order interface

export interface CreateOrderInput {
  storeSubdomain: string;
  customerId: string;
  customerName?: string;
  email?: string;
  phoneNumber?: string;
  items: OrderItemInput[];
  paymentScreenshotUrl: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  customerNotes?: string;
}

export interface ValidatedOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  storeSubdomain: string;
}


export interface CreateOrderWithItemsInput {
  storeSubdomain: string;
  storeOwnerId: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  items: ValidatedOrderItem[];
  paymentScreenshotUrl: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  customerNotes?: string;
}
