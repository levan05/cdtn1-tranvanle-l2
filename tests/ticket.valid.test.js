const test = require('node:test');
const assert = require('node:assert');
const createTicketService = require('../src/services/ticket.service');

const user = { username: 'nv.tiepnhan01', role: 'NHAN_VIEN_TIEP_NHAN', center_id: 1 };

// Repository gia: ghi lai phieu va log duoc luu, khong can PostgreSQL
function makeService() {
  const saved = { tickets: [], logs: [] };
  const tx = {
    nextTicketId: async () => 101,
    insert: async (t) => saved.tickets.push(t),
    insertLog: async (l) => saved.logs.push(l),
  };
  const service = createTicketService({
    ticketRepo: { runInTransaction: (work) => work(tx) },
    customerRepo: { findById: async () => ({ customer_id: 5 }) },
    deviceRepo: { findById: async () => ({ device_id: 12, customer_id: 5 }) },
    now: () => new Date('2026-10-07T09:00:00+07:00'),
  });
  return { service, saved };
}

test('tao phieu hop le sinh ma BH000101/2026, trang thai MOI, han cam ket va log dau', async () => {
  const { service, saved } = makeService();
  const result = await service.create(
    { customer_id: 5, device_id: 12, issue_desc: 'May bi den man hinh' },
    user
  );

  assert.strictEqual(result.ticket_code, 'BH000101/2026');
  assert.strictEqual(result.status, 'MOI');
  assert.strictEqual(result.category, 'MAN_HINH');
  assert.strictEqual(result.priority, 'TRUNG_BINH');
  assert.strictEqual(result.due_date, '2026-10-10T02:00:00.000Z');

  assert.strictEqual(saved.tickets.length, 1);
  assert.strictEqual(saved.tickets[0].center_id, 1);
  assert.deepStrictEqual(
    { from: saved.logs[0].from_status, to: saved.logs[0].to_status, by: saved.logs[0].changed_by },
    { from: null, to: 'MOI', by: 'nv.tiepnhan01' }
  );
});

test('chuyen trang thai dung thu tu cap nhat phieu va ghi log nguoi thuc hien', async () => {
  const updates = [];
  const logs = [];
  const tx = {
    findForUpdate: async () => ({ ticket_id: 7, status: 'MOI', center_id: 1 }),
    updateStatus: async (id, status) => updates.push([id, status]),
    insertLog: async (l) => logs.push(l),
  };
  const service = createTicketService({ ticketRepo: { runInTransaction: (work) => work(tx) } });

  const result = await service.changeStatus(7, { to_status: 'DA_PHAN_CONG' }, user);

  assert.deepStrictEqual(result, { ticket_id: 7, status: 'DA_PHAN_CONG' });
  assert.deepStrictEqual(updates, [[7, 'DA_PHAN_CONG']]);
  assert.strictEqual(logs[0].from_status, 'MOI');
  assert.strictEqual(logs[0].to_status, 'DA_PHAN_CONG');
  assert.strictEqual(logs[0].changed_by, 'nv.tiepnhan01');
});
