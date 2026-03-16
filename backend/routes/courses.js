const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getGridFSBucket } = require('../config/db');

const isUserAllowedForCourse = async (course, userId) => {
  if (course.createdBy && course.createdBy.toString() === userId) {
    return true;
  }

  const enrollment = await Enrollment.findOne({ user: userId, course: course._id });
  return Boolean(enrollment);
};

const uploadBufferToGridFS = (file, metadata = {}) => {
  const bucket = getGridFSBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve({
        _id: uploadStream.id,
        filename: uploadStream.filename,
        contentType: file.mimetype
      });
    });
    uploadStream.end(file.buffer);
  });
};

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

    // Automatically enroll the creator in the course
    await Enrollment.create({
      user: req.user.id,
      course: course._id
    });

    res.status(201).json({
      success: true,
      course: {
        ...course.toObject(),
        code: code || course.category?.substring(0, 3).toUpperCase() + ' 101',
        schedule: schedule || 'Schedule TBA',
        credits: credits || 3,
        isEnrolled: true,
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
    
    const canAccess = await isUserAllowedForCourse(course, req.user.id);
    if (!canAccess) {
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
        currentLesson: enrollment?.currentLesson || 0,
        completedLessons: enrollment?.completedLessons || []
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
// @desc    Update course progress with auto-calculation and persistent timestamps
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
    
    // Update completed lessons with timestamps
    if (completedLessons) {
      enrollment.completedLessons = completedLessons.map((lesson) => {
        const existing = enrollment.completedLessons.find(
          cl => cl.lessonId?.toString() === lesson.lessonId?.toString()
        );
        return {
          lessonId: lesson.lessonId,
          completed: lesson.completed,
          completedAt: existing?.completedAt || (lesson.completed ? new Date() : null)
        };
      });
    }
    
    // Fetch course to calculate total lessons for accurate progress percentage
    const course = await Course.findById(req.params.id);
    if (course && course.modules && course.modules.length > 0) {
      const totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
      const completedCount = (enrollment.completedLessons || []).filter(cl => cl.completed).length;
      const calculatedProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      enrollment.progress = calculatedProgress;
    }
    
    // Update timestamp
    enrollment.lastAccessedAt = Date.now();
    
    // Update status based on progress
    if (enrollment.progress >= 100) {
      enrollment.status = 'completed';
    } else if (enrollment.progress > 0) {
      enrollment.status = 'in-progress';
    } else {
      enrollment.status = 'enrolled';
    }
    
    await enrollment.save();
    
    res.json({
      success: true,
      enrollment,
      course: course ? {
        _id: course._id,
        title: course.title,
        progress: enrollment.progress,
        status: enrollment.status,
        totalLessons: course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0),
        completedLessons: enrollment.completedLessons.length,
        lastAccessedAt: enrollment.lastAccessedAt
      } : null
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
    
    // Add file info if file was uploaded (stored in GridFS)
    if (req.file) {
      const uploaded = await uploadBufferToGridFS(req.file, {
        uploadedBy: req.user.id,
        courseId: req.params.id
      });

      lessonData.fileName = req.file.originalname;
      lessonData.fileId = uploaded._id;
      lessonData.filePath = `gridfs://${uploaded._id}`;
      lessonData.fileUrl = `/api/courses/files/${uploaded._id}`;
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
    
    // Mark modules as modified so Mongoose saves nested array changes
    course.markModified('modules');
    const savedCourse = await course.save();
    
    res.json({
      success: true,
      course: savedCourse,
      uploadedFile: req.file ? {
        fileName: req.file.originalname,
        fileUrl: savedCourse.modules[0]?.lessons?.slice(-1)[0]?.fileUrl || null,
        fileSize: req.file.size
      } : null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/content/:lessonId
// @desc    Delete a lesson from a course
// @access  Private (course creator only)
router.delete('/:id/content/:lessonId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Only course creator can delete content
    if (course.createdBy && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this course' });
    }
    
    // Find and remove the lesson from modules
    let lessonFound = false;
    let fileIdToDelete = null;
    course.modules.forEach((mod) => {
      const lessonIndex = mod.lessons.findIndex(
        (lesson) => lesson._id.toString() === req.params.lessonId
      );
      if (lessonIndex !== -1) {
        fileIdToDelete = mod.lessons[lessonIndex].fileId || null;
        mod.lessons.splice(lessonIndex, 1);
        lessonFound = true;
      }
    });
    
    if (!lessonFound) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Update total lessons count
    course.totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

    if (fileIdToDelete) {
      const bucket = getGridFSBucket();
      try {
        await bucket.delete(new mongoose.Types.ObjectId(fileIdToDelete));
      } catch (error) {
        // Ignore missing files so lesson deletion can still complete.
      }
    }
    
    course.markModified('modules');
    const savedCourse = await course.save();
    
    res.json({
      success: true,
      course: savedCourse
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

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private (course creator only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Only course creator can delete
    if (course.createdBy && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }
    
    const fileIds = [];
    course.modules.forEach((mod) => {
      mod.lessons.forEach((lesson) => {
        if (lesson.fileId) {
          fileIds.push(lesson.fileId);
        }
      });
    });

    if (fileIds.length > 0) {
      const bucket = getGridFSBucket();
      for (const fileId of fileIds) {
        try {
          await bucket.delete(new mongoose.Types.ObjectId(fileId));
        } catch (error) {
          // Skip orphan cleanup failures so course deletion still succeeds.
        }
      }
    }

    // Delete all enrollments for this course
    await Enrollment.deleteMany({ course: req.params.id });
    
    // Delete the course
    await Course.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/files/:fileId
// @desc    Stream a PDF file from GridFS if user has course access
// @access  Private
router.get('/files/:fileId', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ message: 'Invalid file id' });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const course = await Course.findOne({ 'modules.lessons.fileId': fileId });

    if (!course) {
      return res.status(404).json({ message: 'File not found' });
    }

    const canAccess = await isUserAllowedForCourse(course, req.user.id);
    if (!canAccess) {
      return res.status(403).json({ message: 'Not authorized to view this file' });
    }

    const bucket = getGridFSBucket();
    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];
    res.set('Content-Type', file.contentType || 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on('error', () => {
      res.status(404).json({ message: 'File not found' });
    });
    downloadStream.pipe(res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
