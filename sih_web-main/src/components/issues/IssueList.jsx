import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import useIssues from '../../hooks/useIssues';
import Header from '../common/Header';
import { PageLoader, ErrorState, SkeletonCard } from '../common/LoadingSpinner';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Calendar, 
  User, 
  ThumbsUp, 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Grid,
  List
} from 'lucide-react';
import { ROLES } from '../../utils/constants';

const IssueList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    issues, 
    loading, 
    error, 
    fetchIssues, 
    voteIssue, 
    totalIssues,
    openIssues,
    inProgressIssues,
    resolvedIssues
  } = useIssues();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadIssues();
  }, [statusFilter, categoryFilter, departmentFilter, sortBy, sortOrder]);

  const loadIssues = async () => {
    const filters = {
      search: searchTerm,
      status: statusFilter,
      category: categoryFilter,
      department: departmentFilter,
      sort: sortBy,
      order: sortOrder,
      page: 1,
      per_page: 20
    };

    // Remove empty filters to avoid 422 errors
    Object.keys(filters).forEach(key => {
      if (!filters[key]) {
        delete filters[key];
      }
    });

    await fetchIssues(filters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadIssues();
  };

  const handleVote = async (issueId) => {
    try {
      await voteIssue(issueId);
    } catch (err) {
      console.error('Failed to vote:', err);
      alert('Failed to vote on issue');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'escalated':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'escalated':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = !searchTerm || 
      issue.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading && issues.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Issues" />
        <PageLoader text="Loading issues..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Issues" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
              <p className="text-gray-600 mt-1">
                Track and manage civic issues in your area
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadIssues}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {currentUser && (
                <button
                  onClick={() => navigate('/issue-create')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Report Issue
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-600">Total Issues</p>
                  <p className="text-xl font-bold text-blue-900">{totalIssues}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-600">Open</p>
                  <p className="text-xl font-bold text-yellow-900">{openIssues}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-600">In Progress</p>
                  <p className="text-xl font-bold text-blue-900">{inProgressIssues}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-600">Resolved</p>
                  <p className="text-xl font-bold text-green-900">{resolvedIssues}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search issues..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
              
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="roads">Roads</option>
                  <option value="water">Water</option>
                  <option value="waste">Waste</option>
                  <option value="electricity">Electricity</option>
                  <option value="safety">Safety</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="created_at">Date Created</option>
                    <option value="updated_at">Last Updated</option>
                    <option value="priority">Priority</option>
                    <option value="votes">Votes</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <ErrorState
              title="Failed to load issues"
              message={error}
              onRetry={loadIssues}
            />
          </div>
        )}

        {/* Issues Grid/List */}
        {loading && issues.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} className="h-64" />
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter || categoryFilter 
                ? 'Try adjusting your search filters'
                : 'No issues have been reported yet'
              }
            </p>
            {currentUser && !searchTerm && !statusFilter && !categoryFilter && (
              <button
                onClick={() => navigate('/issue-create')}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Report First Issue
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {issue.image_url && (
                  <div className="h-48 bg-gray-200">
                    <img
                      src={issue.image_url}
                      alt={issue.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(issue.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(issue.status)}`}>
                        {issue.status || 'open'}
                      </span>
                    </div>
                    {issue.priority && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {issue.title || `Issue #${issue.id}`}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {issue.description || 'No description provided'}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    {issue.category && (
                      <div className="flex items-center">
                        <Filter className="h-3 w-3 mr-1" />
                        {issue.category}
                      </div>
                    )}
                    
                    {issue.location && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {issue.location}
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(issue.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleVote(issue.id)}
                        className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {issue.votes || 0}
                      </button>
                      
                      <div className="flex items-center text-gray-500">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {issue.comments_count || 0}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/issue-details/${issue.id}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIssues.map((issue) => (
                    <tr 
                      key={issue.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/issue-details/${issue.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {issue.title || `Issue #${issue.id}`}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {issue.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(issue.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(issue.status)}`}>
                            {issue.status || 'open'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.category || 'Other'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {issue.location || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(issue.id);
                          }}
                          className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {issue.votes || 0}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loading more indicator */}
        {loading && issues.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-4 py-2 text-gray-600">
              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
              Loading more issues...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueList;