import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token',
      statusCode: 401,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Uses ACCESS secret now (short-lived, 15m)
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        statusCode: 401,
      });
    }

    next();
  } catch (error) {
    // Specifically detect expiry vs other errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED', // ← Frontend checks this code to trigger refresh
        statusCode: 401,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Not authorized, token failed',
      statusCode: 401,
    });
  }
};

export default protect;