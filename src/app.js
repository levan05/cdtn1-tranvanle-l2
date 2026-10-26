const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { authenticate } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./routes/http-errors');
const createAuthRoutes = require('./routes/auth.routes');
const createCustomerRoutes = require('./routes/customer.routes');
const createDeviceRoutes = require('./routes/device.routes');
const createTicketRoutes = require('./routes/ticket.routes');
const createUserRoutes = require('./routes/user.routes');
const createCategoryRoutes = require('./routes/category.routes');

function createApp({ db, authService, customerService, deviceService, ticketService, userService, categoryService }) {
  const app = express();
  app.use(express.json());

  // Khong can dang nhap, dung de kiem tra he thong da chay dung
  app.get('/health', async (req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ok', db: 'ok' });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'unavailable' });
    }
  });

  app.use('/api/auth', createAuthRoutes({ authService }));
  app.use('/api/customers', authenticate(authService), createCustomerRoutes({ customerService, deviceService }));
  app.use('/api/devices', authenticate(authService), createDeviceRoutes({ deviceService }));

  app.use('/api/tickets', authenticate(authService), createTicketRoutes({ ticketService }));
  app.use('/api/users', authenticate(authService), createUserRoutes({ userService }));
  app.use('/api/categories', authenticate(authService), createCategoryRoutes({ categoryService }));

  // Neu da build giao dien (frontend/dist) thi phuc vu luon, de chay mot lenh la co ca web lan API
  const webDir = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(webDir)) app.use(express.static(webDir));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
