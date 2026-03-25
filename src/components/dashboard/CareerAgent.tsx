import { useState } from "react";
import { Upload, Download, Sparkles, Loader2, Linkedin, FileText, ChevronRight, CheckCircle2 } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReactMarkdown from "react-markdown";

export function CareerAgent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'cv'|'linkedin'>('cv');

  // CV State
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvResult, setCvResult] = useState<any>(null); 

  // LinkedIn State
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [liLoading, setLiLoading] = useState(false);
  const [liResult, setLiResult] = useState<any>(null);

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const analyzeCV = async () => {
    if (!cvFile) return;
    setCvLoading(true);
    try {
      const resp = await apiService.analyzeCV(cvFile);
      if (resp.success) {
        setCvResult(resp.data);
        toast({ title: "Analysis Complete", description: "Your CV has been optimally rewritten." });
      }
    } catch (err: any) {
      toast({ title: "Analysis Failed", description: err.message, variant: "destructive" });
    } finally {
      setCvLoading(false);
    }
  };

  const analyzeLinkedIn = async () => {
    if (!linkedinUrl) return;
    setLiLoading(true);
    try {
      const resp = await apiService.analyzeLinkedIn(linkedinUrl);
      if (resp.success) {
        setLiResult(resp.data);
      } else {
         toast({ title: "Analysis Error", description: resp.error || "Failed to parse profile", variant: "destructive" });
      }
    } catch (err: any) {
       toast({ title: "Request Failed", description: err.message, variant: "destructive" });
    } finally {
      setLiLoading(false);
    }
  };

  const downloadImprovedCV = async () => {
    if (!cvResult?.improvedCV) return;
    try {
      const element = document.getElementById('cv-export-template');
      if (!element) {
        toast({ title: "Error", description: "Template engine not ready.", variant: "destructive" });
        return;
      }
      
      // Make it briefly visible specifically for snapping to ensure dimensions are perfect
      element.style.display = 'block';
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save("Professional_CV.pdf");
      
      element.style.display = 'none';
      toast({ title: "Downloaded", description: "Successfully exported professional PDF." });
    } catch (e) {
       console.error("PDF engine crash", e);
       toast({ title: "Error", description: "Failed to generate PDF document", variant: "destructive" });
    }
  };

  return (
    <div className="bg-card border shadow-sm rounded-xl overflow-hidden mt-8">
      <div className="p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Career Agent
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Optimize your CV for ATS systems and secure your LinkedIn profile.</p>
        </div>
        
        {/* Module Tabs */}
        <div className="flex p-1 bg-muted rounded-lg">
          <button 
            onClick={() => setActiveTab('cv')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'cv' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <FileText className="w-4 h-4" /> CV Builder
          </button>
          <button 
            onClick={() => setActiveTab('linkedin')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'linkedin' ? 'bg-background shadow text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Linkedin className="w-4 h-4" /> LinkedIn Check
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'cv' ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {!cvResult ? (
              <div className="max-w-xl mx-auto space-y-4">
                <div className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl p-8 text-center transition-all hover:bg-primary/10">
                  <Upload className="w-10 h-10 text-primary mx-auto mb-4 opacity-75" />
                  <h3 className="font-semibold text-foreground mb-1">Upload your CV Document</h3>
                  <p className="text-sm text-muted-foreground mb-4">Must be a PDF file. Our ATS expert AI will rewrite it perfectly.</p>
                  <label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-block">
                    Select PDF File
                    <input type="file" className="hidden" accept=".pdf" onChange={handleCVUpload} />
                  </label>
                  {cvFile && <p className="mt-4 text-sm font-medium text-emerald-600 flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4"/> {cvFile.name} loaded</p>}
                </div>
                
                <button 
                  disabled={!cvFile || cvLoading}
                  onClick={analyzeCV}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium shadow-md hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {cvLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-5 h-5" /> Analyze & Rewrite CV</>}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Score Comparison */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border">
                  <div className="text-center p-3">
                    <p className="text-sm text-muted-foreground">Original Pass Rate</p>
                    <p className="text-3xl font-display text-rose-500 font-bold">{cvResult.originalScore}%</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-center text-muted-foreground">
                    <div className="h-px bg-border flex-1"></div>
                    <ChevronRight className="w-8 h-8 text-primary mx-2" />
                    <div className="h-px bg-border flex-1"></div>
                  </div>
                  <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <p className="text-sm text-emerald-600 font-medium">New ATS Pass Rate</p>
                    <p className="text-3xl font-display text-emerald-600 font-bold">{cvResult.improvedScore}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Feedback */}
                  <div className="bg-orange-500/5 border border-orange-500/20 p-5 rounded-xl">
                    <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                       Actionable Feedback
                    </h4>
                    <ul className="space-y-2">
                      {cvResult.feedback?.map((item: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-foreground/80">
                           <span className="text-orange-500 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improved Preview */}
                  <div className="bg-background border p-5 rounded-xl flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                       <h4 className="font-semibold text-foreground flex items-center gap-2">
                          Rewritten CV Preview
                       </h4>
                       <button onClick={downloadImprovedCV} className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full flex items-center gap-1 font-medium transition-colors">
                         <Download className="w-3 h-3" /> Export PDF
                       </button>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[300px] bg-background border p-4 rounded-lg text-sm text-foreground/90 w-full [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:uppercase [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:uppercase [&>h2]:border-b [&>h2]:border-border [&>h2]:pb-1 [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:mt-3 [&>h3]:mb-1 [&>p]:my-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-2 [&>li]:my-1 [&>strong]:font-semibold">
                      <ReactMarkdown>{cvResult.improvedCV.replace(/\\n/g, '\n\n')}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                <button onClick={() => { setCvResult(null); setCvFile(null); }} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                  Upload another CV
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
             {!liResult ? (
              <div className="max-w-xl mx-auto space-y-4">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 transition-all hover:bg-blue-500/10">
                  <Linkedin className="w-10 h-10 text-blue-500 mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">Analyze LinkedIn Profile</h3>
                  <p className="text-sm text-muted-foreground mb-4">Paste your public LinkedIn profile URL to check its visibility and get professional tips.</p>
                  
                  <input 
                    type="url" 
                    placeholder="https://linkedin.com/in/username" 
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>
                
                <button 
                  disabled={!linkedinUrl.includes('linkedin.com') || liLoading}
                  onClick={analyzeLinkedIn}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {liLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Scanning Profile...</> : <><Sparkles className="w-5 h-5" /> Generate Profile Report</>}
                </button>
              </div>
             ) : (
               <div className="max-w-2xl mx-auto space-y-6">
                 <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 p-6 rounded-xl flex items-center gap-6">
                   <div className="shrink-0 w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center border-4 border-background shadow-sm">
                      <span className="text-3xl font-bold text-blue-600">{liResult.score}</span>
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-foreground">Profile Strength</h3>
                     <p className="text-sm text-muted-foreground mt-1">Based on visible public data and standard technical recruiting practices.</p>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <h4 className="font-medium text-foreground">Recommended Actions</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {liResult.tips?.map((tip: string, i: number) => (
                       <div key={i} className="bg-background border p-4 rounded-lg shadow-sm flex items-start gap-3">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                         <span className="text-sm text-muted-foreground">{tip}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                 <button onClick={() => { setLiResult(null); setLinkedinUrl(''); }} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                  Analyze another profile
                </button>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Hidden Snapshot Template for A4 PDF (Rendered strictly off-screen to avoid layout shifts) */}
      <div className="absolute opacity-0 pointer-events-none" style={{ top: '-9999px', left: '-9999px' }}>
        <div id="cv-export-template" className="bg-white text-gray-800 w-[210mm] min-h-[297mm] box-border relative font-sans leading-relaxed tracking-wide">
          
          {/* Dark Glassmorphic Header bridging the Web3 UI from Home Page */}
          <div className="bg-zinc-950 w-full px-[20mm] py-8 border-b-4 border-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 3 0 5 1 7 2a1 1 0 0 1 1 1v7z"></path></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-widest uppercase m-0 leading-tight">University Portal</h2>
                  <p className="text-zinc-400 text-sm m-0">Blockchain Certified Profile</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wider uppercase border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                 Verified on Polygon
              </div>
            </div>
          </div>
          
          <div className="px-[20mm] pb-[20mm]">
            <div className="w-full [&>h1]:text-4xl [&>h1]:font-light [&>h1]:uppercase [&>h1]:mb-6 [&>h1]:text-slate-800 [&>h1]:tracking-wide [&>h1]:border-b-2 [&>h1]:border-slate-200 [&>h1]:pb-2 [&>h2]:text-sm [&>h2]:font-bold [&>h2]:uppercase [&>h2]:border-b-2 [&>h2]:border-slate-200 [&>h2]:pb-1 [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-indigo-900 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mt-4 [&>h3]:mb-1 [&>h3]:text-slate-800 [&>p]:text-sm [&>p]:text-gray-700 [&>p]:my-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-2 [&>li]:text-sm [&>li]:text-gray-700 [&>li]:my-1 [&>strong]:font-semibold mt-8">
              <ReactMarkdown>{(cvResult?.improvedCV || "").replace(/\\n/g, '\n\n')}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
