const express = require('express');
const { requireRole } = require('../middleware/auth');

function createDeviceRoutes({ deviceService }) {
  const router = express.Router();

  router.get('/:id', async (req, res) => {
    res.json(await deviceService.getById(req.params.id));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await deviceService.create(req.body));
  });

  router.put('/:id', async (req, res) => {
    res.json(await deviceService.update(req.params.id, req.body));
  });

  router.delete('/:id', requireRole('QUAN_LY'), async (req, res) => {
    await deviceService.remove(req.params.id);
    res.status(204).end();
  });

  return router;
}

module.exports = createDeviceRoutes;