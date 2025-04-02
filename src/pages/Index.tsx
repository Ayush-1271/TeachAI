
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/components/Login";
import TeacherDashboard from "@/components/TeacherDashboard";
import StudentDashboard from "@/components/StudentDashboard";

const Index = () => {
  const { user, isLoading } = useAuth();

  // Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p>Loading...</p>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Login />
      </div>
    );
  }

  // Show appropriate dashboard based on user role
  return (
    <div className="min-h-screen p-8 bg-white">
      {user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  );
};

export default Index;
