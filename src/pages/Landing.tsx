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
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "student",
    title: "Student Portal",
    description: "Submit assignments, use AI tools, and track your academic progress",
    icon: GraduationCap,
    path: "/student",
    features: [
      "Submit assignments with AI declaration",
      "Track AI usage and quotas",
      "View blockchain-verified submissions",
      "Access AI content generator",
    ],
    color: "from-primary to-accent",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    id: "faculty",
    title: "Faculty Portal",
    description: "Review submissions, track AI usage, and grade student work",
    icon: Users,
    path: "/faculty",
    features: [
      "View all student submissions",
      "See AI usage percentages",
      "Grade assignments",
      "Access immutable timestamps",
    ],
    color: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: "admin",
    title: "Admin Portal",
    description: "Manage certificates, configure AI limits, and audit system records",
    icon: Settings,
    path: "/admin",
    features: [
      "Issue and revoke certificates",
      "Configure AI token limits",
      "View audit logs",
      "Manage system settings",
    ],
    color: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: "verify",
    title: "Certificate Verification",
    description: "Public portal to verify certificate authenticity (No login required)",
    icon: Shield,
    path: "/verify",
    features: [
      "Verify certificates instantly",
      "Scan QR codes",
      "Check revocation status",
      "No account needed",
    ],
    color: "from-blockchain to-blockchain-glow",
    iconBg: "bg-blockchain-secondary",
    iconColor: "text-blockchain",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // If user is already logged in, redirect to their portal
  if (isAuthenticated && user) {
    if (user.role === "student") {
      navigate("/student");
    } else if (user.role === "faculty") {
      navigate("/faculty");
    } else if (user.role === "admin") {
      navigate("/admin");
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">EduChain</h1>
              <p className="text-xs text-muted-foreground">AI + Blockchain</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/verify")}>
            <Shield className="w-4 h-4 mr-2" />
            Verify Certificate
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ai-secondary border border-ai/20 mb-4">
            <Sparkles className="w-4 h-4 text-ai" />
            <span className="text-sm font-medium text-ai">AI-Transparent University Portal</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-r from-primary via-accent to-ai bg-clip-text text-transparent">
            Choose Your Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Access your dedicated portal based on your role. Each portal provides specialized tools
            and features for students, faculty, and administrators.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className={cn(
                  "glass-card rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer group",
                  "hover:border-primary/50"
                )}
                onClick={() => navigate(role.path)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                    role.iconBg
                  )}>
                    <Icon className={cn("w-7 h-7", role.iconColor)} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-display font-bold mb-2">{role.title}</h3>
                    <p className="text-muted-foreground">{role.description}</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="gradient"
                  className={cn(
                    "w-full group-hover:shadow-lg transition-all",
                    `bg-gradient-to-r ${role.color}`
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (role.id === "verify") {
                      navigate(role.path);
                    } else {
                      navigate("/login");
                    }
                  }}
                >
                  Enter Portal
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold mb-3">Key Features</h2>
            <p className="text-muted-foreground">
              Built with blockchain verification and AI transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-ai-secondary flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-ai" />
              </div>
              <h3 className="font-display font-semibold mb-2">AI Transparency</h3>
              <p className="text-sm text-muted-foreground">
                Declare and track AI usage with full transparency
              </p>
            </div>

            <div className="glass-card rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blockchain-secondary flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-6 h-6 text-blockchain" />
              </div>
              <h3 className="font-display font-semibold mb-2">Blockchain Proof</h3>
              <p className="text-sm text-muted-foreground">
                Immutable records of all submissions and certificates
              </p>
            </div>

            <div className="glass-card rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-display font-semibold mb-2">Certificate Verification</h3>
              <p className="text-sm text-muted-foreground">
                Public verification portal for instant certificate validation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p>AI-Transparent University Portal with Blockchain Verification</p>
          <p className="mt-2">© 2026 EduChain. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

