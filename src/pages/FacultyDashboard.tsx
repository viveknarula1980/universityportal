import { useState } from "react";
import {
  Users,
  FileText,
  Sparkles,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Award,
  TrendingUp
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  assignmentTitle: string;
  course: string;
  submittedAt: string;
  fileHash: string;
  aiUsageType: "none" | "partial" | "full";
  aiTokenCount: number;
  blockchainHash: string;
  status: "pending" | "graded";
  grade?: string;
}

const mockSubmissions: Submission[] = [
  {
    id: "1",
    studentName: "John Doe",
    studentId: "CS2024-0892",
    assignmentTitle: "Database Design Essay",
    course: "CS 3200 - Databases",
    submittedAt: "Jan 12, 2026 - 14:32 UTC",
    fileHash: "0x7f2d8a9c3e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d",
    aiUsageType: "partial",
    aiTokenCount: 1847,
    blockchainHash: "0x7f2d8a9c3e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d",
    status: "graded",
    grade: "A-",
  },
  {
    id: "2",
    studentName: "Jane Smith",
    studentId: "CS2024-0893",
    assignmentTitle: "Machine Learning Project",
    course: "CS 4510 - Artificial Intelligence",
    submittedAt: "Jan 15, 2026 - 10:15 UTC",
    fileHash: "0x3a9c7e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d2a8c",
    aiUsageType: "full",
    aiTokenCount: 5234,
    blockchainHash: "0x3a9c7e5b1f4d6a8c2e9b0f1d3c5a7e9b1f3d2a8c",
    status: "pending",
  },
  {
    id: "3",
    studentName: "Bob Johnson",
    studentId: "CS2024-0894",
    assignmentTitle: "Algorithm Analysis",
    course: "CS 3100 - Algorithms",
    submittedAt: "Jan 8, 2026 - 09:15 UTC",
    fileHash: "0x1f3d5a7e9b1c3e5a7d9b1f3d5a7e9c1b3e5a7d9f",
    aiUsageType: "none",
    aiTokenCount: 0,
    blockchainHash: "0x1f3d5a7e9b1c3e5a7d9b1f3d5a7e9c1b3e5a7d9f",
    status: "graded",
    grade: "A",
  },
];

export default function FacultyDashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const { toast } = useToast();

  const filteredSubmissions = mockSubmissions.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    const matchesCourse = selectedCourse === "all" || s.course === selectedCourse;
    return matchesSearch && matchesFilter && matchesCourse;
  });

  const stats = {
    totalSubmissions: mockSubmissions.length,
    pending: mockSubmissions.filter((s) => s.status === "pending").length,
    aiAssisted: mockSubmissions.filter((s) => s.aiUsageType !== "none").length,
    averageGrade: "A-",
  };

  const getAIUsageBadge = (type: "none" | "partial" | "full") => {
    const config = {
      none: { label: "No AI", variant: "default" as const },
      partial: { label: "Partial AI", variant: "secondary" as const },
      full: { label: "Full AI", variant: "ai" as const },
    };
    const { label, variant } = config[type];
    return <Badge variant={variant}>{label}</Badge>;
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
              <SelectItem value="CS 3200 - Databases">CS 3200 - Databases</SelectItem>
              <SelectItem value="CS 4510 - Artificial Intelligence">CS 4510 - AI</SelectItem>
              <SelectItem value="CS 3100 - Algorithms">CS 3100 - Algorithms</SelectItem>
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
                          <h3 className="font-display font-semibold">{submission.assignmentTitle}</h3>
                          {getAIUsageBadge(submission.aiUsageType)}
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
                            {submission.studentName} ({submission.studentId})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {submission.submittedAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    {submission.aiUsageType !== "none" && (
                      <div className="flex items-center gap-2 p-2 bg-ai-secondary/30 rounded-lg">
                        <Sparkles className="w-4 h-4 text-ai" />
                        <span className="text-xs text-muted-foreground">
                          AI Tokens Used: <span className="font-medium">{submission.aiTokenCount.toLocaleString()}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-2 bg-blockchain-secondary/30 rounded-lg">
                      <span className="text-xs font-mono text-muted-foreground">
                        Hash: {submission.fileHash.slice(0, 16)}...{submission.fileHash.slice(-8)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {submission.status === "pending" && (
                      <Button variant="default" size="sm">
                        <Award className="w-4 h-4 mr-2" />
                        Grade
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No submissions found</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

