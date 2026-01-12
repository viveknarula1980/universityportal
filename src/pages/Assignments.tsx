import { useState, useEffect } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";

interface Assignment {
  id: string;
  title: string;
  course: string;
  due_date: number;
  submission_id?: string;
  submission_status?: string;
  grade?: string;
  ai_usage_type?: string;
  blockchain_hash?: string;
}

export default function Assignments() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAssignments();
      if (response.success && response.data) {
        const allAssignments = response.data as Assignment[];
        
        // Get submissions to match with assignments
        const submissionsResponse = await apiService.getSubmissions();
        const submissions = submissionsResponse.success && submissionsResponse.data 
          ? (submissionsResponse.data as any[]) 
          : [];
        
        // Merge assignment data with submission data
        const assignmentsWithSubmissions = allAssignments.map(assignment => {
          const submission = submissions.find((s: any) => s.assignment_id === assignment.id);
          return {
            ...assignment,
            submission_id: submission?.id,
            submission_status: submission?.status,
            grade: submission?.grade,
            ai_usage_type: submission?.ai_usage_type,
            blockchain_hash: submission?.blockchain_hash,
          };
        });
        
        setAssignments(assignmentsWithSubmissions);
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = 
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.course.toLowerCase().includes(search.toLowerCase());
    
    let matchesFilter = true;
    if (filter !== "all") {
      if (filter === "pending") {
        matchesFilter = !a.submission_id;
      } else if (filter === "submitted") {
        matchesFilter = !!a.submission_id && a.submission_status !== "graded";
      } else if (filter === "graded") {
        matchesFilter = a.submission_status === "graded";
      } else if (filter === "late") {
        matchesFilter = !a.submission_id && a.due_date < Date.now();
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const formatDueDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatus = (assignment: Assignment): "pending" | "submitted" | "graded" | "late" => {
    if (assignment.submission_status === "graded") return "graded";
    if (assignment.submission_id) return "submitted";
    if (assignment.due_date < Date.now()) return "late";
    return "pending";
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Assignments</h1>
            <p className="text-muted-foreground">Manage and track your coursework</p>
          </div>
          <Button variant="gradient" onClick={() => navigate("/ai-generator")}>
            <Plus className="w-4 h-4" />
            New Submission
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "submitted", "graded", "late"].map((status) => (
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

        {/* Assignments Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading assignments...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No assignments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAssignments.map((assignment, index) => (
              <div
                key={assignment.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <AssignmentCard
                  title={assignment.title}
                  course={assignment.course}
                  dueDate={formatDueDate(assignment.due_date)}
                  status={getStatus(assignment)}
                  aiUsed={assignment.ai_usage_type && assignment.ai_usage_type !== "none"}
                  blockchainVerified={!!assignment.blockchain_hash}
                  grade={assignment.grade}
                  onSubmit={() => navigate("/ai-generator")}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
