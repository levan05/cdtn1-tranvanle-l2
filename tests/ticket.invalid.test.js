const test = require('node:test');
const assert = require('node:assert');
const createTicketService = require('../src/services/ticket.service');

const user = { username: 'nv.tiepnhan01', role: 'NHAN_VIEN_TIEP_NHAN', center_id: 1 };

// Repository gia: khong can PostgreSQL, ghi lai cac loi goi de kiem tra
function makeService({ ticket = null } = {}) {
  const calls = { inserted: [], logs: [], statusUpdates: [] };
  const tx = {
    nextTicketId: async () => 101,
    insert: async (t) => calls.inserted.push(t),
    insertLog: async (l) => calls.logs.push(l),
    findForUpdate: async () => ticket,
    updateStatus: async (id, status) => calls.statusUpdates.push([id, status]),
  };
  const service = createTicketService({
    ticketRepo: { runInTransaction: (work) => work(tx) },
    customerRepo: { findById: async (id) => (id === 5 ? { customer_id: 5 } : null) },
    deviceRepo: { findById: async (id) => (id === 12 ? { device_id: 12, customer_id: 5 } : null) },
    now: () => new Date('2026-10-07T09:00:00+07:00'),
  });
  return { service, calls };
}

async function loi(promise) {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  assert.fail('Phai nem loi nhung lai chay thanh cong');
}

test('tao phieu thieu mo ta loi bi tu choi kem ten truong va khong ghi gi', async () => {
  const { service, calls } = makeService();
  const err = await loi(service.create({ customer_id: 5, device_id: 12, issue_desc: '   ' }, user));
  assert.strictEqual(err.code, 'VALIDATION_ERROR');
  assert.ok(err.fields.issue_desc);
  assert.strictEqual(calls.inserted.length, 0);
});

test('tao phieu cho khach khong ton tai tra CUSTOMER_NOT_FOUND', async () => {
  const { service } = makeService();
  const err = await loi(service.create({ customer_id: 999, device_id: 12, issue_desc: 'Loi' }, user));
  assert.strictEqual(err.code, 'CUSTOMER_NOT_FOUND');
});

test('chuyen nguoc trang thai bi tu choi va khong ghi log', async () => {
  const { service, calls } = makeService({ ticket: { ticket_id: 7, status: 'DANG_XU_LY', center_id: 1 } });
  const err = await loi(service.changeStatus(7, { to_status: 'MOI' }, user));
  assert.strictEqual(err.code, 'INVALID_TRANSITION');
  assert.strictEqual(calls.logs.length, 0);
  assert.strictEqual(calls.statusUpdates.length, 0);
});

test('nhay coc trang thai bi tu choi kem goi y trang thai ke tiep', async () => {
  const { service } = makeService({ ticket: { ticket_id: 7, status: 'MOI', center_id: 1 } });
  const err = await loi(service.changeStatus(7, { to_status: 'DANG_XU_LY' }, user));
  assert.strictEqual(err.code, 'INVALID_TRANSITION');
  assert.match(err.fields.to_status, /DA_PHAN_CONG/);
});

test('trang thai khong thuoc vong doi bi tu choi kem ten truong', async () => {
  const { service } = makeService({ ticket: { ticket_id: 7, status: 'MOI', center_id: 1 } });
  const err = await loi(service.changeStatus(7, { to_status: 'XYZ' }, user));
  assert.strictEqual(err.code, 'VALIDATION_ERROR');
  assert.ok(err.fields.to_status);
});
