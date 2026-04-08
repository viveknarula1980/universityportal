import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LogIn, Mail, Lock, Settings, Sparkles, CheckCircle2, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, User } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login, sendOTP, verifyOTP, isLoading: isAuthLoading } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  const handleInitialLoginSuccess = async (email: string) => {
    setAuthStep("otp");
    toast({
      title: "OTP Sent",
      description: "Please check your email for the verification code.",
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      
      if (result.requireOTP) {
        await handleInitialLoginSuccess(email);
      } else {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.role !== "admin") {
           toast({
              title: "Access Denied",
              description: "This portal is for administrators only. Your account is registered as " + user.role,
              variant: "destructive",
           });
           logout();
           return;
        }
        proceedToDashboard(user);
      }
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

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await verifyOTP(email, otpCode);
      const verifiedUser = JSON.parse(localStorage.getItem("user") || "{}");
      toast({
        title: "Verification successful!",
        description: "Welcome back, Administrator!",
      });
      proceedToDashboard(verifiedUser);
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
    navigate(`${basePath}/admin`);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual Side */}
      <div className="hidden lg:flex relative bg-zinc-950 flex-col justify-between p-12 text-white overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        
        <div className="relative z-10">
          <button 
            onClick={() => navigate(`${basePath || '/'}`)}
            className="flex items-center gap-2 text-amber-200 hover:text-white transition-colors mb-12 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          
          <div className="flex items-center gap-3 mb-12">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              {localStorage.getItem('logo_url') ? (
                <img src={localStorage.getItem('logo_url') || ''} alt="logo" className="w-6 h-6 object-contain" />
              ) : (
                <Settings className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-xl font-display font-bold text-amber-500">{localStorage.getItem('university_name') || 'Admin Central'}</span>
          </div>

          <div className="space-y-6 mt-20 max-w-md">
            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
              System <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300">
                Administration
              </span>
            </h1>
            <p className="text-lg text-zinc-400">
              Manage university certifications, configure system-wide AI settings, and audit blockchain records.
            </p>
          </div>
        </div>

        <div className="relative z-10 glass-card bg-white/5 border-white/10 rounded-2xl p-6 max-w-sm mt-12 backdrop-blur-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
               <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Elevated Privileges</p>
              <p className="text-xs text-zinc-500">Authorized personnel only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 mb-3">
              {localStorage.getItem('logo_url') ? (
                <img src={localStorage.getItem('logo_url') || ''} alt="logo" className="w-6 h-6 object-contain" />
              ) : (
                <Settings className="w-6 h-6 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-display font-bold">{localStorage.getItem('university_name') || 'Admin Login'}</h1>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            {authStep === "login" ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-display font-bold tracking-tight mb-2">Administrator Sign In</h2>
                  <p className="text-sm text-muted-foreground">Secure access to system controls</p>
                </div>

                <div className="space-y-6">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Admin Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@university.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 transition-all focus:bg-white dark:focus:bg-zinc-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 transition-all focus:bg-white dark:focus:bg-zinc-900"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12 rounded-xl font-medium text-base shadow-lg shadow-primary/20" disabled={isSubmitting}>
                      {isSubmitting ? "Authenticating..." : "Sign In"}
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-8 duration-500">
                 <div className="mb-8 text-center">
                  <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                     <Lock className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-display font-bold tracking-tight mb-2">Admin Verification</h2>
                  <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to your email</p>
                </div>
                
                <form onSubmit={handleOTPVerify} className="space-y-6">
                   <div className="space-y-2 flex flex-col items-center">
                      <Label htmlFor="otp" className="text-xs uppercase tracking-wider text-muted-foreground text-center w-full mb-2">Verification Code</Label>
                      <Input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="000000"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          className="text-center text-2xl tracking-[0.5em] font-mono h-14 rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                          required
                        />
                   </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-medium shadow-lg shadow-primary/20" disabled={isSubmitting || otpCode.length !== 6}>
                      {isSubmitting ? "Verifying..." : "Verify & Continue"}
                    </Button>
                </form>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
               <p className="text-xs text-muted-foreground">
                 Unauthorized access attempt is logged and reported.
               </p>
               <button onClick={() => navigate(`${basePath || '/'}`)} className="mt-4 text-xs text-amber-600 hover:underline">Return to Home</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
