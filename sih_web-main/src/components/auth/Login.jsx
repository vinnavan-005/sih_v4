import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";  
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error message when user starts typing
    if (message && message.includes('Invalid')) {
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    // Basic validation
    if (!formData.email || !formData.password || !formData.role) {
      setMessage('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password, formData.role);
      
      if (result.success) {
        setMessage('Login successful! Redirecting...');
        
        // Redirect to intended page or role-based dashboard
        const from = location.state?.from?.pathname;
        let redirectPath;
        
        if (from) {
          redirectPath = from;
        } else {
          // Use the user's actual role from the response for routing
          const userRole = result.user.role;
          switch (userRole) {
            case 'Admin':
              redirectPath = '/admin-dashboard';
              break;
            case 'DepartmentStaff':
              redirectPath = '/staff-dashboard';
              break;
            case 'FieldSupervisor':
              redirectPath = '/supervisor-dashboard';
              break;
            default:
              redirectPath = '/';
          }
        }
        
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1000);
      } else {
        setMessage(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if form can be submitted
  const canSubmit = formData.email && formData.password && formData.role && !isSubmitting && !isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-gray-600">Please login to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white"
                disabled={isSubmitting}
              >
                <option value="" disabled>Choose your role</option>
                <option value="Admin">Administrator</option>
                <option value="DepartmentStaff">Department Staff</option>
                <option value="FieldSupervisor">Field Supervisor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-center font-medium flex items-center ${
              message.includes('successful') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {!message.includes('successful') && <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign Up
              </Link>
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p className="font-medium">Test Accounts:</p>
              <div className="text-xs space-y-1">
                <p>Admin: admin@civicconnect.gov / admin123</p>
                <p>Staff: john.smith@civicconnect.gov / staff123</p>
                <p>Supervisor: jane.wilson@civicconnect.gov / supervisor123</p>
              </div>
              <p className="mt-2">
                For support, contact{' '}
                <a href="mailto:helpdesk@civicconnect.gov" className="text-blue-600 hover:text-blue-800">
                  helpdesk@civicconnect.gov
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;