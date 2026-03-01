import React, { useState, useEffect } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { coursesAPI, healthCheck } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Fallback courses for demo mode
const fallbackCourses = [
  {
    _id: '1',
    title: 'Advanced Psychology',
    code: 'PSY 301',
    instructor: 'Dr. Sarah Jenkins',
    color: 'bg-[#E08E79]/15 text-[#C96951]',
    solidColor: 'bg-[#E08E79]',
    progress: 75,
    nextDue: 'Tomorrow, 11:59 PM',
  },
  {
    _id: '2',
    title: 'Creative Writing',
    code: 'ENG 205',
    instructor: 'Prof. Michael Chen',
    color: 'bg-[#88B088]/15 text-[#6B916B]',
    solidColor: 'bg-[#88B088]',
    progress: 40,
    nextDue: 'Friday, 5:00 PM',
  },
  {
    _id: '3',
    title: 'Intro to Graphic Design',
    code: 'DES 101',
    instructor: 'Elena Rodriguez',
    color: 'bg-[#9A8C98]/15 text-[#7A6C78]',
    solidColor: 'bg-[#9A8C98]',
    progress: 90,
    nextDue: 'No upcoming assignments',
  },
];

const colorPalette = [
  { color: 'bg-[#E08E79]/15 text-[#C96951]', solidColor: 'bg-[#E08E79]' },
  { color: 'bg-[#88B088]/15 text-[#6B916B]', solidColor: 'bg-[#88B088]' },
  { color: 'bg-[#9A8C98]/15 text-[#7A6C78]', solidColor: 'bg-[#9A8C98]' },
  { color: 'bg-[#7EA8BE]/15 text-[#5A8AA0]', solidColor: 'bg-[#7EA8BE]' },
  { color: 'bg-[#C9A959]/15 text-[#A68B3B]', solidColor: 'bg-[#C9A959]' },
  { color: 'bg-[#B080B0]/15 text-[#906090]', solidColor: 'bg-[#B080B0]' },
];

const CourseCard = ({ course, onClick }) => {
  return (
    <Card 
      className="p-5 border-none shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      {/* Top color bar */}
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

      <div className="mt-auto pt-4 space-y-3">
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

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-2 border-t border-border/30">
          <Clock className="h-3.5 w-3.5" />
          <span>{course.nextDue}</span>
        </div>
      </div>
    </Card>
  );
};

const AddCourseCard = ({ onClick }) => {
  return (
    <Card 
      className="p-5 border-2 border-dashed border-border/60 shadow-none hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer h-full min-h-[220px]"
      onClick={onClick}
    >
      <div className="bg-muted p-4 rounded-full mb-3 text-muted-foreground">
        <BookOpen className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-base font-heading">Add a Course</h3>
      <p className="text-sm text-muted-foreground mt-1 px-4">
        Enter a code or browse the directory
      </p>
    </Card>
  );
};

const CoursesSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      const isApiAvailable = await healthCheck();
      
      if (isApiAvailable && localStorage.getItem('token')) {
        try {
          const data = await coursesAPI.getEnrolled();
          // Map API data to display format
          const mappedCourses = data.courses.map((course, index) => ({
            ...course,
            _id: course._id,
            code: course.category?.substring(0, 3).toUpperCase() + ' ' + (100 + index),
            ...colorPalette[index % colorPalette.length],
            nextDue: 'View course for details',
          }));
          setCourses(mappedCourses);
        } catch (error) {
          console.error('Failed to fetch courses:', error);
          // Don't use fallback - show empty state for real users
          setCourses([]);
        }
      } else if (!localStorage.getItem('token')) {
        // Only use fallback courses in demo mode (not logged in)
        setCourses(fallbackCourses);
      } else {
        // API not available but logged in - show empty
        setCourses([]);
      }
      setIsLoading(false);
    };

    fetchCourses();
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Your Courses
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-heading flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          Your Courses
        </h2>
        <Button 
          variant="ghost" 
          className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl px-3 h-9"
          onClick={() => navigate('/courses')}
        >
          View all
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed border-border/60">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">No courses yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Get started by enrolling in your first course
              </p>
              <Button onClick={() => navigate('/courses')} className="gap-2">
                Browse Courses
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
          {courses.slice(0, 3).map((course) => (
            <CourseCard 
              key={course._id} 
              course={course} 
              onClick={() => navigate(`/courses/${course._id}`)}
            />
          ))}
          <AddCourseCard onClick={() => navigate('/courses')} />
        </div>
      )}
    </div>
  );
};

export default CoursesSection;
