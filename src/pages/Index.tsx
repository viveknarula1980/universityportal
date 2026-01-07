import { FileText, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AIUsageMeter } from "@/components/dashboard/AIUsageMeter";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useNavigate } from "react-router-dom";

const assignments = [
  {
    title: "Machine Learning Project",
    course: "CS 4510 - Artificial Intelligence",
    dueDate: "Jan 15, 2026",
    status: "pending" as const,
  },
  {
    title: "Database Design Essay",
    course: "CS 3200 - Databases",
    dueDate: "Jan 12, 2026",
    status: "submitted" as const,
    aiUsed: true,
    blockchainVerified: true,
  },
  {
    title: "Algorithm Analysis",
    course: "CS 3100 - Algorithms",
    dueDate: "Jan 8, 2026",
    status: "graded" as const,
    grade: "A-",
    blockchainVerified: true,
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold">
            Welcome back, <span className="gradient-text">Alex</span>
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your academic progress and assignments.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Assignments"
            value={12}
            subtitle="This semester"
            icon={FileText}
            variant="primary"
          />
          <StatsCard
            title="Completed"
            value={8}
            subtitle="On time submissions"
            icon={CheckCircle2}
            variant="default"
            trend={{ value: 15, positive: true }}
          />
          <StatsCard
            title="Pending"
            value={4}
            subtitle="Due this week"
            icon={Clock}
            variant="default"
          />
          <StatsCard
            title="AI Assisted"
            value={5}
            subtitle="With declaration"
            icon={Sparkles}
            variant="ai"
          />
        </div>

        {/* AI Usage & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIUsageMeter used={18500} total={25000} />
          <RecentActivity />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignments.map((assignment, index) => (
              <div
                key={assignment.title}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <AssignmentCard
                  {...assignment}
                  onSubmit={() => navigate("/ai-generator")}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
