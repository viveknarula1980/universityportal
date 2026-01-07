import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "ai" | "blockchain" | "primary";
  trend?: {
    value: number;
    positive: boolean;
  };
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  trend 
}: StatsCardProps) {
  const variants = {
    default: {
      bg: "bg-card",
      iconBg: "bg-secondary",
      iconColor: "text-foreground",
    },
    primary: {
      bg: "bg-card",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    ai: {
      bg: "bg-card",
      iconBg: "bg-ai-secondary",
      iconColor: "text-ai",
    },
    blockchain: {
      bg: "bg-card",
      iconBg: "bg-blockchain-secondary",
      iconColor: "text-blockchain",
    },
  };

  const v = variants[variant];

  return (
    <div className={cn(
      "glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      v.bg
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center text-xs font-medium px-2 py-1 rounded-full",
              trend.positive 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          v.iconBg
        )}>
          <Icon className={cn("w-6 h-6", v.iconColor)} />
        </div>
      </div>
    </div>
  );
}
