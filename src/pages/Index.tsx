import { FileText, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AIUsageMeter } from "@/components/dashboard/AIUsageMeter";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { apiService } from "@/services/api";

interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  aiAssisted: number;
}

interface RecentAssignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded" | "late";
  aiUsed?: boolean;
  blockchainVerified?: boolean;
  grade?: string | null;
}

interface ActivityItem {
  icon: string;
  title: string;
  description: string;
  time: string;
  type: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    pending: 0,
    aiAssisted: 0,
  });
  const [assignments, setAssignments] = useState<RecentAssignment[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [aiUsage, setAiUsage] = useState({ used: 0, total: 25000, daysUntilReset: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats and assignments
        const dashboardResponse = await apiService.getDashboardData();
        if (dashboardResponse.success && dashboardResponse.data) {
          setStats(dashboardResponse.data.stats || {
            total: 0,
            completed: 0,
            pending: 0,
            aiAssisted: 0,
          });
          setAssignments(dashboardResponse.data.recentAssignments || []);
          setRecentActivity(dashboardResponse.data.recentActivity || []);
        }

        // Fetch AI usage
        const aiUsageResponse = await apiService.getAIUsage();
        if (aiUsageResponse.success && aiUsageResponse.data) {
          setAiUsage({
            used: aiUsageResponse.data.used || 0,
            total: aiUsageResponse.data.limit || 25000,
            daysUntilReset: aiUsageResponse.data.daysUntilReset || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold">
            Welcome back, <span className="gradient-text">{user?.name || "Student"}</span>
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your academic progress and assignments.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Assignments"
            value={stats.total}
            subtitle="This semester"
            icon={FileText}
            variant="primary"
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            subtitle="On time submissions"
            icon={CheckCircle2}
            variant="default"
            trend={{ value: 15, positive: true }}
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            subtitle="Due this week"
            icon={Clock}
            variant="default"
          />
          <StatsCard
            title="AI Assisted"
            value={stats.aiAssisted}
            subtitle="With declaration"
            icon={Sparkles}
            variant="ai"
          />
        </div>

        {/* AI Usage & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIUsageMeter used={aiUsage.used} total={aiUsage.total} daysUntilReset={aiUsage.daysUntilReset} />
          <RecentActivity activities={recentActivity} />
        </div>

        {/* Assignments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold">Recent Assignments</h2>
            <button 
              onClick={() => navigate("/assignments")}
              className="text-sm text-primary hover:underline"
            >
              View all →
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assignments found. Submit your first assignment to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {assignments.map((assignment, index) => (
                <div
                  key={assignment.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <AssignmentCard
                    title={assignment.title}
                    course={assignment.course}
                    dueDate={assignment.dueDate}
                    status={assignment.status}
                    aiUsed={assignment.aiUsed}
                    blockchainVerified={assignment.blockchainVerified}
                    grade={assignment.grade || undefined}
                    onSubmit={() => navigate("/ai-generator")}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
