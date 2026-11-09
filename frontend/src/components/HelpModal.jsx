import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiHelpCircle, 
  FiShield, 
  FiKey, 
  FiLock, 
  FiZap, 
  FiRefreshCw, 
  FiMail, 
  FiExternalLink,
  FiCheckCircle
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const HelpModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'How does Google Sign-In protect my vault?',
      a: 'When you authenticate with Google, Omnikey verifies your identity via Google OAuth 2.0 without ever storing your Google password. Your credentials are encrypted on the client and server using AES-256 standard encryption.'
    },
    {
      q: 'How do I add and organize credentials in my Vault?',
      a: 'Go to "Password Vault" from the menu or click "Add Password" on the dashboard. You can categorize items as Logins, Secure Notes, Credit Cards, or API Keys.'
    },
    {
      q: 'Can I export or backup my encrypted passwords?',
      a: 'Yes! From the Dashboard or Vault page, click "Export Vault" to download an encrypted JSON backup file of your credentials.'
    },
    {
      q: 'How does the Breach Checker work?',
      a: 'The Breach Checker monitors leaked databases to notify you if any of your saved email addresses or passwords have been compromised in public data exposures.'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#172033]/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E6EBF2] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E6EBF2] flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF4FF] text-[#4F7CFF] flex items-center justify-center border border-[#E6EBF2] shadow-xs">
                <FiHelpCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033] leading-tight">
                  Help & Documentation
                </h3>
                <p className="text-xs text-[#6B7890] mt-0.5">
                  Guides, security architecture, and FAQs for Omnikey
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-[#6B7890] hover:text-[#172033] hover:bg-white flex items-center justify-center transition border border-transparent hover:border-[#E6EBF2] cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[#E6EBF2] px-6 bg-white gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#4F7CFF] text-[#4F7CFF]'
                  : 'border-transparent text-[#6B7890] hover:text-[#172033]'
              }`}
            >
              Security Architecture
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'faq'
                  ? 'border-[#4F7CFF] text-[#4F7CFF]'
                  : 'border-transparent text-[#6B7890] hover:text-[#172033]'
              }`}
            >
              Frequently Asked Questions
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'support'
                  ? 'border-[#4F7CFF] text-[#4F7CFF]'
                  : 'border-transparent text-[#6B7890] hover:text-[#172033]'
              }`}
            >
              Support & Contact
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-5 text-left text-[#172033] text-xs">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#EEF4FF]/50 border border-[#E6EBF2] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#4F7CFF] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <FiShield size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#172033]">Zero-Knowledge AES-256 Protection</h4>
                    <p className="text-[#6B7890] text-xs mt-1 leading-relaxed">
                      All sensitive fields (passwords, secure notes, token keys) are protected with military-grade AES-256 encryption. Only your authenticated session holds the key to decrypt and inspect vault records.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF2] space-y-2">
                    <div className="flex items-center gap-2 text-[#4F7CFF] font-bold">
                      <FcGoogle size={18} />
                      <span>Google OAuth 2.0</span>
                    </div>
                    <p className="text-[#6B7890] leading-relaxed">
                      Instant single sign-on backed by Google security infrastructure, 2-Factor Authentication, and MongoDB Atlas account link.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF2] space-y-2">
                    <div className="flex items-center gap-2 text-[#42A982] font-bold">
                      <FiZap size={18} />
                      <span>Smart Password Generator</span>
                    </div>
                    <p className="text-[#6B7890] leading-relaxed">
                      Generates cryptographically random passwords with custom symbols, numbers, and high entropy resistance.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#EAF7F1] border border-[#E6EBF2] flex items-center gap-3">
                  <FiCheckCircle className="text-[#42A982] shrink-0" size={20} />
                  <p className="text-[#42A982] font-semibold text-xs">
                    Cloud database connection to MongoDB Atlas is active and synchronizing live.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF2] space-y-1.5">
                    <h5 className="font-bold text-xs text-[#172033] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#EEF4FF] text-[#4F7CFF] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      {faq.q}
                    </h5>
                    <p className="text-[#6B7890] text-xs leading-relaxed pl-7">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF2] space-y-3">
                  <h4 className="font-bold text-sm text-[#172033]">Need further assistance?</h4>
                  <p className="text-[#6B7890] text-xs leading-relaxed">
                    Our technical support team is available to assist with vault migrations, database backups, and security configuration questions.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href="mailto:support@omnikey.app"
                      className="px-4 py-2.5 rounded-xl bg-[#4F7CFF] hover:bg-[#3D68E8] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <FiMail size={16} />
                      <span>Contact Technical Support</span>
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E6EBF2] text-[11px] text-[#6B7890] flex items-center justify-between">
                  <span>Omnikey Administrator Suite v2.4.0</span>
                  <span className="text-[#42A982] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#42A982] animate-pulse"></span>
                    All Systems Operational
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E6EBF2] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white hover:bg-[#F4F7FB] border border-[#E6EBF2] text-[#172033] font-semibold text-xs rounded-xl shadow-2xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HelpModal;

