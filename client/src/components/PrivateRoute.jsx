import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, roleRequired }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)' }}>Loading...</div>;
  }

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && user.role !== roleRequired) {
    // Logged in but doesn't have the right role, redirect to appropriate dashboard
    return <Navigate to={user.role === 'instructor' ? '/instructor/dashboard' : '/dashboard'} replace />;
  }

  // Authorized, return the child components
  return children;
};

export default PrivateRoute;
