import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

// Issue Management Components
import IssueList from './components/issues/IssueList';
import IssueDetails from './components/issues/IssueDetails';
import IssueCreate from './components/issues/IssueCreate';
import IssueSearch from './components/issues/IssueSearch';

// Assignment Management Components  
import AssignmentList from './components/assignments/AssignmentList';

// Feature components
import Analytics from './components/analytics/Analytics';
import Escalation from './components/escalation/Escalation';
import Settings from './components/settings/Settings';
import TaskAssignment from './components/tasks/TaskAssignment';

// Common components for placeholders
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

// Error boundary component
import ErrorBoundary from './components/common/ErrorBoundary';

// Lucide React icons for placeholders
import { 
  MapPin, 
  Plus, 
  Users, 
  BarChart3, 
  FileText, 
  Upload, 
  TrendingUp, 
  Activity, 
  Download 
} from 'lucide-react';

// Import global styles
import './index.css';

// Placeholder Component Generator
const PlaceholderComponent = ({ title, icon: Icon, description, buttonText, buttonAction }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-60">
        <Header title={title} />
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>
            {buttonText && buttonAction && (
              <button
                onClick={() => navigate(buttonAction)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {buttonText}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

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
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 border rounded-lg shadow-lg ${typeClasses[type] || typeClasses.info}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button 
          onClick={onClose}
          className="ml-4 text-xl leading-none hover:opacity-70"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Main App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute redirectIfAuthenticated={true}>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute redirectIfAuthenticated={true}>
            <Signup />
          </PublicRoute>
        } 
      />
      
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Dashboard routes with role-based access */}
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
          <ProtectedRoute allowedRoles={['FieldSupervisor']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Issue Management Routes */}
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
        path="/issues/create" 
        element={
          <AllRolesRoute>
            <IssueCreate />
          </AllRolesRoute>
        } 
      />
      <Route 
        path="/issues/search" 
        element={
          <AllRolesRoute>
            <IssueSearch />
          </AllRolesRoute>
        } 
      />
      <Route 
        path="/issues/map" 
        element={
          <AllRolesRoute>
            <PlaceholderComponent 
              title="Issue Map" 
              icon={MapPin}
              description="Interactive map view coming soon..."
            />
          </AllRolesRoute>
        } 
      />

      {/* Assignment Management Routes */}
      <Route 
        path="/assignments" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor', 'DepartmentStaff']}>
            <AssignmentList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/assignments/create" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
            <PlaceholderComponent 
              title="Create Assignment" 
              icon={Plus}
              description="Assignment creation form coming soon..."
              buttonText="Use Task Assignment Instead"
              buttonAction="/task-assignment"
            />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/assignments/bulk" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
            <PlaceholderComponent 
              title="Bulk Assignment" 
              icon={Users}
              description="Bulk assignment feature coming soon..."
            />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/assignments/stats" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
            <PlaceholderComponent 
              title="Assignment Statistics" 
              icon={BarChart3}
              description="Assignment analytics coming soon..."
            />
          </ProtectedRoute>
        } 
      />

      {/* User Management Routes */}
      <Route 
        path="/users" 
        element={
          <AdminRoute>
            <PlaceholderComponent 
              title="User Management" 
              icon={Users}
              description="User management interface coming soon..."
            />
          </AdminRoute>
        } 
      />
      <Route 
        path="/staff" 
        element={
          <StaffRoute>
            <PlaceholderComponent 
              title="Department Staff" 
              icon={Users}
              description="Staff management interface coming soon..."
            />
          </StaffRoute>
        } 
      />

      {/* Department Routes */}
      <Route 
        path="/departments" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
            <PlaceholderComponent 
              title="Department Statistics" 
              icon={BarChart3}
              description="Department analytics coming soon..."
            />
          </ProtectedRoute>
        } 
      />

      {/* Updates Routes */}
      <Route 
        path="/updates" 
        element={
          <AllRolesRoute>
            <PlaceholderComponent 
              title="Issue Updates" 
              icon={FileText}
              description="Updates management interface coming soon..."
            />
          </AllRolesRoute>
        } 
      />
      <Route 
        path="/updates/create" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor', 'DepartmentStaff']}>
            <PlaceholderComponent 
              title="Create Update" 
              icon={Plus}
              description="Update creation form coming soon..."
            />
          </ProtectedRoute>
        } 
      />

      {/* Files Management */}
      <Route 
        path="/files" 
        element={
          <AdminRoute>
            <PlaceholderComponent 
              title="File Management" 
              icon={Upload}
              description="File management interface coming soon..."
            />
          </AdminRoute>
        } 
      />

      {/* Analytics Routes */}
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
            <Analytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics/trends" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
            <PlaceholderComponent 
              title="Trend Analysis" 
              icon={TrendingUp}
              description="Trend analysis dashboard coming soon..."
            />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics/performance" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
            <PlaceholderComponent 
              title="Performance Metrics" 
              icon={Activity}
              description="Performance analytics coming soon..."
            />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics/export" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
            <PlaceholderComponent 
              title="Data Export" 
              icon={Download}
              description="Data export functionality coming soon..."
            />
          </ProtectedRoute>
        } 
      />

      {/* Existing Feature Routes */}
      <Route 
        path="/escalation" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
            <Escalation />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/task-assignment" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'FieldSupervisor']}>
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

      {/* 404 Route */}
      <Route 
        path="*" 
        element={
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-60">
              <Header title="Page Not Found" />
              <main className="p-6">
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">404 - Page Not Found</h3>
                  <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                  <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </main>
            </div>
          </div>
        } 
      />
    </Routes>
  );
};

// Public Route Component
const PublicRoute = ({ children, redirectIfAuthenticated = false, redirectTo = '/' }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect authenticated users away from public pages (like login/signup)
  if (redirectIfAuthenticated && currentUser) {
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
    
    const dashboardPath = getDashboardPath(currentUser.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

// Main App Component
const App = () => {
  const [notification, setNotification] = React.useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            {/* Global Notification */}
            {notification && (
              <GlobalNotification
                message={notification.message}
                type={notification.type}
                onClose={hideNotification}
              />
            )}
            
            {/* Main App Routes */}
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;