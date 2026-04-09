import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StudentSidebar } from "./StudentSidebar";
import { FacultySidebar } from "./FacultySidebar";
import { AdminSidebar } from "./AdminSidebar";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { AIStudyBuddy } from "../shared/AIStudyBuddy";

interface MainLayoutProps {
  children: ReactNode;
  role?: "student" | "faculty" | "admin" | "super_admin";
}

export function MainLayout({ children, role }: MainLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine role: use prop first, then user's role, then detect from path
  let detectedRole: "student" | "faculty" | "admin" | "super_admin" = "student";
  if (role) {
    detectedRole = role;
  } else if (user?.role) {
    // Use the actual user's role from auth context
    detectedRole = user.role as "student" | "faculty" | "admin" | "super_admin";
  } else {
    // Fallback to path detection
    if (location.pathname.startsWith("/superadmin")) {
      detectedRole = "super_admin";
    } else if (location.pathname.startsWith("/faculty")) {
      detectedRole = "faculty";
    } else if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/certificate-issuance")) {
      detectedRole = "admin";
    } else {
      detectedRole = "student";
    }
  }

  const renderSidebar = () => {
    switch (detectedRole) {
      case "super_admin":
        return <SuperAdminSidebar />;
      case "faculty":
        return <FacultySidebar />;
      case "admin":
        return <AdminSidebar />;
      default:
        return <StudentSidebar />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print">
        {renderSidebar()}
      </div>
      <main className="ml-20 lg:ml-64 transition-all duration-300 print:m-0 print:p-0">
        <div className="p-6 lg:p-8 print:p-0">
          {children}
        </div>
      </main>
      <div className="no-print">
        <AIStudyBuddy />
      </div>
    </div>
  );
}
