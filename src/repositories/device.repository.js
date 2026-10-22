// Chi truy cap CSDL, khong chua quy tac nghiep vu. Nhan db (pool) qua tham so de test bang doi tuong gia.
const COLUMNS = 'device_id, customer_id, serial_no, imei, product_name';

function createDeviceRepository(db) {
  return {
    async findById(id) {
      const r = await db.query(`SELECT ${COLUMNS} FROM device WHERE device_id = $1`, [id]);
      return r.rows[0] || null;
    },

    async findBySerial(serialNo) {
      const r = await db.query(`SELECT ${COLUMNS} FROM device WHERE serial_no = $1`, [serialNo]);
      return r.rows[0] || null;
    },

    async listByCustomer(customerId) {
      const r = await db.query(
        `SELECT ${COLUMNS} FROM device WHERE customer_id = $1 ORDER BY device_id`,
        [customerId]
      );
      return r.rows;
    },

    async insert({ customer_id, serial_no, imei, product_name }) {
      const r = await db.query(
        `INSERT INTO device (customer_id, serial_no, imei, product_name)
         VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
        [customer_id, serial_no, imei, product_name]
      );
      return r.rows[0];
    },

    async update(id, { customer_id, serial_no, imei, product_name }) {
      const r = await db.query(
        `UPDATE device SET customer_id = $2, serial_no = $3, imei = $4, product_name = $5
         WHERE device_id = $1 RETURNING ${COLUMNS}`,
        [id, customer_id, serial_no, imei, product_name]
      );
      return r.rows[0] || null;
    },

    async remove(id) {
      const r = await db.query('DELETE FROM device WHERE device_id = $1', [id]);
      return r.rowCount > 0;
    },

    async countTickets(id) {
      const r = await db.query('SELECT count(*)::int AS tickets FROM ticket WHERE device_id = $1', [id]);
      return r.rows[0].tickets;
    },
  };
}

module.exports = createDeviceRepository;