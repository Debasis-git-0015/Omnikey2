import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { 
  FiGrid, 
  FiLock, 
  FiZap, 
  FiShield, 
  FiTrendingUp, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiMoreVertical,
  FiClock,
  FiHelpCircle,
  FiChevronRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ onOpenHelp, onOpenExtension }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Format full name properly (e.g., "debasis sukla" -> "Debasis Sukla")
  const getFormattedFullName = (name) => {
    if (!name) return 'User';
    return name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const fullName = getFormattedFullName(user?.name);
  const initial = fullName.charAt(0).toUpperCase();

  const mainMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiGrid size={18} /> },
    { name: 'Password Vault', path: '/vault', icon: <FiLock size={18} /> },
    { name: 'Password Generator', path: '/generator', icon: <FiZap size={18} /> },
    { name: 'Strength Checker', path: '/strength', icon: <FiClock size={18} /> },
    { name: 'Breach Checker', path: '/breaches', icon: <FiShield size={18} /> },
    { name: 'Security Center', path: '/security', icon: <FiTrendingUp size={18} /> },
  ];

  const handleNavigate = (path) => {
    setShowUserMenu(false);
    setIsOpen(false);
    navigate(path);
  };

  const handleOpenHelp = () => {
    setShowUserMenu(false);
    setIsOpen(false);
    if (onOpenHelp) {
      onOpenHelp();
    }
  };

  const handleOpenExtension = () => {
    setShowUserMenu(false);
    setIsOpen(false);
    if (onOpenExtension) {
      onOpenExtension();
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    setIsOpen(false);
    logout();
  };

  const renderNavLinks = (items) => (
    <div className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          onClick={() => {
            setIsOpen(false);
            setShowUserMenu(false);
          }}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-[#EEF4FF] text-[#4F7CFF] font-bold'
                : 'text-[#2C384E] hover:text-[#172033] hover:bg-[#F4F7FB]'
            }`
          }
        >
          {item.icon}
          <span>{item.name}</span>
        </NavLink>
      ))}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-5 bg-white border-r border-[#E6EBF2]">
      {/* Brand logo & Menu lists */}
      <div>
        {/* Logo block */}
        <div className="flex items-center gap-3 px-2 py-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#4F7CFF] flex items-center justify-center text-white shadow-xs">
            <FiShield size={22} />
          </div>
          <div>
            <h2 className="font-bold text-[#172033] text-base leading-tight">Omnikey</h2>
            <p className="text-xs text-[#6B7890] font-medium">Password Manager</p>
          </div>
        </div>

        {/* MAIN Navigation Menu */}
        <div>
          <h4 className="text-[11px] font-bold text-[#475467] uppercase tracking-widest px-3.5 mb-2.5 font-mono">
            MAIN
          </h4>
          {renderNavLinks(mainMenuItems)}
        </div>
      </div>

      {/* User profile card with three-dot popup menu at bottom left */}
      <div className="relative pt-4">
        {/* Three-Dot Popover Menu */}
        <AnimatePresence>
          {showUserMenu && (
            <>
              {/* Invisible Backdrop to close on click outside */}
              <div 
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setShowUserMenu(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-full mb-2.5 left-0 right-0 bg-white border border-[#E6EBF2] rounded-2xl shadow-xl z-50 p-2 overflow-hidden text-left"
              >
                {/* Header label */}
                <div className="px-3 py-2 border-b border-[#E6EBF2] mb-1 bg-[#F8FAFC] rounded-xl">
                  <p className="text-[10px] font-bold text-[#6B7890] uppercase tracking-wider font-mono">
                    Account Controls
                  </p>
                  <p className="text-xs font-bold text-[#172033] truncate mt-0.5">
                    {fullName}
                  </p>
                </div>

                <div className="space-y-0.5">
                  {/* Settings Option */}
                  <button
                    onClick={() => handleNavigate('/settings')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#172033] hover:bg-[#EEF4FF] hover:text-[#4F7CFF] transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#F4F7FB] group-hover:bg-[#EEF4FF] text-[#6B7890] group-hover:text-[#4F7CFF] flex items-center justify-center transition border border-[#E6EBF2]">
                        <FiSettings size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block leading-tight font-bold">Settings</span>
                        <span className="text-[10px] text-[#6B7890] font-normal leading-tight">Preferences & Security</span>
                      </div>
                    </div>
                    <FiChevronRight size={14} className="text-[#6B7890] group-hover:text-[#4F7CFF] transition" />
                  </button>

                  {/* Browser Extension Option */}
                  <button
                    onClick={handleOpenExtension}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#172033] hover:bg-[#EEF4FF] hover:text-[#4F7CFF] transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#F4F7FB] group-hover:bg-[#EEF4FF] text-[#6B7890] group-hover:text-[#4F7CFF] flex items-center justify-center transition border border-[#E6EBF2]">
                        <FiZap size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block leading-tight font-bold">Autofill Extension</span>
                        <span className="text-[10px] text-[#6B7890] font-normal leading-tight">Install & Download</span>
                      </div>
                    </div>
                    <FiChevronRight size={14} className="text-[#6B7890] group-hover:text-[#4F7CFF] transition" />
                  </button>

                  {/* Help Option */}
                  <button
                    onClick={handleOpenHelp}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#172033] hover:bg-[#EEF4FF] hover:text-[#4F7CFF] transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#F4F7FB] group-hover:bg-[#EEF4FF] text-[#6B7890] group-hover:text-[#4F7CFF] flex items-center justify-center transition border border-[#E6EBF2]">
                        <FiHelpCircle size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block leading-tight font-bold">Help</span>
                        <span className="text-[10px] text-[#6B7890] font-normal leading-tight">Guide, FAQs & Support</span>
                      </div>
                    </div>
                    <FiChevronRight size={14} className="text-[#6B7890] group-hover:text-[#4F7CFF] transition" />
                  </button>

                  {/* Divider */}
                  <div className="my-1 border-t border-[#E6EBF2]"></div>

                  {/* Lock Vault / Log out Option */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#D96B6B] hover:bg-[#FFF0F0] transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#FFF0F0] text-[#D96B6B] flex items-center justify-center transition border border-red-100">
                        <FiLock size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block leading-tight font-bold">Lock Vault</span>
                        <span className="text-[10px] text-red-400 font-normal leading-tight">Log out & secure session</span>
                      </div>
                    </div>
                    <FiLogOut size={14} className="text-[#D96B6B]" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* User profile card */}
        <div 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`bg-[#F4F7FB] border transition rounded-2xl p-3 flex items-center justify-between cursor-pointer select-none ${
            showUserMenu ? 'border-[#4F7CFF] ring-2 ring-[#EEF4FF] bg-white' : 'border-[#E6EBF2] hover:border-[#CCD5E2] hover:bg-[#EFF3F8]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar ? (
              <div className="relative shrink-0">
                <img
                  src={user.avatar}
                  alt={fullName}
                  className="w-9 h-9 rounded-full object-cover border border-[#E6EBF2]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
                <div className="w-9 h-9 rounded-full bg-[#EEF4FF] text-[#4F7CFF] font-bold hidden items-center justify-center text-xs">
                  {initial}
                </div>
                {user.provider === 'google' && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-[#E6EBF2]">
                    <FcGoogle size={12} />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#EEF4FF] text-[#4F7CFF] font-bold flex items-center justify-center text-xs">
                  {initial}
                </div>
                {user?.provider === 'google' && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-[#E6EBF2]">
                    <FcGoogle size={12} />
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0 pr-1 text-left">
              <h4 className="text-xs font-bold text-[#172033] truncate leading-tight">
                {fullName}
              </h4>
              <p className="text-[11px] text-[#6B7890] truncate leading-tight mt-0.5">
                {user?.email || ''}
              </p>
            </div>
          </div>

          {/* Three-Dot Menu Button */}
          <button 
            type="button"
            aria-label="User Options Menu"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition shrink-0 cursor-pointer ${
              showUserMenu ? 'bg-[#EEF4FF] text-[#4F7CFF]' : 'text-[#6B7890] hover:text-[#172033] hover:bg-white'
            }`}
          >
            <FiMoreVertical size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden w-full h-16 bg-white border-b border-[#E6EBF2] flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#4F7CFF] flex items-center justify-center text-white shadow-xs">
            <FiShield size={18} />
          </div>
          <span className="font-bold text-base text-[#172033]">Omnikey</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#6B7890] hover:text-[#172033] transition focus:outline-none p-1.5 cursor-pointer"
        >
          {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-[#172033] z-40"
            ></motion.div>

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-72 bg-white border-r border-[#E6EBF2] z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
