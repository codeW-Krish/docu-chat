
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Types matching your PHP backend responses
export interface User {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface PdfFile {
  pdf_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  page_count: number;
  uploaded_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ChatSession {
  session_id: string;
  user_id: string;
  session_name: string;
  created_at: string;
  pdf_count?: number;
  pdfs?: PdfFile[];
}

export interface PdfReference {
  pdf_id: string;
  pdf_name: string;
  page_number: number;
  chunk_index: number;
  chunk_text: string;
  similarity: number;
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  sender: 'user' | 'ai';
  message_text: string;
  references?: PdfReference[];
  created_at: string;
  suggested_questions?: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string>;
}

// Request data interfaces
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface CreateSessionData {
  session_name: string;
  pdf_ids: string[];
}

export interface SendMessageData {
  session_id: string;
  message: string;
  pdf_ids?: string[];
  provider?: LlmProvider;
}

export type LlmProvider = 'groq' | 'cerebras';

class ApiClient {
  private baseUrl: string;
  private abortControllers: Map<string, AbortController>;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
    this.abortControllers = new Map();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = 30000
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const requestId = `${options.method || 'GET'}-${endpoint}-${Date.now()}`;

    // Create abort controller for timeout
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      signal: abortController.signal,
      credentials: 'include', // ✅ FIXED: Ensure credentials are included
      ...options,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      // Handle network errors
      if (response.status === 0) {
        throw this.createError('Network error: Unable to connect to server', 0);
      }

      // Handle CORS errors
      if (response.type === 'opaque' || response.status === 0) {
        throw this.createError('CORS error: Request blocked. Check server configuration.', 0);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          throw this.createError('Invalid JSON response from server', response.status);
        }
      } else {
        const text = await response.text();
        throw this.createError(`Unexpected response format: ${text.substring(0, 100)}`, response.status);
      }

      // Handle HTTP error statuses
      if (!response.ok) {
        // Handle 401 Unauthorized - try to refresh token
        // Don't attempt refresh if the failed request was already a refresh attempt
        if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/refresh')) {
          try {
            const newToken = await this.handleTokenRefresh();
            if (newToken) {
              // Retry the request with new token
              const retryConfig = { ...config };
              retryConfig.headers = {
                ...retryConfig.headers,
                'Authorization': `Bearer ${newToken}`
              };
              const retryResponse = await fetch(url, retryConfig);
              const retryData = await retryResponse.json();

              if (retryResponse.ok) {
                return retryData;
              } else {
                // If retry also fails, throw the retry error
                throw this.createError(
                  retryData?.message || retryData?.error || `HTTP ${retryResponse.status}: ${retryResponse.statusText}`,
                  retryResponse.status,
                  retryData?.errors
                );
              }
            }
          } catch (refreshError) {
            // Refresh failed, continue with original error
            console.error('Token refresh failed:', refreshError);
          }
        }

        throw this.createError(
          data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data?.errors
        );
      }

      // Handle backend error status
      if (data && data.status === 'error') {
        throw this.createError(
          data.message || 'Request failed',
          response.status,
          data.errors
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createError('Request timeout: Server took too long to respond', 408);
        }

        if (error instanceof TypeError) {
          throw this.createError('Network error: Check your connection and CORS configuration', 0);
        }
      }

      throw error;
    }
  }

  private createError(message: string, status: number, errors?: Record<string, string>): ApiError {
    return {
      message,
      status,
      errors
    };
  }

  // Cancel ongoing request
  cancelRequest(endpoint: string, method: string = 'GET') {
    const key = `${method}-${endpoint}`;
    this.abortControllers.forEach((controller, requestId) => {
      if (requestId.startsWith(key)) {
        controller.abort();
        this.abortControllers.delete(requestId);
      }
    });
  }

  // 🔐 AUTH ENDPOINTS
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await this.request<ApiResponse<{
      tokens: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      user: User;
    }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token securely
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data?.tokens?.access_token ?? '');
      localStorage.setItem('refreshToken', response.data?.tokens?.refresh_token ?? '');
    }

    return {
      success: response.status === 'success',
      message: response.message || 'Login successful',
      user: response.data?.user ?? { user_id: '', email: '', name: '', created_at: '' },
      token: response.data?.tokens?.access_token ?? '',
      refreshToken: response.data?.tokens?.refresh_token ?? ''
    };
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.request<ApiResponse<{
      tokens: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      user: User;
    }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store token securely
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data?.tokens?.access_token ?? '');
      localStorage.setItem('refreshToken', response.data?.tokens?.refresh_token ?? '');
    }

    return {
      success: response.status === 'success',
      message: response.message || 'Registration successful',
      user: response.data?.user ?? { user_id: '', email: '', name: '', created_at: '' },
      token: response.data?.tokens?.access_token ?? '',
      refreshToken: response.data?.tokens?.refresh_token ?? ''
    };
  }

  async updateProfile(data: { name: string; password?: string }): Promise<AuthResponse> {
    const response = await this.request<ApiResponse<{
      user: User;
    }>>('/auth/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Update stored user data
    if (typeof window !== 'undefined' && response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return {
      success: response.status === 'success',
      message: response.message || 'Profile updated successfully',
      user: response.data?.user ?? { user_id: '', email: '', name: '', created_at: '' },
      token: '', // Token doesn't change on profile update
      refreshToken: ''
    };
  }

  async registerInit(data: { name: string; email: string; password: string }): Promise<{ registration_token: string }> {
    const response = await this.request<ApiResponse<{ registration_token: string }>>('/auth/register-init', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async registerComplete(data: { otp: string; registration_token: string }): Promise<AuthResponse> {
    const response = await this.request<ApiResponse<{
      tokens: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      user: User;
    }>>('/auth/register-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token securely
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data?.tokens?.access_token ?? '');
      localStorage.setItem('refreshToken', response.data?.tokens?.refresh_token ?? '');
    }

    return {
      success: response.status === 'success',
      message: response.message || 'Registration successful',
      user: response.data?.user ?? { user_id: '', email: '', name: '', created_at: '' },
      token: response.data?.tokens?.access_token ?? '',
      refreshToken: response.data?.tokens?.refresh_token ?? ''
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await this.request<ApiResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return {
      message: response.message || 'Reset link sent'
    };
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await this.request<ApiResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });

    return {
      message: response.message || 'Password updated successfully'
    };
  }

  async logout(refreshToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request<ApiResponse>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }

      return {
        success: response.status === 'success',
        message: response.message || 'Logged out successfully'
      };
    } catch (error) {
      // Clear storage even if logout request fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    console.log('Attempting token refresh with refresh token:', refreshToken);
    const response = await this.request<ApiResponse<{
      tokens: {
        access_token: string;
      };
    }>>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    // Update stored token
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data!.tokens.access_token);
    }

    return {
      token: response.data!.tokens.access_token
    };
  }

  // Auto-refresh token when it expires
  private async handleTokenRefresh() {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (refreshToken) {
      try {
        const newToken = await this.refreshToken(refreshToken);
        return newToken.token;
      } catch (error) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/signin';
        }
        throw error;
      }
    }
    return null;
  }

  // 📄 PDF ENDPOINTS
  async uploadPdf(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ pdf: any; message: string }> {
    const url = `${this.baseUrl}/api/pdfs/upload`;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const formData = new FormData();
    formData.append("pdf_file", file);

    // // Get user ID from JWT token for PHP backend
    // if (token) {
    //   try {
    //     const payload = JSON.parse(atob(token.split(".")[1])); // decode JWT payload
    //     if (payload.user_id) {
    //       formData.append("user_id", payload.user_id);
    //     }
    //   } catch (err) {
    //     console.warn("Failed to decode token for user_id:", err);
    //   }
    // }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true; // send cookies/session to PHP backend

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            if (data.status === "error") {
              reject(new Error(data.message || "Upload failed"));
            } else {
              resolve({
                pdf: data.data,
                message: data.message || "Upload successful",
              });
            }
          } else {
            reject(new Error(data.message || `Upload failed with status ${xhr.status}`));
          }
        } catch (err) {
          reject(new Error("Invalid response from server"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));

      xhr.open("POST", url);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  }


  async getPdfs(): Promise<{ pdfs: PdfFile[] }> {
    const response = await this.request<ApiResponse<PdfFile[]>>('/api/pdfs');

    return {
      pdfs: response.data || []
    };
  }

  async getPdf(pdfId: string): Promise<{ pdf: PdfFile }> {
    const response = await this.request<ApiResponse<PdfFile>>(`/api/pdfs/${pdfId}`);

    return {
      pdf: response.data!
    };
  }

  async deletePdf(pdfId: string): Promise<{ message: string }> {
    const response = await this.request<ApiResponse>(`/api/pdfs/${pdfId}`, {
      method: 'DELETE',
    });

    return {
      message: response.message || 'PDF deleted successfully'
    };
  }

  async getPdfStatus(pdfId: string): Promise<{ pdf: PdfFile }> {
    const response = await this.request<ApiResponse<PdfFile>>(`/api/pdfs/${pdfId}/status`);

    return {
      pdf: response.data!
    };
  }

  // 💬 CHAT ENDPOINTS
  async generateSummary(sessionId: string, provider?: LlmProvider): Promise<ApiResponse<{ summary: string }>> {
    return this.request<ApiResponse<{ summary: string }>>('/api/chat/summary', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, provider }),
    });
  }

  async createSession(name: string, pdfIds: string[], provider?: LlmProvider): Promise<{ session: ChatSession }> {
    const response = await this.request<ApiResponse<ChatSession>>('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({
        session_name: name,
        pdf_ids: pdfIds,
        provider
      }),
    });

    return {
      session: response.data!
    };
  }

  async getSessions(): Promise<{ sessions: ChatSession[] }> {
    const response = await this.request<ApiResponse<ChatSession[]>>('/api/chat/sessions');

    return {
      sessions: response.data || []
    };
  }

  async getDashboardStats(): Promise<{ pdfCount: number; sessionCount: number }> {
    const response = await this.request<ApiResponse<{ pdf_count: number; session_count: number }>>('/api/dashboard/stats');

    return {
      pdfCount: response.data?.pdf_count || 0,
      sessionCount: response.data?.session_count || 0
    };
  }

  async getSession(sessionId: string): Promise<{ session: ChatSession; pdfs?: PdfFile[] }> {
    const response = await this.request<ApiResponse<{ session: ChatSession; pdfs?: PdfFile[] }>>(`/api/chat/sessions/${sessionId}`);

    return {
      session: response.data!.session,
      pdfs: response.data!.pdfs
    };
  }

  async sendMessage(sessionId: string, message: string, pdfIds?: string[], provider?: LlmProvider): Promise<{
    user_message: string;
    ai_response: string;
    references: PdfReference[];
    session_id: string;
    provider?: LlmProvider;
  }> {
    const response = await this.request<ApiResponse<{
      user_message: string;
      ai_response: string;
      references: PdfReference[];
      session_id: string;
      provider?: LlmProvider;
    }>>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        message: message,
        pdf_ids: pdfIds,
        provider
      }),
    });

    return response.data!;
  }

  async getSessionMessages(sessionId: string): Promise<{
    messages: ChatMessage[];
    session: ChatSession;
    pdfs?: PdfFile[];
  }> {
    const response = await this.request<ApiResponse<{
      session: ChatSession;
      messages: ChatMessage[];
      pdfs?: PdfFile[];
    }>>(`/api/chat/sessions/${sessionId}/messages`);

    return response.data!;
  }

  async addPdfToSession(sessionId: string, pdfIds: string[]): Promise<{ message: string }> {
    const response = await this.request<ApiResponse>(`/api/chat/sessions/${sessionId}/pdfs`, {
      method: 'POST',
      body: JSON.stringify({ pdf_ids: pdfIds }),
    });

    return {
      message: response.message || 'PDFs added to session successfully'
    };
  }

  async removePdfFromSession(sessionId: string, pdfId: string): Promise<{ message: string }> {
    const response = await this.request<ApiResponse>(`/api/chat/sessions/${sessionId}/pdfs/${pdfId}`, {
      method: 'DELETE',
    });

    return {
      message: response.message || 'PDF removed from session successfully'
    };
  }

  async deleteSession(sessionId: string): Promise<{ message: string }> {
    const response = await this.request<ApiResponse>(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    return {
      message: response.message || 'Session deleted successfully'
    };
  }

  // 🔧 UTILITY METHODS
  private getUserFromToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        user_id: payload.user_id || payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        created_at: new Date((payload.iat || payload.auth_time) * 1000).toISOString()
      };
    } catch {
      return null;
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('token');
    return token ? this.getUserFromToken(token) : null;
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  // 🩹 HEALTH CHECK & DEBUGGING
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/public/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ FIXED: Include credentials for health check
    });

    if (!response.ok) {
      throw this.createError(`Health check failed: ${response.statusText}`, response.status);
    }

    return response.json();
  }

  async testCors(): Promise<{ status: string; message: string; cors: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/public/health`, {
        method: 'GET',
        credentials: 'include', // ✅ FIXED: Include credentials for CORS test
      });

      const corsHeaders = {
        origin: response.headers.get('access-control-allow-origin'),
        methods: response.headers.get('access-control-allow-methods'),
        headers: response.headers.get('access-control-allow-headers'),
      };

      return {
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'CORS test passed' : 'CORS test failed',
        cors: !!corsHeaders.origin
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'CORS test failed',
        cors: false
      };
    }
  }

  async testConnection(): Promise<{
    server: boolean;
    cors: boolean;
    auth: boolean;
    message: string;
  }> {
    try {
      // Test basic connection
      const health = await this.healthCheck();
      const server = health.status === 'success';

      // Test CORS
      const corsTest = await this.testCors();
      const cors = corsTest.cors;

      // Test authentication (if token exists)
      let auth = false;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        try {
          await this.getPdfs();
          auth = true;
        } catch {
          auth = false;
        }
      }

      return {
        server,
        cors,
        auth,
        message: server ?
          (cors ? 'Connection successful' : 'Connected but CORS issues') :
          'Cannot connect to server'
      };
    } catch (error) {
      return {
        server: false,
        cors: false,
        auth: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Create singleton instance
export const api = new ApiClient();

// Utility function for handling API errors in components
export const handleApiError = (error: ApiError): string => {
  if (error.status === 0) {
    return 'Network error: Please check your connection and server status';
  }

  if (error.status === 401) {
    // Clear invalid token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    return 'Session expired. Please login again.';
  }

  if (error.status === 403) {
    return 'Access denied. You do not have permission for this action.';
  }

  if (error.status === 404) {
    return 'Requested resource not found.';
  }

  if (error.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return error.message || 'An unexpected error occurred';
};

// Hook-like function for React components (if using React)
export const useApi = () => {
  return {
    api,
    handleApiError,
    isAuthenticated: api.isAuthenticated.bind(api),
    getCurrentUser: api.getCurrentUser.bind(api),
  };
};
