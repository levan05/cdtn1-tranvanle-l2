const express = require('express');
const { authenticate } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./routes/http-errors');
const createAuthRoutes = require('./routes/auth.routes');
const createCustomerRoutes = require('./routes/customer.routes');

function createApp({ db, authService, customerService }) {
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
  app.use('/api/customers', authenticate(authService), createCustomerRoutes({ customerService }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
