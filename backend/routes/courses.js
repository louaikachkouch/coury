const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getGridFSBucket } = require('../config/db');

const HF_SUMMARY_MODEL_URL = 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn';
const HF_MAX_INPUT_CHARS = 1200;
const HF_MAX_CHUNKS = 30;
const HF_RECURSIVE_MAX_DEPTH = 4;
const HF_CHUNK_OVERLAP_SENTENCES = 2;
const HF_MIN_CHUNK_SUMMARY_LEN = 90;
const HF_MAX_CHUNK_SUMMARY_LEN = 320;
const HF_REQUEST_RETRIES = 2;
const HF_RETRY_DELAY_MS = 800;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildLocalFallbackSummary = (text, maxSentences = 7) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [normalized];
  return sentences.slice(0, maxSentences).join(' ').trim();
};

const normalizeOcrText = (input) => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^page\s+\d+$/i.test(line));

  const cleanedLines = [];
  let prev = '';
  for (const line of lines) {
    const alphaChars = (line.match(/[a-zA-Z]/g) || []).length;
    const symbolChars = (line.match(/[^a-zA-Z0-9\s]/g) || []).length;

    // Skip likely OCR noise lines that are mostly symbols.
    if (line.length > 8 && symbolChars > alphaChars * 2) {
      continue;
    }

    if (line !== prev) {
      cleanedLines.push(line);
      prev = line;
    }
  }

  return cleanedLines
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\b([A-Za-z]+)-\s+([A-Za-z]+)\b/g, '$1$2')
    .trim();
};

const chunkTextForSummarization = (input, maxChars = HF_MAX_INPUT_CHARS) => {
  const text = normalizeOcrText(input);
  if (!text) {
    return [];
  }

  if (text.length <= maxChars) {
    return [text];
  }

  const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
  const chunks = [];
  let start = 0;

  while (start < sentences.length && chunks.length < HF_MAX_CHUNKS) {
    let chunk = '';
    let end = start;

    while (end < sentences.length) {
      const candidate = chunk ? `${chunk} ${sentences[end].trim()}` : sentences[end].trim();
      if (candidate.length > maxChars && chunk) {
        break;
      }

      if (candidate.length > maxChars) {
        chunk = candidate.slice(0, maxChars).trim();
        end += 1;
        break;
      }

      chunk = candidate;
      end += 1;
    }

    if (chunk) {
      chunks.push(chunk.trim());
    }

    if (end <= start) {
      start += 1;
    } else {
      start = Math.max(end - HF_CHUNK_OVERLAP_SENTENCES, start + 1);
    }
  }

  return chunks;
};

const requestHuggingFaceSummary = async ({ text, hfApiKey, maxLength = 220, minLength = 60 }) => {
  const payload = {
    inputs: text,
    parameters: {
      max_length: maxLength,
      min_length: minLength,
      do_sample: false,
      num_beams: 4,
      no_repeat_ngram_size: 3,
      repetition_penalty: 1.15,
      length_penalty: 1
    },
    options: {
      wait_for_model: true,
      use_cache: false
    }
  };

  let lastError = null;

  for (let attempt = 0; attempt <= HF_REQUEST_RETRIES; attempt += 1) {
    try {
      const hfResponse = await fetch(HF_SUMMARY_MODEL_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hfApiKey}`
        },
        body: JSON.stringify(payload)
      });

      const rawBody = await hfResponse.text();
      let hfData = null;
      try {
        hfData = JSON.parse(rawBody);
      } catch (parseError) {
        if (!hfResponse.ok) {
          const snippet = rawBody ? rawBody.slice(0, 180).replace(/\s+/g, ' ') : 'empty response body';
          const nonJsonError = new Error(`Hugging Face returned non-JSON response (HTTP ${hfResponse.status}): ${snippet}`);
          nonJsonError.statusCode = hfResponse.status;
          throw nonJsonError;
        }

        throw new Error('Hugging Face returned an unexpected non-JSON success response');
      }

      if (!hfResponse.ok) {
        const requestError = new Error(hfData?.error || `Hugging Face request failed (HTTP ${hfResponse.status})`);
        requestError.statusCode = hfResponse.status;
        throw requestError;
      }

      if (!Array.isArray(hfData) || !hfData[0]?.summary_text) {
        throw new Error('Hugging Face returned an invalid summary payload');
      }

      return hfData[0].summary_text.trim();
    } catch (error) {
      lastError = error;
      const statusCode = error.statusCode || 0;
      const retryable = [429, 500, 502, 503, 504].includes(statusCode)
        || /timeout|timed out|gateway|temporar|network/i.test(error.message || '');

      if (!retryable || attempt >= HF_REQUEST_RETRIES) {
        break;
      }

      await delay(HF_RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError || new Error('Hugging Face request failed');
};

const summarizeWithFallback = async ({ text, hfApiKey, depth = 0, maxLength = 220, minLength = 60 }) => {
  try {
    return await requestHuggingFaceSummary({ text, hfApiKey, maxLength, minLength });
  } catch (error) {
    const isSplitWorthyError = /index out of range|timeout|timed out|gateway|HTTP 504|temporar|non-JSON response \(HTTP 504\)/i.test(error.message || '');
    if (!isSplitWorthyError || depth >= HF_RECURSIVE_MAX_DEPTH || text.length < 300) {
      throw error;
    }

    const midpoint = Math.floor(text.length / 2);
    const splitAt = text.lastIndexOf(' ', midpoint) > 0 ? text.lastIndexOf(' ', midpoint) : midpoint;
    const left = text.slice(0, splitAt).trim();
    const right = text.slice(splitAt).trim();

    if (!left || !right) {
      throw error;
    }

    const leftSummary = await summarizeWithFallback({ text: left, hfApiKey, depth: depth + 1, maxLength, minLength });
    const rightSummary = await summarizeWithFallback({ text: right, hfApiKey, depth: depth + 1, maxLength, minLength });
    const merged = `${leftSummary} ${rightSummary}`.trim();
    return summarizeWithFallback({ text: merged, hfApiKey, depth: depth + 1, maxLength, minLength });
  }
};

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

// @route   PUT /api/courses/:id/content/:lessonId/file
// @desc    Replace lesson file with a new PDF (e.g., generated summary)
// @access  Private (course creator only)
router.put('/:id/content/:lessonId/file', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.createdBy && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this course' });
    }

    let targetLesson = null;
    for (const mod of course.modules) {
      const found = mod.lessons.find((lesson) => lesson._id.toString() === req.params.lessonId);
      if (found) {
        targetLesson = found;
        break;
      }
    }

    if (!targetLesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const oldFileId = targetLesson.fileId || null;
    const uploaded = await uploadBufferToGridFS(req.file, {
      uploadedBy: req.user.id,
      courseId: req.params.id,
      lessonId: req.params.lessonId,
      generatedSummary: true
    });

    targetLesson.fileName = req.file.originalname;
    targetLesson.fileId = uploaded._id;
    targetLesson.filePath = `gridfs://${uploaded._id}`;
    targetLesson.fileUrl = `/api/courses/files/${uploaded._id}`;
    targetLesson.fileSize = req.file.size;
    targetLesson.mimeType = req.file.mimetype;

    course.markModified('modules');
    await course.save();

    if (oldFileId) {
      try {
        const bucket = getGridFSBucket();
        await bucket.delete(new mongoose.Types.ObjectId(oldFileId));
      } catch (error) {
        // Ignore cleanup errors to avoid failing successful replacement.
      }
    }

    return res.json({
      success: true,
      lesson: {
        _id: targetLesson._id,
        fileName: targetLesson.fileName,
        fileUrl: targetLesson.fileUrl,
        fileId: targetLesson.fileId,
        fileSize: targetLesson.fileSize,
        mimeType: targetLesson.mimeType
      }
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

// @route   POST /api/courses/summarize
// @desc    Summarize extracted text using Hugging Face Inference API
// @access  Private
router.post('/summarize', protect, async (req, res) => {
  try {
    const { text, apiKey } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Text is required for summarization' });
    }

    const hfApiKey = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || apiKey;
    if (!hfApiKey) {
      return res.status(400).json({
        message: 'Hugging Face API key is missing. Set HF_API_KEY in backend env or provide apiKey in request.'
      });
    }

    if (typeof fetch !== 'function') {
      return res.status(500).json({ message: 'Global fetch is unavailable in this Node runtime' });
    }

    const chunks = chunkTextForSummarization(text);
    if (chunks.length === 0) {
      return res.status(400).json({ message: 'No usable text found for summarization' });
    }

    const partialSummaries = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const dynamicMax = Math.max(
        HF_MIN_CHUNK_SUMMARY_LEN + 40,
        Math.min(HF_MAX_CHUNK_SUMMARY_LEN, Math.floor(chunk.length / 4))
      );
      const dynamicMin = Math.max(HF_MIN_CHUNK_SUMMARY_LEN, Math.floor(dynamicMax * 0.45));

      let summary;
      try {
        summary = await summarizeWithFallback({
          text: chunk,
          hfApiKey,
          maxLength: dynamicMax,
          minLength: dynamicMin
        });
      } catch (error) {
        summary = buildLocalFallbackSummary(chunk, 6);
      }

      partialSummaries.push(`Section ${i + 1}\n${summary}`);
    }

    let finalSummary;
    if (partialSummaries.length === 1) {
      finalSummary = [
        'Comprehensive Course Summary',
        '',
        partialSummaries[0]
      ].join('\n');
    } else {
      const mergedForOverview = partialSummaries.join(' ');
      const compressedChunks = chunkTextForSummarization(mergedForOverview, HF_MAX_INPUT_CHARS);
      let overview;
      try {
        overview = await summarizeWithFallback({
          text: compressedChunks.slice(0, 2).join(' '),
          hfApiKey,
          maxLength: 300,
          minLength: 140
        });
      } catch (error) {
        overview = buildLocalFallbackSummary(partialSummaries.join(' '), 8);
      }

      finalSummary = [
        'Comprehensive Course Summary',
        '',
        'Overview',
        overview,
        '',
        'Detailed Breakdown',
        partialSummaries.join('\n\n')
      ].join('\n');
    }

    return res.json({
      success: true,
      summary: finalSummary,
      chunksUsed: chunks.length
    });
  } catch (error) {
    return res.status(500).json({ message: `Summarization failed: ${error.message}` });
  }
});

module.exports = router;
