import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import Sidebar from '../common/Sidebar';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  BarChart, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Settings,
  RefreshCw
} from 'lucide-react';
import apiService from '../../services/api';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.getDashboardOverview();
      
      if (data.success) {
        setDashboardData(data);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load dashboard data');
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
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-60 p-6">
          <LoadingSpinner size="large" text="Loading dashboard..." />
        </main>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-60 p-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const stats = dashboardData?.issue_stats || {};
  const userStats = dashboardData?.user_stats || {};
  const systemStats = dashboardData?.system_stats || {};
  const recentIssues = dashboardData?.recent_issues || [];
  const recentAssignments = dashboardData?.recent_assignments || [];
  const recentUpdates = dashboardData?.recent_updates || [];

  const StatCard = ({ title, value, icon: Icon, color, bgColor, trend }) => (
    <div className={`${bgColor} rounded-xl p-6 shadow-sm border-t-4 ${color} relative`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value || 0}</p>
          {trend && (
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className={`h-4 w-4 mr-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(trend)}% from last month
              </span>
            </div>
          )}
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome, <span className="font-semibold">{currentUser?.fullname}</span>
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Issues"
            value={stats.total_issues}
            icon={FileText}
            color="border-t-gray-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Pending Issues"
            value={stats.pending_issues}
            icon={AlertTriangle}
            color="border-t-red-500"
            bgColor="bg-white"
          />
          <StatCard
            title="In Progress"
            value={stats.in_progress_issues}
            icon={Clock}
            color="border-t-yellow-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Resolved"
            value={stats.resolved_issues}
            icon={CheckCircle}
            color="border-t-green-500"
            bgColor="bg-white"
          />
        </section>

        {/* System Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={userStats.total_users}
            icon={Users}
            color="border-t-blue-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Active Staff"
            value={userStats.staff}
            icon={Users}
            color="border-t-purple-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Total Assignments"
            value={systemStats.total_assignments}
            icon={BarChart}
            color="border-t-indigo-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Total Upvotes"
            value={stats.total_upvotes}
            icon={TrendingUp}
            color="border-t-pink-500"
            bgColor="bg-white"
          />
        </section>

        {/* Category Breakdown */}
        {stats.issues_by_category && Object.keys(stats.issues_by_category).length > 0 && (
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Issues by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.issues_by_category).map(([category, count]) => (
                <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{category}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Department Statistics */}
        {stats.issues_by_department && Object.keys(stats.issues_by_department).length > 0 && (
          <section className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Issues by Department</h2>
            <div className="space-y-3">
              {Object.entries(stats.issues_by_department).map(([department, count]) => (
                <div key={department} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{department || 'Unassigned'}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {count} issues
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Issues */}
          <section className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Issues</h2>
            </div>
            <div className="p-6">
              {recentIssues.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent issues</p>
              ) : (
                <div className="space-y-4">
                  {recentIssues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-medium text-gray-900 truncate">{issue.title}</h3>
                      <p className="text-sm text-gray-600">
                        {issue.category} • {issue.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent Assignments */}
          <section className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Assignments</h2>
            </div>
            <div className="p-6">
              {recentAssignments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent assignments</p>
              ) : (
                <div className="space-y-4">
                  {recentAssignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.id} className="border-l-4 border-yellow-500 pl-4">
                      <h3 className="font-medium text-gray-900 truncate">
                        {assignment.issue_title || `Issue #${assignment.issue_id}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Assigned to: {assignment.staff_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent Updates */}
          <section className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Updates</h2>
            </div>
            <div className="p-6">
              {recentUpdates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent updates</p>
              ) : (
                <div className="space-y-4">
                  {recentUpdates.slice(0, 5).map((update) => (
                    <div key={update.id} className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-medium text-gray-900 truncate">
                        Update on Issue #{update.issue_id}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {update.update_text}
                      </p>
                      <p className="text-xs text-gray-500">
                        By {update.staff_name} • {new Date(update.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Performance Metrics */}
        {stats.avg_resolution_time && (
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.avg_resolution_time}
                </p>
                <p className="text-sm text-gray-600">Average Resolution Time (days)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {stats.resolved_issues && stats.total_issues ? 
                    Math.round((stats.resolved_issues / stats.total_issues) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Resolution Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {systemStats.avg_updates_per_issue}
                </p>
                <p className="text-sm text-gray-600">Average Updates per Issue</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;