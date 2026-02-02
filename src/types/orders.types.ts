enum OrderStatus{
    PENDING = "pending",
    CONFIRMED = "confirm",
    PROCESSING = "processing",
    SHIPPED ="shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}

enum PaymentStatus {
    PENDING = "pending",
    RECEIVED = "received",
    FAILED = "failed"
}

export interface CreteOrderInput{
    storeOwnerId: string;
    customerId: string;
    orderNumber: string;
    totalAmount: number;
    orderStatus:OrderStatus;
    paymentStatus: PaymentStatus;
    paymentScreenshotUrl: string;
    customerNotes: string;
}

export interface UpdateOrderStatus{
    orderId : string;
}