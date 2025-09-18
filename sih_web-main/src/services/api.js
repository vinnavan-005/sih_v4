// API Service for Civic Connect Frontend
// Centralized API communication with FastAPI backend

import { API_ENDPOINTS, ERROR_MESSAGES } from '../utils/constants';

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.timeout = 30000; // 30 seconds
  }

  // Helper method to clean parameters - removes empty/null/undefined values
  cleanParams(params) {
    const cleaned = {};
    for (const [key, value] of Object.entries(params)) {
      // Skip empty strings, null, undefined, and empty arrays
      if (value !== '' && value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0)) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  // Helper method to build query string from clean parameters
  buildQueryString(params) {
    const cleanedParams = this.cleanParams(params);
    return new URLSearchParams(cleanedParams).toString();
  }

  // Private method for making requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.detail || `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response.text();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      if (error instanceof ApiError) {
        await this.handleAuthError(error);
        throw error;
      }

      throw new ApiError(
        error.message || ERROR_MESSAGES.NETWORK_ERROR,
        0
      );
    }
  }

  // Token management methods
  getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  setToken(token, persistent = true) {
    if (persistent) {
      localStorage.setItem('token', token);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
    }
  }

  removeToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  // Auth API calls
  async login(credentials) {
    const response = await this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async signup(userData) {
    return await this.request(API_ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    try {
      await this.request(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser() {
    return await this.request(API_ENDPOINTS.AUTH.PROFILE);
  }

  async verifyToken() {
    return await this.request(API_ENDPOINTS.AUTH.VERIFY_TOKEN, {
      method: 'POST',
    });
  }

  async refreshToken() {
    return await this.request(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
    });
  }

  // Issues API calls - FIXED PARAMETER HANDLING
  async getIssues(params = {}) {
    // Map frontend parameter names to backend parameter names if needed
    const backendParams = {
      status: params.status, // maps to status_filter in backend
      category: params.category,
      citizen_id: params.citizen_id,
      department: params.department,
      min_upvotes: params.min_upvotes,
      has_location: params.has_location,
      search: params.search,
      page: params.page || 1,
      per_page: params.per_page || 20,
      order_by: params.order_by || '-created_at'
    };

    const queryString = this.buildQueryString(backendParams);
    const endpoint = queryString ? `${API_ENDPOINTS.ISSUES.LIST}?${queryString}` : API_ENDPOINTS.ISSUES.LIST;
    return await this.request(endpoint);
  }

  async getIssue(id) {
    return await this.request(API_ENDPOINTS.ISSUES.DETAIL.replace(':id', id));
  }

  async createIssue(issueData) {
    return await this.request(API_ENDPOINTS.ISSUES.CREATE, {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  }

  async updateIssue(id, issueData) {
    return await this.request(API_ENDPOINTS.ISSUES.UPDATE.replace(':id', id), {
      method: 'PUT',
      body: JSON.stringify(issueData),
    });
  }

  async deleteIssue(id) {
    return await this.request(API_ENDPOINTS.ISSUES.DELETE.replace(':id', id), {
      method: 'DELETE',
    });
  }

  async voteOnIssue(id, voteType) {
    return await this.request(API_ENDPOINTS.ISSUES.VOTE.replace(':id', id), {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
  }

  async searchIssues(params = {}) {
    // Search uses POST method with body
    return await this.request(API_ENDPOINTS.ISSUES.SEARCH, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getIssueStats() {
    return await this.request(API_ENDPOINTS.ISSUES.STATS);
  }

  async getNearbyIssues(params = {}) {
    const backendParams = {
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || 5.0,
      category: params.category,
      status: params.status,
      limit: params.limit || 20
    };

    const queryString = this.buildQueryString(backendParams);
    const endpoint = queryString ? `${API_ENDPOINTS.ISSUES.NEARBY}?${queryString}` : API_ENDPOINTS.ISSUES.NEARBY;
    return await this.request(endpoint);
  }

  // Assignments API calls - FIXED PARAMETER HANDLING
  async getAssignments(params = {}) {
    const backendParams = {
      issue_id: params.issue_id,
      staff_id: params.staff_id,
      status: params.status,
      department: params.department,
      page: params.page || 1,
      per_page: params.per_page || 20
    };

    const queryString = this.buildQueryString(backendParams);
    const endpoint = queryString ? `${API_ENDPOINTS.ASSIGNMENTS.LIST}?${queryString}` : API_ENDPOINTS.ASSIGNMENTS.LIST;
    return await this.request(endpoint);
  }

  async getAssignment(id) {
    return await this.request(API_ENDPOINTS.ASSIGNMENTS.DETAIL.replace(':id', id));
  }

  async createAssignment(assignmentData) {
    return await this.request(API_ENDPOINTS.ASSIGNMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  }

  async updateAssignment(id, assignmentData) {
    return await this.request(API_ENDPOINTS.ASSIGNMENTS.UPDATE.replace(':id', id), {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
  }

  async deleteAssignment(id) {
    return await this.request(API_ENDPOINTS.ASSIGNMENTS.DELETE.replace(':id', id), {
      method: 'DELETE',
    });
  }

  async getMyAssignments(params = {}) {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString ? `${API_ENDPOINTS.ASSIGNMENTS.MY_ASSIGNMENTS}?${queryString}` : API_ENDPOINTS.ASSIGNMENTS.MY_ASSIGNMENTS;
    return await this.request(endpoint);
  }

  async bulkAssign(assignmentData) {
    return await this.request(API_ENDPOINTS.ASSIGNMENTS.BULK_ASSIGN, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  }

  async getAssignmentStats() {
    return await this.request(API_ENDPOINTS.ASSIGNMENTS.STATS);
  }

  async getWorkloadStats() {
    return await this.request(API_ENDPOINTS.ASSIGNMENTS.WORKLOAD);
  }

  // Updates API calls - FIXED PARAMETER HANDLING
  async getUpdates(params = {}) {
    const backendParams = {
      issue_id: params.issue_id,
      staff_id: params.staff_id,
      page: params.page || 1,
      per_page: params.per_page || 20
    };

    const queryString = this.buildQueryString(backendParams);
    const endpoint = queryString ? `${API_ENDPOINTS.UPDATES.LIST}?${queryString}` : API_ENDPOINTS.UPDATES.LIST;
    return await this.request(endpoint);
  }

  async createUpdate(updateData) {
    return await this.request(API_ENDPOINTS.UPDATES.CREATE, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  }

  async getUpdate(id) {
    return await this.request(API_ENDPOINTS.UPDATES.DETAIL.replace(':id', id));
  }

  async deleteUpdate(id) {
    return await this.request(API_ENDPOINTS.UPDATES.DELETE.replace(':id', id), {
      method: 'DELETE',
    });
  }

  async getRecentUpdates(params = {}) {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString ? `${API_ENDPOINTS.UPDATES.RECENT}?${queryString}` : API_ENDPOINTS.UPDATES.RECENT;
    return await this.request(endpoint);
  }

  async getIssueUpdates(issueId) {
    return await this.request(API_ENDPOINTS.UPDATES.BY_ISSUE.replace(':id', issueId));
  }

  async getActivityStats() {
    return await this.request(API_ENDPOINTS.UPDATES.STATS);
  }

  // Users API calls - FIXED PARAMETER HANDLING
  async getUsers(params = {}) {
    const backendParams = {
      role: params.role,
      department: params.department,
      page: params.page || 1,
      per_page: params.per_page || 20
    };

    const queryString = this.buildQueryString(backendParams);
    const endpoint = queryString ? `${API_ENDPOINTS.USERS.LIST}?${queryString}` : API_ENDPOINTS.USERS.LIST;
    return await this.request(endpoint);
  }

  async getUser(id) {
    return await this.request(API_ENDPOINTS.USERS.DETAIL.replace(':id', id));
  }

  async updateUser(id, userData) {
    return await this.request(API_ENDPOINTS.USERS.UPDATE.replace(':id', id), {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getStaffUsers(params = {}) {
    const backendParams = {
      department: params.department,
      available_only: params.available_only,
      page: params.page || 1,
      per_page: params.per_page || 50
    };

    const queryString = this.buildQueryString(backendParams);
    const endpoint = queryString ? `${API_ENDPOINTS.USERS.STAFF}?${queryString}` : API_ENDPOINTS.USERS.STAFF;
    return await this.request(endpoint);
  }

  async getDepartments() {
    return await this.request(API_ENDPOINTS.USERS.DEPARTMENTS);
  }

  async getUserStats() {
    return await this.request(API_ENDPOINTS.USERS.STATS);
  }

  async getUserWorkload(userId) {
    return await this.request(API_ENDPOINTS.USERS.WORKLOAD.replace(':id', userId));
  }

  async changeUserRole(userId, newRole) {
    return await this.request(API_ENDPOINTS.USERS.CHANGE_ROLE.replace(':id', userId), {
      method: 'POST',
      body: JSON.stringify({ role: newRole }),
    });
  }

  // Files API calls
  async uploadImage(formData) {
    return await this.request(API_ENDPOINTS.FILES.UPLOAD_IMAGE, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async uploadDocument(formData) {
    return await this.request(API_ENDPOINTS.FILES.UPLOAD_DOCUMENT, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async uploadMultiple(formData) {
    return await this.request(API_ENDPOINTS.FILES.UPLOAD_MULTIPLE, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async captureFromCamera(formData) {
    return await this.request(API_ENDPOINTS.FILES.CAMERA_CAPTURE, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async deleteFile(filePath) {
    return await this.request(API_ENDPOINTS.FILES.DELETE.replace(':path', encodeURIComponent(filePath)), {
      method: 'DELETE',
    });
  }

  async listFiles(params = {}) {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString ? `${API_ENDPOINTS.FILES.LIST}?${queryString}` : API_ENDPOINTS.FILES.LIST;
    return await this.request(endpoint);
  }

  async getFileInfo() {
    return await this.request(API_ENDPOINTS.FILES.INFO);
  }

  async validateFile(fileUrl) {
    return await this.request(`${API_ENDPOINTS.FILES.VALIDATE}?file_url=${encodeURIComponent(fileUrl)}`);
  }

  async getCameraStatus() {
    return await this.request(API_ENDPOINTS.FILES.CAMERA_STATUS);
  }

  // DASHBOARD API CALLS
  async getDashboardOverview() {
    return await this.request(API_ENDPOINTS.DASHBOARD.OVERVIEW);
  }

  async getTrends(params = {}) {
    const backendParams = {
      days: params.days || 30
    };

    const queryString = this.buildQueryString(backendParams);
    const endpoint = queryString ? `${API_ENDPOINTS.DASHBOARD.TRENDS}?${queryString}` : API_ENDPOINTS.DASHBOARD.TRENDS;
    return await this.request(endpoint);
  }

  async getDepartmentStats() {
    return await this.request(API_ENDPOINTS.DASHBOARD.DEPARTMENTS);
  }

  async getPerformanceMetrics(params = {}) {
    const backendParams = {
      period: params.period || 'month'
    };

    const queryString = this.buildQueryString(backendParams);
    const endpoint = queryString ? `${API_ENDPOINTS.DASHBOARD.PERFORMANCE}?${queryString}` : API_ENDPOINTS.DASHBOARD.PERFORMANCE;
    return await this.request(endpoint);
  }

  async exportData(params = {}) {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString ? `${API_ENDPOINTS.DASHBOARD.EXPORT}?${queryString}` : API_ENDPOINTS.DASHBOARD.EXPORT;
    return await this.request(endpoint);
  }

  // Utility methods
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Request interceptors (for handling auth refresh, etc.)
  async handleAuthError(error) {
    if (error.status === 401) {
      // Token expired or invalid
      this.removeToken();
      
      // Redirect to login or trigger auth refresh
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw error;
  }
}

// Custom error class for API errors
class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiError };