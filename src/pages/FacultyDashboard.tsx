import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Link2,
  Building2,
  Plus,
  BookOpen,
  CalendarDays,
  Loader2
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Extract slug for URL management
  const pathParts = location.pathname.split('/');
  const currentSlug = (pathParts[1] === 'p' && pathParts[2]) ? pathParts[2] : (localStorage.getItem('university_slug') || '');
  const basePath = currentSlug ? `/p/${currentSlug}` : '';

  // Determine active tab based on path
  const getActiveTab = () => {
    if (location.pathname.includes('/submissions')) return 'submissions';
    if (location.pathname.includes('/students')) return 'students';
    if (location.pathname.includes('/ai-lab')) return 'ai-lab';
    if (location.pathname.includes('/risk-analytics')) return 'risk-analytics';
    if (location.pathname.includes('/create-assignment')) return 'create-assignment';
    return 'overview'; // Default for /faculty
  };

  const activeTab = getActiveTab();
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");

  const getFileUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith('http') ? path : `${API_URL.replace('/api', '')}${path}`;
  };
    const newPath = value === 'overview' ? `${basePath}/faculty` : `${basePath}/faculty/${value}`;
    navigate(newPath);
  };

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
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [newAssignment, setNewAssignment] = useState({ title: "", course: "", dueDate: "" });
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
    loadAssignments();
    loadStudents();
  }, [filter, selectedCourse, search]);

  const loadStudents = async () => {
    try {
      const response = await apiService.getFacultyStudents();
      if (response.success && response.data) {
        setStudents(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await apiService.getAssignments();
      if (response.success && response.data) {
        setAssignments(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
    }
  };

  const handlePublishAssignment = async (id: string) => {
    try {
      const response = await apiService.publishAssignment(id);
      if (response.success) {
        toast({ title: "Assignment Published", description: "The assignment is now visible to students." });
        loadAssignments();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to publish", variant: "destructive" });
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingAssignment(true);
    try {
      const response = await apiService.createAssignment(newAssignment);
      if (response.success) {
        toast({ title: "Assignment Created", description: `"${newAssignment.title}" has been assigned to your department.` });
        setNewAssignment({ title: "", course: "", dueDate: "" });
        loadAssignments();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create assignment", variant: "destructive" });
    } finally {
      setIsCreatingAssignment(false);
    }
  };

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
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">
                  Review submissions and track student progress
                </p>
                {user?.department && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Building2 className="w-3 h-3" />
                    {user.department}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Dashboard</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Students</TabsTrigger>
            <TabsTrigger value="create-assignment" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Create Assignment</TabsTrigger>
            <TabsTrigger value="ai-lab">AI Assignment Lab</TabsTrigger>
            <TabsTrigger value="risk-analytics">Risk Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats moved into Overview */}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-display font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleTabChange('submissions')}>
                    <FileText className="w-6 h-6" />
                    Review Submissions
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleTabChange('create-assignment')}>
                    <Plus className="w-6 h-6" />
                    Post Assignment
                  </Button>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-display font-bold mb-4">Department Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-2">
                       <Users className="w-4 h-4 text-muted-foreground" />
                       <span className="text-sm font-medium">Enrolled Students</span>
                    </div>
                    <Badge variant="secondary">{students.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-2">
                       <BookOpen className="w-4 h-4 text-muted-foreground" />
                       <span className="text-sm font-medium">Active Assignments</span>
                    </div>
                    <Badge variant="secondary">{assignments.filter(a => a.status !== 'draft').length}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

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

          {/* ═══ Create Assignment Tab ═══ */}
          <TabsContent value="create-assignment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Form */}
              <div className="glass-card rounded-2xl p-6 lg:col-span-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">New Assignment</h3>
                    <p className="text-xs text-muted-foreground">
                      {user?.department ? `For ${user.department} students` : 'For all students'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="a-title">Assignment Title</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="a-title"
                        placeholder="e.g. Data Structures Lab 3"
                        className="pl-10"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="a-course">Course Name</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="a-course"
                        placeholder="e.g. CS201"
                        className="pl-10"
                        value={newAssignment.course}
                        onChange={(e) => setNewAssignment({ ...newAssignment, course: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="a-due">Due Date</Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="a-due"
                        type="date"
                        className="pl-10"
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {user?.department && (
                    <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-xs flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-muted-foreground">This assignment will be visible only to <strong className="text-foreground">{user.department}</strong> students.</span>
                    </div>
                  )}

                  <Button type="submit" variant="gradient" className="w-full" disabled={isCreatingAssignment}>
                    {isCreatingAssignment ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-2" /> Create Assignment</>
                    )}
                  </Button>
                </form>
              </div>

              {/* Existing Assignments */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-display font-bold flex items-center gap-2">
                  Your Assignments
                  <Badge variant="secondary">{assignments.length}</Badge>
                </h3>
                {assignments.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No assignments yet. Create your first one!</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {assignments.map((a: any) => (
                      <div key={a.id} className={cn(
                        "glass-card rounded-xl p-4 border transition-colors",
                        a.status === 'draft' ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50" : "border-border hover:border-primary/20"
                      )}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{a.title}</h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{a.course}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {a.status === 'draft' && (
                              <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20 px-1 py-0">
                                Draft
                              </Badge>
                            )}
                            {a.stream && (
                              <Badge variant="outline" className="text-[9px] shrink-0 gap-0.5 px-1 py-0">
                                <Building2 className="w-2 h-2" />
                                {a.stream}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <CalendarDays className="w-3 h-3" />
                            <span>Due: {new Date(Number(a.due_date)).toLocaleDateString()}</span>
                          </div>
                          
                          {a.status === 'draft' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-[10px] text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                              onClick={() => handlePublishAssignment(a.id)}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ═══ Students Tab ═══ */}
          <TabsContent value="students" className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-semibold">Department Students</h2>
                <Badge variant="secondary">{students.length} Enrolled</Badge>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No students found in your department.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <div key={student.id} className="p-4 rounded-xl border border-border bg-secondary/20 hover:border-primary/30 transition-all flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.student_id || 'No ID'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{student.email}</p>
                      </div>
                      {student.is_verified ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Clock className="w-4 h-4 text-warning" />
                      )}
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

              {/* Document Preview */}
              {selectedSubmission.file_path && (
                <div className="glass-card rounded-xl p-4 overflow-hidden border border-primary/10">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Submission Preview
                  </h3>
                  <div className="aspect-[4/3] w-full bg-black/5 rounded-lg border flex items-center justify-center overflow-auto">
                    {selectedSubmission.file_path.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                      <img 
                        src={getFileUrl(selectedSubmission.file_path)} 
                        alt="Submission Preview" 
                        className="max-w-full max-h-full object-contain p-2"
                      />
                    ) : selectedSubmission.file_path.toLowerCase().endsWith('.pdf') ? (
                      <iframe 
                        src={`${getFileUrl(selectedSubmission.file_path)}#toolbar=0`} 
                        className="w-full h-full border-none rounded-md"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-muted-foreground opacity-40" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Preview not available for this file type.</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">Please download the file to review it.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
