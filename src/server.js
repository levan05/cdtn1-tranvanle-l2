require('dotenv').config({ quiet: true });

const db = require('./db');
const logger = require('./logger');
const createApp = require('./app');
const createUserRepository = require('./repositories/user.repository');
const createCustomerRepository = require('./repositories/customer.repository');
const createDeviceRepository = require('./repositories/device.repository');
const createAuthService = require('./services/auth.service');
const createCustomerService = require('./services/customer.service');
const createDeviceService = require('./services/device.service');

if (!process.env.JWT_SECRET) {
  logger.error('Thieu bien moi truong JWT_SECRET, xem .env.example');
  process.exit(1);
}

const authService = createAuthService({
  userRepo: createUserRepository(db),
  secret: process.env.JWT_SECRET,
});
const customerService = createCustomerService({ customerRepo: createCustomerRepository(db) });

const deviceService = createDeviceService({
  deviceRepo: createDeviceRepository(db),
  customerRepo: createCustomerRepository(db),
});

const app = createApp({ db, authService, customerService, deviceService });
const port = Number(process.env.PORT) || 8000;
app.listen(port, () => logger.info('May chu da chay', { port }));
