// Application constants - FIXED to match backend exactly

// ===== STANDARDIZED ROLES (Backend Format - MUST MATCH BACKEND) =====
export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff', 
  SUPERVISOR: 'supervisor',
  CITIZEN: 'citizen'
};

// Role display names for UI
export const ROLE_LABELS = {
  admin: 'Administrator',
  staff: 'Department Staff',
  supervisor: 'Field Supervisor', 
  citizen: 'Citizen'
};

// Frontend to Backend role mapping for login form
export const ROLE_MAPPING = {
  'Admin': 'admin',
  'DepartmentStaff': 'staff',
  'FieldSupervisor': 'supervisor'
};

// Helper function to get role display name
export const getRoleName = (role) => {
  return ROLE_LABELS[role] || role;
};

// Helper function to get dashboard route based on role
export const getDashboardRoute = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin-dashboard';
    case ROLES.STAFF:
      return '/staff-dashboard';
    case ROLES.SUPERVISOR:
      return '/supervisor-dashboard';
    default:
      return '/login';
  }
};

// ===== NAVIGATION ROUTES =====
export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN_DASHBOARD: '/admin-dashboard',
  STAFF_DASHBOARD: '/staff-dashboard',
  SUPERVISOR_DASHBOARD: '/supervisor-dashboard',
  ISSUES: '/issues',
  ISSUE_DETAILS: '/issue-details',
  ANALYTICS: '/analytics',
  ESCALATION: '/escalation',
  SETTINGS: '/settings',
  TASK_ASSIGNMENT: '/task-assignment',
  PROFILE: '/profile'
};

// ===== API ENDPOINTS (FastAPI backend) =====
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
    BY_USER: '/api/assignments/user/:id',
    BY_ISSUE: '/api/assignments/issue/:id',
    MY_ASSIGNMENTS: '/api/assignments/my',
    BULK_ASSIGN: '/api/assignments/bulk',
    STATS: '/api/assignments/stats',
    WORKLOAD: '/api/assignments/workload'
  },
  UPDATES: {
    LIST: '/api/updates/',
    CREATE: '/api/updates/',
    DETAIL: '/api/updates/:id',
    BY_ISSUE: '/api/updates/issue/:id',
    RECENT: '/api/updates/recent'
  },
  USERS: {
    LIST: '/api/users/',
    CREATE: '/api/users/',
    DETAIL: '/api/users/:id',
    UPDATE: '/api/users/:id',
    DELETE: '/api/users/:id',
    STAFF: '/api/users/staff',
    DEPARTMENTS: '/api/users/departments',
    STATS: '/api/users/stats',
    WORKLOAD: '/api/users/:id/workload',
    CHANGE_ROLE: '/api/users/:id/change-role'
  },
  FILES: {
    UPLOAD_IMAGE: '/api/files/upload-image',
    UPLOAD_DOCUMENT: '/api/files/upload-document',
    UPLOAD_MULTIPLE: '/api/files/upload-multiple',
    CAMERA_CAPTURE: '/api/files/camera-capture',
    DELETE: '/api/files/delete/:path',
    LIST: '/api/files/',
    INFO: '/api/files/info',
    VALIDATE: '/api/files/validate',
    CAMERA_STATUS: '/api/files/camera-status'
  },
  DASHBOARD: {
    OVERVIEW: '/api/dashboard/overview',
    TRENDS: '/api/dashboard/trends',
    ACTIVITY: '/api/dashboard/activity'
  },
  ANALYTICS: {
    OVERVIEW: '/api/analytics/overview',
    TRENDS: '/api/analytics/trends',
    DEPARTMENTS: '/api/analytics/departments',
    PERFORMANCE: '/api/analytics/performance'
  }
};

// ===== ISSUE STATUS =====
export const ISSUE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  ESCALATED: 'escalated'
};

export const ISSUE_STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  escalated: 'Escalated'
};

// ===== ISSUE PRIORITIES =====
export const ISSUE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const ISSUE_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

// ===== DEPARTMENTS =====
export const DEPARTMENTS = {
  ROADS: 'roads',
  WATER: 'water',
  WASTE: 'waste',
  ELECTRICITY: 'electricity',
  HEALTH: 'health',
  EDUCATION: 'education',
  SECURITY: 'security',
  TRANSPORTATION: 'transportation'
};

export const DEPARTMENT_LABELS = {
  roads: 'Roads & Infrastructure',
  water: 'Water & Sanitation',
  waste: 'Waste Management',
  electricity: 'Electricity & Power',
  health: 'Public Health',
  education: 'Education',
  security: 'Security & Safety',
  transportation: 'Transportation'
};

// ===== ASSIGNMENT STATUS =====
export const ASSIGNMENT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

export const ASSIGNMENT_STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected'
};

// ===== ERROR MESSAGES =====
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Unauthorized access. Please login again.',
  FORBIDDEN: 'Access denied. You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  DELETE_FAILED: 'Failed to delete item. Please try again.',
  UPDATE_FAILED: 'Failed to update item. Please try again.',
  CREATE_FAILED: 'Failed to create item. Please try again.',
  FETCH_FAILED: 'Failed to fetch data. Please try again.',
  CONNECTION_ERROR: 'Connection error. Please check your internet connection.',
  PERMISSION_DENIED: 'Permission denied. Contact your administrator for access.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait and try again.',
  MAINTENANCE_MODE: 'System is under maintenance. Please try again later.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
};

// ===== SUCCESS MESSAGES =====
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  ISSUE_CREATED: 'Issue reported successfully!',
  ISSUE_UPDATED: 'Issue updated successfully!',
  ISSUE_DELETED: 'Issue deleted successfully!',
  ASSIGNMENT_CREATED: 'Task assigned successfully!',
  ASSIGNMENT_UPDATED: 'Assignment updated successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  GENERIC_SUCCESS: 'Operation completed successfully!'
};

// ===== HTTP STATUS CODES =====
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// ===== STORAGE KEYS =====
export const STORAGE_KEYS = {
  TOKEN: 'token',
  CURRENT_USER: 'currentUser',
  THEME: 'theme',
  LANGUAGE: 'language',
  LAST_ACTIVITY: 'lastActivity'
};

// ===== DEFAULT VALUES =====
export const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// ===== VALIDATION PATTERNS =====
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s\-\(\)]{10,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
};

// ===== PERMISSION SETS =====
export const PERMISSIONS = {
  VIEW_ALL_ISSUES: 'view-all-issues',
  MANAGE_USERS: 'manage-users',
  ASSIGN_TASKS: 'assign-tasks',
  ESCALATE_ISSUES: 'escalate-issues',
  UPDATE_STATUS: 'update-status',
  VIEW_ANALYTICS: 'view-analytics',
  MANAGE_ASSIGNMENTS: 'manage-assignments',
  SYSTEM_SETTINGS: 'system-settings',
  CREATE_ISSUES: 'create-issues',
  EDIT_ISSUES: 'edit-issues',
  DELETE_ISSUES: 'delete-issues'
};