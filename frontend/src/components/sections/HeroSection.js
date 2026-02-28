import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { scheduleAPI, healthCheck } from '../../services/api';

const HeroSection = () => {
  const { user } = useAuth();
  const [upcomingCount, setUpcomingCount] = useState(0);
  
  useEffect(() => {
    const fetchUpcoming = async () => {
      const isApiAvailable = await healthCheck();
      if (isApiAvailable && localStorage.getItem('token')) {
        try {
          const data = await scheduleAPI.getUpcoming();
          const assignments = data.events.filter(e => e.type === 'assignment' || e.type === 'exam');
          setUpcomingCount(assignments.length);
        } catch (error) {
          console.error('Failed to fetch upcoming:', error);
        }
      }
    };
    fetchUpcoming();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
        {getGreeting()}, {firstName}.{' '}
        <span className="inline-block origin-bottom-right">👋</span>
      </h1>
      <p className="text-muted-foreground text-lg">
        {upcomingCount > 0 ? (
          <>You have <span className="font-medium text-foreground">{upcomingCount} {upcomingCount === 1 ? 'assignment' : 'assignments'}</span> due soon.</>
        ) : (
          <>You're all caught up! No assignments due soon.</>
        )}
      </p>
    </section>
  );
};

export default HeroSection;
