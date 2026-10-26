const test = require('node:test');
const assert = require('node:assert');
const { tinhHanCamKet } = require('../src/services/deadline');

test('phieu CAO nhan thu hai 09:00 co han thu ba 09:00', () => {
  const han = tinhHanCamKet('2026-10-19T09:00:00+07:00', 'CAO');
  assert.strictEqual(han.toISOString(), '2026-10-20T02:00:00.000Z');
});

test('phieu CAO nhan Thu Bay 10:00 bo qua Chu Nhat, han Thu Hai 10:00', () => {
  const han = tinhHanCamKet('2026-10-24T10:00:00+07:00', 'CAO');
  assert.strictEqual(han.toISOString(), '2026-10-26T03:00:00.000Z');
});

test('phieu CAO nhan Chu Nhat 10:00 dem tu 00:00 Thu Hai, han Thu Ba 00:00', () => {
  const han = tinhHanCamKet('2026-10-25T10:00:00+07:00', 'CAO');
  assert.strictEqual(han.toISOString(), '2026-10-26T17:00:00.000Z');
});

test('phieu CAO nhan Thu Bay 23:59 van bo qua tron Chu Nhat', () => {
  const han = tinhHanCamKet('2026-10-24T23:59:00+07:00', 'CAO');
  assert.strictEqual(han.toISOString(), '2026-10-26T16:59:00.000Z');
});

test('ba muc uu tien cho han 24, 72 va 120 gio khi khong gap Chu Nhat', () => {
  const nhan = '2026-10-19T09:00:00+07:00';
  assert.strictEqual(tinhHanCamKet(nhan, 'CAO').toISOString(), '2026-10-20T02:00:00.000Z');
  assert.strictEqual(tinhHanCamKet(nhan, 'TRUNG_BINH').toISOString(), '2026-10-22T02:00:00.000Z');
  assert.strictEqual(tinhHanCamKet(nhan, 'THAP').toISOString(), '2026-10-24T02:00:00.000Z');
});
