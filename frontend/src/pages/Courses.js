import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Search, Plus, ChevronRight, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const courseColors = [
  { color: 'bg-[#E08E79]/15 text-[#C96951]', solidColor: 'bg-[#E08E79]', name: 'Coral' },
  { color: 'bg-[#88B088]/15 text-[#6B916B]', solidColor: 'bg-[#88B088]', name: 'Sage' },
  { color: 'bg-[#9A8C98]/15 text-[#7A6C78]', solidColor: 'bg-[#9A8C98]', name: 'Mauve' },
  { color: 'bg-[#7B9EC5]/15 text-[#5A7DA4]', solidColor: 'bg-[#7B9EC5]', name: 'Sky' },
  { color: 'bg-[#D4A574]/15 text-[#B8895A]', solidColor: 'bg-[#D4A574]', name: 'Caramel' },
  { color: 'bg-[#A8B5C4]/15 text-[#8895A4]', solidColor: 'bg-[#A8B5C4]', name: 'Slate' },
];

const AddCourseModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    instructor: '',
    description: '',
    credits: 3,
    schedule: '',
    colorIndex: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) return;
    
    const selectedColor = courseColors[formData.colorIndex];
    onAdd({
      id: Date.now(),
      title: formData.title.trim(),
      code: formData.code.trim().toUpperCase(),
      instructor: formData.instructor.trim() || 'TBA',
      description: formData.description.trim() || 'No description available.',
      credits: formData.credits,
      schedule: formData.schedule.trim() || 'Schedule TBA',
      color: selectedColor.color,
      solidColor: selectedColor.solidColor,
      progress: 0,
      nextDue: 'No upcoming assignments',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg p-6 border-none shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add New Course</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., CS 101"
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Credits</label>
              <select
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} credit{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Course Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction to Computer Science"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Instructor</label>
            <input
              type="text"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              placeholder="e.g., Dr. Jane Smith"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Schedule</label>
            <input
              type="text"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              placeholder="e.g., Mon, Wed 10:00 AM - 11:30 AM"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief course description..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Course Color</label>
            <div className="flex gap-2">
              {courseColors.map((c, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData({ ...formData, colorIndex: index })}
                  className={`w-10 h-10 rounded-xl ${c.solidColor} transition-transform ${formData.colorIndex === index ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'}`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const allCourses = [
  {
    id: 1,
    title: 'Advanced Psychology',
    code: 'PSY 301',
    instructor: 'Dr. Sarah Jenkins',
    color: 'bg-[#E08E79]/15 text-[#C96951]',
    solidColor: 'bg-[#E08E79]',
    progress: 75,
    nextDue: 'Tomorrow, 11:59 PM',
    description: 'Explore advanced concepts in cognitive psychology, including perception, memory, and decision-making processes.',
    credits: 3,
    schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
  },
  {
    id: 2,
    title: 'Creative Writing',
    code: 'ENG 205',
    instructor: 'Prof. Michael Chen',
    color: 'bg-[#88B088]/15 text-[#6B916B]',
    solidColor: 'bg-[#88B088]',
    progress: 40,
    nextDue: 'Friday, 5:00 PM',
    description: 'Develop your creative writing skills through fiction, poetry, and narrative non-fiction exercises.',
    credits: 3,
    schedule: 'Tue, Thu 2:00 PM - 3:30 PM',
  },
  {
    id: 3,
    title: 'Intro to Graphic Design',
    code: 'DES 101',
    instructor: 'Elena Rodriguez',
    color: 'bg-[#9A8C98]/15 text-[#7A6C78]',
    solidColor: 'bg-[#9A8C98]',
    progress: 90,
    nextDue: 'No upcoming assignments',
    description: 'Learn the fundamentals of graphic design including typography, color theory, and layout principles.',
    credits: 4,
    schedule: 'Mon, Wed, Fri 1:00 PM - 2:00 PM',
  },
  {
    id: 4,
    title: 'Data Structures',
    code: 'CS 201',
    instructor: 'Dr. James Wilson',
    color: 'bg-[#7B9EC5]/15 text-[#5A7DA4]',
    solidColor: 'bg-[#7B9EC5]',
    progress: 60,
    nextDue: 'Wednesday, 11:59 PM',
    description: 'Study fundamental data structures and algorithms including arrays, linked lists, trees, and graphs.',
    credits: 4,
    schedule: 'Tue, Thu 9:00 AM - 10:30 AM',
  },
];

const CourseCard = ({ course, onClick }) => {
  return (
    <Card 
      className="p-5 border-none shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 w-full h-1.5 ${course.solidColor}`} />

      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground mb-1 uppercase">
            {course.code}
          </div>
          <h3 className="font-bold text-lg font-heading leading-tight group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{course.instructor}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${course.color} transition-transform group-hover:scale-110`}>
          <BookOpen className="h-5 w-5" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {course.description}
      </p>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-muted-foreground">Course Progress</span>
            <span className="text-foreground">{course.progress}%</span>
          </div>
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className={`h-full ${course.solidColor} rounded-full`}
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{course.nextDue}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Card>
  );
};

const Courses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [courses, setCourses] = useState(allCourses);
  const [showAddModal, setShowAddModal] = useState(false);

  const addCourse = (newCourse) => {
    setCourses([newCourse, ...courses]);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'in-progress') return matchesSearch && course.progress > 0 && course.progress < 100;
    if (filter === 'completed') return matchesSearch && course.progress === 100;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Your Courses
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your enrolled courses
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <AddCourseModal 
          onClose={() => setShowAddModal(false)}
          onAdd={addCourse}
        />
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilter('all')}
            className="rounded-xl"
          >
            All
          </Button>
          <Button 
            variant={filter === 'in-progress' ? 'default' : 'ghost'}
            onClick={() => setFilter('in-progress')}
            className="rounded-xl"
          >
            In Progress
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'ghost'}
            onClick={() => setFilter('completed')}
            className="rounded-xl"
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => (
          <CourseCard 
            key={course.id} 
            course={course} 
            onClick={() => navigate(`/courses/${course.id}`)}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No courses found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
};

export default Courses;
