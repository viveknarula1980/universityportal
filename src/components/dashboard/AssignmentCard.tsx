import { FileText, Clock, CheckCircle2, AlertCircle, Sparkles, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AssignmentCardProps {
  title: string;
  course: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded" | "late";
  aiUsed?: boolean;
  blockchainVerified?: boolean;
  grade?: string;
  onSubmit?: () => void;
}

export function AssignmentCard({
  title,
  course,
  dueDate,
  status,
  aiUsed,
  blockchainVerified,
  grade,
  onSubmit,
}: AssignmentCardProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Pending",
      color: "bg-warning/10 text-warning",
    },
    submitted: {
      icon: CheckCircle2,
      label: "Submitted",
      color: "bg-success/10 text-success",
    },
    graded: {
      icon: CheckCircle2,
      label: "Graded",
      color: "bg-primary/10 text-primary",
    },
    late: {
      icon: AlertCircle,
      label: "Overdue",
      color: "bg-destructive/10 text-destructive",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{course}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium", config.color)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <span>Due: {dueDate}</span>
        {grade && (
          <Badge variant="secondary" className="font-display font-bold">
            {grade}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {aiUsed && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ai-secondary text-ai text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              AI Assisted
            </div>
          )}
          {blockchainVerified && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blockchain-secondary text-blockchain text-xs font-medium">
              <Link2 className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>
        
        {status === "pending" && (
          <Button size="sm" onClick={onSubmit}>
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}
