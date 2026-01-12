import { FileText, Sparkles, Link2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  icon: string;
  title: string;
  description: string;
  time: string;
  type: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
}

const iconMap = {
  submission: FileText,
  ai: Sparkles,
  blockchain: Link2,
  grade: CheckCircle2,
};

export function RecentActivity({ activities = [] }: RecentActivityProps) {
  const typeStyles = {
    submission: "bg-primary/10 text-primary",
    ai: "bg-ai-secondary text-ai",
    blockchain: "bg-blockchain-secondary text-blockchain",
    grade: "bg-success/10 text-success",
  };

  // If no activities, show empty state
  if (activities.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-muted-foreground text-sm">
          No recent activity. Start submitting assignments to see activity here.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display font-semibold text-lg mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity, index) => {
          const IconComponent = iconMap[activity.type as keyof typeof iconMap] || FileText;
          
          return (
            <div 
              key={index}
              className="flex items-start gap-4 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                typeStyles[activity.type as keyof typeof typeStyles] || typeStyles.submission
              )}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
