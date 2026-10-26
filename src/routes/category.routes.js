const express = require('express');

function createCategoryRoutes({ categoryService }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    res.json(await categoryService.list());
  });

  return router;
}

module.exports = createCategoryRoutes;