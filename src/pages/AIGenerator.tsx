import { useState } from "react";
import { 
  Sparkles, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2,
  Loader2,
  Info
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AIUsageMeter } from "@/components/dashboard/AIUsageMeter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AIGenerator() {
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDeclared, setAiDeclared] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

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
    
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setGeneratedContent(`Based on your prompt about "${prompt.slice(0, 50)}...", here's a comprehensive analysis:

## Introduction
The subject matter presents several key considerations that merit careful examination. This analysis will explore the fundamental concepts and provide actionable insights.

## Key Points
1. **Primary Consideration**: The core elements establish a foundation for understanding the broader implications.

2. **Supporting Evidence**: Multiple sources corroborate the theoretical framework presented.

3. **Practical Applications**: Real-world implementations demonstrate the viability of proposed solutions.

## Conclusion
The synthesis of available information suggests a balanced approach that acknowledges both opportunities and challenges inherent in this domain.

---
*AI-generated content - 1,847 tokens used*`);
    
    setIsGenerating(false);
    
    toast({
      title: "Content generated!",
      description: "1,847 tokens used from your monthly quota.",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} ready for submission.`,
      });
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Assignment submitted!",
      description: "Your work has been recorded on the blockchain.",
    });
  };

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
                  accept=".pdf,.docx,.txt"
                />
              </div>
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
              aiDeclared 
                ? "bg-ai-secondary border-2 border-ai/30" 
                : "glass-card"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {aiDeclared ? (
                    <CheckCircle2 className="w-6 h-6 text-ai mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-warning mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-display font-semibold">AI Usage Declaration</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {aiDeclared 
                        ? "You've declared that this submission includes AI-generated content."
                        : "Please declare if any part of your submission was AI-generated."
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={aiDeclared}
                  onCheckedChange={setAiDeclared}
                />
              </div>
              
              {aiDeclared && (
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
            >
              Submit & Verify on Blockchain
            </Button>
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
