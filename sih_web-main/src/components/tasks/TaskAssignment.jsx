import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Users, 
  UserPlus, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  RefreshCw,
  Eye,
  TrendingUp,
  Building,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { ROLES } from '../../utils/constants';

const TaskAssignment = () => {
  const { currentUser } = useAuth();
  const [pendingIssues, setPendingIssues] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [workloadStats, setWorkloadStats] = useState(null);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Check permissions based on your backend roles
  const hasAssignPermission = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.SUPERVISOR;

  useEffect(() => {
    if (currentUser) {
      loadUserAndData();
    }
  }, [currentUser]);

  const loadUserAndData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check permissions
      if (!hasAssignPermission) {
        setError('Access denied! Task assignment permission required.');
        return;
      }

      // Load all data concurrently
      await Promise.all([
        loadPendingIssues(),
        loadAvailableStaff(),
        loadAssignments(),
        loadWorkloadStats(),
        loadRecentUpdates()
      ]);

    } catch (err) {
      setError(err.message || 'Failed to load task assignment data');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingIssues = async () => {
    try {
      // Use your backend API endpoint structure
      const params = new URLSearchParams({ 
        status: 'pending', 
        per_page: '50' 
      });

      // Apply department filtering for supervisors based on your backend logic
      if (currentUser.role === ROLES.SUPERVISOR && currentUser.department) {
        params.append('department', currentUser.department);
      }

      const response = await apiService.get(`/api/issues?${params.toString()}`);
      setPendingIssues(response.issues || response.data || []);
    } catch (err) {
      console.error('Error loading pending issues:', err);
      setPendingIssues([]);
    }
  };

  const loadAvailableStaff = async () => {
    try {
      // Use your backend users endpoint
      const params = new URLSearchParams({ role: 'staff' });
      
      // Supervisors can only see staff in their department
      if (currentUser.role === ROLES.SUPERVISOR && currentUser.department) {
        params.append('department', currentUser.department);
      }

      const response = await apiService.get(`/api/users?${params.toString()}`);
      const staffList = response.users || response.data || [];
      
      // Get workload for each staff member
      const staffWithWorkload = await Promise.all(
        staffList.map(async (staff) => {
          try {
            const workloadResponse = await apiService.get(`/api/users/${staff.id}/workload`);
            return {
              ...staff,
              active_assignments: workloadResponse.active_assignments || 0,
              total_assignments: workloadResponse.total_assignments || 0
            };
          } catch (err) {
            return {
              ...staff,
              active_assignments: 0,
              total_assignments: 0
            };
          }
        })
      );
      
      setAvailableStaff(staffWithWorkload);
    } catch (err) {
      console.error('Error loading available staff:', err);
      setAvailableStaff([]);
    }
  };

  const loadAssignments = async () => {
    try {
      const params = new URLSearchParams();
      
      // Apply department filtering for supervisors
      if (currentUser.role === ROLES.SUPERVISOR && currentUser.department) {
        params.append('department', currentUser.department);
      }

      const response = await apiService.get(`/api/assignments?${params.toString()}`);
      setAssignments(response.assignments || response.data || []);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setAssignments([]);
    }
  };

  const loadWorkloadStats = async () => {
    try {
      const response = await apiService.get('/api/assignments/stats/workload');
      setWorkloadStats(response);
    } catch (err) {
      console.error('Error loading workload stats:', err);
      setWorkloadStats({
        total_staff: 0,
        total_active_assignments: 0,
        avg_workload: 0
      });
    }
  };

  const loadRecentUpdates = async () => {
    try {
      const response = await apiService.get('/api/updates/recent?limit=10');
      setRecentUpdates(response.updates || response.data || []);
    } catch (err) {
      console.error('Error loading recent updates:', err);
      setRecentUpdates([]);
    }
  };

  const handleAssignTask = async (issueId, staffId, notes = '') => {
    try {
      const assignmentData = {
        issue_id: issueId,
        staff_id: staffId,
        notes: notes
      };

      await apiService.post('/api/assignments', assignmentData);
      setMessage('Task assigned successfully!');
      await loadUserAndData(); // Reload data
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to assign task');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleBulkAssign = async (issueIds, staffId, notes = '') => {
    try {
      await apiService.post('/api/assignments/bulk-assign', { 
        issue_ids: issueIds,
        staff_id: staffId,
        notes: notes
      });
      setMessage('Bulk assignment completed successfully!');
      await loadUserAndData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Bulk assignment failed');
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const getCategoryDisplayName = (category) => {
    const categoryNames = {
      'potholes': 'Potholes',
      'DamagedElectricalPoles': 'Electrical Poles',
      'Garbage': 'Garbage',
      'WaterLogging': 'Water Logging',
      'FallenTrees': 'Fallen Trees'
    };
    return categoryNames[category] || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading task assignment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!hasAssignPermission) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <ClipboardList className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Task Assignment</h1>
                  <p className="text-gray-600">Access Restricted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Only supervisors and administrators can access the task assignment system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task Assignment</h1>
                <p className="text-gray-600">Manage issue assignments and workload distribution</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Logged in as: <strong>{currentUser?.full_name}</strong> ({currentUser?.role})
              </span>
              <button
                onClick={loadUserAndData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <CheckCircle className="h-5 w-5 inline mr-2" />
            {message}
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <AlertTriangle className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Pending Issues */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Pending Issues ({pendingIssues.length})
                </h2>
              </div>
              <div className="p-6">
                {pendingIssues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">No pending issues to assign!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingIssues.map((issue) => (
                      <div key={issue.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900 flex-1">
                            {issue.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
                            {issue.priority || 'medium'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {getCategoryDisplayName(issue.category)}
                            </span>
                            <span className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {issue.citizen_name || 'Anonymous'}
                            </span>
                          </div>
                          <span>{formatDate(issue.created_at)}</span>
                        </div>
                        
                        {/* Assignment Section */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <AssignmentForm
                            issue={issue}
                            availableStaff={availableStaff}
                            onAssign={handleAssignTask}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Staff */}
          <div className="space-y-6">
            {/* Workload Stats */}
            {workloadStats && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Workload Overview
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {workloadStats.total_staff || availableStaff.length}
                      </div>
                      <div className="text-sm text-gray-600">Staff Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {workloadStats.total_active_assignments || assignments.length}
                      </div>
                      <div className="text-sm text-gray-600">Active Tasks</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">
                        {workloadStats.avg_workload || 0}
                      </div>
                      <div className="text-sm text-gray-600">Avg Tasks per Staff</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Available Staff */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Available Staff ({availableStaff.length})
                </h2>
              </div>
              <div className="p-6">
                {availableStaff.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No available staff</p>
                ) : (
                  <div className="space-y-3">
                    {availableStaff.map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{staff.full_name}</p>
                          <p className="text-sm text-gray-600">{staff.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">
                            {staff.active_assignments || 0} tasks
                          </p>
                          <p className="text-xs text-gray-500">
                            {staff.total_assignments || 0} total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Updates */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Updates
                </h2>
              </div>
              <div className="p-6">
                {recentUpdates.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No recent updates</p>
                ) : (
                  <div className="space-y-3">
                    {recentUpdates.slice(0, 5).map((update) => (
                      <div key={update.id} className="text-sm">
                        <p className="font-medium text-gray-900">{update.update_text}</p>
                        <p className="text-gray-600">{formatDate(update.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Current Assignments Summary */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2" />
                  Assignment Summary
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Assignments:</span>
                    <span className="text-sm font-medium">{assignments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {assignments.filter(a => ['assigned', 'in_progress'].includes(a.status)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed:</span>
                    <span className="text-sm font-medium text-green-600">
                      {assignments.filter(a => a.status === 'completed').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Assignment Form Component
const AssignmentForm = ({ issue, availableStaff, onAssign }) => {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [notes, setNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setIsAssigning(true);
    try {
      await onAssign(issue.id, selectedStaff, notes);
      setSelectedStaff('');
      setNotes('');
    } catch (err) {
      console.error('Assignment failed:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex space-x-2">
        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select staff member...</option>
          {availableStaff.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.full_name} ({staff.active_assignments || 0} tasks)
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!selectedStaff || isAssigning}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
        >
          {isAssigning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
        </button>
      </div>
      {selectedStaff && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Assignment notes (optional)..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
        />
      )}
    </form>
  );
};

export default TaskAssignment;