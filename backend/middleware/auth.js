const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT tokens
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Auth middleware - Token received:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({
        error: {
          message: 'No token provided. Access denied.'
        }
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token verified for user:', decoded.userId);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('Auth middleware - User not found:', decoded.userId);
      return res.status(401).json({
        error: {
          message: 'Token is valid but user no longer exists.'
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('Auth middleware - User account deactivated:', decoded.userId);
      return res.status(401).json({
        error: {
          message: 'User account is deactivated.'
        }
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      walletAddress: decoded.walletAddress,
      role: decoded.role
    };

    console.log('Auth middleware - Authentication successful for user:', user.username);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          message: 'Invalid token.'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          message: 'Token has expired.'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Server error in authentication.'
      }
    });
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required.'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: `Access denied. Required roles: ${roles.join(', ')}`
        }
      });
    }

    next();
  };
};

/**
 * Specific role authorization helpers
 */
const authorizeProducer = authorize('PRODUCER');
const authorizeCertifier = authorize('CERTIFIER');
const authorizeConsumer = authorize('CONSUMER');
const authorizeRegulator = authorize('REGULATOR');

module.exports = {
  auth,
  authorize,
  authorizeProducer,
  authorizeCertifier,
  authorizeConsumer,
  authorizeRegulator
};
