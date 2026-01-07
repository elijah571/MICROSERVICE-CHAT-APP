const express = require('express');
const { searchPost } = require('../controllers/search.controller');
const verifyRequest = require('../middleware/authMiddleware');

const router = express.Router();
router.use(verifyRequest);
router.get('/posts', searchPost);

module.exports = router;
