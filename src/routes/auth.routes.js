const express = require('express');

function createAuthRoutes({ authService }) {
  const router = express.Router();

  router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    res.json(await authService.login(username, password));
  });

  return router;
}

module.exports = createAuthRoutes;
