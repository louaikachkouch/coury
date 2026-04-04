const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isDisposableEmail } = require('../utils/disposableDomains');
const { sendVerificationCodeEmail } = require('../utils/email');

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

      const verificationCode = user.getEmailVerificationCode();
      await user.save({ validateBeforeSave: false });

      try {
        await sendVerificationCodeEmail({
          email: user.email,
          name: user.name,
          verificationCode
        });
      } catch (emailErr) {
        // Roll back the user if verification email cannot be sent.
        await User.deleteOne({ _id: user._id });
        console.error('Verification email send failed:', emailErr.message);

        const message = emailErr.message && (emailErr.message.includes('EASYEMAIL') || emailErr.message.includes('not configured'))
          ? 'Email service is not configured on the server. Please contact support or try again later.'
          : 'Could not send verification code. Account was not created. Please try again.';

        return res.status(500).json({
          message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful. Enter the 6-digit code sent to your email.',
        requiresEmailCodeVerification: true,
        email
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

// @route   POST /api/auth/verify-email-code
// @desc    Verify user email with 6-digit code
// @access  Public
router.post(
  '/verify-email-code',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('code', 'Please provide a valid 6-digit code').isLength({ min: 6, max: 6 }).isNumeric()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

  try {
    const { email, code } = req.body;
    const verificationCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    const user = await User.findOne({
      email,
      emailVerificationCode: verificationCode,
      emailVerificationExpire: { $gt: Date.now() }
    }).select('+emailVerificationCode +emailVerificationExpire');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    const token = user.getSignedJwtToken();

    return res.json({
      success: true,
      message: 'Email verified successfully.',
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
    console.error('Email verification error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
  }
);

// @route   POST /api/auth/resend-verification-code
// @desc    Resend email verification code
// @access  Public
router.post(
  '/resend-verification-code',
  [body('email', 'Please include a valid email').isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const user = await User.findOne({ email }).select('+emailVerificationCode +emailVerificationExpire');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      const verificationCode = user.getEmailVerificationCode();
      await user.save({ validateBeforeSave: false });

      await sendVerificationCodeEmail({
        email: user.email,
        name: user.name,
        verificationCode
      });

      return res.json({ success: true, message: 'Verification code sent' });
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
