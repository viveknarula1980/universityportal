import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Building2,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Building2, label: "Super Admin Home", path: "/superadmin" },
];

export function SuperAdminSidebar() {
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
    navigate('/');
  };

  return (
    <aside 
      className={cn(
        "bg-zinc-950 text-white flex flex-col transition-all duration-300 z-50 h-full",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-zinc-800">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div className={cn("transition-all duration-300", collapsed ? "hidden" : "block")}>
             <h1 className="font-display font-bold text-lg leading-tight truncate max-w-[120px]">
               EduChain
             </h1>
            <p className="text-[10px] text-indigo-400 uppercase tracking-wider">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-indigo-600 text-white shadow-lg" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
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
      <div className="p-4 border-t border-zinc-800">
        <div className={cn(
          "flex items-center gap-3 mb-4",
          collapsed && "justify-center"
        )}>
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-indigo-400">
            <User className="w-5 h-5" />
          </div>
          <div className={cn("flex-1 transition-all duration-300", collapsed ? "hidden" : "block")}>
            <p className="font-medium text-sm truncate">{user?.name || "Super Admin"}</p>
            <p className="text-xs text-zinc-500 truncate">System Controller</p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          className={cn(
            "w-full text-zinc-400 hover:text-white hover:bg-zinc-900",
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
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 shadow-md items-center justify-center hover:bg-zinc-800 transition-colors"
      >
        <ChevronLeft className={cn(
          "w-4 h-4 text-white transition-transform",
          collapsed && "rotate-180"
        )} />
      </button>
    </aside>
  );
}
