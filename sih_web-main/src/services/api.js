// API Service for Civic Connect Frontend
// Centralized API communication with FastAPI backend

import { API_ENDPOINTS, ERROR_MESSAGES } from '../utils/constants';

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.timeout = 30000; // 30 seconds
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

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw error;
    }
  }

  // Token management
  getToken() {
    return localStorage.getItem('access_token');
  }

  setToken(token) {
    localStorage.setItem('access_token', token);
  }

  removeToken() {
    localStorage.removeItem('access_token');
  }

  // Authentication API calls
  auth = {
    login: async (credentials) => {
      const response = await this.request(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.access_token) {
        this.setToken(response.access_token);
      }
      
      return response;
    },

    register: async (userData) => {
      return await this.request(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    logout: async () => {
      try {
        await this.request(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
        });
      } finally {
        this.removeToken();
      }
    },

    getCurrentUser: async () => {
      return await this.request(API_ENDPOINTS.AUTH.PROFILE);
    },

    verifyToken: async () => {
      return await this.request(API_ENDPOINTS.AUTH.VERIFY_TOKEN, {
        method: 'POST',
      });
    },

    refreshToken: async () => {
      return await this.request(API_ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
      });
    },
  };

  // Issues API calls
  issues = {
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.ISSUES.LIST}?${queryString}` : API_ENDPOINTS.ISSUES.LIST;
      return await this.request(endpoint);
    },

    create: async (issueData) => {
      return await this.request(API_ENDPOINTS.ISSUES.CREATE, {
        method: 'POST',
        body: JSON.stringify(issueData),
      });
    },

    createWithImage: async (formData) => {
      return await this.request(API_ENDPOINTS.ISSUES.CREATE_WITH_IMAGE, {
        method: 'POST',
        headers: {}, // Let browser set Content-Type for FormData
        body: formData,
      });
    },

    getById: async (issueId) => {
      return await this.request(API_ENDPOINTS.ISSUES.DETAIL.replace(':id', issueId));
    },

    update: async (issueId, updateData) => {
      return await this.request(API_ENDPOINTS.ISSUES.UPDATE.replace(':id', issueId), {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },

    delete: async (issueId) => {
      return await this.request(API_ENDPOINTS.ISSUES.DELETE.replace(':id', issueId), {
        method: 'DELETE',
      });
    },

    vote: async (issueId) => {
      return await this.request(API_ENDPOINTS.ISSUES.VOTE.replace(':id', issueId), {
        method: 'POST',
      });
    },

    removeVote: async (issueId) => {
      return await this.request(API_ENDPOINTS.ISSUES.VOTE.replace(':id', issueId), {
        method: 'DELETE',
      });
    },

    search: async (searchParams) => {
      return await this.request(API_ENDPOINTS.ISSUES.SEARCH, {
        method: 'POST',
        body: JSON.stringify(searchParams),
      });
    },

    getStats: async () => {
      return await this.request(API_ENDPOINTS.ISSUES.STATS);
    },

    getNearby: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`${API_ENDPOINTS.ISSUES.NEARBY}?${queryString}`);
    },

    uploadImage: async (formData) => {
      return await this.request(API_ENDPOINTS.ISSUES.UPLOAD_IMAGE, {
        method: 'POST',
        headers: {}, // Let browser set Content-Type for FormData
        body: formData,
      });
    },
  };

  // Assignments API calls
  assignments = {
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.ASSIGNMENTS.LIST}?${queryString}` : API_ENDPOINTS.ASSIGNMENTS.LIST;
      return await this.request(endpoint);
    },

    create: async (assignmentData) => {
      return await this.request(API_ENDPOINTS.ASSIGNMENTS.CREATE, {
        method: 'POST',
        body: JSON.stringify(assignmentData),
      });
    },

    getById: async (assignmentId) => {
      return await this.request(API_ENDPOINTS.ASSIGNMENTS.DETAIL.replace(':id', assignmentId));
    },

    update: async (assignmentId, updateData) => {
      return await this.request(API_ENDPOINTS.ASSIGNMENTS.UPDATE.replace(':id', assignmentId), {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },

    delete: async (assignmentId) => {
      return await this.request(API_ENDPOINTS.ASSIGNMENTS.DELETE.replace(':id', assignmentId), {
        method: 'DELETE',
      });
    },

    getMyAssignments: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.ASSIGNMENTS.MY_ASSIGNMENTS}?${queryString}` : API_ENDPOINTS.ASSIGNMENTS.MY_ASSIGNMENTS;
      return await this.request(endpoint);
    },

    bulkAssign: async (bulkData) => {
      return await this.request(API_ENDPOINTS.ASSIGNMENTS.BULK_ASSIGN, {
        method: 'POST',
        body: JSON.stringify(bulkData),
      });
    },

    getDepartmentStats: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.ASSIGNMENTS.STATS}?${queryString}` : API_ENDPOINTS.ASSIGNMENTS.STATS;
      return await this.request(endpoint);
    },

    getWorkloadStats: async () => {
      return await this.request(API_ENDPOINTS.ASSIGNMENTS.WORKLOAD);
    },
  };

  // Updates API calls
  updates = {
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.UPDATES.LIST}?${queryString}` : API_ENDPOINTS.UPDATES.LIST;
      return await this.request(endpoint);
    },

    create: async (updateData) => {
      return await this.request(API_ENDPOINTS.UPDATES.CREATE, {
        method: 'POST',
        body: JSON.stringify(updateData),
      });
    },

    getById: async (updateId) => {
      return await this.request(API_ENDPOINTS.UPDATES.DETAIL.replace(':id', updateId));
    },

    delete: async (updateId) => {
      return await this.request(API_ENDPOINTS.UPDATES.DELETE.replace(':id', updateId), {
        method: 'DELETE',
      });
    },

    getRecent: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.UPDATES.RECENT}?${queryString}` : API_ENDPOINTS.UPDATES.RECENT;
      return await this.request(endpoint);
    },

    getByIssue: async (issueId) => {
      return await this.request(API_ENDPOINTS.UPDATES.BY_ISSUE.replace(':id', issueId));
    },

    getActivityStats: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.UPDATES.STATS}?${queryString}` : API_ENDPOINTS.UPDATES.STATS;
      return await this.request(endpoint);
    },
  };

  // Users API calls
  users = {
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.USERS.LIST}?${queryString}` : API_ENDPOINTS.USERS.LIST;
      return await this.request(endpoint);
    },

    getById: async (userId) => {
      return await this.request(API_ENDPOINTS.USERS.DETAIL.replace(':id', userId));
    },

    update: async (userId, updateData) => {
      return await this.request(API_ENDPOINTS.USERS.UPDATE.replace(':id', userId), {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },

    getStaff: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.USERS.STAFF}?${queryString}` : API_ENDPOINTS.USERS.STAFF;
      return await this.request(endpoint);
    },

    getDepartments: async () => {
      return await this.request(API_ENDPOINTS.USERS.DEPARTMENTS);
    },

    getStats: async () => {
      return await this.request(API_ENDPOINTS.USERS.STATS);
    },

    getWorkload: async (userId) => {
      return await this.request(API_ENDPOINTS.USERS.WORKLOAD.replace(':id', userId));
    },

    changeRole: async (userId, newRole) => {
      return await this.request(API_ENDPOINTS.USERS.CHANGE_ROLE.replace(':id', userId), {
        method: 'POST',
        body: JSON.stringify({ role: newRole }),
      });
    },
  };

  // Files API calls
  files = {
    uploadImage: async (formData) => {
      return await this.request(API_ENDPOINTS.FILES.UPLOAD_IMAGE, {
        method: 'POST',
        headers: {}, // Let browser set Content-Type for FormData
        body: formData,
      });
    },

    uploadDocument: async (formData) => {
      return await this.request(API_ENDPOINTS.FILES.UPLOAD_DOCUMENT, {
        method: 'POST',
        headers: {}, // Let browser set Content-Type for FormData
        body: formData,
      });
    },

    uploadMultiple: async (formData) => {
      return await this.request(API_ENDPOINTS.FILES.UPLOAD_MULTIPLE, {
        method: 'POST',
        headers: {}, // Let browser set Content-Type for FormData
        body: formData,
      });
    },

    cameraCapture: async (formData) => {
      return await this.request(API_ENDPOINTS.FILES.CAMERA_CAPTURE, {
        method: 'POST',
        headers: {}, // Let browser set Content-Type for FormData
        body: formData,
      });
    },

    delete: async (filePath) => {
      return await this.request(API_ENDPOINTS.FILES.DELETE.replace(':path', encodeURIComponent(filePath)), {
        method: 'DELETE',
      });
    },

    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.FILES.LIST}?${queryString}` : API_ENDPOINTS.FILES.LIST;
      return await this.request(endpoint);
    },

    getInfo: async () => {
      return await this.request(API_ENDPOINTS.FILES.INFO);
    },

    validate: async (fileUrl) => {
      return await this.request(`${API_ENDPOINTS.FILES.VALIDATE}?file_url=${encodeURIComponent(fileUrl)}`);
    },

    getCameraStatus: async () => {
      return await this.request(API_ENDPOINTS.FILES.CAMERA_STATUS);
    },
  };

  // Dashboard API calls
  dashboard = {
    getOverview: async () => {
      return await this.request(API_ENDPOINTS.DASHBOARD.OVERVIEW);
    },

    getTrends: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.DASHBOARD.TRENDS}?${queryString}` : API_ENDPOINTS.DASHBOARD.TRENDS;
      return await this.request(endpoint);
    },

    getDepartmentStats: async () => {
      return await this.request(API_ENDPOINTS.DASHBOARD.DEPARTMENTS);
    },

    getPerformanceMetrics: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.DASHBOARD.PERFORMANCE}?${queryString}` : API_ENDPOINTS.DASHBOARD.PERFORMANCE;
      return await this.request(endpoint);
    },

    exportData: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${API_ENDPOINTS.DASHBOARD.EXPORT}?${queryString}` : API_ENDPOINTS.DASHBOARD.EXPORT;
      return await this.request(endpoint);
    },
  };

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