import { useState } from "react";
import { 
  Link2, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Search,
  FileText
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const verifiedSubmissions = [
  {
    id: "1",
    title: "Database Design Essay",
    course: "CS 3200 - Databases",
    submittedAt: "Jan 12, 2026 - 14:32 UTC",
    hash: "0x7f2d8a9c3e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d",
    aiDeclared: true,
    verified: true,
  },
  {
    id: "2",
    title: "Algorithm Analysis",
    course: "CS 3100 - Algorithms",
    submittedAt: "Jan 8, 2026 - 09:15 UTC",
    hash: "0x3a9c7e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d2a8c",
    aiDeclared: false,
    verified: true,
  },
  {
    id: "3",
    title: "Software Engineering Plan",
    course: "CS 4000 - Software Engineering",
    submittedAt: "Jan 3, 2026 - 16:45 UTC",
    hash: "0x1f3d5a7e9b1c3e5a7d9b1f3d5a7e9c1b3e5a7d9f",
    aiDeclared: true,
    verified: true,
  },
];

export default function Blockchain() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filteredSubmissions = verifiedSubmissions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.hash.toLowerCase().includes(search.toLowerCase())
  );

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({
      title: "Hash copied!",
      description: "Transaction hash copied to clipboard.",
    });
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
            <p className="text-3xl font-display font-bold">6</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-ai-secondary flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-ai" />
              </div>
              <span className="text-sm text-muted-foreground">AI Declarations</span>
            </div>
            <p className="text-3xl font-display font-bold">4</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Last Verification</span>
            </div>
            <p className="text-xl font-display font-bold">2 hours ago</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Verified Submissions */}
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold">Verified Records</h2>
          
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
                        <h3 className="font-display font-semibold">{submission.title}</h3>
                        {submission.verified && (
                          <Badge className="bg-success/10 text-success border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{submission.course}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {submission.submittedAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {submission.aiDeclared && (
                      <Badge className="bg-ai-secondary text-ai border-0">
                        AI Declared
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                      <code className="text-xs font-mono">
                        {submission.hash.slice(0, 10)}...{submission.hash.slice(-6)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyHash(submission.hash)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                Each submission is hashed and recorded on an immutable blockchain ledger. 
                This creates a tamper-proof record of your work, including timestamps and 
                AI usage declarations. Faculty and institutions can verify the authenticity 
                and integrity of any submission using the unique transaction hash.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
