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
            if (data.valid) {
              setCurrentUser(JSON.parse(savedUser));
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
      
      // Map frontend roles to backend roles
      const roleMapping = {
        'Admin': 'admin',
        'DepartmentStaff': 'staff', 
        'FieldSupervisor': 'supervisor'
      };
      
      const backendRole = roleMapping[role];
      if (!backendRole) {
        return { success: false, error: 'Invalid role selected' };
      }

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
        // Check if user's role matches selected role
        const userRole = data.user.role;
        // Don't check role mismatch on login - just use what's in database
        const frontendRoleMapping = {
          'admin': 'Admin',
          'staff': 'DepartmentStaff',
          'supervisor': 'FieldSupervisor',
          'citizen': 'Citizen'
        };
        
        const frontendRole = frontendRoleMapping[userRole] || 'Citizen';

        // Store token and user info
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify({
          id: data.user.id,
          fullname: data.user.full_name,
          email: data.user.email || email,
          role: frontendRole, // Store frontend role format
          department: data.user.department,
          loginTime: new Date().toISOString()
        }));

        const userSession = {
          id: data.user.id,
          fullname: data.user.full_name,
          email: data.user.email || email,
          role: frontendRole,
          department: data.user.department,
          loginTime: new Date().toISOString()
        };

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

  // Updated AuthContext.jsx - Add this to your existing AuthContext.jsx file
// Just replace the signup function with this updated version:

  const signup = async (userData) => {
    try {
      setIsLoading(true);
      
      // Map frontend roles to backend roles
      const roleMapping = {
        'Admin': 'admin',
        'DepartmentStaff': 'staff',
        'FieldSupervisor': 'supervisor'
      };
      
      const backendRole = roleMapping[userData.role];
      if (!backendRole) {
        return { success: false, error: 'Invalid role selected' };
      }

      // Step 1: Register the user (this creates auth user with default 'citizen' role)
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userData.email.toLowerCase().trim(),
          password: userData.password,
          full_name: userData.fullname.trim(),
          phone: userData.phone || null,
          role: userData.role
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Step 2: If user was created successfully and we have admin privileges, update the role
        // For now, we'll store the intended role and let admin assign it later
        // or you can implement admin auto-assignment logic here
        
        // Try to login immediately if possible (depends on your backend email verification setup)
        if (data.access_token && data.access_token !== 'pending_confirmation') {
          // User can login immediately, try to update role if we have permission
          try {
            const updateResponse = await fetch(`${API_BASE_URL}/api/users/${data.user.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                role: backendRole,
                // Add department logic here if needed
                department: getDefaultDepartment(backendRole)
              })
            });

            if (updateResponse.ok) {
              // Role updated successfully
              console.log('User role updated during registration');
            } else {
              console.log('Role will need to be assigned by administrator');
            }
          } catch (updateError) {
            console.log('Role assignment will be handled by administrator');
          }
        }
        
        return { 
          success: true, 
          user: data.user,
          message: data.access_token === 'pending_confirmation' 
            ? 'Registration successful! Please check your email to confirm your account. Role assignment will be completed after email verification.'
            : `Registration successful! Account created with ${userData.role} role.`
        };
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

// Helper function to assign default departments based on role
  const getDefaultDepartment = (role) => {
    const defaultDepartments = {
      'admin': null, // Admins don't need departments
      'staff': 'Public Works', // Default department for staff
      'supervisor': 'Public Works' // Default department for supervisors
    };
    return defaultDepartments[role];
  };

  const logout = async () => {
    try {
      if (token) {
        // Call backend logout endpoint
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
      // Clear local storage regardless of backend call success
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (updates) => {
    if (!currentUser || !token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: updates.fullname || updates.full_name,
          phone: updates.phone,
          department: updates.department
        })
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = {
          ...currentUser,
          fullname: data.full_name,
          phone: data.phone,
          department: data.department
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
      } else {
        return { 
          success: false, 
          error: data.detail || 'Profile update failed' 
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Permission helpers adapted for your backend roles
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
      'view-analytics': ['Admin', 'DepartmentStaff', 'FieldSupervisor']
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
      return issue.assignedTo === currentUser.email;
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
    apiCall // Expose API helper
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;