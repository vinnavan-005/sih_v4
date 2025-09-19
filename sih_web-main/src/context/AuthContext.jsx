import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// API base URL - adjust this to match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

  // Helper function to process user data from backend (NO ROLE CONVERSION)
  const processUserData = (userData) => {
    if (!userData) return null;

    return {
      id: userData.id,
      fullname: userData.full_name || userData.fullname,
      email: userData.email,
      role: userData.role, // Keep original backend role (lowercase)
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
            // Token verification failed, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
            setToken(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Clear invalid data
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

  // Login function
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const processedUser = processUserData(data.user);
        
        // Store token and user data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(processedUser));
        
        setToken(data.access_token);
        setCurrentUser(processedUser);
        
        return { success: true, user: processedUser };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (userData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const processedUser = processUserData(data.user);
        
        // Store token and user data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(processedUser));
        
        setToken(data.access_token);
        setCurrentUser(processedUser);
        
        return { success: true, user: processedUser };
      } else {
        throw new Error(data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: error.message || 'Signup failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call backend logout if token exists
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if backend call fails
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      setToken(null);
      setCurrentUser(null);
    }
  };

  // Update profile function
  const updateProfile = async (updates) => {
    if (!currentUser || !token) return { success: false, message: 'Not authenticated' };

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = processUserData(data.user || data);
        
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to update profile. Please check your connection.' 
      };
    }
  };

  // Role checking functions (using backend roles directly)
  const hasRole = (roles) => {
    if (!currentUser) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(currentUser.role);
  };

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
      'system-settings': ['admin']
    };
    
    return permissions[permission]?.includes(currentUser.role) || false;
  };

  const canAccessIssue = (issue) => {
    if (!currentUser || !issue) return false;
    
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'staff') {
      return issue.department === currentUser.department;
    }
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