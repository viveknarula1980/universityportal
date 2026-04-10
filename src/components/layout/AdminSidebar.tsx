import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard,
  GraduationCap,
  Users,
  Link2,
  User,
  Settings,
  LogOut,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Admin Dashboard", path: "/admin?tab=certificates" },
  { icon: Users, label: "Manage Users", path: "/admin?tab=users" },
  { icon: GraduationCap, label: "Issue Certificate", path: "/certificate-issuance" },
  { icon: Link2, label: "Blockchain", path: "/blockchain" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Extract base path for dynamic navigation
  const pathParts = location.pathname.split('/');
  const currentSlug = (pathParts[1] === 'p' && pathParts[2]) ? pathParts[2] : (localStorage.getItem('university_slug') || '');
  const basePath = currentSlug ? `/p/${currentSlug}` : '';

  const handleLogout = () => {
    const targetPath = currentSlug ? `/p/${currentSlug}` : '/';
    logout();
    navigate(targetPath);
  };

  return (
    <aside 
      className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50 h-full",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            {localStorage.getItem('logo_url') ? (
              <img src={localStorage.getItem('logo_url') || ''} alt="logo" className="w-6 h-6 object-contain" />
            ) : (
              <Settings className="w-5 h-5 text-white" />
            )}
          </div>
          <div className={cn("transition-all duration-300", collapsed ? "hidden" : "block")}>
             <h1 className="font-display font-bold text-lg leading-tight truncate max-w-[120px]">
               {localStorage.getItem('university_name') || 'EduChain'}
             </h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const itemPath = `${basePath}${item.path}`;
          const isActive = location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
          return (
            <Link
              key={item.path}
              to={itemPath}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={cn("font-medium transition-all duration-300", collapsed ? "hidden" : "block")}>
                {item.label}
              </span>
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
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-amber-500">
            <User className="w-5 h-5" />
          </div>
          <div className={cn("flex-1 transition-all duration-300", collapsed ? "hidden" : "block")}>
            <p className="font-medium text-sm truncate">{user?.name || "Admin"}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Administrator</p>
          </div>
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
          <span className={cn("ml-3 transition-all duration-300", collapsed ? "hidden" : "block")}>
            Log out
          </span>
        </Button>
      </div>

      {/* Collapse Toggle - Hidden on Mobile */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border shadow-md items-center justify-center hover:bg-accent transition-colors"
      >
        <ChevronLeft className={cn(
          "w-4 h-4 text-foreground transition-transform",
          collapsed && "rotate-180"
        )} />
      </button>
    </aside>
  );
}

