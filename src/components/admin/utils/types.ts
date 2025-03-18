
import { Dispatch, SetStateAction } from 'react';

export interface FaceInfo {
  name: string;
  employee_id: string;
  department: string;
  position: string;
}

export interface AttendanceRecord {
  id: string;
  timestamp: string;
  status: string;
}

export type SetDatesFunction = Dispatch<SetStateAction<Date[]>>;
