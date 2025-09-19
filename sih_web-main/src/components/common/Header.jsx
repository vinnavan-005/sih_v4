import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { LogOut, User, Bell, Settings, Menu, X } from 'lucide-react';
import { ROLES, getDashboardRoute } from '../../utils/constants';

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
    // FIXED: Use standardized roles and helper function
    const dashboardPath = getDashboardRoute(currentUser?.role);
    navigate(dashboardPath);
  };

  const goToProfile = () => {
    navigate('/profile');
    setShowDropdown(false);
  };

  const goToSettings = () => {
    // FIXED: Use standardized role check
    if (currentUser?.role === ROLES.ADMIN) {
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
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Title */}
            <div>
              <h1 
                className="text-xl font-bold cursor-pointer hover:text-blue-300 transition-colors"
                onClick={goToDashboard}
              >
                {title || 'Civic Connect'}
              </h1>
              {currentUser && (
                <p className="text-xs text-slate-400">
                  {currentUser.role === ROLES.ADMIN && 'Administrator Panel'}
                  {currentUser.role === ROLES.STAFF && 'Staff Dashboard'}
                  {currentUser.role === ROLES.SUPERVISOR && 'Supervisor Panel'}
                  {currentUser.role === ROLES.CITIZEN && 'Citizen Portal'}
                </p>
              )}
            </div>
          </div>

          {/* Right side - User info and actions */}
          {showUserInfo && currentUser && (
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              {showNotifications && (
                <button className="p-2 rounded-md hover:bg-slate-700 transition-colors relative">
                  <Bell className="h-5 w-5" />
                  {/* Notification badge */}
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </button>
              )}

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-700 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">
                    {currentUser.fullname || 'User'}
                  </span>
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {currentUser.fullname}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentUser.email}
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        {currentUser.role === ROLES.ADMIN && 'Administrator'}
                        {currentUser.role === ROLES.STAFF && 'Department Staff'}
                        {currentUser.role === ROLES.SUPERVISOR && 'Field Supervisor'}
                        {currentUser.role === ROLES.CITIZEN && 'Citizen'}
                      </p>
                    </div>
                    
                    <button
                      onClick={goToDashboard}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </button>
                    
                    <button
                      onClick={goToProfile}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </button>

                    {/* Settings only for admin */}
                    {currentUser.role === ROLES.ADMIN && (
                      <button
                        onClick={goToSettings}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </button>
                    )}

                    <div className="border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden mt-4 pb-4 border-t border-slate-700">
            <div className="pt-4 space-y-2">
              <button
                onClick={goToDashboard}
                className="block w-full text-left px-2 py-2 text-sm hover:bg-slate-700 rounded-md transition-colors"
              >
                Dashboard
              </button>
              {currentUser && (
                <>
                  <button
                    onClick={goToProfile}
                    className="block w-full text-left px-2 py-2 text-sm hover:bg-slate-700 rounded-md transition-colors"
                  >
                    Profile
                  </button>
                  {currentUser.role === ROLES.ADMIN && (
                    <button
                      onClick={goToSettings}
                      className="block w-full text-left px-2 py-2 text-sm hover:bg-slate-700 rounded-md transition-colors"
                    >
                      Settings
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-2 py-2 text-sm text-red-300 hover:bg-slate-700 rounded-md transition-colors"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;