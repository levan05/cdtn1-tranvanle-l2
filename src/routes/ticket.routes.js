const express = require('express');

function createTicketRoutes({ ticketService }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    res.json(await ticketService.list(req.query, req.user));
  });

  router.get('/:id', async (req, res) => {
    res.json(await ticketService.getById(req.params.id, req.user));
  });

  router.post('/preview', (req, res) => {
    res.json(ticketService.preview(req.body));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await ticketService.create(req.body, req.user));
  });

  router.patch('/:id/status', async (req, res) => {
    res.json(await ticketService.changeStatus(req.params.id, req.body, req.user));
  });

  return router;
}

module.exports = createTicketRoutes;
