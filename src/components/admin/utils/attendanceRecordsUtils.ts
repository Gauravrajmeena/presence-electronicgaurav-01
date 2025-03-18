
import { supabase } from '@/integrations/supabase/client';
import { SetDatesFunction, AttendanceRecord } from './types';

// Fetch attendance records from Supabase
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
    
    // Filter for 'present' status records
    const presentRecords = allRecords.filter(record => 
      record.status === 'present' || record.status === 'Present'
    );
    
    // Filter for 'late' status records
    const lateRecords = allRecords.filter(record => 
      record.status === 'late' || record.status === 'Late'
    );
    
    console.log('Present records:', presentRecords.length);
    console.log('Late records:', lateRecords.length);
    
    if (presentRecords.length > 0) {
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

// Fetch daily attendance for a specific date
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
    
    // First try to fetch records where id equals faceId
    let { data: recordsById, error: errorById } = await supabase
      .from('attendance_records')
      .select('id, timestamp, status')
      .eq('id', faceId)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())
      .order('timestamp', { ascending: true });
    
    // Then try to fetch records where user_id equals faceId
    let { data: recordsByUserId, error: errorByUserId } = await supabase
      .from('attendance_records')
      .select('id, timestamp, status')
      .eq('user_id', faceId)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())
      .order('timestamp', { ascending: true });
    
    // Combine the results
    let allRecords = [...(recordsById || []), ...(recordsByUserId || [])];
    
    if (allRecords.length > 0) {
      console.log('Daily attendance records found:', allRecords.length);
      // Normalize status field
      const normalizedRecords = allRecords.map(record => ({
        ...record,
        status: record.status.toLowerCase()
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
