import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "faculty" | "admin";
  studentId?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: "student" | "faculty" | "admin", studentId?: string) => Promise<void>;
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
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        studentId: data.user.studentId,
        department: data.user.department,
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);
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
    role: "student" | "faculty" | "admin",
    studentId?: string
  ) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
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

