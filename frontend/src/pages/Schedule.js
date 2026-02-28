import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, BookOpen, Plus, X, MapPin, FileText } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// Helper functions for date handling
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
};

const initialEvents = [
  {
    id: 1,
    title: 'Advanced Psychology',
    type: 'class',
    time: '10:00 AM - 11:30 AM',
    location: 'Room 204, Psychology Building',
    color: 'bg-[#E08E79]',
    date: new Date(2026, 1, 24), // Feb 24
  },
  {
    id: 2,
    title: 'Cognitive Dissonance Essay',
    type: 'assignment',
    time: '11:59 PM',
    course: 'PSY 301',
    color: 'bg-[#E08E79]',
    date: new Date(2026, 1, 25), // Feb 25
    due: true,
  },
  {
    id: 3,
    title: 'Creative Writing',
    type: 'class',
    time: '2:00 PM - 3:30 PM',
    location: 'Room 112, English Building',
    color: 'bg-[#88B088]',
    date: new Date(2026, 1, 25), // Feb 25
  },
  {
    id: 4,
    title: 'Advanced Psychology',
    type: 'class',
    time: '10:00 AM - 11:30 AM',
    location: 'Room 204, Psychology Building',
    color: 'bg-[#E08E79]',
    date: new Date(2026, 1, 26), // Feb 26
  },
  {
    id: 5,
    title: 'Data Structures',
    type: 'class',
    time: '9:00 AM - 10:30 AM',
    location: 'Room 301, CS Building',
    color: 'bg-[#7B9EC5]',
    date: new Date(2026, 1, 27), // Feb 27
  },
  {
    id: 6,
    title: 'Creative Writing',
    type: 'class',
    time: '2:00 PM - 3:30 PM',
    location: 'Room 112, English Building',
    color: 'bg-[#88B088]',
    date: new Date(2026, 1, 27), // Feb 27
  },
  {
    id: 7,
    title: 'Short Story Draft 1',
    type: 'assignment',
    time: '5:00 PM',
    course: 'ENG 205',
    color: 'bg-[#88B088]',
    date: new Date(2026, 1, 28), // Feb 28
    due: true,
  },
  {
    id: 8,
    title: 'Intro to Graphic Design',
    type: 'class',
    time: '1:00 PM - 2:00 PM',
    location: 'Room 105, Design Building',
    color: 'bg-[#9A8C98]',
    date: new Date(2026, 1, 28), // Feb 28
  },
  {
    id: 9,
    title: 'Project Presentation',
    type: 'assignment',
    time: '10:00 AM',
    course: 'CS 201',
    color: 'bg-[#7B9EC5]',
    date: new Date(2026, 2, 3), // Mar 3
    due: true,
  },
  {
    id: 10,
    title: 'Team Meeting',
    type: 'class',
    time: '3:00 PM - 4:00 PM',
    location: 'Library Room 2B',
    color: 'bg-[#D4A373]',
    date: new Date(2026, 2, 5), // Mar 5
  },
  {
    id: 11,
    title: 'Midterm Exam',
    type: 'assignment',
    time: '9:00 AM',
    course: 'PSY 301',
    color: 'bg-[#E08E79]',
    date: new Date(2026, 2, 10), // Mar 10
    due: true,
  },
];

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Event Detail Modal
const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;
  
  const formatEventDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-0 border-none shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className={`h-2 ${event.color} rounded-t-xl`} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${event.color}/15 ${event.color.replace('bg-', 'text-').replace('[', '').replace(']', '')}`}>
                {event.type === 'class' ? 'Class' : 'Assignment'}
              </span>
              <h2 className="text-xl font-bold mt-2">{event.title}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{formatEventDate(event.date)}</p>
                <p className="text-muted-foreground">{event.due ? `Due at ${event.time}` : event.time}</p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}

            {event.course && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Course</p>
                  <p className="text-muted-foreground">{event.course}</p>
                </div>
              </div>
            )}

            {event.description && (
              <div className="flex items-start gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Description</p>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            {event.type === 'assignment' && (
              <Button className="flex-1">Mark Complete</Button>
            )}
            <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Add Event Modal
const AddEventModal = ({ onClose, onAdd, selectedDate }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'class',
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    course: '',
    description: '',
    color: 'bg-[#7B9EC5]',
  });

  const colorOptions = [
    { value: 'bg-[#E08E79]', label: 'Coral' },
    { value: 'bg-[#88B088]', label: 'Green' },
    { value: 'bg-[#9A8C98]', label: 'Purple' },
    { value: 'bg-[#7B9EC5]', label: 'Blue' },
    { value: 'bg-[#D4A373]', label: 'Orange' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.time || !formData.date) return;
    
    const newEvent = {
      id: Date.now(),
      ...formData,
      date: new Date(formData.date),
      due: formData.type === 'assignment',
    };
    onAdd(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6 border-none shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add New Event</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Event title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="class">Class</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Time *</label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. 10:00 AM - 11:30 AM"
              required
            />
          </div>

          {formData.type === 'class' ? (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Room 101, Building A"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Course</label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="PSY 301"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-20 px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Add details..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Color</label>
            <div className="flex gap-2">
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full ${color.value} ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Add Event</Button>
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const DayColumn = ({ day, date, eventsForDay, isToday, onEventClick }) => {
  return (
    <div className={`flex-1 min-w-[140px] ${isToday ? 'bg-primary/5' : ''} rounded-xl p-3`}>
      <div className="text-center mb-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {day}
        </div>
        <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
          {date}
        </div>
        {isToday && (
          <div className="h-1.5 w-1.5 bg-primary rounded-full mx-auto mt-1" />
        )}
      </div>

      <div className="space-y-2">
        {eventsForDay.map((event) => (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className={`p-3 rounded-lg ${event.color}/15 border-l-4 ${event.color} cursor-pointer hover:shadow-sm transition-shadow`}
          >
            <h4 className="font-semibold text-sm text-foreground leading-tight">
              {event.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className={event.due ? 'text-accent font-semibold' : ''}>
                {event.due ? `Due ${event.time}` : event.time}
              </span>
            </div>
            {event.location && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {event.location}
              </p>
            )}
          </div>
        ))}
        {eventsForDay.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground border-2 border-dashed border-border/30 rounded-lg">
            No events
          </div>
        )}
      </div>
    </div>
  );
};

// Monthly Calendar Component
const MonthlyCalendar = ({ currentDate, events, onDateClick, selectedDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  
  // Get days from previous month to fill the first week
  const prevMonthDays = getDaysInMonth(year, month - 1);
  const prevMonthStartDay = prevMonthDays - firstDay + 1;
  
  // Get events map for quick lookup
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(event => {
      const dateKey = `${event.date.getFullYear()}-${event.date.getMonth()}-${event.date.getDate()}`;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    return map;
  }, [events]);
  
  const getEventsForDate = (day, monthOffset = 0) => {
    const targetMonth = month + monthOffset;
    const dateKey = `${year}-${targetMonth}-${day}`;
    return eventsByDate[dateKey] || [];
  };
  
  const isToday = (day, monthOffset = 0) => {
    const targetMonth = month + monthOffset;
    return today.getDate() === day && today.getMonth() === targetMonth && today.getFullYear() === year;
  };
  
  const isSelected = (day, monthOffset = 0) => {
    if (!selectedDate) return false;
    const targetMonth = month + monthOffset;
    return selectedDate.getDate() === day && selectedDate.getMonth() === targetMonth && selectedDate.getFullYear() === year;
  };
  
  // Build calendar grid
  const calendarDays = [];
  
  // Previous month days
  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthStartDay + i;
    calendarDays.push({ day, isCurrentMonth: false, monthOffset: -1 });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, isCurrentMonth: true, monthOffset: 0 });
  }
  
  // Next month days to fill remaining cells (6 rows x 7 days = 42)
  const remaining = 42 - calendarDays.length;
  for (let day = 1; day <= remaining; day++) {
    calendarDays.push({ day, isCurrentMonth: false, monthOffset: 1 });
  }
  
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, index) => {
          const dayEvents = getEventsForDate(item.day, item.monthOffset);
          const isTodayDate = isToday(item.day, item.monthOffset);
          const isSelectedDate = isSelected(item.day, item.monthOffset);
          
          return (
            <button
              key={index}
              onClick={() => {
                const clickedDate = new Date(year, month + item.monthOffset, item.day);
                onDateClick(clickedDate);
              }}
              className={`
                relative aspect-square p-1 rounded-xl transition-all duration-200 flex flex-col items-center justify-start
                ${item.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'}
                ${isTodayDate ? 'bg-primary text-primary-foreground font-bold' : ''}
                ${isSelectedDate && !isTodayDate ? 'bg-primary/15 ring-2 ring-primary' : ''}
                ${!isTodayDate && !isSelectedDate ? 'hover:bg-muted/50' : ''}
              `}
            >
              <span className={`text-sm ${isTodayDate ? 'font-bold' : ''}`}>
                {item.day}
              </span>
              
              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${isTodayDate ? 'bg-primary-foreground' : event.color}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className={`text-[8px] ${isTodayDate ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Selected Day Events Panel
const SelectedDayEvents = ({ date, events, onEventClick }) => {
  const dayEvents = events.filter(event => {
    return event.date.getDate() === date.getDate() &&
           event.date.getMonth() === date.getMonth() &&
           event.date.getFullYear() === date.getFullYear();
  });
  
  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  return (
    <Card className="p-5 border-none shadow-sm">
      <h3 className="font-bold text-lg font-heading mb-1">{formatDate(date)}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
      </p>
      
      <div className="space-y-3">
        {dayEvents.length > 0 ? (
          dayEvents.map((event) => (
            <div 
              key={event.id} 
              onClick={() => onEventClick(event)}
              className={`p-3 rounded-lg ${event.color}/15 border-l-4 ${event.color} cursor-pointer hover:shadow-sm transition-shadow`}
            >
              <h4 className="font-semibold text-sm text-foreground">{event.title}</h4>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className={event.due ? 'text-accent font-semibold' : ''}>
                  {event.due ? `Due ${event.time}` : event.time}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.course && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  <span>{event.course}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground border-2 border-dashed border-border/30 rounded-lg">
            No events scheduled
          </div>
        )}
      </div>
    </Card>
  );
};

const UpcomingEvents = ({ events, onEventClick }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingAssignments = events
    .filter(e => e.type === 'assignment' && e.date >= today)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);
  
  const formatDateShort = (date) => {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  return (
    <Card className="p-5 border-none shadow-sm">
      <h3 className="font-bold text-lg font-heading mb-4">Upcoming Deadlines</h3>
      <div className="space-y-3">
        {upcomingAssignments.length > 0 ? (
          upcomingAssignments.map((event) => (
            <div 
              key={event.id} 
              onClick={() => onEventClick(event)}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className={`p-2 rounded-lg ${event.color}/15`}>
                <BookOpen className="h-4 w-4" style={{ color: event.color.replace('bg-[', '').replace(']', '') }} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{event.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{event.course}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-accent font-semibold">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateShort(event.date)}, {event.time}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
        )}
      </div>
    </Card>
  );
};

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 28)); // Feb 28, 2026
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 1, 28));
  const [events, setEvents] = useState(initialEvents);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleAddEvent = (newEvent) => {
    setEvents([...events, newEvent]);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleToday = () => {
    const today = new Date(2026, 1, 28); // Demo: Feb 28, 2026
    setCurrentDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="space-y-8">
      {/* Modals */}
      {showAddModal && (
        <AddEventModal 
          onClose={() => setShowAddModal(false)} 
          onAdd={handleAddEvent}
          selectedDate={selectedDate}
        />
      )}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            Schedule
          </h1>
          <p className="text-muted-foreground mt-1">
            View your classes and upcoming assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleToday}>
            Today
          </Button>
          <Button className="gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={handlePrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold font-heading">
          {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
        </h2>
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={handleNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Calendar */}
        <div className="lg:col-span-2">
          <MonthlyCalendar 
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SelectedDayEvents 
            date={selectedDate} 
            events={events} 
            onEventClick={handleEventClick}
          />
          
          <UpcomingEvents events={events} onEventClick={handleEventClick} />
          
          {/* Quick Stats */}
          <Card className="p-5 border-none shadow-sm">
            <h3 className="font-bold text-lg font-heading mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Classes</span>
                <span className="font-bold text-foreground">{events.filter(e => e.type === 'class').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Assignments Due</span>
                <span className="font-bold text-accent">{events.filter(e => e.type === 'assignment').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <span className="font-bold text-foreground">{events.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
