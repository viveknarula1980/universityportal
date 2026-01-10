// API Service Layer
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem("token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Return error response with details from backend
        return {
          success: false,
          error: data.error || data.message || `Request failed with status ${response.status}`,
        };
      }

      // Backend returns { success: true, data: {...} }
      // Return the data directly if it has a data property, otherwise return the whole response
      if (data.success && data.data) {
        return { success: true, data: data.data };
      }
      
      return { success: true, data };
    } catch (error: any) {
      console.error("API request error:", error);
      return {
        success: false,
        error: error.message || "Network error",
      };
    }
  }

  // Assignment APIs
  async submitAssignment(submission: {
    assignmentId: string;
    file: File;
    assignmentTitle?: string;
    course?: string;
    aiUsageType: "none" | "partial" | "full";
    aiTokenCount: number;
  }) {
    const formData = new FormData();
    formData.append("file", submission.file);
    formData.append("assignmentId", submission.assignmentId);
    formData.append("aiUsageType", submission.aiUsageType);
    formData.append("aiTokenCount", submission.aiTokenCount.toString());

    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/assignments/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.error || data.details || "Failed to submit assignment";
      throw new Error(errorMessage);
    }

    return data;
  }

  async getAssignments() {
    return this.request("/assignments");
  }

  async getAssignmentById(id: string) {
    return this.request(`/assignments/${id}`);
  }

  async getSubmissions() {
    return this.request("/assignments/submissions");
  }

  // Certificate APIs
  async issueCertificate(certificate: {
    studentId: string;
    studentName: string;
    degreeName: string;
    degreeType: string;
    issueDate: string;
  }) {
    return this.request("/certificates/issue", {
      method: "POST",
      body: JSON.stringify(certificate),
    });
  }

  async getCertificates() {
    return this.request("/certificates");
  }

  async revokeCertificate(certificateId: string) {
    return this.request(`/certificates/${certificateId}/revoke`, {
      method: "POST",
    });
  }

  async verifyCertificate(certificateId: string) {
    return this.request(`/certificates/verify/${certificateId}`);
  }

  // Faculty APIs
  async getSubmissions(filters?: {
    course?: string;
    status?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.course) queryParams.append("course", filters.course);
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.search) queryParams.append("search", filters.search);

    return this.request(`/faculty/submissions?${queryParams.toString()}`);
  }

  async gradeSubmission(submissionId: string, grade: string) {
    return this.request(`/faculty/submissions/${submissionId}/grade`, {
      method: "POST",
      body: JSON.stringify({ grade }),
    });
  }

  // Admin APIs
  async updateAILimits(limits: {
    tokensPerSemester: number;
    contextWindow: number;
  }) {
    return this.request("/admin/ai-limits", {
      method: "POST",
      body: JSON.stringify(limits),
    });
  }

  async getAILimits() {
    return this.request("/admin/ai-limits");
  }

  async getAuditLogs() {
    return this.request("/admin/audit-logs");
  }

  // Blockchain APIs
  async getBlockchainRecords() {
    return this.request("/blockchain/records");
  }

  async getBlockchainRecord(hash: string) {
    return this.request(`/blockchain/records/${hash}`);
  }

  // AI APIs
  async generateAIContent(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }) {
    return this.request("/ai/generate", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        ...options,
      }),
    });
  }

  async getAIUsage() {
    return this.request("/ai/usage");
  }

  async getAIStatus() {
    return this.request("/ai/status");
  }
}

export const apiService = new ApiService();

