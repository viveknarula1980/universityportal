import CryptoJS from 'crypto-js';
import { apiService } from './api';

export interface AssignmentSubmission {
  assignmentId: string;
  studentId: string; // hashed
  fileHash: string;
  aiUsageFlag: 'none' | 'partial' | 'full';
  aiTokenCount: number;
  timestamp: number;
  blockchainHash?: string;
}

export interface CertificateData {
  certificateId: string;
  degreeName: string;
  universitySignature: string;
  issueDate: number;
  revocationStatus: boolean;
  studentId: string; // hashed
  blockchainHash?: string;
}

/**
 * Generate SHA-256 hash of a file
 */
export async function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
        const hash = CryptoJS.SHA256(wordArray);
        resolve(hash.toString(CryptoJS.enc.Hex));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Hash student ID for privacy
 */
export function hashStudentId(studentId: string): string {
  return CryptoJS.SHA256(studentId).toString(CryptoJS.enc.Hex);
}

/**
 * Submit assignment to blockchain
 */
export async function submitToBlockchain(
  submission: AssignmentSubmission
): Promise<string> {
  try {
    // Try to submit via API
    const response = await apiService.submitAssignment({
      assignmentId: submission.assignmentId,
      file: new File([], 'dummy'), // File should be handled separately
      aiUsageType: submission.aiUsageFlag,
      aiTokenCount: submission.aiTokenCount,
    });

    if (response.success && response.data?.blockchainHash) {
      return response.data.blockchainHash;
    }
  } catch (error) {
    console.warn("API submission failed, using mock blockchain:", error);
  }

  // Fallback to mock blockchain for development
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // Generate a mock transaction hash
  const data = JSON.stringify(submission);
  const hash = CryptoJS.SHA256(data + Date.now().toString()).toString(CryptoJS.enc.Hex);
  return `0x${hash.slice(0, 40)}`;
}

/**
 * Issue certificate on blockchain
 */
export async function issueCertificateOnBlockchain(
  certificate: CertificateData
): Promise<string> {
  try {
    const response = await apiService.issueCertificate({
      studentId: certificate.studentId,
      studentName: "", // Will be filled by backend
      degreeName: certificate.degreeName,
      degreeType: "", // Will be extracted
      issueDate: new Date(certificate.issueDate).toISOString(),
    });

    if (response.success && response.data?.blockchainHash) {
      return response.data.blockchainHash;
    }
  } catch (error) {
    console.warn("API certificate issuance failed, using mock blockchain:", error);
  }

  // Fallback to mock blockchain
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  const data = JSON.stringify(certificate);
  const hash = CryptoJS.SHA256(data + Date.now().toString()).toString(CryptoJS.enc.Hex);
  return `0x${hash.slice(0, 40)}`;
}

/**
 * Verify certificate on blockchain
 */
export async function verifyCertificate(
  certificateId: string
): Promise<CertificateData | null> {
  try {
    const response = await apiService.verifyCertificate(certificateId);
    
    if (response.success && response.data) {
      return response.data as CertificateData;
    }
  } catch (error) {
    console.warn("API verification failed, using mock data:", error);
  }

  // Fallback to mock verification
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Return null to indicate not found
  return null;
}

/**
 * Generate unique assignment ID
 */
export function generateAssignmentId(): string {
  return `ASSIGN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique certificate ID
 */
export function generateCertificateId(): string {
  return `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get blockchain record by hash
 */
export async function getBlockchainRecord(hash: string) {
  try {
    const response = await apiService.getBlockchainRecord(hash);
    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn("Failed to fetch blockchain record:", error);
  }
  return null;
}

