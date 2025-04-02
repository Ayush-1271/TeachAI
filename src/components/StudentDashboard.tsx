import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { captureImage, compareFaces } from "@/utils/faceRecognition";
import { calculateDistance, correctDistance } from "@/utils/gps";
import { useToast } from "@/components/ui/use-toast";
import { getBlob, updateBlob } from "@/utils/jsonBlob";

const ATTENDANCE_BLOB_ID = "1356691772465668096"; // Replace with actual blob ID

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { markAttendance, sessions } = useAttendance();
  const { toast } = useToast();

  const [sessionCode, setSessionCode] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [sessionStatus, setSessionStatus] = useState("");
  const [location, setLocation] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        const data = await getBlob(ATTENDANCE_BLOB_ID);
        const records = data.attendanceRecords || [];
        if (user?.studentId) {
          setAttendanceRecords(records.filter((record: any) => record.studentId === user.studentId));
        }
      } catch (error) {
        console.error("Failed to fetch attendance records:", error);
        toast({
          title: "Error",
          description: "Failed to load attendance records.",
          variant: "destructive",
        });
      }
    };

    fetchAttendanceRecords();
  }, [user, toast]);

  const checkSessionStatus = (code: string) => {
    const session = sessions.find((s) => s.code === code);
    if (!session) return "Session not found";

    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    if (session.date !== currentDate) return "Session is on a different date";
    if (currentTime < session.startTime) return "Session has not started yet";
    if (currentTime > session.endTime) return "Session has ended";

    return "Session is active";
  };

  const handleSessionCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setSessionCode(code);
    setSessionStatus(checkSessionStatus(code));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          toast({
            title: "Location Retrieved",
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

  const handleCaptureAndProcess = async () => {
    try {
      if (!location) {
        toast({
          title: "Location Required",
          description: "Please retrieve your location before capturing the image.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);

      const session = sessions.find((s) => s.code === sessionCode);
      if (!session) {
        toast({
          title: "Session Not Found",
          description: "Please check the session code and try again.",
          variant: "destructive",
        });
        return;
      }

      let distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        session.latitude,
        session.longitude
      );

      // Apply correction to the distance if necessary
      distance = correctDistance(distance);

      if (distance > session.allowedDistance) {
        toast({
          title: "Out of Range",
          description: `You are ${distance.toFixed(2)} meters away from the classroom, which exceeds the allowed distance.`,
          variant: "destructive",
        });
        return;
      }

      const capturedImage = await captureImage();
      const faceMatched = await compareFaces(capturedImage, user?.faceImage || "");

      if (!faceMatched) {
        toast({
          title: "Face Not Recognized",
          description: "The captured image does not match your stored face. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const result = await markAttendance(
        sessionCode,
        faceMatched,
        distance,
        location.coords.latitude,
        location.coords.longitude
      );

      if (result.success && result.record) {
        const updatedRecords = [...attendanceRecords, result.record];
        setAttendanceRecords(updatedRecords);
        await updateBlob(ATTENDANCE_BLOB_ID, { attendanceRecords: updatedRecords });
      }

      toast({
        title: result.success ? "Attendance Marked" : "Attendance Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

      setSessionCode("");
      setSessionStatus("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during attendance marking.",
        variant: "destructive",
      });
    } finally {
      setIsCameraOpen(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl">Student Dashboard</h1>
        <div>
          <span className="mr-2">Welcome, {user?.name}</span>
          <button onClick={logout} className="px-2 py-1 border border-black">
            Logout
          </button>
        </div>
      </div>
      
      {/* Mark Attendance Section */}
      <div className="mb-6">
        <h2 className="text-lg mb-2">Mark Attendance</h2>
        
        {isCameraOpen ? (
          <div className="border border-black p-4">
            <div className="border border-black w-full h-48 flex items-center justify-center mb-4">
              <p>Camera Preview (simulated)</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleCaptureAndProcess}
                disabled={isProcessing}
                className="px-4 py-1 border border-black"
              >
                {isProcessing ? "Processing..." : "Capture & Submit"}
              </button>
              
              <button
                onClick={() => setIsCameraOpen(false)}
                disabled={isProcessing}
                className="px-4 py-1 border border-black"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-black p-4">
            <div className="mb-4">
              <label htmlFor="sessionCode" className="block mb-1">
                Session Code:
              </label>
              <input
                type="text"
                id="sessionCode"
                value={sessionCode}
                onChange={handleSessionCodeChange}
                placeholder="Enter the code provided by your teacher"
                className="w-full px-2 py-1 border border-black"
              />
              {sessionStatus && (
                <p className={`mt-1 text-sm ${sessionStatus === "Session is active" ? "text-green-600" : "text-red-600"}`}>
                  {sessionStatus}
                </p>
              )}
            </div>
            
            <button
              onClick={handleGetLocation}
              className="px-4 py-1 border border-black mb-4"
              disabled={!!location}
            >
              {location ? "Location Retrieved" : "Get Location"}
            </button>

            <button
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-1 border border-black"
              disabled={!location || sessionStatus !== "Session is active"}
            >
              Continue to Capture Image
            </button>
            
            <div className="mt-4 text-sm">
              <p>Note: You will need to:</p>
              <ol className="list-decimal ml-5">
                <li>Enable location services</li>
                <li>Allow camera access</li>
                <li>Be within the allowed distance of the classroom</li>
              </ol>
            </div>
          </div>
        )}
      </div>
      
      {/* Attendance History */}
      <div className="mb-6">
        <h2 className="text-lg mb-2">Attendance History</h2>
        
        {attendanceRecords.length > 0 ? (
          <div className="border border-black">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="border-b border-r border-black px-2 py-1 text-left">Date</th>
                  <th className="border-b border-r border-black px-2 py-1 text-left">Time</th>
                  <th className="border-b border-r border-black px-2 py-1 text-left">Session Code</th>
                  <th className="border-b border-r border-black px-2 py-1 text-left">Status</th>
                  <th className="border-b border-black px-2 py-1 text-left">Distance</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => {
                  // Validate record properties
                  const { date, time, sessionCode, status, gpsDistance, attemptedFromOutside } = record;

                  if (!date || !time || !sessionCode || !status) {
                    console.warn("Skipping invalid record:", record);
                    return null; // Skip invalid records
                  }

                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="border-r border-black px-2 py-1">{date}</td>
                      <td className="border-r border-black px-2 py-1">{time}</td>
                      <td className="border-r border-black px-2 py-1">{sessionCode}</td>
                      <td className="border-r border-black px-2 py-1">{status}</td>
                      <td className="px-2 py-1">
                        {gpsDistance !== undefined ? `${gpsDistance.toFixed(2)}m` : "N/A"}
                        {attemptedFromOutside && " (Outside allowed area)"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 border border-black">
            No attendance records found.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
