import { useState } from "react";
import { Sparkles, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function FacultyAILab() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [learningGoals, setLearningGoals] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveDraft = async () => {
    if (!assignment) return;
    
    setIsSaving(true);
    try {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7); // Default to 7 days away
      
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/assignments/create`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: assignment.title,
          course: topic,
          dueDate: defaultDueDate.toISOString().split('T')[0],
          status: 'draft'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Saved to Drafts", description: "You can find this assignment in your Assignments list." });
      } else {
        throw new Error(data.error || "Failed to save");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save draft", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://universityportal-rccw.onrender.com/api" : "http://localhost:3000/api");
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/ai/faculty/generate-assignment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ topic, difficulty, learningGoals }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAssignment(data.data);
        toast({ title: "Assignment Generated", description: "Your AI assignment is ready." });
      } else {
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate assignment.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-card p-6 space-y-6 rounded-xl border shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-2 relative z-10">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">AI Assignment Lab</h2>
          <p className="text-sm text-muted-foreground">Generate structured assignments instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label>Subject or Topic</Label>
            <Input 
              placeholder="e.g., Introduction to Blockchain" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <select 
               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
               value={difficulty}
               onChange={(e) => setDifficulty(e.target.value)}
               disabled={isGenerating}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Key Learning Goals (Optional)</Label>
            <Input 
              placeholder="e.g., Understand consensus mechanisms" 
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <Button type="submit" disabled={isGenerating || !topic.trim()} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isGenerating ? "Generating..." : "Generate Assignment"}
          </Button>
        </form>

        {/* Results Pane */}
        <div className="bg-muted/30 p-4 rounded-lg border overflow-y-auto max-h-[500px]">
           {assignment ? (
              <div className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-bold">{assignment.title}</h3>
                <div className="bg-white dark:bg-black/20 p-3 rounded border text-sm">
                  <strong>Estimated Time:</strong> {assignment.estimatedTimeHours} hours
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{assignment.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Instructions</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {assignment.instructions?.map((inst: string, idx: number) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Grading Criteria</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {assignment.gradingCriteria?.map((crit: string, idx: number) => (
                      <li key={idx}>{crit}</li>
                    ))}
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2"/>
                  )}
                  {isSaving ? "Saving..." : "Save to Drafts"}
                </Button>
              </div>
           ) : (
             <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
               <FileText className="w-8 h-8 opacity-20" />
               <p>Your generated assignment will appear here</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
