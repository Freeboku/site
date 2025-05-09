
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// Removed Loader2 import as loading is now handled by AuthProvider

const ProtectedRoute = ({ adminOnly = false }) => {
  // Get user, isAdmin, and loading state directly from useAuth
  const { user, isAdmin, loading } = useAuth(); 
  const location = useLocation();

  // Loading state is now handled globally by AuthProvider, 
  // so we don't need a local loading check here. 
  // If AuthProvider hasn't finished loading, it won't render its children (including this route).

  if (loading) {
     // This case should technically not be hit if AuthProvider handles loading correctly,
     // but keep it as a fallback or remove if confident in AuthProvider's loading screen.
     return null; // Or return the loading indicator if preferred
  }

  if (!user) {
    // Redirect to login page if not authenticated AFTER loading is complete
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Redirect to home page if user is not an admin for admin-only routes
    console.warn("Admin access denied for user:", user.id);
    // Optionally show a "Forbidden" page or message
    return <Navigate to="/" replace />; 
  }

  // If authenticated and has the required role (if applicable), render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
