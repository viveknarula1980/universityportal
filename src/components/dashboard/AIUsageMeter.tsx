import { Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIUsageMeterProps {
  used: number;
  total: number;
  className?: string;
}

export function AIUsageMeter({ used, total, className }: AIUsageMeterProps) {
  const percentage = (used / total) * 100;
  const isLow = percentage >= 80;
  const isEmpty = percentage >= 100;

  return (
    <div className={cn("glass-card rounded-2xl p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ai-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-ai" />
          </div>
          <div>
            <h3 className="font-display font-semibold">AI Context Usage</h3>
            <p className="text-sm text-muted-foreground">Monthly allocation</p>
          </div>
        </div>
        {isLow && !isEmpty && (
          <div className="flex items-center gap-2 text-warning text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Running low</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Used</span>
          <span className="font-medium">
            {used.toLocaleString()} / {total.toLocaleString()} tokens
          </span>
        </div>
        
        <div className="h-4 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500 relative",
              isEmpty 
                ? "bg-destructive" 
                : isLow 
                  ? "bg-gradient-to-r from-warning to-destructive" 
                  : "bg-gradient-to-r from-ai to-primary"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(100 - percentage)}% remaining</span>
          <span>Resets in 12 days</span>
        </div>
      </div>
    </div>
  );
}
