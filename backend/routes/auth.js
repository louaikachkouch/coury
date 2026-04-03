const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isDisposableEmail } = require('../utils/disposableDomains');
const { sendVerificationEmail } = require('../utils/email');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      if (isDisposableEmail(email)) {
        return res.status(400).json({ message: 'Disposable email addresses are not allowed' });
      }

      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user
      user = await User.create({
        name,
        email,
        password
      });

      const verificationToken = user.getEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${frontendBaseUrl}/verify-email/${verificationToken}`;

      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        verificationUrl
      });
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email before signing in.'
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check for user
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.isEmailVerified === false) {
        return res.status(403).json({
          message: 'Please verify your email before signing in.',
          requiresEmailVerification: true
        });
      }

      // Create token
      const token = user.getSignedJwtToken();

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
          location: user.location,
          dateOfBirth: user.dateOfBirth,
          website: user.website,
          major: user.major,
          year: user.year,
          bio: user.bio
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify user email
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: verificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpire');

    if (!user) {
      return res.status(400).json({ message: 'Verification link is invalid or has expired' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, message: 'Email verified successfully. You can now sign in.' });
  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification link
// @access  Public
router.post(
  '/resend-verification',
  [body('email', 'Please include a valid email').isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpire');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      const verificationToken = user.getEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${frontendBaseUrl}/verify-email/${verificationToken}`;

      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        verificationUrl
      });

      return res.json({ success: true, message: 'Verification email sent' });
    } catch (err) {
      console.error('Resend verification error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        dateOfBirth: user.dateOfBirth,
        website: user.website,
        major: user.major,
        year: user.year,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
