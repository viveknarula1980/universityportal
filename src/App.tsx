import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Assignments from "./pages/Assignments";
import AIGenerator from "./pages/AIGenerator";
import Blockchain from "./pages/Blockchain";
import Settings from "./pages/Settings";
import CertificateIssuance from "./pages/CertificateIssuance";
import MyCertificates from "./pages/MyCertificates";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentLogin from "./pages/StudentLogin";
import FacultyLogin from "./pages/FacultyLogin";
import AdminLogin from "./pages/AdminLogin";
import Verification from "./pages/Verification";
import NotFound from "./pages/NotFound";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import { useEffect } from "react";

// Convert hex to HSL for Tailwind
function hexToHSL(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

function BrandingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const pathParts = window.location.pathname.split('/');
        let slug = '';
        
        if (pathParts[1] === 'p' && pathParts[2]) {
          slug = pathParts[2];
        } else {
          // If not in a branded path, we ensure we use default branding
          // and clear any previous session branding to prevent "ghosting"
          slug = '';
        }

        const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
        const urlRequest = slug ? `${API_URL}/superadmin/branding?slug=${slug}` : `${API_URL}/superadmin/branding`;
        
        const res = await fetch(urlRequest);
        const data = await res.json();
        
        // Always clear previous branding to prevent cross-instance leaking
        localStorage.removeItem('university_name');
        localStorage.removeItem('primary_color');
        localStorage.removeItem('logo_url');
        localStorage.removeItem('university_slug');
        document.documentElement.style.removeProperty('--primary');

        if (data.success && data.data) {
          if (data.data.university_name) {
            document.title = data.data.university_name;
            localStorage.setItem('university_name', data.data.university_name);
          } else {
            document.title = 'EduChain';
          }
          if (data.data.primary_color) {
            const hsl = hexToHSL(data.data.primary_color);
            document.documentElement.style.setProperty('--primary', hsl);
            localStorage.setItem('primary_color', data.data.primary_color);
          }
          if (data.data.logo_url) {
            let fullLogoUrl = data.data.logo_url;
            if (fullLogoUrl.startsWith('/uploads')) {
              fullLogoUrl = `${API_URL.replace('/api', '')}${fullLogoUrl}`;
            }
            localStorage.setItem('logo_url', fullLogoUrl);
          }
          if (data.data.slug) {
            localStorage.setItem('university_slug', data.data.slug);
          }
        } else {
          document.title = 'EduChain';
        }
      } catch (err) { }
    };
    fetchBranding();
  }, [window.location.pathname]);
  
  return <>{children}</>;
}

const queryClient = new QueryClient();

// Use an environment variable for the client ID, or a fallback for testing
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1234567890-mockclientid.apps.googleusercontent.com";

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrandingProvider>
          <BrowserRouter>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Branded Entry Points */}
            <Route path="/p/:slug" element={<Landing />} />
            <Route path="/p/:slug/login" element={<Login />} />
            <Route path="/p/:slug/login/student" element={<StudentLogin />} />
            <Route path="/p/:slug/login/faculty" element={<FacultyLogin />} />
            <Route path="/p/:slug/login/admin" element={<AdminLogin />} />
            
            {/* Branded Dashboard Routes are consolidated below */}
            
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/faculty" element={<FacultyLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/verify" element={<Verification />} />
            <Route path="/verify/:certificateId" element={<Verification />} />
            
            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute requiredRole="student"><Index /></ProtectedRoute>} />
            <Route path="/p/:slug/student" element={<ProtectedRoute requiredRole="student"><Index /></ProtectedRoute>} />
            
            <Route path="/assignments" element={<ProtectedRoute requiredRole="student"><Assignments /></ProtectedRoute>} />
            <Route path="/p/:slug/assignments" element={<ProtectedRoute requiredRole="student"><Assignments /></ProtectedRoute>} />
            
            <Route path="/ai-generator" element={<ProtectedRoute requiredRole="student"><AIGenerator /></ProtectedRoute>} />
            <Route path="/p/:slug/ai-generator" element={<ProtectedRoute requiredRole="student"><AIGenerator /></ProtectedRoute>} />
            
            <Route path="/my-certificates" element={<ProtectedRoute requiredRole="student"><MyCertificates /></ProtectedRoute>} />
            <Route path="/p/:slug/my-certificates" element={<ProtectedRoute requiredRole="student"><MyCertificates /></ProtectedRoute>} />
            
            <Route path="/blockchain" element={<ProtectedRoute><Blockchain /></ProtectedRoute>} />
            <Route path="/p/:slug/blockchain" element={<ProtectedRoute><Blockchain /></ProtectedRoute>} />
            
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/p/:slug/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* Faculty Routes */}
            <Route path="/faculty" element={<ProtectedRoute requiredRole="faculty"><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/p/:slug/faculty" element={<ProtectedRoute requiredRole="faculty"><FacultyDashboard /></ProtectedRoute>} />
            
            <Route path="/faculty/submissions" element={<ProtectedRoute requiredRole="faculty"><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/p/:slug/faculty/submissions" element={<ProtectedRoute requiredRole="faculty"><FacultyDashboard /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/p/:slug/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            
            <Route path="/certificate-issuance" element={<ProtectedRoute requiredRole="admin"><CertificateIssuance /></ProtectedRoute>} />
            <Route path="/p/:slug/certificate-issuance" element={<ProtectedRoute requiredRole="admin"><CertificateIssuance /></ProtectedRoute>} />
            
            {/* Super Admin Routes */}
            <Route
              path="/superadmin"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </BrandingProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
