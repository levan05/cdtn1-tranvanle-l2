// Read historical code without changing the worktree or installed dependencies.
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const os = require('node:os');
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

// Self-contained discovery probe: the reference directory is intentionally not
// part of the submitted project. Do not require the user's untracked sample.
const probeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bt3-scope-'));
fs.mkdirSync(path.join(probeRoot, 'tests'));
fs.mkdirSync(path.join(probeRoot, 'docs/reference/tests'), { recursive: true });
fs.writeFileSync(path.join(probeRoot, 'tests/project.test.js'), "require('node:test')('PROJECT_SENTINEL', () => {});\n");
fs.writeFileSync(path.join(probeRoot, 'docs/reference/tests/foreign.test.js'), "require('node:test')('REFERENCE_SENTINEL', () => { throw new Error('FOREIGN_REFERENCE_TEST_DISCOVERED'); });\n");
const oldScope = spawnSync(process.execPath, ['--test'], { cwd: probeRoot, encoding: 'utf8', timeout: 30000 });
const newScope = spawnSync(process.execPath, ['--test', 'tests/*.test.js'], { cwd: probeRoot, encoding: 'utf8', timeout: 30000 });
assert.ifError(oldScope.error);
assert.ifError(newScope.error);
fs.mkdirSync('docs/bug-evidence', { recursive: true });
fs.writeFileSync('docs/bug-evidence/test-scope-before.txt', oldScope.stdout + oldScope.stderr);
fs.writeFileSync('docs/bug-evidence/test-scope-after.txt', newScope.stdout + newScope.stderr);
assert.match(oldScope.stdout + oldScope.stderr, /FOREIGN_REFERENCE_TEST_DISCOVERED/);
assert.notEqual(oldScope.status, 0);
assert.equal(newScope.status, 0);
assert.doesNotMatch(newScope.stdout + newScope.stderr, /REFERENCE_SENTINEL/);
const currentScope = spawnSync(process.execPath, ['--test', 'tests/*.test.js'], { encoding: 'utf8', timeout: 30000 });
assert.ifError(currentScope.error);
assert.equal(currentScope.status, 0);
const resolvedProbe = path.resolve(probeRoot);
assert.ok(resolvedProbe.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolvedProbe).startsWith('bt3-scope-'));
fs.rmSync(resolvedProbe, { recursive: true });
log('BUG-02 controlled discovery fixture: before=foreign sentinel discovered and FAIL (2 tests); after=project sentinel only PASS (1 test). Actual project suite also PASS. No untracked reference files required.');

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
