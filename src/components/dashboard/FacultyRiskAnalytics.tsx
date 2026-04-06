import { useState } from "react";
import { Clock, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function FacultyRiskAnalytics() {
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  const handleRunAnalytics = async () => {
    setIsRunning(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/ai/faculty/student-risk-analytics`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}` 
        }
      });
      
      const json = await response.json();
      if (json.success) {
        setData(json.data);
        toast({ title: "Analysis Complete", description: "Risk analytics generated successfully." });
      } else {
        toast({ title: "Failed", description: json.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to run analytics.", variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-card p-6 space-y-6 rounded-xl border shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-2 relative z-10">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">Student Risk Analytics</h2>
          <p className="text-sm text-muted-foreground">Identify students who may need extra help using predictive AI.</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {!data && (
           <div className="text-center py-10 bg-muted/20 rounded border border-dashed">
              <Button onClick={handleRunAnalytics} disabled={isRunning} variant="outline" className="gap-2">
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                {isRunning ? "Analyzing student data..." : "Run Department Analytics"}
              </Button>
           </div>
        )}

        {data && (
           <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Analysis Results</h3>
                <Button onClick={handleRunAnalytics} disabled={isRunning} variant="ghost" size="sm">
                  {isRunning ? "Refreshing..." : "Refresh Data"}
                </Button>
             </div>

             <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-900">
               <h4 className="font-semibold text-orange-800 dark:text-orange-400 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Key Insights
               </h4>
               <p className="text-sm text-orange-800 dark:text-orange-300">{data.insights}</p>
             </div>

             <div className="space-y-4">
                <h4 className="font-semibold px-1">At-Risk Students ({data.atRiskStudents?.length || 0})</h4>
                {data.atRiskStudents?.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600 p-4 border border-green-200 bg-green-50 rounded">
                    <CheckCircle className="w-5 h-5"/>
                    <p className="text-sm">No at-risk students found in your department.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {data.atRiskStudents?.map((student: any, idx: number) => (
                      <div key={idx} className="p-4 rounded border bg-card hover:bg-muted/20 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                             <h5 className="font-semibold">{student.name} <span className="text-muted-foreground text-sm font-normal">({student.studentId})</span></h5>
                             <span className="inline-block px-2 py-0.5 mt-1 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                               High Risk
                             </span>
                           </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3"><strong className="text-foreground">Reasoning:</strong> {student.reasoning}</p>
                        <div className="text-sm bg-muted/50 p-3 rounded">
                          <strong>Recommended Intervention:</strong> {student.recommendedIntervention}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
