require('dotenv').config({ quiet: true });

const http = require('node:http');
const db = require('../src/db');
const createApp = require('../src/app');
const createAuthService = require('../src/services/auth.service');
const createCustomerService = require('../src/services/customer.service');
const createDeviceService = require('../src/services/device.service');
const createTicketService = require('../src/services/ticket.service');
const createUserService = require('../src/services/user.service');
const createCategoryService = require('../src/services/category.service');
const createUserRepository = require('../src/repositories/user.repository');
const createCustomerRepository = require('../src/repositories/customer.repository');
const createDeviceRepository = require('../src/repositories/device.repository');
const createTicketRepository = require('../src/repositories/ticket.repository');
const createCategoryRepository = require('../src/repositories/category.repository');

function createApplication() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing; configure .env first');
  const userRepo = createUserRepository(db);
  const customerRepo = createCustomerRepository(db);
  const deviceRepo = createDeviceRepository(db);
  return createApp({
    db,
    authService: createAuthService({ userRepo, secret: process.env.JWT_SECRET }),
    customerService: createCustomerService({ customerRepo }),
    deviceService: createDeviceService({ deviceRepo, customerRepo }),
    ticketService: createTicketService({ ticketRepo: createTicketRepository(db), customerRepo, deviceRepo }),
    userService: createUserService({ userRepo }),
    categoryService: createCategoryService({ categoryRepo: createCategoryRepository(db) }),
  });
}

async function request(base, path, token, body) {
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function main() {
  let server;
  let customerId;
  let deviceId;
  let ticketId;
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const phone = `08${unique.slice(-8)}`;
  const serial = `B14-${unique}`;

  try {
    const app = createApplication();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;

    const login = await request(base, '/api/auth/login', null, {
      username: 'nv.tiepnhan01',
      password: process.env.WORKSHOP_TEST_PASSWORD || 'Demo@123',
    });
    if (login.status !== 200 || !login.data.token) {
      throw new Error(`Login failed with HTTP ${login.status}`);
    }
    console.log(`POST /api/auth/login: HTTP ${login.status}, JWT received`);

    const customer = await request(base, '/api/customers', login.data.token, {
      full_name: 'Workshop Test',
      phone,
      address: 'Temporary test record',
    });
    if (customer.status !== 201 || !customer.data.customer_id) {
      throw new Error(`Customer creation failed with HTTP ${customer.status}`);
    }
    customerId = customer.data.customer_id;
    console.log(`POST /api/customers: HTTP ${customer.status}, customer_id=${customerId}`);

    const device = await request(base, '/api/devices', login.data.token, {
      customer_id: customerId,
      serial_no: serial,
      product_name: 'Workshop Test Device',
    });
    if (device.status !== 201 || !device.data.device_id) {
      throw new Error(`Device creation failed with HTTP ${device.status}`);
    }
    deviceId = device.data.device_id;
    console.log(`POST /api/devices: HTTP ${device.status}, device_id=${deviceId}`);

    const ticket = await request(base, '/api/tickets', login.data.token, {
      customer_id: customerId,
      device_id: deviceId,
      issue_desc: 'Man hinh bi soc ngang',
    });
    if (ticket.status !== 201 || !ticket.data.ticket_id) {
      throw new Error(`Ticket creation failed with HTTP ${ticket.status}: ${ticket.data.error?.code || 'unknown error'}`);
    }
    ticketId = ticket.data.ticket_id;
    console.log(`POST /api/tickets: HTTP ${ticket.status}, ticket_code=${ticket.data.ticket_code}`);

    const persisted = await db.query(
      `SELECT t.status, t.center_id, count(l.log_id)::int AS logs
       FROM ticket t LEFT JOIN ticket_status_log l ON l.ticket_id = t.ticket_id
       WHERE t.ticket_id = $1 GROUP BY t.ticket_id`,
      [ticketId]
    );
    const row = persisted.rows[0];
    if (!row || row.status !== 'MOI' || row.logs !== 1 || row.center_id !== login.data.user.center_id) {
      throw new Error(`Persisted ticket verification failed: ${JSON.stringify(row || null)}`);
    }
    console.log(`PostgreSQL verification: status=${row.status}, center_id=${row.center_id}, initial_logs=${row.logs}`);
    console.log('PASS: API created ticket and initial log in PostgreSQL');
  } finally {
    if (server) await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    if (ticketId || deviceId || customerId) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        if (ticketId) {
          await client.query('DELETE FROM ticket_status_log WHERE ticket_id = $1', [ticketId]);
          await client.query('DELETE FROM ticket WHERE ticket_id = $1', [ticketId]);
        }
        if (deviceId) await client.query('DELETE FROM device WHERE device_id = $1', [deviceId]);
        if (customerId) await client.query('DELETE FROM customer WHERE customer_id = $1', [customerId]);
        await client.query('COMMIT');
        console.log('Cleanup: temporary test records removed');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
    await db.end();
  }
}

main().catch((err) => {
  console.error('API integration check failed:', err.message);
  process.exitCode = 1;
});
