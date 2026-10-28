const test = require('node:test');
const assert = require('node:assert');
const { errorHandler } = require('../src/routes/http-errors');

function run(err) {
  const out = {};
  const res = {
    status(code) {
      out.status = code;
      return this;
    },
    json(body) {
      out.body = body;
      return this;
    },
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    errorHandler(err, { path: '/api/tickets' }, res, () => {});
  } finally {
    console.error = originalError;
  }
  return out;
}

test('mat ket noi co so du lieu tra 503 voi thong bao ro rang', () => {
  const out = run(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }));
  assert.strictEqual(out.status, 503);
  assert.strictEqual(out.body.error.code, 'DATABASE_UNAVAILABLE');
});

test('loi ket noi nam trong AggregateError cung tra 503', () => {
  const inner = Object.assign(new Error('refused'), { code: 'ECONNREFUSED' });
  const out = run(Object.assign(new AggregateError([inner], 'khong ket noi duoc'), { code: undefined }));
  assert.strictEqual(out.status, 503);
});

test('loi la khong lo chi tiet thu vien ra ngoai', () => {
  const out = run(new Error('relation "ticket" does not exist'));
  assert.strictEqual(out.status, 500);
  assert.strictEqual(out.body.error.code, 'INTERNAL_ERROR');
  assert.ok(!JSON.stringify(out.body).includes('relation'));
});
