const express = require('express');
const router = express.Router();
const ScheduleEvent = require('../models/ScheduleEvent');
const { protect } = require('../middleware/auth');

// @route   GET /api/schedule
// @desc    Get user's schedule events
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { user: req.user.id };
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const events = await ScheduleEvent.find(query)
      .populate('course', 'title thumbnail')
      .sort({ date: 1, startTime: 1 });
    
    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedule/today
// @desc    Get today's events
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const events = await ScheduleEvent.find({
      user: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    })
      .populate('course', 'title thumbnail')
      .sort({ startTime: 1 });
    
    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedule/upcoming
// @desc    Get upcoming events (next 7 days)
// @access  Private
router.get('/upcoming', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const events = await ScheduleEvent.find({
      user: req.user.id,
      date: { $gte: today, $lte: nextWeek }
    })
      .populate('course', 'title thumbnail')
      .sort({ date: 1, startTime: 1 });
    
    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/schedule
// @desc    Create a new schedule event
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      course,
      courseName,
      type,
      date,
      startTime,
      endTime,
      location,
      description,
      color,
      isRecurring,
      recurringDays,
      reminder,
      reminderMinutes
    } = req.body;
    
    const event = await ScheduleEvent.create({
      user: req.user.id,
      title,
      course,
      courseName,
      type,
      date,
      startTime,
      endTime,
      location,
      description,
      color,
      isRecurring,
      recurringDays,
      reminder,
      reminderMinutes
    });
    
    res.status(201).json({
      success: true,
      event
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/schedule/:id
// @desc    Update a schedule event
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let event = await ScheduleEvent.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Make sure user owns the event
    if (event.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    event = await ScheduleEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      event
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/schedule/:id
// @desc    Delete a schedule event
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await ScheduleEvent.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Make sure user owns the event
    if (event.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await event.deleteOne();
    
    res.json({
      success: true,
      message: 'Event removed'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
