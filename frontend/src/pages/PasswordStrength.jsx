import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, 
  FiShield, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiEye, 
  FiEyeOff, 
  FiLock, 
  FiCopy, 
  FiRefreshCw, 
  FiInfo,
  FiZap,
  FiTerminal,
  FiHelpCircle
} from 'react-icons/fi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const PasswordStrength = () => {
  const [password, setPassword] = useState('SecurePass#2026!');
  const [showPassword, setShowPassword] = useState(true);
  const [vaultItems, setVaultItems] = useState([]);
  const [selectedVaultId, setSelectedVaultId] = useState('');
  const [toast, setToast] = useState(null);

  // Fetch saved vault items safely
  useEffect(() => {
    const fetchVaultItems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        const res = await axios.get(`${API_URL}/vault`);
        if (Array.isArray(res.data)) {
          const mapped = res.data.map(item => ({
            ...item,
            id: item._id || item.id
          }));
          setVaultItems(mapped);
        } else {
          setVaultItems([]);
        }
      } catch (err) {
        try {
          const saved = localStorage.getItem('vault_items');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setVaultItems(parsed);
            } else {
              setVaultItems([]);
            }
          }
        } catch (e) {
          setVaultItems([]);
        }
      }
    };
    fetchVaultItems();
  }, []);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    showToast('Password copied to clipboard!', 'success');
  };

  /**
   * Safe NIST SP 800-63B & zxcvbn Entropy & Crack Time Estimator
   */
  const calculateMetrics = (pass) => {
    const safePass = pass || '';
    if (safePass.length === 0) {
      return {
        length: 0,
        poolSize: 0,
        entropyBits: 0,
        score: 0,
        grade: 'Empty',
        color: 'text-[#6B7890]',
        bgColor: 'bg-[#F7F9FC]',
        badgeBg: 'bg-[#F7F9FC]',
        badgeText: 'text-[#6B7890]',
        timeSlowHash: 'Instantly (< 1 sec)',
        timeOnline: 'Instantly (< 1 sec)',
        checks: {
          hasLower: false,
          hasUpper: false,
          hasNumber: false,
          hasSymbol: false,
          isLong: false,
          noCommon: true,
          noRepeat: true
        },
        warnings: []
      };
    }

    const hasLower = /[a-z]/.test(safePass);
    const hasUpper = /[A-Z]/.test(safePass);
    const hasNumber = /[0-9]/.test(safePass);
    const hasSymbol = /[^A-Za-z0-9]/.test(safePass);

    let poolSize = 0;
    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasNumber) poolSize += 10;
    if (hasSymbol) poolSize += 33;

    const length = safePass.length;
    const lowerPass = safePass.toLowerCase();

    // Common pattern & dictionary detection
    const warnings = [];
    const commonPasswords = [
      'password', '123456', '12345678', '123456789', '12345', 'qwerty', 
      'admin', 'welcome', 'letmein', 'monkey', 'dragon', 'master', 
      'sridhar', 'secret', 'login', 'god', 'abc123', 'password1'
    ];

    let isCommonWord = false;
    let matchedWord = '';
    commonPasswords.forEach(pat => {
      if (lowerPass.includes(pat)) {
        isCommonWord = true;
        matchedWord = pat;
        if (!warnings.includes(`Contains common pattern "${pat}"`)) {
          warnings.push(`Contains common pattern "${pat}"`);
        }
      }
    });

    const hasRepeat = /(.)\1{2,}/.test(safePass);
    if (hasRepeat) {
      warnings.push('Contains repeating character sequences (e.g. "aaa" or "111")');
    }

    if (length < 8) {
      warnings.push('Length is under 8 characters (extremely vulnerable)');
    } else if (length < 12) {
      warnings.push('Length is under 12 characters (NIST recommends 12+ characters)');
    }

    // Effective Entropy Calculation (in bits)
    let entropyBits = length * Math.log2(poolSize || 1);

    // Apply dictionary & structural penalties
    if (isCommonWord) {
      const remainingLength = Math.max(0, length - matchedWord.length);
      entropyBits = 10 + (remainingLength * Math.log2(poolSize || 1));
    }
    if (hasRepeat) {
      entropyBits = Math.max(5, entropyBits - 12);
    }
    if (!hasUpper && !hasSymbol) {
      entropyBits = Math.max(5, entropyBits - 8);
    }

    entropyBits = Math.max(0, Math.floor(entropyBits));

    // Number of average guesses needed: G = 2^entropyBits / 2
    const totalGuesses = Math.pow(2, entropyBits) / 2;

    // Crack Rates:
    // Slow Vault KDF Attack (PBKDF2/Bcrypt): 10,000 guesses/sec
    // Online Web Login Attack: 10 guesses / min (0.166 guesses/sec)

    const formatTime = (guesses, ratePerSec) => {
      if (guesses <= 10) return 'Instantly (< 1 sec)';
      
      const seconds = guesses / ratePerSec;

      if (seconds < 1) return 'Instantly (< 1 sec)';
      if (seconds < 60) return `${Math.round(seconds)} second${Math.round(seconds) > 1 ? 's' : ''}`;
      if (seconds < 3600) return `${Math.round(seconds / 60)} minute${Math.round(seconds / 60) > 1 ? 's' : ''}`;
      if (seconds < 86400) return `${Math.round(seconds / 3600)} hour${Math.round(seconds / 3600) > 1 ? 's' : ''}`;
      if (seconds < 31536000) return `${Math.round(seconds / 86400)} day${Math.round(seconds / 86400) > 1 ? 's' : ''}`;
      
      const years = Math.round(seconds / 31536000);
      if (years < 1000) return `${years} year${years > 1 ? 's' : ''}`;
      if (years < 1000000) return `${years.toLocaleString()} years`;
      if (years < 1000000000) return `${(years / 1000000).toFixed(1)} million years`;
      return '1.0+ billion years (Uncrackable)';
    };

    const timeSlowHash = formatTime(totalGuesses, 10000);
    const timeOnline = formatTime(totalGuesses, 0.166);

    // Score evaluation (0 - 100)
    let score = Math.min(100, Math.floor((entropyBits / 75) * 100));
    if (isCommonWord && length < 10) score = Math.min(score, 15);
    if (length < 6) score = Math.min(score, 10);

    let grade = 'Strong';
    let color = 'text-[#42A982]';
    let bgColor = 'bg-[#42A982]';
    let badgeBg = 'bg-[#EAF7F1]';
    let badgeText = 'text-[#42A982]';

    if (score < 25 || entropyBits < 25) {
      grade = 'Very Weak';
      color = 'text-[#D96B6B]';
      bgColor = 'bg-[#D96B6B]';
      badgeBg = 'bg-[#FFF0F0]';
      badgeText = 'text-[#D96B6B]';
    } else if (score < 50 || entropyBits < 45) {
      grade = 'Weak';
      color = 'text-[#D99A45]';
      bgColor = 'bg-[#D99A45]';
      badgeBg = 'bg-[#FFF6E8]';
      badgeText = 'text-[#D99A45]';
    } else if (score < 75 || entropyBits < 65) {
      grade = 'Good';
      color = 'text-[#4F7CFF]';
      bgColor = 'bg-[#4F7CFF]';
      badgeBg = 'bg-[#EEF4FF]';
      badgeText = 'text-[#4F7CFF]';
    }

    return {
      length,
      poolSize,
      entropyBits,
      score,
      grade,
      color,
      bgColor,
      badgeBg,
      badgeText,
      timeSlowHash,
      timeOnline,
      checks: {
        hasLower,
        hasUpper,
        hasNumber,
        hasSymbol,
        isLong: length >= 12,
        noCommon: !isCommonWord,
        noRepeat: !hasRepeat
      },
      warnings
    };
  };

  const metrics = calculateMetrics(password);

  const handleSelectVaultItem = (e) => {
    const id = e.target.value;
    setSelectedVaultId(id);
    if (Array.isArray(vaultItems)) {
      const item = vaultItems.find(it => (it.id === id || it._id === id));
      if (item && item.password) {
        setPassword(item.password);
        showToast(`Loaded password for ${item.website}`, 'info');
      }
    }
  };

  return (
    <div className="space-y-8 relative text-left">
      
      {/* Toast Notification Alert */}
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
            <FiInfo className="shrink-0 text-[#4F7CFF]" />
            <span className="text-xs font-semibold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-outfit text-[#172033] tracking-tight">
          Password Strength & Crack Time Estimator
        </h1>
        <p className="text-[#6B7890] text-xs sm:text-sm mt-1">
          Industry-standard NIST SP 800-63B & zxcvbn entropy calculation algorithm across slow hash rates and online attempts.
        </p>
      </div>

      {/* Vault Item Picker & Interactive Password Input Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs space-y-6">
        
        {/* Selector for Saved Vault Items */}
        {Array.isArray(vaultItems) && vaultItems.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider">
              Test a Saved Password from Your Vault
            </label>
            <select
              value={selectedVaultId}
              onChange={handleSelectVaultItem}
              className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-xs cursor-pointer focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
            >
              <option value="">-- Select a saved credential to test --</option>
              {vaultItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.website} ({item.username || item.email || 'No Username'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Live Password Input Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider">
              Enter Password to Audit
            </label>
            <button
              onClick={copyToClipboard}
              className="text-xs font-semibold text-[#4F7CFF] hover:text-[#3D68E8] transition focus:outline-none flex items-center gap-1"
            >
              <FiCopy size={13} /> Copy
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type or paste any password..."
              className="w-full pl-4 pr-12 py-3.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm font-mono focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7890] hover:text-[#172033] transition focus:outline-none"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          {/* Visual Progress Score Bar */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#6B7890]">Entropy Strength Rating:</span>
              <span className={metrics.color}>{metrics.grade} ({metrics.score}/100)</span>
            </div>
            <div className="w-full h-2 bg-[#F7F9FC] rounded-full overflow-hidden border border-[#E6EBF2]">
              <motion.div
                className={`h-full ${metrics.bgColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.score}%` }}
                transition={{ duration: 0.3 }}
              ></motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Estimated Time to Crack Cards (2 Standard Cryptographic Scenarios) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Scenario 1: Slow Hash KDF Rate */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-[#6B7890] uppercase tracking-wider block">
                Vault KDF Slow Hash
              </span>
              <span className="text-[10px] text-[#6B7890] font-mono">PBKDF2 / Bcrypt / Argon2id</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EAF7F1] text-[#42A982] flex items-center justify-center shrink-0 border border-[#E6EBF2]">
              <FiShield size={18} />
            </div>
          </div>

          <div>
            <h3 className={`text-2xl font-extrabold font-outfit tracking-tight ${metrics.color}`}>
              {metrics.timeSlowHash}
            </h3>
            <p className="text-xs text-[#6B7890] mt-1">
              Time to crack when protected by key derivation functions (10,000 guesses/sec).
            </p>
          </div>
        </div>

        {/* Scenario 2: Online Throttled Web Login */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-[#6B7890] uppercase tracking-wider block">
                Online Web Login
              </span>
              <span className="text-[10px] text-[#6B7890] font-mono">Rate-Limited Attempts</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] text-[#4F7CFF] flex items-center justify-center shrink-0 border border-[#E6EBF2]">
              <FiClock size={18} />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-extrabold font-outfit text-[#172033] tracking-tight">
              {metrics.timeOnline}
            </h3>
            <p className="text-xs text-[#6B7890] mt-1">
              Time required when attempting online logins against rate-limited authentication portals.
            </p>
          </div>
        </div>

      </div>

      {/* Grid Row 2: Character Breakdown & Vulnerability Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Composition Checklist Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs space-y-5">
          <div className="flex justify-between items-center border-b border-[#E6EBF2] pb-3">
            <h3 className="font-bold text-[#172033] text-sm">Character Composition Analysis</h3>
            <span className="text-xs font-mono font-semibold text-[#4F7CFF] bg-[#EEF4FF] px-2.5 py-1 rounded-lg">
              {metrics.entropyBits} bits entropy
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-[#172033]">
                {metrics.checks.isLong ? (
                  <FiCheckCircle className="text-[#42A982]" size={16} />
                ) : (
                  <FiAlertTriangle className="text-[#D99A45]" size={16} />
                )}
                Length Requirement (12+ chars)
              </span>
              <span className="text-[#6B7890] font-mono">{metrics.length} characters</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-[#172033]">
                {metrics.checks.hasLower ? (
                  <FiCheckCircle className="text-[#42A982]" size={16} />
                ) : (
                  <FiAlertTriangle className="text-[#D99A45]" size={16} />
                )}
                Lowercase Letters (a-z)
              </span>
              <span className="text-[#6B7890] font-mono">{metrics.checks.hasLower ? 'Included' : 'Missing'}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-[#172033]">
                {metrics.checks.hasUpper ? (
                  <FiCheckCircle className="text-[#42A982]" size={16} />
                ) : (
                  <FiAlertTriangle className="text-[#D99A45]" size={16} />
                )}
                Uppercase Letters (A-Z)
              </span>
              <span className="text-[#6B7890] font-mono">{metrics.checks.hasUpper ? 'Included' : 'Missing'}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-[#172033]">
                {metrics.checks.hasNumber ? (
                  <FiCheckCircle className="text-[#42A982]" size={16} />
                ) : (
                  <FiAlertTriangle className="text-[#D99A45]" size={16} />
                )}
                Numeric Digits (0-9)
              </span>
              <span className="text-[#6B7890] font-mono">{metrics.checks.hasNumber ? 'Included' : 'Missing'}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-[#172033]">
                {metrics.checks.hasSymbol ? (
                  <FiCheckCircle className="text-[#42A982]" size={16} />
                ) : (
                  <FiAlertTriangle className="text-[#D99A45]" size={16} />
                )}
                Special Symbols (!@#$)
              </span>
              <span className="text-[#6B7890] font-mono">{metrics.checks.hasSymbol ? 'Included' : 'Missing'}</span>
            </div>
          </div>
        </div>

        {/* Vulnerability Warnings & Recommendations Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs space-y-5">
          <div className="flex justify-between items-center border-b border-[#E6EBF2] pb-3">
            <h3 className="font-bold text-[#172033] text-sm">Security Audit Findings</h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${metrics.badgeBg} ${metrics.badgeText}`}>
              {metrics.warnings.length === 0 ? 'Optimal' : `${metrics.warnings.length} Warning(s)`}
            </span>
          </div>

          {metrics.warnings.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#EAF7F1] text-[#42A982] flex items-center justify-center mx-auto">
                <FiCheckCircle size={20} />
              </div>
              <h4 className="text-xs font-bold text-[#172033]">No Vulnerabilities Detected</h4>
              <p className="text-xs text-[#6B7890] max-w-sm mx-auto leading-relaxed">
                This password has excellent entropy and is highly resistant to brute-force dictionary attacks.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.warnings.map((warn, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#FFF6E8] border border-[#E6EBF2] flex items-start gap-2.5">
                  <FiAlertTriangle className="text-[#D99A45] shrink-0 mt-0.5" size={16} />
                  <span className="text-xs font-semibold text-[#172033] leading-relaxed">{warn}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Explanatory Technical Methodology Info Box */}
      <div className="bg-white rounded-2xl p-6 border border-[#E6EBF2] shadow-2xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#4F7CFF] flex items-center justify-center shrink-0 border border-[#E6EBF2]">
          <FiHelpCircle size={20} />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-[#172033]">About the Calculation Method</h4>
          <p className="text-[#6B7890] leading-relaxed">
            Omnikey implements NIST SP 800-63B guidelines combined with pattern-aware entropy estimation (H = L * log2(P)). The average number of attempts needed is G = 2^(H - 1). Crack time is calculated by testing search space against industry-standard offline key derivation benchmarks (PBKDF2/Bcrypt @ 10k/sec) and rate-limited web login attempts.
          </p>
        </div>
      </div>

    </div>
  );
};

export default PasswordStrength;
