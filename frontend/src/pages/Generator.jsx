import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCpu, 
  FiCopy, 
  FiRefreshCw, 
  FiEye, 
  FiEyeOff, 
  FiShield, 
  FiClock, 
  FiTrash, 
  FiCheckCircle, 
  FiInfo,
  FiBell
} from 'react-icons/fi';

const Generator = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
  // Visibility toggling
  const [hidePassword, setHidePassword] = useState(false);

  // History tracking (synced from localStorage)
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('generator_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('generator_history', JSON.stringify(history));
  }, [history]);

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

  // Password Generator logic
  const handleGenerate = () => {
    const uppercaseSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseSet = 'abcdefghijklmnopqrstuvwxyz';
    const numbersSet = '0123456789';
    const symbolsSet = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let charPool = '';
    let mandatoryChars = [];

    if (includeUppercase) {
      charPool += uppercaseSet;
      mandatoryChars.push(uppercaseSet.charAt(Math.floor(Math.random() * uppercaseSet.length)));
    }
    if (includeLowercase) {
      charPool += lowercaseSet;
      mandatoryChars.push(lowercaseSet.charAt(Math.floor(Math.random() * lowercaseSet.length)));
    }
    if (includeNumbers) {
      charPool += numbersSet;
      mandatoryChars.push(numbersSet.charAt(Math.floor(Math.random() * numbersSet.length)));
    }
    if (includeSymbols) {
      charPool += symbolsSet;
      mandatoryChars.push(symbolsSet.charAt(Math.floor(Math.random() * symbolsSet.length)));
    }

    if (!charPool) {
      showToast('Select at least one character set.', 'error');
      return;
    }

    let generatedPassword = '';
    generatedPassword += mandatoryChars.join('');

    const remainingLength = length - mandatoryChars.length;
    for (let i = 0; i < remainingLength; i++) {
      generatedPassword += charPool.charAt(Math.floor(Math.random() * charPool.length));
    }

    const passwordArray = generatedPassword.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    const finalPassword = passwordArray.join('');
    setPassword(finalPassword);

    setHistory(prev => {
      const filtered = prev.filter(item => item !== finalPassword);
      return [finalPassword, ...filtered].slice(0, 5);
    });
  };

  useEffect(() => {
    handleGenerate();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const getPasswordEntropy = (pass) => {
    if (!pass) return { score: 0, rating: 'Empty', color: 'bg-slate-100 text-slate-700 border-slate-200', text: 'n/a', suggestions: [] };
    
    let poolSize = 0;
    if (/[a-z]/.test(pass)) poolSize += 26;
    if (/[A-Z]/.test(pass)) poolSize += 26;
    if (/[0-9]/.test(pass)) poolSize += 10;
    if (/[^A-Za-z0-9]/.test(pass)) poolSize += 29;

    const entropyBits = Math.floor(pass.length * Math.log2(poolSize || 1));
    
    let rating = 'Weak';
    let color = 'bg-rose-50 text-rose-700 border-rose-200';
    let crackTime = 'Instantly';
    let suggestions = [];

    if (entropyBits >= 80) {
      rating = 'Very Strong';
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      crackTime = '12 Trillion Centuries';
      suggestions = ['Excellent entropy. Virtually uncrackable with current technology.'];
    } else if (entropyBits >= 60) {
      rating = 'Strong';
      color = 'bg-blue-50 text-blue-700 border-blue-200';
      crackTime = '1.4 Million Years';
      suggestions = ['Great complexity. Suitable for protecting important accounts.'];
    } else if (entropyBits >= 40) {
      rating = 'Moderate';
      color = 'bg-amber-50 text-amber-700 border-amber-200';
      crackTime = '3 Months';
      suggestions = ['Reasonable complexity. Consider increasing length to 16+ characters.'];
    } else {
      rating = 'Vulnerable';
      color = 'bg-rose-50 text-rose-700 border-rose-200';
      crackTime = 'Instantly';
      suggestions = ['Low complexity. Enable numbers/symbols and slide to 12+ characters.'];
    }

    return {
      score: entropyBits,
      rating,
      color,
      crackTime,
      suggestions
    };
  };

  const metrics = getPasswordEntropy(password);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  const clearHistory = () => {
    setHistory([]);
    showToast('History log cleared.', 'info');
  };

  return (
    <div className="space-y-8 relative text-left">
      
      {/* Toast Feedback popup */}
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

      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900 tracking-tight">Password Generator</h1>
          <p className="text-slate-500 text-sm mt-1">Generate strong, secure passwords instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column containing Generator Control card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 shadow-xs p-6 md:p-8 rounded-2xl space-y-6">
            
            {/* Output Display box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
              <input
                type={hidePassword ? 'password' : 'text'}
                value={password}
                readOnly
                className="bg-transparent border-none text-base sm:text-xl font-mono text-slate-900 focus:outline-none w-full select-all font-semibold"
              />
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setHidePassword(!hidePassword)}
                  className="p-2 text-slate-500 hover:text-slate-800 transition focus:outline-none rounded-lg hover:bg-slate-200/50"
                  title="Toggle Visibility"
                >
                  {hidePassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                </button>
                <button
                  onClick={handleGenerate}
                  className="p-2 text-slate-500 hover:text-slate-800 transition focus:outline-none rounded-lg hover:bg-slate-200/50"
                  title="Regenerate Password"
                >
                  <FiRefreshCw size={18} className="hover:rotate-180 transition duration-300" />
                </button>
                <button
                  onClick={() => copyToClipboard(password, 'Password')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs text-xs font-semibold flex items-center gap-1.5 focus:outline-none cursor-pointer"
                  title="Copy Password"
                >
                  <FiCopy size={15} /> Copy
                </button>
              </div>
            </div>

            {/* Slider & Selectors */}
            <div className="space-y-6">
              
              {/* Length Slider control */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-semibold uppercase tracking-wider">Password Length</span>
                  <span className="text-slate-900 font-bold text-sm bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">{length} chars</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="50"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Character set checkboxes */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Character Settings</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Uppercase (A-Z)', val: includeUppercase, set: setIncludeUppercase },
                    { label: 'Lowercase (a-z)', val: includeLowercase, set: setIncludeLowercase },
                    { label: 'Numbers (0-9)', val: includeNumbers, set: setIncludeNumbers },
                    { label: 'Symbols (!@#$)', val: includeSymbols, set: setIncludeSymbols },
                  ].map((chk, idx) => (
                    <label 
                      key={idx} 
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-100/80 transition cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={chk.val}
                        onChange={(e) => chk.set(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-slate-700">{chk.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Diagnostics report */}
          <div className="bg-white border border-slate-200/80 shadow-xs p-6 md:p-8 rounded-2xl space-y-6">
            <h3 className="text-sm font-bold font-outfit text-slate-900 uppercase tracking-wider">Security Diagnostics</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Rating</span>
                <span className={`inline-block text-xs font-bold border px-2.5 py-1 rounded-md mt-2 ${metrics.color}`}>
                  {metrics.rating}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Entropy</span>
                <span className="text-lg font-bold text-slate-900 block mt-1 font-outfit">{metrics.score} bits</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Crack Estimate</span>
                <span className="text-xs font-semibold text-slate-800 mt-2 block font-outfit flex items-center gap-1.5">
                  <FiClock className="text-slate-400" /> {metrics.crackTime}
                </span>
              </div>

            </div>

            {metrics.suggestions.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3 items-start">
                <FiInfo size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase">Suggestion</h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">{metrics.suggestions[0]}</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right column containing Vault Generation History */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 shadow-xs p-6 rounded-2xl flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-900 font-outfit uppercase tracking-wider">History Log</h3>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-slate-500 hover:text-rose-600 transition focus:outline-none flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <FiTrash size={13} /> Clear
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FiClock size={24} className="mx-auto text-slate-400" />
                  <p className="text-xs font-medium">No passwords generated in this session.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((histPass, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition"
                    >
                      <span className="font-mono text-xs text-slate-800 truncate max-w-[140px] font-semibold">{histPass}</span>
                      <button
                        onClick={() => copyToClipboard(histPass, 'Password')}
                        className="text-slate-400 hover:text-blue-600 transition focus:outline-none shrink-0"
                        title="Copy to Clipboard"
                      >
                        <FiCopy size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              History logs are stored locally in your active browser session and cleared upon reload.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Generator;
