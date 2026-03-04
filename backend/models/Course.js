const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'reading', 'quiz', 'assignment'],
    default: 'video'
  },
  completed: {
    type: Boolean,
    default: false
  },
  fileName: {
    type: String,
    default: null
  },
  filePath: {
    type: String,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  mimeType: {
    type: String,
    default: null
  },
  dueDate: {
    type: String,
    default: null
  }
});

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  lessons: [LessonSchema]
});

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  instructor: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  category: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    required: true
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  modules: [ModuleSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', CourseSchema);
