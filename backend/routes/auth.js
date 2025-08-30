const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  role: Joi.string().valid('PRODUCER', 'CERTIFIER', 'CONSUMER', 'REGULATOR').required(),
  organization: Joi.string().required(),
  profile: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phone: Joi.string(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      zipCode: Joi.string()
    }),
    website: Joi.string().uri(),
    description: Joi.string()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    console.log('Registration request received:', {
      username: req.body.username,
      email: req.body.email,
      role: req.body.role
    });

    const {
      username,
      email,
      password,
      walletAddress,
      role,
      organization,
      profile
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { walletAddress: walletAddress.toLowerCase() }]
    });

    if (existingUser) {
      console.log('User already exists:', { email, username });
      return res.status(400).json({
        error: {
          message: 'User already exists with this email, username, or wallet address'
        }
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      walletAddress: walletAddress.toLowerCase(),
      role,
      organization,
      profile
    });

    await user.save();
    console.log('User created successfully:', { userId: user._id, username: user.username });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        walletAddress: user.walletAddress,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('JWT token generated for user:', user.username);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        message: 'Registration failed',
        details: error.message
      }
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found for login:', { email });
      return res.status(401).json({
        error: {
          message: 'Invalid credentials'
        }
      });
    }

    console.log('User found for login:', { userId: user._id, username: user.username, role: user.role });

    // Check if user is active
    if (!user.isActive) {
      console.log('User account is deactivated:', { userId: user._id });
      return res.status(401).json({
        error: {
          message: 'Account is deactivated'
        }
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', { userId: user._id });
      return res.status(401).json({
        error: {
          message: 'Invalid credentials'
        }
      });
    }

    console.log('Password verified successfully for user:', user.username);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        walletAddress: user.walletAddress,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('JWT token generated for login:', user.username);

    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        message: 'Login failed',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    res.json({
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get profile'
      }
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { profile, settings } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    // Update profile fields
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    // Update settings
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to update profile'
      }
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: {
          message: 'Current password and new password are required'
        }
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: {
          message: 'New password must be at least 6 characters long'
        }
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Current password is incorrect'
        }
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to change password'
      }
    });
  }
});

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/users', auth, async (req, res) => {
  try {
    // Check if user is admin/regulator
    if (req.user.role !== 'REGULATOR') {
      return res.status(403).json({
        error: {
          message: 'Access denied. Admin privileges required.'
        }
      });
    }

    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      users: users.map(user => user.getPublicProfile())
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get users'
      }
    });
  }
});

/**
 * @route   GET /api/auth/users/:role
 * @desc    Get users by role
 * @access  Private
 */
router.get('/users/:role', auth, async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['PRODUCER', 'CERTIFIER', 'CONSUMER', 'REGULATOR'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: {
          message: 'Invalid role'
        }
      });
    }

    const users = await User.findByRole(role)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      users: users.map(user => user.getPublicProfile())
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get users'
      }
    });
  }
});

module.exports = router;
