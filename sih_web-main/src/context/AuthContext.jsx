import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// API base URL - adjust this to match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.103:8000';

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

  // Helper function to process user data from backend (KEEP BACKEND ROLES)
  const processUserData = (userData) => {
    if (!userData) return null;

    return {
      id: userData.id,
      fullname: userData.full_name || userData.fullname,
      email: userData.email,
      role: userData.role, // Keep original backend role (lowercase: admin, staff, supervisor)
      department: userData.department,
      phone: userData.phone,
      created_at: userData.created_at,
      loginTime: userData.loginTime || new Date().toISOString()
    };
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
            },
          });

          if (response.ok) {
            const userData = JSON.parse(savedUser);
            setCurrentUser(processUserData(userData));
            setToken(savedToken);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            setToken(null);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          setToken(null);
          setCurrentUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function - FIXED to handle backend roles correctly
  const login = async (email, password, selectedRole) => {
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
        // Get user's actual role from backend (lowercase)
        const userRole = data.user.role;
        
        // Map selected role to backend format for validation
        const roleMapping = {
          'Admin': 'admin',
          'DepartmentStaff': 'staff', 
          'FieldSupervisor': 'supervisor'
        };
        
        const expectedBackendRole = roleMapping[selectedRole];
        
        // Validate role match
        if (userRole !== expectedBackendRole) {
          return { 
            success: false, 
            error: `Role mismatch. You selected ${selectedRole}, but your account is registered as ${userRole}. Please select the correct role.` 
          };
        }

        // Store token and user info with backend role format
        localStorage.setItem('token', data.access_token);
        const userSession = {
          id: data.user.id,
          fullname: data.user.full_name,
          email: data.user.email || email,
          role: userRole, // Store backend role (lowercase)
          department: data.user.department,
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userSession));
        setCurrentUser(userSession);
        setToken(data.access_token);
        
        return { success: true, user: userSession };
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

  // Signup function
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
        return { success: true, message: 'Account created successfully' };
      } else {
        return { 
          success: false, 
          error: data.detail || data.message || 'Registration failed' 
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

  // Logout function
  const logout = async () => {
    try {
      if (token) {
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
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setToken(null);
    }
  };

  // Update profile function
  const updateProfile = async (updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...currentUser, ...data.user };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        return { 
          success: false, 
          error: data.detail || 'Failed to update profile' 
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

  // Role checking functions (using backend roles directly - lowercase)
  const hasRole = (roles) => {
    if (!currentUser) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(currentUser.role);
  };

  // FIXED: Updated permissions to use backend role format
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    const permissions = {
      'view-all-issues': ['admin'],
      'manage-users': ['admin'],
      'assign-tasks': ['admin', 'staff'],
      'escalate-issues': ['admin', 'staff'],
      'update-status': ['admin', 'staff', 'supervisor'],
      'view-analytics': ['admin', 'staff', 'supervisor'],
      'manage-assignments': ['admin', 'staff', 'supervisor'],
      'system-settings': ['admin'],
      'create-issues': ['admin', 'staff', 'supervisor'],
      'edit-issues': ['admin', 'staff'],
      'delete-issues': ['admin']
    };
    
    return permissions[permission]?.includes(currentUser.role) || false;
  };

  const canAccessIssue = (issue) => {
    if (!currentUser || !issue) return false;
    
    // Admin can access all issues
    if (currentUser.role === 'admin') return true;
    
    // Staff can access issues in their department
    if (currentUser.role === 'staff') {
      return issue.department === currentUser.department;
    }
    
    // Supervisor can access issues assigned to them
    if (currentUser.role === 'supervisor') {
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
    apiCall
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;