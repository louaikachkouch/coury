const mongoose = require('mongoose');

const ScheduleEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add an event title'],
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  courseName: {
    type: String
  },
  type: {
    type: String,
    enum: ['lecture', 'assignment', 'exam', 'meeting', 'study', 'other'],
    default: 'lecture'
  },
  date: {
    type: Date,
    required: [true, 'Please add an event date']
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String
  },
  location: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'blue'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: [{
    type: Number,
    min: 0,
    max: 6
  }],
  reminder: {
    type: Boolean,
    default: false
  },
  reminderMinutes: {
    type: Number,
    default: 30
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
ScheduleEventSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('ScheduleEvent', ScheduleEventSchema);
