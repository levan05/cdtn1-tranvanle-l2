require('dotenv').config({ quiet: true });

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const http = require('node:http');
const db = require('../src/db');
const { tinhHanCamKet } = require('../src/services/deadline');
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

const records = { ticketIds: [], deviceIds: [], customerIds: [], userIds: [], centerIds: [] };
const selectedIds = new Set(process.argv.slice(2));
let baseUrl;
let server;
let sequence = 0;
let executed = 0;
const resultLines = [];
const caseIds = Array.from({ length: 12 }, (_, index) => `TC-${String(index + 1).padStart(2, '0')}`);

function log(message) {
  resultLines.push(message);
  console.log(message);
}

function assertStatus(result, expected, label) {
  assert.equal(result.status, expected, `${label}: ${JSON.stringify(result.data)}`);
}

function createApplication() {
  if (!process.env.JWT_SECRET) throw new Error('Missing JWT_SECRET; configure .env.');
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

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}

async function login(username = 'nv.tiepnhan01', password = process.env.WORKSHOP_TEST_PASSWORD || 'Demo@123') {
  const result = await request('/api/auth/login', { method: 'POST', body: { username, password } });
  assertStatus(result, 200, 'login');
  assert.ok(result.data.token);
  return result.data;
}

function nextPhone() {
  sequence += 1;
  return `08${String(Date.now()).slice(-6)}${String(sequence).padStart(2, '0')}`;
}

async function createCustomerAndDevice(token, options = {}) {
  const phone = nextPhone();
  const customer = await request('/api/customers', {
    method: 'POST',
    token,
    body: {
      full_name: options.fullName || 'Workshop Integration Test',
      phone,
      address: 'Temporary test record',
    },
  });
  assertStatus(customer, 201, 'create customer');
  records.customerIds.push(customer.data.customer_id);

  const device = await request('/api/devices', {
    method: 'POST',
    token,
    body: {
      customer_id: customer.data.customer_id,
      serial_no: `B14-${Date.now()}-${sequence}`,
      product_name: 'Workshop Integration Device',
    },
  });
  assertStatus(device, 201, 'create device');
  records.deviceIds.push(device.data.device_id);

  return { customerId: customer.data.customer_id, deviceId: device.data.device_id, phone };
}

async function createTicket(token, customerId, deviceId, issueDesc = 'Man hinh bi soc') {
  const result = await request('/api/tickets', {
    method: 'POST',
    token,
    body: { customer_id: customerId, device_id: deviceId, issue_desc: issueDesc },
  });
  if (result.status === 201 && result.data.ticket_id) records.ticketIds.push(result.data.ticket_id);
  return result;
}

async function countTicketsForCustomer(customerId) {
  const result = await db.query('SELECT count(*)::int AS count FROM ticket WHERE customer_id = $1', [customerId]);
  return result.rows[0].count;
}

async function testCase(id, category, description, run) {
  if (selectedIds.size > 0 && !selectedIds.has(id)) return true;
  executed += 1;
  try {
    const detail = await run();
    log(`PASS ${id} [${category}] ${description} — ${detail}`);
    return true;
  } catch (error) {
    log(`FAIL ${id} [${category}] ${description} — ${error.message}`);
    return false;
  }
}

function runSql(directory) {
  const result = spawnSync(process.execPath, ['scripts/run-sql.js', directory], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`${directory} exited with ${result.status}`);
}

async function tableCounts() {
  const names = ['service_center', 'issue_category', 'app_user', 'customer', 'device', 'ticket', 'ticket_status_log'];
  const counts = {};
  for (const name of names) {
    const result = await db.query(`SELECT count(*)::int AS count FROM "${name}"`);
    counts[name] = result.rows[0].count;
  }
  return counts;
}

async function cleanup() {
  const hasRecords = Object.values(records).some((ids) => ids.length > 0);
  if (!hasRecords) return;

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const id of records.ticketIds) {
      await client.query('DELETE FROM ticket_status_log WHERE ticket_id = $1', [id]);
      await client.query('DELETE FROM ticket WHERE ticket_id = $1', [id]);
    }
    for (const id of records.deviceIds) await client.query('DELETE FROM device WHERE device_id = $1', [id]);
    for (const id of records.customerIds) await client.query('DELETE FROM customer WHERE customer_id = $1', [id]);
    for (const id of records.userIds) await client.query('DELETE FROM app_user WHERE user_id = $1', [id]);
    for (const id of records.centerIds) await client.query('DELETE FROM service_center WHERE center_id = $1', [id]);
    await client.query('COMMIT');
    for (const ids of Object.values(records)) ids.length = 0;
    log('CLEANUP temporary test records removed');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const invalidIds = [...selectedIds].filter((id) => !caseIds.includes(id));
  if (invalidIds.length > 0) throw new Error(`Unknown test case(s): ${invalidIds.join(', ')}`);
  if (process.env.WORKSHOP_ALLOW_DB_WRITE !== '1') {
    throw new Error('Set WORKSHOP_ALLOW_DB_WRITE=1 only after confirming .env points to a disposable local test database.');
  }
  if (!process.env.DB_NAME || !/test|thu|workshop/i.test(process.env.DB_NAME)) {
    throw new Error(`Refusing database "${process.env.DB_NAME || '(unset)'}"; use a separate database name containing test, thu, or workshop.`);
  }

  const health = await db.query('SELECT current_database() AS name, inet_server_addr()::text AS address');
  if (health.rows[0].name !== process.env.DB_NAME) throw new Error('Connected database does not match DB_NAME.');
  log(`DATABASE ${health.rows[0].name} @ ${health.rows[0].address || 'local socket'}`);

  let failures = 0;
  try {
    server = http.createServer(createApplication());
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    log(`SERVER ${baseUrl}`);

    if (!await testCase('TC-01', 'luồng đúng', 'Đăng nhập thật bằng tài khoản seed', async () => {
      const auth = await login();
      assert.equal(auth.user.username, 'nv.tiepnhan01');
      assert.equal(auth.user.role, 'NHAN_VIEN_TIEP_NHAN');
      assert.equal(typeof auth.user.center_id, 'number');
      return `HTTP 200, role=${auth.user.role}, center_id=${auth.user.center_id}`;
    })) failures += 1;

    if (!await testCase('TC-02', 'luồng đúng', 'Tạo phiếu qua API và xác minh PostgreSQL', async () => {
      const auth = await login();
      const fixture = await createCustomerAndDevice(auth.token);
      const ticket = await createTicket(auth.token, fixture.customerId, fixture.deviceId);
      assertStatus(ticket, 201, 'create ticket');
      const saved = await db.query(
        `SELECT t.ticket_code, t.status, t.center_id, count(l.log_id)::int AS logs
         FROM ticket t LEFT JOIN ticket_status_log l ON l.ticket_id = t.ticket_id
         WHERE t.ticket_id = $1 GROUP BY t.ticket_id`,
        [ticket.data.ticket_id]
      );
      assert.equal(saved.rows.length, 1);
      assert.equal(saved.rows[0].status, 'MOI');
      assert.equal(saved.rows[0].center_id, auth.user.center_id);
      assert.equal(saved.rows[0].logs, 1);
      return `POST 201, ${saved.rows[0].ticket_code}, DB status=${saved.rows[0].status}, log count=${saved.rows[0].logs}`;
    })) failures += 1;

    if (!await testCase('TC-03', 'luồng đúng', 'Chuyển trạng thái và xác minh log trong DB', async () => {
      const auth = await login();
      const fixture = await createCustomerAndDevice(auth.token);
      const ticket = await createTicket(auth.token, fixture.customerId, fixture.deviceId);
      assertStatus(ticket, 201, 'create ticket');
      const changed = await request(`/api/tickets/${ticket.data.ticket_id}/status`, {
        method: 'PATCH',
        token: auth.token,
        body: { to_status: 'DA_PHAN_CONG' },
      });
      assertStatus(changed, 200, 'change status');
      const saved = await db.query(
        `SELECT t.status, count(l.log_id)::int AS logs,
                max(l.changed_by) FILTER (WHERE l.to_status = 'DA_PHAN_CONG') AS changed_by
         FROM ticket t JOIN ticket_status_log l ON l.ticket_id = t.ticket_id
         WHERE t.ticket_id = $1 GROUP BY t.ticket_id`,
        [ticket.data.ticket_id]
      );
      assert.equal(saved.rows[0].status, 'DA_PHAN_CONG');
      assert.equal(saved.rows[0].logs, 2);
      assert.equal(saved.rows[0].changed_by, auth.user.username);
      return `PATCH 200, DB status=${saved.rows[0].status}, logs=${saved.rows[0].logs}`;
    })) failures += 1;

    if (!await testCase('TC-04', 'giá trị biên', 'Hạn CAO nhận sát cuối Thứ Bảy', async () => {
      const due = tinhHanCamKet('2026-10-24T23:59:00+07:00', 'CAO').toISOString();
      assert.equal(due, '2026-10-26T16:59:00.000Z');
      return `due_date=${due}`;
    })) failures += 1;

    if (!await testCase('TC-05', 'giá trị biên', 'Độ dài mô tả 2000/2001 ký tự qua API', async () => {
      const auth = await login();
      const fixture = await createCustomerAndDevice(auth.token);
      const accepted = await createTicket(auth.token, fixture.customerId, fixture.deviceId, 'x'.repeat(2000));
      assertStatus(accepted, 201, '2000-character description');
      const rejected = await createTicket(auth.token, fixture.customerId, fixture.deviceId, 'x'.repeat(2001));
      assertStatus(rejected, 400, '2001-character description');
      assert.equal(rejected.data.error.code, 'VALIDATION_ERROR');
      assert.ok(rejected.data.error.fields.issue_desc);
      return `2000 chars HTTP 201; 2001 chars HTTP 400 ${rejected.data.error.code}`;
    })) failures += 1;

    if (!await testCase('TC-06', 'dữ liệu sai', 'Mô tả rỗng không tạo phiếu hay log', async () => {
      const auth = await login();
      const fixture = await createCustomerAndDevice(auth.token);
      const before = await countTicketsForCustomer(fixture.customerId);
      const rejected = await createTicket(auth.token, fixture.customerId, fixture.deviceId, '   ');
      assertStatus(rejected, 400, 'blank description');
      assert.ok(rejected.data.error.fields.issue_desc);
      const after = await countTicketsForCustomer(fixture.customerId);
      assert.equal(after, before);
      return `HTTP 400 ${rejected.data.error.code}; ticket count ${before} -> ${after}`;
    })) failures += 1;

    if (!await testCase('TC-07', 'dữ liệu sai', 'Khách hàng không tồn tại bị từ chối', async () => {
      const auth = await login();
      const device = await db.query('SELECT device_id FROM device ORDER BY device_id LIMIT 1');
      assert.ok(device.rows[0], 'seed device required');
      const missingCustomer = 2000000000;
      const exists = await db.query('SELECT 1 FROM customer WHERE customer_id = $1', [missingCustomer]);
      assert.equal(exists.rowCount, 0);
      const rejected = await createTicket(auth.token, missingCustomer, device.rows[0].device_id, 'Mat nguon');
      assertStatus(rejected, 404, 'missing customer');
      assert.equal(rejected.data.error.code, 'CUSTOMER_NOT_FOUND');
      return `HTTP 404 ${rejected.data.error.code}`;
    })) failures += 1;

    if (!await testCase('TC-08', 'dữ liệu sai', 'Nhảy cóc trạng thái không sửa phiếu hay ghi log', async () => {
      const auth = await login();
      const fixture = await createCustomerAndDevice(auth.token);
      const ticket = await createTicket(auth.token, fixture.customerId, fixture.deviceId);
      assertStatus(ticket, 201, 'create ticket');
      const before = await db.query(
        'SELECT status, (SELECT count(*)::int FROM ticket_status_log WHERE ticket_id = $1) AS logs FROM ticket WHERE ticket_id = $1',
        [ticket.data.ticket_id]
      );
      const rejected = await request(`/api/tickets/${ticket.data.ticket_id}/status`, {
        method: 'PATCH',
        token: auth.token,
        body: { to_status: 'DANG_XU_LY' },
      });
      assertStatus(rejected, 409, 'skip status');
      assert.equal(rejected.data.error.code, 'INVALID_TRANSITION');
      const after = await db.query(
        'SELECT status, (SELECT count(*)::int FROM ticket_status_log WHERE ticket_id = $1) AS logs FROM ticket WHERE ticket_id = $1',
        [ticket.data.ticket_id]
      );
      assert.deepEqual(after.rows[0], before.rows[0]);
      return `HTTP 409 ${rejected.data.error.code}; status/log count unchanged (${after.rows[0].status}/${after.rows[0].logs})`;
    })) failures += 1;

    if (!await testCase('TC-09', 'bảo mật', 'Endpoint phiếu yêu cầu JWT', async () => {
      const result = await request('/api/tickets');
      assertStatus(result, 401, 'missing token');
      assert.equal(result.data.error.code, 'UNAUTHENTICATED');
      return `HTTP 401 ${result.data.error.code}`;
    })) failures += 1;

    if (!await testCase('TC-10', 'bảo mật / chất lượng dữ liệu', 'Nhân viên không truy cập phiếu trung tâm khác', async () => {
      const auth = await login();
      const center = await db.query(
        "INSERT INTO service_center (center_name, address) VALUES ($1, $2) RETURNING center_id",
        [`Workshop Center ${Date.now()}`, 'Temporary isolated test center']
      );
      const otherCenterId = center.rows[0].center_id;
      records.centerIds.push(otherCenterId);
      const username = `b14_${Date.now()}_${sequence}`;
      const password = `Workshop-${Date.now()}-X9`;
      const otherUser = await db.query(
        `INSERT INTO app_user (username, password_hash, full_name, role, center_id)
         VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5) RETURNING user_id`,
        [username, password, 'Workshop User', 'NHAN_VIEN_TIEP_NHAN', otherCenterId]
      );
      records.userIds.push(otherUser.rows[0].user_id);
      const otherAuth = await login(username, password);
      const fixture = await createCustomerAndDevice(otherAuth.token);
      const ticket = await createTicket(otherAuth.token, fixture.customerId, fixture.deviceId);
      assertStatus(ticket, 201, 'create other-center ticket');

      const list = await request(`/api/tickets?phone=${fixture.phone}`, { token: auth.token });
      assertStatus(list, 200, 'list tickets');
      assert.equal(list.data.tickets.length, 0);
      const detail = await request(`/api/tickets/${ticket.data.ticket_id}`, { token: auth.token });
      assertStatus(detail, 404, 'other-center detail');
      assert.equal(detail.data.error.code, 'TICKET_NOT_FOUND');
      return `other center ticket hidden: list count=0; detail HTTP 404`;
    })) failures += 1;

    if (!await testCase('TC-11', 'bảo mật / chất lượng dữ liệu', 'Thiết bị gắn với khách khác không tạo phiếu', async () => {
      const auth = await login();
      const fixture = await createCustomerAndDevice(auth.token);
      const secondCustomerResult = await request('/api/customers', {
        method: 'POST',
        token: auth.token,
        body: { full_name: 'Workshop Second Customer', phone: nextPhone(), address: 'Temporary' },
      });
      assertStatus(secondCustomerResult, 201, 'create second customer');
      records.customerIds.push(secondCustomerResult.data.customer_id);
      const before = await countTicketsForCustomer(secondCustomerResult.data.customer_id);
      const rejected = await request('/api/tickets', {
        method: 'POST',
        token: auth.token,
        body: {
          customer_id: secondCustomerResult.data.customer_id,
          device_id: fixture.deviceId,
          issue_desc: 'Man hinh bi soc',
        },
      });
      assertStatus(rejected, 400, 'mismatched device owner');
      assert.equal(rejected.data.error.code, 'VALIDATION_ERROR');
      const after = await countTicketsForCustomer(secondCustomerResult.data.customer_id);
      assert.equal(after, before);
      return `HTTP 400 ${rejected.data.error.code}; ticket count ${before} -> ${after}`;
    })) failures += 1;

    if (!await testCase('TC-12', 'tái lập', 'Migration và seed chạy lại không đổi số dòng', async () => {
      await cleanup();
      const before = await tableCounts();
      runSql('migrations');
      runSql('seeds');
      runSql('migrations');
      runSql('seeds');
      const after = await tableCounts();
      assert.deepEqual(after, before);
      return `row counts unchanged: ${JSON.stringify(after)}`;
    })) failures += 1;
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      await cleanup();
    } finally {
      await db.end();
    }
  }

  const passed = executed - failures;
  log(`SUMMARY ${passed}/${executed} PASS, ${failures}/${executed} FAIL`);
  if (selectedIds.size === 0) {
    require('node:fs').writeFileSync('docs/workshop-integration-results.txt', `${resultLines.join('\n')}\n`);
  }
  if (failures > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(`Integration run aborted: ${error.message}`);
  try {
    await cleanup();
  } catch (cleanupError) {
    console.error(`Cleanup failed: ${cleanupError.message}`);
  }
  await db.end();
  process.exitCode = 1;
});
