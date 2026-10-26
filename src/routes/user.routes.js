const express = require('express');

function createUserRoutes({ userService }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    res.json(await userService.list(req.user));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await userService.create(req.body, req.user));
  });

  return router;
}

module.exports = createUserRoutes;
