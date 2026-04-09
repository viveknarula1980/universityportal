import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
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
  BookOpen,
  Zap,
  Globe,
  Lock,
  Brain,
  Hexagon,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "student",
    title: "Student Portal",
    description: "Submit assignments, use AI tools, and track your academic progress with blockchain verification.",
    icon: GraduationCap,
    path: "/student",
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    glowColor: "rgba(99, 102, 241, 0.4)",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    borderHover: "hover:border-blue-500/30",
  },
  {
    id: "faculty",
    title: "Faculty Portal",
    description: "Review submissions, track AI usage patterns, grade student work and manage course content.",
    icon: Users,
    path: "/faculty",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    glowColor: "rgba(168, 85, 247, 0.4)",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    borderHover: "hover:border-purple-500/30",
  },
  {
    id: "admin",
    title: "Admin Portal",
    description: "Manage certificates, configure AI limits, audit records and oversee the entire institution.",
    icon: Settings,
    path: "/admin",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    glowColor: "rgba(245, 158, 11, 0.4)",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    borderHover: "hover:border-amber-500/30",
  }
];

const features = [
  { icon: Brain, title: "AI-Powered Grading", desc: "Smart assessment with full transparency" },
  { icon: Link2, title: "Blockchain Secured", desc: "Immutable records on Polygon" },
  { icon: Lock, title: "Zero-Trust Auth", desc: "Enterprise-grade security" },
  { icon: Globe, title: "Multi-Tenant", desc: "Branded portals for every institution" },
];

// Animated counter hook
function useCounter(end: number, duration: number = 2000, startOnMount: boolean = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!startOnMount || started) return;
    setStarted(true);
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, startOnMount, started]);

  return count;
}

export default function Landing() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const basePath = slug ? `/p/${slug}` : '';
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  const universityName = slug ? (localStorage.getItem('university_name') || 'University Portal') : 'EduChain';
  const logoUrl = localStorage.getItem('logo_url') || '';

  // Track mouse for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const stat1 = useCounter(100, 2500);
  const stat2 = useCounter(50, 2000);
  const stat3 = useCounter(99, 2800);

  if (isLoading) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && user && user.isVerified) {
    if (user.role === "student") navigate(`${basePath}/student`);
    else if (user.role === "faculty") navigate(`${basePath}/faculty`);
    else if (user.role === "admin") navigate(`${basePath}/admin`);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#060612] text-zinc-50 selection:bg-primary/30 font-sans overflow-x-hidden">
      
      {/* ═══════ ANIMATED BACKGROUND ═══════ */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Mesh gradient base */}
        <div className="absolute inset-0 mesh-gradient opacity-80" />
        
        {/* Morphing blobs */}
        <div 
          className="absolute w-[600px] h-[600px] animate-morph bg-gradient-to-br from-indigo-600/15 to-purple-600/10 blur-[100px]"
          style={{ 
            top: '10%', left: '15%',
            animationDuration: '12s',
            transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 15}px)`
          }} 
        />
        <div 
          className="absolute w-[500px] h-[500px] animate-morph bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 blur-[120px]"
          style={{ 
            bottom: '10%', right: '10%',
            animationDuration: '15s',
            animationDelay: '3s',
            transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -10}px)`
          }} 
        />
        <div 
          className="absolute w-[400px] h-[400px] animate-morph bg-gradient-to-br from-fuchsia-500/8 to-rose-500/5 blur-[80px]"
          style={{ 
            top: '50%', left: '50%',
            animationDuration: '18s',
            animationDelay: '6s'
          }} 
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 particle-bg opacity-30" />
        
        {/* Noise texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* ═══════ PREMIUM HEADER ═══════ */}
      <header className="fixed top-0 w-full z-50 transition-all duration-500">
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto glass-card-dark rounded-2xl px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate(`${basePath || '/'}`)}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-50 blur-xl rounded-full group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center transform group-hover:scale-110 transition-all duration-500 group-hover:rotate-6">
                  {logoUrl ? (
                    <img src={logoUrl} alt={universityName} className="w-6 h-6 object-contain filter brightness-0 invert" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-lg tracking-tight text-white">{universityName}</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-primary/80 font-semibold">University Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="hidden md:flex text-zinc-400 hover:text-white hover:bg-white/5 rounded-full px-5 text-sm transition-all duration-300"
                onClick={() => navigate(`${basePath}/verify`)}
              >
                <Shield className="w-4 h-4 mr-2" />
                Verify Certificate
              </Button>
              <Button 
                className="relative overflow-hidden bg-white text-zinc-950 hover:bg-zinc-100 rounded-full px-6 text-sm font-semibold shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all duration-500 group"
                onClick={() => navigate(`${basePath}/login/student`)}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Portal Login
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ HERO SECTION ═══════ */}
      <main ref={heroRef} className="relative z-10 pt-36 pb-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20 min-h-[75vh]">
            
            {/* Left Content */}
            <div className="flex-1 space-y-10 text-center lg:text-left pt-8 lg:pt-0">
              {/* Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card-dark">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-zinc-300">Next-Gen Academic Infrastructure</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              
              {/* Main Heading */}
              <h2 
                className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-display font-bold leading-[1.05] tracking-tight animate-fade-up"
                style={{ animationDelay: '150ms' }}
              >
                Education{' '}
                <br className="hidden lg:block" />
                <span className="gradient-text-aurora">
                  Reimagined.
                </span>
              </h2>
              
              {/* Subtitle */}
              <p 
                className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed animate-fade-up" 
                style={{ animationDelay: '300ms' }}
              >
                The world's first university portal fusing{' '}
                <span className="text-white font-medium">AI-driven assessments</span> with{' '}
                <span className="text-white font-medium">blockchain-verified credentials</span>{' '}
                for absolute academic integrity.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-up" style={{ animationDelay: '450ms' }}>
                <Button 
                  size="lg" 
                  className="relative overflow-hidden bg-gradient-to-r from-primary via-violet-600 to-accent text-white rounded-full px-10 h-14 text-lg font-semibold animate-gradient group w-full sm:w-auto"
                  onClick={() => navigate(`${basePath}/login/student`)}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Access Portal
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-violet-600/80 to-accent/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] rounded-full px-10 h-14 text-lg backdrop-blur-md w-full sm:w-auto transition-all duration-300 hover:border-white/20"
                  onClick={() => navigate(`${basePath}/verify`)}
                >
                  <Shield className="w-5 h-5 mr-2 text-emerald-400" />
                  Verify a Degree
                </Button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-8 pt-10 border-t border-white/[0.06] animate-fade-up" style={{ animationDelay: '600ms' }}>
                <div className="group">
                  <div className="stat-number text-4xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{stat1}%</div>
                  <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Immutable</div>
                </div>
                <div className="group">
                  <div className="stat-number text-4xl font-bold text-white mb-1 group-hover:text-accent transition-colors">&lt;{stat2 > 1 ? 1 : stat2}s</div>
                  <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Verification</div>
                </div>
                <div className="group">
                  <div className="stat-number text-4xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{stat3}.9%</div>
                  <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Visual — Orbital System */}
            <div className="flex-1 w-full relative animate-fade-up" style={{ animationDelay: '400ms' }}>
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                
                {/* Orbiting rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[90%] h-[90%] rounded-full border border-white/[0.04] animate-spin-slow" />
                  <div className="absolute w-[65%] h-[65%] rounded-full border border-white/[0.06] animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
                  <div className="absolute w-[40%] h-[40%] rounded-full border border-dashed border-white/[0.08]" />
                </div>

                {/* Center orb */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 rounded-full scale-150" />
                    <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 backdrop-blur-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                      {logoUrl ? (
                        <img src={logoUrl} alt={universityName} className="w-14 h-14 object-contain filter brightness-0 invert" />
                      ) : (
                        <Hexagon className="w-14 h-14 text-white/80" strokeWidth={1} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Orbiting cards */}
                <div className="absolute inset-0" style={{ animation: 'orbit 25s linear infinite' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card-premium rounded-2xl p-4 w-48">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-xs font-medium text-white">Verified</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate">tx: 0x7a2b...f9c1</div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0" style={{ animation: 'orbit 25s linear infinite', animationDelay: '-8.3s' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card-premium rounded-2xl p-4 w-44">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                      </div>
                      <span className="text-xs font-medium text-white">AI Analysis</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[85, 92, 78, 95, 88].map((v, i) => (
                        <div key={i} className="flex-1 bg-white/5 rounded-full overflow-hidden h-4">
                          <div className="bg-violet-500/60 rounded-full h-full transition-all duration-1000" style={{ height: `${v}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0" style={{ animation: 'orbit 25s linear infinite', animationDelay: '-16.6s' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card-premium rounded-2xl p-4 w-44">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400">Latest Block</div>
                        <div className="text-xs font-mono text-white font-medium">#14,920,485</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══════ FEATURES STRIP ═══════ */}
      <section className="relative z-10 py-12 border-y border-white/[0.04]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-all duration-300 group animate-fade-up cursor-default"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-500">
                  <f.icon className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors duration-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs text-zinc-500">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ ROLE PORTALS ═══════ */}
      <section className="relative z-10 py-32 aurora-bg">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-dark text-xs font-medium text-zinc-300 animate-fade-up">
              <Globe className="w-3.5 h-3.5 text-primary" />
              Role-Based Access Control
            </div>
            <h3 className="text-4xl md:text-5xl font-display font-bold text-white animate-fade-up" style={{ animationDelay: '100ms' }}>
              Choose Your Portal
            </h3>
            <p className="text-zinc-400 max-w-xl mx-auto text-lg animate-fade-up" style={{ animationDelay: '200ms' }}>
              Purpose-built interfaces designed specifically for your role in the academic ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {roles.map((role, i) => {
              const Icon = role.icon;
              return (
                <div 
                  key={role.id}
                  onClick={() => navigate(`${basePath}/login/` + role.id)}
                  className={cn(
                    "group relative rounded-3xl glass-card-premium cursor-pointer overflow-hidden p-8 animate-fade-up",
                    role.borderHover
                  )}
                  style={{ animationDelay: `${300 + i * 150}ms` }}
                >
                  {/* Hover gradient */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700`} 
                  />
                  
                  {/* Glow on hover */}
                  <div 
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ backgroundColor: role.glowColor }}
                  />
                  
                  <div className="relative z-10">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-110", role.iconBg)}>
                      <Icon className={cn("w-8 h-8", role.iconColor)} />
                    </div>
                    
                    <h4 className="text-2xl font-bold text-white mb-3 font-display">{role.title}</h4>
                    <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors text-sm">
                      {role.description}
                    </p>
                    
                    <div className="mt-8 flex items-center text-sm font-semibold text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      <span className="mr-2">Access Portal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ VERIFICATION CTA ═══════ */}
      <section className="relative z-10 py-32 overflow-hidden">
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto relative">
            {/* Decorative glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/20 blur-[100px] rounded-full" />
            
            <div className="relative glass-card-premium rounded-[2.5rem] p-12 lg:p-20 text-center overflow-hidden">
              {/* Inner glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-24 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-[60px]" />
              
              <div className="relative z-10 space-y-8">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse-glow">
                  <Award className="w-10 h-10 text-emerald-400" />
                </div>
                
                <h3 className="text-4xl md:text-5xl font-display font-bold text-white">
                  Instantly Verify{' '}
                  <span className="gradient-text-aurora">Degrees</span>
                </h3>
                
                <p className="text-lg text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
                  Our blockchain architecture allows employers and institutions to verify the authenticity of any degree with cryptographic certainty. No login required.
                </p>
                
                <Button 
                  size="lg" 
                  className="bg-white text-zinc-950 hover:bg-zinc-100 rounded-full px-12 h-16 text-lg tracking-wide font-semibold shadow-[0_0_40px_rgba(255,255,255,0.12)] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] group"
                  onClick={() => navigate(`${basePath}/verify`)}
                >
                  <span className="flex items-center gap-3">
                    Verify Now 
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ MINIMAL FOOTER ═══════ */}
      <footer className="relative z-10 border-t border-white/[0.04] py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={universityName} className="w-4 h-4 object-contain filter brightness-0 invert" />
              ) : (
                <BookOpen className="w-4 h-4 text-zinc-400" />
              )}
            </div>
            <span className="font-display font-bold text-white">{universityName}</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 {universityName}. Blockchain Secured.</p>
          <div className="flex gap-8 text-sm text-zinc-500">
            <span className="hover:text-white cursor-pointer transition-colors duration-300">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors duration-300">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors duration-300">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
