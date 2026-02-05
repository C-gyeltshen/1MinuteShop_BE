import { Hono } from 'hono';
import { OrderController } from '../controllers/order.controller.js';
const orderRoutes = new Hono();
const orderController = new OrderController();
/**
 * Order Routes
 * Base path: /api/orders
 */
// ==================== CREATE ====================
// Create a new order
orderRoutes.post('/', (c) => orderController.createOrder(c));
// ==================== READ - General ====================
// Get all orders with filters and pagination
orderRoutes.get('/', (c) => orderController.getAllOrders(c));
// Get order by ID
orderRoutes.get('/:id', (c) => orderController.getOrderById(c));
// ==================== READ - By Store ====================
// Get orders for a specific store
orderRoutes.get('/store/:storeOwnerId', (c) => orderController.getStoreOrders(c));
// Get order by order number for a store
orderRoutes.get('/store/:storeOwnerId/number/:orderNumber', (c) => orderController.getOrderByNumber(c));
// Get store statistics
orderRoutes.get('/store/:storeOwnerId/statistics', (c) => orderController.getStoreStatistics(c));
// ==================== READ - By Customer ====================
// Get orders for a specific customer
orderRoutes.get('/customer/:customerId', (c) => orderController.getCustomerOrders(c));
// Get customer order summary
orderRoutes.get('/customer/:customerId/summary', (c) => orderController.getCustomerOrderSummary(c));
// ==================== UPDATE ====================
// Update order (full update)
orderRoutes.put('/:id', (c) => orderController.updateOrder(c));
// Update order status only
orderRoutes.patch('/:id/status', (c) => orderController.updateOrderStatus(c));
// Update payment status
orderRoutes.patch('/:id/payment', (c) => orderController.updatePaymentStatus(c));
// Cancel order
orderRoutes.post('/:id/cancel', (c) => orderController.cancelOrder(c));
// ==================== DELETE ====================
// Delete order (admin only - requires order to be cancelled first)
orderRoutes.delete('/:id', (c) => orderController.deleteOrder(c));
export default orderRoutes;
