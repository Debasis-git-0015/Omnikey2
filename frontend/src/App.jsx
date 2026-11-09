import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Vault from './pages/Vault';
import Generator from './pages/Generator';
import SecurityCenter from './pages/SecurityCenter';
import Settings from './pages/Settings';
import BreachChecker from './pages/BreachChecker';
import PasswordStrength from './pages/PasswordStrength';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />

          {/* Protected Vault routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/generator" element={<Generator />} />
              <Route path="/strength" element={<PasswordStrength />} />
              <Route path="/security" element={<SecurityCenter />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/breaches" element={<BreachChecker />} />
            </Route>
          </Route>

          {/* Landing and Catch-all redirects */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
