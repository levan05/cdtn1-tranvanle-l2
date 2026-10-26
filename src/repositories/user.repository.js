// Chi truy cap CSDL. Mat khau duoc doi chieu ngay trong SQL bang crypt() cua pgcrypto,
// nen ma bam khong bao gio roi khoi co so du lieu.
function createUserRepository(db) {
  return {
    async findByUsername(username) {
      const r = await db.query('SELECT user_id FROM app_user WHERE username = $1', [username]);
      return r.rows[0] || null;
    },

    // Mat khau duoc bam bang crypt() ngay trong SQL, giong cach doi chieu luc dang nhap
    async insert({ username, password, full_name, role, center_id }) {
      const r = await db.query(
        `INSERT INTO app_user (username, password_hash, full_name, role, center_id)
         VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5)
         RETURNING user_id, username, full_name, role, center_id`,
        [username, password, full_name, role, center_id]
      );
      return r.rows[0];
    },

    async listByCenter(centerId) {
      const r = await db.query(
        `SELECT user_id, username, full_name, role, center_id
         FROM app_user WHERE center_id = $1 ORDER BY user_id`,
        [centerId]
      );
      return r.rows;
    },
    async findByCredentials(username, password) {
      const r = await db.query(
        `SELECT user_id, username, full_name, role, center_id
         FROM app_user
         WHERE username = $1 AND password_hash = crypt($2, password_hash)`,
        [username, password]
      );
      return r.rows[0] || null;
    },
  };
}

module.exports = createUserRepository;
