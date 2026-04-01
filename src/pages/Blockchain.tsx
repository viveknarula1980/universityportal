import { useState, useEffect } from "react";
import { 
  Link2, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Search,
  FileText,
  Loader2,
  GraduationCap
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Submission {
  id: string;
  assignment_title?: string;
  assignmentTitle?: string;
  course: string;
  timestamp?: number;
  created_at?: number;
  blockchain_hash?: string;
  blockchainHash?: string;
  ai_usage_type?: "none" | "partial" | "full";
  aiUsageType?: "none" | "partial" | "full";
  ai_token_count?: number;
  aiTokenCount?: number;
  file_hash?: string;
  fileHash?: string;
  status?: string;
}

interface Certificate {
  id: string;
  student_name: string;
  student_id?: string;
  degree_name: string;
  degree_type: string;
  issue_date: number;
  created_at?: number;
  blockchain_hash?: string;
  data_hash?: string;
  revocation_status: number;
  block_number?: number;
  blockchain_timestamp?: number;
}

export default function Blockchain() {
  const [search, setSearch] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user) {
      loadBlockchainData();
    }
  }, [user]);

  const loadBlockchainData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // Admin sees certificate blockchain records
        const response = await apiService.getCertificateBlockchainRecords();
        if (response.success && response.data) {
          const certsData = Array.isArray(response.data) ? response.data : [];
          const verifiedCerts = certsData.filter((c: any) => 
            c.blockchain_hash || c.data_hash
          );
          setCertificates(verifiedCerts);
          setSubmissions([]);
        } else {
          setCertificates([]);
        }
      } else {
        // Faculty and Students see assignment submissions
        let response;
        if (user?.role === 'faculty') {
          response = await apiService.getFacultySubmissions({});
        } else {
          response = await apiService.getSubmissions();
        }
        
        if (response.success) {
          let submissionsData: any[] = [];
          
          if (Array.isArray(response.data)) {
            submissionsData = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (Array.isArray(response.data.submissions)) {
              submissionsData = response.data.submissions;
            } else if (Array.isArray(response.data.data)) {
              submissionsData = response.data.data;
            } else {
              const arrayValue = Object.values(response.data).find(v => Array.isArray(v));
              if (arrayValue) {
                submissionsData = arrayValue as any[];
              }
            }
          }
          
          const verifiedSubmissions = submissionsData.filter((s: any) => {
            const hash = s.blockchain_hash || s.blockchainHash;
            return hash && hash.trim() !== '';
          });
          
          setSubmissions(verifiedSubmissions);
          setCertificates([]);
          
          if (verifiedSubmissions.length === 0 && submissionsData.length > 0) {
            toast({
              title: "No verified submissions",
              description: `Found ${submissionsData.length} submission(s) but none are verified on the blockchain yet.`,
              variant: "default",
            });
          }
        } else {
          setSubmissions([]);
        }
      }
    } catch (error) {
      console.error("Failed to load blockchain data:", error);
      toast({
        title: "Error",
        description: "Failed to load blockchain records",
        variant: "destructive",
      });
      setSubmissions([]);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(
    (s) => {
      const title = s.assignment_title || s.assignmentTitle || "";
      const hash = s.blockchain_hash || s.blockchainHash || "";
      const courseName = s.course || "";
      const searchLower = search.toLowerCase();
      return (
        title.toLowerCase().includes(searchLower) ||
        hash.toLowerCase().includes(searchLower) ||
        courseName.toLowerCase().includes(searchLower)
      );
    }
  );

  const filteredCertificates = certificates.filter(
    (c) => {
      const degreeName = c.degree_name || "";
      const studentName = c.student_name || "";
      const studentId = c.student_id || "";
      const hash = c.blockchain_hash || c.data_hash || "";
      const searchLower = search.toLowerCase();
      return (
        degreeName.toLowerCase().includes(searchLower) ||
        studentName.toLowerCase().includes(searchLower) ||
        studentId.toLowerCase().includes(searchLower) ||
        hash.toLowerCase().includes(searchLower)
      );
    }
  );

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({
      title: "Hash copied!",
      description: "Transaction hash copied to clipboard.",
    });
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) return "N/A";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  };

  // Stats for admin (certificates) vs others (submissions)
  const verifiedCount = isAdmin ? certificates.length : submissions.length;
  const aiDeclaredCount = isAdmin ? 0 : submissions.filter(s => {
    const aiType = s.ai_usage_type || s.aiUsageType;
    return aiType && aiType !== "none";
  }).length;
  const activeCertificates = isAdmin 
    ? certificates.filter(c => !c.revocation_status || c.revocation_status === 0).length 
    : 0;
  const lastVerification = isAdmin 
    ? (certificates.length > 0 
        ? getTimeAgo(certificates[0].created_at || certificates[0].issue_date || 0)
        : "Never")
    : (submissions.length > 0 
        ? getTimeAgo(submissions[0].timestamp || submissions[0].created_at || 0)
        : "Never");

  const getBlockchainExplorerUrl = (hash: string) => {
    // Amoy testnet explorer
    return `https://amoy.polygonscan.com/tx/${hash}`;
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blockchain-secondary flex items-center justify-center">
              <Link2 className="w-6 h-6 text-blockchain" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Blockchain Verification</h1>
              <p className="text-muted-foreground">
                {isAdmin 
                  ? "Immutable records of issued certificates"
                  : "Immutable records of your academic submissions"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blockchain-secondary flex items-center justify-center">
                <Shield className="w-5 h-5 text-blockchain" />
              </div>
              <span className="text-sm text-muted-foreground">
                {isAdmin ? "Verified Certificates" : "Verified Submissions"}
              </span>
            </div>
            <p className="text-3xl font-display font-bold">{verifiedCount}</p>
          </div>
          
          {!isAdmin && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-ai-secondary flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-ai" />
                </div>
                <span className="text-sm text-muted-foreground">AI Declarations</span>
              </div>
              <p className="text-3xl font-display font-bold">{aiDeclaredCount}</p>
            </div>
          )}
          
          {isAdmin && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">Active Certificates</span>
              </div>
              <p className="text-3xl font-display font-bold">{activeCertificates}</p>
            </div>
          )}
          
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Last Verification</span>
            </div>
            <p className="text-xl font-display font-bold">{lastVerification}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isAdmin 
              ? "Search by student, degree, or hash..." 
              : "Search by title, course, or hash..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Verified Records - Certificates for Admin, Submissions for Others */}
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold">Verified Records</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : isAdmin ? (
            // Admin: Show Certificates
            filteredCertificates.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-2xl">
                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {certificates.length === 0 
                    ? "No certificates issued yet. Issue a certificate to see it here!"
                    : "No certificates match your search."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCertificates.map((cert, index) => (
                  <div
                    key={cert.id}
                    className="glass-card rounded-2xl p-6 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blockchain-secondary flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-6 h-6 text-blockchain" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold">
                              {cert.degree_type} in {cert.degree_name}
                            </h3>
                            {(!cert.revocation_status || cert.revocation_status === 0) && (
                              <Badge className="bg-success/10 text-success border-0">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            {cert.revocation_status === 1 && (
                              <Badge className="bg-destructive/10 text-destructive border-0">
                                Revoked
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {cert.student_name} {cert.student_id && `(${cert.student_id})`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(cert.issue_date || cert.created_at || 0)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {(() => {
                          const hash = cert.blockchain_hash || cert.data_hash;
                          return hash && (
                            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                              <code className="text-xs font-mono">
                                {hash.slice(0, 10)}...{hash.slice(-6)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyHash(hash)}
                                title="Copy hash"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => window.open(getBlockchainExplorerUrl(hash), '_blank')}
                                title="View on Polygonscan"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Faculty/Student: Show Submissions
            filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-2xl">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {submissions.length === 0 
                    ? "No submissions yet. Submit an assignment to see it here!"
                    : "No submissions match your search."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="glass-card rounded-2xl p-6 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blockchain-secondary flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-blockchain" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold">
                              {submission.assignment_title || submission.assignmentTitle || "Untitled Assignment"}
                            </h3>
                            {(submission.blockchain_hash || submission.blockchainHash) && (
                              <Badge className="bg-success/10 text-success border-0">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{submission.course || "General"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(submission.timestamp || submission.created_at || 0)}
                          </div>
                          {(submission.ai_token_count || submission.aiTokenCount || 0) > 0 && (
                            <div className="text-xs text-muted-foreground">
                              AI Tokens: {(submission.ai_token_count || submission.aiTokenCount || 0).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {(() => {
                          const aiType = submission.ai_usage_type || submission.aiUsageType;
                          return aiType && aiType !== "none" && (
                            <Badge className="bg-ai-secondary text-ai border-0">
                              AI {aiType === "full" ? "Generated" : "Assisted"}
                            </Badge>
                          );
                        })()}
                        
                        {(() => {
                          const hash = submission.blockchain_hash || submission.blockchainHash;
                          return hash && (
                            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                              <code className="text-xs font-mono">
                                {hash.slice(0, 10)}...{hash.slice(-6)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyHash(hash)}
                                title="Copy hash"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => window.open(getBlockchainExplorerUrl(hash), '_blank')}
                                title="View on Polygonscan"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Info Card */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blockchain-secondary/50 to-ai-secondary/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blockchain flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-blockchain-glow" />
            </div>
            <div>
              <h3 className="font-display font-semibold mb-2">How Blockchain Verification Works</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isAdmin 
                  ? "Each certificate is hashed and recorded on an immutable blockchain ledger (Amoy Testnet). This creates a tamper-proof record of issued certificates, including timestamps and revocation status. Anyone can verify the authenticity of any certificate using the unique transaction hash. Click the external link icon to view transactions on Polygonscan."
                  : "Each submission is hashed and recorded on an immutable blockchain ledger (Amoy Testnet). This creates a tamper-proof record of your work, including timestamps and AI usage declarations. Faculty and institutions can verify the authenticity and integrity of any submission using the unique transaction hash. Click the external link icon to view transactions on Polygonscan."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
