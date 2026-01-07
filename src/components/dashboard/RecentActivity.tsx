import { FileText, Sparkles, Link2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    icon: FileText,
    title: "Assignment submitted",
    description: "Data Structures - Binary Trees",
    time: "2 hours ago",
    type: "submission",
  },
  {
    icon: Sparkles,
    title: "AI content generated",
    description: "Used 1,240 tokens for essay outline",
    time: "5 hours ago",
    type: "ai",
  },
  {
    icon: Link2,
    title: "Blockchain verified",
    description: "Hash: 0x7f2d...3a9c",
    time: "5 hours ago",
    type: "blockchain",
  },
  {
    icon: CheckCircle2,
    title: "Assignment graded",
    description: "Algorithm Analysis - Grade: A",
    time: "1 day ago",
    type: "grade",
  },
];

export function RecentActivity() {
  const typeStyles = {
    submission: "bg-primary/10 text-primary",
    ai: "bg-ai-secondary text-ai",
    blockchain: "bg-blockchain-secondary text-blockchain",
    grade: "bg-success/10 text-success",
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display font-semibold text-lg mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={index}
            className="flex items-start gap-4 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              typeStyles[activity.type as keyof typeof typeStyles]
            )}>
              <activity.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{activity.title}</p>
              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
