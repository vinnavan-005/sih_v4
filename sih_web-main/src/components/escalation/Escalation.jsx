import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useLocalStorage } from '../../hooks/useLocalStorage';
import Header from '../common/Header';
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Building, 
  User, 
  CheckCircle,
  FileText,
  TrendingUp 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.103:8000';

const Escalation = () => {
  const { currentUser, token } = useAuth();
  const [escalationLogs, setEscalationLogs] = useLocalStorage('escalationLogs', []);
  const [issues, setIssues] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [overdueIssues, setOverdueIssues] = useState([]);
  const [stats, setStats] = useState({
    totalOverdue: 0,
    criticalOverdue: 0,
    averageOverdueDays: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && token) {
      fetchData();
    }
  }, [currentUser, token]);

  const apiRequest = async (url, options = {}) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch issues and assignments
      const [issuesData, assignmentsData] = await Promise.all([
        apiRequest('/api/issues/'),
        apiRequest('/api/assignments/')
      ]);

      setIssues(issuesData.issues || []);
      setAssignments(assignmentsData.assignments || []);
      
      // Calculate overdue issues
      calculateOverdueIssues(issuesData.issues || [], assignmentsData.assignments || []);
      
    } catch (error) {
      console.error('Failed to fetch escalation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverdueIssues = (issuesData, assignmentsData) => {
    const today = new Date();
    const overdue = [];

    issuesData.forEach(issue => {
      if (issue.status === 'resolved') return;

      let isOverdue = false;
      let overdueDays = 0;
      let deadline = null;

      // Calculate deadline based on creation date (SLA: 3 days for regular issues)
      const created = new Date(issue.created_at);
      const slaDeadline = new Date(created);
      
      // Adjust SLA based on priority
      const slaHours = issue.priority === 'high' ? 24 : 
                      issue.priority === 'medium' ? 48 : 72; // 1, 2, or 3 days
      
      slaDeadline.setHours(slaDeadline.getHours() + slaHours);
      
      if (slaDeadline < today) {
        isOverdue = true;
        overdueDays = Math.ceil((today - slaDeadline) / (1000 * 60 * 60 * 24));
        deadline = slaDeadline;
      }

      if (isOverdue) {
        // Get assignment info
        const assignment = assignmentsData.find(a => a.issue_id === issue.id);
        
        overdue.push({
          ...issue,
          overdueDays,
          deadline: deadline ? deadline.toDateString() : 'N/A',
          assignedTo: assignment ? assignment.staff_name : 'Unassigned',
          assignedToId: assignment ? assignment.staff_id : null,
          severity: overdueDays > 7 ? 'critical' : overdueDays > 3 ? 'high' : 'medium',
          escalated: issue.escalated || false
        });
      }
    });

    // Sort by overdue days (most overdue first)
    overdue.sort((a, b) => b.overdueDays - a.overdueDays);

    setOverdueIssues(overdue);

    // Calculate stats
    const totalOverdue = overdue.length;
    const criticalOverdue = overdue.filter(i => i.severity === 'critical').length;
    const averageOverdueDays = totalOverdue > 0 
      ? Math.round(overdue.reduce((sum, i) => sum + i.overdueDays, 0) / totalOverdue)
      : 0;

    setStats({
      totalOverdue,
      criticalOverdue,
      averageOverdueDays
    });
  };

  const addEscalationLog = (message, issueId = null) => {
    const logEntry = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleString(),
      user: currentUser.full_name || currentUser.email,
      issueId,
      department: currentUser.department || 'General'
    };

    setEscalationLogs(prev => [logEntry, ...prev]);
  };

  const handleEscalateIssue = async (issue) => {
    if (!canEscalate()) {
      alert('You do not have permission to escalate issues.');
      return;
    }

    const escalateTo = prompt('Escalate to (enter supervisor/manager name or email):');
    if (escalateTo && escalateTo.trim()) {
      try {
        // Update issue to mark as escalated
        await apiRequest(`/api/issues/${issue.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            escalated: true,
            escalated_to: escalateTo.trim(),
            updated_at: new Date().toISOString()
          }),
        });

        const message = `Issue #${issue.id} (${issue.title}) escalated to ${escalateTo} - ${issue.overdueDays} days overdue`;
        addEscalationLog(message, issue.id);
        
        alert(`Issue escalated to ${escalateTo}`);
        
        // Refresh data
        fetchData();
        
      } catch (error) {
        alert('Failed to escalate issue: ' + error.message);
      }
    }
  };

  const handleBulkEscalate = async () => {
    if (!canEscalate()) {
      alert('You do not have permission to escalate issues.');
      return;
    }

    const criticalIssues = overdueIssues.filter(i => i.severity === 'critical' && !i.escalated);
    
    if (criticalIssues.length === 0) {
      alert('No critical overdue issues to escalate.');
      return;
    }

    const confirmation = confirm(`Escalate ${criticalIssues.length} critical overdue issues?`);
    if (confirmation) {
      try {
        for (const issue of criticalIssues) {
          await apiRequest(`/api/issues/${issue.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              escalated: true,
              escalated_to: 'System Auto-Escalation',
              updated_at: new Date().toISOString()
            }),
          });

          const message = `Issue #${issue.id} (${issue.title}) auto-escalated - ${issue.overdueDays} days overdue (Critical)`;
          addEscalationLog(message, issue.id);
        }

        alert(`${criticalIssues.length} critical issues escalated successfully.`);
        fetchData();
        
      } catch (error) {
        alert('Failed to bulk escalate: ' + error.message);
      }
    }
  };

  const canEscalate = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  };

  const canViewAllIssues = () => {
    return currentUser?.role === 'admin';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const StatCard = ({ title, value, icon: Icon, color, suffix = '' }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}{suffix}</p>
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Escalation & SLA Monitor" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading escalation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Escalation & SLA Monitor" />
      
      <main className="p-6">
        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Overdue Issues"
            value={stats.totalOverdue}
            icon={AlertTriangle}
            color="#EF4444"
          />
          <StatCard
            title="Critical Overdue"
            value={stats.criticalOverdue}
            icon={TrendingUp}
            color="#DC2626"
          />
          <StatCard
            title="Average Overdue Days"
            value={stats.averageOverdueDays}
            icon={Clock}
            color="#F59E0B"
          />
        </section>

        {/* Bulk Actions */}
        {canEscalate() && stats.criticalOverdue > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-800">Critical Issues Alert</h3>
                <p className="text-sm text-red-600 mt-1">
                  {stats.criticalOverdue} issues are critically overdue and may need immediate attention.
                </p>
              </div>
              <button
                onClick={handleBulkEscalate}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Auto-Escalate Critical
              </button>
            </div>
          </div>
        )}

        {/* Overdue Issues Table */}
        <section className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="h-6 w-6 text-red-500 mr-2" />
              Overdue Issues
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {overdueIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No overdue issues</p>
                <p className="text-sm text-gray-500 mt-2">All issues are within SLA requirements</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overdue (days)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overdueIssues.map((issue) => (
                    <tr 
                      key={issue.id} 
                      className={`hover:bg-gray-50 ${issue.severity === 'critical' ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{issue.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {issue.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {issue.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(issue.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(issue.severity)}`}>
                          {issue.overdueDays} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.assignedTo || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {canEscalate() && !issue.escalated && (
                          <button
                            onClick={() => handleEscalateIssue(issue)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors inline-flex items-center"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Escalate
                          </button>
                        )}
                        {issue.escalated && (
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Escalated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Escalation Log */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-6 w-6 text-blue-500 mr-2" />
            Escalation Log
          </h2>
          
          {escalationLogs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No escalations recorded</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {escalationLogs
                .filter(log => 
                  canViewAllIssues() || 
                  log.department === currentUser?.department ||
                  log.user === currentUser?.full_name ||
                  log.user === currentUser?.email
                )
                .map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{log.user}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {log.timestamp}
                    </div>
                  </div>
                  <p className="text-gray-700">{log.message}</p>
                  {log.department && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Building className="h-3 w-3 mr-1" />
                      {log.department}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Escalation;