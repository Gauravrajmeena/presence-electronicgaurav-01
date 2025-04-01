
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchSelectedFace, 
  fetchAttendanceRecords, 
  fetchDailyAttendance,
  generateWorkingDays,
  isDateInArray,
  FaceInfo
} from '../utils/attendanceUtils';
import { useAttendance } from '@/contexts/AttendanceContext';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  timestamp: string;
  status: string;
  name?: string;
}

export const useAttendanceCalendar = (selectedFaceId: string | null) => {
  const { toast } = useToast();
  const { recentAttendance } = useAttendance();
  
  const [attendanceDays, setAttendanceDays] = useState<Date[]>([]);
  const [lateAttendanceDays, setLateAttendanceDays] = useState<Date[]>([]);
  const [absentDays, setAbsentDays] = useState<Date[]>([]);
  const [selectedFace, setSelectedFace] = useState<FaceInfo | null>(null);
  
  // Use current date as default selected date
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [loading, setLoading] = useState(false);
  const [dailyAttendance, setDailyAttendance] = useState<AttendanceRecord[]>([]);
  
  // Store attendance records with name and time info for calendar tooltips
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord[]>>({});
  
  // Generate working days for current month
  const currentDate = new Date();
  const [workingDays, setWorkingDays] = useState<Date[]>([]);

  // Process recent attendance data for the selected face
  useEffect(() => {
    if (selectedFaceId && recentAttendance.length > 0) {
      // Find records for the selected face
      const faceRecords = recentAttendance.filter(record => 
        record.user_id === selectedFaceId || record.id === selectedFaceId
      );
      
      if (faceRecords.length > 0) {
        // Extract attendance data
        const presentDates: Date[] = [];
        const lateDates: Date[] = [];
        const recordsByDate: Record<string, AttendanceRecord[]> = {};
        
        faceRecords.forEach(record => {
          const recordDate = new Date(record.timestamp);
          // Reset time part for accurate date comparison
          const dateWithoutTime = new Date(recordDate);
          dateWithoutTime.setHours(0, 0, 0, 0);
          
          // Format date as YYYY-MM-DD for key
          const dateKey = format(dateWithoutTime, 'yyyy-MM-dd');
          
          // Add record to recordsByDate
          if (!recordsByDate[dateKey]) {
            recordsByDate[dateKey] = [];
          }
          
          recordsByDate[dateKey].push({
            id: record.id,
            timestamp: record.timestamp,
            status: record.status,
            name: record.name
          });
          
          // Check if this date is already in our arrays
          const dateExists = 
            presentDates.some(d => d.getTime() === dateWithoutTime.getTime()) || 
            lateDates.some(d => d.getTime() === dateWithoutTime.getTime());
            
          if (!dateExists) {
            if (record.status === 'Present' || record.status.toLowerCase().includes('present')) {
              presentDates.push(dateWithoutTime);
            } else if (record.status === 'Late' || record.status.toLowerCase().includes('late')) {
              lateDates.push(dateWithoutTime);
            }
          }
        });
        
        // Update attendance records with name and time info
        setAttendanceRecords(recordsByDate);
        
        // Merge with existing dates to avoid clearing database-loaded records
        if (presentDates.length > 0) {
          setAttendanceDays(prev => {
            const combined = [...prev];
            presentDates.forEach(date => {
              if (!isDateInArray(date, combined)) {
                combined.push(date);
              }
            });
            return combined;
          });
        }
        
        if (lateDates.length > 0) {
          setLateAttendanceDays(prev => {
            const combined = [...prev];
            lateDates.forEach(date => {
              if (!isDateInArray(date, combined)) {
                combined.push(date);
              }
            });
            return combined;
          });
        }
        
        // If the selected date matches any recent records, update daily attendance
        if (selectedDate) {
          const selectedDateStart = new Date(selectedDate);
          selectedDateStart.setHours(0, 0, 0, 0);
          const selectedDateEnd = new Date(selectedDate);
          selectedDateEnd.setHours(23, 59, 59, 999);
          
          const recordsForSelectedDate = faceRecords.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= selectedDateStart && recordDate <= selectedDateEnd;
          });
          
          if (recordsForSelectedDate.length > 0) {
            setDailyAttendance(recordsForSelectedDate.map(record => ({
              id: record.id,
              timestamp: record.timestamp,
              status: record.status.toLowerCase(),
              name: record.name
            })));
          }
        }
      }
    }
  }, [selectedFaceId, recentAttendance, selectedDate]);

  // Subscribe to real-time updates and load initial data
  useEffect(() => {
    let attendanceChannel: any = null;

    if (selectedFaceId) {
      fetchFaceDetails(selectedFaceId);
      loadAttendanceRecords(selectedFaceId);
      
      // Generate working days for the current month
      setWorkingDays(generateWorkingDays(currentDate.getFullYear(), currentDate.getMonth()));

      attendanceChannel = supabase
        .channel(`attendance-calendar-${selectedFaceId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'attendance_records'
          }, 
          (payload) => {
            console.log('Real-time update received for attendance calendar:', payload);
            loadAttendanceRecords(selectedFaceId);
            if (selectedDate) {
              loadDailyAttendance(selectedFaceId, selectedDate);
            }
          }
        )
        .subscribe();

      console.log('Subscribed to real-time updates for attendance calendar');
    } else {
      setSelectedFace(null);
      setAttendanceDays([]);
      setLateAttendanceDays([]);
      setAbsentDays([]);
    }

    return () => {
      if (attendanceChannel) {
        supabase.removeChannel(attendanceChannel);
        console.log('Unsubscribed from attendance calendar updates');
      }
    };
  }, [selectedFaceId]);

  // Load daily attendance when selected date changes
  useEffect(() => {
    if (selectedFaceId && selectedDate) {
      loadDailyAttendance(selectedFaceId, selectedDate);
    } else {
      setDailyAttendance([]);
    }
  }, [selectedFaceId, selectedDate]);

  // Calculate absent days
  useEffect(() => {
    if (workingDays.length > 0 && (attendanceDays.length > 0 || lateAttendanceDays.length > 0)) {
      const today = new Date();
      const absent = workingDays.filter(workDay => {
        // Only consider days up to today for absences
        if (workDay > today) return false;
        
        return !isDateInArray(workDay, attendanceDays) && !isDateInArray(workDay, lateAttendanceDays);
      });
      
      setAbsentDays(absent);
    }
  }, [workingDays, attendanceDays, lateAttendanceDays]);

  // Fetch face details
  const fetchFaceDetails = async (faceId: string) => {
    try {
      const faceInfo = await fetchSelectedFace(faceId);
      setSelectedFace(faceInfo);
    } catch (error) {
      console.error('Error fetching face details:', error);
      toast({
        title: "Error",
        description: "Failed to load face details",
        variant: "destructive"
      });
    }
  };

  // Load attendance records
  const loadAttendanceRecords = async (faceId: string) => {
    try {
      setLoading(true);
      await fetchAttendanceRecords(faceId, setAttendanceDays, setLateAttendanceDays);
      
      // Load more detailed attendance info with names
      const { data: records } = await supabase
        .from('attendance_records')
        .select('id, timestamp, status, device_info')
        .or(`user_id.eq.${faceId},id.eq.${faceId}`)
        .order('timestamp', { ascending: false });
        
      if (records && records.length > 0) {
        const recordsByDate: Record<string, AttendanceRecord[]> = {};
        
        // Process records to extract name info
        for (const record of records) {
          let name = 'User';
          
          // Try to extract name from device_info
          if (record.device_info) {
            try {
              const deviceInfo = typeof record.device_info === 'string' 
                ? JSON.parse(record.device_info) 
                : record.device_info;
              
              if (deviceInfo.metadata && deviceInfo.metadata.name) {
                name = deviceInfo.metadata.name;
              } else if (deviceInfo.name) {
                name = deviceInfo.name;
              }
            } catch (e) {
              console.error('Error parsing device_info:', e);
            }
          }
          
          const recordDate = new Date(record.timestamp);
          // Format date as YYYY-MM-DD for key
          const dateKey = format(recordDate, 'yyyy-MM-dd');
          
          if (!recordsByDate[dateKey]) {
            recordsByDate[dateKey] = [];
          }
          
          recordsByDate[dateKey].push({
            id: record.id,
            timestamp: record.timestamp,
            status: typeof record.status === 'string' ? record.status.toLowerCase() : 'unknown',
            name
          });
        }
        
        setAttendanceRecords(recordsByDate);
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load daily attendance with name information
  const loadDailyAttendance = async (faceId: string, date: Date) => {
    try {
      // Use the existing fetchDailyAttendance
      await fetchDailyAttendance(faceId, date, (records) => {
        // Enhance records with name if possible
        const enhancedRecords = records.map(record => {
          // Try to find name from attendanceRecords
          const dateKey = format(new Date(record.timestamp), 'yyyy-MM-dd');
          const matchingRecords = attendanceRecords[dateKey] || [];
          const matchingRecord = matchingRecords.find(r => r.id === record.id);
          
          return {
            ...record,
            name: matchingRecord?.name || selectedFace?.name || 'User'
          };
        });
        
        setDailyAttendance(enhancedRecords);
      });
    } catch (error) {
      console.error('Error loading daily attendance:', error);
      toast({
        title: "Error",
        description: "Failed to load daily attendance details",
        variant: "destructive"
      });
    }
  };

  // Subscribe to real-time updates and load initial data
  useEffect(() => {
    let attendanceChannel: any = null;

    if (selectedFaceId) {
      fetchFaceDetails(selectedFaceId);
      loadAttendanceRecords(selectedFaceId);
      
      // Generate working days for the current month
      setWorkingDays(generateWorkingDays(currentDate.getFullYear(), currentDate.getMonth()));

      attendanceChannel = supabase
        .channel(`attendance-calendar-${selectedFaceId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'attendance_records'
          }, 
          (payload) => {
            console.log('Real-time update received for attendance calendar:', payload);
            loadAttendanceRecords(selectedFaceId);
            if (selectedDate) {
              loadDailyAttendance(selectedFaceId, selectedDate);
            }
          }
        )
        .subscribe();

      console.log('Subscribed to real-time updates for attendance calendar');
    } else {
      setSelectedFace(null);
      setAttendanceDays([]);
      setLateAttendanceDays([]);
      setAbsentDays([]);
      setAttendanceRecords({});
    }

    return () => {
      if (attendanceChannel) {
        supabase.removeChannel(attendanceChannel);
        console.log('Unsubscribed from attendance calendar updates');
      }
    };
  }, [selectedFaceId]);

  return {
    attendanceDays,
    lateAttendanceDays,
    absentDays,
    selectedFace,
    selectedDate,
    setSelectedDate,
    loading,
    dailyAttendance,
    workingDays,
    isDateInArray,
    attendanceRecords
  };
};
