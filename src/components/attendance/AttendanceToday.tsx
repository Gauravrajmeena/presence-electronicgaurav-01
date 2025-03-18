
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const AttendanceToday = () => {
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentAttendance = async () => {
      // First, get attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          id,
          status,
          timestamp,
          confidence_score,
          user_id,
          device_info
        `)
        .order('timestamp', { ascending: false })
        .limit(10);
        
      if (attendanceError) {
        console.error('Error fetching recent attendance:', attendanceError);
        return;
      }
      
      if (attendanceData && attendanceData.length > 0) {
        // Process attendance data and fetch profile info if needed
        const processedData = await Promise.all(attendanceData.map(async (record) => {
          let username = 'Unknown';
          let photoUrl = '';
          
          // Try to extract name from device_info
          if (record.device_info) {
            try {
              const deviceInfo = typeof record.device_info === 'string' 
                ? JSON.parse(record.device_info) 
                : record.device_info;
              
              // First check if metadata.name exists
              if (deviceInfo.metadata && typeof deviceInfo.metadata === 'object') {
                username = deviceInfo.metadata.name || username;
                photoUrl = deviceInfo.metadata.firebase_image_url || photoUrl;
              } 
              // If no metadata.name, check if name exists directly in deviceInfo
              else if (deviceInfo.name) {
                username = deviceInfo.name;
              }
              
              // Look for photo URL
              if (!photoUrl && deviceInfo.firebase_image_url) {
                photoUrl = deviceInfo.firebase_image_url;
              }
            } catch (e) {
              console.error('Error parsing device_info:', e);
            }
          }
          
          // If we couldn't find name in device_info, try other sources
          if (username === 'Unknown') {
            // Try to get from attendance_records where it's a registration record
            try {
              if (record.user_id) {
                const { data: registrationData } = await supabase
                  .from('attendance_records')
                  .select('device_info')
                  .contains('device_info', { registration: true })
                  .eq('user_id', record.user_id)
                  .maybeSingle();
                  
                if (registrationData && registrationData.device_info) {
                  const regDeviceInfo = typeof registrationData.device_info === 'string'
                    ? JSON.parse(registrationData.device_info)
                    : registrationData.device_info;
                    
                  if (regDeviceInfo.metadata && regDeviceInfo.metadata.name) {
                    username = regDeviceInfo.metadata.name;
                    photoUrl = regDeviceInfo.metadata.firebase_image_url || photoUrl;
                  }
                }
              }
            
              // If still unknown, try the profiles table
              if (username === 'Unknown' && record.user_id) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('username, avatar_url')
                  .eq('id', record.user_id)
                  .maybeSingle();
                  
                if (profileData && profileData.username) {
                  username = profileData.username;
                  photoUrl = profileData.avatar_url || photoUrl;
                }
              }
            } catch (e) {
              console.error('Error fetching additional user data:', e);
            }
          }
          
          // If we still have no username but have an employee_id in device_info, try to look it up
          if (username === 'Unknown' && record.device_info) {
            try {
              const deviceInfo = typeof record.device_info === 'string'
                ? JSON.parse(record.device_info)
                : record.device_info;
                
              if (deviceInfo.metadata && deviceInfo.metadata.employee_id) {
                const employeeId = deviceInfo.metadata.employee_id;
                
                const { data: employeeData } = await supabase
                  .from('attendance_records')
                  .select('device_info')
                  .contains('device_info', { employee_id: employeeId, registration: true })
                  .maybeSingle();
                  
                if (employeeData && employeeData.device_info) {
                  const empDeviceInfo = typeof employeeData.device_info === 'string'
                    ? JSON.parse(employeeData.device_info)
                    : employeeData.device_info;
                    
                  if (empDeviceInfo.metadata && empDeviceInfo.metadata.name) {
                    username = empDeviceInfo.metadata.name;
                    photoUrl = empDeviceInfo.metadata.firebase_image_url || photoUrl;
                  }
                }
              }
            } catch (e) {
              console.error('Error fetching employee data by ID:', e);
            }
          }
          
          // Normalize status to ensure consistency
          let normalizedStatus = typeof record.status === 'string' 
            ? record.status.toLowerCase() 
            : 'unknown';
          
          // Map to proper display status
          let displayStatus = 'Unknown';
          if (normalizedStatus.includes('present') || normalizedStatus.includes('unauthorized')) {
            displayStatus = 'Present';
            // Ensure the record is actually stored as 'present' for calendar consistency
            if (normalizedStatus === 'unauthorized') {
              try {
                await supabase
                  .from('attendance_records')
                  .update({ status: 'present' })
                  .eq('id', record.id);
                console.log('Updated unauthorized record to present:', record.id);
              } catch (e) {
                console.error('Failed to update status:', e);
              }
            }
          } else if (normalizedStatus.includes('late')) {
            displayStatus = 'Late';
          } else if (normalizedStatus.includes('absent')) {
            displayStatus = 'Absent';
          }
          
          return {
            name: username,
            date: format(new Date(record.timestamp), 'MMM d, yyyy'),
            time: format(new Date(record.timestamp), 'h:mm a'),
            status: displayStatus,
            rawStatus: normalizedStatus, // Keep raw status for debugging
            confidence: record.confidence_score,
            id: record.id,
            user_id: record.user_id,
            photoUrl: photoUrl
          };
        }));
        
        setRecentAttendance(processedData);
      } else {
        setRecentAttendance([]);
      }
    };
    
    fetchRecentAttendance();
    
    const intervalId = setInterval(fetchRecentAttendance, 1000);
    
    const subscription = supabase
      .channel('attendance_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'attendance_records' 
      }, () => {
        fetchRecentAttendance();
      })
      .subscribe();
      
    return () => {
      clearInterval(intervalId);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Recent Records</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {recentAttendance.length > 0 ? (
          recentAttendance.map((record, index) => (
            <div 
              key={`${record.id || index}`} 
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border">
                  {record.photoUrl ? (
                    <AvatarImage src={record.photoUrl} alt={record.name} />
                  ) : (
                    <AvatarFallback className="bg-primary/10">
                      <span className="text-primary font-medium">{record.name.charAt(0)}</span>
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{record.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {record.date} • {record.time}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                record.status === 'Present' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' 
                  : record.status === 'Late'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
              }`}>
                {record.status}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No attendance records for today
          </div>
        )}
      </div>
    </Card>
  );
};

export default AttendanceToday;
