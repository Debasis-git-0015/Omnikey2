import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { 
  FiShield, 
  FiLock, 
  FiZap, 
  FiCpu, 
  FiActivity, 
  FiLayers, 
  FiArrowRight, 
  FiSend, 
  FiCheckCircle, 
  FiDatabase,
  FiKey
} from 'react-icons/fi';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('');

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setContactStatus('Please fill in all fields.');
      return;
    }
    setContactStatus('success');
    setContactForm({ name: '', email: '', message: '' });
  };

  const features = [
    {
      icon: <FiLock size={22} className="text-[#4F7CFF]" />,
      tag: "Security",
      title: "AES-256 Zero-Knowledge Vault",
      description: "Your credentials are encrypted client-side using PBKDF2 & AES-256 before touching our database. We never hold your master password."
    },
    {
      icon: <FiZap size={22} className="text-indigo-600" />,
      tag: "Speed",
      title: "Instant One-Click Generator",
      description: "Generate cryptographically secure, high-entropy passwords tailored to custom length, symbols, and complexity rules instantly."
    },
    {
      icon: <FiActivity size={22} className="text-[#42A982]" />,
      tag: "Monitoring",
      title: "Real-Time Breach Alerts",
      description: "Automated scanning against dark web leak repositories checks if any of your saved logins have been compromised in data leaks."
    },
    {
      icon: <FiCpu size={22} className="text-purple-600" />,
      tag: "Analysis",
      title: "Password Strength Auditor",
      description: "Instant visual entropy scoring, pattern detection, and health feedback across your entire password vault."
    },
    {
      icon: <FiLayers size={22} className="text-[#D99A45]" />,
      tag: "Organization",
      title: "Smart Categories & Search",
      description: "Seamlessly organize Logins, Credit Cards, Bank Accounts, and Encrypted Secure Notes with instant tag-based filtering."
    },
    {
      icon: <FiDatabase size={22} className="text-cyan-600" />,
      tag: "Backups",
      title: "Encrypted Data Export",
      description: "Full control over your data. Export your vault in encrypted JSON backups anytime to ensure complete data ownership."
    }
  ];

  const stats = [
    { label: "Encryption Standard", value: "AES-256 Bit", accent: "text-[#4F7CFF]" },
    { label: "Server Password Visibility", value: "0% (Zero-Knowledge)", accent: "text-[#42A982]" },
    { label: "Decryption Latency", value: "< 5 ms", accent: "text-indigo-600" },
    { label: "Breach Scan Database", value: "10B+ Leaked Hashes", accent: "text-purple-600" }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Master Password Input",
      desc: "You enter your secret key locally in your browser. It never travels across the network."
    },
    {
      step: "02",
      title: "Client-Side Encryption",
      desc: "PBKDF2 derives a 256-bit AES key to encrypt vault items directly inside JavaScript context."
    },
    {
      step: "03",
      title: "Encrypted Blob Sync",
      desc: "Only unreadable encrypted ciphertext is synchronized to the database."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#172033] font-sans overflow-x-hidden selection:bg-[#4F7CFF] selection:text-white">
      
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-gradient-to-bl from-purple-400/10 to-blue-400/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-400/5 to-cyan-500/10 blur-3xl" />
      </div>

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#E6EBF2] bg-white/85 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F7CFF] to-[#3D68E8] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FiShield size={20} />
            </div>
            <div>
              <span className="font-bold text-lg text-[#172033] tracking-tight leading-none block">
                Omnikey
              </span>
              <span className="text-[10px] text-[#6B7890] font-semibold tracking-wider uppercase block">
                Zero-Knowledge Vault
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#6B7890]">
            <a href="#features" className="hover:text-[#4F7CFF] transition-colors">Features</a>
            <a href="#security" className="hover:text-[#4F7CFF] transition-colors">Security Architecture</a>
            <a href="#contact" className="hover:text-[#4F7CFF] transition-colors">Contact</a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 bg-[#4F7CFF] hover:bg-[#3D68E8] rounded-xl text-xs font-bold text-white transition shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                Go to Dashboard <FiArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-4 py-2.5 text-xs font-bold text-[#6B7890] hover:text-[#172033] transition"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 bg-[#4F7CFF] hover:bg-[#3D68E8] rounded-xl text-xs font-bold text-white transition shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 cursor-pointer"
                >
                  Get Started Free <FiArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 space-y-24 pt-12 pb-20 relative z-10">

        {/* HERO SECTION */}
        <section className="relative min-h-[520px] flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-7 text-left">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#EEF4FF] border border-[#4F7CFF]/20 text-[#4F7CFF] text-xs font-bold shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-[#4F7CFF] animate-pulse" />
                Next-Gen Zero-Knowledge Encryption Standard
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#172033] leading-[1.15] tracking-tight"
              >
                Your Passwords.<br />
                <span className="bg-gradient-to-r from-[#4F7CFF] via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  100% Private & Encrypted.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-[#6B7890] text-sm sm:text-base leading-relaxed max-w-xl font-medium"
              >
                Omnikey secures your digital life with client-side AES-256 bit encryption. Your master key never leaves your browser, keeping credentials safe from data breaches.
              </motion.p>

              {/* Action CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <Link
                  to={user ? "/dashboard" : "/register"}
                  className="px-7 py-3.5 bg-[#4F7CFF] hover:bg-[#3D68E8] rounded-xl text-xs font-bold text-white transition shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 flex items-center gap-2 cursor-pointer group"
                >
                  <span>Start Protecting Free</span>
                  <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3.5 bg-white hover:bg-[#F4F7FB] border border-[#E6EBF2] rounded-xl text-xs font-bold text-[#172033] shadow-2xs hover:border-[#CBD5E1] transition flex items-center gap-2"
                >
                  Explore Features
                </a>
              </motion.div>

              {/* Trust Badges */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="pt-6 border-t border-[#E6EBF2] flex flex-wrap items-center gap-6 text-xs text-[#6B7890] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#42A982]" size={16} />
                  <span>No Master Password Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#42A982]" size={16} />
                  <span>Client-Side PBKDF2 Derivation</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#42A982]" size={16} />
                  <span>Encrypted Export Options</span>
                </div>
              </motion.div>
            </div>

            {/* Hero Right Visual Shield Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="w-full max-w-md bg-white border border-[#E6EBF2] rounded-3xl p-8 shadow-2xl shadow-blue-900/10 space-y-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
                
                <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] text-[#4F7CFF] flex items-center justify-center border border-[#E6EBF2]">
                  <FiShield size={28} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-[#172033]">
                    Zero-Knowledge Vault
                  </h3>
                  <p className="text-xs text-[#6B7890] leading-relaxed font-medium">
                    All password encryption occurs locally on your device using PBKDF2 key derivation and AES-256 cipher before sending anything over the web.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-[#F4F7FB] border border-[#E6EBF2] rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiLock className="text-[#4F7CFF]" size={18} />
                      <span className="text-xs font-bold text-[#172033]">AES-256 Encryption</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#42A982] bg-[#EAF7F1] px-2.5 py-0.5 rounded-full border border-[#E6EBF2]">
                      Active
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#F4F7FB] border border-[#E6EBF2] rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiKey className="text-[#4F7CFF]" size={18} />
                      <span className="text-xs font-bold text-[#172033]">Master Password Privacy</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#42A982] bg-[#EAF7F1] px-2.5 py-0.5 rounded-full border border-[#E6EBF2]">
                      100% Client
                    </span>
                  </div>
                </div>

                <Link
                  to="/register"
                  className="w-full py-3.5 bg-[#4F7CFF] hover:bg-[#3D68E8] text-white rounded-xl text-xs font-bold transition block text-center shadow-md cursor-pointer"
                >
                  Create Your Secure Vault
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

        {/* STATS HIGHLIGHT BAR */}
        <section className="py-8 bg-white border border-[#E6EBF2] rounded-3xl shadow-sm px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#E6EBF2]">
            {stats.map((stat, idx) => (
              <div key={idx} className={`space-y-1 ${idx !== 0 ? 'pt-4 md:pt-0' : ''}`}>
                <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${stat.accent}`}>
                  {stat.value}
                </h3>
                <p className="text-xs font-bold text-[#6B7890] uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="space-y-10 pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-[#EEF4FF] border border-[#4F7CFF]/20 text-[#4F7CFF] text-xs font-bold tracking-wider uppercase">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033]">
              Built For Complete Security & Peace of Mind
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7890] font-medium leading-relaxed">
              Every feature in Omnikey is engineered around client-side zero-knowledge encryption and seamless user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-[#E6EBF2] p-7 rounded-2xl shadow-2xs hover:shadow-xl hover:border-[#CBD5E1] transition-all space-y-4 text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4F7FB] border border-[#E6EBF2] flex items-center justify-center shrink-0">
                      {feat.icon}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#EEF4FF] text-[#4F7CFF] px-2.5 py-1 rounded-md">
                      {feat.tag}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[#172033] leading-snug">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#6B7890] leading-relaxed font-medium">
                      {feat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E6EBF2] flex items-center gap-1 text-xs font-bold text-[#4F7CFF]">
                  <span>Learn more</span>
                  <FiArrowRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECURITY ARCHITECTURE VISUALIZER */}
        <section id="security" className="bg-gradient-to-br from-[#172033] to-[#1E293B] text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4 mb-10">
            <span className="px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-400/20">
              Zero-Knowledge Guarantee
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              How Client-Side AES-256 Keeps You Safe
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              We never store your master key. Encryption occurs exclusively within your browser before any data is sent over the network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {workflowSteps.map((ws, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 backdrop-blur-sm">
                <span className="text-2xl font-extrabold text-[#4F7CFF] font-mono block">
                  {ws.step}
                </span>
                <h4 className="text-sm font-bold text-white">{ws.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {ws.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT & CTA SECTION */}
        <section id="contact" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-6 border-t border-[#E6EBF2]">
          <div className="lg:col-span-8 bg-white border border-[#E6EBF2] shadow-sm p-7 md:p-9 text-left space-y-6 rounded-3xl">
            <div>
              <h2 className="text-xl font-bold text-[#172033]">Get In Touch With Security Support</h2>
              <p className="text-[#6B7890] text-xs mt-1 font-medium">Have questions or vulnerability disclosures? Reach out directly.</p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              {contactStatus === 'success' && (
                <div className="p-3.5 rounded-xl bg-[#EAF7F1] border border-[#E6EBF2] text-[#42A982] text-xs font-bold flex items-center gap-2">
                  <FiCheckCircle size={16} /> Thank you! Your message has been received.
                </div>
              )}
              {contactStatus && contactStatus !== 'success' && (
                <div className="p-3.5 rounded-xl bg-[#FFF0F0] border border-[#E6EBF2] text-[#D96B6B] text-xs font-bold">
                  {contactStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6B7890] uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-xs focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] outline-none transition"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7890] uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-xs focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] outline-none transition"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7890] uppercase tracking-wider mb-2">Message</label>
                <textarea
                  rows="3"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-xs resize-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] outline-none transition"
                  placeholder="How can we assist you?"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#4F7CFF] hover:bg-[#3D68E8] rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
              >
                <FiSend /> Send Inquiry
              </button>
            </form>
          </div>

          <div className="lg:col-span-4 bg-gradient-to-br from-[#4F7CFF] to-[#3D68E8] text-white p-7 md:p-9 flex flex-col justify-between text-left space-y-6 rounded-3xl shadow-xl shadow-blue-500/20">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <FiShield size={24} />
              </div>
              <h3 className="text-xl font-extrabold leading-snug">
                Ready to Secure Your Passwords?
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed font-medium">
                Create your zero-knowledge account in seconds. No credit card required.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/20">
              <Link 
                to="/register"
                className="w-full py-3 bg-white text-[#4F7CFF] hover:bg-blue-50 rounded-xl text-xs font-bold transition text-center block shadow-md cursor-pointer"
              >
                Create Free Account
              </Link>
              <Link 
                to="/login"
                className="w-full py-2.5 text-xs font-bold text-white hover:underline text-center block cursor-pointer"
              >
                Already have an account? Sign In
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#E6EBF2] bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7890]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#4F7CFF] flex items-center justify-center text-white">
              <FiShield size={12} />
            </div>
            <span className="font-bold text-[#172033]">Omnikey Vault</span>
            <span>&copy; 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <a href="#features" className="hover:text-[#172033] transition">Features</a>
            <a href="#security" className="hover:text-[#172033] transition">Security Architecture</a>
            <a href="#contact" className="hover:text-[#172033] transition">Contact</a>
            <Link to="/login" className="hover:text-[#172033] transition">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
