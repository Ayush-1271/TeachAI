import React, { createContext, useContext, useState, useEffect } from "react";
import { AttendanceRecord, Session } from "@/types";
import { useAuth } from "./AuthContext";
import { getBlob, updateBlob } from "@/utils/jsonBlob";

const SESSION_BLOB_ID = "1356691772465668096"; // Updated with the actual blob ID
const ATTENDANCE_BLOB_ID = "1356691772465668096"; // Updated with the actual blob ID

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  sessions: Session[];
  createSession: (session: Omit<Session, "id" | "teacherId">) => Promise<Session>;
  markAttendance: (
    sessionCode: string,
    faceMatched: boolean,
    gpsDistance: number,
    latitude: number,
    longitude: number
  ) => Promise<{ success: boolean; message: string; record?: AttendanceRecord }>;
  getStudentAttendance: (studentId: string) => AttendanceRecord[];
  getSessionAttendance: (sessionId: string) => AttendanceRecord[];
  exportAttendance: (sessionId: string) => void;
  manuallyUpdateAttendance: (recordId: string, status: "present" | "absent") => void;
  getActiveSession: () => Session | undefined;
  getPreviousSessions: () => Session[];
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Load saved data from JSONBlob on initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getBlob(SESSION_BLOB_ID); // Fetch the entire JSONBlob
        const sessions = data.sessions || []; // Ensure sessions is an array
        const attendance = data.attendanceRecords || []; // Ensure attendanceRecords is an array
        setSessions(sessions);
        setAttendanceRecords(attendance);
      } catch (error) {
        console.error("Failed to load data from JSONBlob:", error);
        setSessions([]); // Fallback to empty array
        setAttendanceRecords([]); // Fallback to empty array
      }
    };
    loadData();
  }, []);

  // Create a new session (for teachers)
  const createSession = async (sessionData: Omit<Session, "id" | "teacherId">): Promise<Session> => {
    if (user?.role !== "teacher") {
      throw new Error("Only teachers can create sessions");
    }

    const newSession: Session = {
      ...sessionData,
      id: `session_${Date.now()}`,
      teacherId: user.id,
    };

    setSessions((prev) => [...prev, newSession]);

    try {
      const data = await getBlob(SESSION_BLOB_ID); // Fetch the entire JSONBlob
      const updatedData = {
        ...data,
        sessions: [...(data.sessions || []), newSession], // Merge new session with existing sessions
      };
      await updateBlob(SESSION_BLOB_ID, updatedData); // Update the JSONBlob with merged data
    } catch (error) {
      console.error("Failed to update JSONBlob with new session:", error);
    }

    return newSession; // Return the newly created session
  };

  // Check if a session is currently active based on date and time
  const isSessionActive = (session: Session): boolean => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Only check time if the date matches
    if (session.date === currentDate) {
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      // Check if current time is within session time range
      return currentTime >= session.startTime && currentTime <= session.endTime;
    }
    
    return false;
  };

  // Get previous/inactive sessions
  const getPreviousSessions = (): Session[] => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    return sessions.filter(session => {
      // Session is from a past date
      if (session.date < currentDate) {
        return true;
      }
      
      // Session is from today but ended already
      if (session.date === currentDate && session.endTime < now.toTimeString().slice(0, 5)) {
        return true;
      }
      
      return false;
    });
  };

  // Mark attendance for a student
  const markAttendance = async (
    sessionCode: string, 
    faceMatched: boolean,
    gpsDistance: number,
    latitude: number,
    longitude: number
  ): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> => {
    if (user?.role !== "student" || !user.studentId) {
      return { success: false, message: "You must be logged in as a student to mark attendance" };
    }

    // Find the session
    const session = sessions.find(s => s.code === sessionCode);
    if (!session) {
      return { success: false, message: "Invalid session code" };
    }

    // Check if session is active based on current time
    if (!isSessionActive(session)) {
      return { success: false, message: "Attendance window is closed or not yet open" };
    }

    // Check face recognition and GPS
    const attemptedFromOutside = gpsDistance > session.allowedDistance;
    const status = faceMatched && !attemptedFromOutside ? "present" : "absent";
    
    const reason = !faceMatched 
      ? "Face recognition failed" 
      : attemptedFromOutside 
        ? `You are too far from the classroom (${Math.round(gpsDistance)}m away)` 
        : "";

    // Create attendance record
    const newRecord: AttendanceRecord = {
      id: `attendance_${Date.now()}`,
      studentId: user.studentId,
      studentName: user.name,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      status,
      gpsDistance,
      attemptedFromOutside,
      sessionCode,
    };

    setAttendanceRecords(prev => [...prev, newRecord]);
    await updateBlob(ATTENDANCE_BLOB_ID, [...attendanceRecords, newRecord]);

    if (status === "present") {
      return { success: true, message: "Attendance marked as present", record: newRecord };
    } else {
      return { 
        success: false, 
        message: `Marked as absent. Reason: ${reason}`,
        record: newRecord
      };
    }
  };

  // Get attendance records for a specific student
  const getStudentAttendance = (studentId: string) => {
    return Array.isArray(attendanceRecords)
      ? attendanceRecords.filter(record => record.studentId === studentId)
      : [];
  };

  // Get attendance records for a specific session
  const getSessionAttendance = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return [];
    
    return attendanceRecords.filter(record => record.sessionCode === session.code);
  };

  // Export attendance to CSV (simulated)
  const exportAttendance = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const records = attendanceRecords.filter(record => record.sessionCode === session.code);
    
    // Simple CSV generation
    const headers = ["Student ID", "Student Name", "Date", "Time", "Status", "GPS Distance", "Attempted From Outside"];
    const csvContent = [
      headers.join(","),
      ...records.map(record => [
        record.studentId,
        record.studentName,
        record.date,
        record.time,
        record.status,
        record.gpsDistance || "N/A",
        record.attemptedFromOutside ? "Yes" : "No"
      ].join(","))
    ].join("\n");
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${session.code}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manually update attendance (for teachers)
  const manuallyUpdateAttendance = (recordId: string, status: "present" | "absent") => {
    if (user?.role !== "teacher") {
      throw new Error("Only teachers can update attendance");
    }
    
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.id === recordId 
          ? { ...record, status } 
          : record
      )
    );
  };

  // Get active session
  const getActiveSession = () => {
    return sessions.find(session => isSessionActive(session));
  };

  return (
    <AttendanceContext.Provider 
      value={{ 
        attendanceRecords, 
        sessions, 
        createSession, 
        markAttendance, 
        getStudentAttendance, 
        getSessionAttendance, 
        exportAttendance,
        manuallyUpdateAttendance,
        getActiveSession,
        getPreviousSessions
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};
