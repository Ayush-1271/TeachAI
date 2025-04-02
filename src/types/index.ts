
export interface User {
  id: string;
  email: string;
  name: string;
  role: "teacher" | "student";
  faceImage?: string; // URL or base64 string for student face image
  studentId?: string;
  teacherId?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  status: "present" | "absent";
  gpsDistance?: number;
  attemptedFromOutside: boolean;
  sessionCode: string;
}

export interface Session {
  id: string;
  code: string;
  teacherId: string;
  className: string;
  startTime: string;
  endTime: string;
  date: string;
  allowedDistance: number;
  latitude: number;
  longitude: number;
  active: boolean;
}
