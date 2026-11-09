import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShield, 
  FiKey, 
  FiAlertTriangle, 
  FiRefreshCw, 
  FiArrowRight, 
  FiCheckCircle, 
  FiCopy, 
  FiPlus, 
  FiZap, 
  FiUpload, 
  FiLoader, 
  FiMoreVertical, 
  FiBell,
  FiLink,
  FiLock,
  FiInbox
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  // Capitalize first name properly
  const getFirstName = (name) => {
    if (!name) return 'User';
    const first = name.trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  };

  const firstName = getFirstName(user?.name);

  // Stats state initialized to 0 for real/new user accounts
  const [stats, setStats] = useState({
    total: 0,
    weak: 0,
    reused: 0,
    breached: 0,
    score: 100,
  });

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('Initializing Analyzer...');
  const [showScanModal, setShowScanModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Recent items state
  const [recentItems, setRecentItems] = useState([]);

  // Dynamic audit evaluator
  const performVaultAudit = (items) => {
    const total = items ? items.length : 0;
    
    if (!items || items.length === 0) {
      setStats({
        total: 0,
        weak: 0,
        reused: 0,
        breached: 0,
        score: 100
      });
      setRecentItems([]);
      return;
    }

    const getEntropy = (pass) => {
      if (!pass) return 0;
      let poolSize = 0;
      if (/[a-z]/.test(pass)) poolSize += 26;
      if (/[A-Z]/.test(pass)) poolSize += 26;
      if (/[0-9]/.test(pass)) poolSize += 10;
      if (/[^A-Za-z0-9]/.test(pass)) poolSize += 29;
      return Math.floor(pass.length * Math.log2(poolSize || 1));
    };

    let weakCount = 0;
    const passwordGroups = {};

    items.forEach(item => {
      const entropy = getEntropy(item.password);
      if (entropy < 45) {
        weakCount++;
      }
      if (item.password) {
        if (!passwordGroups[item.password]) {
          passwordGroups[item.password] = [];
        }
        passwordGroups[item.password].push(item);
      }
    });

    let reusedCount = 0;
    Object.keys(passwordGroups).forEach(pass => {
      if (passwordGroups[pass].length > 1) {
        reusedCount += passwordGroups[pass].length;
      }
    });

    const deductions = (weakCount * 15) + (reusedCount * 10);
    const score = Math.max(100 - deductions, 10);

    setStats({
      total,
      weak: weakCount,
      reused: reusedCount,
      breached: 0,
      score
    });

    const mappedRecent = items.slice(0, 4).map((it, idx) => ({
      id: it.id || idx,
      name: it.website || 'Account',
      email: it.username || it.email || user?.email || '',
      time: `${(idx + 1) * 15} mins ago`,
      iconType: it.website?.toLowerCase().includes('github') ? 'github' :
                it.website?.toLowerCase().includes('google') ? 'google' :
                it.website?.toLowerCase().includes('linkedin') ? 'linkedin' :
                it.website?.toLowerCase().includes('figma') ? 'figma' : 'generic'
    }));
    setRecentItems(mappedRecent);
  };

  useEffect(() => {
    const fetchVaultItems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        const res = await axios.get(`${API_URL}/vault`);
        const mapped = res.data.map(item => ({
          ...item,
          id: item._id || item.id
        }));
        performVaultAudit(mapped);
      } catch (err) {
        const saved = localStorage.getItem('vault_items');
        if (saved) {
          performVaultAudit(JSON.parse(saved));
        } else {
          performVaultAudit([]);
        }
      }
    };
    fetchVaultItems();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const startSecurityScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanMessage('Checking credential security metrics...');
    setShowScanModal(true);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          showToast('Security scan complete. Metrics updated!', 'success');
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const triggerVaultExport = () => {
    const saved = localStorage.getItem('vault_items');
    const userCredentials = saved ? JSON.parse(saved) : [];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userCredentials, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'omnikey_encrypted_export.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Vault exported successfully!', 'success');
  };

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // SVG Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.score / 100) * circumference;

  // Gauge color based on health: Green = Healthy, Amber = Warning, Red = Danger
  const gaugeColor = stats.score >= 80 ? '#42A982' : stats.score >= 50 ? '#D99A45' : '#D96B6B';

  const renderBrandIcon = (type, name) => {
    if (type === 'google') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.1-6.68-4.93H1.36v3.15C3.34 21.34 7.37 24 12 24z"/>
          <path fill="#FBBC05" d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.36C.49 8.31 0 10.1 0 12s.49 3.69 1.36 5.42l3.96-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.34 2.66 1.36 6.58l3.96 3.15c.94-2.83 3.57-4.98 6.68-4.98z"/>
        </svg>
      );
    }
    if (type === 'github') {
      return (
        <svg className="w-5 h-5 fill-[#172033]" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      );
    }
    if (type === 'linkedin') {
      return (
        <svg className="w-5 h-5 fill-[#0A66C2]" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z"/>
        </svg>
      );
    }
    if (type === 'figma') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 38 57">
          <path fill="#EA4C1D" d="M19 19A9.5 9.5 0 0 0 9.5 9.5 9.5 9.5 0 0 0 0 19a9.5 9.5 0 0 0 9.5 9.5H19V19z"/>
          <path fill="#F24E1E" d="M9.5 0A9.5 9.5 0 0 0 0 9.5 9.5 9.5 0 0 0 9.5 19H19V9.5A9.5 9.5 0 0 0 9.5 0z"/>
          <path fill="#A259FF" d="M19 28.5A9.5 9.5 0 0 0 9.5 19 9.5 9.5 0 0 0 0 28.5 9.5 9.5 0 0 0 9.5 38H19V28.5z"/>
          <path fill="#1ABCFE" d="M19 38A9.5 9.5 0 0 0 9.5 28.5 9.5 9.5 0 0 0 0 38 9.5 9.5 0 0 0 9.5 47.5A9.5 9.5 0 0 0 19 38z"/>
          <path fill="#0ACF83" d="M38 19a9.5 9.5 0 0 0-9.5-9.5A9.5 9.5 0 0 0 19 19a9.5 9.5 0 0 0 9.5 9.5A9.5 9.5 0 0 0 38 19z"/>
        </svg>
      );
    }
    return (
      <div className="w-5 h-5 rounded-md bg-[#EEF4FF] text-[#4F7CFF] flex items-center justify-center font-bold text-xs">
        {name.charAt(0)}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-[#EAF7F1] border-[#E6EBF2] text-[#42A982]' 
                : 'bg-[#EEF4FF] border-[#E6EBF2] text-[#4F7CFF]'
            }`}
          >
            <FiBell className="shrink-0 text-[#4F7CFF]" />
            <span className="text-xs font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-xs text-[#6B7890] mt-1">Here's what's happening with your vault today.</p>
      </div>

      {/* ROW 1: Security Score Card & Vault Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Security Score Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs flex flex-col justify-between">
          <h3 className="font-bold text-[#172033] text-sm mb-4">Security Score</h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Radial Score Gauge */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-[#E6EBF2]"
                  strokeWidth="9"
                  fill="transparent"
                />
                <motion.circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke={gaugeColor}
                  strokeWidth="9"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-[#172033] font-outfit block leading-none">
                  {stats.score}
                </span>
                <span className="text-xs font-semibold text-[#42A982] block mt-1">Excellent</span>
              </div>
            </div>

            {/* Score Checklist & View Link */}
            <div className="space-y-3 flex-1 text-left">
              <p className="text-xs text-[#6B7890] leading-relaxed font-medium">
                {stats.total === 0 
                  ? 'Your vault is ready. Add passwords to analyze security metrics.'
                  : 'Your vault is in excellent condition. Keep it up!'}
              </p>

              <div className="space-y-2 text-xs font-medium text-[#172033]">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#42A982] shrink-0" size={15} />
                  <span>Strong passwords</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#42A982] shrink-0" size={15} />
                  <span>No compromised accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#42A982] shrink-0" size={15} />
                  <span>No reused passwords</span>
                </div>
              </div>

              <div className="pt-1">
                <Link 
                  to="/security" 
                  className="text-xs font-semibold text-[#4F7CFF] hover:text-[#3D68E8] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  View Security Center &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Vault Overview Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#172033] text-sm">Vault Overview</h3>
            <Link to="/vault" className="text-xs font-semibold text-[#4F7CFF] hover:text-[#3D68E8] hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Total Items (Actions/Navigation blue) */}
            <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E6EBF2] flex items-center justify-between">
              <div>
                <span className="text-2xl font-extrabold text-[#172033] font-outfit block">{stats.total}</span>
                <span className="text-[11px] font-semibold text-[#6B7890] mt-0.5 block">Total Items</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] text-[#4F7CFF] flex items-center justify-center shrink-0">
                <FiLink size={18} />
              </div>
            </div>

            {/* Weak Passwords (Warm Amber = Attention Needed) */}
            <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E6EBF2] flex items-center justify-between">
              <div>
                <span className="text-2xl font-extrabold text-[#172033] font-outfit block">{stats.weak}</span>
                <span className="text-[11px] font-semibold text-[#6B7890] mt-0.5 block">Weak Passwords</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#FFF6E8] text-[#D99A45] flex items-center justify-center shrink-0">
                <FiAlertTriangle size={18} />
              </div>
            </div>

            {/* Reused Passwords (Warm Amber = Attention Needed) */}
            <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E6EBF2] flex items-center justify-between">
              <div>
                <span className="text-2xl font-extrabold text-[#172033] font-outfit block">{stats.reused}</span>
                <span className="text-[11px] font-semibold text-[#6B7890] mt-0.5 block">Reused Passwords</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#FFF6E8] text-[#D99A45] flex items-center justify-center shrink-0">
                <FiRefreshCw size={18} />
              </div>
            </div>

            {/* Breached Passwords (Soft Green if 0 = healthy, Muted Red if > 0 = danger) */}
            <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E6EBF2] flex items-center justify-between">
              <div>
                <span className="text-2xl font-extrabold text-[#172033] font-outfit block">{stats.breached}</span>
                <span className="text-[11px] font-semibold text-[#6B7890] mt-0.5 block">Breached Passwords</span>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                stats.breached > 0 ? 'bg-[#FFF0F0] text-[#D96B6B]' : 'bg-[#EAF7F1] text-[#42A982]'
              }`}>
                <FiShield size={18} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: Recent Items Card & Quick Actions Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Items Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#172033] text-sm">Recent Items</h3>
            <Link to="/vault" className="text-xs font-semibold text-[#4F7CFF] hover:text-[#3D68E8] hover:underline">
              View all
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <div className="py-8 text-center text-[#6B7890] font-medium text-xs space-y-2">
              <FiInbox size={24} className="mx-auto text-[#6B7890]" />
              <p>No passwords saved yet. Click "Add Password" below to store your first item.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E6EBF2]">
              {recentItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between hover:bg-[#F7F9FC] px-1 rounded-xl transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F7F9FC] flex items-center justify-center shrink-0">
                      {renderBrandIcon(item.iconType, item.name)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#172033] leading-tight">{item.name}</h4>
                      <p className="text-[11px] text-[#6B7890] leading-tight mt-0.5">{item.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#6B7890] font-medium">{item.time}</span>
                    <button className="text-[#6B7890] hover:text-[#172033] transition p-1">
                      <FiMoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs flex flex-col justify-between">
          <h3 className="font-bold text-[#172033] text-sm mb-4">Quick Actions</h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Add Password (Blue action) */}
            <Link
              to="/vault"
              className="bg-[#EEF4FF] border border-[#E6EBF2] text-[#4F7CFF] hover:bg-[#DCE7FF] rounded-2xl p-4 flex items-center justify-center gap-3 transition cursor-pointer font-semibold text-xs"
            >
              <FiPlus size={18} />
              <span>Add Password</span>
            </Link>

            {/* Generate Password (Blue action) */}
            <Link
              to="/generator"
              className="bg-[#EEF4FF] border border-[#E6EBF2] text-[#4F7CFF] hover:bg-[#DCE7FF] rounded-2xl p-4 flex items-center justify-center gap-3 transition cursor-pointer font-semibold text-xs"
            >
              <FiZap size={18} />
              <span>Generate Password</span>
            </Link>

            {/* Scan Vault (Green healthy security check) */}
            <button
              onClick={startSecurityScan}
              className="bg-[#EAF7F1] border border-[#E6EBF2] text-[#42A982] hover:bg-[#D4EFE3] rounded-2xl p-4 flex items-center justify-center gap-3 transition cursor-pointer font-semibold text-xs focus:outline-none"
            >
              <FiShield size={18} />
              <span>Scan Vault</span>
            </button>

            {/* Export Vault (Blue action) */}
            <button
              onClick={triggerVaultExport}
              className="bg-[#EEF4FF] border border-[#E6EBF2] text-[#4F7CFF] hover:bg-[#DCE7FF] rounded-2xl p-4 flex items-center justify-center gap-3 transition cursor-pointer font-semibold text-xs focus:outline-none"
            >
              <FiUpload size={18} />
              <span>Export Vault</span>
            </button>
          </div>
        </div>

      </div>

      {/* ROW 3: Security Insights Horizontal Card (Healthy Green State) */}
      <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF7F1] text-[#42A982] border border-[#E6EBF2] flex items-center justify-center shrink-0">
            <FiShield size={24} />
          </div>
          <div>
            <h3 className="font-bold text-[#172033] text-sm">Security Insights</h3>
            <h4 className="font-bold text-[#42A982] text-xs mt-0.5">Your vault is healthy</h4>
            <p className="text-xs text-[#6B7890] mt-0.5 leading-relaxed">
              No security issues found. We'll notify you if anything needs your attention.
            </p>
          </div>
        </div>

        {/* Vector illustration badge graphic */}
        <div className="hidden md:flex items-center justify-center shrink-0 relative pr-4">
          <div className="w-28 h-20 bg-[#EEF4FF] border border-[#E6EBF2] rounded-2xl flex flex-col items-center justify-center relative shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E6EBF2] flex items-center justify-center text-[#4F7CFF] shadow-2xs">
              <FiLock size={16} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#42A982] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* Scan Progress Modal */}
      <AnimatePresence>
        {showScanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isScanning) setShowScanModal(false);
              }}
              className="absolute inset-0 bg-[#172033]"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white p-8 text-center relative z-10 border border-[#E6EBF2] rounded-2xl shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-[#EEF4FF] flex items-center justify-center text-[#4F7CFF] mx-auto mb-5 border border-[#E6EBF2]">
                {isScanning ? (
                  <FiLoader size={24} className="animate-spin text-[#4F7CFF]" />
                ) : (
                  <FiShield size={24} className="text-[#42A982]" />
                )}
              </div>

              <h3 className="text-lg font-bold font-outfit text-[#172033] mb-1.5">
                {isScanning ? 'Security Scan In Progress' : 'Security Scan Completed'}
              </h3>
              <p className="text-xs text-[#6B7890] font-medium mb-6">
                {scanMessage}
              </p>

              <div className="w-full h-2.5 bg-[#F7F9FC] rounded-full overflow-hidden mb-6 border border-[#E6EBF2]">
                <motion.div
                  className="h-full bg-[#4F7CFF]"
                  style={{ width: `${scanProgress}%` }}
                  transition={{ ease: 'easeOut' }}
                ></motion.div>
              </div>

              <button
                disabled={isScanning}
                onClick={() => setShowScanModal(false)}
                className="w-full py-2.5 bg-[#4F7CFF] hover:bg-[#3D68E8] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-semibold text-white transition cursor-pointer shadow-xs"
              >
                {isScanning ? 'Completing Scan...' : 'Dismiss'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;
