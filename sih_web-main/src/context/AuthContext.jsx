import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// API base URL - adjust this to match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Role mapping between frontend (UI) and backend (API)
const FRONTEND_TO_BACKEND_ROLES = {
  'Admin': 'admin',
  'DepartmentStaff': 'staff',
  'FieldSupervisor': 'supervisor',
  'Citizen': 'citizen'
};

const BACKEND_TO_FRONTEND_ROLES = {
  'admin': 'Admin',
  'staff': 'DepartmentStaff',
  'supervisor': 'FieldSupervisor',
  'citizen': 'Citizen'
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Helper function to process user data from backend
  const processUserData = (userData) => {
    if (!userData) return null;

    return {
      id: userData.id,
      fullname: userData.full_name || userData.fullname,
      email: userData.email,
      role: BACKEND_TO_FRONTEND_ROLES[userData.role] || userData.role, // Convert backend role to frontend
      backendRole: userData.role, // Keep original for API calls
      department: userData.department,
      phone: userData.phone,
      created_at: userData.created_at,
      loginTime: userData.loginTime || new Date().toISOString()
    };
  };

  // Helper function to get backend role for API calls
  const getBackendRole = (frontendRole) => {
    return FRONTEND_TO_BACKEND_ROLES[frontendRole] || frontendRole;
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('currentUser');
      
      if (savedToken && savedUser) {
        try {
          // Verify token is still valid
          const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.valid && data.user) {
              // Process the user data from token verification
              const processedUser = processUserData(data.user);
              setCurrentUser(processedUser);
              setToken(savedToken);
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('currentUser');
              setCurrentUser(null);
              setToken(null);
            }
          } else {
            // Token verification failed
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
            setToken(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password, role) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Process user data and handle role conversion
        const processedUser = processUserData(data.user);
        
        // Optional: Check if user's role matches selected role (if role selection is required)
        if (role && processedUser.role !== role) {
          return { 
            success: false, 
            error: `User role mismatch. Expected ${role}, but user is ${processedUser.role}` 
          };
        }

        // Store token and user info
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(processedUser));

        setCurrentUser(processedUser);
        setToken(data.access_token);
        
        return { success: true, user: processedUser };
      } else {
        return { 
          success: false, 
          error: data.detail || data.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userData,
          email: userData.email.toLowerCase().trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Process user data
        const processedUser = processUserData(data.user);

        // Store token and user info
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(processedUser));

        setCurrentUser(processedUser);
        setToken(data.access_token);
        
        return { success: true, user: processedUser };
      } else {
        return { 
          success: false, 
          error: data.detail || data.message || 'Signup failed' 
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        // Call logout endpoint to invalidate token on server
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if server call fails
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (profileData) => {
    if (!currentUser || !token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        // Process and update user data
        const processedUser = processUserData(data);
        const updatedUser = { ...currentUser, ...processedUser };
        
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        
        return { success: true, user: updatedUser };
      } else {
        return { 
          success: false, 
          error: data.detail || data.message || 'Profile update failed' 
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    }
  };

  // Role checking functions
  const hasRole = (roles) => {
    if (!currentUser) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(currentUser.role);
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    const permissions = {
      'view-all-issues': ['Admin'],
      'manage-users': ['Admin'],
      'assign-tasks': ['Admin', 'DepartmentStaff'],
      'escalate-issues': ['Admin', 'DepartmentStaff'],
      'update-status': ['Admin', 'DepartmentStaff', 'FieldSupervisor'],
      'view-analytics': ['Admin', 'DepartmentStaff', 'FieldSupervisor'],
      'manage-assignments': ['Admin', 'DepartmentStaff', 'FieldSupervisor'],
      'system-settings': ['Admin']
    };
    
    return permissions[permission]?.includes(currentUser.role) || false;
  };

  const canAccessIssue = (issue) => {
    if (!currentUser || !issue) return false;
    
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'DepartmentStaff') {
      return issue.department === currentUser.department;
    }
    if (currentUser.role === 'FieldSupervisor') {
      return issue.assignedTo === currentUser.email || issue.assignedTo === currentUser.id;
    }
    
    return false;
  };

  // API helper function for authenticated requests
  const apiCall = async (endpoint, options = {}) => {
    if (!token) {
      throw new Error('No authentication token');
    }

    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expired or invalid
      logout();
      throw new Error('Session expired');
    }

    return response;
  };

  // Get current user's backend role for API calls
  const getUserBackendRole = () => {
    if (!currentUser) return null;
    return getBackendRole(currentUser.role);
  };

  // Check if user can access a specific route based on backend role requirements
  const canAccessRoute = (requiredBackendRoles = []) => {
    if (!currentUser) return false;
    if (requiredBackendRoles.length === 0) return true;
    
    const userBackendRole = getUserBackendRole();
    return requiredBackendRoles.includes(userBackendRole);
  };

  const value = {
    currentUser,
    token,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    hasRole,
    hasPermission,
    canAccessIssue,
    canAccessRoute,
    getUserBackendRole,
    getBackendRole,
    apiCall,
    // Expose role mappings for debugging
    FRONTEND_TO_BACKEND_ROLES,
    BACKEND_TO_FRONTEND_ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;