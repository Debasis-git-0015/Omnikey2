import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiShield, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiArrowRight,
  FiKey
} from 'react-icons/fi';
import axios from 'axios';
import API_URL from '../config/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: '#E6EBF2' };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.length >= 12) score += 15;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 15;

    if (score < 40) return { score, label: 'Weak', color: '#D96B6B' };
    if (score < 70) return { score, label: 'Fair', color: '#D99A45' };
    if (score < 90) return { score, label: 'Strong', color: '#4F7CFF' };
    return { score: 100, label: 'Very Strong', color: '#42A982' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password.length < 8) {
      setError('New master password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API_URL}/auth/reset-password/${token}`, {
        password
      });

      setIsSuccess(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to reset password. The recovery link may have expired.';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-[#172033]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <FiShield size={24} />
          </div>
          <h2 className="text-2xl font-bold font-outfit text-[#172033] tracking-tight">
            Create New Master Password
          </h2>
          <p className="text-xs text-[#6B7890] mt-1.5 font-medium">
            Set a strong encryption key to secure your Omnikey Vault
          </p>
        </div>

        <div className="bg-white border border-[#E6EBF2] shadow-xl rounded-3xl p-8">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#42A982]/20 animate-ping"></div>
                <div className="w-16 h-16 rounded-full bg-[#EAF7F1] border border-[#42A982]/30 flex items-center justify-center text-[#42A982] relative z-10 shadow-xs">
                  <FiCheckCircle size={32} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#172033] font-outfit">
                  Password Reset Successful!
                </h3>
                <p className="text-xs text-[#6B7890] mt-1 leading-relaxed">
                  Your new master password is encrypted and saved. You can now use it to sign in to your vault.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-[#4F7CFF] hover:bg-[#3D68E8] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In with New Password</span>
                  <FiArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
                  >
                    <FiAlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* New Password Input */}
              <div>
                <label className="block text-[11px] font-bold text-[#172033] uppercase tracking-wider mb-2">
                  New Master Password
                </label>
                <div className="relative">
                  <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7890]" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E6EBF2] rounded-xl text-xs text-[#172033] placeholder:text-[#6B7890] focus:outline-none focus:bg-white focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7890] hover:text-[#172033] cursor-pointer"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-[#6B7890]">Strength:</span>
                      <span style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#F4F7FB] rounded-full overflow-hidden border border-[#E6EBF2]">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-[11px] font-bold text-[#172033] uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7890]" size={16} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new master password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E6EBF2] rounded-xl text-xs text-[#172033] placeholder:text-[#6B7890] focus:outline-none focus:bg-white focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7890] hover:text-[#172033] cursor-pointer"
                  >
                    {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#4F7CFF] hover:bg-[#3D68E8] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving Password...</span>
                  </>
                ) : (
                  <span>Update Master Password</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#6B7890] hover:text-[#172033] transition"
                >
                  Cancel and return to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

