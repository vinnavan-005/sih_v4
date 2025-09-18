import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'default', 
  text = 'Loading...', 
  color = 'blue',
  showText = true,
  inline = false 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16'
  };

  const containerClasses = {
    small: 'p-2',
    default: 'p-4',
    large: 'p-8',
    xlarge: 'p-12'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600'
  };

  const textSizeClasses = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base',
    xlarge: 'text-lg'
  };

  if (inline) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`animate-spin rounded-full border-2 border-gray-300 ${colorClasses[color]} ${sizeClasses[size]}`}></div>
        {showText && (
          <span className={`text-gray-600 ${textSizeClasses[size]}`}>{text}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 ${colorClasses[color]} ${sizeClasses[size]}`}></div>
      {showText && text && (
        <p className={`mt-3 text-gray-600 ${textSizeClasses[size]} text-center max-w-xs`}>{text}</p>
      )}
    </div>
  );
};

// Full page loading component
export const PageLoader = ({ 
  text = 'Loading...', 
  subText = null,
  showLogo = true 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto px-4">
      {showLogo && (
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">CC</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">CivicConnect</h2>
        </div>
      )}
      
      <div className="animate-spin rounded-full h-16 w-16 border-2 border-gray-300 border-t-blue-600 mx-auto mb-6"></div>
      <p className="text-lg text-gray-700 mb-2">{text}</p>
      {subText && (
        <p className="text-sm text-gray-500">{subText}</p>
      )}
    </div>
  </div>
);

// Overlay loading component
export const LoadingOverlay = ({ 
  text = 'Processing...', 
  show = true,
  onCancel = null,
  cancelText = 'Cancel'
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 text-center shadow-xl max-w-sm mx-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700 mb-4">{text}</p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {cancelText}
          </button>
        )}
      </div>
    </div>
  );
};

// Error state component
export const ErrorState = ({ 
  title = 'Something went wrong',
  message = 'Please try again later',
  onRetry = null,
  onGoBack = null,
  retryText = 'Try Again',
  backText = 'Go Back',
  showIcon = true
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center max-w-md mx-auto">
      {showIcon && (
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
      )}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <p className="text-gray-600 mb-8">{message}</p>
      
      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryText}
          </button>
        )}
        
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            {backText}
          </button>
        )}
      </div>
    </div>
  </div>
);

// Network error component
export const NetworkError = ({ 
  onRetry = null,
  onOfflineMode = null 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center max-w-md mx-auto">
      <WifiOff className="h-16 w-16 text-red-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Problem</h2>
      <p className="text-gray-600 mb-8">
        Unable to connect to the server. Please check your internet connection and try again.
      </p>
      
      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          >
            <Wifi className="h-4 w-4 mr-2" />
            Retry Connection
          </button>
        )}
        
        {onOfflineMode && (
          <button
            onClick={onOfflineMode}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Continue Offline
          </button>
        )}
      </div>
    </div>
  </div>
);

// Loading skeleton for lists
export const ListSkeleton = ({ items = 5 }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
    ))}
  </div>
);

// Loading skeleton for cards
export const CardSkeleton = ({ cards = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
    {Array.from({ length: cards }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-20"></div>
            <div className="h-8 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="h-8 w-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

// Data loading state
export const DataLoader = ({ 
  loading = false,
  error = null,
  data = null,
  onRetry = null,
  loadingComponent = null,
  errorComponent = null,
  emptyComponent = null,
  children
}) => {
  if (loading) {
    return loadingComponent || <LoadingSpinner text="Loading data..." />;
  }

  if (error) {
    return errorComponent || (
      <ErrorState
        title="Failed to load data"
        message={error.message || error}
        onRetry={onRetry}
      />
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent || (
      <div className="text-center py-12">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return children;
};

// Button with loading state
export const LoadingButton = ({ 
  loading = false,
  disabled = false,
  children,
  loadingText = 'Loading...',
  className = '',
  size = 'default',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm rounded-md',
    default: 'px-4 py-2 text-sm rounded-md',
    large: 'px-6 py-3 text-base rounded-lg'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current mr-2"></div>
      )}
      {loading ? loadingText : children}
    </button>
  );
};

export default LoadingSpinner;