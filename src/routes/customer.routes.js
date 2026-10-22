const express = require('express');
const { requireRole } = require('../middleware/auth');

function createCustomerRoutes({ customerService }) {
  const router = express.Router();

  // Co ?phone= thi tra cuu mot khach (FR1), khong co thi tra danh sach co phan trang
  router.get('/', async (req, res) => {
    if (req.query.phone !== undefined) {
      return res.json(await customerService.findByPhone(req.query.phone, req.user));
    }
    return res.json(await customerService.list(req.query, req.user));
  });

  router.get('/:id', async (req, res) => {
    res.json(await customerService.getById(req.params.id, req.user));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await customerService.create(req.body, req.user));
  });

  router.put('/:id', async (req, res) => {
    res.json(await customerService.update(req.params.id, req.body, req.user));
  });

  router.delete('/:id', requireRole('QUAN_LY'), async (req, res) => {
    await customerService.remove(req.params.id);
    res.status(204).end();
  });

  return router;
}

module.exports = createCustomerRoutes;
