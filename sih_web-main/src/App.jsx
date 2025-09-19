import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthProvider from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute, { 
  AdminRoute, 
  StaffRoute, 
  SupervisorRoute, 
  AllRolesRoute,
  AdminOrStaffRoute 
} from './components/common/ProtectedRoute';

// Import components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import AdminDashboard from './components/dashboards/AdminDashboard';
import StaffDashboard from './components/dashboards/StaffDashboard';
import SupervisorDashboard from './components/dashboards/SupervisorDashboard';
import IssueList from './components/issues/IssueList';
import IssueDetails from './components/issues/IssueDetails';
import Analytics from './components/analytics/Analytics';
import Escalation from './components/escalation/Escalation';
import TaskAssignment from './components/tasks/TaskAssignment';
import Settings from './components/settings/Settings';
import Profile from './components/profile/Profile';

// Import constants - FIXED to use backend roles
import { ROLES } from './utils/constants';

// App Routes component
const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
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
            <Login />
          )
        } 
      />
      <Route 
        path="/signup" 
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
            <Signup />
          )
        } 
      />

      {/* Protected dashboard routes - FIXED ROLES */}
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
          <SupervisorRoute>
            <SupervisorDashboard />
          </SupervisorRoute>
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
          <AdminOrStaffRoute>
            <Escalation />
          </AdminOrStaffRoute>
        } 
      />
      <Route 
        path="/task-assignment" 
        element={
          <AdminOrStaffRoute>
            <TaskAssignment />
          </AdminOrStaffRoute>
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
      <Route 
        path="/profile" 
        element={
          <AllRolesRoute>
            <Profile />
          </AllRolesRoute>
        } 
      />

      {/* Default redirect based on user role - FIXED */}
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