import { useState } from "react";
import {
  GraduationCap,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  QrCode,
  Download,
  Shield,
  Calendar,
  User,
  Award,
  Scan,
  Plus,
  Trash2,
  FileSpreadsheet,
  Layers,
  Camera,
  X
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";

export default function CertificateIssuance() {
  const [activeTab, setActiveTab] = useState("single");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [degreeName, setDegreeName] = useState("");
  const [degreeType, setDegreeType] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [bulkCertificates, setBulkCertificates] = useState<any[]>([]);
  const [issuedCertificate, setIssuedCertificate] = useState<{
    certificateId: string;
    qrCodeUrl: string;
    blockchainHash: string;
  } | null>(null);
  const { toast } = useToast();

  const handleIssueCertificate = async () => {
    if (!studentId || !studentName || !degreeName || !degreeType) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsIssuing(true);
    try {
      const response = await apiService.issueCertificate({
        studentId,
        studentName,
        degreeName,
        degreeType,
        issueDate: new Date(issueDate).toISOString(),
      });

      if (response.success && response.data) {
        const certData = response.data;
        setIssuedCertificate({
          certificateId: certData.certificateId || certData.id || "N/A",
          qrCodeUrl: certData.qrCodeUrl || certData.qr_code_url || "",
          blockchainHash: certData.blockchainHash || certData.blockchain_hash || "",
        });
        toast({ title: "Certificate issued!", description: "Recorded on blockchain." });
      } else {
        throw new Error(response.error || "Failed to issue");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleExtractFromImage = async (file: File) => {
    setIsExtracting(true);
    try {
      const response = await apiService.extractDegreeInfo(file);
      if (response.success && response.data) {
        const data = response.data;
        if (activeTab === "single") {
          setStudentName(data.studentName || "");
          setStudentId(data.studentId || "");
          setDegreeName(data.degreeName || "");
          setDegreeType(data.degreeType || "");
          if (data.issueDate) setIssueDate(data.issueDate.split('T')[0]);
        } else {
          setBulkCertificates([...bulkCertificates, { ...data, id: Date.now() }]);
        }
        toast({ title: "Data Extracted!", description: "AI has parsed the document details." });
      }
    } catch (error: any) {
      toast({ title: "Extraction failed", description: error.message, variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleBulkIssue = async () => {
    if (bulkCertificates.length === 0) return;
    setIsIssuing(true);
    try {
      const response = await apiService.bulkIssueCertificates(bulkCertificates);
      if (response.success) {
        toast({
          title: "Bulk issuance complete!",
          description: `Successfully issued ${response.data.issued} certificates.`,
        });
        setBulkCertificates([]);
      }
    } catch (error: any) {
      toast({ title: "Bulk issue error", description: error.message, variant: "destructive" });
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto pb-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                University Degree Portal
              </h1>
              <p className="text-muted-foreground">AI-Powered Blockchain Credential Issuance</p>
            </div>
          </div>
        </div>

        {!issuedCertificate ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 glass-card p-1">
              <TabsTrigger value="single" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                <User className="w-4 h-4 mr-2" />
                Single Issuance
              </TabsTrigger>
              <TabsTrigger value="bulk" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-300">
                <Layers className="w-4 h-4 mr-2" />
                Bulk Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="glass-card border-none overflow-hidden">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-blockchain" />
                          <h2 className="font-display font-semibold text-lg">Certificate Details</h2>
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            id="scan-upload"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => e.target.files?.[0] && handleExtractFromImage(e.target.files[0])}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blockchain-secondary/20 hover:bg-blockchain-secondary/40 border-blockchain/30"
                            asChild
                          >
                            <label htmlFor="scan-upload" className="cursor-pointer">
                              {isExtracting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scan className="w-4 h-4 mr-2" />}
                              AI Scan Document
                            </label>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="studentId">Student ID / Enrollment *</Label>
                          <Input
                            id="studentId"
                            placeholder="CS2024-0892"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="bg-background/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="studentName">Full Name *</Label>
                          <Input
                            id="studentName"
                            placeholder="Anupam Kumar"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="bg-background/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="degreeType">Degree Level *</Label>
                          <Select value={degreeType} onValueChange={setDegreeType}>
                            <SelectTrigger className="bg-background/50 border-white/10">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                              <SelectItem value="Master">Master's Degree</SelectItem>
                              <SelectItem value="Doctorate">Doctorate</SelectItem>
                              <SelectItem value="Diploma">Diploma</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="degreeName">Major / Program *</Label>
                          <Input
                            id="degreeName"
                            placeholder="Computer Science"
                            value={degreeName}
                            onChange={(e) => setDegreeName(e.target.value)}
                            className="bg-background/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="issueDate">Issuance Date *</Label>
                          <Input
                            id="issueDate"
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            className="bg-background/50 border-white/10"
                          />
                        </div>
                      </div>

                      <Button
                        variant="blockchain"
                        size="lg"
                        className="w-full mt-4 h-12 text-lg shadow-xl shadow-blockchain/20 transition-all hover:scale-[1.01]"
                        onClick={handleIssueCertificate}
                        disabled={isIssuing}
                      >
                        {isIssuing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Award className="w-5 h-5 mr-2" />}
                        Secure on Blockchain
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6 animate-in slide-in-from-right-4 duration-700">
                  <div className="glass-card p-6 rounded-2xl space-y-4 border-blockchain/20">
                    <div className="flex items-center gap-2 text-blockchain font-semibold">
                      <Shield className="w-4 h-4" />
                      <span>Security Details</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Verifying with EduChain ensures the document is immutable. 
                      Hashed student identity protects privacy while maintaining 100% authenticity.
                    </p>
                    <div className="pt-2">
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-blockchain w-2/3 animate-pulse"></div>
                      </div>
                      <p className="text-[10px] text-right mt-1 text-muted-foreground">Network Integrity: 99.9%</p>
                    </div>
                  </div>
                  
                  <div className="relative group overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 transition-opacity group-hover:opacity-100 opacity-50"></div>
                    <div className="relative p-6 glass-card border-none">
                      <div className="flex items-center gap-2 mb-2 font-display font-semibold">
                        <Camera className="w-4 h-4 text-primary" />
                        AI Extraction Preview
                      </div>
                      <div className="aspect-video rounded-lg bg-black/40 flex items-center justify-center border border-white/5">
                        <p className="text-xs text-muted-foreground text-center px-4 italic">
                          Document preview will appear here after AI scanning
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass-card border-none p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-display font-bold">Bulk Issuance Queue</h2>
                    <p className="text-sm text-muted-foreground">Upload multiple degrees or CSV to process in batch</p>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="file"
                      id="bulk-upload"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          Array.from(e.target.files).forEach(file => handleExtractFromImage(file));
                        }
                      }}
                    />
                    <Button variant="outline" className="border-accent/40 hover:bg-accent/10" asChild>
                      <label htmlFor="bulk-upload" className="cursor-pointer">
                        <Plus className="w-4 h-4 mr-2 text-accent" />
                        Add Certificates
                      </label>
                    </Button>
                    <Button 
                      variant="accent" 
                      disabled={bulkCertificates.length === 0 || isIssuing}
                      onClick={handleBulkIssue}
                    >
                      {isIssuing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                      Issue All ({bulkCertificates.length})
                    </Button>
                  </div>
                </div>

                {bulkCertificates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-xl border-2 border-dashed border-white/5">
                    <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No certificates in queue. Start by adding files.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="py-4 px-4 font-semibold text-sm">Student</th>
                          <th className="py-4 px-4 font-semibold text-sm">Degree</th>
                          <th className="py-4 px-4 font-semibold text-sm">Date</th>
                          <th className="py-4 px-4 font-semibold text-sm">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkCertificates.map((cert) => (
                          <tr key={cert.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="py-4 px-4">
                              <div className="font-medium">{cert.studentName}</div>
                              <div className="text-xs text-muted-foreground">{cert.studentId}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm">{cert.degreeType} in {cert.degreeName}</div>
                            </td>
                            <td className="py-4 px-4 text-sm">
                              {cert.issueDate?.split('T')[0]}
                            </td>
                            <td className="py-4 px-4">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setBulkCertificates(bulkCertificates.filter(c => c.id !== cert.id))}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="glass-card rounded-2xl p-8 bg-success/5 border-success/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <CheckCircle2 className="w-32 h-32 text-success" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-6 w-full text-center md:text-left">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/20 text-success text-xs font-semibold border border-success/30">
                      <Shield className="w-3 h-3" />
                      SECURED ON BLOCKCHAIN
                    </div>
                    <h2 className="text-3xl font-display font-bold">{degreeType} in {degreeName}</h2>
                    <p className="text-muted-foreground">Successfully verified and recorded with EDU-ID: <span className="text-foreground font-mono">{issuedCertificate.certificateId}</span></p>
                  </div>

                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <Card className="bg-background/40 border-white/5 p-4 flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="text-[10px] text-muted-foreground">STUDENT</p>
                        <p className="text-sm font-semibold">{studentName}</p>
                      </div>
                    </Card>
                    <Card className="bg-background/40 border-white/5 p-4 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="text-[10px] text-muted-foreground">DATE</p>
                        <p className="text-sm font-semibold">{issueDate}</p>
                      </div>
                    </Card>
                  </div>

                  <div className="flex gap-4 pt-4 justify-center md:justify-start">
                    <Button onClick={() => window.print()} variant="secondary" className="shadow-lg h-12 px-6">
                      <Download className="w-4 h-4 mr-2" />
                      Download Evidence
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setIssuedCertificate(null);
                        setStudentId("");
                        setStudentName("");
                      }}
                    >
                      Issue Next
                    </Button>
                  </div>
                </div>

                <div className="w-full md:w-auto p-6 bg-white rounded-2xl shadow-2xl shadow-success/10 rotate-1 hover:rotate-0 transition-transform duration-500">
                  <QRCodeSVG value={issuedCertificate.qrCodeUrl} size={180} level="H" />
                  <p className="text-[10px] text-center mt-4 text-black font-semibold uppercase tracking-wider">Verification Pointer</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

