import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

export const useIssues = () => {
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch issues from backend - UPDATED to use new API structure
  const fetchIssues = async (filters = {}) => {
    if (!currentUser) return { issues: [], pagination: null };
    
    setLoading(true);
    setError(null);
    
    try {
      // Changed from apiService.issues.list() to apiService.getIssues()
      const data = await apiService.getIssues(filters);
      setIssues(data.issues || []);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch issues:', err);
      return { issues: [], pagination: null };
    } finally {
      setLoading(false);
    }
  };

  // Create new issue - UPDATED
  const createIssue = async (issueData) => {
    try {
      // Changed from apiService.issues.create() to apiService.createIssue()
      const data = await apiService.createIssue(issueData);
      await fetchIssues(); // Refresh list
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Create issue with image - UPDATED
  const createIssueWithImage = async (formData) => {
    try {
      // This method doesn't exist in new API, using regular createIssue
      // You may need to handle image upload separately
      const data = await apiService.createIssue(formData);
      await fetchIssues(); // Refresh list
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update issue - UPDATED
  const updateIssue = async (issueId, updateData) => {
    try {
      // Changed from apiService.issues.update() to apiService.updateIssue()
      const data = await apiService.updateIssue(issueId, updateData);
      // Update local state
      setIssues(prev => prev.map(issue => 
        issue.id === parseInt(issueId) ? data : issue
      ));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get single issue - UPDATED
  const getIssue = async (issueId) => {
    try {
      // Changed from apiService.issues.getById() to apiService.getIssue()
      return await apiService.getIssue(issueId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Vote on issue - UPDATED
  const voteIssue = async (issueId) => {
    try {
      // Changed from apiService.issues.vote() to apiService.voteOnIssue()
      await apiService.voteOnIssue(issueId, 'upvote');
      await fetchIssues(); // Refresh to get updated vote count
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Remove vote from issue - UPDATED
  const removeVote = async (issueId) => {
    try {
      // Changed from apiService.issues.removeVote() to apiService.voteOnIssue()
      await apiService.voteOnIssue(issueId, 'downvote');
      await fetchIssues(); // Refresh to get updated vote count
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Search issues - UPDATED
  const searchIssues = async (searchParams) => {
    setLoading(true);
    try {
      // Changed from apiService.issues.search() to apiService.searchIssues()
      const data = await apiService.searchIssues(searchParams);
      setIssues(data.issues || []);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get issue statistics - UPDATED
  const getIssueStats = async () => {
    try {
      // Changed from apiService.issues.getStats() to apiService.getIssueStats()
      return await apiService.getIssueStats();
    } catch (err) {
      console.error('Failed to fetch issue stats:', err);
      return null;
    }
  };

  // Upload image - UPDATED
  const uploadImage = async (formData) => {
    try {
      // Changed from apiService.issues.uploadImage() to apiService.uploadImage()
      return await apiService.uploadImage(formData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get nearby issues - NEW method added
  const getNearbyIssues = async (params = {}) => {
    try {
      return await apiService.getNearbyIssues(params);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete issue - NEW method added  
  const deleteIssue = async (issueId) => {
    try {
      const data = await apiService.deleteIssue(issueId);
      // Remove from local state
      setIssues(prev => prev.filter(issue => issue.id !== parseInt(issueId)));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (currentUser) {
      fetchIssues();
    }
  }, [currentUser]);

  return {
    issues,
    loading,
    error,
    fetchIssues,
    createIssue,
    createIssueWithImage,
    updateIssue,
    getIssue,
    voteIssue,
    removeVote,
    searchIssues,
    getIssueStats,
    uploadImage,
    getNearbyIssues,
    deleteIssue,
  };
};

export default useIssues;