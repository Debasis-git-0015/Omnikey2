import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShield, 
  FiAlertTriangle, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiInfo, 
  FiKey,
  FiActivity,
  FiArrowRight,
  FiLoader,
  FiLock,
  FiCopy,
  FiBell
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const SecurityCenter = () => {
  // Vault data
  const [vaultItems, setVaultItems] = useState([]);
  
  // Audited metrics states
  const [auditStats, setAuditStats] = useState({
    score: 100,
    total: 0,
    weak: [],
    reused: {},
    safeCount: 0
  });

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showScanOverlay, setShowScanOverlay] = useState(false);

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

  // Load and audit local vault items
  const performVaultAudit = (itemsList) => {
    const items = itemsList || [];
    
    // 1. Calculate entropy for each password
    const getEntropy = (pass) => {
      if (!pass) return 0;
      let poolSize = 0;
      if (/[a-z]/.test(pass)) poolSize += 26;
      if (/[A-Z]/.test(pass)) poolSize += 26;
      if (/[0-9]/.test(pass)) poolSize += 10;
      if (/[^A-Za-z0-9]/.test(pass)) poolSize += 29;
      return Math.floor(pass.length * Math.log2(poolSize || 1));
    };

    const weakItems = [];
    const passwordGroups = {};

    items.forEach(item => {
      const entropy = getEntropy(item.password);
      if (entropy < 45) {
        weakItems.push({ ...item, entropy });
      }

      if (item.password) {
        if (!passwordGroups[item.password]) {
          passwordGroups[item.password] = [];
        }
        passwordGroups[item.password].push(item);
      }
    });

    // 2. Identify reused passwords
    const duplicateGroups = {};
    Object.keys(passwordGroups).forEach(pass => {
      if (passwordGroups[pass].length > 1) {
        duplicateGroups[pass] = passwordGroups[pass];
      }
    });

    const reusedCount = Object.values(duplicateGroups).reduce((acc, grp) => acc + grp.length, 0);

    // 3. Compute overall Health Score
    const deductions = (weakItems.length * 15) + (reusedCount * 10);
    const score = Math.max(100 - deductions, 10);

    // Safe items
    const reusedItemIds = new Set(Object.values(duplicateGroups).flatMap(grp => grp.map(it => it.id || it._id)));
    const weakItemIds = new Set(weakItems.map(it => it.id || it._id));
    const safeCount = items.filter(it => !reusedItemIds.has(it.id || it._id) && !weakItemIds.has(it.id || it._id)).length;

    setAuditStats({
      score: items.length > 0 ? score : 100,
      total: items.length,
      weak: weakItems,
      reused: duplicateGroups,
      safeCount
    });
  };

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
      setVaultItems(mapped);
      performVaultAudit(mapped);
    } catch (err) {
      console.warn('Security Center: API fetch failed, loading from local storage cache:', err);
      const saved = localStorage.getItem('vault_items');
      let items = [];
      if (saved) {
        items = JSON.parse(saved);
      } else {
        items = [];
      }
      setVaultItems(items);
      performVaultAudit(items);
    }
  };

  useEffect(() => {
    fetchVaultItems();
  }, []);

  const startAuditScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setShowScanOverlay(true);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          fetchVaultItems();
          showToast('Security audit scan completed successfully.', 'success');
          return 100;
        }
        const step = Math.floor(Math.random() * 20) + 10;
        return Math.min(prev + step, 100);
      });
    }, 400);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (auditStats.score / 100) * circumference;

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900 tracking-tight">Security Center</h1>
          <p className="text-slate-500 text-sm mt-1">Audit password strength, isolate reused credentials, and manage vault health.</p>
        </div>
        <button
          onClick={startAuditScan}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <FiRefreshCw size={16} /> Run Diagnostics Audit
        </button>
      </div>

      {/* Metric Gauge & Summary Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radial Health Gauge Card */}
        <div className="bg-white border border-slate-200/80 shadow-xs p-6 md:p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-5">
          <h3 className="text-sm font-bold font-outfit text-slate-900 uppercase tracking-wider">Vault Security Score</h3>
          
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                className={
                  auditStats.score >= 80 ? 'stroke-emerald-500' :
                  auditStats.score >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                }
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute">
              <span className="text-4xl font-extrabold text-slate-900 font-outfit">{auditStats.score}%</span>
              <span className="block text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-0.5">Integrity</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-outfit leading-relaxed max-w-[200px]">
            {auditStats.score === 100 
              ? 'Excellent vault protection level. No issues found.' 
              : 'Action suggested. Update weak and duplicate credentials to improve score.'}
          </p>
        </div>

        {/* Audit Stats Breakdown Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 shadow-xs p-6 md:p-8 rounded-2xl space-y-6 text-left">
          <h3 className="text-sm font-bold text-slate-900 font-outfit uppercase tracking-wider">Diagnostics Summary</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Items</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1 font-outfit">{auditStats.total}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Weak Items</span>
              <span className="text-2xl font-bold text-rose-600 block mt-1 font-outfit">{auditStats.weak.length}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Reused Items</span>
              <span className="text-2xl font-bold text-amber-600 block mt-1 font-outfit">
                {Object.values(auditStats.reused).reduce((acc, grp) => acc + grp.length, 0)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Safe Items</span>
              <span className="text-2xl font-bold text-emerald-600 block mt-1 font-outfit">{auditStats.safeCount}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3 items-start">
            <FiInfo size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase">Vault Analysis</h4>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                {auditStats.weak.length > 0 || Object.keys(auditStats.reused).length > 0
                  ? `Found suggestions for ${auditStats.weak.length + Object.keys(auditStats.reused).length} credentials. Updating them will increase your overall score.`
                  : 'Zero vulnerabilities detected. Maintain security standards.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Threats audit details: Weak Passwords & Reused Passwords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weak items list card */}
        <div className="bg-white border border-slate-200/80 shadow-xs p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-3.5 mb-4">
              <FiAlertTriangle className="text-rose-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-outfit">Weak Credentials</h3>
            </div>

            {auditStats.weak.length === 0 ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <FiCheckCircle size={24} className="text-emerald-600" />
                <span className="text-xs font-medium">No weak passwords detected.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {auditStats.weak.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition">
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-slate-900 truncate">{item.website}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.username || item.email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-semibold text-rose-700 border border-rose-200 bg-rose-50 px-2 py-0.5 rounded-md">
                        {item.entropy} bits
                      </span>
                      <Link
                        to="/vault"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-[10px] font-semibold tracking-wider text-white uppercase transition shadow-2xs"
                      >
                        Fix
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reused duplicate items list card */}
        <div className="bg-white border border-slate-200/80 shadow-xs p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-3.5 mb-4">
              <FiLock className="text-amber-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-outfit">Reused Credentials</h3>
            </div>

            {Object.keys(auditStats.reused).length === 0 ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <FiCheckCircle size={24} className="text-emerald-600" />
                <span className="text-xs font-medium">No duplicate passwords detected.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {Object.entries(auditStats.reused).map(([passwordKey, groupItems], groupIndex) => (
                  <div key={groupIndex} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-left">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-200/60 pb-1.5 font-semibold">
                      <span className="text-amber-700 uppercase">Reuse Group #{groupIndex + 1}</span>
                      <button
                        onClick={() => copyToClipboard(passwordKey, 'Duplicate Password')}
                        className="text-slate-400 hover:text-slate-700 transition"
                        title="Copy Password"
                      >
                        <FiCopy size={12} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {groupItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-900 font-semibold">{item.website}</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{item.username || item.email}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-1.5 text-right">
                      <Link
                        to="/vault"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase transition"
                      >
                        Fix Duplicates <FiArrowRight />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Interactive Scan Loading Overlay */}
      <AnimatePresence>
        {showScanOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isScanning) setShowScanOverlay(false);
              }}
              className="absolute inset-0 bg-slate-900"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white p-8 text-center relative z-10 border border-slate-200 rounded-2xl shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-5 border border-blue-100">
                {isScanning ? (
                  <FiLoader size={24} className="animate-spin text-blue-600" />
                ) : (
                  <FiShield size={24} className="text-emerald-600" />
                )}
              </div>

              <h3 className="text-lg font-bold font-outfit text-slate-900 mb-1.5">
                {isScanning ? 'Auditing Vault Database' : 'Scan Audit Completed'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">
                {isScanning ? `Evaluating credential logs... ${scanProgress}%` : 'Vault audit finished.'}
              </p>

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                <motion.div
                  className="h-full bg-blue-600"
                  style={{ width: `${scanProgress}%` }}
                  transition={{ ease: 'easeOut' }}
                ></motion.div>
              </div>

              <button
                disabled={isScanning}
                onClick={() => setShowScanOverlay(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-semibold text-white transition cursor-pointer shadow-xs"
              >
                {isScanning ? 'Scanning...' : 'Dismiss'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SecurityCenter;
