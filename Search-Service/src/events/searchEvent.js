const Search = require('../model/search.model');
const logger = require('../utils/logger');

const handlePostCreation = async (event) => {
  logger.info(event, 'event!!!');

  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });
    await newSearchPost.save();
    logger.info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`
    );
  } catch (error) {
    logger.info(`Error handling post creation event`);
    logger.error(error);
  }
};

const handlePostDeletion = async (event) => {
  logger.info(event, 'event!!!');
  try {
    await Search.findOneAndDelete({ postId: event.postId });

    logger.info(`Search post deleted: ${event.postId} `);
  } catch (error) {
    logger.error(error);
  }
};

module.exports = { handlePostCreation, handlePostDeletion };
