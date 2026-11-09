import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiShield, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiArrowLeft,
  FiExternalLink,
  FiCheck
} from 'react-icons/fi';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

  const isValidEmail = (emailStr) => {
    if (!emailStr) return false;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(emailStr.trim().toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please provide your email address.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Enter a valid email id');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { 
        email: trimmedEmail.toLowerCase() 
      });
      setSuccessData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request password reset. Please try again.');
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
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <FiShield size={24} />
          </div>
          <h2 className="text-2xl font-bold font-outfit text-[#172033] tracking-tight">
            Recover Master Password
          </h2>
          <p className="text-xs text-[#6B7890] mt-1.5 font-medium">
            We will send zero-knowledge recovery instructions to your email
          </p>
        </div>

        <div className="bg-white border border-[#E6EBF2] shadow-xl rounded-3xl p-8">
          {successData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-3 space-y-4"
            >
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#42A982]/20 animate-ping"></div>
                <div className="w-16 h-16 rounded-full bg-[#EAF7F1] border border-[#42A982]/30 flex items-center justify-center text-[#42A982] relative z-10 shadow-xs">
                  <FiCheckCircle size={32} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#172033] font-outfit">
                  Recovery Email Dispatched!
                </h3>
                <p className="text-xs text-[#6B7890] mt-1.5 leading-relaxed">
                  {successData.message}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF2] text-xs text-[#6B7890] text-left space-y-2">
                <div className="font-bold text-[#172033] flex items-center gap-1.5 text-xs">
                  <FiCheck className="text-[#42A982]" size={15} />
                  <span>Next Steps:</span>
                </div>
                <p className="leading-relaxed">
                  1. Open your <strong>Gmail</strong> inbox or spam folder.
                </p>
                <p className="leading-relaxed">
                  2. Look for the email from <strong>Omnikey Password Manager</strong> with subject <em>"Reset Your Omnikey Master Password"</em>.
                </p>
                <p className="leading-relaxed">
                  3. Click the <strong>Reset Master Password</strong> button in the email to open the password reset page and set your new key.
                </p>
              </div>

              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setSuccessData(null)}
                  className="w-full py-2.5 px-4 bg-[#F8FAFC] hover:bg-[#EEF4FF] hover:text-[#4F7CFF] text-[#2C384E] border border-[#E6EBF2] font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Send to a different email
                </button>

                <div className="pt-1">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7890] hover:text-[#172033] transition"
                  >
                    <FiArrowLeft /> Return to login
                  </Link>
                </div>
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
                    <FiAlertCircle className="shrink-0" size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] uppercase tracking-wider mb-2">
                  Gmail / Registered Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7890]" size={16} />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E6EBF2] rounded-xl text-xs text-[#172033] placeholder:text-[#6B7890] focus:outline-none focus:bg-white focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                    placeholder="user@gmail.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#4F7CFF] hover:bg-[#3D68E8] active:bg-[#325BD6] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Dispatching Email...</span>
                  </>
                ) : (
                  <span>Send Recovery Email</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7890] hover:text-[#172033] transition"
                >
                  <FiArrowLeft /> Return to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
