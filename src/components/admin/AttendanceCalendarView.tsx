
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import CalendarLegend from './CalendarLegend';

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
    <div className="flex flex-col items-center">
      <CalendarLegend />
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border"
        modifiersStyles={{
          present: { 
            backgroundColor: "rgb(34, 197, 94)", // Bright green
            color: "white"
          },
          late: { 
            backgroundColor: "rgb(245, 158, 11)", // Amber/orange
            color: "white"
          },
          absent: {
            backgroundColor: "rgb(239, 68, 68)", // Bright red
            color: "white"
          },
          today: {
            backgroundColor: "hsl(var(--accent))",
            color: "hsl(var(--accent-foreground))"
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
          day: (date: Date) => {
            const formattedDate = date.toDateString();
            const isPresentDay = attendanceDays.some(d => d.toDateString() === formattedDate);
            const isLateDay = lateAttendanceDays.some(d => d.toDateString() === formattedDate);
            const isAbsentDay = absentDays.some(d => d.toDateString() === formattedDate);
            
            if (isPresentDay) return "text-green-600 font-medium";
            if (isLateDay) return "text-amber-600 font-medium";
            if (isAbsentDay) return "text-red-600 font-medium";
            
            return "";
          }
        }}
      />
    </div>
  );
};

export default AttendanceCalendarView;
