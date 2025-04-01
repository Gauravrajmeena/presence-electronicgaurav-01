
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import CalendarLegend from './CalendarLegend';
import { cn } from '@/lib/utils';
import { UserCheck, Clock, X } from 'lucide-react';

interface AttendanceCalendarViewProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  attendanceDays: Date[];
  lateAttendanceDays: Date[];
  absentDays: Date[];
}

const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  selectedDate,
  setSelectedDate,
  attendanceDays,
  lateAttendanceDays,
  absentDays
}) => {
  // Get current date for today indicator
  const today = new Date();
  // Get current month for default display
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Helper function to render the day content with icons
  const renderDayContent = (day: Date) => {
    const isPresentDay = attendanceDays.some(d => 
      d.getDate() === day.getDate() && 
      d.getMonth() === day.getMonth() && 
      d.getFullYear() === day.getFullYear()
    );
    
    const isLateDay = lateAttendanceDays.some(d => 
      d.getDate() === day.getDate() && 
      d.getMonth() === day.getMonth() && 
      d.getFullYear() === day.getFullYear()
    );
    
    const isAbsentDay = absentDays.some(d => 
      d.getDate() === day.getDate() && 
      d.getMonth() === day.getMonth() && 
      d.getFullYear() === day.getFullYear()
    );
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isPresentDay && <UserCheck className="h-3.5 w-3.5 text-white z-10" />}
          {isLateDay && <Clock className="h-3.5 w-3.5 text-white z-10" />}
          {isAbsentDay && <X className="h-3.5 w-3.5 text-white z-10" />}
        </div>
        <span className="z-20">{day.getDate()}</span>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col items-center animate-fade-in relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-xl opacity-70 animate-pulse-subtle -z-10"></div>
      
      <CalendarLegend />
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border shadow-sm bg-background/80 backdrop-blur-sm"
        modifiersStyles={{
          present: { 
            backgroundColor: "rgb(34, 197, 94)", // Bright green
            color: "white",
            transform: "scale(1.15)",
            boxShadow: "0 8px 16px -2px rgba(34, 197, 94, 0.3)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          },
          late: { 
            backgroundColor: "rgb(245, 158, 11)", // Amber/orange
            color: "white",
            transform: "scale(1.15)",
            boxShadow: "0 8px 16px -2px rgba(245, 158, 11, 0.3)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          },
          absent: {
            backgroundColor: "rgb(239, 68, 68)", // Bright red
            color: "white",
            transform: "scale(1.15)",
            boxShadow: "0 8px 16px -2px rgba(239, 68, 68, 0.3)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          },
          today: {
            backgroundColor: "hsl(var(--accent))",
            color: "hsl(var(--accent-foreground))",
            borderWidth: "2px",
            borderColor: "hsl(var(--primary))",
            boxShadow: "0 0 15px 2px rgba(0, 120, 255, 0.3)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }
        }}
        components={{
          DayContent: ({ date }) => renderDayContent(date)
        }}
        modifiers={{
          present: attendanceDays || [],
          late: lateAttendanceDays || [],
          absent: absentDays || [],
          today: [today]
        }}
        defaultMonth={currentMonth}
        classNames={{
          day: cn(
            "relative transition-all duration-300 hover:scale-125 hover:rotate-3 hover:font-bold z-10"
          )
        }}
      />
    </div>
  );
};

export default AttendanceCalendarView;
