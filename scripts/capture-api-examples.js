// Capture real responses on a disposable database; never print JWTs or passwords.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const fs = require('node:fs');
const db = require('../src/db');
const createApp = require('../src/app');
const samples = [];
let server;
let userId;
let customerId;
let deviceId;
let ticketId;
async function main() {
  assert.match(process.env.DB_NAME || '', /test|thu|workshop/i);
  assert.equal(process.env.WORKSHOP_ALLOW_DB_WRITE, '1');
  const services = { db };
  const repos = {};
  for (const name of ['user', 'customer', 'device', 'ticket', 'category']) {
    repos[name + 'Repo'] = require(`../src/repositories/${name}.repository`)(db);
  }
  for (const name of ['auth', 'customer', 'device', 'ticket', 'user', 'category']) {
    services[name + 'Service'] = require(`../src/services/${name}.service`)({ ...repos, secret: process.env.JWT_SECRET });
  }
  server = createApp(services).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function call(method, path, body, token, expected = 200) {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = res.status === 204 ? null : await res.json();
    assert.equal(res.status, expected, `${method} ${path}`);
    samples.push({ method, path, request: body ? { ...body, ...(body.password ? { password: '<demo password redacted>' } : {}) } : null, status: res.status, response: data && data.token ? { ...data, token: '<JWT redacted>' } : data });
    return data;
  }
  await call('GET', '/health');
  const auth = await call('POST', '/api/auth/login', { username: 'ql.ninhkieu', password: 'Demo@123' });
  const token = auth.token;
  await call('GET', '/api/categories', null, token);
  await call('GET', '/api/users', null, token);
  const stamp = Date.now();
  const user = await call('POST', '/api/users', { username: `bt3_${stamp}`, password: 'DemoCapture@123', full_name: 'API capture fixture' }, token, 201);
  userId = user.user_id;
  const body = { full_name: 'API capture fixture', phone: `08${String(stamp).slice(-8)}`, address: 'Synthetic fixture' };
  const customer = await call('POST', '/api/customers', body, token, 201);
  customerId = customer.customer_id;
  await call('GET', '/api/customers?page=1&size=1', null, token);
  await call('GET', `/api/customers?phone=${body.phone}`, null, token);
  await call('GET', `/api/customers/${customerId}`, null, token);
  await call('PUT', `/api/customers/${customerId}`, body, token);
  const deviceBody = { customer_id: customerId, serial_no: `BT3-${stamp}`, product_name: 'Demo device' };
  const device = await call('POST', '/api/devices', deviceBody, token, 201);
  deviceId = device.device_id;
  await call('GET', `/api/customers/${customerId}/devices`, null, token);
  await call('GET', `/api/devices/${deviceId}`, null, token);
  await call('PUT', `/api/devices/${deviceId}`, deviceBody, token);
  await call('POST', '/api/tickets/preview', { issue_desc: 'Mat nguon' }, token);
  const ticket = await call('POST', '/api/tickets', { customer_id: customerId, device_id: deviceId, issue_desc: 'Mat nguon' }, token, 201);
  ticketId = ticket.ticket_id;
  await call('GET', `/api/tickets?phone=${body.phone}`, null, token);
  await call('GET', `/api/tickets/${ticketId}`, null, token);
  await call('PATCH', `/api/tickets/${ticketId}/status`, { to_status: 'DA_PHAN_CONG' }, token);
  // No ticket DELETE endpoint: remove only this script's fixture by ID.
  await db.query('DELETE FROM ticket_status_log WHERE ticket_id=$1', [ticketId]);
  await db.query('DELETE FROM ticket WHERE ticket_id=$1', [ticketId]);
  ticketId = null;
  await call('DELETE', `/api/devices/${deviceId}`, null, token, 204);
  deviceId = null;
  await call('DELETE', `/api/customers/${customerId}`, null, token, 204);
  customerId = null;
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/api-examples.json', JSON.stringify({ capturedAt: new Date().toISOString(), database: process.env.DB_NAME, node: process.version, samples }, null, 2) + '\n');
  console.log(`Captured ${samples.length} real API exchanges (JWT/password redacted).`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  if (ticketId) { await db.query('DELETE FROM ticket_status_log WHERE ticket_id=$1', [ticketId]); await db.query('DELETE FROM ticket WHERE ticket_id=$1', [ticketId]); }
  if (deviceId) await db.query('DELETE FROM device WHERE device_id=$1', [deviceId]);
  if (customerId) await db.query('DELETE FROM customer WHERE customer_id=$1', [customerId]);
  if (userId) await db.query('DELETE FROM app_user WHERE user_id=$1', [userId]);
  if (server) await new Promise(resolve => server.close(resolve));
  await db.end();
});
