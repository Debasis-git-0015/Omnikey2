import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiAlertCircle } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import OAuthButtons from '../components/OAuthButtons';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const queryError = searchParams.get('error');
    if (queryError) {
      setError(decodeURIComponent(queryError));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Enter a valid email id');
      return;
    }

    setIsSubmitting(true);
    const result = await login(trimmedEmail, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-[#172033]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FiShield size={24} />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-[#172033]">Welcome back</h2>
          <p className="text-[#6B7890] mt-1 text-xs sm:text-sm font-medium">Sign in to your Omnikey vault</p>
        </div>

        <div className="bg-white border border-[#E6EBF2] shadow-xl rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#FFF0F0] border border-[#E6EBF2] text-[#D96B6B] text-xs font-semibold"
              >
                <FiAlertCircle className="shrink-0" size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="text-left">
              <label className="block text-xs font-bold text-[#6B7890] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7890]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-xs focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] outline-none transition"
                  placeholder="example@gmail.com"
                  required
                />
              </div>
            </div>

            <div className="text-left">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#6B7890] uppercase tracking-wider">
                  Master Password
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-[#4F7CFF] hover:underline transition">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7890]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-xs focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] outline-none transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7890] hover:text-[#172033] transition p-1"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#4F7CFF] hover:bg-[#3D68E8] active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Decrypting Vault...</span>
                </>
              ) : (
                <span>Access Vault</span>
              )}
            </button>
          </form>

          {/* Social Sign-In (Google & GitHub) */}
          <OAuthButtons
            onError={(err) => setError(err)}
            onSuccess={() => navigate('/dashboard')}
          />

          <div className="mt-8 pt-6 border-t border-[#E6EBF2] text-center text-xs text-[#6B7890] font-medium">
            First time using Omnikey?{' '}
            <Link to="/register" className="font-bold text-[#4F7CFF] hover:underline transition">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
