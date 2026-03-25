import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  CheckCircle2,
  X,
  Calendar,
  GraduationCap,
  Building2,
  QrCode,
  Search,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import { useParams } from "react-router-dom";
import QRScanner from "@/components/QRScanner";

interface CertificateVerification {
  certificateId: string;
  degreeName: string;
  universityName: string;
  issueDate: string;
  status: "valid" | "revoked" | "not_found";
  blockchainHash: string;
  studentName?: string;
}

interface CertificateData {
  id?: string;
  certificateId?: string;
  degree_name?: string;
  degreeName?: string;
  university_name?: string;
  universityName?: string;
  issue_date?: string | number;
  issueDate?: string | number;
  status?: string;
  revocation_status?: number;
  blockchain_hash?: string;
  blockchainHash?: string;
  student_name?: string;
  studentName?: string;
}

const extractCertId = (text: string) => {
  if (!text) return "";
  // If it's a full URL like http://.../verify/CERT-123, extract the ID
  if (text.includes("/verify/")) {
    const parts = text.split("/verify/");
    return parts[parts.length - 1].split("?")[0]; // Remove query params if any
  }
  return text.trim();
};

export default function Verification() {
  const { certificateId: urlCertificateId } = useParams();
  const [certificateId, setCertificateId] = useState(urlCertificateId || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<CertificateVerification | null>(null);
  const { toast } = useToast();

  const handleVerify = useCallback(async (id?: string) => {
    const rawId = id || certificateId.trim();
    const certId = extractCertId(rawId);
    
    if (!certId) {
      toast({
        title: "Certificate ID required",
        description: "Please enter a certificate ID or scan a QR code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Call real API to verify certificate
      const response = await apiService.verifyCertificate(certId);
      console.log("Verification API response:", response); // Debug

      if (response.success && response.data) {
        const cert = response.data as CertificateData;
        console.log("Certificate data:", cert); // Debug
        
        // Backend returns status as string: 'valid', 'revoked', 'invalid', or 'not_found'
        const status = cert.status || (cert.revocation_status === 1 ? "revoked" : "valid");
        
        // Format issue date - handle both number (timestamp) and string
        let formattedDate = "";
        const issueDateValue = cert.issue_date || cert.issueDate;
        if (issueDateValue) {
          try {
            const date = typeof issueDateValue === 'number' 
              ? new Date(issueDateValue) 
              : new Date(issueDateValue);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            }
          } catch (e) {
            console.error("Date formatting error:", e);
          }
        }
        
        setVerificationResult({
          certificateId: cert.id || cert.certificateId || certId,
          degreeName: cert.degree_name || cert.degreeName || "Not specified",
          universityName: cert.universityName || cert.university_name || "AI-Transparent University",
          issueDate: formattedDate || "Not specified",
          status: status as "valid" | "revoked" | "not_found",
          blockchainHash: cert.blockchain_hash || cert.blockchainHash || "",
          studentName: cert.student_name || cert.studentName,
        });
        
        toast({
          title: "Verification complete",
          description: `Certificate status: ${status}`,
        });
      } else {
        setVerificationResult({
          certificateId: certId,
          degreeName: "",
          universityName: "",
          issueDate: "",
          status: "not_found",
          blockchainHash: "",
        });
        toast({
          title: "Certificate not found",
          description: "This certificate ID does not exist in our records.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setVerificationResult({
        certificateId: certId,
        degreeName: "",
        universityName: "",
        issueDate: "",
        status: "not_found",
        blockchainHash: "",
      });
      toast({
        title: "Verification failed",
        description: error.message || "An error occurred during verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [certificateId, toast]);

  // Auto-verify if certificate ID is in URL
  useEffect(() => {
    if (urlCertificateId && urlCertificateId !== certificateId) {
      setCertificateId(urlCertificateId);
      handleVerify(urlCertificateId);
    }
  }, [urlCertificateId, certificateId, handleVerify]);

  const handleQRScan = () => {
    setIsScannerOpen(true);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCertificateId(text);
        toast({
          title: "Pasted from clipboard",
          description: "Certificate ID pasted. Click Verify to check.",
        });
      }
    } catch (error) {
      toast({
        title: "Clipboard access denied",
        description: "Please paste the certificate ID manually.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <Badge className="bg-success/10 text-success border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Valid
          </Badge>
        );
      case "revoked":
        return (
          <Badge className="bg-destructive/10 text-destructive border-0">
            <X className="w-3 h-3 mr-1" />
            Revoked
          </Badge>
        );
      case "not_found":
        return (
          <Badge className="bg-warning/10 text-warning border-0">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Not Found
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-blockchain-secondary flex items-center justify-center">
              <Shield className="w-8 h-8 text-blockchain" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold">Certificate Verification</h1>
          <p className="text-muted-foreground text-lg">
            Verify the authenticity of certificates issued by AI-Transparent University
          </p>
          <p className="text-sm text-muted-foreground">
            No login required • Instant verification • Blockchain-verified
          </p>
        </div>

        {/* Verification Form */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="certificateId">Certificate ID or QR Code</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="certificateId"
                    placeholder="Enter certificate ID or scan QR code"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleVerify();
                      }
                    }}
                  />
                </div>
                <Button variant="outline" onClick={handleQRScan} title="Scan QR code using camera">
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR
                </Button>
                <Button variant="outline" onClick={handlePasteFromClipboard} title="Paste from clipboard">
                  Paste
                </Button>
                <Button
                  variant="blockchain"
                  onClick={() => handleVerify()}
                  disabled={isVerifying || !certificateId.trim()}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blockchain-secondary/30 rounded-lg border border-blockchain/20">
              <Shield className="w-5 h-5 text-blockchain mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">How it works</p>
                <p>
                  Enter a certificate ID or scan the QR code on the certificate. Our system will
                  verify the certificate against the blockchain to confirm its authenticity and
                  current status.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div
            className={cn(
              "glass-card rounded-2xl p-8 border-2 transition-all",
              verificationResult.status === "valid"
                ? "bg-success/10 border-success/30"
                : verificationResult.status === "revoked"
                ? "bg-destructive/10 border-destructive/30"
                : "bg-warning/10 border-warning/30"
            )}
          >
            <div className="flex items-start gap-4 mb-6">
              {verificationResult.status === "valid" ? (
                <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />
              ) : verificationResult.status === "revoked" ? (
                <X className="w-8 h-8 text-destructive flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-warning flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-display font-bold">Verification Result</h2>
                  {getStatusBadge(verificationResult.status)}
                </div>
                {verificationResult.status === "valid" && (
                  <p className="text-muted-foreground">
                    This certificate is valid and has been verified on the blockchain.
                  </p>
                )}
                {verificationResult.status === "revoked" && (
                  <p className="text-muted-foreground">
                    This certificate has been revoked by the issuing university.
                  </p>
                )}
                {verificationResult.status === "not_found" && (
                  <p className="text-muted-foreground">
                    This certificate ID was not found in our records.
                  </p>
                )}
              </div>
            </div>

            {verificationResult.status !== "not_found" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Degree</p>
                      <p className="font-medium">{verificationResult.degreeName || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">University</p>
                      <p className="font-medium">{verificationResult.universityName || "AI-Transparent University"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="font-medium">{verificationResult.issueDate || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
                    <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Certificate ID</p>
                      <p className="font-mono text-sm">{verificationResult.certificateId || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                {verificationResult.studentName && (
                  <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Student Name</p>
                      <p className="font-medium">{verificationResult.studentName}</p>
                    </div>
                  </div>
                )}

                {verificationResult.blockchainHash && (
                  <div className="p-4 bg-blockchain-secondary/30 rounded-lg border border-blockchain/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Blockchain Hash</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(verificationResult.blockchainHash);
                          toast({
                            title: "Hash copied!",
                            description: "Blockchain hash copied to clipboard.",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="font-mono text-xs break-all">{verificationResult.blockchainHash}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const explorerUrl = `https://amoy.polygonscan.com/tx/${verificationResult.blockchainHash}`;
                        window.open(explorerUrl, '_blank');
                      }}
                    >
                      View on Polygonscan
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setVerificationResult(null);
                  setCertificateId("");
                }}
              >
                Verify Another Certificate
              </Button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 glass-card rounded-2xl p-8">
          <h3 className="font-display font-semibold text-lg mb-4">Why Blockchain Verification?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Shield className="w-6 h-6 text-blockchain" />
              <p className="font-medium">Tamper-Proof</p>
              <p className="text-sm text-muted-foreground">
                Certificates are stored on an immutable blockchain, making them impossible to forge.
              </p>
            </div>
            <div className="space-y-2">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <p className="font-medium">Instant Verification</p>
              <p className="text-sm text-muted-foreground">
                Verify certificates instantly without contacting the university or waiting for emails.
              </p>
            </div>
            <div className="space-y-2">
              <Building2 className="w-6 h-6 text-primary" />
              <p className="font-medium">Trusted Source</p>
              <p className="text-sm text-muted-foreground">
                All certificates are digitally signed by the issuing university and verified on-chain.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <QRScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(decodedText) => {
          const cleanedId = extractCertId(decodedText);
          setCertificateId(cleanedId);
          handleVerify(cleanedId);
        }}
      />

      <style>{`
        #qr-code-reader__dashboard {
          padding: 10px !important;
          border-top: 1px solid #e2e8f0 !important;
        }
        #qr-code-reader__camera_selection {
          padding: 8px !important;
          border-radius: 6px !important;
          border: 1px solid #e2e8f0 !important;
          margin-bottom: 10px !important;
          width: 100% !important;
        }
        #qr-code-reader__scan_region {
           background: transparent !important;
        }
        #qr-code-reader img {
           display: none !important;
        }
        #qr-code-reader button {
           background-color: hsl(var(--primary)) !important;
           color: hsl(var(--primary-foreground)) !important;
           padding: 8px 16px !important;
           border-radius: 8px !important;
           font-weight: 500 !important;
           border: none !important;
           cursor: pointer !important;
        }
        #qr-code-reader button:hover {
           opacity: 0.9 !important;
        }
      `}</style>
    </div>
  );
}

