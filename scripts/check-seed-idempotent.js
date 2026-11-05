require('dotenv').config({ quiet: true });

const { spawnSync } = require('node:child_process');
const db = require('../src/db');

const TABLES = ['service_center', 'issue_category', 'app_user', 'customer', 'device', 'ticket', 'ticket_status_log'];

async function counts() {
  const result = {};
  for (const table of TABLES) {
    const query = await db.query(`SELECT count(*)::int AS count FROM "${table}"`);
    result[table] = query.rows[0].count;
  }
  return result;
}

function runSql(directory) {
  const result = spawnSync(process.execPath, ['scripts/run-sql.js', directory], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${directory} exited with status ${result.status}`);
  }
}

async function main() {
  try {
    const before = await counts();
    console.log('Row counts before rerun:', JSON.stringify(before));
    runSql('migrations');
    runSql('seeds');
    runSql('migrations');
    runSql('seeds');
    const after = await counts();
    console.log('Row counts after rerun:', JSON.stringify(after));
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error('Row counts changed after rerunning migrations and seeds');
    }
    console.log('PASS: migrations and seeds are repeatable; row counts did not change');
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error('Idempotency check failed:', err.message);
  process.exitCode = 1;
});
