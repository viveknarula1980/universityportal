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

  // Detect if we are on a branded path like /p/:slug/...
  const pathParts = location.pathname.split('/');
  const slug = (pathParts[1] === 'p' && pathParts[2]) ? pathParts[2] : '';
  const loginPath = slug ? `/p/${slug}/login` : '/login';

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
    return <Navigate to={loginPath} state={{ from: location, needsOtp: !user?.isVerified }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const base = slug ? `/p/${slug}` : '';
    // Redirect to appropriate portal based on user role
    if (user?.role === "student") {
      return <Navigate to={`${base}/student`} replace />;
    } else if (user?.role === "faculty") {
      return <Navigate to={`${base}/faculty`} replace />;
    } else if (user?.role === "admin") {
      return <Navigate to={`${base}/admin`} replace />;
    }
    return <Navigate to={base || "/"} replace />;
  }

  return <>{children}</>;
}

