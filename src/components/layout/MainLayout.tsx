import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StudentSidebar } from "./StudentSidebar";
import { FacultySidebar } from "./FacultySidebar";
import { AdminSidebar } from "./AdminSidebar";
import { SuperAdminSidebar } from "./SuperAdminSidebar";

import { MobileHeader } from "./MobileHeader";

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

  const universityName = localStorage.getItem('university_name');
  const logoUrl = localStorage.getItem('logo_url');

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header (Hidden on Laptop+) */}
      <div className="no-print">
        <MobileHeader 
          universityName={universityName} 
          logoUrl={logoUrl} 
          sidebarComponent={renderSidebar()} 
        />
      </div>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="no-print hidden lg:block sticky top-0 h-screen">
        {renderSidebar()}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full transition-all duration-300 print:m-0 print:p-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 print:p-0 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
