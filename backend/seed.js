const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Models
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const ScheduleEvent = require('./models/ScheduleEvent');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Sample Courses
const courses = [
  {
    title: 'Introduction to React',
    description: 'Learn the fundamentals of React, including components, state, props, hooks, and building modern web applications.',
    instructor: 'Sarah Johnson',
    category: 'Web Development',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    duration: '8 weeks',
    totalLessons: 24,
    level: 'Beginner',
    modules: [
      {
        title: 'Getting Started with React',
        lessons: [
          { title: 'What is React?', duration: '15 min', type: 'video' },
          { title: 'Setting Up Your Environment', duration: '20 min', type: 'video' },
          { title: 'Your First React App', duration: '25 min', type: 'video' },
          { title: 'Understanding JSX', duration: '18 min', type: 'reading' }
        ]
      },
      {
        title: 'Components & Props',
        lessons: [
          { title: 'Functional Components', duration: '22 min', type: 'video' },
          { title: 'Class Components', duration: '20 min', type: 'video' },
          { title: 'Props in Depth', duration: '25 min', type: 'video' },
          { title: 'Component Composition', duration: '30 min', type: 'assignment' }
        ]
      },
      {
        title: 'State & Lifecycle',
        lessons: [
          { title: 'useState Hook', duration: '28 min', type: 'video' },
          { title: 'useEffect Hook', duration: '35 min', type: 'video' },
          { title: 'Component Lifecycle', duration: '20 min', type: 'reading' },
          { title: 'State Management Quiz', duration: '15 min', type: 'quiz' }
        ]
      }
    ]
  },
  {
    title: 'Data Science with Python',
    description: 'Master data analysis, visualization, and machine learning with Python, pandas, numpy, and scikit-learn.',
    instructor: 'Dr. Michael Chen',
    category: 'Data Science',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
    duration: '12 weeks',
    totalLessons: 36,
    level: 'Intermediate',
    modules: [
      {
        title: 'Python Fundamentals',
        lessons: [
          { title: 'Python Basics Review', duration: '30 min', type: 'video' },
          { title: 'Data Types & Structures', duration: '25 min', type: 'video' },
          { title: 'Functions & Modules', duration: '28 min', type: 'video' },
          { title: 'Python Practice', duration: '45 min', type: 'assignment' }
        ]
      },
      {
        title: 'Data Analysis with Pandas',
        lessons: [
          { title: 'Introduction to Pandas', duration: '35 min', type: 'video' },
          { title: 'DataFrames & Series', duration: '40 min', type: 'video' },
          { title: 'Data Cleaning', duration: '45 min', type: 'video' },
          { title: 'Data Analysis Project', duration: '90 min', type: 'assignment' }
        ]
      }
    ]
  },
  {
    title: 'UI/UX Design Principles',
    description: 'Learn essential design principles, user research methods, wireframing, prototyping, and design systems.',
    instructor: 'Emily Davis',
    category: 'Design',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    duration: '6 weeks',
    totalLessons: 18,
    level: 'Beginner',
    modules: [
      {
        title: 'Design Fundamentals',
        lessons: [
          { title: 'Introduction to UI/UX', duration: '20 min', type: 'video' },
          { title: 'Color Theory', duration: '25 min', type: 'video' },
          { title: 'Typography Basics', duration: '22 min', type: 'video' },
          { title: 'Layout Principles', duration: '28 min', type: 'reading' }
        ]
      },
      {
        title: 'User Research',
        lessons: [
          { title: 'Understanding Users', duration: '30 min', type: 'video' },
          { title: 'User Interviews', duration: '25 min', type: 'video' },
          { title: 'Creating Personas', duration: '35 min', type: 'assignment' }
        ]
      }
    ]
  },
  {
    title: 'Advanced JavaScript',
    description: 'Deep dive into advanced JavaScript concepts including closures, prototypes, async programming, and design patterns.',
    instructor: 'James Wilson',
    category: 'Web Development',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400',
    duration: '10 weeks',
    totalLessons: 30,
    level: 'Advanced',
    modules: [
      {
        title: 'JavaScript Deep Dive',
        lessons: [
          { title: 'Closures & Scope', duration: '35 min', type: 'video' },
          { title: 'Prototypes & Inheritance', duration: '40 min', type: 'video' },
          { title: 'This Keyword', duration: '30 min', type: 'video' },
          { title: 'Advanced Functions', duration: '38 min', type: 'video' }
        ]
      },
      {
        title: 'Async JavaScript',
        lessons: [
          { title: 'Callbacks & Event Loop', duration: '32 min', type: 'video' },
          { title: 'Promises', duration: '40 min', type: 'video' },
          { title: 'Async/Await', duration: '35 min', type: 'video' },
          { title: 'Async Patterns Quiz', duration: '20 min', type: 'quiz' }
        ]
      }
    ]
  },
  {
    title: 'Machine Learning Fundamentals',
    description: 'Introduction to machine learning algorithms, supervised and unsupervised learning, and model evaluation.',
    instructor: 'Dr. Lisa Park',
    category: 'Data Science',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400',
    duration: '14 weeks',
    totalLessons: 42,
    level: 'Intermediate',
    modules: [
      {
        title: 'ML Foundations',
        lessons: [
          { title: 'What is Machine Learning?', duration: '25 min', type: 'video' },
          { title: 'Types of ML', duration: '30 min', type: 'video' },
          { title: 'ML Workflow', duration: '28 min', type: 'video' },
          { title: 'Math Prerequisites', duration: '45 min', type: 'reading' }
        ]
      }
    ]
  },
  {
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile applications using React Native, covering navigation, state management, and native modules.',
    instructor: 'Alex Thompson',
    category: 'Mobile Development',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
    duration: '10 weeks',
    totalLessons: 28,
    level: 'Intermediate',
    modules: [
      {
        title: 'React Native Basics',
        lessons: [
          { title: 'Introduction to React Native', duration: '20 min', type: 'video' },
          { title: 'Setting Up Development Environment', duration: '30 min', type: 'video' },
          { title: 'Core Components', duration: '35 min', type: 'video' },
          { title: 'Styling in React Native', duration: '25 min', type: 'video' }
        ]
      }
    ]
  }
];

// Demo users
const users = [
  {
    name: 'Alex Rivera',
    email: 'demo@coury.com',
    password: 'demo123',
    major: 'Computer Science',
    year: 'Junior Year',
    avatar: 'https://i.pravatar.cc/150?u=demo'
  },
  {
    name: 'Jordan Smith',
    email: 'student@coury.com',
    password: 'student123',
    major: 'Data Science',
    year: 'Senior Year',
    avatar: 'https://i.pravatar.cc/150?u=student'
  },
  {
    name: 'Test User',
    email: 'test@test.com',
    password: 'test123',
    major: 'Engineering',
    year: 'Sophomore Year',
    avatar: 'https://i.pravatar.cc/150?u=test'
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await ScheduleEvent.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create courses first
    const createdCourses = await Course.insertMany(courses);
    console.log(`Created ${createdCourses.length} courses`);
    
    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users`);
    
    // Create enrollments for demo user (Alex Rivera)
    const demoUser = createdUsers[0];
    const enrollmentsForDemo = [
      { user: demoUser._id, course: createdCourses[0]._id, progress: 65, status: 'in-progress', currentModule: 1, currentLesson: 2 },
      { user: demoUser._id, course: createdCourses[1]._id, progress: 35, status: 'in-progress', currentModule: 0, currentLesson: 3 },
      { user: demoUser._id, course: createdCourses[2]._id, progress: 85, status: 'in-progress', currentModule: 1, currentLesson: 1 }
    ];
    
    await Enrollment.insertMany(enrollmentsForDemo);
    console.log(`Created ${enrollmentsForDemo.length} enrollments for demo user`);
    
    // Create enrollments for Jordan Smith
    const jordanUser = createdUsers[1];
    const enrollmentsForJordan = [
      { user: jordanUser._id, course: createdCourses[1]._id, progress: 80, status: 'in-progress', currentModule: 1, currentLesson: 3 },
      { user: jordanUser._id, course: createdCourses[4]._id, progress: 45, status: 'in-progress', currentModule: 0, currentLesson: 2 }
    ];
    
    await Enrollment.insertMany(enrollmentsForJordan);
    console.log(`Created ${enrollmentsForJordan.length} enrollments for Jordan`);
    
    // Create schedule events for demo user
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const scheduleEventsForDemo = [
      {
        user: demoUser._id,
        title: 'React Components Lecture',
        course: createdCourses[0]._id,
        courseName: 'Introduction to React',
        type: 'lecture',
        date: today,
        startTime: '10:00',
        endTime: '11:30',
        location: 'Room 201',
        color: 'blue'
      },
      {
        user: demoUser._id,
        title: 'Data Science Assignment Due',
        course: createdCourses[1]._id,
        courseName: 'Data Science with Python',
        type: 'assignment',
        date: tomorrow,
        startTime: '23:59',
        color: 'red'
      },
      {
        user: demoUser._id,
        title: 'UI/UX Design Workshop',
        course: createdCourses[2]._id,
        courseName: 'UI/UX Design Principles',
        type: 'lecture',
        date: tomorrow,
        startTime: '14:00',
        endTime: '16:00',
        location: 'Design Lab',
        color: 'purple'
      },
      {
        user: demoUser._id,
        title: 'Study Group - React Hooks',
        type: 'study',
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        startTime: '15:00',
        endTime: '17:00',
        location: 'Library Room B',
        color: 'green'
      },
      {
        user: demoUser._id,
        title: 'Midterm Exam - Data Science',
        course: createdCourses[1]._id,
        courseName: 'Data Science with Python',
        type: 'exam',
        date: nextWeek,
        startTime: '09:00',
        endTime: '12:00',
        location: 'Exam Hall A',
        color: 'red'
      }
    ];
    
    await ScheduleEvent.insertMany(scheduleEventsForDemo);
    console.log(`Created ${scheduleEventsForDemo.length} schedule events for demo user`);
    
    // Create schedule events for Jordan
    const scheduleEventsForJordan = [
      {
        user: jordanUser._id,
        title: 'Machine Learning Lab',
        course: createdCourses[4]._id,
        courseName: 'Machine Learning Fundamentals',
        type: 'lecture',
        date: today,
        startTime: '13:00',
        endTime: '15:00',
        location: 'CS Lab 3',
        color: 'blue'
      },
      {
        user: jordanUser._id,
        title: 'Data Analysis Project Review',
        course: createdCourses[1]._id,
        courseName: 'Data Science with Python',
        type: 'meeting',
        date: tomorrow,
        startTime: '11:00',
        endTime: '12:00',
        location: 'Office Hours',
        color: 'green'
      }
    ];
    
    await ScheduleEvent.insertMany(scheduleEventsForJordan);
    console.log(`Created ${scheduleEventsForJordan.length} schedule events for Jordan`);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo accounts:');
    console.log('  Email: demo@coury.com | Password: demo123');
    console.log('  Email: student@coury.com | Password: student123');
    console.log('  Email: test@test.com | Password: test123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
