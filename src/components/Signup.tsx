import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { captureImage, detectFace } from "@/utils/faceRecognition";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [id, setId] = useState("");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { signup, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCaptureFace = async () => {
    try {
      setIsProcessing(true);
      const imageData = await captureImage();

      const faceDetected = await detectFace(imageData);
      if (faceDetected) {
        setFaceImage(imageData);
        toast({
          title: "Face Captured",
          description: "Your face was successfully captured",
        });
      } else {
        toast({
          title: "Face Detection Failed",
          description: "No face detected. Please try again and ensure your face is clearly visible.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: error instanceof Error ? error.message : "Failed to access camera",
        variant: "destructive",
      });
    } finally {
      setIsCameraOpen(false);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (role === "student" && !faceImage) {
        toast({
          title: "Face Image Required",
          description: "Students must capture a face image for attendance verification",
          variant: "destructive",
        });
        return;
      }

      const userData = {
        name,
        email,
        role,
        ...(role === "student" ? { studentId: id } : { teacherId: id }),
      };

      await signup(userData, password, faceImage || undefined);

      toast({
        title: "Account Created",
        description: "Your account has been created successfully. You can now log in.",
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-xl mb-4">Teacher's AI Attendance System</h1>
      <h2 className="text-lg mb-4">Sign Up</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block mb-1">
            Full Name:
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-2 py-1 border border-black"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1">
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-2 py-1 border border-black"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block mb-1">
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-2 py-1 border border-black"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Role:</label>
          <div>
            <label className="mr-4">
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === "student"}
                onChange={() => setRole("student")}
              />
              {" "}Student
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="teacher"
                checked={role === "teacher"}
                onChange={() => setRole("teacher")}
              />
              {" "}Teacher
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="id" className="block mb-1">
            {role === "student" ? "Student ID:" : "Teacher ID:"}
          </label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            className="w-full px-2 py-1 border border-black"
          />
        </div>
        
        {role === "student" && (
          <div className="mb-4">
            <label className="block mb-1">Face Profile Image:</label>
            {faceImage ? (
              <div className="mb-2">
                <img 
                  src={faceImage} 
                  alt="Captured face" 
                  className="border border-black w-40 h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFaceImage(null)}
                  className="mt-2 px-2 py-1 border border-black"
                >
                  Retake Photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-2 py-1 border border-black"
                disabled={isCameraOpen || isProcessing}
              >
                {isProcessing ? "Processing..." : "Capture Face"}
              </button>
            )}
            {isCameraOpen && (
              <div className="mt-2">
                <div className="border border-black w-64 h-48 flex items-center justify-center">
                  <p>Camera Preview (simulated)</p>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureFace}
                  className="mt-2 px-2 py-1 border border-black mr-2"
                  disabled={isProcessing}
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(false)}
                  className="mt-2 px-2 py-1 border border-black"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || isProcessing}
          className="px-4 py-1 border border-black"
        >
          {isLoading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
      
      <div className="mt-4">
        <a href="/" className="text-black underline">
          Already have an account? Login
        </a>
      </div>
    </div>
  );
};

export default Signup;
