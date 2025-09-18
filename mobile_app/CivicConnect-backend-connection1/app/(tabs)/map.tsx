import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/input';
import { StorageService } from '../../utils/storage';

const API_BASE_URL = 'http://192.168.1.103:8000/api'; // Update with your IP

interface IssueMarker {
  id: string;
  title: string;
  category: string;
  location: string;
  distance?: number;
  upvotes: number;
  status: 'pending' | 'in-progress' | 'resolved';
  timestamp: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description?: string;
  citizen_name?: string;
  image_url?: string;
}

const categoryColors: { [key: string]: string } = {
  'roads': '#fca5a5',
  'water': '#93c5fd',
  'streetlight': '#fde68a',
  'waste': '#86efac',
  'other': '#fdba74'
};

const categoryLabels: { [key: string]: string } = {
  'roads': 'Roads & Infrastructure',
  'water': 'Water & Drainage',
  'streetlight': 'Street Lighting',
  'waste': 'Waste Management',
  'other': 'Other'
};

const categories = Object.keys(categoryColors);

export default function IssueMapScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [issues, setIssues] = useState<IssueMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.9716, // Default to Bangalore
    longitude: 77.6413,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    getCurrentLocation();
    loadAllIssues(); // Load all user's issues instead of nearby
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userCoords);
      setMapRegion({
        ...userCoords,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadAllIssues = async () => {
    try {
      setLoading(true);
      const token = await StorageService.getAuthToken();
      
      if (!token) {
        Alert.alert('Login Required', 'Please log in to view issues');
        router.replace('/(auth)/login');
        return;
      }

      // Load all user's issues (citizens see their own, others see all)
      const response = await fetch(`${API_BASE_URL}/issues/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const transformedIssues: IssueMarker[] = data.issues
          .filter((issue: any) => issue.latitude && issue.longitude) // Only issues with coordinates
          .map((issue: any) => ({
            id: issue.id.toString(),
            title: issue.title,
            category: issue.category,
            location: issue.location_description || `${issue.latitude?.toFixed(4)}, ${issue.longitude?.toFixed(4)}`,
            upvotes: issue.upvotes,
            status: issue.status,
            timestamp: formatTimestamp(issue.created_at),
            coordinates: {
              lat: issue.latitude,
              lng: issue.longitude,
            },
            description: issue.description,
            citizen_name: issue.citizen_name,
            image_url: issue.image_url,
          }));
        
        setIssues(transformedIssues);
        
        // If we have issues, center map on first issue
        if (transformedIssues.length > 0) {
          setMapRegion({
            latitude: transformedIssues[0].coordinates.lat,
            longitude: transformedIssues[0].coordinates.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      } else {
        console.error('Failed to load issues');
        setIssues([]);
      }
    } catch (error: any) {
      console.error('Error loading issues:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleUpvote = async (issueId: string) => {
    try {
      const token = await StorageService.getAuthToken();
      if (!token) {
        Alert.alert('Login Required', 'Please log in to vote on issues');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/issues/${issueId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setIssues(prevIssues => 
          prevIssues.map(issue => 
            issue.id === issueId 
              ? { ...issue, upvotes: issue.upvotes + 1 }
              : issue
          )
        );
        Alert.alert('Success', 'Vote recorded successfully');
      } else if (response.status === 400) {
        Alert.alert('Already Voted', 'You have already voted on this issue');
      } else {
        Alert.alert('Error', 'Failed to record vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to record vote');
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#dc2626';
      case 'in-progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'pending': return 'red';
      case 'in-progress': return 'orange';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Issues Map</Text>
          <Text style={styles.subtitle}>
            View all your reported issues on the map
          </Text>
        </View>

        {/* Search and Filter */}
        <Card style={{ marginBottom: 16 }}>
          <CardContent>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                <Input
                  style={styles.searchInput}
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowCategoryFilter(!showCategoryFilter)}
              >
                <Ionicons name="filter" size={16} color="#030213" />
                <Text style={styles.filterButtonText}>Filter</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            {showCategoryFilter && (
              <View style={styles.categoryFilter}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    selectedCategory === 'all' && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === 'all' && styles.categoryChipTextActive
                  ]}>
                    All Categories
                  </Text>
                </TouchableOpacity>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category && styles.categoryChipActive
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextActive
                    ]}>
                      {categoryLabels[category]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {/* Map Section */}
        <Card style={styles.mapCard}>
          <CardHeader>
            <CardTitle style={styles.mapTitle}>
              <Ionicons name="location" size={20} color="#030213" />
              <Text style={styles.mapTitleText}>Issues Map</Text>
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.mapCardContent}>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={true}
                rotateEnabled={true}
              >
                {filteredIssues.map((issue) => (
                  <Marker
                    key={issue.id}
                    coordinate={{
                      latitude: issue.coordinates.lat,
                      longitude: issue.coordinates.lng,
                    }}
                    title={issue.title}
                    description={`${categoryLabels[issue.category]} • ${issue.status} • ${issue.upvotes} upvotes`}
                    pinColor={getMarkerColor(issue.status)}
                    onPress={() => setSelectedIssue(issue.id)}
                  />
                ))}
              </MapView>

              {/* Map Legend */}
              <View style={styles.mapLegend}>
                <Text style={styles.legendTitle}>Legend</Text>
                <View style={styles.legendItems}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
                    <Text style={styles.legendText}>Pending</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.legendText}>In Progress</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.legendText}>Resolved</Text>
                  </View>
                </View>
              </View>

              {/* Refresh Button */}
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadAllIssues}
              >
                <Ionicons name="refresh" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Issues List */}
        <Card style={{ marginTop: 16 }}>
          <CardHeader>
            <CardTitle>Your Issues ({filteredIssues.length})</CardTitle>
          </CardHeader>
          <CardContent style={styles.issuesListContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading your issues...</Text>
              </View>
            ) : (
              <ScrollView style={styles.issuesList} nestedScrollEnabled>
                {filteredIssues.map((issue) => (
                  <TouchableOpacity
                    key={issue.id}
                    style={[
                      styles.issueItem,
                      selectedIssue === issue.id && styles.issueItemSelected
                    ]}
                    onPress={() => setSelectedIssue(selectedIssue === issue.id ? null : issue.id)}
                  >
                    <View style={styles.issueHeader}>
                      <View style={styles.issueTitleContainer}>
                        <Text style={styles.issueTitle}>{issue.title}</Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: categoryColors[issue.category] }
                        ]}>
                          <Text style={styles.statusText}>{categoryLabels[issue.category]}</Text>
                        </View>
                      </View>
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: getStatusColor(issue.status) }
                      ]} />
                    </View>

                    <Text style={styles.issueLocation}>
                      <Ionicons name="location-outline" size={14} color="#6b7280" />
                      {' '}{issue.location}
                    </Text>

                    <View style={styles.issueFooter}>
                      <Text style={styles.issueStatus}>
                        Status: {issue.status.replace('-', ' ').toUpperCase()}
                      </Text>
                      <TouchableOpacity 
                        style={styles.issueStats}
                        onPress={() => handleUpvote(issue.id)}
                      >
                        <Ionicons name="arrow-up" size={14} color="#10b981" />
                        <Text style={styles.upvotes}>{issue.upvotes}</Text>
                      </TouchableOpacity>
                      <Text style={styles.timestamp}>{issue.timestamp}</Text>
                    </View>

                    {selectedIssue === issue.id && (
                      <View style={styles.issueDetails}>
                        <Text style={styles.detailLabel}>Description: {issue.description}</Text>
                        {issue.image_url && (
                          <Text style={styles.detailLabel}>📷 Photo attached</Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                
                {filteredIssues.length === 0 && !loading && (
                  <View style={styles.emptyState}>
                    <Ionicons name="map-outline" size={48} color="#d1d5db" />
                    <Text style={styles.emptyTitle}>No issues found</Text>
                    <Text style={styles.emptyMessage}>
                      {searchTerm || selectedCategory !== 'all' 
                        ? "Try adjusting your search or filters" 
                        : "No issues with location data yet"}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statNumber}>{issues.length}</Text>
              <Text style={styles.statLabel}>Total Issues</Text>
            </CardContent>
          </Card>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>
                {issues.filter(i => i.status === 'resolved').length}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </CardContent>
          </Card>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
                {issues.filter(i => i.status === 'in-progress').length}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
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
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 36,
    marginBottom: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#030213',
  },
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#374151',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  mapCard: {
    height: 350,
  },
  mapCardContent: {
    flex: 1,
    padding: 0,
  },
  mapTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 8,
  },
  legendItems: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#030213',
  },
  issuesListContent: {
    paddingVertical: 0,
  },
  issuesList: {
    maxHeight: 400,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  issueItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  issueItemSelected: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  issueTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  issueLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueStatus: {
    fontSize: 12,
    color: '#9ca3af',
  },
  issueStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upvotes: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  issueDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
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
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#030213',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});