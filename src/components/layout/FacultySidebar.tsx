import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Users, 
  FileText, 
  Link2, 
  Settings,
  User,
  LogOut,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Users, label: "Faculty Dashboard", path: "/faculty" },
  { icon: FileText, label: "Submissions", path: "/faculty/submissions" },
  { icon: Link2, label: "Blockchain", path: "/blockchain" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function FacultySidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const pathParts = location.pathname.split('/');
    const currentSlug = (pathParts[1] === 'p' && pathParts[2]) ? pathParts[2] : '';
    const targetPath = currentSlug ? `/p/${currentSlug}` : '/';
    logout();
    navigate(targetPath);
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            {localStorage.getItem('logo_url') ? (
              <img src={localStorage.getItem('logo_url') || ''} alt="logo" className="w-6 h-6 object-contain" />
            ) : (
              <Users className="w-5 h-5 text-white" />
            )}
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display font-bold text-lg leading-tight truncate max-w-[120px]">
                 {localStorage.getItem('university_name') || 'EduChain'}
              </h1>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Faculty Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 mb-4",
          collapsed && "justify-center"
        )}>
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="font-medium text-sm">{user?.name || "Faculty"}</p>
              <p className="text-xs text-sidebar-foreground/60">Faculty</p>
            </div>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed ? "justify-center" : "justify-start"
          )}
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Log out</span>}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
      >
        <ChevronLeft className={cn(
          "w-4 h-4 text-foreground transition-transform",
          collapsed && "rotate-180"
        )} />
      </button>
    </aside>
  );
}

