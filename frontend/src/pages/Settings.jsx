import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { 
  FiUser, 
  FiLock, 
  FiDownload, 
  FiUpload, 
  FiTrash, 
  FiShield, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiInfo,
  FiEye,
  FiEyeOff,
  FiBell
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Profile fields state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  // Reset password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Modal confirmations
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Set Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // Handle profile updates
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      showToast('Name and Email are required.', 'error');
      return;
    }
    try {
      const res = await axios.put(`${API_URL}/auth/profile`, {
        name: profileName,
        email: profileEmail
      }, getAuthHeaders());
      
      const updatedUser = { ...user, name: res.data.name, email: res.data.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast('Profile credentials updated on server!', 'success');
      
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to update profile.', 'error');
    }
  };

  // Handle password resets
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New master password must be at least 8 characters.', 'error');
      return;
    }
    
    try {
      await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword,
        newPassword
      }, getAuthHeaders());

      showToast('Master password successfully updated!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to update password.', 'error');
    }
  };

  // Export JSON Vault Backup
  const handleExportVault = async () => {
    try {
      const res = await axios.get(`${API_URL}/vault`, getAuthHeaders());
      const backupData = {
        app: 'SecureVault',
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        vault: res.data
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'securevault_credentials_backup.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Vault backup JSON exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export vault backup.', 'error');
    }
  };

  // Import JSON Vault Backup
  const handleImportVault = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        if (parsedData.app !== 'SecureVault' || !Array.isArray(parsedData.vault)) {
          showToast('Invalid backup format. Ensure file is a SecureVault export.', 'error');
          return;
        }

        let successCount = 0;
        for (const item of parsedData.vault) {
          try {
            const payload = {
              website: item.website,
              url: item.url || '',
              username: item.username || '',
              email: item.email || '',
              password: item.password,
              notes: item.notes || '',
              category: item.category || 'Logins'
            };
            await axios.post(`${API_URL}/vault`, payload, getAuthHeaders());
            successCount++;
          } catch (itemErr) {
            console.error('Import item error:', itemErr);
          }
        }
        
        showToast(`Imported ${successCount} items successfully.`, 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        showToast('Failed to parse JSON file.', 'error');
      }
    };
    fileReader.readAsText(file);
  };

  // Purge Vault Data (delete all passwords)
  const handlePurgeVault = async () => {
    try {
      await axios.delete(`${API_URL}/vault/purge`, getAuthHeaders());
      showToast('Vault purged successfully from database.', 'success');
      setShowPurgeModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      showToast('Failed to purge vault data.', 'error');
    }
  };

  // Delete User account
  const handleDeleteUserAccount = async () => {
    try {
      await axios.delete(`${API_URL}/auth/delete-account`, getAuthHeaders());
      logout();
      showToast('Account and associated data deleted successfully.', 'success');
      setShowDeleteUserModal(false);
      navigate('/login');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete account.', 'error');
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { rating: 'Empty', score: 0, color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 20;
    if (pass.length >= 12) score += 20;
    if (/[a-z]/.test(pass)) score += 15;
    if (/[A-Z]/.test(pass)) score += 15;
    if (/[0-9]/.test(pass)) score += 15;
    if (/[^A-Za-z0-9]/.test(pass)) score += 15;

    if (score < 40) return { rating: 'Weak', score, color: 'bg-rose-500' };
    if (score < 75) return { rating: 'Moderate', score, color: 'bg-amber-500' };
    return { rating: 'Strong', score, color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-8 relative text-left">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <FiBell className="shrink-0 text-blue-600" />
            <span className="text-xs font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage profile information, master password, and vault backups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Profile settings & Password resets */}
        <div className="space-y-6">
          {/* Profile settings */}
          <div className="bg-white border border-slate-200/80 shadow-xs p-6 md:p-8 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-outfit text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FiUser className="text-blue-600" /> Account Profile
              </h3>
              {user?.provider === 'google' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <FcGoogle size={14} /> Google Account
                </span>
              )}
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Display Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-semibold text-white transition shadow-xs cursor-pointer"
              >
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Master Password reset */}
          <div className="bg-white border border-slate-200/80 shadow-xs p-6 md:p-8 rounded-2xl space-y-6">
            <h3 className="text-sm font-bold font-outfit text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FiLock className="text-purple-600" /> Master Password Update
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Current Master Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">New Master Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Score: {strength.score}%</span>
                      <span className={
                        strength.rating === 'Strong' ? 'text-emerald-600 font-semibold' :
                        strength.rating === 'Moderate' ? 'text-amber-600 font-semibold' : 'text-rose-600 font-semibold'
                      }>{strength.rating}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.score}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold text-white transition shadow-xs cursor-pointer"
              >
                Change Master Password
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Backup & Restore, Purge Operations */}
        <div className="space-y-6">
          {/* Backup & Restore */}
          <div className="bg-white border border-slate-200/80 shadow-xs p-6 md:p-8 rounded-2xl space-y-6">
            <h3 className="text-sm font-bold font-outfit text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FiShield className="text-blue-600" /> Vault Backups & Sync
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Omnikey uses zero-knowledge architecture. Create a backup JSON file to ensure you don't lose access to your data.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleExportVault}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition flex flex-col items-center justify-center gap-2.5 cursor-pointer group text-center"
              >
                <FiDownload size={22} className="text-blue-600 group-hover:scale-110 transition" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">Export Vault</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Save as JSON</span>
                </div>
              </button>

              <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition flex flex-col items-center justify-center gap-2.5 cursor-pointer group text-center relative overflow-hidden">
                <FiUpload size={22} className="text-purple-600 group-hover:scale-110 transition" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">Import Backup</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Upload JSON</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportVault}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Purge / Danger zone */}
          <div className="bg-white border border-rose-200 shadow-xs p-6 md:p-8 rounded-2xl space-y-6">
            <h3 className="text-sm font-bold font-outfit text-rose-600 uppercase tracking-wider flex items-center gap-2">
              <FiAlertTriangle className="text-rose-600" /> Danger Zone
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="pr-2">
                  <span className="text-xs font-semibold text-slate-900 block">Purge Credentials Vault</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-normal">Delete all credentials stored in your vault.</span>
                </div>
                <button
                  onClick={() => setShowPurgeModal(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer shadow-2xs"
                >
                  Purge Data
                </button>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="pr-2">
                  <span className="text-xs font-semibold text-slate-900 block">Delete User Account</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-normal">Permanently delete your account profile and all data.</span>
                </div>
                <button
                  onClick={() => setShowDeleteUserModal(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer shadow-2xs"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Purge Modal Confirmation */}
      <AnimatePresence>
        {showPurgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPurgeModal(false)}
              className="absolute inset-0 bg-slate-900"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white p-6 text-center relative z-10 border border-slate-200 rounded-2xl shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto mb-4 border border-rose-100">
                <FiTrash size={20} />
              </div>
              <h3 className="text-lg font-bold font-outfit text-slate-900 mb-2">Purge Vault Data?</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Are you sure you want to purge your vault? All saved credentials will be permanently erased. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPurgeModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurgeVault}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-semibold text-white transition cursor-pointer shadow-xs"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Modal Confirmation */}
      <AnimatePresence>
        {showDeleteUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteUserModal(false)}
              className="absolute inset-0 bg-slate-900"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white p-6 text-center relative z-10 border border-slate-200 rounded-2xl shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto mb-4 border border-rose-100">
                <FiAlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold font-outfit text-slate-900 mb-2">Delete User Account?</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Are you sure you want to delete your account? This will log you out, erase your settings, and wipe your vault backup.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteUserModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUserAccount}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-semibold text-white transition cursor-pointer shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Settings;
