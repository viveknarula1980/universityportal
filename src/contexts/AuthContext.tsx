import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "faculty" | "admin" | "super_admin";
  studentId?: string;
  department?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ requireOTP?: boolean; email?: string }>;
  loginWithGoogle: (credential: string, role?: "student" | "faculty" | "admin" | "super_admin") => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: "student" | "faculty" | "admin" | "super_admin", studentId?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.isVerified) {
          setUser(parsedUser);
        } else {
          // Clear unverified session to allow a fresh login on refresh
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      if (data.requireOTP) {
        return { requireOTP: true, email: data.email };
      }

      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        studentId: data.user.studentId,
        department: data.user.department,
        isVerified: data.user.isVerified || false,
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);
      return { requireOTP: false };
    } catch (error: any) {
      throw new Error(error.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "student" | "faculty" | "admin" | "super_admin",
    studentId?: string
  ) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role, studentId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Registration failed");
      }

      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        studentId: data.user.studentId,
        department: data.user.department,
        isVerified: data.user.isVerified || false,
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);
    } catch (error: any) {
      throw new Error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, role?: "student" | "faculty" | "admin" | "super_admin") => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, role }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Google login failed");
      }

      // Ensure data.user contains isVerified from the backend
      const userData = {
        ...data.user,
        isVerified: data.user.isVerified || false
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);
    } catch (error: any) {
      throw new Error(error.message || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (email: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to send OTP");
    }
  };

  const verifyOTP = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Invalid OTP");
      }

      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        studentId: data.user.studentId,
        department: data.user.department,
        isVerified: true,
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);
    } catch (error: any) {
      throw new Error(error.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        sendOTP,
        verifyOTP,
        register,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

