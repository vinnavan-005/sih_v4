import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { LogOut, User, Bell, Settings, Menu, X } from 'lucide-react';

const Header = ({ title, showUserInfo = true, showNotifications = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout API call fails
      navigate('/login');
    }
  };

  const goToDashboard = () => {
    if (currentUser?.role === 'Admin') {
      navigate('/admin-dashboard');
    } else if (currentUser?.role === 'DepartmentStaff') {
      navigate('/staff-dashboard');
    } else if (currentUser?.role === 'FieldSupervisor') {
      navigate('/supervisor-dashboard');
    } else {
      navigate('/login');
    }
  };

  const goToProfile = () => {
    navigate('/profile');
    setShowDropdown(false);
  };

  const goToSettings = () => {
    if (currentUser?.role === 'Admin') {
      navigate('/settings');
    } else {
      navigate('/profile');
    }
    setShowDropdown(false);
  };

  // Don't show header on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <header className="bg-slate-800 text-white shadow-lg relative z-40">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Title and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-700 transition-colors"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Title */}
            <div>
              <h1 className="text-xl font-semibold">{title || 'CivicConnect'}</h1>
              {currentUser?.department && (
                <p className="text-sm text-slate-300 hidden sm:block">
                  {currentUser.department}
                </p>
              )}
            </div>
          </div>
          
          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications (placeholder for future implementation) */}
            {showNotifications && currentUser && (
              <button className="p-2 rounded-full hover:bg-slate-700 transition-colors relative">
                <Bell className="h-5 w-5" />
                {/* Notification badge placeholder */}
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            )}

            {/* User info and dropdown */}
            {showUserInfo && currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium">
                        {currentUser.fullname || 'Unknown User'}
                      </div>
                      <div className="text-xs text-slate-300">
                        {currentUser.role || 'No Role'}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-900 border-b">
                      <div className="font-medium">{currentUser.fullname}</div>
                      <div className="text-gray-500">{currentUser.email}</div>
                      <div className="text-xs text-blue-600">{currentUser.role}</div>
                    </div>
                    
                    <button
                      onClick={goToDashboard}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
                    </button>
                    
                    <button
                      onClick={goToProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                    
                    {currentUser.role === 'Admin' && (
                      <button
                        onClick={goToSettings}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </button>
                    )}
                    
                    <div className="border-t">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Direct logout button for mobile */}
            {!showUserInfo && currentUser && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors sm:hidden"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden mt-4 py-4 border-t border-slate-700">
            <div className="space-y-2">
              <button
                onClick={goToDashboard}
                className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              >
                Dashboard
              </button>
              
              {currentUser?.role !== 'FieldSupervisor' && (
                <>
                  <button
                    onClick={() => navigate('/issues')}
                    className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
                  >
                    Issues
                  </button>
                  
                  {currentUser?.role !== 'DepartmentStaff' && (
                    <button
                      onClick={() => navigate('/analytics')}
                      className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
                    >
                      Analytics
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={goToProfile}
                className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              >
                Profile
              </button>
              
              {currentUser?.role === 'Admin' && (
                <button
                  onClick={() => navigate('/settings')}
                  className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
                >
                  Settings
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;