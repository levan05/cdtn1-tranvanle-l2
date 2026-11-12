// Read historical code without changing the worktree or installed dependencies.
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const lines = [];
function log(s) { lines.push(s); console.log(s); }
function historicalErrorHandler(ref) {
  const code = execFileSync('git', ['show', `${ref}:src/routes/http-errors.js`], { encoding: 'utf8' });
  const sandbox = { module: { exports: {} }, require(name) {
    assert.equal(name, '../logger');
    return { error() {} };
  } };
  vm.runInNewContext(code, sandbox, { filename: `${ref}/http-errors.js` });
  return sandbox.module.exports.errorHandler;
}
function response(handler) {
  const result = {};
  const res = { status(value) { result.status = value; return this; }, json(value) { result.body = value; return this; } };
  handler(Object.assign(new Error('simulated connection refusal'), { code: 'ECONNREFUSED' }), { path: '/api/tickets' }, res, () => {});
  return result;
}
const before = response(historicalErrorHandler('50c4b7d^'));
const after = response(historicalErrorHandler('50c4b7d'));
assert.equal(before.status, 500);
assert.equal(after.status, 503);
assert.equal(after.body.error.code, 'DATABASE_UNAVAILABLE');
log(`BUG-01 expected 503: before=${before.status} (FAIL), after=${after.status}/${after.body.error.code} (PASS); simulated DB error, historical handlers executed.`);

const oldScope = spawnSync(process.execPath, ['--test'], { encoding: 'utf8', timeout: 30000 });
const newScope = spawnSync(process.execPath, ['--test', 'tests/*.test.js'], { encoding: 'utf8', timeout: 30000 });
assert.ifError(oldScope.error);
assert.ifError(newScope.error);
fs.mkdirSync('docs/bug-evidence', { recursive: true });
fs.writeFileSync('docs/bug-evidence/test-scope-before.txt', oldScope.stdout + oldScope.stderr);
fs.writeFileSync('docs/bug-evidence/test-scope-after.txt', newScope.stdout + newScope.stderr);
assert.match(oldScope.stdout + oldScope.stderr, /mekong-se-baohanh/);
assert.notEqual(oldScope.status, 0);
assert.equal(newScope.status, 0);
assert.doesNotMatch(newScope.stdout + newScope.stderr, /mekong-se-baohanh/);
log('BUG-02 expected project-only tests: before=node --test discovers reference project and fails; after=15 project tests PASS. Raw outputs saved.');

const probe = "const pg=require('pg'); MODE; const id=pg.types.getTypeParser(20)('42'); console.log(JSON.stringify({type:typeof id,equalsNumericId:id===42})); if(MODE_CLOSE) require('./src/db').end();";
function idProbe(fixed) {
  const source = probe.replace('MODE;', fixed ? "require('./src/db');" : '').replace('MODE_CLOSE', String(fixed));
  return JSON.parse(execFileSync(process.execPath, ['-e', source], { encoding: 'utf8' }));
}
const oldId = idProbe(false), newId = idProbe(true);
assert.equal(oldId.type, 'string'); assert.equal(oldId.equalsNumericId, false);
assert.equal(newId.type, 'number'); assert.equal(newId.equalsNumericId, true);
const historicalDb = execFileSync('git', ['show', 'af99f3b^:src/db.js'], { encoding: 'utf8' });
assert.doesNotMatch(historicalDb, /setTypeParser/);
log('BUG-05 numeric API ID contract: before=pg default BIGINT string/strict comparison FAIL; after=project type parser number/strict comparison PASS. Child processes isolate pg parser state.');
log('SUMMARY 3 regression checks PASS; no checkout, DB writes or dependency downgrade.');
fs.writeFileSync(path.join('docs', 'bug-evidence', 'regressions.txt'), lines.join('\n') + '\n');
