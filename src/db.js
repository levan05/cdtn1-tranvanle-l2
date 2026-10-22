const { Pool, types } = require('pg');

// BIGINT (oid 20) mac dinh tra ve chuoi; doi sang so de khop API contract. Id cua he thong nay nho hon 2^53.
types.setTypeParser(20, (value) => Number(value));

// Cau hinh doc tu bien moi truong, khong ghi cung trong ma nguon
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
