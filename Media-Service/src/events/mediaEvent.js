const Media = require('../model/media.model');
const { deleteMediaFromCloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');

const handlePostDeleted = async (event) => {
  logger.info(event, 'event!!!');
  const { postId, mediaIds } = event;
  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);
      logger.info(
        `Deleted media ${media._id} associated with this deleted post ${postId}`
      );
    }
    logger.info(`processed deletion of media for post ${postId}`);
  } catch (error) {
    logger.error(error);
  }
};

module.exports = { handlePostDeleted };
