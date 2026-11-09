import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FiCheck, FiCopy, FiExternalLink, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const OAuthButtons = ({ onError, onSuccess }) => {
  const { apiUrl, getOAuthConfig, loginWithDevMock } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleGoogleClick = async () => {
    setIsLoading(true);
    if (onError) onError('');

    try {
      const config = await getOAuthConfig();
      const isConfigured = config?.google?.configured;

      if (isConfigured) {
        const origin = window.location.origin;
        window.location.href = `${apiUrl}/auth/oauth/google?origin=${encodeURIComponent(origin)}`;
      } else {
        setIsLoading(false);
        setShowConfigModal(true);
      }
    } catch (err) {
      console.error('OAuth check error:', err);
      setIsLoading(false);
      setShowConfigModal(true);
    }
  };

  const handleDevMockLogin = async () => {
    setIsLoading(true);
    try {
      const result = await loginWithDevMock('google');
      if (result.success) {
        setShowConfigModal(false);
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/dashboard');
        }
      } else {
        if (onError) onError(result.error);
      }
    } catch (err) {
      if (onError) onError('Simulated sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <>
      {/* Social Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E6EBF2]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-[#6B7890] font-medium">Or continue with</span>
        </div>
      </div>

      {/* Google Sign-In Button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-[#F8FAFC] active:bg-[#EFF3F8] border border-[#E6EBF2] hover:border-[#CCD5E2] rounded-xl text-xs font-semibold text-[#172033] shadow-xs transition cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-[#4F7CFF] rounded-full animate-spin"></div>
        ) : (
          <FcGoogle size={18} className="shrink-0" />
        )}
        <span>Continue with Google</span>
      </button>

      {/* Google Setup / Quick Test Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-[#E6EBF2] shadow-2xl max-w-md w-full p-6 text-left relative"
            >
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="absolute top-5 right-5 text-[#6B7890] hover:text-[#172033] p-1.5 rounded-lg hover:bg-[#F4F7FB] transition cursor-pointer"
              >
                <FiX size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
                  <FcGoogle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Google Sign-In Setup</h3>
                  <p className="text-xs text-[#6B7890]">
                    OAuth credentials are not configured in <code className="bg-[#F4F7FB] px-1 py-0.5 rounded text-[11px] font-mono">backend/.env</code>
                  </p>
                </div>
              </div>

              <div className="bg-[#F4F7FB] rounded-2xl p-4 text-xs space-y-3 mb-5 border border-[#E6EBF2]">
                <p className="text-[#2C384E] leading-relaxed">
                  You can test the full sign-in and vault experience instantly using <strong>Simulated Google Sign-in</strong>, or add real credentials to your project:
                </p>

                <div className="bg-white rounded-xl p-3 border border-[#E6EBF2] font-mono text-[11px] text-[#172033] space-y-1 relative group">
                  <div className="flex justify-between items-center text-[#6B7890] text-[10px] uppercase font-bold mb-1 font-sans">
                    <span>Add to backend/.env</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET=your_google_client_secret`,
                          'env'
                        )
                      }
                      className="inline-flex items-center gap-1 text-[#4F7CFF] hover:underline cursor-pointer"
                    >
                      {copiedKey === 'env' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                      <span>{copiedKey === 'env' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div>GOOGLE_CLIENT_ID=your_google_client_id</div>
                  <div>GOOGLE_CLIENT_SECRET=your_google_secret</div>
                </div>

                <div className="text-[11px] text-[#6B7890]">
                  Get credentials from{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#4F7CFF] font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    Google Cloud Console <FiExternalLink size={10} />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDevMockLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#4F7CFF] hover:bg-[#3D68E8] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Quick Test: Sign in with Demo Google Account</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="w-full py-2.5 px-4 bg-transparent hover:bg-[#F4F7FB] text-[#6B7890] hover:text-[#172033] text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  I'll configure .env later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OAuthButtons;
