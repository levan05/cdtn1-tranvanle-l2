const test = require('node:test');
const assert = require('node:assert');
const { tinhHanCamKet } = require('../src/services/deadline');

test('phieu CAO nhan thu hai 09:00 co han thu ba 09:00', () => {
  const han = tinhHanCamKet('2026-10-19T09:00:00+07:00', 'CAO');
  assert.strictEqual(han.toISOString(), '2026-10-20T02:00:00.000Z');
});
