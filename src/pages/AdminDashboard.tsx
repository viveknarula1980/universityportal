import { useState, useEffect } from "react";
import {
  Settings,
  GraduationCap,
  Users,
  Shield,
  Award,
  CheckCircle2,
  X,
  Plus,
  Search,
  Loader2
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
import { apiService } from "@/services/api";

interface Certificate {
  id: string;
  student_name: string;
  student_id?: string;
  degree_name: string;
  degree_type: string;
  issue_date: number;
  blockchain_hash: string;
  revocation_status: number;
}

interface AILimit {
  id: string;
  user_id: string;
  student_id?: string;
  student_name?: string;
  student_email?: string;
  tokens_per_semester: number;
  context_window: number;
  semester: string;
  used_tokens?: number;
}

interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  blockchain_hash?: string;
  details?: string;
  timestamp: number;
}

interface Stats {
  totalCertificates: number;
  activeCertificates: number;
  studentsWithAI: number;
  blockchainRecords: number;
}

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [newTokenLimit, setNewTokenLimit] = useState("80000");
  const [newContextWindow, setNewContextWindow] = useState("4096");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [aiLimits, setAILimits] = useState<AILimit[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCertificates: 0,
    activeCertificates: 0,
    studentsWithAI: 0,
    blockchainRecords: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingLimits, setUpdatingLimits] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsResponse = await apiService.getAdminStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Load certificates
      const certsResponse = await apiService.getCertificates();
      if (certsResponse.success && certsResponse.data) {
        setCertificates(Array.isArray(certsResponse.data) ? certsResponse.data : []);
      }

      // Load AI limits
      const limitsResponse = await apiService.getAILimits();
      if (limitsResponse.success && limitsResponse.data) {
        setAILimits(Array.isArray(limitsResponse.data) ? limitsResponse.data : []);
      }

      // Load audit logs
      const logsResponse = await apiService.getAuditLogs(50);
      if (logsResponse.success && logsResponse.data) {
        setAuditLogs(Array.isArray(logsResponse.data) ? logsResponse.data : []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCertificate = async (certificateId: string) => {
    try {
      const response = await apiService.revokeCertificate(certificateId);
      if (response.success) {
        toast({
          title: "Certificate Revoked",
          description: `Certificate ${certificateId} has been revoked.`,
        });
        loadDashboardData(); // Reload data
      }
    } catch (error: any) {
      console.error("Failed to revoke certificate:", error);
      toast({
        title: "Error",
        description: error.error || "Failed to revoke certificate",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAILimits = async () => {
    if (!newTokenLimit || !newContextWindow) {
      toast({
        title: "Error",
        description: "Please enter both token limit and context window",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingLimits(true);
      const response = await apiService.updateAILimits({
        tokensPerSemester: parseInt(newTokenLimit),
        contextWindow: parseInt(newContextWindow),
      });
      
      if (response.success) {
        toast({
          title: "AI Limits Updated",
          description: response.message || "New limits have been applied to all students.",
        });
        loadDashboardData(); // Reload data
      }
    } catch (error: any) {
      console.error("Failed to update AI limits:", error);
      toast({
        title: "Error",
        description: error.error || "Failed to update AI limits",
        variant: "destructive",
      });
    } finally {
      setUpdatingLimits(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const filteredCertificates = certificates.filter(
    (c) =>
      c.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.degree_name?.toLowerCase().includes(search.toLowerCase())
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Total Certificates</span>
              </div>
              <p className="text-3xl font-display font-bold">{stats.totalCertificates}</p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">Active Certificates</span>
              </div>
              <p className="text-3xl font-display font-bold">{stats.activeCertificates}</p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-ai-secondary flex items-center justify-center">
                  <Users className="w-5 h-5 text-ai" />
                </div>
                <span className="text-sm text-muted-foreground">Students with AI Access</span>
              </div>
              <p className="text-3xl font-display font-bold">{stats.studentsWithAI}</p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blockchain-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blockchain" />
                </div>
                <span className="text-sm text-muted-foreground">Blockchain Records</span>
              </div>
              <p className="text-3xl font-display font-bold">{stats.blockchainRecords.toLocaleString()}</p>
            </div>
          </div>
        )}

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
              
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading certificates...</div>
              ) : filteredCertificates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {certificates.length === 0 
                      ? "No certificates issued yet. Issue your first certificate to get started."
                      : "No certificates match your search."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCertificates.map((certificate, index) => {
                    const isActive = certificate.revocation_status === 0;
                    return (
                      <div
                        key={certificate.id}
                        className={cn(
                          "p-6 rounded-xl border transition-all hover:shadow-lg",
                          isActive
                            ? "bg-success/5 border-success/20"
                            : "bg-destructive/5 border-destructive/20"
                        )}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display font-semibold">{certificate.degree_name}</h3>
                              <Badge
                                variant={isActive ? "success" : "destructive"}
                                className={cn(
                                  isActive
                                    ? "bg-success/10 text-success border-0"
                                    : "bg-destructive/10 text-destructive border-0"
                                )}
                              >
                                {isActive ? (
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                ) : (
                                  <X className="w-3 h-3 mr-1" />
                                )}
                                {isActive ? "active" : "revoked"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {certificate.student_name} {certificate.student_id ? `(${certificate.student_id})` : ''}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Issued: {formatDate(certificate.issue_date)}</span>
                              {certificate.blockchain_hash && (
                                <span className="font-mono">
                                  {certificate.blockchain_hash.slice(0, 16)}...{certificate.blockchain_hash.slice(-8)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isActive && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRevokeCertificate(certificate.id)}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Revoke
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/verify/${certificate.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

              <Button 
                onClick={handleUpdateAILimits} 
                variant="gradient"
                disabled={updatingLimits}
              >
                {updatingLimits ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Update AI Limits
                  </>
                )}
              </Button>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-display font-semibold mb-6">Student AI Usage</h2>
              
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading AI limits...</div>
              ) : aiLimits.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No AI limits configured yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiLimits.map((limit) => {
                    const usedTokens = limit.used_tokens || 0;
                    const usagePercent = (usedTokens / limit.tokens_per_semester) * 100;
                    return (
                      <div
                        key={limit.id}
                        className="p-6 rounded-xl border border-border bg-secondary/30"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-medium">
                              {limit.student_name || `User ${limit.user_id}`}
                              {limit.student_id && ` (${limit.student_id})`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {usedTokens.toLocaleString()} / {limit.tokens_per_semester.toLocaleString()} tokens used
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
                          Context Window: {limit.context_window} tokens | Semester: {limit.semester}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-display font-semibold mb-6">Audit Log</h2>
              
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No audit logs found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
                    <div
                      key={log.id || index}
                      className="p-4 rounded-xl border border-border bg-secondary/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            {log.user_name && (
                              <Badge variant="outline" className="text-xs">
                                {log.user_name} ({log.user_role || 'user'})
                              </Badge>
                            )}
                          </div>
                          {log.target_id && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Target: {log.target_id} {log.details ? `- ${log.details}` : ''}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</p>
                          {log.blockchain_hash && (
                            <p className="text-xs font-mono text-muted-foreground mt-2 break-all">
                              Hash: {log.blockchain_hash}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
