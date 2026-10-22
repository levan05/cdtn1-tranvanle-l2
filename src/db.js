const { Pool } = require('pg');

// Cau hinh doc tu bien moi truong, khong ghi cung trong ma nguon
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
