// Chi truy cap CSDL. Mat khau duoc doi chieu ngay trong SQL bang crypt() cua pgcrypto,
// nen ma bam khong bao gio roi khoi co so du lieu.
function createUserRepository(db) {
  return {
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
