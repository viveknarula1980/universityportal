import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, GraduationCap, Users, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Login successful!",
        description: "Welcome back!",
      });
      
      // Navigate based on user role
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role === "student") {
        navigate("/student");
      } else if (user.role === "faculty") {
        navigate("/faculty");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (role: "student" | "faculty" | "admin") => {
    const credentials: Record<string, { email: string; password: string }> = {
      student: { email: "student@university.edu", password: "student123" },
      faculty: { email: "faculty@university.edu", password: "faculty123" },
      admin: { email: "admin@university.edu", password: "admin123" },
    };

    const creds = credentials[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">EduChain</h1>
          <p className="text-muted-foreground">AI-Transparent University Portal</p>
        </div>

        {/* Login Form */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold mb-2">Sign In</h2>
            <p className="text-muted-foreground">Enter your credentials to access your portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Quick Login (Development Only) */}
          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 text-center">Quick Login (Demo)</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("student")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs">Student</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("faculty")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Users className="w-4 h-4" />
                <span className="text-xs">Faculty</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("admin")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs">Admin</span>
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => navigate("/")}
              className="text-sm"
            >
              ← Back to Portal Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

