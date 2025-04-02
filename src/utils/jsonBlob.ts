const BASE_URL = "https://jsonblob.com/api/jsonBlob";

export const createBlob = async (data: any): Promise<string> => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create JSONBlob");
  return response.headers.get("Location")!;
};

export const getBlob = async (blobId: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/${blobId}`);
  if (!response.ok) throw new Error("Failed to fetch JSONBlob");
  const data = await response.json();

  // Clean the data by removing null entries
  const cleanedData = {
    ...data,
    attendanceRecords: Array.isArray(data.attendanceRecords)
      ? data.attendanceRecords.filter((record) => record !== null)
      : [],
    sessions: Array.isArray(data.sessions)
      ? data.sessions.filter((session) => session !== null)
      : [],
    users: Array.isArray(data.users)
      ? data.users.filter((user) => user !== null)
      : [],
  };

  return cleanedData;
};

export const updateBlob = async (blobId: string, newData: any): Promise<void> => {
  try {
    // Fetch the existing blob data
    const existingData = await getBlob(blobId);

    // Merge and deduplicate users
    const updatedUsers = Array.isArray(existingData.users)
      ? [
          ...existingData.users.filter(
            (existingUser: any) =>
              !newData.users?.some((newUser: any) => newUser.id === existingUser.id)
          ),
          ...(newData.users || []),
        ]
      : newData.users || [];

    // Merge and deduplicate sessions
    const updatedSessions = Array.isArray(existingData.sessions)
      ? [
          ...existingData.sessions.filter(
            (existingSession: any) =>
              !newData.sessions?.some((newSession: any) => newSession.id === existingSession.id)
          ),
          ...(newData.sessions || []),
        ]
      : newData.sessions || [];

    // Merge and deduplicate attendance records
    const updatedAttendanceRecords = Array.isArray(existingData.attendanceRecords)
      ? [
          ...existingData.attendanceRecords.filter(
            (existingRecord: any) =>
              !newData.attendanceRecords?.some((newRecord: any) => newRecord.id === existingRecord.id)
          ),
          ...(newData.attendanceRecords || []),
        ]
      : newData.attendanceRecords || [];

    // Prepare the final updated data
    const updatedData = {
      ...existingData,
      users: updatedUsers,
      sessions: updatedSessions,
      attendanceRecords: updatedAttendanceRecords,
    };

    // Send the updated data to the JSONBlob
    const response = await fetch(`${BASE_URL}/${blobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) throw new Error("Failed to update JSONBlob");
  } catch (error) {
    console.error("Error updating JSONBlob:", error);
    throw error;
  }
};
