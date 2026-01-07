const Post = require('../model/post.model');
const logger = require('../utils/logger');
const { publishEvent } = require('../utils/rabbitmq');
const { validateCreatePost } = require('../utils/validation');

async function invalidatePost(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);
  const keys = await req.redisClient.keys('posts:*');
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.info('Post endpoints');
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;
    const newPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();

    await publishEvent('post.created', {
      postId: newPost._id.toString(),
      userId: newPost.user.toString(),
      content: newPost.content,
      createdAt: newPost.createdAt,
    });

    await invalidatePost(req, newPost._id.toString());
    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      newPost,
    });
  } catch (error) {
    logger.error('Error creating post', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating post',
    });
  }
};

const getallPost = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts: ${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit();

    const totalNoOfPosts = await Post.countDocuments();
    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };
    //cache data

    res.json(result);
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
  } catch (error) {
    logger.error('Error getting posts', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting posts',
    });
  }
};

const getSinglePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const cacheKey = `post:${postId}`;

    const cachedPost = await req.redisClient.get(cacheKey);
    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(post));
    return res.json(post);
  } catch (error) {
    logger.error('Error getting post', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting post',
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }
    //publish post delete method
    await publishEvent('post.deleted', {
      postId: post._id,
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });
    await invalidatePost(req, req.params.id);
    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting post', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting post',
    });
  }
};

module.exports = {
  createPost,
  getallPost,
  getSinglePost,
  deletePost,
};
