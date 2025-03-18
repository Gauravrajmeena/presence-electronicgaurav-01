
import React, { useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import CalendarLegend from './CalendarLegend';
import { cn } from '@/lib/utils';

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
  
  return (
    <div className="flex flex-col items-center animate-fade-in">
      <CalendarLegend />
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border shadow-sm"
        modifiersStyles={{
          present: { 
            backgroundColor: "rgb(34, 197, 94)", // Bright green
            color: "white",
            transform: "scale(1.05)",
            boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.2)",
            transition: "all 0.2s ease"
          },
          late: { 
            backgroundColor: "rgb(245, 158, 11)", // Amber/orange
            color: "white",
            transform: "scale(1.05)",
            boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.2)",
            transition: "all 0.2s ease"
          },
          absent: {
            backgroundColor: "rgb(239, 68, 68)", // Bright red
            color: "white",
            transform: "scale(1.05)",
            boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.2)",
            transition: "all 0.2s ease"
          },
          today: {
            backgroundColor: "hsl(var(--accent))",
            color: "hsl(var(--accent-foreground))",
            borderWidth: "2px",
            borderColor: "hsl(var(--primary))",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease"
          }
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
            "relative transition-all duration-200 hover:scale-110 z-10"
          )
        }}
      />
    </div>
  );
};

export default AttendanceCalendarView;
