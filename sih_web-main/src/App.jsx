import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { AdminRoute, StaffRoute, AllRolesRoute } from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

// Auth components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';

// Dashboard components
import AdminDashboard from './components/dashboards/AdminDashboard';
import StaffDashboard from './components/dashboards/StaffDashboard';
import SupervisorDashboard from './components/dashboards/SupervisorDashboard';

// Feature components
import IssueList from './components/issues/IssueList';
import IssueDetails from './components/issues/IssueDetails';
import Analytics from './components/analytics/Analytics';
import Escalation from './components/escalation/Escalation';
import Settings from './components/settings/Settings';
import TaskAssignment from './components/tasks/TaskAssignment';

// Error boundary component
import ErrorBoundary from './components/common/ErrorBoundary';

// Import global styles
import './index.css';

// Notification component for global alerts
const GlobalNotification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full p-4 border rounded-lg shadow-lg ${typeClasses[type]} transition-all duration-300`}>
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Main App routing component
const AppRoutes = () => {
  const { currentUser } = useAuth();

  // Auto-redirect based on user role
  const getDefaultRoute = () => {
    if (!currentUser) return '/login';
    
    switch (currentUser.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'supervisor':
        return '/supervisor-dashboard';
      case 'staff':
        return '/staff-dashboard';
      case 'citizen':
        return '/issues';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected dashboard routes */}
      <Route 
        path="/admin-dashboard" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      <Route 
        path="/staff-dashboard" 
        element={
          <StaffRoute>
            <StaffDashboard />
          </StaffRoute>
        } 
      />
      <Route 
        path="/supervisor-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['supervisor']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Feature routes with role-based access */}
      <Route 
        path="/issues" 
        element={
          <AllRolesRoute>
            <IssueList />
          </AllRolesRoute>
        } 
      />
      <Route 
        path="/issue-details/:id" 
        element={
          <AllRolesRoute>
            <IssueDetails />
          </AllRolesRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <Analytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/escalation" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <Escalation />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/task-assignment" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <TaskAssignment />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        } 
      />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      
      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// 404 Not Found component
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or you don't have permission to access it.</p>
        <div className="space-x-4">
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App component with global error boundary
const App = () => {
  const [notification, setNotification] = React.useState(null);

  // Global error handler
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error:', event.error);
      setNotification({
        type: 'error',
        message: 'An unexpected error occurred. Please refresh the page.'
      });
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      setNotification({
        type: 'error',
        message: 'A network error occurred. Please check your connection.'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Check if API is available
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.1.103:8000'}/health`);
        if (!response.ok) {
          throw new Error('API health check failed');
        }
      } catch (error) {
        console.warn('API health check failed:', error);
        setNotification({
          type: 'warning',
          message: 'Unable to connect to server. Some features may be limited.'
        });
      }
    };

    checkApiHealth();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            
            {/* Global notification */}
            {notification && (
              <GlobalNotification
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(null)}
              />
            )}
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;