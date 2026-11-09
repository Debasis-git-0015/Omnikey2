import React, { useState, useEffect, useContext, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiBell, 
  FiChevronDown, 
  FiGlobe, 
  FiUser, 
  FiLock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiX, 
  FiExternalLink,
  FiTrash2,
  FiShield,
  FiSettings,
  FiKey,
  FiHelpCircle,
  FiLogOut,
  FiZap
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import Sidebar from './Sidebar';
import HelpModal from './HelpModal';
import ExtensionModal from './ExtensionModal';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import API_URL from '../config/api';

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [vaultItems, setVaultItems] = useState([]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  // Automatically trigger extension setup prompt for first-time / new users
  useEffect(() => {
    const extModalShown = localStorage.getItem('omnikey_ext_setup_shown');
    if (!extModalShown) {
      const timer = setTimeout(() => {
        setShowExtensionModal(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Vault Security Active', desc: 'Zero-knowledge end-to-end encryption is active.', time: '2m ago', read: false, type: 'info' },
    { id: 2, title: 'Password Audit System', desc: 'Live crack-time analyzer is ready for testing.', time: '1h ago', read: false, type: 'success' },
    { id: 3, title: 'Global Breach Scanner', desc: 'No leaked credentials detected in monitoring databases.', time: '3h ago', read: true, type: 'shield' },
  ]);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch vault items for global search dropdown
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
        }
      } catch (err) {
        try {
          const saved = localStorage.getItem('vault_items');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setVaultItems(parsed);
            }
          }
        } catch (e) {
          setVaultItems([]);
        }
      }
    };
    fetchVaultItems();
  }, [location.pathname]);

  // Outside click listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const filtered = vaultItems.filter(item => {
      const q = query.toLowerCase();
      return (
        (item.website && item.website.toLowerCase().includes(q)) ||
        (item.username && item.username.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    });

    setSearchResults(filtered);
    setShowSearchDropdown(true);
  };

  const handleSelectSearchResult = (item) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate('/vault');
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setShowSearchDropdown(false);
      navigate('/vault');
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Capitalize first name properly
  const getFirstName = (name) => {
    if (!name) return 'User';
    const first = name.trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  };

  // Format full name properly
  const getFormattedFullName = (name) => {
    if (!name) return 'User';
    return name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const firstName = getFirstName(user?.name);
  const fullName = getFormattedFullName(user?.name);
  const initial = firstName.charAt(0).toUpperCase();

  const handleProfileNavigate = (path) => {
    setShowProfileDropdown(false);
    navigate(path);
  };

  const handleProfileOpenHelp = () => {
    setShowProfileDropdown(false);
    setShowHelpModal(true);
  };

  const handleProfileLogout = () => {
    setShowProfileDropdown(false);
    logout();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4F7FB] text-[#172033] font-sans">
      {/* Navigation Sidebar with three-dot popup */}
      <Sidebar 
        onOpenHelp={() => setShowHelpModal(true)} 
        onOpenExtension={() => setShowExtensionModal(true)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative flex flex-col bg-[#F4F7FB]">
        
        {/* Top Header Bar */}
        <header className="px-6 md:px-10 py-4 flex items-center justify-end gap-4 bg-transparent z-30">
          
          {/* Interactive Global Search Pill & Results Dropdown */}
          <div ref={searchRef} className="relative hidden sm:block w-72">
            <div className="relative">
              <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7890]" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                placeholder="Search passwords, websites..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#E6EBF2] rounded-xl text-xs text-[#172033] placeholder:text-[#6B7890] focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] shadow-2xs transition"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7890] hover:text-[#172033]"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown Overlay */}
            <AnimatePresence>
              {showSearchDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E6EBF2] rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                >
                  <div className="p-3 border-b border-[#E6EBF2] bg-[#F4F7FB] flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#6B7890] uppercase tracking-wider">
                      Search Results ({searchResults.length})
                    </span>
                    <button 
                      onClick={() => { navigate('/vault'); setShowSearchDropdown(false); }}
                      className="text-[11px] font-semibold text-[#4F7CFF] hover:underline flex items-center gap-1"
                    >
                      View All <FiExternalLink size={11} />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-[#E6EBF2]">
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#6B7890]">
                        No matching credentials found for "<span className="font-semibold text-[#172033]">{searchQuery}</span>".
                      </div>
                    ) : (
                      searchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectSearchResult(item)}
                          className="p-3 hover:bg-[#EEF4FF] cursor-pointer transition flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#4F7CFF] flex items-center justify-center shrink-0 border border-[#E6EBF2]">
                              <FiGlobe size={15} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#172033] truncate group-hover:text-[#4F7CFF]">
                                {item.website}
                              </h4>
                              <p className="text-[11px] text-[#6B7890] truncate">
                                {item.username || item.email || item.category || 'Credential'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#4F7CFF] bg-[#EEF4FF] px-2 py-0.5 rounded-md shrink-0">
                            {item.category || 'Login'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Extension Trigger Button */}
          <button
            onClick={() => setShowExtensionModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEF4FF] hover:bg-[#DCE7FF] text-[#4F7CFF] border border-[#D5E3FF] text-xs font-bold transition shadow-2xs cursor-pointer"
            title="Install or manage Omnikey Browser Extension"
          >
            <FiZap size={13} className="text-[#4F7CFF]" />
            <span>Browser Extension</span>
          </button>

          {/* Interactive Notifications Panel & Bell Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-xl bg-white border border-[#E6EBF2] flex items-center justify-center text-[#6B7890] hover:text-[#172033] hover:border-[#4F7CFF] shadow-2xs transition cursor-pointer"
            >
              <FiBell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D96B6B]"></span>
              )}
            </button>

            {/* Notifications Dropdown Panel Overlay */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white border border-[#E6EBF2] rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                >
                  <div className="p-3.5 border-b border-[#E6EBF2] bg-[#F4F7FB] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#172033]">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-[#4F7CFF] bg-[#EEF4FF] px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-semibold text-[#4F7CFF] hover:underline"
                      >
                        Mark read
                      </button>
                      <button
                        onClick={clearNotifications}
                        className="text-[#6B7890] hover:text-[#D96B6B] transition p-1"
                        title="Clear all"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E6EBF2]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#6B7890]">
                        No active notifications at this time.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 transition flex items-start gap-3 ${
                            !n.read ? 'bg-[#EEF4FF]/30' : 'hover:bg-[#F4F7FB]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                            n.type === 'success' ? 'bg-[#EAF7F1] text-[#42A982] border-[#E6EBF2]' :
                            n.type === 'shield' ? 'bg-[#EEF4FF] text-[#4F7CFF] border-[#E6EBF2]' :
                            'bg-[#FFF6E8] text-[#D99A45] border-[#E6EBF2]'
                          }`}>
                            {n.type === 'success' ? <FiCheckCircle size={15} /> :
                             n.type === 'shield' ? <FiShield size={15} /> :
                             <FiAlertCircle size={15} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h5 className="text-xs font-bold text-[#172033] leading-tight">
                                {n.title}
                              </h5>
                              <span className="text-[10px] text-[#6B7890] font-mono shrink-0 ml-2">
                                {n.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6B7890] mt-0.5 leading-relaxed">
                              {n.desc}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive Top-Right Profile Section */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`flex items-center gap-2 px-2.5 py-1.5 bg-white border rounded-xl shadow-2xs transition cursor-pointer select-none ${
                showProfileDropdown
                  ? 'border-[#4F7CFF] ring-2 ring-[#EEF4FF]'
                  : 'border-[#E6EBF2] hover:border-[#CCD5E2] hover:bg-[#F8FAFC]'
              }`}
            >
              {/* Profile Avatar with Google Badge if OAuth */}
              <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#EEF4FF] text-[#4F7CFF] font-bold text-xs border border-[#E6EBF2]">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              <span className="text-xs font-semibold text-[#172033]">{firstName}</span>
              <FiChevronDown 
                size={14} 
                className={`text-[#6B7890] transition-transform duration-200 ${showProfileDropdown ? 'rotate-180 text-[#4F7CFF]' : ''}`} 
              />
            </button>

            {/* Profile Dropdown Panel */}
            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-[#E6EBF2] rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                >
                  {/* User Profile Header Card */}
                  <div className="p-4 bg-[#F8FAFC] border-b border-[#E6EBF2]">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-[#EEF4FF] text-[#4F7CFF] font-bold text-sm border border-[#E6EBF2] shadow-xs">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={fullName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{initial}</span>
                        )}
                        {user?.provider === 'google' && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-[#E6EBF2]">
                            <FcGoogle size={12} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#172033] truncate leading-tight">
                            {fullName}
                          </h4>
                          {user?.provider === 'google' && (
                            <span className="shrink-0 bg-blue-50 text-[#4F7CFF] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                              Google
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B7890] truncate mt-0.5">
                          {user?.email || 'Authenticated User'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#42A982] animate-pulse"></span>
                          <span className="text-[10px] font-semibold text-[#42A982]">Zero-Knowledge Vault Active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Navigation Links */}
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => handleProfileNavigate('/settings')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#172033] hover:bg-[#EEF4FF] hover:text-[#4F7CFF] transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#F4F7FB] group-hover:bg-[#EEF4FF] text-[#6B7890] group-hover:text-[#4F7CFF] flex items-center justify-center transition border border-[#E6EBF2]">
                          <FiSettings size={15} />
                        </div>
                        <div className="text-left">
                          <span className="block leading-tight font-bold">Account Settings</span>
                          <span className="text-[10px] text-[#6B7890] font-normal leading-tight">Preferences & Security Keys</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleProfileNavigate('/vault')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#172033] hover:bg-[#EEF4FF] hover:text-[#4F7CFF] transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#F4F7FB] group-hover:bg-[#EEF4FF] text-[#6B7890] group-hover:text-[#4F7CFF] flex items-center justify-center transition border border-[#E6EBF2]">
                          <FiKey size={15} />
                        </div>
                        <div className="text-left">
                          <span className="block leading-tight font-bold">Password Vault</span>
                          <span className="text-[10px] text-[#6B7890] font-normal leading-tight">Manage all saved credentials</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleProfileNavigate('/security')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#172033] hover:bg-[#EEF4FF] hover:text-[#4F7CFF] transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#F4F7FB] group-hover:bg-[#EEF4FF] text-[#6B7890] group-hover:text-[#4F7CFF] flex items-center justify-center transition border border-[#E6EBF2]">
                          <FiShield size={15} />
                        </div>
                        <div className="text-left">
                          <span className="block leading-tight font-bold">Security Center</span>
                          <span className="text-[10px] text-[#6B7890] font-normal leading-tight">Vault health & leak detection</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setShowExtensionModal(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#172033] hover:bg-[#EEF4FF] hover:text-[#4F7CFF] transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#F4F7FB] group-hover:bg-[#EEF4FF] text-[#6B7890] group-hover:text-[#4F7CFF] flex items-center justify-center transition border border-[#E6EBF2]">
                          <FiZap size={15} />
                        </div>
                        <div className="text-left">
                          <span className="block leading-tight font-bold">Browser Extension</span>
                          <span className="text-[10px] text-[#6B7890] font-normal leading-tight">Autofill package & setup</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleProfileOpenHelp}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#172033] hover:bg-[#EEF4FF] hover:text-[#4F7CFF] transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#F4F7FB] group-hover:bg-[#EEF4FF] text-[#6B7890] group-hover:text-[#4F7CFF] flex items-center justify-center transition border border-[#E6EBF2]">
                          <FiHelpCircle size={15} />
                        </div>
                        <div className="text-left">
                          <span className="block leading-tight font-bold">Help & Support</span>
                          <span className="text-[10px] text-[#6B7890] font-normal leading-tight">Guides, encryption & FAQs</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#E6EBF2] my-1"></div>

                  {/* Lock Vault / Sign Out Action */}
                  <div className="p-2">
                    <button
                      onClick={handleProfileLogout}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#D96B6B] hover:bg-[#FFF0F0] transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#FFF0F0] text-[#D96B6B] flex items-center justify-center transition border border-red-100">
                          <FiLock size={15} />
                        </div>
                        <div className="text-left">
                          <span className="block leading-tight font-bold">Lock Vault</span>
                          <span className="text-[10px] text-red-400 font-normal leading-tight">Log out & secure session</span>
                        </div>
                      </div>
                      <FiLogOut size={15} className="text-[#D96B6B]" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="px-6 md:px-10 pb-10 max-w-7xl mx-auto w-full z-10 flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex-grow flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Reusable Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Omnikey Browser Extension Setup & Download Modal */}
      <ExtensionModal isOpen={showExtensionModal} onClose={() => setShowExtensionModal(false)} />
    </div>
  );
};

export default AppLayout;
