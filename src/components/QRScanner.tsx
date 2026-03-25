import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (errorMessage: string) => void;
}

const QRScanner = ({ isOpen, onClose, onScanSuccess, onScanFailure }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerId = "qr-code-reader";

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isOpen) {
      // Small delay to ensure the Dialog content is fully rendered in the DOM
      const timer = setTimeout(() => {
        const element = document.getElementById(scannerId);
        if (!element) return;

        scanner = new Html5QrcodeScanner(
          scannerId,
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            if (scanner) {
              scanner.clear().then(() => {
                onScanSuccess(decodedText);
                onClose();
              }).catch(err => {
                console.error("Failed to clear scanner", err);
                onScanSuccess(decodedText);
                onClose();
              });
            }
          },
          (errorMessage) => {
            if (onScanFailure) onScanFailure(errorMessage);
          }
        );

        scannerRef.current = scanner;
      }, 50);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(err => {
            console.error("Failed to clear scanner on cleanup", err);
          });
        }
      };
    }
  }, [isOpen, onScanSuccess, onScanFailure, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Scan Certificate QR Code</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <div id={scannerId} className="w-full max-w-[350px] overflow-hidden rounded-lg border border-border bg-slate-50 dark:bg-slate-900"></div>
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Point your camera at the QR code on the certificate.
          </p>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;
