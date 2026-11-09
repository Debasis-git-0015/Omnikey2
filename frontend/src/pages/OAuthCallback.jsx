import React, { useEffect, useContext, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShield, FiAlertCircle } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { loginWithOAuthData } = useContext(AuthContext);
  const [errorMessage, setErrorMessage] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    const token = searchParams.get('token');
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const avatar = searchParams.get('avatar');
    const provider = searchParams.get('provider') || 'google';
    const error = searchParams.get('error');

    if (error) {
      handledRef.current = true;
      setErrorMessage(error);
      setTimeout(() => {
        window.location.replace(`/login?error=${encodeURIComponent(error)}`);
      }, 2500);
      return;
    }

    if (token && (email || id)) {
      handledRef.current = true;
      try {
        loginWithOAuthData({
          token,
          id,
          name: name || (email ? email.split('@')[0] : 'Omnikey User'),
          email,
          avatar: avatar || null,
          provider
        });

        // Instant clean transition to dashboard with full state refresh
        window.location.replace('/dashboard');
      } catch (err) {
        console.error('OAuth callback storage error:', err);
        setErrorMessage('Failed to finalize authentication session.');
      }
    } else {
      // Check if user is already authenticated in localStorage
      const existingToken = localStorage.getItem('token');
      const existingUser = localStorage.getItem('user');
      if (existingToken && existingUser) {
        window.location.replace('/dashboard');
        return;
      }
      setErrorMessage('Missing authentication parameters from provider.');
    }
  }, [searchParams, loginWithOAuthData]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-[#172033]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#4F7CFF] flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/25 mb-6 relative">
          <FiShield size={32} />
          {!errorMessage && (
            <span className="absolute -inset-1 rounded-2xl border-2 border-[#4F7CFF]/40 animate-ping pointer-events-none"></span>
          )}
        </div>

        <div className="bg-white border border-[#E6EBF2] shadow-xl rounded-3xl p-8">
          {errorMessage ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <FiAlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">Sign-in Failed</h3>
              <p className="text-xs text-[#6B7890]">{errorMessage}</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-block px-5 py-2.5 bg-[#4F7CFF] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#3D68E8] transition"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-8 h-8 border-3 border-[#EEF4FF] border-t-[#4F7CFF] rounded-full animate-spin mx-auto"></div>
              <h3 className="text-lg font-bold text-[#172033]">Authenticating with Vault</h3>
              <p className="text-xs text-[#6B7890]">
                Securing your session and decrypting credentials...
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OAuthCallback;
