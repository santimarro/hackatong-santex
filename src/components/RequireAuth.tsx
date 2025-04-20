import { useAuth } from '../lib/auth-context';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If authentication is still loading, you could show a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not authenticated, redirect to the auth page
  if (!user) {
    // Save the location they were trying to go to
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
}

export default RequireAuth;