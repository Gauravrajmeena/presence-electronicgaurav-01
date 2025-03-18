
import { supabase } from '@/integrations/supabase/client';
import { SetDatesFunction, AttendanceRecord } from './types';

// Fetch attendance records from Supabase with improved status normalization
export const fetchAttendanceRecords = async (
  faceId: string,
  setAttendanceDays: SetDatesFunction,
  setLateAttendanceDays: SetDatesFunction
) => {
  try {
    console.log('Fetching attendance records for face ID:', faceId);
    
    // First try to fetch records where id equals faceId
    let { data: recordsById, error: errorById } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('id', faceId);
    
    // Then try to fetch records where user_id equals faceId
    let { data: recordsByUserId, error: errorByUserId } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', faceId);
    
    // Combine the results
    let allRecords = [...(recordsById || []), ...(recordsByUserId || [])];
    
    if (allRecords.length === 0) {
      console.log('No records found for face ID:', faceId);
      setAttendanceDays([]);
      setLateAttendanceDays([]);
      return;
    }
    
    console.log('Total records found:', allRecords.length);
    
    // Normalize all status values to lowercase for consistent processing
    allRecords = allRecords.map(record => ({
      ...record,
      status: typeof record.status === 'string' ? record.status.toLowerCase() : record.status
    }));
    
    // Filter records with normalized status check (includes present, Present)
    const presentRecords = allRecords.filter(record => 
      record.status === 'present' || 
      record.status === 'unauthorized' // Include unauthorized as present for backward compatibility
    );
    
    // Filter for 'late' status records (includes late, Late)
    const lateRecords = allRecords.filter(record => 
      record.status === 'late'
    );
    
    console.log('Present records:', presentRecords.length);
    console.log('Late records:', lateRecords.length);
    
    if (presentRecords.length > 0) {
      // Convert timestamps to Date objects for the calendar
      const days = presentRecords
        .map(record => record.timestamp ? new Date(record.timestamp) : null)
        .filter(date => date !== null) as Date[];
      
      console.log('Setting present days:', days.length);
      setAttendanceDays(days);
    } else {
      setAttendanceDays([]);
    }
    
    if (lateRecords.length > 0) {
      const lateDays = lateRecords
        .map(record => record.timestamp ? new Date(record.timestamp) : null)
        .filter(date => date !== null) as Date[];
      
      console.log('Setting late days:', lateDays.length);
      setLateAttendanceDays(lateDays);
    } else {
      setLateAttendanceDays([]);
    }
  } catch (error) {
    console.error('Error in fetchAttendanceRecords:', error);
    throw error;
  }
};

// Fetch daily attendance for a specific date with improved status normalization
export const fetchDailyAttendance = async (
  faceId: string, 
  date: Date,
  setDailyAttendance: (records: AttendanceRecord[]) => void
) => {
  try {
    console.log('Fetching daily attendance for date:', date);
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Use a more inclusive timestamp range query
    const timestampStart = startOfDay.toISOString();
    const timestampEnd = endOfDay.toISOString();
    
    console.log(`Querying from ${timestampStart} to ${timestampEnd}`);
    
    // First try to fetch records where id equals faceId
    let { data: recordsById, error: errorById } = await supabase
      .from('attendance_records')
      .select('id, timestamp, status')
      .eq('id', faceId)
      .gte('timestamp', timestampStart)
      .lte('timestamp', timestampEnd)
      .order('timestamp', { ascending: true });
    
    // Then try to fetch records where user_id equals faceId
    let { data: recordsByUserId, error: errorByUserId } = await supabase
      .from('attendance_records')
      .select('id, timestamp, status')
      .eq('user_id', faceId)
      .gte('timestamp', timestampStart)
      .lte('timestamp', timestampEnd)
      .order('timestamp', { ascending: true });
    
    // Combine the results
    let allRecords = [...(recordsById || []), ...(recordsByUserId || [])];
    
    if (allRecords.length > 0) {
      console.log('Daily attendance records found:', allRecords.length);
      // Normalize status field for consistent processing
      const normalizedRecords = allRecords.map(record => ({
        ...record,
        status: typeof record.status === 'string' ? 
          record.status.toLowerCase() === 'unauthorized' ? 'present' : record.status.toLowerCase() 
          : 'unknown'
      }));
      setDailyAttendance(normalizedRecords);
    } else {
      setDailyAttendance([]);
    }
  } catch (error) {
    console.error('Error in fetchDailyAttendance:', error);
    throw error;
  }
};
