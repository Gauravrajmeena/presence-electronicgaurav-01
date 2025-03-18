
import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Clock, X } from 'lucide-react';
import { useAttendance } from '@/contexts/AttendanceContext';

interface DailyAttendanceDetailsProps {
  selectedDate: Date | undefined;
  dailyAttendance: {
    id: string;
    timestamp: string;
    status: string;
  }[];
  isDateInArray: (date: Date, dateArray: Date[]) => boolean;
  attendanceDays: Date[];
  lateAttendanceDays: Date[];
  absentDays: Date[];
}

const DailyAttendanceDetails: React.FC<DailyAttendanceDetailsProps> = ({
  selectedDate,
  dailyAttendance,
  isDateInArray,
  attendanceDays = [],
  lateAttendanceDays = [],
  absentDays = []
}) => {
  const { recentAttendance } = useAttendance();

  // Format time to 12-hour format with AM/PM
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  // Format full date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  // Format date to show day of week and date
  const formatDateWithDay = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Check if the selected date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Check if the selected date is in the future
  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  // Check for real-time attendance from recent records
  const getRealtimeAttendance = () => {
    if (!selectedDate || recentAttendance.length === 0) return null;
    
    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);
    
    return recentAttendance.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= selectedDateStart && recordDate <= selectedDateEnd;
    });
  };

  if (!selectedDate) return null;

  // Check if there are attendance records for this date
  const hasAttendanceRecords = dailyAttendance && dailyAttendance.length > 0;
  const realtimeRecords = getRealtimeAttendance();
  const hasRealtimeRecords = realtimeRecords && realtimeRecords.length > 0;
  
  // Check if the date is in any of the attendance arrays (present, late, absent)
  const isPresentDate = isDateInArray(selectedDate, attendanceDays);
  const isLateDate = isDateInArray(selectedDate, lateAttendanceDays);
  const isAbsentDate = isDateInArray(selectedDate, absentDays);

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="font-medium mb-2">
        {formatDateWithDay(selectedDate)}
        {isToday(selectedDate) && <span className="ml-2 text-sm text-green-500">(Today)</span>}
      </h3>
      
      {isFutureDate(selectedDate) ? (
        <p className="text-sm text-muted-foreground">Future date selected. No attendance data available yet.</p>
      ) : hasRealtimeRecords ? (
        <div className="space-y-2">
          {realtimeRecords.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex flex-col">
                <div className="flex items-center">
                  {record.status === 'Late' ? (
                    <Clock className="h-4 w-4 text-amber-500 mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                  )}
                  <span>
                    {formatTime(record.timestamp)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground ml-6">
                  {formatDateTime(record.timestamp)}
                </span>
              </div>
              <Badge variant={record.status === 'Late' ? "outline" : "default"}>
                {record.status}
              </Badge>
            </div>
          ))}
        </div>
      ) : hasAttendanceRecords ? (
        <div className="space-y-2">
          {dailyAttendance.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex flex-col">
                <div className="flex items-center">
                  {record.status === 'late' ? (
                    <Clock className="h-4 w-4 text-amber-500 mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                  )}
                  <span>
                    {formatTime(record.timestamp)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground ml-6">
                  {formatDateTime(record.timestamp)}
                </span>
              </div>
              <Badge variant={record.status === 'late' ? "outline" : "default"}>
                {record.status === 'late' ? 'Late' : 'Present'}
              </Badge>
            </div>
          ))}
        </div>
      ) : isPresentDate || isLateDate ? (
        <div className="flex items-center justify-center p-4 bg-green-50 rounded-md">
          <UserCheck className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-500 font-medium">Present</span>
        </div>
      ) : isAbsentDate ? (
        <div className="flex items-center justify-center p-4 bg-red-50 rounded-md">
          <X className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-500 font-medium">Absent</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No attendance recorded for this date.</p>
      )}
    </div>
  );
};

export default DailyAttendanceDetails;
