import { useState } from "react";
import {
  Settings,
  GraduationCap,
  Users,
  Shield,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Search
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Certificate {
  id: string;
  studentName: string;
  studentId: string;
  degreeName: string;
  issueDate: string;
  blockchainHash: string;
  status: "active" | "revoked";
}

interface AILimit {
  studentId: string;
  tokensPerSemester: number;
  contextWindow: number;
  usedTokens: number;
}

const mockCertificates: Certificate[] = [
  {
    id: "CERT-1234567890-abc123",
    studentName: "John Doe",
    studentId: "CS2024-0892",
    degreeName: "Bachelor's in Computer Science",
    issueDate: "Jan 15, 2026",
    blockchainHash: "0x7f2d8a9c3e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d",
    status: "active",
  },
  {
    id: "CERT-1234567891-def456",
    studentName: "Jane Smith",
    studentId: "CS2024-0893",
    degreeName: "Master's in Artificial Intelligence",
    issueDate: "Jan 10, 2026",
    blockchainHash: "0x3a9c7e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d2a8c",
    status: "active",
  },
];

const mockAILimits: AILimit[] = [
  {
    studentId: "CS2024-0892",
    tokensPerSemester: 80000,
    contextWindow: 4096,
    usedTokens: 18500,
  },
  {
    studentId: "CS2024-0893",
    tokensPerSemester: 80000,
    contextWindow: 4096,
    usedTokens: 52340,
  },
];

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [newTokenLimit, setNewTokenLimit] = useState("80000");
  const [newContextWindow, setNewContextWindow] = useState("4096");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRevokeCertificate = (certificateId: string) => {
    toast({
      title: "Certificate Revoked",
      description: `Certificate ${certificateId} has been revoked.`,
    });
  };

  const handleUpdateAILimits = () => {
    toast({
      title: "AI Limits Updated",
      description: "New limits have been applied to all students.",
    });
  };

  const filteredCertificates = mockCertificates.filter(
    (c) =>
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.studentId.toLowerCase().includes(search.toLowerCase()) ||
      c.degreeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage certificates, AI limits, and system configuration
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Certificates</span>
            </div>
            <p className="text-3xl font-display font-bold">{mockCertificates.length}</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Active Certificates</span>
            </div>
            <p className="text-3xl font-display font-bold">
              {mockCertificates.filter((c) => c.status === "active").length}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-ai-secondary flex items-center justify-center">
                <Users className="w-5 h-5 text-ai" />
              </div>
              <span className="text-sm text-muted-foreground">Students with AI Access</span>
            </div>
            <p className="text-3xl font-display font-bold">{mockAILimits.length}</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blockchain-secondary flex items-center justify-center">
                <Shield className="w-5 h-5 text-blockchain" />
              </div>
              <span className="text-sm text-muted-foreground">Blockchain Records</span>
            </div>
            <p className="text-3xl font-display font-bold">1,234</p>
          </div>
        </div>

        <Tabs defaultValue="certificates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="ai-limits">AI Limits</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="gradient" onClick={() => navigate("/certificate-issuance")}>
                <Plus className="w-4 h-4 mr-2" />
                Issue New Certificate
              </Button>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-display font-semibold mb-6">Certificate Management</h2>
              
              <div className="space-y-4">
                {filteredCertificates.map((certificate, index) => (
                  <div
                    key={certificate.id}
                    className={cn(
                      "p-6 rounded-xl border transition-all hover:shadow-lg",
                      certificate.status === "active"
                        ? "bg-success/5 border-success/20"
                        : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold">{certificate.degreeName}</h3>
                          <Badge
                            variant={certificate.status === "active" ? "success" : "destructive"}
                            className={cn(
                              certificate.status === "active"
                                ? "bg-success/10 text-success border-0"
                                : "bg-destructive/10 text-destructive border-0"
                            )}
                          >
                            {certificate.status === "active" ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : (
                              <X className="w-3 h-3 mr-1" />
                            )}
                            {certificate.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {certificate.studentName} ({certificate.studentId})
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Issued: {certificate.issueDate}</span>
                          <span className="font-mono">
                            {certificate.blockchainHash.slice(0, 16)}...{certificate.blockchainHash.slice(-8)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {certificate.status === "active" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeCertificate(certificate.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Revoke
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* AI Limits Tab */}
          <TabsContent value="ai-limits" className="space-y-6">
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-display font-semibold mb-2">Configure AI Limits</h2>
                <p className="text-sm text-muted-foreground">
                  Set default AI token quotas and context windows for all students
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tokenLimit">Tokens per Semester</Label>
                  <Input
                    id="tokenLimit"
                    type="number"
                    value={newTokenLimit}
                    onChange={(e) => setNewTokenLimit(e.target.value)}
                    placeholder="80000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total AI tokens available per student per semester
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contextWindow">Context Window</Label>
                  <Input
                    id="contextWindow"
                    type="number"
                    value={newContextWindow}
                    onChange={(e) => setNewContextWindow(e.target.value)}
                    placeholder="4096"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum context window size for AI requests
                  </p>
                </div>
              </div>

              <Button onClick={handleUpdateAILimits} variant="gradient">
                <Settings className="w-4 h-4 mr-2" />
                Update AI Limits
              </Button>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-display font-semibold mb-6">Student AI Usage</h2>
              
              <div className="space-y-4">
                {mockAILimits.map((limit) => {
                  const usagePercent = (limit.usedTokens / limit.tokensPerSemester) * 100;
                  return (
                    <div
                      key={limit.studentId}
                      className="p-6 rounded-xl border border-border bg-secondary/30"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium">Student ID: {limit.studentId}</p>
                          <p className="text-sm text-muted-foreground">
                            {limit.usedTokens.toLocaleString()} / {limit.tokensPerSemester.toLocaleString()} tokens used
                          </p>
                        </div>
                        <Badge variant={usagePercent > 80 ? "destructive" : usagePercent > 50 ? "warning" : "default"}>
                          {usagePercent.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 mb-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            usagePercent > 80
                              ? "bg-destructive"
                              : usagePercent > 50
                              ? "bg-warning"
                              : "bg-primary"
                          )}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Context Window: {limit.contextWindow} tokens
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-display font-semibold mb-6">Audit Log</h2>
              
              <div className="space-y-4">
                {[
                  {
                    action: "Certificate Issued",
                    user: "Admin",
                    target: "CERT-1234567890-abc123",
                    timestamp: "Jan 15, 2026 - 14:32 UTC",
                    blockchainHash: "0x7f2d8a9c3e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d",
                  },
                  {
                    action: "AI Limits Updated",
                    user: "Admin",
                    target: "All Students",
                    timestamp: "Jan 14, 2026 - 10:15 UTC",
                    blockchainHash: null,
                  },
                  {
                    action: "Assignment Submitted",
                    user: "Student (CS2024-0892)",
                    target: "Database Design Essay",
                    timestamp: "Jan 12, 2026 - 14:32 UTC",
                    blockchainHash: "0x3a9c7e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d2a8c",
                  },
                ].map((log, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-border bg-secondary/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.user}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{log.target}</p>
                        <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                        {log.blockchainHash && (
                          <p className="text-xs font-mono text-muted-foreground mt-2">
                            {log.blockchainHash}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

