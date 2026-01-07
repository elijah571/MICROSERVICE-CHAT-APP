const express = require('express');
const {
  createPost,
  getallPost,
  getSinglePost,
  deletePost,
} = require('../controllers/post.controller');
const verifyRequest = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyRequest);
router.post('/create', createPost);
router.get('/all', getallPost);
router.get('/:postId', getSinglePost);
router.delete('/:id', deletePost);

module.exports = router;
