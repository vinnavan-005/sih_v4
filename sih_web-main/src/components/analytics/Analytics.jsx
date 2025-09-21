import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import Header from '../common/Header';
import { PageLoader, ErrorState } from '../common/LoadingSpinner';
import { Download, FileText, TrendingUp, Filter, RefreshCw, BarChart3, PieChart, Calendar } from 'lucide-react';
import apiService from '../../services/api';
import { ROLES } from '../../utils/constants';

const Analytics = () => {
  const { currentUser } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    overview: null,
    trends: null,
    departments: null,
    performance: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [period, setPeriod] = useState('month');
  const [issuesData, setIssuesData] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchAnalyticsData();
    }
  }, [currentUser, dateRange, period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use correct backend endpoints based on your API structure
      const [overviewData, issuesResponse, trendsData, performanceData] = await Promise.allSettled([
        apiService.get('/api/dashboard'), // Your dashboard endpoint
        apiService.get(`/api/issues?per_page=100`), // Your issues endpoint
        apiService.get(`/api/dashboard/trends?days=${dateRange}`), // Your trends endpoint
        apiService.get(`/api/dashboard/performance?period=${period}`) // Your performance endpoint
      ]);

      // Handle overview data
      if (overviewData.status === 'fulfilled' && overviewData.value) {
        setAnalyticsData(prev => ({ ...prev, overview: overviewData.value }));
      }

      // Handle issues data
      if (issuesResponse.status === 'fulfilled' && issuesResponse.value) {
        const issues = issuesResponse.value.issues || issuesResponse.value.data || [];
        setIssuesData(issues);
        generateLocalAnalytics(issues);
      }

      // Handle trends data
      if (trendsData.status === 'fulfilled' && trendsData.value) {
        setAnalyticsData(prev => ({ ...prev, trends: trendsData.value }));
      }

      // Handle performance data
      if (performanceData.status === 'fulfilled' && performanceData.value) {
        setAnalyticsData(prev => ({ ...prev, performance: performanceData.value }));
      }

    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateLocalAnalytics = (issues) => {
    if (!issues || issues.length === 0) return;

    // Generate status distribution based on your backend status values
    const statusCounts = issues.reduce((acc, issue) => {
      const status = issue.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Generate category distribution based on your backend categories
    const categoryCounts = issues.reduce((acc, issue) => {
      const category = issue.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Calculate priority distribution
    const priorityCounts = issues.reduce((acc, issue) => {
      const priority = issue.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    // Generate time-based data
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const timeBasedData = issues
      .filter(issue => new Date(issue.created_at) >= thirtyDaysAgo)
      .reduce((acc, issue) => {
        const date = new Date(issue.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

    setAnalyticsData(prev => ({
      ...prev,
      localAnalytics: {
        statusDistribution: statusCounts,
        categoryDistribution: categoryCounts,
        priorityDistribution: priorityCounts,
        timeBasedDistribution: timeBasedData,
        totalIssues: issues.length,
        recentIssues: issues.filter(issue => 
          new Date(issue.created_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        ).length
      }
    }));
  };

  const exportData = () => {
    if (!analyticsData.localAnalytics && !issuesData.length) {
      alert('No data available to export');
      return;
    }

    let csvContent = 'Type,Count,Label,Date\n';
    
    if (analyticsData.localAnalytics) {
      const { statusDistribution, categoryDistribution, priorityDistribution } = analyticsData.localAnalytics;
      
      // Status data
      Object.entries(statusDistribution || {}).forEach(([status, count]) => {
        csvContent += `Status,${count},${status},${new Date().toISOString()}\n`;
      });
      
      // Category data
      Object.entries(categoryDistribution || {}).forEach(([category, count]) => {
        csvContent += `Category,${count},${category},${new Date().toISOString()}\n`;
      });
      
      // Priority data
      Object.entries(priorityDistribution || {}).forEach(([priority, count]) => {
        csvContent += `Priority,${count},${priority},${new Date().toISOString()}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatCard = (title, value, Icon, color = 'blue') => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600'
    };

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDistributionChart = (title, data, type = 'bar') => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-500 text-center py-8">No data available</p>
        </div>
      );
    }

    const entries = Object.entries(data).slice(0, 10);
    const maxValue = Math.max(...entries.map(([, value]) => value));

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {entries.map(([label, value], index) => (
            <div key={label} className="flex items-center">
              <div className="w-24 text-sm text-gray-600 truncate capitalize">{label}</div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      index % 4 === 0 ? 'bg-blue-500' :
                      index % 4 === 1 ? 'bg-green-500' :
                      index % 4 === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${(value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-12 text-sm font-medium text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Analytics & Reports" />
        <PageLoader text="Loading analytics data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Analytics & Reports" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState
            title="Failed to load analytics"
            message={error}
            onRetry={fetchAnalyticsData}
          />
        </div>
      </div>
    );
  }

  const { overview, localAnalytics } = analyticsData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Analytics & Reports" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Analytics Controls
            </h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAnalyticsData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportData}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            
            {(currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.SUPERVISOR) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  <option value="Road Department">Road Department</option>
                  <option value="Electricity Department">Electricity Department</option>
                  <option value="Sanitary Department">Sanitary Department</option>
                  <option value="Public Service">Public Service</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {renderStatCard(
            'Total Issues',
            localAnalytics?.totalIssues || overview?.issue_stats?.total_issues || 0,
            FileText,
            'blue'
          )}
          {renderStatCard(
            'Recent Issues',
            localAnalytics?.recentIssues || 0,
            TrendingUp,
            'green'
          )}
          {renderStatCard(
            'Pending Issues',
            localAnalytics?.statusDistribution?.pending || overview?.issue_stats?.pending_issues || 0,
            BarChart3,
            'yellow'
          )}
          {renderStatCard(
            'Resolved Issues',
            localAnalytics?.statusDistribution?.resolved || overview?.issue_stats?.resolved_issues || 0,
            PieChart,
            'green'
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {renderDistributionChart(
            'Issues by Status',
            localAnalytics?.statusDistribution
          )}
          
          {renderDistributionChart(
            'Issues by Category',
            localAnalytics?.categoryDistribution
          )}
          
          {renderDistributionChart(
            'Issues by Priority',
            localAnalytics?.priorityDistribution
          )}
          
          {renderDistributionChart(
            'Recent Activity (Last 30 Days)',
            localAnalytics?.timeBasedDistribution
          )}
        </div>

        {/* Recent Issues Table */}
        {issuesData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Issues</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {issuesData.slice(0, 10).map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {issue.title || `Issue #${issue.id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {issue.category || 'other'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          issue.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          issue.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {issue.priority || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!issuesData.length && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">
              No analytics data is currently available. This could be because:
            </p>
            <ul className="text-gray-600 mt-2 space-y-1">
              <li>• No issues have been created yet</li>
              <li>• You don't have permission to view this data</li>
              <li>• The backend analytics service is not available</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;