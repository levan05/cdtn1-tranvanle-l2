// Chi truy cap CSDL, khong chua quy tac nghiep vu. Nhan db (pool) qua tham so de test bang doi tuong gia.
const COLUMNS = 'customer_id, full_name, phone, address, created_at';

function createCustomerRepository(db) {
  return {
    async findByPhone(phone) {
      const r = await db.query(`SELECT ${COLUMNS} FROM customer WHERE phone = $1`, [phone]);
      return r.rows[0] || null;
    },

    async findById(id) {
      const r = await db.query(`SELECT ${COLUMNS} FROM customer WHERE customer_id = $1`, [id]);
      return r.rows[0] || null;
    },

    async list({ limit, offset }) {
      const r = await db.query(
        `SELECT ${COLUMNS} FROM customer ORDER BY customer_id LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return r.rows;
    },

    async insert({ full_name, phone, address }) {
      const r = await db.query(
        `INSERT INTO customer (full_name, phone, address) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
        [full_name, phone, address]
      );
      return r.rows[0];
    },

    async update(id, { full_name, phone, address }) {
      const r = await db.query(
        `UPDATE customer SET full_name = $2, phone = $3, address = $4
         WHERE customer_id = $1 RETURNING ${COLUMNS}`,
        [id, full_name, phone, address]
      );
      return r.rows[0] || null;
    },

    async remove(id) {
      const r = await db.query('DELETE FROM customer WHERE customer_id = $1', [id]);
      return r.rowCount > 0;
    },

    async countDevicesAndTickets(id) {
      const r = await db.query(
        `SELECT (SELECT count(*)::int FROM device WHERE customer_id = $1) AS devices,
                (SELECT count(*)::int FROM ticket WHERE customer_id = $1) AS tickets`,
        [id]
      );
      return r.rows[0];
    },
  };
}

module.exports = createCustomerRepository;
