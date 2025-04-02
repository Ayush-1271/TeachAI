import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      toast({
        title: "Login Successful",
        description: "You have been logged in successfully",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-xl mb-4">Teacher's AI Attendance System</h1>
      <h2 className="text-lg mb-4">Login</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1">
            Email:
          </label>
          <Input
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
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-2 py-1 border border-black"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-1 border border-black"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
      
      <div className="mt-4">
        <a href="/signup" className="text-black underline">
          Don't have an account? Sign up
        </a>
      </div>
      
      <div className="mt-2">
        <span className="text-sm">
          Demo credentials:<br />
          Teacher: teacher@example.com / password<br />
          Student: student@example.com / password
        </span>
      </div>
    </div>
  );
};

export default Login;
