// Application constants updated for FastAPI backend

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://192.168.1.103:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// User roles (matching backend schema)
export const USER_ROLES = {
  CITIZEN: 'citizen',
  STAFF: 'staff', 
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin'
};

// Issue statuses (matching backend schema)
export const ISSUE_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved'
};

// Issue priorities (matching backend schema)
export const ISSUE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high'
};

// Issue categories (matching backend schema)
export const ISSUE_CATEGORIES = {
  ROADS: 'roads',
  WASTE: 'waste',
  WATER: 'water',
  STREETLIGHT: 'streetlight',
  OTHER: 'other'
};

// Assignment statuses
export const ASSIGNMENT_STATUSES = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// Departments
export const DEPARTMENTS = {
  PUBLIC_WORKS: 'Public Works',
  WATER_MANAGEMENT: 'Water Management',
  TRANSPORTATION: 'Transportation',
  PARKS_RECREATION: 'Parks & Recreation',
  PUBLIC_SAFETY: 'Public Safety',
  ENVIRONMENTAL_SERVICES: 'Environmental Services',
  URBAN_PLANNING: 'Urban Planning'
};

// SLA Configuration
export const SLA_CONFIG = {
  DEFAULT_HOURS: 72, // 3 days
  HIGH_PRIORITY_HOURS: 48, // 2 days
  MEDIUM_PRIORITY_HOURS: 72, // 3 days
  LOW_PRIORITY_HOURS: 120, // 5 days
  ESCALATION_THRESHOLD_DAYS: 7
};

// Application routes
export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  
  // Dashboard routes
  ADMIN_DASHBOARD: '/admin-dashboard',
  STAFF_DASHBOARD: '/staff-dashboard',
  SUPERVISOR_DASHBOARD: '/supervisor-dashboard',
  
  // Feature routes
  ISSUES: '/issues',
  ISSUE_DETAILS: '/issue-details/:id',
  ANALYTICS: '/analytics',
  ESCALATION: '/escalation',
  SETTINGS: '/settings',
  TASK_ASSIGNMENT: '/task-assignment'
};

// API endpoints (FastAPI backend)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/me',
    VERIFY_TOKEN: '/api/auth/verify-token',
    REFRESH: '/api/auth/refresh'
  },
  ISSUES: {
    LIST: '/api/issues/',
    CREATE: '/api/issues/',
    DETAIL: '/api/issues/:id',
    UPDATE: '/api/issues/:id',
    DELETE: '/api/issues/:id',
    VOTE: '/api/issues/:id/vote',
    SEARCH: '/api/issues/search',
    STATS: '/api/issues/stats',
    NEARBY: '/api/issues/nearby',
    UPLOAD_IMAGE: '/api/issues/upload-image',
    CREATE_WITH_IMAGE: '/api/issues/create-with-image'
  },
  ASSIGNMENTS: {
    LIST: '/api/assignments/',
    CREATE: '/api/assignments/',
    DETAIL: '/api/assignments/:id',
    UPDATE: '/api/assignments/:id',
    DELETE: '/api/assignments/:id',
    MY_ASSIGNMENTS: '/api/assignments/my',
    BULK_ASSIGN: '/api/assignments/bulk-assign',
    STATS: '/api/assignments/stats/department',
    WORKLOAD: '/api/assignments/stats/workload'
  },
  UPDATES: {
    LIST: '/api/updates/',
    CREATE: '/api/updates/',
    DETAIL: '/api/updates/:id',
    DELETE: '/api/updates/:id',
    RECENT: '/api/updates/recent',
    BY_ISSUE: '/api/updates/issue/:id',
    STATS: '/api/updates/stats/activity'
  },
  USERS: {
    LIST: '/api/users/',
    DETAIL: '/api/users/:id',
    UPDATE: '/api/users/:id',
    STAFF: '/api/users/staff',
    DEPARTMENTS: '/api/users/departments',
    STATS: '/api/users/stats',
    WORKLOAD: '/api/users/:id/workload',
    CHANGE_ROLE: '/api/users/:id/change-role'
  },
  FILES: {
    UPLOAD_IMAGE: '/api/files/upload/image',
    UPLOAD_DOCUMENT: '/api/files/upload/document',
    UPLOAD_MULTIPLE: '/api/files/upload/multiple',
    CAMERA_CAPTURE: '/api/files/camera/capture',
    DELETE: '/api/files/delete/:path',
    LIST: '/api/files/list',
    INFO: '/api/files/info',
    VALIDATE: '/api/files/validate',
    CAMERA_STATUS: '/api/files/camera/status'
  },
  DASHBOARD: {
    OVERVIEW: '/api/dashboard/',
    TRENDS: '/api/dashboard/trends',
    DEPARTMENTS: '/api/dashboard/departments',
    PERFORMANCE: '/api/dashboard/performance',
    EXPORT: '/api/dashboard/export'
  }
};

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CURRENT_USER: 'currentUser',
  ESCALATION_LOGS: 'escalationLogs',
  THEME_PREFERENCE: 'themePreference',
  LANGUAGE_PREFERENCE: 'languagePreference',
  FILTERS: 'filters'
};

// UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 20,
  MAX_UPLOAD_SIZE_MB: 10,
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DEBOUNCE_DELAY_MS: 300,
  AUTO_SAVE_DELAY_MS: 1000,
  SESSION_TIMEOUT_MINUTES: 60,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  PAGINATION_SIZES: [10, 20, 50, 100]
};

// Chart colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#06B6D4',
  PURPLE: '#8B5CF6',
  PINK: '#EC4899',
  INDIGO: '#6366F1'
};

// Status colors for UI (matching backend statuses)
export const STATUS_COLORS = {
  [ISSUE_STATUSES.PENDING]: 'bg-red-100 text-red-800',
  [ISSUE_STATUSES.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [ISSUE_STATUSES.RESOLVED]: 'bg-green-100 text-green-800',
  // Assignment statuses
  [ASSIGNMENT_STATUSES.ASSIGNED]: 'bg-blue-100 text-blue-800',
  [ASSIGNMENT_STATUSES.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [ASSIGNMENT_STATUSES.COMPLETED]: 'bg-green-100 text-green-800'
};

// Priority colors for UI
export const PRIORITY_COLORS = {
  [ISSUE_PRIORITIES.LOW]: 'text-green-600',
  [ISSUE_PRIORITIES.MEDIUM]: 'text-yellow-600',
  [ISSUE_PRIORITIES.HIGH]: 'text-red-600'
};

// Validation rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
  TITLE_MAX_LENGTH: 200,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15
};

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`,
  NAME_TOO_LONG: `Name must not exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
  EMAIL_EXISTS: 'This email is already registered',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account temporarily locked due to multiple failed attempts',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FILE_TOO_LARGE: `File size must not exceed ${UI_CONFIG.MAX_UPLOAD_SIZE_MB}MB`,
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  PHONE_INVALID: 'Please enter a valid phone number'
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  ISSUE_CREATED: 'Issue created successfully!',
  ISSUE_UPDATED: 'Issue updated successfully!',
  ISSUE_DELETED: 'Issue deleted successfully!',
  ASSIGNMENT_CREATED: 'Assignment created successfully!',
  ASSIGNMENT_UPDATED: 'Assignment updated successfully!',
  UPDATE_ADDED: 'Update added successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  VOTE_RECORDED: 'Vote recorded successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};

// Default coordinates (Chennai, India - matching your backend)
export const DEFAULT_COORDINATES = {
  lat: 13.0827,
  lng: 80.2707
};

// Map configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 12,
  MARKER_ZOOM: 15,
  CLUSTER_ZOOM: 10,
  MAX_ZOOM: 18,
  MIN_ZOOM: 8
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME_DISPLAY: 'MMM dd, yyyy hh:mm a',
  TIME_DISPLAY: 'hh:mm a',
  ISO: 'iso'
};

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// File upload configuration
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
  MAX_FILES_PER_REQUEST: 5
};

// Permissions based on roles
export const ROLE_PERMISSIONS = {
  [USER_ROLES.CITIZEN]: [
    'create_issue',
    'view_own_issues',
    'vote_on_issues',
    'view_public_issues'
  ],
  [USER_ROLES.STAFF]: [
    'view_assigned_issues',
    'update_issue_status',
    'create_issue_updates',
    'view_department_issues'
  ],
  [USER_ROLES.SUPERVISOR]: [
    'assign_issues',
    'view_department_stats',
    'manage_staff_assignments',
    'escalate_issues'
  ],
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'view_all_issues',
    'system_configuration',
    'access_analytics',
    'bulk_operations'
  ]
};

// Export default object with commonly used constants
export default {
  API_CONFIG,
  USER_ROLES,
  ISSUE_STATUSES,
  ISSUE_PRIORITIES,
  ISSUE_CATEGORIES,
  ASSIGNMENT_STATUSES,
  DEPARTMENTS,
  SLA_CONFIG,
  ROUTES,
  API_ENDPOINTS,
  STORAGE_KEYS,
  UI_CONFIG,
  CHART_COLORS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_COORDINATES,
  MAP_CONFIG,
  DATE_FORMATS,
  NOTIFICATION_TYPES,
  FILE_CONFIG,
  ROLE_PERMISSIONS
};