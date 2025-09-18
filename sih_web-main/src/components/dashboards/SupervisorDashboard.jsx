import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  MapPin, 
  CheckCircle, 
  Clock, 
  Play, 
  AlertTriangle, 
  Camera, 
  X, 
  Send, 
  RefreshCw,
  FileText,
  LogOut
} from 'lucide-react';
import apiService from '../../services/api';

const SupervisorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [currentIssueId, setCurrentIssueId] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get assignments for current user (supervisor/field staff)
      const response = await apiService.getMyAssignments();
      
      if (response.success && response.assignments) {
        // Transform assignments to include issue details
        const assignmentsWithDetails = await Promise.all(
          response.assignments.map(async (assignment) => {
            try {
              const issueResponse = await apiService.getIssue(assignment.issue_id);
              return {
                id: assignment.id,
                issue_id: assignment.issue_id,
                title: assignment.issue_title || issueResponse.title,
                description: issueResponse.description || 'No description available',
                status: assignment.status,
                location: formatLocation(issueResponse),
                assigned_at: assignment.assigned_at,
                notes: assignment.notes,
                category: issueResponse.category,
                latitude: issueResponse.latitude,
                longitude: issueResponse.longitude,
                photos: [] // Will be populated if issue has image_url
              };
            } catch (err) {
              console.error(`Error fetching issue ${assignment.issue_id}:`, err);
              return {
                id: assignment.id,
                issue_id: assignment.issue_id,
                title: assignment.issue_title || `Issue #${assignment.issue_id}`,
                description: 'Could not load issue details',
                status: assignment.status,
                location: 'Location unavailable',
                assigned_at: assignment.assigned_at,
                notes: assignment.notes,
                photos: []
              };
            }
          })
        );
        
        setAssignedIssues(assignmentsWithDetails);
      } else {
        // If no assignments or error, use empty array
        setAssignedIssues([]);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
      setAssignedIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAssignments();
      
      // Auto-refresh every 3 minutes
      const interval = setInterval(fetchAssignments, 3 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Camera functions
  const startCamera = async (issueId) => {
    setCurrentIssueId(issueId);
    setShowCamera(true);
    setCapturedPhoto(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (canvas && video) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const photoDataURL = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataURL);
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCapturedPhoto(null);
    setCurrentIssueId(null);
  };

  const submitWithPhoto = async () => {
    if (!capturedPhoto || !currentIssueId) return;

    setActionLoading(currentIssueId);
    try {
      // First upload the photo
      const blob = await fetch(capturedPhoto).then(r => r.blob());
      const file = new File([blob], 'resolution-photo.jpg', { type: 'image/jpeg' });
      
      let imageUrl = null;
      try {
        const uploadResponse = await apiService.uploadImage(file, true);
        if (uploadResponse.success) {
          imageUrl = uploadResponse.file_url;
        }
      } catch (uploadErr) {
        console.error('Photo upload failed:', uploadErr);
        // Continue without photo if upload fails
      }

      // Update the issue status to resolved
      const updateData = { status: 'resolved' };
      if (imageUrl) {
        updateData.image_url = imageUrl;
      }

      const issueUpdateResult = await apiService.updateIssue(currentIssueId, updateData);

      // Also update the assignment status to completed
      const assignment = assignedIssues.find(a => a.issue_id === currentIssueId);
      if (assignment) {
        await apiService.updateAssignment(assignment.id, { status: 'completed' });
      }

      // Create an update entry
      await apiService.createUpdate({
        issue_id: currentIssueId,
        update_text: `Issue resolved by ${currentUser.fullname}. ${imageUrl ? 'Resolution photo attached.' : 'Completed on-site.'}`
      });

      if (issueUpdateResult.success || issueUpdateResult.id) {
        alert('Issue marked as resolved successfully!');
        fetchAssignments(); // Refresh data
        closeCamera();
      } else {
        alert('Failed to update issue status');
      }
    } catch (err) {
      console.error('Resolution error:', err);
      alert('Failed to resolve issue: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (issueId, assignmentId, newStatus) => {
    if (newStatus === 'Resolved') {
      // Open camera for photo capture before resolving
      startCamera(issueId);
      return;
    }

    setActionLoading(issueId);
    try {
      const backendStatus = {
        'On-Site': 'assigned',
        'In Progress': 'in_progress'
      }[newStatus];

      // Update assignment status
      const result = await apiService.updateAssignment(assignmentId, {
        status: backendStatus
      });

      // Also update issue status
      await apiService.updateIssue(issueId, {
        status: backendStatus === 'assigned' ? 'in_progress' : backendStatus
      });

      // Create update entry
      await apiService.createUpdate({
        issue_id: issueId,
        update_text: `Status updated to "${newStatus}" by ${currentUser.fullname}`
      });

      if (result.success || result.id) {
        alert(`Status updated to ${newStatus}!`);
        fetchAssignments(); // Refresh data
      } else {
        alert('Status update failed');
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('Status update failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const formatLocation = (issue) => {
    if (issue?.latitude && issue?.longitude) {
      return `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`;
    }
    return 'Location not specified';
  };

  // Calculate stats
  const stats = {
    assigned: assignedIssues.length,
    resolved: assignedIssues.filter(i => i.status === 'completed').length,
    pending: assignedIssues.filter(i => i.status !== 'completed').length
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <LoadingSpinner size="large" text="Loading your assignments..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load assignments</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAssignments}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Capture Resolution Photo</h3>
              <button onClick={closeCamera} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {!capturedPhoto ? (
              <div className="space-y-4">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                </div>
                <button
                  onClick={capturePhoto}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Photo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setCapturedPhoto(null)}
                    className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={submitWithPhoto}
                    disabled={actionLoading === currentIssueId}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {actionLoading === currentIssueId ? 'Submitting...' : 'Submit & Resolve'}
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-white rounded-xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="mr-3">👷</span>
            Field Supervisor Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Welcome, {currentUser?.fullname}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchAssignments}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Assigned"
          value={stats.assigned}
          icon={FileText}
          color="border-t-blue-500"
          bgColor="bg-white"
        />
        <StatCard
          title="Completed"
          value={stats.resolved}
          icon={CheckCircle}
          color="border-t-green-500"
          bgColor="bg-white"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={AlertTriangle}
          color="border-t-orange-500"
          bgColor="bg-white"
        />
      </section>

      {/* Assigned Issues */}
      <section className="bg-white rounded-xl shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📌</span>
            My Assigned Issues ({assignedIssues.length})
          </h3>
        </div>

        <div className="p-6">
          {assignedIssues.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No issues assigned to you</p>
              <p className="text-sm text-gray-500 mt-2">
                Check back later or contact your department staff for new assignments
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {assignedIssues.map((issue) => (
                <div key={issue.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{issue.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          issue.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : issue.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.status?.replace('_', ' ')}
                        </span>
                        {issue.category && (
                          <span className="ml-2 text-gray-500">• {issue.category}</span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      Assigned: {new Date(issue.assigned_at).toLocaleDateString()}
                    </span>
                  </div>

                  {issue.description && (
                    <p className="text-gray-700 mb-4">{issue.description}</p>
                  )}

                  {issue.location && (
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <MapPin className="h-4 w-4 mr-2" />
                      {issue.location}
                    </div>
                  )}

                  {issue.notes && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Notes:</strong> {issue.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {issue.status !== 'completed' && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => handleUpdateStatus(issue.issue_id, issue.id, 'On-Site')}
                        disabled={actionLoading === issue.issue_id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors inline-flex items-center disabled:opacity-50"
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        {actionLoading === issue.issue_id ? 'Updating...' : 'Mark On-Site'}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(issue.issue_id, issue.id, 'In Progress')}
                        disabled={actionLoading === issue.issue_id}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors inline-flex items-center disabled:opacity-50"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {actionLoading === issue.issue_id ? 'Updating...' : 'In Progress'}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(issue.issue_id, issue.id, 'Resolved')}
                        disabled={actionLoading === issue.issue_id}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors inline-flex items-center disabled:opacity-50"
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        {actionLoading === issue.issue_id ? 'Processing...' : 'Complete with Photo'}
                      </button>
                    </div>
                  )}

                  {/* Status indicator for completed issues */}
                  {issue.status === 'completed' && (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Issue completed successfully
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Map Section Placeholder */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🗺️</span>
          Issue Locations
        </h3>
        <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-600 font-medium">
          [Map integration will show locations of assigned issues]
          {assignedIssues.length > 0 && (
            <div className="text-center">
              <p>You have {assignedIssues.length} assigned issue{assignedIssues.length !== 1 ? 's' : ''}</p>
              <p className="text-sm mt-1">
                {assignedIssues.filter(i => i.latitude && i.longitude).length} with location data
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SupervisorDashboard;