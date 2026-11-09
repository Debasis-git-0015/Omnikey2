import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiLogOut, FiShield, FiUser, FiUnlock } from 'react-icons/fi';

const DashboardPlaceholder = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl bg-white border border-slate-200/80 shadow-xl rounded-2xl p-8 md:p-12 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-6">
          <FiUnlock size={28} />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold font-outfit mb-2 text-slate-900">
          Vault Decrypted
        </h1>
        <p className="text-slate-500 mb-8">Welcome to your Omnikey dashboard</p>

        {/* User Session card */}
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between p-5 rounded-xl bg-slate-50 border border-slate-200 mb-8 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
              <FiUser />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{user?.name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-slate-700">Session Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-2xl font-bold text-slate-900 font-outfit">0</div>
            <div className="text-xs text-slate-500 mt-1">Passwords Saved</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-2xl font-bold text-emerald-600 font-outfit">100%</div>
            <div className="text-xs text-slate-500 mt-1">Vault Health</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-2xl font-bold text-blue-600 font-outfit">Active</div>
            <div className="text-xs text-slate-500 mt-1">AI Advisor</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <FiLogOut /> Lock Vault (Logout)
        </button>
      </motion.div>

      <div className="mt-8 text-center text-xs text-slate-500">
        Omnikey &copy; 2026. All rights reserved.
      </div>
    </div>
  );
};

export default DashboardPlaceholder;
