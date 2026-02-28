const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');

// @route   GET /api/courses
// @desc    Get all available courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    
    // Get user's enrollments to mark enrolled courses
    const enrollments = await Enrollment.find({ user: req.user.id });
    const enrolledCourseIds = enrollments.map(e => e.course.toString());
    
    const coursesWithEnrollment = courses.map(course => ({
      ...course.toObject(),
      isEnrolled: enrolledCourseIds.includes(course._id.toString())
    }));
    
    res.json({
      success: true,
      count: courses.length,
      courses: coursesWithEnrollment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/enrolled
// @desc    Get user's enrolled courses with progress
// @access  Private
router.get('/enrolled', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate('course')
      .sort({ lastAccessedAt: -1 });
    
    const courses = enrollments.map(enrollment => ({
      ...enrollment.course.toObject(),
      progress: enrollment.progress,
      status: enrollment.status,
      currentModule: enrollment.currentModule,
      currentLesson: enrollment.currentLesson,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt
    }));
    
    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({ 
      user: req.user.id, 
      course: req.params.id 
    });
    
    res.json({
      success: true,
      course: {
        ...course.toObject(),
        isEnrolled: !!enrollment,
        progress: enrollment?.progress || 0,
        currentModule: enrollment?.currentModule || 0,
        currentLesson: enrollment?.currentLesson || 0
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if already enrolled
    let enrollment = await Enrollment.findOne({ 
      user: req.user.id, 
      course: req.params.id 
    });
    
    if (enrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Create enrollment
    enrollment = await Enrollment.create({
      user: req.user.id,
      course: req.params.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id/progress
// @desc    Update course progress
// @access  Private
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { progress, currentModule, currentLesson, completedLessons } = req.body;
    
    let enrollment = await Enrollment.findOne({ 
      user: req.user.id, 
      course: req.params.id 
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    
    // Update progress
    if (progress !== undefined) enrollment.progress = progress;
    if (currentModule !== undefined) enrollment.currentModule = currentModule;
    if (currentLesson !== undefined) enrollment.currentLesson = currentLesson;
    if (completedLessons) enrollment.completedLessons = completedLessons;
    
    enrollment.lastAccessedAt = Date.now();
    
    if (progress >= 100) {
      enrollment.status = 'completed';
    } else if (progress > 0) {
      enrollment.status = 'in-progress';
    }
    
    await enrollment.save();
    
    res.json({
      success: true,
      enrollment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/unenroll
// @desc    Unenroll from a course
// @access  Private
router.delete('/:id/unenroll', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndDelete({ 
      user: req.user.id, 
      course: req.params.id 
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    
    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
