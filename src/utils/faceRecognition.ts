// This file simulates the face recognition that would normally be done with OpenCV
// In a real implementation, this would connect to a Python backend using OpenCV

// Simulate face detection
export const detectFace = async (imageData: string): Promise<boolean> => {
  // This would normally call a backend API using OpenCV
  // For demo purposes, we'll just simulate face detection with a random success rate
  
  // Pretend we're processing the image
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 80% chance of success for demo purposes
  return Math.random() > 0.2;
};

// Simulate face comparison
export const compareFaces = async (
  capturedFace: string,
  storedFace: string
): Promise<boolean> => {
  // This would call a backend API using OpenCV to compare faces
  // For demo, we'll simulate with a delay and random result
  
  // Pretend we're comparing faces
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 70% chance of match for demo purposes
  return Math.random() > 0.3;
};

// Capture image from webcam
export const captureImage = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.style.display = 'none';
      document.body.appendChild(video);

      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          video.srcObject = stream;
          video.play();

          // Give camera time to initialize
          setTimeout(() => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                throw new Error('Could not get canvas context');
              }

              // Draw video frame to canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              // Get image data as base64
              const imageData = canvas.toDataURL('image/jpeg');

              // Stop all video tracks
              stream.getTracks().forEach(track => track.stop());

              // Remove video element
              document.body.removeChild(video);

              resolve(imageData);
            } catch (err) {
              console.error("Error during image capture:", err);
              reject(err);
            }
          }, 500);
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
          document.body.removeChild(video);
          reject(new Error("Failed to access camera. Please check permissions and try again."));
        });
    } catch (err) {
      console.error("Unexpected error in captureImage:", err);
      reject(err);
    }
  });
};
