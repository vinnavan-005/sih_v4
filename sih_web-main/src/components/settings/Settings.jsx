import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Cog, 
  Trash2, 
  UserPlus,
  Save,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Building,
  Shield,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

const Settings = () => {
  const { currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '',
    department: ''
  });
  const [userStats, setUserStats] = useState({
    total_users: 0,
    citizens: 0,
    staff: 0,
    supervisors: 0,
    admins: 0
  });

  const roles = [
    { value: ROLES.CITIZEN, label: ROLE_LABELS[ROLES.CITIZEN] },
    { value: ROLES.STAFF, label: ROLE_LABELS[ROLES.STAFF] },
    { value: ROLES.SUPERVISOR, label: ROLE_LABELS[ROLES.SUPERVISOR] },
    { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] }
  ];

  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Check if user has manage users permission
      if (!currentUser || !hasPermission('manage-users')) {
        setMessage('Access denied! Admin privileges required.');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        return;
      }

      // Load users, departments, and stats
      await Promise.all([
        loadUsers(),
        loadDepartments(),
        loadUserStats()
      ]);

    } catch (err) {
      setMessage(`Error: ${err.message}`);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiService.users.list({ per_page: 100 });
      setUsers(data.users || data.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await apiService.users.getDepartments();
      setDepartments(data.departments || data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
      setDepartments([]);
    }
  };

  const loadUserStats = async () => {
    try {
      const data = await apiService.users.getStats();
      setUserStats({
        total_users: data.total_users || 0,
        citizens: data.citizens || 0,
        staff: data.staff || 0,
        supervisors: data.supervisors || 0,
        admins: data.admins || 0
      });
    } catch (err) {
      console.error('Failed to load user stats:', err);
      setUserStats({
        total_users: 0,
        citizens: 0,
        staff: 0,
        supervisors: 0,
        admins: 0
      });
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newUser.full_name || !newUser.email || !newUser.role || !newUser.password) {
      setMessage('Please fill in all required fields.');
      return;
    }

    // Check if department is required for non-citizen roles
    if ((newUser.role === ROLES.STAFF || newUser.role === ROLES.SUPERVISOR) && !newUser.department) {
      setMessage('Please select a department for this role.');
      return;
    }

    try {
      // Create user with the new API service
      const userData = {
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        role: newUser.role
      };

      // Add department if specified
      if (newUser.department) {
        userData.department = newUser.department;
      }

      await apiService.auth.register(userData);

      setMessage('User created successfully!');
      setNewUser({ full_name: '', email: '', role: '', password: '', department: '' });
      
      // Reload data
      await Promise.all([loadUsers(), loadUserStats()]);
      
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const handleChangeUserRole = async (userId, newRole) => {
    if (!window.confirm('Are you sure you want to change this user\'s role?')) {
      return;
    }

    try {
      await apiService.users.changeRole(userId, newRole);
      setMessage('User role updated successfully!');
      await Promise.all([loadUsers(), loadUserStats()]);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.users.delete(userId);
      setMessage('User deleted successfully!');
      await Promise.all([loadUsers(), loadUserStats()]);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-red-100 text-red-800';
      case ROLES.SUPERVISOR:
        return 'bg-blue-100 text-blue-800';
      case ROLES.STAFF:
        return 'bg-green-100 text-green-800';
      case ROLES.CITIZEN:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !hasPermission('manage-users')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
            <AlertCircle className="h-6 w-6 inline mr-2" />
            Access denied! Admin privileges required.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600">Manage users and system configuration</p>
            </div>
            <button
              onClick={loadInitialData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('successfully') || message.includes('updated')
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              {message.includes('successfully') ? (
                <Save className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message}
            </div>
          </div>
        )}

        {/* User Statistics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{userStats.total_users}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Citizens</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{userStats.citizens}</p>
              </div>
              <Users className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Staff</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{userStats.staff}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Supervisors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{userStats.supervisors}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </section>

        {/* User Management Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <UserPlus className="h-6 w-6 text-blue-500 mr-2" />
            User Management
          </h3>
          
          {/* Add User Form */}
          <form onSubmit={handleAddUser} className="mb-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Create New User</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value, department: e.target.value === ROLES.CITIZEN ? '' : newUser.department})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Role *</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password *"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {(newUser.role === ROLES.STAFF || newUser.role === ROLES.SUPERVISOR) && (
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Department *</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </button>
            </div>
          </form>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <h4 className="text-lg font-medium text-gray-900 mb-4">System Users ({users.length})</h4>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {ROLE_LABELS[user.role] || user.role || 'citizen'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-400 mr-2" />
                          {user.department || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <select
                          onChange={(e) => e.target.value && handleChangeUserRole(user.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue=""
                          disabled={user.id === currentUser?.id}
                        >
                          <option value="">Change Role</option>
                          {roles.filter(role => role.value !== user.role).map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* System Information */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Cog className="h-6 w-6 text-gray-500 mr-2" />
            System Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Database className="h-5 w-5 mr-2" />
                API Status
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Backend URL:</span>
                  <span className="text-gray-900">{apiService.baseURL}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Authentication:</span>
                  <span className="text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User Role:</span>
                  <span className="text-blue-600">{ROLE_LABELS[currentUser?.role] || currentUser?.role}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Departments
              </h4>
              <div className="space-y-1 text-sm">
                {departments.length === 0 ? (
                  <p className="text-gray-500">No departments configured</p>
                ) : (
                  departments.map((dept, index) => (
                    <div key={index} className="flex items-center">
                      <Building className="h-3 w-3 text-gray-400 mr-2" />
                      <span className="text-gray-900">{dept}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Permissions
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-600">Manage Users:</span>
                  <span className={`ml-2 ${hasPermission('manage-users') ? 'text-green-600' : 'text-red-600'}`}>
                    {hasPermission('manage-users') ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">System Settings:</span>
                  <span className={`ml-2 ${hasPermission('system-settings') ? 'text-green-600' : 'text-red-600'}`}>
                    {hasPermission('system-settings') ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">View Analytics:</span>
                  <span className={`ml-2 ${hasPermission('view-analytics') ? 'text-green-600' : 'text-red-600'}`}>
                    {hasPermission('view-analytics') ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;