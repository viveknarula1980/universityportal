import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LogIn, Mail, Lock, GraduationCap, Users, Settings, Sparkles, CheckCircle2, ArrowLeft, Shield, Hexagon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, User } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login, loginWithGoogle, sendOTP, verifyOTP, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const basePath = slug ? `/p/${slug}` : '';
  const { toast } = useToast();

  const [authStep, setAuthStep] = useState<"login" | "otp">("login");
  const [tempUser, setTempUser] = useState<User | null>(null);

  useEffect(() => {
    if (user && user.isVerified) {
      proceedToDashboard(user);
    }
  }, [user]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <Sparkles className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  const handleInitialLoginSuccess = async (user: User) => {
    setTempUser(user);
    if (!user.isVerified) {
      setAuthStep("otp");
      try {
        await sendOTP(user.email);
        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code.",
        });
      } catch (e: any) {
        toast({
          title: "Failed to send OTP",
          description: e.message,
          variant: "destructive",
        });
      }
    } else {
      proceedToDashboard(user);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await handleInitialLoginSuccess(user);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        setIsSubmitting(true);
        await loginWithGoogle(credentialResponse.credential, "student");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        await handleInitialLoginSuccess(user);
      } catch (error: any) {
        toast({
          title: "Google Login failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    
    setIsSubmitting(true);
    try {
      await verifyOTP(tempUser.email, otpCode);
      toast({
        title: "Verification successful!",
        description: "Welcome back!",
      });
      proceedToDashboard(tempUser);
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP code",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const proceedToDashboard = (user: User) => {
    if (user.role === "student") {
      navigate(`${basePath}/student`);
    } else if (user.role === "faculty") {
      navigate(`${basePath}/faculty`);
    } else if (user.role === "admin") {
      navigate(`${basePath}/admin`);
    } else if (user.role === "super_admin") {
      navigate("/superadmin");
    } else {
      navigate(`${basePath || '/'}`);
    }
  };

    const quickLogin = (role: "student" | "faculty" | "admin" | "super_admin") => {
    const defaultCreds: Record<string, { email: string; password: string }> = {
      student: { email: "student@university.edu", password: "student123" },
      faculty: { email: "faculty@university.edu", password: "faculty123" },
      admin: { email: "admin@university.edu", password: "admin123" },
      super_admin: { email: "superadmin@university.edu", password: "superadmin123" },
    };

    const creds = defaultCreds[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ═══ Visual Side ═══ */}
      <div className="hidden lg:flex relative bg-[#060612] flex-col justify-between p-12 text-white overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 mesh-gradient" />
        
        {/* Morphing blobs */}
        <div className="absolute w-[400px] h-[400px] top-10 right-[-50px] bg-primary/15 blur-[100px] animate-morph" style={{ animationDuration: '12s' }} />
        <div className="absolute w-[300px] h-[300px] bottom-20 left-[-30px] bg-accent/10 blur-[80px] animate-morph" style={{ animationDuration: '15s', animationDelay: '3s' }} />
        <div className="absolute w-[250px] h-[250px] top-[40%] left-[40%] bg-violet-500/8 blur-[60px] animate-morph" style={{ animationDuration: '18s', animationDelay: '6s' }} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 particle-bg opacity-20" />
        
        <div className="relative z-10">
          <button 
            onClick={() => navigate(`${basePath || '/'}`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          
          <div className="flex items-center gap-3 mb-16">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-40 blur-xl rounded-full group-hover:opacity-80 transition-opacity duration-700" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                {localStorage.getItem('logo_url') ? (
                  <img src={localStorage.getItem('logo_url') || ''} alt="logo" className="w-6 h-6 object-contain filter brightness-0 invert" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <span className="text-xl font-display font-bold">{localStorage.getItem('university_name') || 'EduChain University'}</span>
          </div>

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
              The Future of <br />
              <span className="gradient-text-aurora">
                Academic Integrity
              </span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Access your courses, submit AI-verified assignments, and manage your blockchain-secured diplomas in one portal.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 space-y-3 mt-12">
          {[
            { icon: CheckCircle2, title: "Enterprise Security", desc: "Google OAuth & 2FA enabled", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { icon: Shield, title: "Blockchain Verified", desc: "Immutable credential records", color: "text-violet-400", bg: "bg-violet-500/10" },
          ].map((item, i) => (
            <div key={i} className="glass-card-dark rounded-2xl p-5 max-w-sm animate-fade-up" style={{ animationDelay: `${i * 200}ms` }}>
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-zinc-400">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Form Side ═══ */}
      <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950/50 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.03),transparent_50%)]" />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-lg shadow-primary/20">
              {localStorage.getItem('logo_url') ? (
                <img src={localStorage.getItem('logo_url') || ''} alt="logo" className="w-7 h-7 object-contain filter brightness-0 invert" />
              ) : (
                <Sparkles className="w-7 h-7 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-display font-bold">{localStorage.getItem('university_name') || 'EduChain'}</h1>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl shadow-zinc-200/50 dark:shadow-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 relative overflow-hidden">
            {/* Card inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-primary/5 blur-[40px] rounded-full pointer-events-none" />
            
            {authStep === "login" ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-display font-bold tracking-tight mb-2">Welcome Back</h2>
                  <p className="text-sm text-muted-foreground">Sign in to your university account</p>
                </div>

                <div className="space-y-6">
                  {/* Google Login Provider */}
                  <div className="flex justify-center w-full">
                     <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {
                          toast({ title: "Login Failed", description: "Google authentication failed", variant: "destructive" });
                        }}
                        useOneTap
                        shape="pill"
                        theme="filled_blue"
                        text="continue_with"
                        width="auto"
                      />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted border-dashed" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-zinc-900 px-3 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">University Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@university.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-11 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 transition-all focus:bg-white dark:focus:bg-zinc-900 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] focus:border-primary/30"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                         <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password</Label>
                         <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-11 pr-11 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 transition-all focus:bg-white dark:focus:bg-zinc-900 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] focus:border-primary/30"
                          required
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 group" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Authenticating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Sign In
                          <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-8 duration-500 relative z-10">
                 <div className="mb-8 text-center">
                  <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 animate-pulse-glow">
                     <Lock className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold tracking-tight mb-2">Two-Factor Authentication</h2>
                  <p className="text-sm text-muted-foreground">We've sent a 6-digit code to <br/><span className="font-semibold text-foreground">{tempUser?.email}</span></p>
                </div>
                
                <form onSubmit={handleOTPVerify} className="space-y-6">
                   <div className="space-y-2 flex flex-col items-center">
                      <Label htmlFor="otp" className="text-xs uppercase tracking-wider text-muted-foreground text-center w-full mb-2 font-semibold">Verification Code</Label>
                      <Input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="000000"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          className="text-center text-2xl tracking-[0.5em] font-mono h-14 rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] focus:border-primary/30"
                          required
                        />
                   </div>
                   <Button type="submit" className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-violet-600 hover:opacity-90" disabled={isSubmitting || otpCode.length !== 6}>
                      {isSubmitting ? "Verifying..." : "Verify & Continue"}
                    </Button>

                    <div className="text-center text-sm">
                       <span className="text-muted-foreground">Didn't receive the code? </span>
                       <button type="button" onClick={() => sendOTP(tempUser!.email)} className="text-primary hover:underline font-semibold">Resend</button>
                    </div>
                </form>
              </div>
            )}
            
            {/* Quick Login - Demo Accounts */}
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 relative z-10">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4 text-center font-semibold">Demo Accounts</p>
              <div className={`grid ${slug ? 'grid-cols-3' : 'grid-cols-3'} gap-2`}>
                {[
                  { role: "admin" as const, icon: Settings, label: "Admin", gradient: "hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-200 dark:hover:border-amber-800/50" },
                  { role: "faculty" as const, icon: Users, label: "Faculty", gradient: "hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-200 dark:hover:border-purple-800/50" },
                  { role: "student" as const, icon: GraduationCap, label: "Student", gradient: "hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800/50" },
                ].map(item => (
                  <Button
                    key={item.role}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin(item.role)}
                    className={`flex flex-col items-center gap-2 h-auto py-3 rounded-xl border-zinc-200 dark:border-zinc-800 transition-all duration-300 ${item.gradient}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
