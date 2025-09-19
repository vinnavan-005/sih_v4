import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import Header from '../common/Header';
import { PageLoader, ErrorState } from '../common/LoadingSpinner';
import { Download, FileText, Map, TrendingUp, Filter, RefreshCw, BarChart3, PieChart, Calendar, Users } from 'lucide-react';
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

      // Fetch available data from working endpoints
      const [overviewData, issuesResponse] = await Promise.allSettled([
        apiService.dashboard.getOverview(),
        apiService.issues.list({ per_page: 100 }) // Get more data for analysis
      ]);

      // Handle overview data (with fallback)
      if (overviewData.status === 'fulfilled') {
        setAnalyticsData(prev => ({ ...prev, overview: overviewData.value }));
      }

      // Handle issues data for local analytics
      if (issuesResponse.status === 'fulfilled') {
        const issues = issuesResponse.value?.issues || issuesResponse.value?.data || [];
        setIssuesData(issues);
        
        // Generate local analytics from issues data
        generateLocalAnalytics(issues);
      }

      // Try to fetch additional analytics if available
      try {
        const trendsData = await apiService.analytics.getTrends({ period });
        setAnalyticsData(prev => ({ ...prev, trends: trendsData }));
      } catch (err) {
        console.log('Trends endpoint not available, using local data');
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

    // Generate status distribution
    const statusCounts = issues.reduce((acc, issue) => {
      const status = issue.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Generate category distribution
    const categoryCounts = issues.reduce((acc, issue) => {
      const category = issue.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Generate department distribution (if user can see all departments)
    const departmentCounts = issues.reduce((acc, issue) => {
      if (issue.department) {
        acc[issue.department] = (acc[issue.department] || 0) + 1;
      }
      return acc;
    }, {});

    // Generate time-based data (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const timeBasedData = issues
      .filter(issue => new Date(issue.created_at) >= thirtyDaysAgo)
      .reduce((acc, issue) => {
        const date = new Date(issue.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

    setAnalyticsData(prev => ({
      ...prev,
      localAnalytics: {
        statusDistribution: statusCounts,
        categoryDistribution: categoryCounts,
        departmentDistribution: departmentCounts,
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

    let csvContent = 'Type,Count,Label,Department\n';
    
    // Add local analytics data
    if (analyticsData.localAnalytics) {
      const { statusDistribution, categoryDistribution, departmentDistribution } = analyticsData.localAnalytics;
      
      // Status data
      Object.entries(statusDistribution || {}).forEach(([status, count]) => {
        csvContent += `Status,${count},${status},All\n`;
      });
      
      // Category data
      Object.entries(categoryDistribution || {}).forEach(([category, count]) => {
        csvContent += `Category,${count},${category},All\n`;
      });
      
      // Department data (if available)
      Object.entries(departmentDistribution || {}).forEach(([dept, count]) => {
        csvContent += `Department,${count},${dept},${dept}\n`;
      });
    }

    // Create and download file
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
            <p className="text-2xl font-bold text-gray-900">{value}</p>
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

    const entries = Object.entries(data).slice(0, 10); // Limit to top 10
    const maxValue = Math.max(...entries.map(([, value]) => value));

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {entries.map(([label, value], index) => (
            <div key={label} className="flex items-center">
              <div className="w-24 text-sm text-gray-600 truncate">{label}</div>
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
            
            {currentUser?.role === ROLES.ADMIN && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  <option value="roads">Roads & Infrastructure</option>
                  <option value="water">Water & Sanitation</option>
                  <option value="waste">Waste Management</option>
                  <option value="electricity">Electricity</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {renderStatCard(
            'Total Issues',
            localAnalytics?.totalIssues || overview?.totalIssues || 0,
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
            'Open Issues',
            localAnalytics?.statusDistribution?.open || overview?.openIssues || 0,
            BarChart3,
            'yellow'
          )}
          {renderStatCard(
            'Resolved Issues',
            localAnalytics?.statusDistribution?.resolved || overview?.resolvedIssues || 0,
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
          
          {currentUser?.role === ROLES.ADMIN && renderDistributionChart(
            'Issues by Department',
            localAnalytics?.departmentDistribution
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
                          issue.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.category || 'Other'}
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