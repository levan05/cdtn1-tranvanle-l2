// Chi truy cap CSDL, khong chua quy tac nghiep vu. Nhan db (pool hoac client) qua tham so de test bang doi tuong gia.
const SELECT_TICKET = `
  SELECT t.ticket_id, t.ticket_code, t.status, t.priority, t.issue_desc,
         t.received_at, t.due_date, t.center_id, sc.center_name,
         t.category_id, ic.category_name,
         t.customer_id, c.full_name AS customer_name, c.phone AS customer_phone,
         t.device_id, d.serial_no, d.product_name
  FROM ticket t
  JOIN customer c ON c.customer_id = t.customer_id
  JOIN device d ON d.device_id = t.device_id
  JOIN service_center sc ON sc.center_id = t.center_id
  LEFT JOIN issue_category ic ON ic.category_id = t.category_id`;

function createTicketRepository(db) {
  return {
    // Chay `work` trong mot transaction: loi thi ROLLBACK, xong thi COMMIT
    async runInTransaction(work) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const result = await work(createTicketRepository(client));
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    // Lay truoc ticket_id de sinh ticket_code tu chinh id do
    async nextTicketId() {
      const r = await db.query("SELECT nextval(pg_get_serial_sequence('ticket', 'ticket_id')) AS id");
      return Number(r.rows[0].id);
    },

    async insert(t) {
      await db.query(
        `INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, center_id, category_id,
                             issue_desc, priority, status, received_at, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [t.ticket_id, t.ticket_code, t.customer_id, t.device_id, t.center_id, t.category_id,
         t.issue_desc, t.priority, t.status, t.received_at, t.due_date]
      );
    },

    async insertLog({ ticket_id, from_status, to_status, changed_by }) {
      await db.query(
        `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by)
         VALUES ($1, $2, $3, $4)`,
        [ticket_id, from_status, to_status, changed_by]
      );
    },

    async findById(id) {
      const r = await db.query(`${SELECT_TICKET} WHERE t.ticket_id = $1`, [id]);
      return r.rows[0] || null;
    },

    // Khoa dong phieu de hai nguoi cung doi trang thai khong ghi de nhau
    async findForUpdate(id) {
      const r = await db.query(
        'SELECT ticket_id, status, center_id FROM ticket WHERE ticket_id = $1 FOR UPDATE',
        [id]
      );
      return r.rows[0] || null;
    },

    async updateStatus(id, status) {
      await db.query('UPDATE ticket SET status = $2 WHERE ticket_id = $1', [id, status]);
    },

    async listLogs(ticketId) {
      const r = await db.query(
        `SELECT log_id, from_status, to_status, changed_at, changed_by
         FROM ticket_status_log WHERE ticket_id = $1 ORDER BY changed_at, log_id`,
        [ticketId]
      );
      return r.rows;
    },

    // Luon loc theo trung tam (QT-06); phieu sap den han dung truoc
    async list({ centerId, status, priority, limit, offset }) {
      const where = ['t.center_id = $1'];
      const params = [centerId];
      if (status) {
        params.push(status);
        where.push(`t.status = $${params.length}`);
      }
      if (priority) {
        params.push(priority);
        where.push(`t.priority = $${params.length}`);
      }
      const clause = where.join(' AND ');

      const total = await db.query(`SELECT count(*)::int AS n FROM ticket t WHERE ${clause}`, params);
      params.push(limit, offset);
      const rows = await db.query(
        `${SELECT_TICKET} WHERE ${clause}
         ORDER BY t.due_date ASC, t.ticket_id ASC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      return { total: total.rows[0].n, rows: rows.rows };
    },
  };
}

module.exports = createTicketRepository;
