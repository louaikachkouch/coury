const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/courses
// @desc    Create a new course (visible only to creator)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, instructor, category, duration, level, code, schedule, credits, modules } = req.body;
    
    // Calculate total lessons from modules
    let totalLessons = 0;
    if (modules && Array.isArray(modules)) {
      modules.forEach(m => {
        if (m.lessons && Array.isArray(m.lessons)) {
          totalLessons += m.lessons.length;
        }
      });
    }
    
    const course = await Course.create({
      title,
      description: description || 'No description available.',
      instructor: instructor || 'TBA',
      category: category || code?.split(' ')[0] || 'General',
      duration: duration || '1h',
      level: level || 'Beginner',
      createdBy: req.user.id,
      modules: modules || [],
      totalLessons
    });

    res.status(201).json({
      success: true,
      course: {
        ...course.toObject(),
        code: code || course.category?.substring(0, 3).toUpperCase() + ' 101',
        schedule: schedule || 'Schedule TBA',
        credits: credits || 3,
        isEnrolled: false,
        progress: 0
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses
// @desc    Get all available courses (public + user's own)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Get courses that are either public (no createdBy) or created by the current user
    const courses = await Course.find({
      $or: [
        { createdBy: null },
        { createdBy: req.user.id }
      ]
    }).sort({ createdAt: -1 });
    
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
    
    // Check if user has permission to view this course
    // Course must be public (no createdBy) or created by the current user
    if (course.createdBy && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this course' });
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

// @route   POST /api/courses/:id/content
// @desc    Add a module/content to a course (with file upload)
// @access  Private (course creator only)
router.post('/:id/content', protect, upload.single('file'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Only course creator can add content
    if (course.createdBy && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this course' });
    }
    
    const { title, type, due, lessons } = req.body;
    
    // Build lesson data with file info if uploaded
    const lessonData = {
      title,
      type: type || 'reading',
      duration: due || '30 min',
      completed: false,
      dueDate: type === 'assignment' ? due : null
    };
    
    // Add file info if file was uploaded
    if (req.file) {
      lessonData.fileName = req.file.originalname;
      lessonData.filePath = req.file.path;
      lessonData.fileUrl = `/uploads/${req.params.id}/${req.file.filename}`;
      lessonData.fileSize = req.file.size;
      lessonData.mimeType = req.file.mimetype;
    }
    
    // If adding a module with lessons
    if (lessons && Array.isArray(lessons)) {
      course.modules.push({
        title,
        lessons
      });
      course.totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    } else {
      // Adding a single lesson to the first module (or create one)
      if (course.modules.length === 0) {
        course.modules.push({ title: 'Course Content', lessons: [] });
      }
      course.modules[0].lessons.push(lessonData);
      course.totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    }
    
    await course.save();
    
    res.json({
      success: true,
      course,
      uploadedFile: req.file ? {
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.params.id}/${req.file.filename}`,
        fileSize: req.file.size
      } : null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (course creator only)
router.put('/:id', protect, async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Only course creator can update
    if (course.createdBy && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this course' });
    }
    
    const { title, description, instructor, modules } = req.body;
    
    if (title) course.title = title;
    if (description) course.description = description;
    if (instructor) course.instructor = instructor;
    if (modules) {
      course.modules = modules;
      course.totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    }
    
    await course.save();
    
    res.json({
      success: true,
      course
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
