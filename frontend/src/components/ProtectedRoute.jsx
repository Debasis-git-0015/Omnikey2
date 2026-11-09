import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLoader } from 'react-icons/fi';

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="animate-spin text-blue-400 text-5xl mx-auto mb-4" />
          <p className="text-slate-400 font-mono text-sm tracking-wider uppercase animate-pulse">
            Verifying Security Session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
