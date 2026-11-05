// Kiem thu bo sung, nam ngoai bo 12 TC checklist buoi 14: ban gui nhieu request
// dong thoi de xem co duplicate ticket_code hoac double log khi dua tranh nhau khong.
// Khong dat ten *-test.js de node --test khong tu quet nham vao file nay.
// Chay: $env:DB_NAME='baohanh_l2_thu'; $env:WORKSHOP_ALLOW_DB_WRITE='1'; node scripts/adhoc-race-check.js
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
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

if (process.env.WORKSHOP_ALLOW_DB_WRITE !== '1' || !/test|thu|workshop/i.test(process.env.DB_NAME || '')) {
  throw new Error('Refusing to run outside a disposable test database.');
}

async function request(baseUrl, path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: response.status === 204 ? null : await response.json() };
}

async function main() {
  const userRepo = createUserRepository(db);
  const customerRepo = createCustomerRepository(db);
  const deviceRepo = createDeviceRepository(db);
  const app = createApp({
    db,
    authService: createAuthService({ userRepo, secret: process.env.JWT_SECRET }),
    customerService: createCustomerService({ customerRepo }),
    deviceService: createDeviceService({ deviceRepo, customerRepo }),
    ticketService: createTicketService({ ticketRepo: createTicketRepository(db), customerRepo, deviceRepo }),
    userService: createUserService({ userRepo }),
    categoryService: createCategoryService({ categoryRepo: createCategoryRepository(db) }),
  });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const cleanupIds = { customerIds: [], deviceIds: [], ticketIds: [] };
  try {
    const login = await request(baseUrl, '/api/auth/login', { method: 'POST', body: { username: 'nv.tiepnhan01', password: process.env.WORKSHOP_TEST_PASSWORD || 'Demo@123' } });
    assert.equal(login.status, 200, 'login phai thanh cong');
    const token = login.data.token;

    const phone = `09${String(Date.now()).slice(-8)}`;
    const customer = await request(baseUrl, '/api/customers', { method: 'POST', token, body: { full_name: 'Race Test', phone, address: 'Temp' } });
    assert.equal(customer.status, 201);
    cleanupIds.customerIds.push(customer.data.customer_id);

    // --- Thu nghiem 1: 5 request tao phieu dong thoi cho CUNG mot khach/thiet bi, kiem tra ticket_code co trung khong ---
    const device = await request(baseUrl, '/api/devices', { method: 'POST', token, body: { customer_id: customer.data.customer_id, serial_no: `RACE-${Date.now()}`, product_name: 'Race Device' } });
    assert.equal(device.status, 201);
    cleanupIds.deviceIds.push(device.data.device_id);

    const N = 5;
    const creates = await Promise.all(
      Array.from({ length: N }, () => request(baseUrl, '/api/tickets', { method: 'POST', token, body: { customer_id: customer.data.customer_id, device_id: device.data.device_id, issue_desc: 'Race test concurrent create' } }))
    );
    const okCreates = creates.filter((r) => r.status === 201);
    const codes = okCreates.map((r) => r.data.ticket_code);
    const uniqueCodes = new Set(codes);
    okCreates.forEach((r) => cleanupIds.ticketIds.push(r.data.ticket_id));
    console.log(`TAO DONG THOI: ${okCreates.length}/${N} thanh cong, ma phieu: ${codes.join(', ')}`);
    assert.equal(uniqueCodes.size, codes.length, `PHAT HIEN TRUNG MA PHIEU: ${codes.join(', ')}`);
    console.log('KET QUA 1: khong co ma phieu trung nhau khi tao dong thoi -- PASS');

    // --- Thu nghiem 2: 2 request chuyen trang thai CUNG mot phieu dong thoi (MOI -> DA_PHAN_CONG) ---
    const ticketId = okCreates[0].data.ticket_id;
    const [first, second] = await Promise.all([
      request(baseUrl, `/api/tickets/${ticketId}/status`, { method: 'PATCH', token, body: { to_status: 'DA_PHAN_CONG' } }),
      request(baseUrl, `/api/tickets/${ticketId}/status`, { method: 'PATCH', token, body: { to_status: 'DA_PHAN_CONG' } }),
    ]);
    const statuses = [first.status, second.status].sort();
    console.log(`CHUYEN TRANG THAI DONG THOI: request 1 = ${first.status}, request 2 = ${second.status}`);
    const logs = await db.query('SELECT count(*)::int AS n FROM ticket_status_log WHERE ticket_id = $1 AND to_status = $2', [ticketId, 'DA_PHAN_CONG']);
    console.log(`SO LOG to_status=DA_PHAN_CONG trong DB: ${logs.rows[0].n}`);
    assert.equal(logs.rows[0].n, 1, `PHAT HIEN DOUBLE LOG: ${logs.rows[0].n} dong log cho 1 lan chuyen hop le`);
    assert.deepEqual(statuses, [200, 409], `Ky vong 1 request 200 va 1 request 409 (loai tru lan nhau), thuc te: ${JSON.stringify(statuses)}`);
    console.log('KET QUA 2: dung 1 request thanh cong, 1 request bi tu choi, dung 1 dong log -- PASS');
  } finally {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const id of cleanupIds.ticketIds) {
        await client.query('DELETE FROM ticket_status_log WHERE ticket_id = $1', [id]);
        await client.query('DELETE FROM ticket WHERE ticket_id = $1', [id]);
      }
      for (const id of cleanupIds.deviceIds) await client.query('DELETE FROM device WHERE device_id = $1', [id]);
      for (const id of cleanupIds.customerIds) await client.query('DELETE FROM customer WHERE customer_id = $1', [id]);
      await client.query('COMMIT');
      console.log('CLEANUP xong');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    await new Promise((resolve) => server.close(resolve));
    await db.end();
  }
}

main().catch((err) => {
  console.error(`THAT BAI THAT SU: ${err.message}`);
  process.exitCode = 1;
});
