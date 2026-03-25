import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  GraduationCap,
  Users,
  Settings,
  Shield,
  ArrowRight,
  Sparkles,
  Link2,
  CheckCircle2,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "student",
    title: "Student Portal",
    description: "Submit assignments, use AI tools, and track your academic progress.",
    icon: GraduationCap,
    path: "/student",
    color: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: "faculty",
    title: "Faculty Portal",
    description: "Review submissions, track AI usage, and grade student work.",
    icon: Users,
    path: "/faculty",
    color: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: "admin",
    title: "Admin Portal",
    description: "Manage certificates, configure AI limits, and audit records.",
    icon: Settings,
    path: "/admin",
    color: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  }
];

export default function Landing() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated && user && user.isVerified) {
    if (user.role === "student") navigate("/student");
    else if (user.role === "faculty") navigate("/faculty");
    else if (user.role === "admin") navigate("/admin");
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-primary/30 font-sans overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Modern Header */}
      <header className="fixed top-0 w-full z-50 bg-zinc-950/50 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-primary opacity-50 blur-lg rounded-full group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-white">EduChain</h1>
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">University Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button 
              variant="ghost" 
              className="hidden md:flex text-zinc-300 hover:text-white hover:bg-white/5 rounded-full px-6"
              onClick={() => navigate("/verify")}
            >
              Verify Certificate
            </Button>
            <Button 
              className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-full px-8 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300"
              onClick={() => navigate("/login/student")}
            >
              Portal Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 min-h-[70vh]">
            
            {/* Left Content */}
            <div className="flex-1 space-y-10 text-center lg:text-left pt-12 lg:pt-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-fade-in">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-zinc-300">Next-Gen Academic Infrastructure</span>
              </div>
              
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] tracking-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
                Education <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                  Transformed.
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
                The world's first university portal combining <span className="text-white font-medium">AI-driven assessments</span> with <span className="text-white font-medium">blockchain-verified degrees</span> for absolute academic integrity.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '300ms' }}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-full px-8 h-14 text-lg shadow-[0_0_40px_rgba(var(--primary),0.4)] w-full sm:w-auto"
                  onClick={() => navigate("/login/student")}
                >
                  Access Portal
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-full px-8 h-14 text-lg backdrop-blur-md w-full sm:w-auto"
                  onClick={() => navigate("/verify")}
                >
                  <Shield className="w-5 h-5 mr-2 text-success" />
                  Verify a Degree
                </Button>
              </div>

              {/* Stats/Trust Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 pt-12 border-t border-white/10 animate-fade-in" style={{ animationDelay: '400ms' }}>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">100%</div>
                  <div className="text-sm text-zinc-500 font-medium">Immutable Records</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">&lt; 1s</div>
                  <div className="text-sm text-zinc-500 font-medium">Verification Time</div>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <div className="text-3xl font-bold text-white mb-1">AI</div>
                  <div className="text-sm text-zinc-500 font-medium">Enhanced Grading</div>
                </div>
              </div>
            </div>

            {/* Right Visual (Abstract Representation of the Portal) */}
            <div className="flex-1 w-full relative animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Main floating card */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent border border-white/20 rounded-3xl backdrop-blur-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700 ease-out overflow-hidden flex flex-col p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-medium border border-success/30">
                      Verified on Polygon
                    </div>
                  </div>
                  <div className="space-y-4 flex-1">
                     <div className="h-4 w-1/3 bg-white/20 rounded-full animate-pulse" />
                     <div className="h-10 w-3/4 bg-white/10 rounded-lg" />
                     <div className="h-4 w-full bg-white/5 rounded-full mt-8" />
                     <div className="h-4 w-5/6 bg-white/5 rounded-full" />
                     <div className="h-4 w-4/6 bg-white/5 rounded-full" />
                  </div>
                  <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                       <div className="h-3 w-20 bg-white/20 rounded-full" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Secondary floating element */}
                <div className="absolute -bottom-10 -left-10 w-48 p-5 bg-zinc-900/80 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl transform -rotate-6 hover:-rotate-12 transition-transform duration-500 z-20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-ai/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-ai" />
                    </div>
                    <div className="text-sm font-medium text-white">AI Analysis</div>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-ai w-[85%]" />
                  </div>
                </div>

                 {/* Tertiary floating element */}
                 <div className="absolute -top-10 -right-5 w-56 p-4 bg-zinc-900/80 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-500 z-20 flex bg-cover bg-center" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blockchain/20 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-blockchain" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400">Latest Block</div>
                      <div className="text-sm font-mono text-white">#14920485</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Role Portals Section */}
      <section className="relative z-10 py-32 bg-zinc-950/80 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-display font-bold text-white mb-4">Unified Access</h3>
            <p className="text-zinc-400 max-w-2xl mx-auto">Purpose-built interfaces designed specifically for your role in the academic ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div 
                  key={role.id}
                  onClick={() => navigate("/login/" + role.id)}
                  className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Hover gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-300 group-hover:-translate-y-2", role.iconBg)}>
                    <Icon className={cn("w-8 h-8", role.iconColor)} />
                  </div>
                  
                  <h4 className="text-2xl font-bold text-white mb-3">{role.title}</h4>
                  <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                    {role.description}
                  </p>
                  
                  <div className="mt-8 flex items-center text-sm font-medium text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Access Portal <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verification CTA */}
      <section className="relative z-10 py-32 border-t border-white/5 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
         <div className="container mx-auto px-6 relative">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-[3rem] p-12 lg:p-20 text-center shadow-2xl relative overflow-hidden">
               {/* Decorative glows inside card */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/30 blur-[100px] pointer-events-none" />
               
               <Shield className="w-16 h-16 text-success mx-auto mb-8" />
               <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Instantly Verify Degrees</h3>
               <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto font-light">
                 Our blockchain architecture allows employers and institutions to verify the authenticity of any EduChain degree with cryptographic certainty. No login required.
               </p>
               <Button 
                  size="lg" 
                  className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-full px-10 h-16 text-lg tracking-wide font-medium shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:scale-105"
                  onClick={() => navigate("/verify")}
                >
                  Verify Now <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
         </div>
      </section>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 bg-zinc-950">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-2 text-zinc-500">
              <BookOpen className="w-5 h-5" />
              <span className="font-display font-bold text-white">EduChain</span>
           </div>
           <p className="text-zinc-500 text-sm">© 2026 EduChain University. Blockchain Secured.</p>
           <div className="flex gap-6 text-sm text-zinc-500">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-white cursor-pointer transition-colors">Support</span>
           </div>
        </div>
      </footer>
    </div>
  );
}

