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
  Loader2
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
  assignment_title: string;
  course: string;
  timestamp: number;
  blockchain_hash: string;
  ai_usage_type: "none" | "partial" | "full";
  ai_token_count: number;
  file_hash: string;
  status: string;
}

export default function Blockchain() {
  const [search, setSearch] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      // Use the student submissions endpoint
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/assignments/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setSubmissions(data.data);
      }
      if (response.success && response.data) {
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load blockchain records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.assignment_title?.toLowerCase().includes(search.toLowerCase()) ||
      s.blockchain_hash?.toLowerCase().includes(search.toLowerCase()) ||
      s.course?.toLowerCase().includes(search.toLowerCase())
  );

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({
      title: "Hash copied!",
      description: "Transaction hash copied to clipboard.",
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
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

  const verifiedCount = submissions.length;
  const aiDeclaredCount = submissions.filter(s => s.ai_usage_type !== "none").length;
  const lastVerification = submissions.length > 0 
    ? getTimeAgo(submissions[0].timestamp)
    : "Never";

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
                Immutable records of your academic submissions
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
              <span className="text-sm text-muted-foreground">Verified Submissions</span>
            </div>
            <p className="text-3xl font-display font-bold">{verifiedCount}</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-ai-secondary flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-ai" />
              </div>
              <span className="text-sm text-muted-foreground">AI Declarations</span>
            </div>
            <p className="text-3xl font-display font-bold">{aiDeclaredCount}</p>
          </div>
          
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
            placeholder="Search by title, course, or hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Verified Submissions */}
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold">Verified Records</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
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
                            {submission.assignment_title || "Untitled Assignment"}
                          </h3>
                          {submission.blockchain_hash && (
                            <Badge className="bg-success/10 text-success border-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{submission.course || "General"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(submission.timestamp)}
                        </div>
                        {submission.ai_token_count > 0 && (
                          <div className="text-xs text-muted-foreground">
                            AI Tokens: {submission.ai_token_count.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {submission.ai_usage_type !== "none" && (
                        <Badge className="bg-ai-secondary text-ai border-0">
                          AI {submission.ai_usage_type === "full" ? "Generated" : "Assisted"}
                        </Badge>
                      )}
                      
                      {submission.blockchain_hash && (
                        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                          <code className="text-xs font-mono">
                            {submission.blockchain_hash.slice(0, 10)}...{submission.blockchain_hash.slice(-6)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyHash(submission.blockchain_hash)}
                            title="Copy hash"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => window.open(getBlockchainExplorerUrl(submission.blockchain_hash), '_blank')}
                            title="View on Polygonscan"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                Each submission is hashed and recorded on an immutable blockchain ledger (Amoy Testnet). 
                This creates a tamper-proof record of your work, including timestamps and 
                AI usage declarations. Faculty and institutions can verify the authenticity 
                and integrity of any submission using the unique transaction hash. Click the external link icon to view transactions on Polygonscan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
