import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { PageLoader, ErrorState } from './LoadingSpinner';
import { AlertTriangle, Shield, UserX } from 'lucide-react';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  fallbackPath = '/login',
  showUnauthorized = true 
}) => {
  const { currentUser, isLoading, token } = useAuth();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Add a small delay to ensure auth context is fully initialized
    const checkAuth = setTimeout(() => {
      setAuthChecked(true);
    }, 100);

    return () => clearTimeout(checkAuth);
  }, [currentUser, isLoading]);

  // Show loading while authentication is being checked
  if (isLoading || !authChecked) {
    return (
      <PageLoader 
        text="Checking authentication..." 
        subText="Please wait while we verify your credentials"
      />
    );
  }

  // Handle authentication errors
  if (error) {
    return (
      <ErrorState
        title="Authentication Error"
        message={error}
        onRetry={() => {
          setError(null);
          window.location.reload();
        }}
        onGoBack={() => window.history.back()}
      />
    );
  }

  // Check if authentication is required and user is not authenticated
  if (requireAuth && (!currentUser || !token)) {
    // Store the attempted URL for redirect after login
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && currentUser) {
    const hasRequiredRole = allowedRoles.includes(currentUser.role);
    
    if (!hasRequiredRole) {
      if (showUnauthorized) {
        return <UnauthorizedAccess userRole={currentUser.role} requiredRoles={allowedRoles} />;
      } else {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = getDashboardPath(currentUser.role);
        return <Navigate to={redirectPath} replace />;
      }
    }
  }

  // All checks passed, render the protected component
  return children;
};

// Unauthorized access component
const UnauthorizedAccess = ({ userRole, requiredRoles }) => {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const goToDashboard = () => {
    const dashboardPath = getDashboardPath(userRole);
    window.location.href = dashboardPath;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div className="text-left">
              <p className="text-sm text-yellow-800">
                <strong>Your role:</strong> {userRole}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>Required roles:</strong> {requiredRoles.join(', ')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={goToDashboard}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to My Dashboard
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center"
          >
            <UserX className="h-4 w-4 mr-2" />
            Switch Account
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

// Helper function to get dashboard path based on role
const getDashboardPath = (role) => {
  switch (role) {
    case 'Admin':
      return '/admin-dashboard';
    case 'DepartmentStaff':
      return '/staff-dashboard';
    case 'FieldSupervisor':
      return '/supervisor-dashboard';
    default:
      return '/login';
  }
};

// Higher-order component for role-specific routes
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute allowedRoles={['Admin']} {...props}>
    {children}
  </ProtectedRoute>
);

export const StaffRoute = ({ children, ...props }) => (
  <ProtectedRoute allowedRoles={['Admin', 'DepartmentStaff']} {...props}>
    {children}
  </ProtectedRoute>
);

export const SupervisorRoute = ({ children, ...props }) => (
  <ProtectedRoute allowedRoles={['FieldSupervisor']} {...props}>
    {children}
  </ProtectedRoute>
);

export const AllRolesRoute = ({ children, ...props }) => (
  <ProtectedRoute allowedRoles={['Admin', 'DepartmentStaff', 'FieldSupervisor']} {...props}>
    {children}
  </ProtectedRoute>
);

// Route that allows multiple specific roles
export const MultiRoleRoute = ({ roles, children, ...props }) => (
  <ProtectedRoute allowedRoles={roles} {...props}>
    {children}
  </ProtectedRoute>
);

// Public route that doesn't require authentication
export const PublicRoute = ({ children, redirectIfAuthenticated = false, redirectTo = '/' }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader text="Loading..." />;
  }

  // Redirect authenticated users away from public pages (like login/signup)
  if (redirectIfAuthenticated && currentUser) {
    const dashboardPath = getDashboardPath(currentUser.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

// Advanced protected route with custom validation
export const CustomProtectedRoute = ({ 
  children, 
  validator, 
  fallbackComponent = null,
  ...props 
}) => {
  const { currentUser } = useAuth();
  
  return (
    <ProtectedRoute {...props}>
      {validator && !validator(currentUser) ? (
        fallbackComponent || <UnauthorizedAccess userRole={currentUser?.role} requiredRoles={['Custom']} />
      ) : (
        children
      )}
    </ProtectedRoute>
  );
};

// Route wrapper that checks for specific permissions
export const PermissionRoute = ({ 
  children, 
  permission, 
  fallback = null,
  ...props 
}) => {
  const { hasPermission } = useAuth();
  
  return (
    <ProtectedRoute {...props}>
      {hasPermission && !hasPermission(permission) ? (
        fallback || (
          <UnauthorizedAccess 
            userRole="Current User" 
            requiredRoles={[`Permission: ${permission}`]} 
          />
        )
      ) : (
        children
      )}
    </ProtectedRoute>
  );
};

// Department-specific route protection
export const DepartmentRoute = ({ 
  children, 
  departments = [], 
  allowAllDepartments = false,
  ...props 
}) => {
  const { currentUser } = useAuth();
  
  const validator = (user) => {
    if (!user || !user.department) return false;
    if (allowAllDepartments) return true;
    return departments.length === 0 || departments.includes(user.department);
  };

  return (
    <CustomProtectedRoute validator={validator} {...props}>
      {children}
    </CustomProtectedRoute>
  );
};

// Route for features that require email verification
export const VerifiedRoute = ({ children, ...props }) => {
  const { currentUser } = useAuth();
  
  const validator = (user) => {
    // Assuming your backend provides email verification status
    return user && user.email_verified !== false;
  };

  const fallbackComponent = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verification Required</h2>
        <p className="text-gray-600 mb-6">
          Please verify your email address to access this feature.
        </p>
        <button
          onClick={() => window.location.href = '/verify-email'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Verify Email
        </button>
      </div>
    </div>
  );

  return (
    <CustomProtectedRoute 
      validator={validator} 
      fallbackComponent={fallbackComponent}
      {...props}
    >
      {children}
    </CustomProtectedRoute>
  );
};

// Maintenance mode route wrapper
export const MaintenanceAwareRoute = ({ children, maintenanceMode = false }) => {
  if (maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Mode</h2>
            <p className="text-gray-600">
              The system is currently undergoing maintenance. Please check back later.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <p>Expected completion: 30 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;