
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FaceInfo {
  name: string;
  employee_id: string;
  department: string;
  position: string;
}

// Function to check if a date exists in an array of dates
export const isDateInArray = (date: Date, dateArray: Date[]): boolean => {
  return dateArray.some(d => 
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
};

// Generate working days for a specific month
export const generateWorkingDays = (year: number, month: number): Date[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days: Date[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      days.push(date);
    }
  }
  
  return days;
};

// Fetch face details from Supabase
export const fetchSelectedFace = async (faceId: string): Promise<FaceInfo> => {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('device_info, user_id')
      .eq('id', faceId)
      .single();
        
    if (error) {
      console.error('Error fetching face details from attendance_records:', error);
      
      const { data: userData, error: userError } = await supabase
        .from('attendance_records')
        .select('device_info')
        .eq('user_id', faceId)
        .single();
        
      if (userError) {
        console.error('Error fetching face details by user_id:', userError);
        
        return {
          name: 'Unknown Student',
          employee_id: faceId,
          department: 'N/A',
          position: 'Student'
        };
      }
      
      if (userData) {
        const deviceInfo = userData.device_info as any;
        if (deviceInfo && typeof deviceInfo === 'object' && !Array.isArray(deviceInfo)) {
          const metadata = deviceInfo.metadata && typeof deviceInfo.metadata === 'object' && !Array.isArray(deviceInfo.metadata) 
            ? deviceInfo.metadata 
            : {};
          
          return {
            name: metadata.name || 'Unknown Student',
            employee_id: metadata.employee_id || faceId,
            department: metadata.department || 'N/A',
            position: metadata.position || 'Student',
          };
        }
      }
      
      return {
        name: 'Unknown Student',
        employee_id: faceId,
        department: 'N/A',
        position: 'Student'
      };
    }

    if (data) {
      const deviceInfo = data.device_info as any;
      if (deviceInfo && typeof deviceInfo === 'object' && !Array.isArray(deviceInfo)) {
        const metadata = deviceInfo.metadata && typeof deviceInfo.metadata === 'object' && !Array.isArray(deviceInfo.metadata) 
          ? deviceInfo.metadata 
          : {};
        
        return {
          name: metadata.name || 'Unknown Student',
          employee_id: metadata.employee_id || data.user_id || faceId,
          department: metadata.department || 'N/A',
          position: metadata.position || 'Student',
        };
      }
      
      return {
        name: 'Unknown Student',
        employee_id: data.user_id || faceId,
        department: 'N/A',
        position: 'Student'
      };
    }
    
    return {
      name: 'Unknown Student',
      employee_id: faceId,
      department: 'N/A',
      position: 'Student'
    };
  } catch (error) {
    console.error('Error fetching face details:', error);
    
    return {
      name: 'Unknown Student',
      employee_id: faceId,
      department: 'N/A',
      position: 'Student'
    };
  }
};

// Fetch attendance records from Supabase
export const fetchAttendanceRecords = async (
  faceId: string,
  setAttendanceDays: (days: Date[]) => void,
  setLateAttendanceDays: (days: Date[]) => void
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
  setDailyAttendance: (records: {id: string; timestamp: string; status: string}[]) => void
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
