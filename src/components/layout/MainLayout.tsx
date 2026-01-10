import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { StudentSidebar } from "./StudentSidebar";
import { FacultySidebar } from "./FacultySidebar";
import { AdminSidebar } from "./AdminSidebar";

interface MainLayoutProps {
  children: ReactNode;
  role?: "student" | "faculty" | "admin";
}

export function MainLayout({ children, role }: MainLayoutProps) {
  const location = useLocation();
  
  // Auto-detect role from path if not provided
  let detectedRole: "student" | "faculty" | "admin" = "student";
  if (role) {
    detectedRole = role;
  } else {
    if (location.pathname.startsWith("/faculty")) {
      detectedRole = "faculty";
    } else if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/certificate-issuance")) {
      detectedRole = "admin";
    } else {
      detectedRole = "student";
    }
  }

  const renderSidebar = () => {
    switch (detectedRole) {
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
      {renderSidebar()}
      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
