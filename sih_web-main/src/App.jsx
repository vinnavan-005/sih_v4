import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { AdminRoute, StaffRoute, AllRolesRoute } from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { ROLES } from './utils/constants';

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
    <div className={`fixed top-4 right-4 p-4 rounded-md border max-w-md ${typeClasses[type]} z-50`}>
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          &#x2715;
        </button>
      </div>
    </div>
  );
};

// Root app component with routing
const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected dashboard routes with standardized roles */}
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
          <ProtectedRoute allowedRoles={[ROLES.SUPERVISOR]}>
            <SupervisorDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Feature routes with role-based access - FIXED ROLES */}
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
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF, ROLES.SUPERVISOR]}>
            <Analytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/escalation" 
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
            <Escalation />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/task-assignment" 
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
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

      {/* Default redirect based on user role */}
      <Route 
        path="/" 
        element={
          currentUser ? (
            <Navigate 
              to={
                currentUser.role === ROLES.ADMIN ? '/admin-dashboard' :
                currentUser.role === ROLES.STAFF ? '/staff-dashboard' :
                currentUser.role === ROLES.SUPERVISOR ? '/supervisor-dashboard' :
                '/login'
              } 
              replace 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;