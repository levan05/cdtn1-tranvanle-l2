const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const createAuthService = require('../src/services/auth.service');
const createTicketService = require('../src/services/ticket.service');
const { validateTicketInput } = require('../src/validators/ticket.validator');
const { tinhHanCamKet } = require('../src/services/deadline');
const createApp = require('../src/app');
const http = require('node:http');
const { types } = require('pg');
require('../src/db');

const user = { username: 'nv.tiepnhan01', role: 'NHAN_VIEN_TIEP_NHAN', center_id: 1 };
const secret = 'workshop-test-secret-with-at-least-32-characters';

function makeCreateService({ customerExists = true, deviceCustomerId = 5 } = {}) {
  const saved = { tickets: [], logs: [] };
  const tx = {
    nextTicketId: async () => 101,
    insert: async (ticket) => saved.tickets.push(ticket),
    insertLog: async (log) => saved.logs.push(log),
  };
  const service = createTicketService({
    ticketRepo: { runInTransaction: (work) => work(tx) },
    customerRepo: { findById: async () => (customerExists ? { customer_id: 5 } : null) },
    deviceRepo: { findById: async () => ({ device_id: 12, customer_id: deviceCustomerId }) },
    now: () => new Date('2026-10-19T09:00:00+07:00'),
  });
  return { service, saved };
}

function makeEmptyApp(ticketService = {}) {
  return createApp({
    db: { query: async () => ({ rows: [{ '?column?': 1 }] }) },
    authService: { verify: (token) => jwt.verify(token, secret) },
    customerService: {},
    deviceService: {},
    ticketService,
    userService: {},
    categoryService: {},
  });
}

async function withServer(app, callback) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

test('TC-01 login hop le tra JWT co dung vai tro va trung tam', async () => {
  const auth = createAuthService({
    userRepo: {
      findByCredentials: async () => ({
        user_id: 1,
        username: user.username,
        role: user.role,
        center_id: user.center_id,
      }),
    },
    secret,
  });

  const result = await auth.login(user.username, 'demo-password');
  const payload = jwt.verify(result.token, secret);
  assert.equal(payload.username, user.username);
  assert.equal(payload.role, user.role);
  assert.equal(payload.center_id, user.center_id);
});

test('TC-02 tao phieu hop le ghi mot phieu va log dau cung center', async () => {
  assert.equal(typeof types.getTypeParser(20)('101'), 'number');
  const { service, saved } = makeCreateService();
  const result = await service.create(
    { customer_id: 5, device_id: 12, issue_desc: 'Man hinh bi soc' },
    user
  );

  assert.equal(result.ticket_code, 'BH000101/2026');
  assert.equal(result.status, 'MOI');
  assert.equal(saved.tickets.length, 1);
  assert.equal(saved.tickets[0].center_id, user.center_id);
  assert.deepEqual(saved.logs, [{
    ticket_id: 101,
    from_status: null,
    to_status: 'MOI',
    changed_by: user.username,
  }]);
});

test('TC-03 chuyen trang thai ke tiep cap nhat va ghi log', async () => {
  const updates = [];
  const logs = [];
  const tx = {
    findForUpdate: async () => ({ ticket_id: 7, status: 'MOI', center_id: 1 }),
    updateStatus: async (id, status) => updates.push([id, status]),
    insertLog: async (log) => logs.push(log),
  };
  const service = createTicketService({ ticketRepo: { runInTransaction: (work) => work(tx) } });

  assert.deepEqual(await service.changeStatus(7, { to_status: 'DA_PHAN_CONG' }, user), {
    ticket_id: 7,
    status: 'DA_PHAN_CONG',
  });
  assert.deepEqual(updates, [[7, 'DA_PHAN_CONG']]);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].changed_by, user.username);
});

test('TC-04 bien han CAO nhan sat Chu Nhat bo qua tron ngay nghi', () => {
  assert.equal(
    tinhHanCamKet('2026-10-24T23:59:00+07:00', 'CAO').toISOString(),
    '2026-10-26T16:59:00.000Z'
  );
});

test('TC-05 bien mo ta 2000 ky tu duoc chap nhan va 2001 bi tu choi', () => {
  assert.equal(validateTicketInput({
    customer_id: 5,
    device_id: 12,
    issue_desc: 'x'.repeat(2000),
  }).issue_desc.length, 2000);
  assert.throws(
    () => validateTicketInput({ customer_id: 5, device_id: 12, issue_desc: 'x'.repeat(2001) }),
    (err) => err.code === 'VALIDATION_ERROR' && Boolean(err.fields.issue_desc)
  );
});

test('TC-06 du lieu sai mo ta rong tra loi ro truong va khong ghi du lieu', async () => {
  const { service, saved } = makeCreateService();
  await assert.rejects(
    service.create({ customer_id: 5, device_id: 12, issue_desc: '  ' }, user),
    (err) => err.code === 'VALIDATION_ERROR' && Boolean(err.fields.issue_desc)
  );
  assert.equal(saved.tickets.length, 0);
  assert.equal(saved.logs.length, 0);
});

test('TC-07 khach khong ton tai bi tu choi va khong tao phieu', async () => {
  const { service, saved } = makeCreateService({ customerExists: false });
  await assert.rejects(
    service.create({ customer_id: 5, device_id: 12, issue_desc: 'Mat nguon' }, user),
    (err) => err.code === 'CUSTOMER_NOT_FOUND'
  );
  assert.equal(saved.tickets.length, 0);
  assert.equal(saved.logs.length, 0);
});

test('TC-08 nhay coc trang thai bi tu choi va khong cap nhat hay ghi log', async () => {
  const updates = [];
  const logs = [];
  const tx = {
    findForUpdate: async () => ({ ticket_id: 7, status: 'MOI', center_id: 1 }),
    updateStatus: async (...args) => updates.push(args),
    insertLog: async (...args) => logs.push(args),
  };
  const service = createTicketService({ ticketRepo: { runInTransaction: (work) => work(tx) } });
  const token = jwt.sign(user, secret);

  await withServer(makeEmptyApp(service), async (base) => {
    const response = await fetch(`${base}/api/tickets/7/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_status: 'DANG_XU_LY' }),
    });
    const body = await response.json();
    assert.equal(response.status, 409);
    assert.equal(body.error.code, 'INVALID_TRANSITION');
    assert.match(body.error.fields.to_status, /DA_PHAN_CONG/);
  });
  assert.equal(updates.length, 0);
  assert.equal(logs.length, 0);
});

test('TC-09 API phieu khong co JWT tra 401 va khong goi service', async () => {
  let called = false;
  const app = makeEmptyApp({ list: () => { called = true; return { tickets: [] }; } });

  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/tickets`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'UNAUTHENTICATED');
    assert.equal(called, false);
  });
});

test('TC-10 danh sach luon loc center token va khong doc duoc phieu center khac', async () => {
  let usedCenter;
  const service = createTicketService({
    ticketRepo: {
      list: async ({ centerId }) => {
        usedCenter = centerId;
        return { total: 0, rows: [] };
      },
      findById: async () => ({ ticket_id: 8, center_id: 2 }),
    },
    now: () => new Date('2026-10-19T09:00:00+07:00'),
  });
  await service.list({ center_id: 2 }, user);
  assert.equal(usedCenter, user.center_id);
  await assert.rejects(
    service.getById(8, user),
    (err) => err.code === 'TICKET_NOT_FOUND'
  );
});

test('TC-11 thiet bi cua khach khac bi tu choi khong ghi phieu hoac log', async () => {
  const { service, saved } = makeCreateService({ deviceCustomerId: 99 });
  await assert.rejects(
    service.create({ customer_id: 5, device_id: 12, issue_desc: 'Man hinh bi soc' }, user),
    (err) => err.code === 'VALIDATION_ERROR' && Boolean(err.fields.device_id)
  );
  assert.equal(saved.tickets.length, 0);
  assert.equal(saved.logs.length, 0);
});
