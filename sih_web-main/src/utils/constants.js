// Application constants

// ===== STANDARDIZED ROLES (Backend Format) =====
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
  TASK_ASSIGNMENT: '/task-assignment'
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
    INFO: '/api/files/info'
  },
  ANALYTICS: {
    OVERVIEW: '/api/analytics/overview',
    ISSUES: '/api/analytics/issues',
    DEPARTMENTS: '/api/analytics/departments',
    TRENDS: '/api/analytics/trends'
  }
};

// ===== ISSUE CONSTANTS =====
export const ISSUE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const ISSUE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const ISSUE_CATEGORIES = [
  'Infrastructure',
  'Transportation',
  'Environment',
  'Public Safety',
  'Health',
  'Education',
  'Utilities',
  'Other'
];

// ===== PERMISSION CONSTANTS =====
export const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: 'manage-users',
  SYSTEM_SETTINGS: 'system-settings',
  VIEW_ALL_ISSUES: 'view-all-issues',
  
  // Staff permissions  
  ASSIGN_TASKS: 'assign-tasks',
  ESCALATE_ISSUES: 'escalate-issues',
  VIEW_DEPARTMENT_ISSUES: 'view-department-issues',
  
  // Supervisor permissions
  UPDATE_STATUS: 'update-status',
  MANAGE_ASSIGNMENTS: 'manage-assignments',
  
  // Common permissions
  VIEW_ANALYTICS: 'view-analytics'
};

// ===== ROLE-BASED ACCESS CONTROL =====
export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_ALL_ISSUES,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.ESCALATE_ISSUES,
    PERMISSIONS.UPDATE_STATUS,
    PERMISSIONS.MANAGE_ASSIGNMENTS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  staff: [
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.ESCALATE_ISSUES,
    PERMISSIONS.VIEW_DEPARTMENT_ISSUES,
    PERMISSIONS.UPDATE_STATUS,
    PERMISSIONS.MANAGE_ASSIGNMENTS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  supervisor: [
    PERMISSIONS.UPDATE_STATUS,
    PERMISSIONS.MANAGE_ASSIGNMENTS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  citizen: [
    // Citizens have basic permissions handled by components
  ]
};

// ===== ROUTE ACCESS CONTROL =====
export const ROUTE_ACCESS = {
  [ROUTES.ADMIN_DASHBOARD]: [ROLES.ADMIN],
  [ROUTES.STAFF_DASHBOARD]: [ROLES.ADMIN, ROLES.STAFF],
  [ROUTES.SUPERVISOR_DASHBOARD]: [ROLES.SUPERVISOR],
  [ROUTES.ANALYTICS]: [ROLES.ADMIN, ROLES.STAFF, ROLES.SUPERVISOR],
  [ROUTES.ESCALATION]: [ROLES.ADMIN, ROLES.STAFF],
  [ROUTES.TASK_ASSIGNMENT]: [ROLES.ADMIN, ROLES.STAFF],
  [ROUTES.SETTINGS]: [ROLES.ADMIN],
  [ROUTES.ISSUES]: [ROLES.ADMIN, ROLES.STAFF, ROLES.SUPERVISOR, ROLES.CITIZEN],
  [ROUTES.ISSUE_DETAILS]: [ROLES.ADMIN, ROLES.STAFF, ROLES.SUPERVISOR, ROLES.CITIZEN]
};

// ===== UI CONSTANTS =====
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  FIRST_PAGE: 1
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain']
};

// ===== HELPER FUNCTIONS =====
export const getRoleName = (role) => ROLE_LABELS[role] || role;

export const hasPermission = (userRole, permission) => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

export const canAccessRoute = (userRole, route) => {
  return ROUTE_ACCESS[route]?.includes(userRole) || false;
};

export const getDashboardRoute = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return ROUTES.ADMIN_DASHBOARD;
    case ROLES.STAFF:
      return ROUTES.STAFF_DASHBOARD;
    case ROLES.SUPERVISOR:
      return ROUTES.SUPERVISOR_DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
};

// ===== ERROR MESSAGES =====
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  BAD_REQUEST: 'Invalid request. Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file format.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
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