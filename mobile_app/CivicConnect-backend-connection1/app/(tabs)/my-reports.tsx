import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StorageService } from '../../utils/storage';

const API_BASE_URL = 'http://192.168.1.103:8000/api';

// Updated Report interface to match backend data
interface Report {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  progress: number;
  upvotes: number;
  submittedAt: string;
  lastUpdate: string;
  useGPS: boolean;
  timestamp: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  citizen_name?: string;
  days_open?: number;
}

export default function MyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const token = await StorageService.getAuthToken();
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/issues/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform backend data to match your Report interface
        const transformedReports = data.issues.map((issue: any) => ({
          id: issue.id.toString(),
          title: issue.title,
          category: issue.category,
          location: issue.location_description || `${issue.latitude?.toFixed(4)}, ${issue.longitude?.toFixed(4)}` || 'Location not specified',
          description: issue.description,
          status: issue.status,
          progress: getProgressFromStatus(issue.status),
          upvotes: issue.upvotes,
          submittedAt: issue.created_at,
          lastUpdate: issue.updated_at,
          useGPS: !!(issue.latitude && issue.longitude),
          timestamp: issue.created_at,
          image_url: issue.image_url,
          latitude: issue.latitude,
          longitude: issue.longitude,
          citizen_name: issue.citizen_name,
          days_open: issue.days_open || 0
        }));
        setReports(transformedReports);
      } else {
        console.error('Failed to fetch reports');
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert status to progress percentage
  const getProgressFromStatus = (status: string) => {
    switch (status) {
      case 'pending': return 25;
      case 'in-progress': return 60;
      case 'resolved': return 100;
      default: return 0;
    }
  };

  const filteredReports = reports.filter(report => 
    filter === 'all' || report.status === filter
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#10b981';
    if (progress >= 60) return '#3b82f6';
    if (progress >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Ionicons name="time" size={16} color="#f59e0b" />,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          label: 'Pending Review'
        };
      case 'in-progress':
        return {
          icon: <Ionicons name="trending-up" size={16} color="#3b82f6" />,
          color: '#3b82f6',
          bgColor: '#dbeafe',
          label: 'In Progress'
        };
      case 'resolved':
        return {
          icon: <Ionicons name="checkmark-circle" size={16} color="#10b981" />,
          color: '#10b981',
          bgColor: '#dcfce7',
          label: 'Resolved'
        };
      default:
        return {
          icon: <Ionicons name="help-circle" size={16} color="#6b7280" />,
          color: '#6b7280',
          bgColor: '#f3f4f6',
          label: 'Unknown'
        };
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'roads': 'Roads & Infrastructure',
      'waste': 'Waste Management',
      'water': 'Water & Drainage',
      'streetlight': 'Street Lighting',
      'other': 'Other'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Reports</Text>
            <Text style={styles.subtitle}>
              Track the progress of your civic issue reports
            </Text>
          </View>
          
          {/* Filter buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {(['all', 'pending', 'in-progress', 'resolved'] as const).map((status) => (
              <Button
                key={status}
                title={status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onPress={() => setFilter(status)}
                style={styles.filterButton}
              />
            ))}
          </ScrollView>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <CardContent style={styles.summaryContent}>
              <Text style={styles.summaryNumber}>{reports.length}</Text>
              <Text style={styles.summaryLabel}>Total Reports</Text>
            </CardContent>
          </Card>
          <Card style={styles.summaryCard}>
            <CardContent style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: '#f59e0b' }]}>
                {reports.filter(r => r.status === 'pending').length}
              </Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </CardContent>
          </Card>
          <Card style={styles.summaryCard}>
            <CardContent style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: '#3b82f6' }]}>
                {reports.filter(r => r.status === 'in-progress').length}
              </Text>
              <Text style={styles.summaryLabel}>In Progress</Text>
            </CardContent>
          </Card>
          <Card style={styles.summaryCard}>
            <CardContent style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: '#10b981' }]}>
                {reports.filter(r => r.status === 'resolved').length}
              </Text>
              <Text style={styles.summaryLabel}>Resolved</Text>
            </CardContent>
          </Card>
        </View>

        {/* Reports List */}
        <View style={styles.reportsList}>
          {filteredReports.map((report) => {
            const statusConfig = getStatusConfig(report.status);
            const isExpanded = selectedReport === report.id;
            
            return (
              <Card key={report.id}>
                <TouchableOpacity
                  onPress={() => setSelectedReport(isExpanded ? null : report.id)}
                >
                  <CardHeader style={styles.reportHeader}>
                    <View style={styles.reportTitleRow}>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <TouchableOpacity style={styles.expandButton}>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#6b7280" 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.reportMeta}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{getCategoryLabel(report.category)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        {statusConfig.icon}
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressPercent}>{report.progress}%</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill,
                            { 
                              width: `${report.progress}%`,
                              backgroundColor: getProgressColor(report.progress)
                            }
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.reportFooter}>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={12} color="#6b7280" />
                        <Text style={styles.locationText}>{report.location}</Text>
                      </View>
                      <View style={styles.timeContainer}>
                        <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                        <Text style={styles.timeText}>Submitted {formatDate(report.submittedAt)}</Text>
                      </View>
                      <View style={styles.engagementContainer}>
                        <Text style={styles.upvoteText}>↑ {report.upvotes}</Text>
                        <Text style={styles.daysOpen}>{report.days_open} days open</Text>
                      </View>
                    </View>
                  </CardHeader>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <CardContent style={styles.expandedContent}>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Description</Text>
                      <Text style={styles.detailText}>{report.description}</Text>
                    </View>

                    {report.useGPS && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>GPS Location</Text>
                        <Text style={styles.detailText}>
                          Lat: {report.latitude?.toFixed(6)}, Lng: {report.longitude?.toFixed(6)}
                        </Text>
                      </View>
                    )}

                    {report.image_url && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Attached Image</Text>
                        <Text style={styles.detailText}>Image available</Text>
                      </View>
                    )}

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Last Updated</Text>
                      <Text style={styles.detailText}>{formatDate(report.lastUpdate)}</Text>
                    </View>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </View>

        {filteredReports.length === 0 && (
          <Card>
            <CardContent style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No reports found</Text>
              <Text style={styles.emptyMessage}>
                {filter === 'all' 
                  ? "You haven't submitted any reports yet." 
                  : `No ${filter.replace('-', ' ')} reports found.`}
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/(tabs)/camera-report')}
              >
                <Text style={styles.createButtonText}>Create Your First Report</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  filterContainer: {
    flexGrow: 0,
  },
  filterButton: {
    marginRight: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    marginBottom: 0,
  },
  summaryContent: {
    alignItems: 'center',
    padding: 16,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  reportsList: {
    gap: 16,
  },
  reportHeader: {
    padding: 16,
  },
  reportTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
    flex: 1,
  },
  expandButton: {
    padding: 4,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#374151',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#374151',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#030213',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  engagementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upvoteText: {
    fontSize: 12,
    color: '#6b7280',
  },
  daysOpen: {
    fontSize: 12,
    color: '#6b7280',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fafafa',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#030213',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});