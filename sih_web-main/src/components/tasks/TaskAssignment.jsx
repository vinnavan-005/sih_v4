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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.103:8000/api';

const TaskAssignment = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingIssues, setPendingIssues] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [workloadStats, setWorkloadStats] = useState(null);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      setCurrentUser(userData);

      // Check permissions
      if (!['admin', 'supervisor'].includes(userData.role)) {
        setError('Access denied! Admin or Supervisor role required.');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        return;
      }

      // Load data
      await Promise.all([
        loadPendingIssues(userData),
        loadAvailableStaff(userData),
        loadAssignments(userData),
        loadWorkloadStats(userData),
        loadRecentUpdates(userData)
      ]);

    } catch (err) {
      setError(err.message);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingIssues = async (user) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/issues?status=pending&per_page=50`;

      // Supervisors only see issues in their department
      if (user.role === 'supervisor' && user.department) {
        url += `&department=${encodeURIComponent(user.department)}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Failed to load pending issues:', err);
    }
  };

  const loadAvailableStaff = async (user) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/users/staff?available_only=true`;

      // Supervisors only see staff in their department
      if (user.role === 'supervisor' && user.department) {
        url += `&department=${encodeURIComponent(user.department)}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableStaff(data);
      }
    } catch (err) {
      console.error('Failed to load available staff:', err);
    }
  };

  const loadAssignments = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assignments?per_page=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  const loadWorkloadStats = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assignments/stats/workload`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkloadStats(data);
      }
    } catch (err) {
      console.error('Failed to load workload stats:', err);
    }
  };

  const loadRecentUpdates = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/updates/recent?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Failed to load recent updates:', err);
    }
  };

  const handleAssignIssue = async (issueId, staffId) => {
    if (!staffId) {
      setMessage('Please select a staff member!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          issue_id: parseInt(issueId),
          staff_id: staffId,
          notes: `Assigned via task assignment interface by ${currentUser?.full_name || currentUser?.email}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to assign issue');
      }

      setMessage('Issue assigned successfully!');
      
      // Reload data
      await Promise.all([
        loadPendingIssues(currentUser),
        loadAssignments(currentUser),
        loadWorkloadStats(currentUser)
      ]);

    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const handleBulkAssign = async (issueIds, staffId) => {
    if (!staffId || issueIds.length === 0) {
      setMessage('Please select issues and a staff member!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/assignments/bulk-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          issue_ids: issueIds.map(id => parseInt(id)),
          staff_id: staffId,
          notes: `Bulk assigned via task assignment interface by ${currentUser?.full_name || currentUser?.email}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to bulk assign issues');
      }

      const result = await response.json();
      setMessage(`Bulk assignment completed: ${result.processed} successful, ${result.failed} failed`);
      
      // Reload data
      await Promise.all([
        loadPendingIssues(currentUser),
        loadAssignments(currentUser),
        loadWorkloadStats(currentUser)
      ]);

    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const handleViewIssue = (issueId) => {
    window.open(`/issues/${issueId}`, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'roads': 'bg-blue-100 text-blue-800',
      'waste': 'bg-green-100 text-green-800',
      'water': 'bg-cyan-100 text-cyan-800',
      'streetlight': 'bg-yellow-100 text-yellow-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getWorkloadColor = (activeAssignments, avgWorkload) => {
    if (activeAssignments > avgWorkload * 1.5) return 'bg-red-500';
    if (activeAssignments > avgWorkload) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading task assignment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Access Denied</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
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
              <h1 className="text-2xl font-bold text-gray-900">Task Assignment</h1>
              <p className="text-gray-600">Manage issue assignments and team workload</p>
            </div>
            <button
              onClick={loadUserAndData}
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
            message.includes('successfully') || message.includes('completed')
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Pending Issues */}
        <section className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ClipboardList className="h-6 w-6 text-blue-500 mr-2" />
              Unassigned Issues ({pendingIssues.length})
              {currentUser?.role === 'supervisor' && currentUser?.department && (
                <span className="ml-2 text-sm text-gray-600">
                  - {currentUser.department} Department
                </span>
              )}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {pendingIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No unassigned issues</p>
                <p className="text-sm text-gray-500 mt-2">All issues have been assigned to staff members</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upvotes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assign To
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{issue.id}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {issue.title}
                          </div>
                          <div className="text-xs text-gray-400">
                            by {issue.citizen_name || 'Anonymous'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(issue.category)}`}>
                          {issue.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          {new Date(issue.created_at).toLocaleDateString()}
                        </div>
                        {issue.days_open && (
                          <div className="text-xs text-gray-400">
                            {issue.days_open} days old
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                          {issue.upvotes || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <select
                            id={`assignSelect-${issue.id}`}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Staff</option>
                            {availableStaff.map(staff => (
                              <option key={staff.id} value={staff.id}>
                                {staff.full_name} {staff.active_assignments && `(${staff.active_assignments})`}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const select = document.getElementById(`assignSelect-${issue.id}`);
                              handleAssignIssue(issue.id, select.value);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors inline-flex items-center"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assign
                          </button>
                          <button
                            onClick={() => handleViewIssue(issue.id)}
                            className="text-gray-600 hover:text-gray-900 inline-flex items-center text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Workload */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Users className="h-6 w-6 text-green-500 mr-2" />
              Staff Workload
              {workloadStats && (
                <span className="ml-2 text-sm text-gray-600">
                  (Avg: {workloadStats.avg_workload})
                </span>
              )}
            </h2>
            
            {!workloadStats || workloadStats.workload_distribution?.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No staff workload data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workloadStats.workload_distribution.map(staff => (
                  <div key={staff.staff_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                        <p className="text-sm text-gray-600">{staff.department || 'No department'}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        staff.active_assignments > workloadStats.avg_workload 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {staff.active_assignments} active
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{staff.total_assignments}</div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">{staff.active_assignments}</div>
                        <div className="text-xs text-gray-600">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{staff.completed_assignments}</div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                    </div>
                    
                    {/* Workload Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getWorkloadColor(staff.active_assignments, workloadStats.avg_workload)}`}
                        style={{ width: `${Math.min((staff.active_assignments / (workloadStats.avg_workload * 2)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Completion Rate: {staff.completion_rate}%</span>
                      <span>Load: {staff.active_assignments}/{Math.ceil(workloadStats.avg_workload * 2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="h-6 w-6 text-purple-500 mr-2" />
              Recent Updates
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentUpdates.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No recent updates</p>
                </div>
              ) : (
                recentUpdates.map((update) => (
                  <div key={update.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{update.update_text}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(update.created_at).toLocaleString()}
                          <span className="mx-2">•</span>
                          <User className="h-3 w-3 mr-1" />
                          {update.staff_name || 'Unknown'}
                          {update.issue_title && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Issue: {update.issue_title}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Recent Assignments */}
        {assignments.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm mt-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <ClipboardList className="h-6 w-6 text-indigo-500 mr-2" />
                Recent Assignments
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.slice(0, 10).map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{assignment.issue_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.issue_title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.staff_name}
                            </div>
                            {assignment.staff_department && (
                              <div className="text-xs text-gray-500">
                                {assignment.staff_department}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assignment.assigned_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.assigned_by_name || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default TaskAssignment;