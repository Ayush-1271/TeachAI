import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { createBlob, getBlob, updateBlob } from "@/utils/jsonBlob";

const USER_BLOB_ID = "1356691772465668096"; // Updated with the actual blob ID

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Partial<User>, password: string, faceImage?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage (simulating cookies)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user"); // Remove invalid data
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await getBlob(USER_BLOB_ID); // Fetch the entire JSONBlob
      const users = data.users || []; // Access the `users` array
      const foundUser = users.find((u: any) => u.email === email);
      if (foundUser && foundUser.password === password) {
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword as User); // Ensure type matches User
      } else {
        throw new Error("Invalid email or password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: Partial<User>, password: string, faceImage?: string) => {
    setIsLoading(true);
    try {
      const data = await getBlob(USER_BLOB_ID); // Fetch the entire JSONBlob
      const users = data.users || []; // Access the `users` array
      if (users.some((user: any) => user.email === userData.email)) {
        throw new Error("Email already exists");
      }
      const newUser: User = {
        id: `${Date.now()}`,
        email: userData.email || "", // Ensure email is always present
        name: userData.name || "",
        role: userData.role || "student",
        studentId: userData.studentId,
        teacherId: userData.teacherId,
        faceImage: faceImage,
      };
      users.push({ ...newUser, password }); // Include password for storage
      await updateBlob(USER_BLOB_ID, { ...data, users }); // Update the JSONBlob with the new user
      setUser(newUser); // Set user without password
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
