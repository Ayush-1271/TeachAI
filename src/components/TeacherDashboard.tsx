import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { Session } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { getBlob, updateBlob } from "@/utils/jsonBlob";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInterval } from "../hooks/use-interval"; // Custom hook for polling

const SESSION_BLOB_ID = "1356691772465668096"; // Replace with actual blob ID
const ATTENDANCE_BLOB_ID = "1356691772465668096"; // Replace with actual blob ID
const POLLING_INTERVAL = 5000; // Poll every 5 seconds

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const { 
    createSession, 
    getSessionAttendance, 
    exportAttendance,
    manuallyUpdateAttendance,
    getPreviousSessions
  } = useAttendance();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [previousSessions, setPreviousSessions] = useState<Session[]>([]);

  // Form states for creating a session
  const [sessionName, setSessionName] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allowedDistance, setAllowedDistance] = useState(50);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [viewMode, setViewMode] = useState<"current" | "previous">("current");

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSessionDate(today);
    
    // Load previous sessions
    const prevSessions = getPreviousSessions();
    setPreviousSessions(prevSessions);
  }, [getPreviousSessions]);

  // Load attendance records when selected session changes
  useEffect(() => {
    if (selectedSessionId) {
      const records = getSessionAttendance(selectedSessionId);
      setAttendanceRecords(records);
    } else {
      setAttendanceRecords([]);
    }
  }, [selectedSessionId, getSessionAttendance]);

  // Fetch session and attendance data from JSONBlob storage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionData = await getBlob(SESSION_BLOB_ID);
        const attendanceData = await getBlob(ATTENDANCE_BLOB_ID);
        setSessions(sessionData.sessions || []);
        setAttendanceRecords(attendanceData.attendanceRecords || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load session or attendance data.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [toast]);

  // Polling to fetch updated attendance records
  useInterval(() => {
    if (selectedSessionId) {
      const fetchUpdatedAttendance = async () => {
        try {
          const updatedData = await getBlob(ATTENDANCE_BLOB_ID);
          const updatedRecords = updatedData.attendanceRecords || [];
          const session = sessions.find((s) => s.id === selectedSessionId);
          if (session) {
            const sessionRecords = updatedRecords.filter(
              (record: any) => record.sessionCode === session.code
            );
            setAttendanceRecords(sessionRecords);
          }
        } catch (error) {
          console.error("Failed to fetch updated attendance records:", error);
        }
      };
      fetchUpdatedAttendance();
    }
  }, POLLING_INTERVAL);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          toast({
            title: "Location Set",
            description: `Latitude: ${position.coords.latitude.toFixed(6)}, Longitude: ${position.coords.longitude.toFixed(6)}`,
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: error.message,
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation",
        variant: "destructive",
      });
    }
  };

  // Create a new session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Generate a random 6-character session code
      const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const newSession = await createSession({
        code: sessionCode,
        className: sessionName,
        date: sessionDate,
        startTime,
        endTime,
        allowedDistance,
        latitude,
        longitude,
        active: true,
      });

      // Update the local sessions state immediately
      setSessions((prev) => [...prev, newSession]);

      // Reset form
      setSessionName("");
      setStartTime("");
      setEndTime("");
      setIsCreatingSession(false);

      toast({
        title: "Session Created",
        description: `Session code: ${sessionCode}`,
      });
    } catch (error) {
      toast({
        title: "Error Creating Session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Export attendance for selected session
  const handleExportAttendance = () => {
    if (selectedSessionId) {
      exportAttendance(selectedSessionId);
    }
  };

  // Update student attendance status
  const handleUpdateAttendanceStatus = (recordId: string, newStatus: "present" | "absent") => {
    try {
      manuallyUpdateAttendance(recordId, newStatus);
      
      // Refresh the attendance records
      if (selectedSessionId) {
        const records = getSessionAttendance(selectedSessionId);
        setAttendanceRecords(records);
      }
      
      toast({
        title: "Attendance Updated",
        description: `Attendance status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error Updating Attendance",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Toggle session creation form
  const toggleSessionForm = () => {
    setIsCreatingSession(!isCreatingSession);
    if (!isCreatingSession) {
      // Set default date and times if starting form
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      setSessionDate(today);
      
      const currentTime = now.toTimeString().slice(0, 5);
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000).toTimeString().slice(0, 5);
      
      setStartTime(currentTime);
      setEndTime(thirtyMinutesLater);
    }
  };

  // Toggle between current and previous sessions
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === "current" ? "previous" : "current");
    setSelectedSessionId(null); // Reset selected session when switching views
  };

  // Get the sessions to display based on the current view
  const displaySessions = viewMode === "current" ? sessions : previousSessions;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl">Teacher Dashboard</h1>
        <div>
          <span className="mr-2">Welcome, {user?.name}</span>
          <button onClick={logout} className="px-2 py-1 border border-black">
            Logout
          </button>
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="flex justify-center mb-4">
        <div className="border border-black inline-flex">
          <button 
            onClick={() => setViewMode("current")}
            className={`px-4 py-2 ${viewMode === "current" ? "bg-gray-200" : ""}`}
          >
            Current Sessions
          </button>
          <button 
            onClick={() => setViewMode("previous")}
            className={`px-4 py-2 ${viewMode === "previous" ? "bg-gray-200" : ""}`}
          >
            Previous Sessions
          </button>
        </div>
      </div>
      
      {/* Session Management */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg">{viewMode === "current" ? "Current Sessions" : "Previous Sessions"}</h2>
          {viewMode === "current" && (
            <button 
              onClick={toggleSessionForm}
              className="px-2 py-1 border border-black"
            >
              {isCreatingSession ? "Cancel" : "Create New Session"}
            </button>
          )}
        </div>
        
        {isCreatingSession && viewMode === "current" && (
          <form onSubmit={handleCreateSession} className="border border-black p-4 mb-4">
            <h3 className="mb-2">Create New Session</h3>
            
            <div className="mb-2">
              <label htmlFor="sessionName" className="block mb-1">
                Class/Session Name:
              </label>
              <input
                type="text"
                id="sessionName"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
                className="w-full px-2 py-1 border border-black"
              />
            </div>
            
            <div className="mb-2">
              <label htmlFor="sessionDate" className="block mb-1">
                Date:
              </label>
              <input
                type="date"
                id="sessionDate"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full px-2 py-1 border border-black"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label htmlFor="startTime" className="block mb-1">
                  Start Time:
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-2 py-1 border border-black"
                />
              </div>
              
              <div>
                <label htmlFor="endTime" className="block mb-1">
                  End Time:
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-2 py-1 border border-black"
                />
              </div>
            </div>
            
            <div className="mb-2">
              <label htmlFor="allowedDistance" className="block mb-1">
                Allowed Distance (meters):
              </label>
              <input
                type="number"
                id="allowedDistance"
                value={allowedDistance}
                onChange={(e) => setAllowedDistance(Number(e.target.value))}
                min="1"
                required
                className="w-full px-2 py-1 border border-black"
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1">Classroom Location:</label>
              <div className="flex items-center">
                <div className="flex-1 mr-2">
                  <label className="text-sm">Latitude: {latitude.toFixed(6)}</label>
                </div>
                <div className="flex-1 mr-2">
                  <label className="text-sm">Longitude: {longitude.toFixed(6)}</label>
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-2 py-1 border border-black"
                >
                  Get Current Location
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="px-4 py-1 border border-black"
            >
              Create Session
            </button>
          </form>
        )}
        
        {displaySessions.length > 0 ? (
          <div className="border border-black">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-b border-r border-black px-2 py-1 text-left">Name</TableHead>
                  <TableHead className="border-b border-r border-black px-2 py-1 text-left">Date</TableHead>
                  <TableHead className="border-b border-r border-black px-2 py-1 text-left">Time</TableHead>
                  <TableHead className="border-b border-r border-black px-2 py-1 text-left">Code</TableHead>
                  <TableHead className="border-b border-r border-black px-2 py-1 text-left">Status</TableHead>
                  <TableHead className="border-b border-black px-2 py-1 text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displaySessions.map((session: Session) => (
                  <TableRow key={session.id} className="hover:bg-gray-50">
                    <TableCell className="border-r border-black px-2 py-1">{session.className}</TableCell>
                    <TableCell className="border-r border-black px-2 py-1">{session.date}</TableCell>
                    <TableCell className="border-r border-black px-2 py-1">{`${session.startTime} - ${session.endTime}`}</TableCell>
                    <TableCell className="border-r border-black px-2 py-1">{session.code}</TableCell>
                    <TableCell className="border-r border-black px-2 py-1">{session.active ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="px-2 py-1">
                      <button
                        onClick={() => setSelectedSessionId(session.id)}
                        className="px-2 py-0.5 border border-black mr-1"
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4 border border-black">
            No {viewMode === "current" ? "active" : "previous"} sessions found.
          </div>
        )}
      </div>
      
      {/* Attendance Records */}
      {selectedSessionId && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg">Attendance Records</h2>
            <button
              onClick={handleExportAttendance}
              className="px-2 py-1 border border-black"
              disabled={attendanceRecords.length === 0}
            >
              Export to CSV
            </button>
          </div>
          
          {attendanceRecords.length > 0 ? (
            <div className="border border-black">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="border-b border-r border-black px-2 py-1 text-left">Student ID</TableHead>
                    <TableHead className="border-b border-r border-black px-2 py-1 text-left">Name</TableHead>
                    <TableHead className="border-b border-r border-black px-2 py-1 text-left">Date</TableHead>
                    <TableHead className="border-b border-r border-black px-2 py-1 text-left">Time</TableHead>
                    <TableHead className="border-b border-r border-black px-2 py-1 text-left">Status</TableHead>
                    <TableHead className="border-b border-r border-black px-2 py-1 text-left">GPS Distance</TableHead>
                    <TableHead className="border-b border-black px-2 py-1 text-left">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => {
                    // Validate record properties
                    if (!record || !record.studentId || !record.studentName || !record.date || !record.time || !record.status) {
                      console.warn("Skipping invalid record:", record);
                      return null; // Skip invalid records
                    }

                    return (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="border-r border-black px-2 py-1">{record.studentId}</TableCell>
                        <TableCell className="border-r border-black px-2 py-1">{record.studentName}</TableCell>
                        <TableCell className="border-r border-black px-2 py-1">{record.date}</TableCell>
                        <TableCell className="border-r border-black px-2 py-1">{record.time}</TableCell>
                        <TableCell className="border-r border-black px-2 py-1">{record.status}</TableCell>
                        <TableCell className="border-r border-black px-2 py-1">
                          {record.gpsDistance !== undefined ? `${Math.round(record.gpsDistance)}m` : "N/A"}
                          {record.attemptedFromOutside && " (Outside)"}
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          <button
                            onClick={() => handleUpdateAttendanceStatus(
                              record.id, 
                              record.status === 'present' ? 'absent' : 'present'
                            )}
                            className="px-2 py-0.5 border border-black"
                          >
                            Mark {record.status === 'present' ? 'Absent' : 'Present'}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 border border-black">
              No attendance records for this session.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
