import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RequireRole component renders its children only if the logged‑in user has one of the
 * allowed roles. Otherwise it redirects to /unauthorized or returns null.
 */
const RequireRole = ({ roles, children, redirect = true }) => {
  const { user } = useAuth();
  
  if (!user || !user.role) {
    return redirect ? <Navigate to="/unauthorized" replace /> : null;
  }
  
  const hasRole = roles.includes(user.role.toUpperCase());
  
  if (!hasRole) {
    return redirect ? <Navigate to="/unauthorized" replace /> : null;
  }
  
  return <>{children}</>;
};

export default RequireRole;
