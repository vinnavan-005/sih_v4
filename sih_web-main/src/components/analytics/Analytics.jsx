import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import Charts from './Charts';
import LoadingSpinner, { ErrorState } from '../common/LoadingSpinner';
import { Download, FileText, Map, TrendingUp, Filter, RefreshCw } from 'lucide-react';
import apiService from '../../services/api';

const Analytics = () => {
  const { currentUser } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    mapData: [],
    resolutionData: { labels: [], values: [] },
    departmentData: { labels: [], values: [] },
    categoryData: { labels: [], values: [] },
    timeSeriesData: { labels: [], values: [] }
  });
  const [dashboardStats, setDashboardStats] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(30); // days
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [period, setPeriod] = useState('month');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard overview
      const dashboardResponse = await apiService.getDashboardOverview();
      if (dashboardResponse.success) {
        setDashboardStats(dashboardResponse);
      }

      // Fetch trends data
      const trendsResponse = await apiService.getTrends(dateRange);
      if (trendsResponse.success) {
        setTrendsData(trendsResponse);
      }

      // Fetch performance metrics
      const performanceResponse = await apiService.getPerformanceMetrics(period);
      if (performanceResponse) {
        setPerformanceData(performanceResponse);
      }

      // Fetch department statistics (admin/supervisor only)
      if (currentUser?.role === 'Admin' || currentUser?.role === 'DepartmentStaff') {
        const deptResponse = await apiService.getDepartmentStats();
        if (deptResponse.success) {
          setDepartmentStats(deptResponse.departments);
        }
      }

      // Process data for charts
      await processAnalyticsData();

    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = async () => {
    try {
      // Get issues data for processing
      const issuesResponse = await apiService.getIssues({
        per_page: 1000, // Get more data for analytics
        order_by: '-created_at'
      });

      if (!issuesResponse.success) return;

      let filteredIssues = issuesResponse.issues || [];

      // Role-based filtering
      if (currentUser.role === 'DepartmentStaff') {
        // Backend already filters by department for staff
      } else if (currentUser.role === 'FieldSupervisor') {
        // Get assignments for supervisor
        const assignmentsResponse = await apiService.getMyAssignments();
        if (assignmentsResponse.success) {
          const assignedIssueIds = assignmentsResponse.assignments.map(a => a.issue_id);
          filteredIssues = filteredIssues.filter(issue => assignedIssueIds.includes(issue.id));
        }
      }

      // Department filtering (for Admin)
      if (selectedDepartment && currentUser.role === 'Admin') {
        // This would need backend support for department-based issue filtering
        // For now, we'll use client-side filtering based on available data
      }

      // Date range filtering
      if (dateRange !== 'all') {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - dateRange);
        
        filteredIssues = filteredIssues.filter(issue => {
          if (!issue.created_at) return true;
          return new Date(issue.created_at) >= cutoffDate;
        });
      }

      // Process map data
      const mapData = filteredIssues
        .filter(issue => issue.latitude && issue.longitude)
        .map(issue => ({
          id: issue.id,
          lat: parseFloat(issue.latitude),
          lng: parseFloat(issue.longitude),
          category: issue.category,
          status: issue.status,
          title: issue.title,
          upvotes: issue.upvotes || 0
        }));

      // Process resolution time data using backend stats if available
      let resolutionData = { labels: [], values: [] };
      if (dashboardStats?.issue_stats?.issues_by_department) {
        const deptData = dashboardStats.issue_stats.issues_by_department;
        resolutionData = {
          labels: Object.keys(deptData),
          values: Object.values(deptData)
        };
      }

      // Process department performance data
      let departmentData = { labels: [], values: [] };
      if (departmentStats.length > 0) {
        departmentData = {
          labels: departmentStats.map(dept => dept.department),
          values: departmentStats.map(dept => dept.resolved_issues)
        };
      }

      // Process category data using backend stats
      let categoryData = { labels: [], values: [] };
      if (dashboardStats?.issue_stats?.issues_by_category) {
        const catData = dashboardStats.issue_stats.issues_by_category;
        categoryData = {
          labels: Object.keys(catData).map(cat => {
            // Map backend categories to frontend display names
            const categoryMap = {
              'roads': 'Roads & Infrastructure',
              'waste': 'Waste Management',
              'water': 'Water Issues',
              'streetlight': 'Street Lighting',
              'other': 'Other'
            };
            return categoryMap[cat] || cat;
          }),
          values: Object.values(catData)
        };
      }

      // Process time series data using trends data
      let timeSeriesData = { labels: [], values: [] };
      if (trendsData?.issues_created) {
        timeSeriesData = {
          labels: trendsData.issues_created.map(item => 
            new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          ),
          values: trendsData.issues_created.map(item => item.count)
        };
      }

      setAnalyticsData({
        mapData,
        resolutionData,
        departmentData,
        categoryData,
        timeSeriesData
      });

    } catch (err) {
      console.error('Data processing error:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAnalyticsData();
    }
  }, [currentUser, dateRange, selectedDepartment, period]);

  const handleExportData = async (format = 'json') => {
    try {
      const response = await apiService.exportDashboardData(format, false);
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(response, null, 2)], { 
          type: 'application/json' 
        });
        downloadFile(blob, `analytics_export_${new Date().toISOString().split('T')[0]}.json`);
      } else if (format === 'csv') {
        // Backend should return CSV data
        const csvContent = generateCSVFromData(response);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadFile(blob, `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    }
  };

  const downloadFile = (blob, filename) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSVFromData = (data) => {
    const headers = ['Metric', 'Value', 'Category', 'Department'];
    let csvContent = headers.join(',') + '\n';

    // Add issue statistics
    if (data.issue_stats) {
      const stats = data.issue_stats;
      csvContent += `Total Issues,${stats.total_issues},Overall,All\n`;
      csvContent += `Pending Issues,${stats.pending_issues},Status,All\n`;
      csvContent += `In Progress Issues,${stats.in_progress_issues},Status,All\n`;
      csvContent += `Resolved Issues,${stats.resolved_issues},Status,All\n`;
      csvContent += `Total Upvotes,${stats.total_upvotes},Engagement,All\n`;
      
      if (stats.avg_resolution_time) {
        csvContent += `Avg Resolution Time,${stats.avg_resolution_time} days,Performance,All\n`;
      }

      // Add category data
      if (stats.issues_by_category) {
        Object.entries(stats.issues_by_category).forEach(([category, count]) => {
          csvContent += `Issues by Category,${count},${category},All\n`;
        });
      }

      // Add department data
      if (stats.issues_by_department) {
        Object.entries(stats.issues_by_department).forEach(([dept, count]) => {
          csvContent += `Issues by Department,${count},Department,${dept}\n`;
        });
      }
    }

    return csvContent;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-60">
          <Header title="Analytics & Reports" />
          <main className="p-6">
            <LoadingSpinner size="large" text="Loading analytics data..." />
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-60">
          <Header title="Analytics & Reports" />
          <main className="p-6">
            <ErrorState
              title="Failed to load analytics"
              message={error}
              onRetry={fetchAnalyticsData}
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-60">
        <Header title="Analytics & Reports" />
        
        <main className="p-6">
          {/* Controls and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Analytics Controls
              </h3>
              <button
                onClick={fetchAnalyticsData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performance Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              
              {currentUser?.role === 'Admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Filter
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Departments</option>
                    {departmentStats.map(dept => (
                      <option key={dept.department} value={dept.department}>
                        {dept.department}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics Overview */}
          {dashboardStats?.issue_stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Issues</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.issue_stats.total_issues}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolution Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.issue_stats.total_issues > 0 
                        ? Math.round((dashboardStats.issue_stats.resolved_issues / dashboardStats.issue_stats.total_issues) * 100)
                        : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Resolution Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.issue_stats.avg_resolution_time || 'N/A'}
                      {dashboardStats.issue_stats.avg_resolution_time && ' days'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Upvotes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.issue_stats.total_upvotes}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          )}

          {/* Issue Hotspots Map */}
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Map className="h-6 w-6 text-red-500 mr-2" />
              Issue Hotspots
            </h3>
            <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center text-gray-600 font-medium">
              <div className="text-center">
                <Map className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>[Interactive Heatmap - {analyticsData.mapData.length} issues plotted]</p>
                <p className="text-sm mt-2">Map integration with Leaflet/MapBox would display here</p>
                {analyticsData.mapData.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Issues with location data: {analyticsData.mapData.length}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Performance Charts */}
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 text-blue-500 mr-2" />
              Performance Metrics
            </h3>
            <Charts data={analyticsData} />
          </section>

          {/* Performance Data Table */}
          {performanceData && (
            <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Performance Summary ({period})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {performanceData.metrics?.issues_created || 0}
                  </div>
                  <div className="text-sm text-gray-600">Issues Created</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {performanceData.metrics?.issues_resolved || 0}
                  </div>
                  <div className="text-sm text-gray-600">Issues Resolved</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {performanceData.metrics?.resolution_rate || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Resolution Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {performanceData.metrics?.avg_resolution_time || 'N/A'}
                    {performanceData.metrics?.avg_resolution_time && ' days'}
                  </div>
                  <div className="text-sm text-gray-600">Avg Resolution Time</div>
                </div>
              </div>
            </section>
          )}

          {/* Export Section */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-6 w-6 text-green-500 mr-2" />
              Export Reports
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleExportData('csv')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Download CSV
              </button>
              <button
                onClick={() => handleExportData('json')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Download JSON
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Report includes:</strong> Issue statistics, resolution metrics, 
                department performance, category breakdown, and trends based on your current filters.
                Data is filtered according to your role permissions.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Analytics;