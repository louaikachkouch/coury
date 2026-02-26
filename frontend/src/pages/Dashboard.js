import React from 'react';
import HeroSection from '../components/sections/HeroSection';
import CoursesSection from '../components/sections/CoursesSection';
import UpNextSection from '../components/sections/UpNextSection';
import AnnouncementCard from '../components/sections/AnnouncementCard';

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Courses Section - Left Column */}
        <div className="lg:col-span-8">
          <CoursesSection />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          <UpNextSection />
          <AnnouncementCard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
