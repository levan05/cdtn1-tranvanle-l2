// Chay lan luot cac file .sql trong mot thu muc theo thu tu ten. Cac file deu viet de chay lai nhieu lan khong loi.
// Cach dung: node scripts/run-sql.js migrations | seeds
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');
const db = require('../src/db');

async function main() {
  const dirName = process.argv[2];
  if (!dirName) throw new Error('Thieu ten thu muc, dung: node scripts/run-sql.js migrations|seeds');

  const dir = path.join(__dirname, '..', dirName);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  if (files.length === 0) throw new Error(`Khong co file .sql nao trong ${dirName}`);

  for (const file of files) {
    await db.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    console.log(`Da chay ${dirName}/${file}`);
  }
}

main()
  .then(() => db.end())
  .catch(async (err) => {
    console.error(`Loi: ${err.message || err.code || 'khong ket noi duoc CSDL, kiem tra PostgreSQL va file .env'}`);
    await db.end();
    process.exit(1);
  });
