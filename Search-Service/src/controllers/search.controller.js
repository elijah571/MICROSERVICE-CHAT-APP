const Search = require('../model/search.model');
const logger = require('../utils/logger');

const searchPost = async (req, res) => {
  logger.info('Search endpoint hit!');

  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required',
      });
    }

    const results = await Search.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .lean();

    res.json({ success: true, results });
  } catch (error) {
    logger.warn('Error in search', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error while searching post',
    });
  }
};

module.exports = { searchPost };
