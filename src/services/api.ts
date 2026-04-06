const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3000/api");

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

  async getDashboardData() {
    return this.request("/assignments/dashboard");
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

  async extractDegreeInfo(image: File | string) {
    if (typeof image === 'string') {
      // Base64 string
      return this.request("/certificates/extract", {
        method: "POST",
        body: JSON.stringify({ image }),
      });
    } else {
      // File object
      const formData = new FormData();
      formData.append("degreeImage", image);
      
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/certificates/extract`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to extract degree info");
      }
      return data;
    }
  }

  async bulkIssueCertificates(certificates: any[]) {
    return this.request("/certificates/bulk-issue", {
      method: "POST",
      body: JSON.stringify({ certificates }),
    });
  }

  // Faculty APIs
  async getFacultySubmissions(filters?: {
    course?: string;
    status?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.course) queryParams.append("course", filters.course);
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.search) queryParams.append("search", filters.search);

    return this.request(`/assignments/faculty/submissions?${queryParams.toString()}`);
  }

  async getSubmissionDetails(submissionId: string) {
    return this.request(`/assignments/submissions/${submissionId}`);
  }

  async downloadSubmissionFile(submissionId: string) {
    const token = this.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3000/api");
    const response = await fetch(`${API_BASE_URL}/assignments/submissions/${submissionId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `submission-${submissionId}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        // Remove quotes if present and decode URI
        filename = filenameMatch[1].replace(/['"]/g, '');
        try {
          filename = decodeURIComponent(filename);
        } catch (e) {
          // If decoding fails, use as is
        }
      }
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async gradeSubmission(submissionId: string, grade: string) {
    return this.request(`/assignments/submissions/${submissionId}/grade`, {
      method: "POST",
      body: JSON.stringify({ grade }),
    });
  }

  // Admin APIs
  async getAdminStats() {
    return this.request("/admin/stats");
  }

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

  async getAuditLogs(limit?: number, offset?: number) {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit.toString());
    if (offset) queryParams.append("offset", offset.toString());
    const query = queryParams.toString();
    return this.request(`/admin/audit-logs${query ? `?${query}` : ''}`);
  }

  async getAdminUsers() {
    return this.request("/admin/users");
  }

  async createAdminUser(userData: {
    email: string;
    password: string;
    name: string;
    role: "student" | "faculty";
    studentId?: string;
    department?: string;
  }) {
    return this.request("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async bulkCreateAdminUsers(users: any[]) {
    return this.request("/admin/users/bulk", {
      method: "POST",
      body: JSON.stringify({ users }),
    });
  }
  async getBlockchainRecords() {
    return this.request("/blockchain/records");
  }

  async getBlockchainRecord(hash: string) {
    return this.request(`/blockchain/records/${hash}`);
  }

  async getCertificateBlockchainRecords() {
    return this.request("/certificates/blockchain-records");
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

  async getAIRecommendations() {
    return this.request("/ai/recommendations");
  }

  async analyzeCV(file: File) {
    const formData = new FormData();
    formData.append("cv", file);
    
    const token = this.getToken();
    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3000/api");
    const response = await fetch(`${API_URL}/ai/analyze-cv`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to analyze CV");
    }
    return data;
  }

  async analyzeLinkedIn(url: string) {
    return this.request("/ai/analyze-linkedin", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  }

  async verifyLoginOtp(email: string, code: string) {
    return this.request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  }
}

export const apiService = new ApiService();

