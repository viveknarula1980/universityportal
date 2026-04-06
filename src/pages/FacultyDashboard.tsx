import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Sparkles,
  Clock,
  CheckCircle2,
  Search,
  Eye,
  Award,
  Download,
  X,
  Link2
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import { FacultyAILab } from "@/components/dashboard/FacultyAILab";
import { FacultyRiskAnalytics } from "@/components/dashboard/FacultyRiskAnalytics";

interface Submission {
  id: string;
  student_name: string;
  student_id: string;
  assignment_title: string;
  course: string;
  timestamp: number;
  file_hash: string;
  ai_usage_type: "none" | "partial" | "full";
  ai_token_count: number;
  blockchain_hash: string;
  status: "pending" | "graded";
  grade?: string;
  file_path?: string;
  student_email?: string;
}

export default function FacultyDashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pending: 0,
    aiAssisted: 0,
    averageGrade: "N/A",
  });
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
  }, [filter, selectedCourse, search]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFacultySubmissions({
        status: filter === "all" ? undefined : filter,
        course: selectedCourse === "all" ? undefined : selectedCourse,
        search: search || undefined,
      });

      if (response.success && response.data) {
        const data = response.data as any;
        // Handle both array format (old) and object format (new with stats)
        if (Array.isArray(data)) {
          setSubmissions(data);
          // Calculate stats from submissions if not provided
          setStats({
            totalSubmissions: data.length,
            pending: data.filter((s: Submission) => s.status === 'pending').length,
            aiAssisted: data.filter((s: Submission) => s.ai_usage_type && s.ai_usage_type !== 'none').length,
            averageGrade: 'N/A', // Will calculate if needed
          });
        } else {
          setSubmissions(data.submissions || []);
          if (data.stats) {
            setStats(data.stats);
          } else {
            // Calculate stats from submissions if not provided
            const subs = data.submissions || [];
            setStats({
              totalSubmissions: subs.length,
              pending: subs.filter((s: Submission) => s.status === 'pending').length,
              aiAssisted: subs.filter((s: Submission) => s.ai_usage_type && s.ai_usage_type !== 'none').length,
              averageGrade: 'N/A',
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (submissionId: string) => {
    try {
      const response = await apiService.getSubmissionDetails(submissionId);
      if (response.success && response.data) {
        setSelectedSubmission(response.data as Submission);
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error("Failed to load submission details:", error);
      toast({
        title: "Error",
        description: "Failed to load submission details",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (submissionId: string) => {
    try {
      await apiService.downloadSubmissionFile(submissionId);
      toast({
        title: "Success",
        description: "File download started",
      });
    } catch (error) {
      console.error("Failed to download file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleGrade = async (submissionId: string) => {
    if (!gradeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a grade",
        variant: "destructive",
      });
      return;
    }

    try {
      setGradingSubmission(submissionId);
      const response = await apiService.gradeSubmission(submissionId, gradeInput.trim());
      if (response.success) {
        toast({
          title: "Success",
          description: "Submission graded successfully",
        });
        setGradeInput("");
        setGradingSubmission(null);
        loadSubmissions();
      }
    } catch (error: any) {
      console.error("Failed to grade submission:", error);
      toast({
        title: "Error",
        description: error.error || "Failed to grade submission",
        variant: "destructive",
      });
    } finally {
      setGradingSubmission(null);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.assignment_title?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getAIUsageBadge = (type: "none" | "partial" | "full") => {
    const config = {
      none: { label: "No AI", variant: "default" as const },
      partial: { label: "Partial AI", variant: "secondary" as const },
      full: { label: "Full AI", variant: "ai" as const },
    };
    const { label, variant } = config[type];
    return <Badge variant={variant}>{label}</Badge>;
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

  const getBlockchainExplorerUrl = (hash: string) => {
    return `https://amoy.polygonscan.com/tx/${hash}`;
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Faculty Dashboard</h1>
              <p className="text-muted-foreground">
                Review submissions and track student progress
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Submissions</span>
            </div>
            <p className="text-3xl font-display font-bold">{stats.totalSubmissions}</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <span className="text-sm text-muted-foreground">Pending Review</span>
            </div>
            <p className="text-3xl font-display font-bold">{stats.pending}</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-ai-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-ai" />
              </div>
              <span className="text-sm text-muted-foreground">AI Assisted</span>
            </div>
            <p className="text-3xl font-display font-bold">{stats.aiAssisted}</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Average Grade</span>
            </div>
            <p className="text-3xl font-display font-bold">{stats.averageGrade}</p>
          </div>
        </div>

        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="ai-lab">AI Assignment Lab</TabsTrigger>
            <TabsTrigger value="risk-analytics">Risk Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by student, assignment, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {Array.from(new Set(submissions.map(s => s.course))).map(course => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            {["all", "pending", "graded"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-display font-semibold mb-6">Submissions</h2>
          
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className={cn(
                    "p-6 rounded-xl border transition-all hover:shadow-lg",
                    submission.status === "pending"
                      ? "bg-warning/5 border-warning/20"
                      : "bg-secondary/30 border-border"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-display font-semibold">{submission.assignment_title}</h3>
                            {getAIUsageBadge(submission.ai_usage_type)}
                            {submission.status === "graded" && submission.grade && (
                              <Badge variant="success" className="bg-success/10 text-success border-0">
                                {submission.grade}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{submission.course}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {submission.student_name} ({submission.student_id})
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(submission.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {submission.ai_usage_type !== "none" && (
                        <div className="flex items-center gap-2 p-2 bg-ai-secondary/30 rounded-lg">
                          <Sparkles className="w-4 h-4 text-ai" />
                          <span className="text-xs text-muted-foreground">
                            AI Tokens Used: <span className="font-medium">{submission.ai_token_count.toLocaleString()}</span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 p-2 bg-blockchain-secondary/30 rounded-lg">
                        <span className="text-xs font-mono text-muted-foreground">
                          Hash: {submission.blockchain_hash?.slice(0, 16)}...{submission.blockchain_hash?.slice(-8)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(submission.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {submission.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Grade"
                            value={gradeInput}
                            onChange={(e) => setGradeInput(e.target.value)}
                            className="w-20 h-9"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleGrade(submission.id);
                              }
                            }}
                          />
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleGrade(submission.id)}
                            disabled={gradingSubmission === submission.id}
                          >
                            <Award className="w-4 h-4 mr-2" />
                            {gradingSubmission === submission.id ? "Grading..." : "Grade"}
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
          </TabsContent>

          <TabsContent value="ai-lab">
            <FacultyAILab />
          </TabsContent>

          <TabsContent value="risk-analytics">
            <FacultyRiskAnalytics />
          </TabsContent>
        </Tabs>
      </div>

      {/* Submission Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Submission Details</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-semibold mb-3">Student Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedSubmission.student_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student ID:</span>
                    <span className="font-medium">{selectedSubmission.student_id}</span>
                  </div>
                  {selectedSubmission.student_email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedSubmission.student_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Info */}
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-semibold mb-3">Assignment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span className="font-medium">{selectedSubmission.assignment_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course:</span>
                    <span className="font-medium">{selectedSubmission.course}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="font-medium">{formatDate(selectedSubmission.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={selectedSubmission.status === "graded" ? "success" : "warning"}>
                      {selectedSubmission.status}
                    </Badge>
                  </div>
                  {selectedSubmission.grade && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grade:</span>
                      <Badge variant="success" className="font-bold">{selectedSubmission.grade}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Usage */}
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-semibold mb-3">AI Usage Declaration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">AI Usage Type:</span>
                    {getAIUsageBadge(selectedSubmission.ai_usage_type)}
                  </div>
                  {selectedSubmission.ai_usage_type !== "none" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Tokens Used:</span>
                      <span className="font-medium">{selectedSubmission.ai_token_count.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Blockchain Info */}
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-semibold mb-3">Blockchain Verification</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">File Hash:</span>
                    <code className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                      {selectedSubmission.file_hash}
                    </code>
                  </div>
                  {selectedSubmission.blockchain_hash && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Blockchain Hash:</span>
                        <code className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                          {selectedSubmission.blockchain_hash}
                        </code>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedSubmission.blockchain_hash);
                            toast({
                              title: "Copied!",
                              description: "Hash copied to clipboard",
                            });
                          }}
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          Copy Hash
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getBlockchainExplorerUrl(selectedSubmission.blockchain_hash), '_blank')}
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          View on Polygonscan
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* File Download */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="default"
                  onClick={() => {
                    handleDownloadFile(selectedSubmission.id);
                    setIsDetailsOpen(false);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Submission File
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
