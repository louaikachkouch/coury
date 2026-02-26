import React from 'react';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';

const AnnouncementCard = () => {
  const navigate = useNavigate();

  return (
    <Card 
      className="p-5 border-none shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/courses/1')}
    >
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 text-primary/10">
        <BookOpen className="h-24 w-24" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-sm uppercase tracking-wider">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          New Announcement
        </div>
        <h4 className="font-bold text-base mb-1 text-foreground">
          Library hours extended
        </h4>
        <p className="text-sm text-muted-foreground">
          The main campus library is now open 24/7 during the mid-term week.
        </p>
      </div>
    </Card>
  );
};

export default AnnouncementCard;
