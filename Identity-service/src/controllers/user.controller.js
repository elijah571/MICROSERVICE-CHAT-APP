const RefreshToken = require('../model/refreshtoken.model');
const User = require('../model/user.model');
const generateTokens = require('../utils/generateToken');
const logger = require('../utils/logger');
const { validateRegistration, validateLogin } = require('../utils/validation');

const register = async (req, res) => {
  try {
    logger.info('Registration endpoint hit');

    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password, userName } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const user = await User.create({
      userName,
      email,
      password,
    });

    const { accessToken, refreshToken } = await generateTokens(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Registration error', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const login = async (req, res) => {
  logger.info('login endpoint.');
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid  credentials ',
      });
    }
    //check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid  credentials ',
      });
    }
    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error('Login error', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

//refresh token

const regenerateRefreshToken = async (req, res) => {
  logger.info('refresh token  endpoint');
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'refresh Token missing',
      });
    }
    const storeToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storeToken || storeToken.expiresAt < new Date()) {
      logger.warn('Invalid or expired refresh token');
    }

    const user = await User.findById(storeToken.user);
    if (!user) {
      logger.warn('user not found');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshtoken } =
      await generateTokens(user);

    //delete old token
    await RefreshToken.deleteOne({ _id: storeToken._id });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshtoken,
    });
  } catch (error) {
    logger.error('refresh token error', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

//logout
const logout = async (req, res) => {
  logger.info('logout   endpoint');
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'refresh Token missing',
      });
    }
    await RefreshToken.deleteOne({ token: refreshToken });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout  error', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = { register, login, regenerateRefreshToken, logout };
