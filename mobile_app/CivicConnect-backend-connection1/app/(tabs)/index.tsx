// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import AuthService from '../../services/authService';
import { ActivityItem, QuickStats, User } from '../../types';
import { StorageService } from '../../utils/storage';

// Mock data for dashboard - you can replace this with API calls later
const recentActivity: ActivityItem[] = [
  {
    id: '1',
    title: 'Street light repair completed',
    location: 'Main St & 5th Ave',
    type: 'resolved',
    time: '2 hours ago'
  },
  {
    id: '2',
    title: 'New pothole reported',
    location: 'Oak Street',
    type: 'new',
    time: '4 hours ago'
  },
  {
    id: '3',
    title: 'Trash pickup scheduled',
    location: 'Central Park',
    type: 'in-progress',
    time: '6 hours ago'
  }
];

const quickStats: QuickStats = {
  totalIssues: 127,
  resolved: 89,
  inProgress: 23,
  pending: 15,
  userReports: 3,
  communityRank: 'Bronze Contributor'
};

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await StorageService.getUser();
    if (userData) {
      setUser(userData);
    } else {
      // Check if user is authenticated with the backend
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        router.replace('/(auth)/login');
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              await StorageService.clearAllData();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
              // Even if logout fails, clear local data and redirect
              await StorageService.clearAllData();
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'resolved':
        return 'checkmark-circle';
      case 'in-progress':
        return 'time';
      case 'new':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'resolved':
        return '#10b981';
      case 'in-progress':
        return '#f59e0b';
      case 'new':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
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
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <CardHeader>
            <CardTitle style={styles.sectionTitle}>Community Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{quickStats.totalIssues}</Text>
                <Text style={styles.statLabel}>Total Issues</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#10b981' }]}>{quickStats.resolved}</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{quickStats.inProgress}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#ef4444' }]}>{quickStats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
            <View style={styles.userStats}>
              <Text style={styles.userReports}>Your Reports: {quickStats.userReports}</Text>
              <Text style={styles.communityRank}>{quickStats.communityRank}</Text>
            </View>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <CardHeader>
            <CardTitle style={styles.sectionTitle}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#dbeafe' }]}
                onPress={() => router.push('/(tabs)/camera-report')}
              >
                <Ionicons name="camera" size={24} color="#3b82f6" />
                <Text style={[styles.actionText, { color: '#3b82f6' }]}>Report Issue</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#dcfce7' }]}
                onPress={() => router.push('/(tabs)/my-reports')}
              >
                <Ionicons name="document-text" size={24} color="#16a34a" />
                <Text style={[styles.actionText, { color: '#16a34a' }]}>My Reports</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#fef3c7' }]}
                onPress={() => router.push('/(tabs)/map')}
              >
                <Ionicons name="map" size={24} color="#d97706" />
                <Text style={[styles.actionText, { color: '#d97706' }]}>Explore</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <CardHeader>
            <CardTitle style={styles.sectionTitle}>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={getActivityIcon(activity.type)}
                    size={20}
                    color={getActivityColor(activity.type)}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityLocation}>{activity.location}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Emergency Report Button */}
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={() => router.push('/(tabs)/camera-report')}
        >
          <Ionicons name="alert" size={24} color="white" />
          <Text style={styles.emergencyText}>Report Emergency Issue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#030213',
  },
  logoutButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#030213',
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#030213',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  userReports: {
    fontSize: 14,
    fontWeight: '600',
    color: '#030213',
  },
  communityRank: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  activityCard: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emergencyButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  emergencyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});