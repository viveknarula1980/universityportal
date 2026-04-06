import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "student" | "faculty" | "admin" | "super_admin";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user && !user.isVerified)) {
    return <Navigate to="/login" state={{ from: location, needsOtp: !user?.isVerified }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate portal based on user role
    if (user?.role === "student") {
      return <Navigate to="/student" replace />;
    } else if (user?.role === "faculty") {
      return <Navigate to="/faculty" replace />;
    } else if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

