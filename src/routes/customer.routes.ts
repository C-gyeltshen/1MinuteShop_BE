import { Hono } from 'hono';
import { CustomerController } from '../controllers/customer.controller.js';

const customerRoutes = new Hono();
const customerController = new CustomerController();

/**
 * Customer Routes
 * Base path: /api/customers
 */

// Create a new customer
customerRoutes.post('/', (c) => customerController.createCustomer(c));

// Search customer by email
customerRoutes.get('/search/email', (c) => customerController.searchCustomerByEmail(c));

// Get customer by ID
customerRoutes.get('/:id', (c) => customerController.getCustomerById(c));

// Update customer
customerRoutes.put('/:id', (c) => customerController.updateCustomer(c));

// Delete customer
customerRoutes.delete('/:id', (c) => customerController.deleteCustomer(c));

// Get customer statistics
customerRoutes.get('/:id/stats', (c) => customerController.getCustomerStats(c));

export default customerRoutes;