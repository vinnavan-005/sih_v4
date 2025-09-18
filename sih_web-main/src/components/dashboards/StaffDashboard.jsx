import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import Sidebar from '../common/Sidebar';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  Play, 
  Check, 
  FileText,
  RefreshCw,
  UserPlus,
  TrendingUp
} from 'lucide-react';
import apiService from '../../services/api';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [deptIssues, setDeptIssues] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard overview
      const dashboardResponse = await apiService.getDashboardOverview();
      
      // Fetch department issues (filtered by backend based on user role)
      const issuesResponse = await apiService.getIssues({
        department: currentUser?.department,
        per_page: 50
      });
      
      // Fetch assignments for the department
      const assignmentsResponse = await apiService.getAssignments({
        department: currentUser?.department,
        per_page: 50
      });
      
      // Fetch staff members in the department
      const staffResponse = await apiService.getStaffUsers(currentUser?.department);

      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse);
      }
      
      if (issuesResponse.success) {
        setDeptIssues(issuesResponse.issues || []);
      }
      
      if (assignmentsResponse.success) {
        setAssignments(assignmentsResponse.assignments || []);
      }
      
      if (Array.isArray(staffResponse)) {
        setStaffMembers(staffResponse);
      }

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 2 minutes for staff dashboard
    const interval = setInterval(fetchDashboardData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentUser?.department]);

  const handleAssignToStaff = async (issueId) => {
    if (!staffMembers.length) {
      alert('No staff members available for assignment');
      return;
    }

    // Simple staff selection - in a real app, you'd want a proper modal
    const staffList = staffMembers.map(s => `${s.full_name} (${s.email})`).join('\n');
    const selectedStaff = prompt(`Select staff member by email:\n\n${staffList}\n\nEnter email:`);
    
    if (selectedStaff && selectedStaff.trim()) {
      const staffMember = staffMembers.find(s => s.email === selectedStaff.trim());
      if (!staffMember) {
        alert('Staff member not found');
        return;
      }

      setActionLoading(issueId);
      try {
        const result = await apiService.createAssignment({
          issue_id: issueId,
          staff_id: staffMember.id,
          notes: `Assigned by ${currentUser.fullname}`
        });

        if (result.success || result.id) {
          alert('Issue assigned successfully!');
          fetchDashboardData(); // Refresh data
        } else {
          alert('Assignment failed: ' + (result.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Assignment error:', err);
        alert('Assignment failed: ' + err.message);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleUpdateIssueStatus = async (issueId, newStatus) => {
    setActionLoading(issueId);
    try {
      const backendStatus = {
        'In Progress': 'in_progress',
        'Resolved': 'resolved'
      }[newStatus];

      const result = await apiService.updateIssue(issueId, {
        status: backendStatus
      });

      if (result.success || result.id) {
        alert(`Issue marked as ${newStatus}!`);
        fetchDashboardData(); // Refresh data
      } else {
        alert('Status update failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('Status update failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-60 p-6">
          <LoadingSpinner size="large" text="Loading department dashboard..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-60 p-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Calculate department stats
  const deptStats = {
    total: deptIssues.length,
    open: deptIssues.filter(i => i.status === 'pending').length,
    inProgress: deptIssues.filter(i => i.status === 'in_progress').length,
    resolved: deptIssues.filter(i => i.status === 'resolved').length,
    overdue: deptIssues.filter(i => i.days_open > 3 && i.status !== 'resolved').length
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl p-6 shadow-sm border-t-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color.replace('border-t-', 'text-')}`} />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-60 p-6">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Department Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome, <span className="font-semibold">{currentUser?.fullname}</span>
            </p>
            <p className="text-sm text-gray-500">
              Department: {currentUser?.department || 'Not assigned'}
            </p>
          </div>
          
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {/* Department Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Issues"
            value={deptStats.total}
            icon={FileText}
            color="border-t-gray-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Open"
            value={deptStats.open}
            icon={AlertTriangle}
            color="border-t-red-500"
            bgColor="bg-white"
          />
          <StatCard
            title="In Progress"
            value={deptStats.inProgress}
            icon={Clock}
            color="border-t-yellow-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Resolved"
            value={deptStats.resolved}
            icon={CheckCircle}
            color="border-t-green-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Overdue"
            value={deptStats.overdue}
            icon={AlertTriangle}
            color="border-t-purple-500"
            bgColor="bg-white"
          />
        </section>

        {/* Department Issues Table */}
        <section className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Department Issues</h2>
            <span className="text-sm text-gray-500">
              {deptIssues.length} total issues
            </span>
          </div>
          
          <div className="overflow-x-auto">
            {deptIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No issues in your department</p>
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
                      Days Open
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deptIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {issue.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{issue.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {issue.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          issue.status === 'resolved' 
                            ? 'bg-green-100 text-green-800'
                            : issue.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {issue.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.days_open || 0} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.assignment_count || 0} assigned
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleAssignToStaff(issue.id)}
                          disabled={actionLoading === issue.id}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          {actionLoading === issue.id ? 'Assigning...' : 'Assign'}
                        </button>
                        <button
                          onClick={() => handleUpdateIssueStatus(issue.id, 'In Progress')}
                          disabled={actionLoading === issue.id || issue.status === 'in_progress'}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors disabled:opacity-50 inline-flex items-center"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Progress
                        </button>
                        <button
                          onClick={() => handleUpdateIssueStatus(issue.id, 'Resolved')}
                          disabled={actionLoading === issue.id || issue.status === 'resolved'}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staff Members */}
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-6 w-6 text-blue-500 mr-2" />
              Department Staff ({staffMembers.length})
            </h2>
            
            {staffMembers.length === 0 ? (
              <p className="text-gray-600">No staff members in this department.</p>
            ) : (
              <div className="space-y-3">
                {staffMembers.map((staff) => {
                  const staffAssignments = assignments.filter(a => a.staff_id === staff.id);
                  const activeAssignments = staffAssignments.filter(a => a.status !== 'completed');
                  
                  return (
                    <div key={staff.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{staff.full_name}</span>
                        <p className="text-sm text-gray-600">{staff.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {activeAssignments.length} active
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {staffAssignments.length} total
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
              Department Performance
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Resolution Rate</span>
                <span className="font-semibold text-gray-900">
                  {deptStats.total > 0 ? Math.round((deptStats.resolved / deptStats.total) * 100) : 0}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Assignments</span>
                <span className="font-semibold text-gray-900">
                  {assignments.filter(a => a.status !== 'completed').length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Overdue Issues</span>
                <span className={`font-semibold ${deptStats.overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {deptStats.overdue}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Upvotes</span>
                <span className="font-semibold text-gray-900">
                  {deptIssues.reduce((sum, issue) => sum + (issue.upvotes || 0), 0)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;