import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  AlertTriangle, 
  Settings, 
  Users, 
  Briefcase, 
  LogOut,
  Home,
  MapPin,
  Upload,
  TrendingUp,
  UserCheck,
  Calendar,
  Bell,
  Shield,
  Database,
  ChevronDown,
  ChevronRight,
  Activity,
  ClipboardList
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    issues: false,
    assignments: false,
    reports: false
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      navigate('/login');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation items based on role and backend endpoints
  const getNavigationItems = () => {
    if (!currentUser) return [];

    const baseItems = [];

    if (currentUser.role === 'Admin') {
      baseItems.push(
        { 
          path: '/admin-dashboard', 
          icon: Home, 
          label: 'Dashboard Overview',
          description: 'System overview and statistics'
        },
        {
          type: 'section',
          key: 'issues',
          label: 'Issue Management',
          icon: FileText,
          expanded: expandedSections.issues,
          items: [
            { path: '/issues', icon: FileText, label: 'All Issues', badge: 'view' },
            { path: '/issues/create', icon: Upload, label: 'Create Issue' },
            { path: '/issues/search', icon: BarChart3, label: 'Search & Filter' },
            { path: '/issues/map', icon: MapPin, label: 'Issue Map' }
          ]
        },
        {
          type: 'section',
          key: 'assignments',
          label: 'Assignments',
          icon: Briefcase,
          expanded: expandedSections.assignments,
          items: [
            { path: '/assignments', icon: ClipboardList, label: 'All Assignments' },
            { path: '/assignments/bulk', icon: Users, label: 'Bulk Assign' },
            { path: '/assignments/stats', icon: TrendingUp, label: 'Assignment Stats' }
          ]
        },
        { path: '/users', icon: Users, label: 'User Management', badge: 'admin' },
        { path: '/departments', icon: Shield, label: 'Department Stats' },
        {
          type: 'section',
          key: 'reports',
          label: 'Analytics & Reports',
          icon: BarChart3,
          expanded: expandedSections.reports,
          items: [
            { path: '/analytics', icon: TrendingUp, label: 'Analytics Dashboard' },
            { path: '/analytics/trends', icon: Activity, label: 'Trend Analysis' },
            { path: '/analytics/performance', icon: BarChart3, label: 'Performance Metrics' },
            { path: '/analytics/export', icon: Database, label: 'Data Export' }
          ]
        },
        { path: '/files', icon: Upload, label: 'File Management' },
        { path: '/settings', icon: Settings, label: 'System Settings', badge: 'admin' }
      );
    } else if (currentUser.role === 'DepartmentStaff') {
      baseItems.push(
        { 
          path: '/staff-dashboard', 
          icon: Home, 
          label: 'Department Dashboard',
          description: `${currentUser.department || 'Your'} Department`
        },
        {
          type: 'section',
          key: 'issues',
          label: 'Issue Management',
          icon: FileText,
          expanded: expandedSections.issues,
          items: [
            { path: '/issues', icon: FileText, label: 'Department Issues' },
            { path: '/issues/create', icon: Upload, label: 'Report Issue' },
            { path: '/issues/map', icon: MapPin, label: 'Department Map' }
          ]
        },
        {
          type: 'section',
          key: 'assignments',
          label: 'Task Management',
          icon: Briefcase,
          expanded: expandedSections.assignments,
          items: [
            { path: '/assignments', icon: ClipboardList, label: 'Manage Assignments' },
            { path: '/assignments/create', icon: UserCheck, label: 'Assign Tasks' },
            { path: '/assignments/bulk', icon: Users, label: 'Bulk Assignment' }
          ]
        },
        { path: '/staff', icon: Users, label: 'Department Staff' },
        { path: '/updates', icon: Bell, label: 'Issue Updates' },
        { path: '/analytics', icon: BarChart3, label: 'Department Analytics' }
      );
    } else if (currentUser.role === 'FieldSupervisor') {
      baseItems.push(
        { 
          path: '/supervisor-dashboard', 
          icon: Home, 
          label: 'My Tasks',
          description: 'Field assignments and updates'
        },
        { path: '/assignments/my', icon: Briefcase, label: 'My Assignments' },
        { path: '/updates/create', icon: Upload, label: 'Submit Update' },
        { path: '/issues/nearby', icon: MapPin, label: 'Nearby Issues' },
        { path: '/files/upload', icon: Upload, label: 'Upload Photos' }
      );
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const isActive = (path) => {
    if (path === location.pathname) return true;
    // Check if current path starts with the navigation path (for sub-routes)
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isParentActive = (items) => {
    return items.some(item => isActive(item.path));
  };

  const renderNavigationItem = (item) => {
    if (item.type === 'section') {
      const hasActiveChild = isParentActive(item.items);
      
      return (
        <div key={item.key} className="mb-2">
          <button
            onClick={() => toggleSection(item.key)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
              hasActiveChild
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </div>
            {item.expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {item.expanded && (
            <div className="ml-4 mt-2 space-y-1">
              {item.items.map((subItem) => (
                <Link
                  key={subItem.path}
                  to={subItem.path}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                    isActive(subItem.path)
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <subItem.icon className="h-4 w-4" />
                  <span>{subItem.label}</span>
                  {subItem.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {subItem.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive(item.path)
            ? 'bg-blue-600 text-white font-semibold'
            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        <item.icon className="h-5 w-5" />
        <div className="flex-1">
          <span>{item.label}</span>
          {item.description && (
            <p className="text-xs opacity-75 mt-0.5">{item.description}</p>
          )}
        </div>
        {item.badge && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  if (!currentUser) {
    return null; // Don't show sidebar if not authenticated
  }

  return (
    <aside className="w-60 bg-slate-800 text-white h-screen fixed left-0 top-0 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">CC</span>
          </div>
          <h2 className="text-xl font-semibold">CivicConnect</h2>
          <p className="text-xs text-slate-400 mt-1">
            {currentUser.role === 'Admin' && 'System Administration'}
            {currentUser.role === 'DepartmentStaff' && 'Department Management'}
            {currentUser.role === 'FieldSupervisor' && 'Field Operations'}
          </p>
        </div>
        
        {/* User Info Card */}
        <div className="bg-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser.fullname?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser.fullname || 'User'}
              </p>
              <p className="text-xs text-slate-300 truncate">
                {currentUser.department || 'No Department'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          {navigationItems.map(renderNavigationItem)}
        </nav>

        {/* Role switching for Admin */}
        {currentUser.role === 'Admin' && (
          <div className="pt-4 border-t border-slate-600">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">
              Switch Views
            </p>
            <div className="space-y-1">
              <Link
                to="/staff-dashboard"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Staff View</span>
              </Link>
              <Link
                to="/supervisor-dashboard"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Briefcase className="h-4 w-4" />
                <span>Supervisor View</span>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats for Staff/Supervisor */}
        {(currentUser.role === 'DepartmentStaff' || currentUser.role === 'FieldSupervisor') && (
          <div className="pt-4 border-t border-slate-600">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">
              Quick Stats
            </p>
            <div className="space-y-2">
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">Active Tasks</span>
                  <span className="text-sm font-medium text-white">--</span>
                </div>
              </div>
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">Completed</span>
                  <span className="text-sm font-medium text-green-400">--</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="pt-6 border-t border-slate-600">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-xs text-slate-500">
            v1.0.0 | {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;