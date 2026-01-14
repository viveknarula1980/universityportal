import { useState } from "react";
import { 
  Sparkles, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2,
  Loader2,
  Info,
  Shield,
  Hash
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AIUsageMeter } from "@/components/dashboard/AIUsageMeter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateFileHash, submitToBlockchain, generateAssignmentId, hashStudentId, type AssignmentSubmission } from "@/services/blockchain";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";

export default function AIGenerator() {
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiUsageType, setAiUsageType] = useState<"none" | "partial" | "full">("none");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe what you want the AI to help you with.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          maxTokens: 8000, // Increased for assignments - GPT-5-nano supports up to 128k
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI generation failed");
      }

      setGeneratedContent(data.data.content);
      
      toast({
        title: "Content generated!",
        description: `${data.data.tokensUsed} tokens used. Model: ${data.data.model}`,
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content. Check if OpenAI API is configured.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // Generate file hash
      try {
        const hash = await generateFileHash(file);
        setFileHash(hash);
        toast({
          title: "File uploaded",
          description: `${file.name} ready for submission. Hash generated.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file uploaded",
        description: "Please upload your assignment file.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAssignment) {
      toast({
        title: "No assignment selected",
        description: "Please select an assignment.",
        variant: "destructive",
      });
      return;
    }

    if (!fileHash) {
      toast({
        title: "File hash not generated",
        description: "Please wait for file processing to complete.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use selected assignment or generate new ID
      const assignmentId = selectedAssignment || generateAssignmentId();
      const selectedAssignmentData = availableAssignments.find(a => a.id === assignmentId);
      
      const studentId = user?.studentId || user?.id || "UNKNOWN";
      const hashedStudentId = hashStudentId(studentId);
      
      // Submit via API (which handles blockchain)
      const result = await apiService.submitAssignment({
        file: uploadedFile!,
        assignmentId,
        assignmentTitle: selectedAssignmentData?.title || `Assignment ${assignmentId}`,
        course: selectedAssignmentData?.course || 'General',
        aiUsageType,
        aiTokenCount: generatedContent ? 1847 : 0,
      });

      setSubmittedHash(result.data.blockchainHash);

      toast({
        title: "Assignment submitted!",
        description: "Your work has been recorded on the blockchain.",
      });

      // Navigate to blockchain page after a delay
      setTimeout(() => {
        navigate("/blockchain");
      }, 2000);
    } catch (error: any) {
      console.error("Submission error:", error);
      const errorMessage = error.message || error.error || "Failed to submit to blockchain. Please try again.";
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableAssignments = [
    { id: "1", title: "Machine Learning Project", course: "CS 4510 - Artificial Intelligence" },
    { id: "2", title: "Database Design Essay", course: "CS 3200 - Databases" },
    { id: "3", title: "Algorithm Analysis", course: "CS 3100 - Algorithms" },
  ];

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-ai-secondary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-ai" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">AI Generator</h1>
              <p className="text-muted-foreground">
                Generate content with AI and declare usage transparently
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Selection */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Select Assignment
              </h3>
              <div className="space-y-2">
                <Label htmlFor="assignment">Assignment *</Label>
                <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.title} - {assignment.course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File Upload */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Your Work
              </h3>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  uploadedFile ? "border-success bg-success/5" : "border-border hover:border-primary/50"
                )}
              >
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-success" />
                    <div className="text-left">
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-2">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports PDF, DOCX, TXT (max 10MB)
                    </p>
                  </>
                )}
                <Input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt,.doc"
                />
              </div>
              {fileHash && (
                <div className="flex items-center gap-2 p-3 bg-blockchain-secondary/30 rounded-lg border border-blockchain/20">
                  <Hash className="w-4 h-4 text-blockchain" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">File Hash (SHA-256)</p>
                    <p className="font-mono text-xs truncate">{fileHash}</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Generation */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-ai" />
                AI Content Generator
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="prompt">Your Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what you want the AI to help you with..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <Button 
                variant="ai" 
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Content
                  </>
                )}
              </Button>

              {generatedContent && (
                <div className="mt-4 space-y-2">
                  <Label>Generated Content</Label>
                  <div className="bg-secondary/50 rounded-xl p-4 prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {generatedContent}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* AI Declaration */}
            <div className={cn(
              "rounded-2xl p-6 space-y-4 transition-all",
              aiUsageType !== "none"
                ? "bg-ai-secondary border-2 border-ai/30" 
                : "glass-card"
            )}>
              <div className="flex items-start gap-3">
                {aiUsageType !== "none" ? (
                  <CheckCircle2 className="w-6 h-6 text-ai mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-warning mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-display font-semibold mb-3">AI Usage Declaration *</h3>
                  <RadioGroup value={aiUsageType} onValueChange={(value) => setAiUsageType(value as "none" | "partial" | "full")}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50">
                        <RadioGroupItem value="none" id="none" />
                        <Label htmlFor="none" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">No AI Used</p>
                            <p className="text-xs text-muted-foreground">This submission was created without AI assistance</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50">
                        <RadioGroupItem value="partial" id="partial" />
                        <Label htmlFor="partial" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">Partially AI-Assisted</p>
                            <p className="text-xs text-muted-foreground">AI was used for research, outlines, or ideas</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">Fully AI-Generated</p>
                            <p className="text-xs text-muted-foreground">This submission was primarily generated by AI</p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              {aiUsageType !== "none" && (
                <div className="flex items-start gap-2 p-3 bg-background/50 rounded-lg">
                  <Info className="w-4 h-4 text-ai mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Your declaration will be recorded on the blockchain for transparency. 
                    This promotes academic integrity while acknowledging AI as a learning tool.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              variant="blockchain" 
              size="lg" 
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !uploadedFile || !selectedAssignment}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting to Blockchain...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Submit & Verify on Blockchain
                </>
              )}
            </Button>

            {submittedHash && (
              <div className="glass-card rounded-2xl p-6 bg-success/10 border-2 border-success/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-display font-semibold mb-2">Submission Successful!</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your assignment has been recorded on the blockchain.
                    </p>
                    <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                      <Hash className="w-4 h-4 text-blockchain" />
                      <p className="font-mono text-xs">{submittedHash}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <AIUsageMeter used={18500} total={25000} />
            
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-semibold">Usage Guidelines</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>AI can help with research, outlines, and ideas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Always declare AI usage honestly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Review and edit AI-generated content</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <span>Misrepresentation may affect grades</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
