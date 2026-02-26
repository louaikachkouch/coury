import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ChevronLeft, FileText, Video, Calendar, Users, X, MessageSquare, Download, Upload, Eye, CheckCircle, Play, Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const initialCourseData = {
  1: {
    id: 1,
    title: 'Advanced Psychology',
    code: 'PSY 301',
    instructor: 'Dr. Sarah Jenkins',
    color: 'bg-[#E08E79]/15 text-[#C96951]',
    solidColor: 'bg-[#E08E79]',
    progress: 75,
    description: 'Explore advanced concepts in cognitive psychology, including perception, memory, and decision-making processes.',
    credits: 3,
    schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
    modules: [
      { id: 1, title: 'Introduction to Cognitive Psychology', completed: true, type: 'video' },
      { id: 2, title: 'Memory and Learning', completed: true, type: 'reading' },
      { id: 3, title: 'Perception and Attention', completed: true, type: 'video' },
      { id: 4, title: 'Decision Making', completed: false, type: 'reading' },
      { id: 5, title: 'Cognitive Dissonance Essay', completed: false, type: 'assignment', due: 'Tomorrow, 11:59 PM' },
    ],
    announcements: [
      { id: 1, title: 'Essay deadline extended', date: 'Feb 23, 2026' },
      { id: 2, title: 'Office hours cancelled this week', date: 'Feb 22, 2026' },
    ],
  },
  2: {
    id: 2,
    title: 'Creative Writing',
    code: 'ENG 205',
    instructor: 'Prof. Michael Chen',
    color: 'bg-[#88B088]/15 text-[#6B916B]',
    solidColor: 'bg-[#88B088]',
    progress: 40,
    description: 'Develop your creative writing skills through fiction, poetry, and narrative non-fiction exercises.',
    credits: 3,
    schedule: 'Tue, Thu 2:00 PM - 3:30 PM',
    modules: [
      { id: 1, title: 'Elements of Fiction', completed: true, type: 'reading' },
      { id: 2, title: 'Character Development', completed: true, type: 'video' },
      { id: 3, title: 'Short Story Draft 1', completed: false, type: 'assignment', due: 'Friday, 5:00 PM' },
      { id: 4, title: 'Peer Review Log', completed: false, type: 'assignment', due: 'Next Monday, 10:00 AM' },
    ],
    announcements: [
      { id: 1, title: 'Guest speaker next week', date: 'Feb 24, 2026' },
    ],
  },
  3: {
    id: 3,
    title: 'Intro to Graphic Design',
    code: 'DES 101',
    instructor: 'Elena Rodriguez',
    color: 'bg-[#9A8C98]/15 text-[#7A6C78]',
    solidColor: 'bg-[#9A8C98]',
    progress: 90,
    description: 'Learn the fundamentals of graphic design including typography, color theory, and layout principles.',
    credits: 4,
    schedule: 'Mon, Wed, Fri 1:00 PM - 2:00 PM',
    modules: [
      { id: 1, title: 'Typography Basics', completed: true, type: 'video' },
      { id: 2, title: 'Color Theory', completed: true, type: 'reading' },
      { id: 3, title: 'Layout Principles', completed: true, type: 'video' },
      { id: 4, title: 'Final Project Prep', completed: false, type: 'reading' },
    ],
    announcements: [],
  },
  4: {
    id: 4,
    title: 'Data Structures',
    code: 'CS 201',
    instructor: 'Dr. James Wilson',
    color: 'bg-[#7B9EC5]/15 text-[#5A7DA4]',
    solidColor: 'bg-[#7B9EC5]',
    progress: 60,
    description: 'Study fundamental data structures and algorithms including arrays, linked lists, trees, and graphs.',
    credits: 4,
    schedule: 'Tue, Thu 9:00 AM - 10:30 AM',
    modules: [
      { id: 1, title: 'Arrays and Linked Lists', completed: true, type: 'video' },
      { id: 2, title: 'Stacks and Queues', completed: true, type: 'reading' },
      { id: 3, title: 'Trees and Graphs', completed: false, type: 'video' },
      { id: 4, title: 'Algorithm Analysis', completed: false, type: 'assignment', due: 'Wednesday, 11:59 PM' },
    ],
    announcements: [
      { id: 1, title: 'Midterm review session', date: 'Feb 25, 2026' },
    ],
  },
};

const ModuleItem = ({ module, onView, onToggle }) => {
  const getIcon = () => {
    switch (module.type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'assignment': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div 
      className={`p-4 rounded-xl border ${module.completed ? 'bg-muted/30 border-border/30' : 'bg-card border-border/50'} hover:shadow-sm transition-shadow cursor-pointer group`}
    >
      <div className="flex items-center gap-3">
        <div 
          className={`p-2 rounded-lg ${module.completed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} cursor-pointer hover:scale-110 transition-transform`}
          onClick={(e) => { e.stopPropagation(); onView(); }}
        >
          {getIcon()}
        </div>
        <div className="flex-1" onClick={onView}>
          <h4 className={`font-medium ${module.completed ? 'text-muted-foreground line-through' : 'text-foreground'} hover:text-primary transition-colors`}>
            {module.title}
          </h4>
          {module.due && !module.completed && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-accent font-medium">
              <Clock className="h-3 w-3" />
              <span>Due: {module.due}</span>
            </div>
          )}
          {module.completed && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-primary font-medium">
              <span>Completed</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onView(); }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <div 
            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${module.completed ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary'}`}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
          >
            {module.completed && <span className="text-xs">✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Module Content Viewer Modal (PDF/Video viewer)
const ModuleContentModal = ({ module, course, onClose, onMarkComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Check if this is a PDF with an actual file
  const isPdfWithFile = module.type === 'reading' && module.fileUrl;

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      onMarkComplete();
    }, 1500);
  };

  // For PDF files with actual content, show fullscreen clean viewer
  if (isPdfWithFile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} onClick={onClose}>
        {/* Cozy Header with warm accents */}
        <div 
          className="flex items-center justify-between px-8 py-4 backdrop-blur-md"
          style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #e08e79 0%, #c96951 100%)' }}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">{module.title}</h2>
              {module.fileName && (
                <p className="text-sm text-white/50 mt-0.5">{module.fileName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!module.completed && (
              <button 
                onClick={onMarkComplete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.9)' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <CheckCircle className="h-4 w-4" />
                Mark Complete
              </button>
            )}
            {module.completed && (
              <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(136, 176, 136, 0.2)', color: '#88B088' }}>
                <CheckCircle className="h-4 w-4" />
                Completed
              </span>
            )}
            <a href={module.fileUrl} download={module.fileName || 'document.pdf'}>
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.9)' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </a>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl transition-all"
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.9)' }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* PDF Viewer with cozy frame */}
        <div className="flex-1 p-6" onClick={(e) => e.stopPropagation()}>
          <div 
            className="w-full h-full rounded-2xl overflow-hidden"
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            <iframe
              src={`${module.fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0"
              title={module.title}
              style={{ background: '#faf8f5' }}
            />
          </div>
        </div>

        {/* Subtle ambient glow */}
        <div 
          className="fixed top-0 left-1/4 w-1/2 h-32 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(224, 142, 121, 0.3) 0%, transparent 70%)' }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-4xl border-none shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${course.color}`}>
              {module.type === 'video' ? <Video className="h-5 w-5" /> : 
               module.type === 'assignment' ? <FileText className="h-5 w-5" /> : 
               <BookOpen className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">{module.title}</h2>
              <p className="text-sm text-muted-foreground">{course.code} • {course.title}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {module.type === 'video' ? (
            // Video Content
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                <div className="relative z-10 text-center">
                  <div className="bg-primary text-primary-foreground rounded-full p-4 mx-auto mb-4 w-fit cursor-pointer hover:scale-110 transition-transform">
                    <Play className="h-8 w-8" />
                  </div>
                  <p className="text-muted-foreground">Click to play video lecture</p>
                  <p className="text-sm text-muted-foreground mt-1">Duration: 45 minutes</p>
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl">
                <h3 className="font-semibold mb-2">Lecture Notes</h3>
                <p className="text-sm text-muted-foreground">
                  This lecture covers the key concepts of {module.title.toLowerCase()}. Make sure to take notes and complete the practice exercises at the end.
                </p>
              </div>
            </div>
          ) : module.type === 'assignment' ? (
            // Assignment Content
            <div className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-xl">
                <h3 className="font-semibold mb-2">Assignment Instructions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete the following assignment and submit your work as a PDF file. Make sure to follow the rubric guidelines provided below.
                </p>
                <div className="flex items-center gap-2 text-sm text-accent font-medium">
                  <Clock className="h-4 w-4" />
                  <span>Due: {module.due || 'No deadline'}</span>
                </div>
              </div>

              {/* PDF Preview Area */}
              <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Assignment Document</h3>
                <p className="text-sm text-muted-foreground mb-4">{module.title}.pdf</p>
                <Button variant="ghost" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Assignment PDF
                </Button>
              </div>

              {/* Submission Area */}
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Submit Your Work
                </h3>
                
                {submitted ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 mx-auto text-primary mb-3" />
                    <p className="font-semibold text-primary">Assignment Submitted!</p>
                    <p className="text-sm text-muted-foreground mt-1">Your work has been submitted successfully.</p>
                  </div>
                ) : (
                  <>
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center mb-4">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        {selectedFile ? (
                          <p className="text-sm font-medium text-primary">{selectedFile.name}</p>
                        ) : (
                          <>
                            <p className="text-sm font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX (max 10MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleSubmit}
                      disabled={!selectedFile || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Submit Assignment
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Reading Content (PDF) - Mock for modules without uploaded file
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-inner border border-border/50 p-8 min-h-[400px]">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center border-b pb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
                    <p className="text-gray-600 mt-2">{course.code} - {course.title}</p>
                    <p className="text-sm text-gray-500 mt-1">By {course.instructor}</p>
                  </div>
                  
                  <div className="space-y-4 text-gray-700">
                    <h2 className="text-lg font-semibold">Introduction</h2>
                    <p className="text-sm leading-relaxed">
                      This chapter covers the fundamental concepts of {module.title.toLowerCase()}. Understanding these principles is essential for your progress in this course.
                    </p>
                    <p className="text-sm leading-relaxed">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                    </p>
                    
                    <h2 className="text-lg font-semibold mt-6">Key Concepts</h2>
                    <ul className="list-disc list-inside text-sm space-y-2">
                      <li>Understanding the fundamental principles</li>
                      <li>Applying theoretical knowledge to practice</li>
                      <li>Analyzing case studies and examples</li>
                      <li>Developing critical thinking skills</li>
                    </ul>
                    
                    <p className="text-sm leading-relaxed mt-4">
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                    </p>
                  </div>
                  
                  <div className="text-center text-sm text-gray-400 pt-6 border-t">
                    Page 1 of 12
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Previous</Button>
                  <Button variant="ghost" size="sm">Next</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {module.completed ? (
              <span className="text-sm text-primary font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Completed
              </span>
            ) : (
              <Button variant="ghost" size="sm" onClick={onMarkComplete}>
                Mark as Complete
              </Button>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
};

// Add Content Modal
const AddContentModal = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('reading');
  const [dueDate, setDueDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Auto-fill title from filename if empty
      if (!title) {
        const fileName = e.target.files[0].name.replace(/\.[^/.]+$/, '');
        setTitle(fileName);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    // Create a URL for the uploaded file so it can be displayed
    let fileUrl = null;
    if (selectedFile) {
      fileUrl = URL.createObjectURL(selectedFile);
    }
    
    onAdd({
      id: Date.now(),
      title: title.trim(),
      type,
      completed: false,
      due: type === 'assignment' && dueDate ? dueDate : undefined,
      fileName: selectedFile?.name,
      fileUrl: fileUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6 border-none shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Course Content</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Content Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 5: Advanced Topics"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'reading', label: 'Reading', icon: BookOpen },
                { value: 'video', label: 'Video', icon: Video },
                { value: 'assignment', label: 'Assignment', icon: FileText },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${
                    type === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <option.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload File</label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.mp4,.mov,.ppt,.pptx"
                onChange={handleFileSelect}
                className="hidden"
                id="content-file-upload"
              />
              <label htmlFor="content-file-upload" className="cursor-pointer">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, MP4, PPT (max 50MB)</p>
                  </>
                )}
              </label>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs text-muted-foreground hover:text-accent mt-2"
              >
                Remove file
              </button>
            )}
          </div>

          {type === 'assignment' && (
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g., Friday, 5:00 PM"
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Syllabus Modal
const SyllabusModal = ({ course, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl p-6 border-none shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Course Syllabus</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-2">{course.code}: {course.title}</h3>
            <p className="text-muted-foreground">{course.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Instructor:</span>
              <p className="text-muted-foreground">{course.instructor}</p>
            </div>
            <div>
              <span className="font-semibold">Credits:</span>
              <p className="text-muted-foreground">{course.credits}</p>
            </div>
            <div>
              <span className="font-semibold">Schedule:</span>
              <p className="text-muted-foreground">{course.schedule}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Course Objectives</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Understand core concepts and theories</li>
              <li>Apply knowledge through practical assignments</li>
              <li>Develop critical thinking skills</li>
              <li>Collaborate effectively with peers</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Grading</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Assignments: 40%</p>
              <p>Midterm Exam: 25%</p>
              <p>Final Exam: 25%</p>
              <p>Participation: 10%</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
        </div>
      </Card>
    </div>
  );
};

// Discussion Board Modal
const DiscussionModal = ({ course, onClose }) => {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([
    { id: 1, author: 'Sarah M.', content: 'Does anyone have notes from last week\'s lecture?', time: '2 hours ago', replies: 3 },
    { id: 2, author: 'James K.', content: 'Study group meeting tomorrow at 3pm in the library!', time: '5 hours ago', replies: 7 },
    { id: 3, author: 'Prof. ' + course.instructor.split(' ').pop(), content: 'Reminder: Office hours are cancelled this Friday.', time: '1 day ago', replies: 0 },
  ]);

  const handlePost = () => {
    if (!newPost.trim()) return;
    setPosts([
      { id: Date.now(), author: 'You', content: newPost, time: 'Just now', replies: 0 },
      ...posts
    ]);
    setNewPost('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl p-6 border-none shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Discussion Board</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Start a discussion..."
            className="flex-1 h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          />
          <Button onClick={handlePost}>Post</Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{post.author}</span>
                <span className="text-xs text-muted-foreground">{post.time}</span>
              </div>
              <p className="text-sm text-foreground">{post.content}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{post.replies} replies</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-border/30">
          <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
        </div>
      </Card>
    </div>
  );
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(initialCourseData);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showAddContent, setShowAddContent] = useState(false);
  
  const course = courseData[id];

  const addNewContent = (newModule) => {
    setCourseData(prev => {
      const updated = { ...prev };
      const courseModules = [...updated[id].modules, newModule];
      const completedCount = courseModules.filter(m => m.completed).length;
      const progress = Math.round((completedCount / courseModules.length) * 100);
      updated[id] = { ...updated[id], modules: courseModules, progress };
      return updated;
    });
  };

  const openModuleContent = (module) => {
    setSelectedModule(module);
    setShowContentModal(true);
  };

  const handleMarkModuleComplete = () => {
    if (selectedModule) {
      toggleModuleCompletion(selectedModule.id);
      setSelectedModule({ ...selectedModule, completed: true });
    }
  };

  const toggleModuleCompletion = (moduleId) => {
    setCourseData(prev => {
      const updated = { ...prev };
      const courseModules = updated[id].modules.map(m => 
        m.id === moduleId ? { ...m, completed: !m.completed } : m
      );
      const completedCount = courseModules.filter(m => m.completed).length;
      const progress = Math.round((completedCount / courseModules.length) * 100);
      updated[id] = { ...updated[id], modules: courseModules, progress };
      return updated;
    });
  };

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">Course not found</h3>
        <Button variant="ghost" onClick={() => navigate('/courses')} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modals */}
      {showSyllabus && <SyllabusModal course={course} onClose={() => setShowSyllabus(false)} />}
      {showDiscussion && <DiscussionModal course={course} onClose={() => setShowDiscussion(false)} />}
      {showContentModal && selectedModule && (
        <ModuleContentModal 
          module={selectedModule} 
          course={course} 
          onClose={() => { setShowContentModal(false); setSelectedModule(null); }}
          onMarkComplete={handleMarkModuleComplete}
        />
      )}
      {showAddContent && (
        <AddContentModal 
          onClose={() => setShowAddContent(false)}
          onAdd={addNewContent}
        />
      )}

      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/courses')}
        className="gap-2 -ml-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Courses
      </Button>

      {/* Course Header */}
      <Card className="p-6 border-none shadow-sm relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 ${course.solidColor}`} />
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-wider text-muted-foreground mb-2 uppercase">
              {course.code}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {course.title}
            </h1>
            <p className="text-muted-foreground mt-2">{course.instructor}</p>
          </div>
          <div className={`p-4 rounded-xl ${course.color}`}>
            <BookOpen className="h-8 w-8" />
          </div>
        </div>

        <p className="text-muted-foreground mt-4">{course.description}</p>

        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{course.schedule}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>{course.credits} Credits</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-muted-foreground">Course Progress</span>
            <span className="text-foreground">{course.progress}%</span>
          </div>
          <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className={`h-full ${course.solidColor} rounded-full`}
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-heading">Course Content</h2>
              <p className="text-sm text-muted-foreground">Click on a module to view its content</p>
            </div>
            <Button onClick={() => setShowAddContent(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </div>
          <div className="space-y-3">
            {course.modules.map((module) => (
              <ModuleItem 
                key={module.id} 
                module={module} 
                onView={() => openModuleContent(module)}
                onToggle={() => toggleModuleCompletion(module.id)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Announcements */}
          <Card className="p-5 border-none shadow-sm">
            <h3 className="font-bold text-lg font-heading mb-4">Announcements</h3>
            {course.announcements.length > 0 ? (
              <div className="space-y-3">
                {course.announcements.map((announcement) => (
                  <div key={announcement.id} className="p-3 rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">{announcement.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{announcement.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements</p>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-5 border-none shadow-sm">
            <h3 className="font-bold text-lg font-heading mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => setShowSyllabus(true)}
              >
                <FileText className="h-4 w-4" />
                View Syllabus
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => setShowDiscussion(true)}
              >
                <Users className="h-4 w-4" />
                Discussion Board
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/schedule')}
              >
                <Calendar className="h-4 w-4" />
                View Schedule
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
