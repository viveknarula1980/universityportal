import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, GraduationCap, Users, Settings, Sparkles, CheckCircle2 } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login, loginWithGoogle, sendOTP, verifyOTP, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleInitialLoginSuccess = async (user: User) => {
    setTempUser(user);
    if (!user.isVerified) {
      // Need OTP
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
      // Already verified
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
        // Defaulting to student for new Google sign-ins logic is handled in backend
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
      navigate("/student");
    } else if (user.role === "faculty") {
      navigate("/faculty");
    } else if (user.role === "admin") {
      navigate("/admin");
    } else if (user.role === "super_admin") {
      navigate("/superadmin");
    } else {
      navigate("/");
    }
  };

  const quickLogin = (role: "student" | "faculty" | "admin" | "super_admin") => {
    const credentials: Record<string, { email: string; password: string }> = {
      student: { email: "student@university.edu", password: "student123" },
      faculty: { email: "faculty@university.edu", password: "faculty123" },
      admin: { email: "admin@university.edu", password: "admin123" },
      super_admin: { email: "superadmin@university.edu", password: "superadmin123" },
    };

    const creds = credentials[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual Side (Hidden on Mobile) */}
      <div className="hidden lg:flex relative bg-zinc-950 flex-col justify-between p-12 text-white overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent">
              {localStorage.getItem('logo_url') ? (
                <img src={localStorage.getItem('logo_url') || ''} alt="logo" className="w-6 h-6 object-contain" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <span className="text-xl font-display font-bold">{localStorage.getItem('university_name') || 'EduChain University'}</span>
          </div>

          <div className="space-y-6 mt-20 max-w-md">
            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
              The Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Academic Integrity
              </span>
            </h1>
            <p className="text-lg text-zinc-400">
              Access your courses, submit AI-verified assignments, and manage your blockchain-secured diplomas in one portal.
            </p>
          </div>
        </div>

        <div className="relative z-10 glass-card bg-white/5 border-white/10 rounded-2xl p-6 max-w-sm mt-12 backdrop-blur-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
               <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Enterprise Security</p>
              <p className="text-xs text-zinc-400">Google OAuth & 2FA enabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mb-3">
              {localStorage.getItem('logo_url') ? (
                <img src={localStorage.getItem('logo_url') || ''} alt="logo" className="w-6 h-6 object-contain" />
              ) : (
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
            <h1 className="text-2xl font-display font-bold">{localStorage.getItem('university_name') || 'EduChain'}</h1>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            {authStep === "login" ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                      <span className="bg-white dark:bg-zinc-900 px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">University Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@university.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 transition-all focus:bg-white dark:focus:bg-zinc-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                         <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                         <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                      </div>
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
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                     <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold tracking-tight mb-2">Two-Factor Authentication</h2>
                  <p className="text-sm text-muted-foreground">We've sent a 6-digit code to <br/><span className="font-medium text-foreground">{tempUser?.email}</span></p>
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

                    <div className="text-center text-sm">
                       <span className="text-muted-foreground">Didn't receive the code? </span>
                       <button type="button" onClick={() => sendOTP(tempUser!.email)} className="text-primary hover:underline font-medium">Resend</button>
                    </div>
                </form>
              </div>
            )}
            
            {/* Quick Login (Development Only) */}
            <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4 text-center">Demo Accounts</p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("admin")}
                  className="flex flex-col items-center gap-2 h-auto py-3 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-xs font-medium">Admin</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("faculty")}
                  className="flex flex-col items-center gap-2 h-auto py-3 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Faculty</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("student")}
                  className="flex flex-col items-center gap-2 h-auto py-3 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-xs font-medium">Student</span>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
