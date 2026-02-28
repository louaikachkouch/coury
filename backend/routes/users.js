const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      dateOfBirth,
      website,
      major,
      year,
      bio,
      avatar
    } = req.body;

    // Build profile object
    const profileFields = {};
    if (name) profileFields.name = name;
    if (email) profileFields.email = email;
    if (phone !== undefined) profileFields.phone = phone;
    if (location !== undefined) profileFields.location = location;
    if (dateOfBirth !== undefined) profileFields.dateOfBirth = dateOfBirth;
    if (website !== undefined) profileFields.website = website;
    if (major !== undefined) profileFields.major = major;
    if (year !== undefined) profileFields.year = year;
    if (bio !== undefined) profileFields.bio = bio;
    if (avatar !== undefined) profileFields.avatar = avatar;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    );

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

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        major: user.major,
        year: user.year,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
