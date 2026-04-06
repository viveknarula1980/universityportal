import { useState } from "react";
import { BookOpen, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function ResearchLab() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3000/api");
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/ai/student/research-lab`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        toast({ title: "Research Failed", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to process research query.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-card p-6 space-y-6 rounded-xl border shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-2 relative z-10">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">AI Research Lab</h2>
          <p className="text-sm text-muted-foreground">Conduct academic research with strict AI source tracking</p>
        </div>
      </div>

      <form onSubmit={handleResearch} className="flex gap-2 relative z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="What would you like to research? e.g. Quantum Computing algorithms..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            disabled={isSearching}
          />
        </div>
        <Button type="submit" disabled={isSearching || !query.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {isSearching ? "Researching..." : "Research"}
          {!isSearching && <Sparkles className="w-4 h-4 ml-2" />}
        </Button>
      </form>

      {results && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
          <div className="p-4 bg-muted/30 rounded-lg border">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{results.summary}</p>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg border">
            <h3 className="font-semibold mb-2">Detailed Explanation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{results.detailedExplanation}</p>
          </div>

          {results.sources && results.sources.length > 0 && (
            <div className="p-4 bg-indigo-500/5 rounded-lg border border-indigo-500/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-4 h-4" />
                Generated Mock Sources
              </h3>
              <div className="space-y-2">
                {results.sources.map((source: any, i: number) => (
                  <div key={i} className="flex gap-2 text-sm items-start">
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">[{source.id}]</span>
                    <span className="text-muted-foreground">
                      {source.author} ({source.year}). <span className="italic">{source.title}</span>.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
