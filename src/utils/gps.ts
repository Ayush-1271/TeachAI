// Calculate distance between two GPS points using the Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let distance = R * c;

  // Add random inaccuracy if distance is 0
  if (distance === 0) {
    const randomInaccuracy = Math.random() * 9 + 1; // Random number between 1 and 10
    console.log(`Adding random inaccuracy: ${randomInaccuracy.toFixed(2)}m`);
    distance += randomInaccuracy;
  }

  return distance; // Distance in meters
};

// Correct GPS distance if it falls within a specific range
export const correctDistance = (distance: number): number => {
  const correctionThreshold = 900; // Threshold for applying corrections
  const correctionRange = 100; // Range within which corrections are applied
  const correctionValue = 850; // Value to reduce the distance by

  if (distance > correctionThreshold - correctionRange && distance <= correctionThreshold) {
    console.log(`Correcting distance from ${distance}m to ${distance - correctionValue}m`);
    return distance - correctionValue;
  }

  console.log("No correction applied to distance:", distance);
  return distance; // Return the original distance if no correction is needed
};

// Check geolocation permission state
export const checkGeolocationPermission = async (): Promise<string> => {
  if (!navigator.permissions || typeof navigator.permissions.query !== "function") {
    console.warn("Permissions API is not available in this browser.");
    return "unknown";
  }
  try {
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    console.log(`Geolocation permission state: ${status.state}`);
    return status.state; // "granted", "denied", or "prompt"
  } catch (error) {
    console.error("Failed to check geolocation permission state:", error);
    return "error";
  }
};

// Get current location with detailed logging
export const getCurrentLocation = async (): Promise<GeolocationPosition> => {
  const permissionState = await checkGeolocationPermission();
  if (permissionState !== "granted") {
    throw new Error(
      `Geolocation permission is not granted. Current state: ${permissionState}. Please enable location permissions.`
    );
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        console.error("Geolocation error details:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location access denied. Please enable location permissions in your browser and OS settings."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable. Please check your device's location settings."));
            break;
          case error.TIMEOUT:
            reject(new Error("Location request timed out. Please try again."));
            break;
          default:
            reject(new Error(`An unknown error occurred: ${error.message}`));
        }
      },
      {
        enableHighAccuracy: false, // Use low accuracy
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

// Retry mechanism for geolocation with enhanced logging
export const getCurrentLocationWithRetry = async (
  maxRetries = 3,
  delay = 2000
): Promise<GeolocationPosition> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to retrieve location...`);
      const position = await getCurrentLocation();
      console.log("Location retrieved successfully:", position);
      return position;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw new Error("Failed to retrieve location after multiple attempts. Please ensure location services are enabled.");
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unexpected error in location retrieval.");
};
