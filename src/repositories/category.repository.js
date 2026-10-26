// Chi truy cap CSDL: danh sach nhom su co de giao dien do vao o loc
function createCategoryRepository(db) {
  return {
    async listAll() {
      const r = await db.query('SELECT category_id, category_name FROM issue_category ORDER BY category_id');
      return r.rows;
    },
  };
}

module.exports = createCategoryRepository;