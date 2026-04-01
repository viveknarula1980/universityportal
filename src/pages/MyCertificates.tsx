import { useState, useEffect } from "react";
import { 
  Award, 
  Shield, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Search,
  BookOpen,
  Calendar,
  User,
  History,
  Info,
  GraduationCap
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface Certificate {
  id: string;
  student_name: string;
  degree_name: string;
  degree_type: string;
  issue_date: number;
  blockchain_hash: string;
  qr_code_url: string;
}

export default function MyCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCertificates();
      if (response.success && response.data) {
        setCertificates(response.data as Certificate[]);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
      toast({
        title: "Error",
        description: "Failed to load certificates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    setIsVerifying(true);
    setVerificationStatus(null);
    try {
      const response = await apiService.verifyCertificate(id);
      if (response.success && response.data) {
        const data = response.data as { status: string };
        setVerificationStatus(data.status);
        if (data.status === 'valid') {
          toast({
            title: "Verified!",
            description: "This certificate is valid and exists on the blockchain.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Could not verify on blockchain.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Award className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">My Certificates</h1>
              <p className="text-muted-foreground italic">Your verified academic credentials on the blockchain</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 px-4 py-2 rounded-full border border-white/5 text-sm">
            <Shield className="w-4 h-4 text-blockchain" />
            <span className="font-medium">Protected by EduChain Pro</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-display">Syncing with blockchain...</p>
          </div>
        ) : certificates.length === 0 ? (
          <Card className="glass-card border-none p-12 text-center">
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h2 className="text-2xl font-bold mb-2">No Certificates Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              You haven't been issued any certificates yet. Once your university issues a degree, it will appear here automatically.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-display font-semibold px-1">Credential List</h3>
              {certificates.map((cert) => (
                <div 
                  key={cert.id}
                  onClick={() => setSelectedCert(cert)}
                  className={cn(
                    "glass-card p-4 cursor-pointer transition-all duration-300 border border-white/5 hover:border-primary/30",
                    selectedCert?.id === cert.id ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30" : "hover:bg-white/5"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{cert.degree_type} in {cert.degree_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Issued: {new Date(Number(cert.issue_date)).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-2 space-y-6">
              {selectedCert ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Certificate Viewer */}
                  <div className="glass-card border-none overflow-hidden group">
                    <div className="aspect-[1.414/1] bg-white relative p-10 print-container shadow-2xl overflow-visible">
                      {/* Premium Borders */}
                      <div className="absolute inset-4 border-[16px] border-primary/10 rounded-sm pointer-events-none"></div>
                      <div className="absolute inset-8 border-2 border-primary/20 pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rotate-45 translate-x-16 -translate-y-16"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rotate-45 -translate-x-16 translate-y-16"></div>

                      {/* Content */}
                      <div className="h-full flex flex-col items-center justify-between text-black relative z-10">
                        <div className="text-center space-y-2">
                          <div className="flex justify-center mb-2">
                            <GraduationCapLogo small />
                          </div>
                          <h4 className="text-xs uppercase tracking-[0.3em] text-primary/60 font-bold">Official Transcript of Record</h4>
                          <h1 className="text-4xl font-serif italic text-primary pt-2 pb-1">Certificate of Graduation</h1>
                          <p className="text-sm tracking-widest text-muted-foreground font-medium uppercase">This certifies that</p>
                        </div>

                        <div className="text-center space-y-2 w-full px-20">
                          <h2 className="text-3xl font-display font-bold py-1 border-b-2 border-primary/10 inline-block px-12">{selectedCert.student_name}</h2>
                          <div className="space-y-0.5">
                            <p className="text-muted-foreground text-[10px] italic">has successfully completed the requirements for the degree of</p>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">{selectedCert.degree_type} of {selectedCert.degree_name}</h3>
                          </div>
                        </div>

                        <div className="w-full grid grid-cols-3 items-end px-12 pb-10">
                          {/* Left: Identifiers */}
                          <div className="space-y-3 text-left">
                            <div className="space-y-0.5">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Enrollment ID</p>
                              <p className="text-[10px] font-mono font-bold opacity-80">{selectedCert.id}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Date of Issuance</p>
                              <p className="text-[10px] font-bold">{new Date(Number(selectedCert.issue_date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>

                          {/* Center: Signature */}
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <div className="h-10 w-40 border-b border-black/20 flex items-center justify-center overflow-hidden">
                              <img src="/university-signature.png" alt="Signature" className="h-full opacity-70 grayscale contrast-125" onError={(e) => (e.currentTarget.style.display = 'none')} />
                              <span className="text-sm font-serif italic opacity-40">University Chancellor</span>
                            </div>
                            <p className="text-[7px] uppercase tracking-[0.2em] text-muted-foreground text-center">Authenticated via Blockchain</p>
                          </div>

                          {/* Right: QR Code */}
                          <div className="flex justify-end">
                            <div className="p-1.5 border border-black/5 bg-white shadow-sm rounded flex flex-col items-center gap-1">
                              <QRCodeSVG value={`${window.location.origin}/verify/${selectedCert.id}`} size={48} />
                              <span className="text-[6px] uppercase tracking-tighter text-muted-foreground opacity-50">Scan to Verify</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={() => handleVerify(selectedCert.id)} 
                          disabled={isVerifying}
                          variant={verificationStatus === 'valid' ? 'default' : 'blockchain'}
                          className="shadow-lg min-w-32"
                        >
                          {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                          {verificationStatus === 'valid' ? 'Verified OK' : 'Verify Now'}
                        </Button>
                        <Button onClick={handleDownload} variant="secondary" className="shadow-lg px-6">
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                      
                      <div className="text-[10px] text-muted-foreground max-w-[200px] leading-tight">
                        <p className="font-mono text-[9px] truncate opacity-50">{selectedCert.blockchain_hash}</p>
                        <p className="mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-success" /> Verified Immutable Record
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Documentation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-5 space-y-3">
                      <div className="flex items-center gap-2 font-semibold">
                        <Info className="w-4 h-4 text-primary" />
                        <span>Blockchain Metadata</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Network</span>
                          <span className="font-mono text-primary">EduChain Polygon (Amoy)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Standard</span>
                          <span>ERC-2070 (Academic Credential)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Consensus</span>
                          <span>Proof of Stake (Augmented)</span>
                        </div>
                      </div>
                    </div>
                    <div className="glass-card p-5 space-y-3">
                      <div className="flex items-center gap-2 font-semibold">
                        <History className="w-4 h-4 text-accent" />
                        <span>Recent Activity</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-success mt-1" />
                          <div>
                            <p className="font-medium">Certificate Generated</p>
                            <p className="text-muted-foreground">2 days ago</p>
                          </div>
                        </div>
                        <div className="flex gap-3 opacity-60">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                          <div>
                            <p className="font-medium">University Signed</p>
                            <p className="text-muted-foreground">2 days ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-secondary/10 rounded-2xl border-2 border-dashed border-white/5 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Award className="w-8 h-8 text-muted-foreground opacity-50 font-thin" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display text-lg font-medium">Select a credential</p>
                    <p className="text-sm text-muted-foreground">Choose a certificate from the left list to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Print-Only Certificate - This is the most reliable way to print */}
      {selectedCert && (
        <div id="print-only-certificate" className="hidden-on-screen">
          <div className="bg-white relative p-10 shadow-none border-none">
             {/* Use basic divs for borders to ensure they print */}
            <div className="absolute inset-4 border-[16px] border-blue-100 rounded-sm"></div>
            <div className="absolute inset-8 border-2 border-blue-200"></div>
            
            <div className="h-full flex flex-col items-center justify-between text-black relative z-10 min-h-[180mm]">
              <div className="text-center space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h4 className="text-xs uppercase tracking-[0.3em] text-blue-600/60 font-bold">Official Transcript of Record</h4>
                <h1 className="text-5xl font-serif italic text-blue-800 pt-4 pb-2 text-center">Certificate of Graduation</h1>
                <p className="text-sm tracking-widest text-gray-500 font-medium uppercase">This certifies that</p>
              </div>

              <div className="text-center space-y-6 w-full px-20 my-10">
                <h2 className="text-4xl font-sans font-bold py-2 border-b-2 border-blue-100 inline-block px-12">{selectedCert.student_name}</h2>
                <div className="space-y-4">
                  <p className="text-gray-500 text-lg italic">has successfully completed the requirements for the degree of</p>
                  <h3 className="text-2xl font-bold font-sans uppercase tracking-wider">{selectedCert.degree_type} of {selectedCert.degree_name}</h3>
                </div>
              </div>

              <div className="w-full grid grid-cols-3 items-end px-12 pb-10 mt-auto">
                <div className="space-y-4 text-left">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Enrollment ID</p>
                    <p className="text-xs font-mono font-bold">{selectedCert.id}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Date of Issuance</p>
                    <p className="text-xs font-bold">{new Date(Number(selectedCert.issue_date)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-12 w-48 border-b border-gray-300 flex items-center justify-center">
                    <span className="text-xl font-serif italic text-gray-400">University Chancellor</span>
                  </div>
                  <p className="text-[8px] uppercase tracking-[0.2em] text-gray-400 text-center">Authenticated via Blockchain</p>
                </div>

                <div className="flex justify-end">
                  <div className="p-2 border border-blue-50 bg-white rounded flex flex-col items-center gap-1">
                    <QRCodeSVG value={`${window.location.origin}/verify/${selectedCert.id}`} size={64} />
                    <span className="text-[7px] uppercase tracking-tighter text-gray-400">Scan to Verify</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media screen {
          #print-only-certificate { display: none; }
        }
        
        @media print {
          @page { size: A4 landscape; margin: 0; }
          
          /* Hide the interactive UI entirely */
          body > #root > div, 
          main, 
          header, 
          aside,
          button,
          .MainLayout { 
            display: none !important; 
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #print-only-certificate {
            display: block !important;
            visibility: visible !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #print-only-certificate * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </MainLayout>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("animate-spin", className)}><History className="w-5 h-5" /></div>;
}

function GraduationCapLogo({ small }: { small?: boolean }) {
  return (
    <div className="relative">
      <div className={cn(
        "rounded-2xl bg-primary flex items-center justify-center shadow-inner",
        small ? "w-12 h-12" : "w-16 h-16"
      )}>
        <GraduationCap className={cn(small ? "w-6 h-6" : "w-8 h-8", "text-white")} />
      </div>
      <div className={cn(
        "absolute rounded-full bg-accent border-2 border-white flex items-center justify-center shadow-sm",
        small ? "-top-1 -right-1 w-5 h-5" : "-top-2 -right-2 w-6 h-6"
      )}>
        <Shield className={cn(small ? "w-2.5 h-2.5" : "w-3 h-3", "text-white")} />
      </div>
    </div>
  );
}
