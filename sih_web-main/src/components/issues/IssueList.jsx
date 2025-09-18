import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { useIssues } from '../../hooks/useIssues';
import Header from '../common/Header';
import IssueFilters from './IssueFilters';
import { Eye, UserPlus, RefreshCw, CheckSquare, Square, ThumbsUp } from 'lucide-react';

const IssueList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { issues, loading, fetchIssues, voteIssue, removeVote } = useIssues();
  
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    department: ''
  });

  // Fetch issues with filters
  useEffect(() => {
    const loadIssues = async () => {
      const data = await fetchIssues({
        ...filters,
        page: currentPage,
        per_page: 20
      });
      if (data?.pagination) {
        setPagination(data.pagination);
      }
    };

    if (currentUser) {
      loadIssues();
    }
  }, [currentUser, filters, currentPage, fetchIssues]);

  const handleViewIssue = (issueId) => {
    navigate(`/issue-details/${issueId}`);
  };

  const handleAssignIssue = async (issueId) => {
    if (!canAssignIssues()) {
      alert('You are not allowed to assign issues.');
      return;
    }

    const staffId = prompt('Enter Staff ID or Email to assign:');
    if (staffId && staffId.trim()) {
      try {
        // Use assignments API
        const response = await fetch('/api/assignments/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`,
          },
          body: JSON.stringify({
            issue_id: parseInt(issueId),
            staff_id: staffId.trim(),
            notes: 'Assigned via issue list'
          }),
        });

        if (response.ok) {
          alert('Issue assigned successfully');
          fetchIssues({ ...filters, page: currentPage });
        } else {
          const error = await response.json();
          alert(`Failed to assign issue: ${error.detail}`);
        }
      } catch (error) {
        alert('Failed to assign issue: ' + error.message);
      }
    }
  };

  const handleChangeStatus = async (issueId, currentStatus) => {
    const statusOptions = ['pending', 'in_progress', 'resolved'];
    const newStatus = prompt(
      `Current status: ${currentStatus}\nEnter new status (pending/in_progress/resolved):`
    );
    
    if (newStatus && statusOptions.includes(newStatus)) {
      try {
        const response = await fetch(`/api/issues/${issueId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`,
          },
          body: JSON.stringify({
            status: newStatus
          }),
        });

        if (response.ok) {
          alert('Status updated successfully');
          fetchIssues({ ...filters, page: currentPage });
        } else {
          const error = await response.json();
          alert(`Failed to update status: ${error.detail}`);
        }
      } catch (error) {
        alert('Failed to update status: ' + error.message);
      }
    }
  };

  const handleVote = async (issueId, hasVoted) => {
    try {
      if (hasVoted) {
        await removeVote(issueId);
      } else {
        await voteIssue(issueId);
      }
    } catch (error) {
      alert('Failed to update vote: ' + error.message);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIssues(issues.map(i => i.id));
    } else {
      setSelectedIssues([]);
    }
  };

  const handleSelectIssue = (issueId, checked) => {
    if (checked) {
      setSelectedIssues([...selectedIssues, issueId]);
    } else {
      setSelectedIssues(selectedIssues.filter(id => id !== issueId));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedIssues.length === 0) {
      alert('No issues selected.');
      return;
    }

    if (!canAssignIssues()) {
      alert('You are not allowed to bulk assign.');
      return;
    }

    const staffId = prompt('Enter Staff ID for bulk assignment:');
    if (staffId && staffId.trim()) {
      try {
        const response = await fetch('/api/assignments/bulk-assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`,
          },
          body: JSON.stringify({
            issue_ids: selectedIssues,
            staff_id: staffId.trim(),
            notes: 'Bulk assigned via issue list'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Bulk assignment completed: ${result.processed} successful, ${result.failed} failed`);
          if (result.errors.length > 0) {
            console.log('Assignment errors:', result.errors);
          }
          setSelectedIssues([]);
          fetchIssues({ ...filters, page: currentPage });
        } else {
          const error = await response.json();
          alert(`Failed to bulk assign: ${error.detail}`);
        }
      } catch (error) {
        alert('Failed to bulk assign: ' + error.message);
      }
    }
  };

  const canAssignIssues = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  };

  const canUpdateStatus = () => {
    return currentUser?.role === 'admin' || 
           currentUser?.role === 'supervisor' || 
           currentUser?.role === 'staff';
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Issue Management" />
      
      <main className="p-6">
        {/* Filters */}
        <IssueFilters 
          filters={filters} 
          onFiltersChange={setFilters}
          currentUser={currentUser}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading issues...</span>
          </div>
        )}

        {/* Issue Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  {canAssignIssues() && (
                    <th className="px-6 py-3 text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedIssues.length === issues.length && issues.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Votes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!loading && issues.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      No issues found
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      {canAssignIssues() && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIssues.includes(issue.id)}
                            onChange={(e) => handleSelectIssue(issue.id, e.target.checked)}
                            className="rounded"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{issue.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {issue.title || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(issue.priority)}`}>
                          {issue.priority || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{issue.upvotes || 0}</span>
                          {currentUser?.role === 'citizen' && (
                            <button
                              onClick={() => handleVote(issue.id, issue.user_has_voted)}
                              className={`p-1 rounded ${
                                issue.user_has_voted 
                                  ? 'text-blue-600 bg-blue-50' 
                                  : 'text-gray-400 hover:text-blue-600'
                              }`}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(issue.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewIssue(issue.id)}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors inline-flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          {canAssignIssues() && (
                            <button
                              onClick={() => handleAssignIssue(issue.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors inline-flex items-center"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </button>
                          )}
                          {canUpdateStatus() && (
                            <button
                              onClick={() => handleChangeStatus(issue.id, issue.status)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors inline-flex items-center"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Status
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Showing page {pagination.page} of {pagination.total_pages} 
                ({pagination.total} total issues)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.has_prev}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!pagination.has_next}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {canAssignIssues() && selectedIssues.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-sm flex space-x-4">
            <button
              onClick={handleBulkAssign}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Assign Selected ({selectedIssues.length})
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default IssueList;