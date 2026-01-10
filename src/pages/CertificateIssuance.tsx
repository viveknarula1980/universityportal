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
  Award
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";

export default function CertificateIssuance() {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [degreeName, setDegreeName] = useState("");
  const [degreeType, setDegreeType] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuedCertificate, setIssuedCertificate] = useState<{
    certificateId: string;
    qrCodeUrl: string;
    blockchainHash: string;
  } | null>(null);
  const { toast } = useToast();

  // Default student IDs that exist in the system
  const defaultStudents = [
    { id: "CS2024-0892", name: "Anupam" },
  ];

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
      // Call real API to issue certificate
      const response = await apiService.issueCertificate({
        studentId,
        studentName,
        degreeName,
        degreeType,
        issueDate: new Date(issueDate).toISOString(),
      });

      if (response.success && response.data) {
        console.log("Certificate issuance response:", response); // Debug
        const certData = response.data;
        console.log("Certificate data:", certData); // Debug
        setIssuedCertificate({
          certificateId: certData.certificateId || certData.id || "N/A",
          qrCodeUrl: certData.qrCodeUrl || certData.qr_code_url || "",
          blockchainHash: certData.blockchainHash || certData.blockchain_hash || "",
        });
        
        console.log("Certificate ID set to:", certData.certificateId || certData.id); // Debug

        toast({
          title: "Certificate issued!",
          description: "Certificate has been recorded on the blockchain.",
        });
      } else {
        // API returned an error response
        const errorMessage = response.error || "Failed to issue certificate";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Certificate issuance error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        data: error.data
      });
      
      // Try to extract error message from response
      let errorMessage = "Failed to issue certificate. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleDownloadPDF = () => {
    // In production, generate actual PDF with certificate details
    toast({
      title: "PDF Download",
      description: "PDF certificate generation would be implemented here.",
    });
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Certificate Issuance</h1>
              <p className="text-muted-foreground">
                Issue blockchain-verified certificates for graduates
              </p>
            </div>
          </div>
        </div>

        {!issuedCertificate ? (
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-blockchain" />
              <h2 className="font-display font-semibold text-lg">Certificate Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID *</Label>
                <div className="space-y-2">
                  <Input
                    id="studentId"
                    placeholder="CS2024-0892"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    <p className="mb-1">Available students:</p>
                    <div className="flex flex-wrap gap-2">
                      {defaultStudents.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setStudentId(student.id);
                            setStudentName(student.name);
                          }}
                          className="px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-xs"
                        >
                          {student.id} ({student.name})
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-warning/80">
                      ⚠️ Student must exist in the system. Use an existing Student ID.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentName">Student Name *</Label>
                <Input
                  id="studentName"
                  placeholder="John Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degreeType">Degree Type *</Label>
                <Select value={degreeType} onValueChange={setDegreeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                    <SelectItem value="Master">Master's Degree</SelectItem>
                    <SelectItem value="Doctorate">Doctorate</SelectItem>
                    <SelectItem value="Certificate">Certificate</SelectItem>
                    <SelectItem value="Diploma">Diploma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="degreeName">Degree Name *</Label>
                <Input
                  id="degreeName"
                  placeholder="Computer Science"
                  value={degreeName}
                  onChange={(e) => setDegreeName(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blockchain-secondary/30 rounded-lg border border-blockchain/20">
              <Shield className="w-5 h-5 text-blockchain mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Blockchain Verification</p>
                <p>
                  This certificate will be permanently recorded on the blockchain with:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Certificate ID and metadata</li>
                  <li>University digital signature</li>
                  <li>Issue date and revocation status</li>
                  <li>Student ID (hashed for privacy)</li>
                </ul>
              </div>
            </div>

            <Button
              variant="blockchain"
              size="lg"
              className="w-full"
              onClick={handleIssueCertificate}
              disabled={isIssuing}
            >
              {isIssuing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Issuing Certificate...
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  Issue Certificate on Blockchain
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="glass-card rounded-2xl p-6 bg-success/10 border-2 border-success/30">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg mb-2">
                    Certificate Issued Successfully!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The certificate has been recorded on the blockchain and is now verifiable.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono">{issuedCertificate.certificateId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-xs">{issuedCertificate.blockchainHash}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Preview */}
            <div className="glass-card rounded-2xl p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Certificate Details */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-2">
                      {degreeType} in {degreeName}
                    </h2>
                    <p className="text-muted-foreground">Certificate of Completion</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Student</p>
                        <p className="font-medium">{studentName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Issue Date</p>
                        <p className="font-medium">
                          {new Date(issueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Certificate ID</p>
                        <p className="font-mono text-sm">{issuedCertificate.certificateId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleDownloadPDF} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={() => {
                        setIssuedCertificate(null);
                        setStudentId("");
                        setStudentName("");
                        setDegreeName("");
                        setDegreeType("");
                      }}
                      variant="outline"
                    >
                      Issue Another
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="lg:w-64 flex flex-col items-center justify-center space-y-4 p-6 bg-secondary/50 rounded-xl">
                  <QrCode className="w-6 h-6 text-muted-foreground" />
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG
                      value={issuedCertificate.qrCodeUrl}
                      size={200}
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Scan to verify certificate authenticity
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

