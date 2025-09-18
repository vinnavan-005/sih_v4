import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

export const useIssues = () => {
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch issues from backend
  const fetchIssues = async (filters = {}) => {
    if (!currentUser) return { issues: [], pagination: null };
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.issues.list(filters);
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

  // Create new issue
  const createIssue = async (issueData) => {
    try {
      const data = await apiService.issues.create(issueData);
      await fetchIssues(); // Refresh list
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Create issue with image
  const createIssueWithImage = async (formData) => {
    try {
      const data = await apiService.issues.createWithImage(formData);
      await fetchIssues(); // Refresh list
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update issue
  const updateIssue = async (issueId, updateData) => {
    try {
      const data = await apiService.issues.update(issueId, updateData);
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

  // Get single issue
  const getIssue = async (issueId) => {
    try {
      return await apiService.issues.getById(issueId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Vote on issue
  const voteIssue = async (issueId) => {
    try {
      await apiService.issues.vote(issueId);
      await fetchIssues(); // Refresh to get updated vote count
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Remove vote from issue
  const removeVote = async (issueId) => {
    try {
      await apiService.issues.removeVote(issueId);
      await fetchIssues(); // Refresh to get updated vote count
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Search issues
  const searchIssues = async (searchParams) => {
    setLoading(true);
    try {
      const data = await apiService.issues.search(searchParams);
      setIssues(data.issues || []);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get issue statistics
  const getIssueStats = async () => {
    try {
      return await apiService.issues.getStats();
    } catch (err) {
      console.error('Failed to fetch issue stats:', err);
      return null;
    }
  };

  // Upload image
  const uploadImage = async (formData) => {
    try {
      return await apiService.issues.uploadImage(formData);
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
  };
};

export default useIssues;