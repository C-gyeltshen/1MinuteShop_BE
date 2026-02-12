import { CustomerRepository } from "../repositories/customer.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { StoreRepository } from "../repositories/store.repository.js";
import type {
  CreateOrderInput,
  ValidatedOrderItem,
} from "../types/orders.types.js";

const customerRepository = new CustomerRepository();
const productRepository = new ProductRepository();
const orderRepository = new OrderRepository();
const storeRepository = new StoreRepository();

export class OrderService {
  async create(data: CreateOrderInput) {
    try {
      // 1. Validate or create customer
      let customer = await customerRepository.findCustomerById(data.customerId);

      if (!customer) {
        // Check if customer data is provided for creation
        if (!data.customerName || !data.email || !data.phoneNumber) {
          throw {
            statusCode: 400,
            message:
              "Customer not found and customer details not provided for creation",
          };
        }

        // Create customer
        customer = await customerRepository.create({
          customerName: data.customerName,
          email: data.email,
          phoneNumber: data.phoneNumber,
        });

        if (!customer) {
          throw {
            statusCode: 500,
            message: "Error creating customer",
          };
        }
      }

      // 2. Validate store exists and is active
      const store = await storeRepository.findBySubDomain(data.storeSubdomain);

      if (!store) {
        throw {
          statusCode: 404,
          message: "Store not found",
        };
      }

      if (store.status !== "ACTIVE") {
        throw {
          statusCode: 400,
          message: "Store is not active",
        };
      }

      // 3. Validate products and calculate totals
      const validatedItems: ValidatedOrderItem[] = [];
      let totalAmount = 0;

      for (const item of data.items) {
        const product = await productRepository.findById(item.productId);

        if (!product) {
          throw {
            statusCode: 404,
            message: `Product with ID ${item.productId} not found`,
          };
        }

        if (!product.isActive) {
          throw {
            statusCode: 400,
            message: `Product ${product.productName} is not available`,
          };
        }

        if (product.stockQuantity < item.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for ${product.productName}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
          };
        }

        // Calculate prices
        const unitPrice = Number(product.price);
        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
          productId: item.productId,
          productName: product.productName,
          quantity: item.quantity,
          unitPrice,
          storeSubdomain: data.storeSubdomain,
        });
      }

      // 4. Create order with transaction
      const order = await orderRepository.createOrderWithItems({
        storeSubdomain: data.storeSubdomain,
        storeOwnerId: store.id,
        customerId: data.customerId,
        customerName: customer.customerName,
        totalAmount,
        items: validatedItems,
        paymentScreenshotUrl: data.paymentScreenshotUrl,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountry: data.shippingCountry,
        customerNotes: data.customerNotes,
      });

      return {
        statusCode: 201,
        message: "Order created successfully",
        data: order,
      };
    } catch (error: any) {
      // Re-throw custom errors
      if (error.statusCode) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Order service error:", error);
      throw {
        statusCode: 500,
        message:
          error.message ||
          "An unexpected error occurred while creating the order",
      };
    }
  }

  async getAll() {
    const allOrders = await orderRepository.getAll();
    if (!allOrders) {
      throw {
        statusCode: 404,
        message: "error fetching all order data",
      };
    } else {
      return {
        statusCode: 200,
        data: allOrders,
      };
    }
  }

  async getOrdersByStoreOwnerId(storeOwnerId: string) {
    try {
      const result = await orderRepository.findByStoreOwnerId(storeOwnerId);
      return {
        statusCode: 200,
        message: "Orders retrieved successfully",
        data: result,
      };
    } catch (error: any) {
      console.error("Get orders error:", error);
      throw {
        statusCode: 500,
        message: error.message || "Failed to retrieve orders",
      };
    }
  }
}
