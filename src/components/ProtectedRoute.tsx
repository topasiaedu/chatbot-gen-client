import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingPage from '../pages/pages/loading';
import { useAuthContext } from '../context/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuthContext();
  const location = useLocation(); // Get the current location

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    // Save the current path to localStorage before redirecting
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/authentication/sign-in" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
