import React from 'react';
import { CheckCircle2, FileText, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';

const assignments = [
  {
    id: 1,
    course: 'Advanced Psychology',
    title: 'Cognitive Dissonance Essay',
    due: 'Tomorrow, 11:59 PM',
    type: 'Essay',
  },
  {
    id: 2,
    course: 'Creative Writing',
    title: 'Short Story Draft 1',
    due: 'Friday, 5:00 PM',
    type: 'Draft',
  },
  {
    id: 3,
    course: 'Creative Writing',
    title: 'Peer Review Log',
    due: 'Next Monday, 10:00 AM',
    type: 'Review',
  },
];

const AssignmentItem = ({ assignment }) => {
  return (
    <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 bg-accent/10 text-accent p-2 rounded-lg">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground truncate mb-0.5">
            {assignment.course}
          </p>
          <h4 className="font-semibold text-sm leading-tight text-foreground group-hover:text-primary transition-colors">
            {assignment.title}
          </h4>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground font-medium">
            <Clock className="h-3 w-3 text-accent" />
            <span className={assignment.id === 1 ? 'text-accent font-semibold' : ''}>
              {assignment.due}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const UpNextSection = () => {
  const navigate = useNavigate();

  const handleAssignmentClick = (assignment) => {
    // Navigate to the course associated with this assignment
    const courseId = assignment.id === 1 ? 1 : 2; // PSY 301 = 1, ENG 205 = 2
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-heading flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          Up Next
        </h2>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border/40 bg-secondary/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              This Week
            </span>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-md">
              3 Tasks
            </span>
          </div>
        </div>

        {/* Assignment list */}
        <div className="divide-y divide-border/40">
          {assignments.map((assignment) => (
            <div key={assignment.id} onClick={() => handleAssignmentClick(assignment)}>
              <AssignmentItem assignment={assignment} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 text-center border-t border-border/40 bg-muted/10">
          <Button 
            variant="link" 
            className="text-xs font-semibold text-muted-foreground hover:text-primary h-auto py-1"
            onClick={() => navigate('/schedule')}
          >
            View full calendar
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UpNextSection;
