import crypto from 'crypto';

export function generateAssignmentId() {
  return `ASSIGN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateCertificateId() {
  return `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function hashStudentId(studentId) {
  return crypto.createHash('sha256').update(studentId).digest('hex');
}

