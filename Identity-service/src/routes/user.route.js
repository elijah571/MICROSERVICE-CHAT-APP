const express = require('express');
const {
  register,
  login,
  regenerateRefreshToken,
  logout,
} = require('../controllers/user.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', regenerateRefreshToken);
router.post('/logout', logout);

module.exports = router;
