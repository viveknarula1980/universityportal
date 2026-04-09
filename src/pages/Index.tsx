import { FileText, CheckCircle2, Clock, Sparkles, ExternalLink, Building2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AIUsageMeter } from "@/components/dashboard/AIUsageMeter";
import { CareerAgent } from "@/components/dashboard/CareerAgent";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ResearchLab } from "@/components/dashboard/ResearchLab";
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

interface AIRecommendations {
  internships: { title: string; company: string; description: string; matchReason: string; link?: string }[];
  courses: { title: string; platform: string; description: string; matchReason: string; link?: string }[];
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
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    // Fetch all dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats and assignments
        const dashboardResponse = await apiService.getDashboardData();
        if (dashboardResponse.success && dashboardResponse.data) {
          const dData: any = dashboardResponse.data;
          setStats(dData.stats || {
            total: 0,
            completed: 0,
            pending: 0,
            aiAssisted: 0,
          });
          setAssignments(dData.recentAssignments || []);
          setRecentActivity(dData.recentActivity || []);
        }

        // Fetch AI usage
        const aiUsageResponse = await apiService.getAIUsage();
        if (aiUsageResponse.success && aiUsageResponse.data) {
          const aData: any = aiUsageResponse.data;
          setAiUsage({
            used: aData.used || 0,
            total: aData.limit || 25000,
            daysUntilReset: aData.daysUntilReset || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }

      // Fetch AI Career Recommendations
      try {
        setLoadingRecs(true);
        const recResponse = await apiService.getAIRecommendations();
        if (recResponse.success && recResponse.data) {
          setRecommendations(recResponse.data as AIRecommendations);
        }
      } catch (error) {
        console.error("Failed to fetch AI recommendations:", error);
      } finally {
        setLoadingRecs(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-display font-bold">
              Welcome back, <span className="gradient-text">{user?.name || "Student"}</span>
            </h1>
            {user?.department && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                {user.department}
              </span>
            )}
          </div>
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

        {/* AI Career Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-semibold">AI Career Suggestions</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Personalized internships and courses recommended based on your university degrees and assignments.
          </p>

          {loadingRecs ? (
            <div className="text-center py-8 text-muted-foreground animate-pulse">Analyzing your academic profile...</div>
          ) : !recommendations ? (
            <div className="text-center py-8 text-muted-foreground">Unable to generate recommendations at this time.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Internships Section */}
              <div className="bg-card p-6 space-y-4 rounded-xl border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">💼</span>
                  Recommended Internships
                </h3>
                <div className="space-y-4 relative z-10">
                  {recommendations.internships.map((internship, i) => (
                    <div key={i} className="p-4 rounded-lg bg-background border hover:border-primary/40 transition-all shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-medium text-foreground">{internship.title}</h4>
                          <p className="text-sm font-medium text-primary mb-2">{internship.company}</p>
                        </div>
                        {internship.link && internship.link !== '#' && (
                          <a href={internship.link.startsWith('http') ? internship.link : `https://${internship.link}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 font-semibold cursor-pointer">
                            Apply <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{internship.description}</p>
                      <div className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1.5 rounded-md inline-block">
                        <strong className="text-foreground">Why:</strong> {internship.matchReason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Courses Section */}
              <div className="bg-card p-6 space-y-4 rounded-xl border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">📚</span>
                  Recommended Courses
                </h3>
                <div className="space-y-4 relative z-10">
                  {recommendations.courses.map((course, i) => (
                    <div key={i} className="p-4 rounded-lg bg-background border hover:border-blue-500/40 transition-all shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-medium text-foreground">{course.title}</h4>
                          <p className="text-sm font-medium text-blue-500 mb-2">{course.platform}</p>
                        </div>
                        {course.link && course.link !== '#' && (
                          <a href={course.link.startsWith('http') ? course.link : `https://${course.link}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 font-semibold cursor-pointer">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{course.description}</p>
                      <div className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1.5 rounded-md inline-block">
                        <strong className="text-foreground">Why:</strong> {course.matchReason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Career Agent (CV / LinkedIn) */}
        <CareerAgent />
        
        {/* AI Research Lab (Academic Search) */}
        <ResearchLab />
      </div>
    </MainLayout>
  );
};

export default Index;
