function createCategoryService({ categoryRepo }) {
  return {
    async list() {
      return { data: await categoryRepo.listAll() };
    },
  };
}

module.exports = createCategoryService;