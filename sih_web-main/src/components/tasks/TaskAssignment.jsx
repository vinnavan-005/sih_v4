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
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [workloadStats, setWorkloadStats] = useState(null);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Check permissions - allow staff to assign tasks
  const hasAssignPermission = currentUser?.role === 'admin' || currentUser?.role === 'staff' || currentUser?.role === 'supervisor';

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
        loadAvailableSupervisors(),
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
    console.log('Loading pending issues...');
    console.log('Current user:', currentUser);
    
    const params = new URLSearchParams({ 
      status: 'pending', 
      per_page: '100' 
    });

    if (currentUser.role === 'staff' && currentUser.department) {
      params.append('department', currentUser.department);
    }

    console.log('API call params:', params.toString());
    
    const response = await apiService.get(`/api/issues?${params.toString()}`);
    console.log('API response:', response);
    
    setPendingIssues(response.issues || response.data || []);
  } catch (err) {
    console.error('Error loading pending issues:', err);
    setPendingIssues([]);
  }
};
  const loadAvailableSupervisors = async () => {
    try {
      // Load supervisors instead of staff
      const params = new URLSearchParams({ role: 'supervisor' });
      
      // If user is staff, only show supervisors from their department
      if (currentUser.role === 'staff' && currentUser.department) {
        params.append('department', currentUser.department);
      }

      const response = await apiService.get(`/api/users?${params.toString()}`);
      const supervisorList = response.users || response.data || [];
      
      // Get workload for each supervisor
      const supervisorsWithWorkload = await Promise.all(
        supervisorList.map(async (supervisor) => {
          try {
            const workloadResponse = await apiService.get(`/api/users/${supervisor.id}/workload`);
            return {
              ...supervisor,
              active_assignments: workloadResponse.active_assignments || 0,
              total_assignments: workloadResponse.total_assignments || 0
            };
          } catch (err) {
            return {
              ...supervisor,
              active_assignments: 0,
              total_assignments: 0
            };
          }
        })
      );
      
      setAvailableSupervisors(supervisorsWithWorkload);
    } catch (err) {
      console.error('Error loading available supervisors:', err);
      setAvailableSupervisors([]);
    }
  };

  const loadAssignments = async () => {
    try {
      const params = new URLSearchParams();
      
      // Filter assignments based on user role
      if (currentUser.role === 'staff' && currentUser.department) {
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

  const handleAssignTask = async (issueId, supervisorId, notes = '') => {
    try {
      const assignmentData = {
        issue_id: issueId,
        staff_id: supervisorId, // Assigning to supervisor
        notes: notes,
        assigned_by: currentUser.id
      };

      await apiService.post('/api/assignments', assignmentData);
      setMessage('Task assigned to supervisor successfully!');
      
      // Reload data
      await Promise.all([
        loadPendingIssues(),
        loadAvailableSupervisors(),
        loadAssignments()
      ]);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
      
    } catch (err) {
      console.error('Assignment error:', err);
      setMessage('Failed to assign task: ' + (err.message || 'Unknown error'));
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading task assignment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/staff-dashboard'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task Assignment</h1>
                <p className="text-sm text-gray-600">Assign pending issues to supervisors</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4`}>
          <div className={`p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
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
                      <IssueCard 
                        key={issue.id} 
                        issue={issue} 
                        availableSupervisors={availableSupervisors}
                        onAssign={handleAssignTask}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Workload Overview */}
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
                        {workloadStats.total_staff || availableSupervisors.length}
                      </div>
                      <div className="text-sm text-gray-600">Supervisors</div>
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
                      <div className="text-sm text-gray-600">Avg Tasks per Supervisor</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Available Supervisors */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Available Supervisors ({availableSupervisors.length})
                </h2>
              </div>
              <div className="p-6">
                {availableSupervisors.length === 0 ? (
                  <div className="text-center py-4">
                    <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No available supervisors</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableSupervisors.map((supervisor) => (
                      <div key={supervisor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{supervisor.full_name}</p>
                          <p className="text-sm text-gray-600">{supervisor.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">
                            {supervisor.active_assignments || 0} tasks
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
                  <p className="text-gray-600 text-center">No recent updates</p>
                ) : (
                  <div className="space-y-3">
                    {recentUpdates.slice(0, 5).map((update, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-gray-900">{update.message || 'Update'}</p>
                        <p className="text-gray-500">{new Date(update.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Issue Card Component
const IssueCard = ({ issue, availableSupervisors, onAssign }) => {
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [notes, setNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedSupervisor) {
      alert('Please select a supervisor');
      return;
    }

    setIsAssigning(true);
    try {
      await onAssign(issue.id, selectedSupervisor, notes);
      setSelectedSupervisor('');
      setNotes('');
    } catch (err) {
      console.error('Assignment failed:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{issue.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
          <div className="flex items-center mt-2 space-x-4">
            <span className="text-xs text-gray-500">
              <Building className="h-3 w-3 inline mr-1" />
              {issue.category}
            </span>
            <span className="text-xs text-gray-500">
              {issue.reporter_name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(issue.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
          {issue.priority || 'medium'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex space-x-2">
          <select
            value={selectedSupervisor}
            onChange={(e) => setSelectedSupervisor(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isAssigning}
          >
            <option value="">Select supervisor...</option>
            {availableSupervisors.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.full_name} ({supervisor.active_assignments || 0} tasks)
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedSupervisor || isAssigning}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
          >
            {isAssigning ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3 mr-1" />
                Assign
              </>
            )}
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Assignment notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isAssigning}
        />
      </div>
    </div>
  );
};

export default TaskAssignment;