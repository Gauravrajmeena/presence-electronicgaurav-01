import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const AttendanceToday = () => {
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentAttendance = async () => {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          id,
          status,
          timestamp,
          confidence_score,
          user_id,
          device_info,
          profiles (
            username,
            avatar_url
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(10);
        
      if (attendanceError) {
        console.error('Error fetching recent attendance:', attendanceError);
        return;
      }
      
      if (attendanceData && attendanceData.length > 0) {
        const enrichedData = attendanceData.map((record) => {
          let username = 'Unknown';
          let photoUrl = '';
          
          // Try to get name and photo from device_info first
          if (record.device_info) {
            try {
              const deviceInfo = typeof record.device_info === 'string' 
                ? JSON.parse(record.device_info) 
                : record.device_info;
              
              if (deviceInfo.metadata?.name) {
                username = deviceInfo.metadata.name;
              } else if (deviceInfo.name) {
                username = deviceInfo.name;
              }
              
              // Get photo URL from Supabase storage if available
              if (deviceInfo.metadata?.supabase_image_url) {
                photoUrl = deviceInfo.metadata.supabase_image_url;
              } else if (deviceInfo.supabase_image_url) {
                photoUrl = deviceInfo.supabase_image_url;
              }
            } catch (e) {
              console.error('Error parsing device_info:', e);
            }
          }
          
          // If no name found in device_info, use profile data
          if (username === 'Unknown' && record.profiles?.username) {
            username = record.profiles.username;
          }
          
          // If no photo found in device_info, use profile avatar
          if (!photoUrl && record.profiles?.avatar_url) {
            photoUrl = record.profiles.avatar_url;
          }
          
          return {
            name: username,
            date: format(new Date(record.timestamp), 'MMM d, yyyy'),
            time: format(new Date(record.timestamp), 'h:mm a'),
            status: record.status === 'present' ? 'Present' : 'Unauthorized',
            confidence: record.confidence_score,
            id: record.id,
            photoUrl: photoUrl
          };
        });
        
        setRecentAttendance(enrichedData);
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
