import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiPlus, 
  FiGrid, 
  FiList, 
  FiEye, 
  FiEyeOff, 
  FiCopy, 
  FiEdit, 
  FiTrash, 
  FiGlobe, 
  FiLock, 
  FiX, 
  FiCheckCircle, 
  FiCpu, 
  FiBookOpen, 
  FiInfo, 
  FiChevronDown,
  FiBell
} from 'react-icons/fi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const Vault = () => {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Load items from API with localStorage cache fallback
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
        setItems(mapped);
      } catch (err) {
        console.warn('API fetch failed, loading from local storage cache:', err);
        const saved = localStorage.getItem('vault_items');
        if (saved) {
          setItems(JSON.parse(saved));
        } else {
          setItems([]);
        }
      } finally {
        setLoadingItems(false);
      }
    };
    fetchVaultItems();
  }, []);

  // Sync state changes to cache
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('vault_items', JSON.stringify(items));
    }
  }, [items]);

  // UI state management
  const [viewType, setViewType] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('name-asc');
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form field states
  const [formFields, setFormFields] = useState({
    website: '',
    url: '',
    username: '',
    email: '',
    password: '',
    notes: '',
    category: 'Logins',
    cardholderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    bankName: '',
    accountNumber: '',
    routingNumber: ''
  });

  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [toast, setToast] = useState(null);

  const categories = ['All', 'Logins', 'Finance', 'Cards', 'Secure Notes'];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const parseNotes = (item) => {
    if (!item.notes) return null;
    try {
      if (item.notes.startsWith('{') && item.notes.endsWith('}')) {
        return JSON.parse(item.notes);
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const openAddModal = () => {
    setCurrentEditItem(null);
    setFormFields({
      website: '',
      url: '',
      username: '',
      email: '',
      password: '',
      notes: '',
      category: 'Logins',
      cardholderName: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      bankName: '',
      accountNumber: '',
      routingNumber: ''
    });
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setCurrentEditItem(item);
    const parsed = parseNotes(item);

    setFormFields({
      website: item.website || '',
      url: item.url || '',
      username: item.username || '',
      email: item.email || '',
      password: item.password || '',
      notes: parsed ? (parsed.notesText || '') : (item.notes || ''),
      category: item.category || 'Logins',
      cardholderName: parsed?.cardholderName || '',
      cardNumber: parsed?.cardNumber || '',
      cardExpiry: parsed?.cardExpiry || '',
      cardCvv: parsed?.cardCvv || '',
      bankName: parsed?.bankName || '',
      accountNumber: parsed?.accountNumber || '',
      routingNumber: parsed?.routingNumber || ''
    });

    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formFields.website) {
      showToast('Website or Title is required.', 'error');
      return;
    }

    let passwordPayload = formFields.password;
    let notesPayload = formFields.notes;

    if (formFields.category === 'Cards') {
      const cardDetails = {
        cardholderName: formFields.cardholderName,
        cardNumber: formFields.cardNumber,
        cardExpiry: formFields.cardExpiry,
        cardCvv: formFields.cardCvv,
        notesText: formFields.notes
      };
      notesPayload = JSON.stringify(cardDetails);
      if (!passwordPayload) {
        passwordPayload = formFields.cardCvv || 'card-dummy-pass';
      }
    } else if (formFields.category === 'Finance') {
      const financeDetails = {
        bankName: formFields.bankName,
        accountNumber: formFields.accountNumber,
        routingNumber: formFields.routingNumber,
        notesText: formFields.notes
      };
      notesPayload = JSON.stringify(financeDetails);
      if (!passwordPayload) {
        passwordPayload = 'finance-dummy-pass';
      }
    } else if (formFields.category === 'Secure Notes') {
      if (!passwordPayload) {
        passwordPayload = 'secure-notes-dummy-pass';
      }
    }

    const payload = {
      website: formFields.website,
      url: formFields.url,
      username: formFields.username,
      email: formFields.email,
      password: passwordPayload,
      notes: notesPayload,
      category: formFields.category
    };

    if (currentEditItem) {
      try {
        const res = await axios.put(`${API_URL}/vault/${currentEditItem.id || currentEditItem._id}`, payload);
        const updated = { ...res.data, id: res.data._id || res.data.id };
        setItems(prev => prev.map(item => item.id === currentEditItem.id ? updated : item));
        showToast('Item updated successfully!', 'success');
      } catch (err) {
        console.warn('API update failed, updating local state cache:', err);
        setItems(prev => prev.map(item => 
          item.id === currentEditItem.id 
            ? { ...item, ...payload, id: item.id } 
            : item
        ));
        showToast('Item updated locally!', 'success');
      }
    } else {
      try {
        const res = await axios.post(`${API_URL}/vault`, payload);
        const created = { ...res.data, id: res.data._id || res.data.id };
        setItems(prev => [created, ...prev]);
        showToast('Item added successfully!', 'success');
      } catch (err) {
        console.warn('API creation failed, saving to local state cache:', err);
        const newItem = {
          id: 'local-' + Date.now().toString(),
          ...payload,
          createdAt: new Date().toISOString()
        };
        setItems(prev => [newItem, ...prev]);
        showToast('Item added locally!', 'success');
      }
    }

    setShowFormModal(false);
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteItem = async () => {
    if (itemToDelete) {
      try {
        await axios.delete(`${API_URL}/vault/${itemToDelete.id || itemToDelete._id}`);
        setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
        showToast('Item deleted successfully.', 'success');
      } catch (err) {
        console.warn('API delete failed, removing from local state cache:', err);
        setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
        showToast('Item deleted locally.', 'success');
      }
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let length = 16;
    let generated = '';
    for (let i = 0; i < length; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormFields(prev => ({ ...prev, password: generated }));
    showToast('Strong password generated!', 'info');
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { rating: 'Empty', score: 0, color: 'bg-[#E6EBF2]' };
    let score = 0;
    if (pass.length >= 8) score += 20;
    if (pass.length >= 12) score += 20;
    if (/[a-z]/.test(pass)) score += 15;
    if (/[A-Z]/.test(pass)) score += 15;
    if (/[0-9]/.test(pass)) score += 15;
    if (/[^A-Za-z0-9]/.test(pass)) score += 15;

    if (score < 40) return { rating: 'Weak', score, color: 'bg-[#D96B6B]' };
    if (score < 75) return { rating: 'Moderate', score, color: 'bg-[#D99A45]' };
    return { rating: 'Strong', score, color: 'bg-[#42A982]' };
  };

  const strength = getPasswordStrength(formFields.password);

  const filteredItems = items
    .filter(item => {
      const matchQuery = 
        item.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.username && item.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;

      return matchQuery && matchCategory;
    })
    .sort((a, b) => {
      if (sortOrder === 'name-asc') {
        return a.website.localeCompare(b.website);
      } else if (sortOrder === 'name-desc') {
        return b.website.localeCompare(a.website);
      } else if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });

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
                : toast.type === 'error'
                ? 'bg-[#FFF0F0] border-[#E6EBF2] text-[#D96B6B]'
                : 'bg-[#EEF4FF] border-[#E6EBF2] text-[#4F7CFF]'
            }`}
          >
            <FiBell className="shrink-0 text-[#4F7CFF]" />
            <span className="text-xs font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-outfit text-[#172033] tracking-tight">Password Vault</h1>
          <p className="text-[#6B7890] text-sm mt-1">Manage, organize, and secure your credentials.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#4F7CFF] hover:bg-[#3D68E8] rounded-xl text-sm font-semibold text-white transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <FiPlus size={18} /> Add Item
        </button>
      </div>

      {/* Control panel: Search, filters, sort, view toggler */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        {/* Search input */}
        <div className="relative lg:col-span-2">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7890]" />
          <input
            type="text"
            placeholder="Search credentials by title, username, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
          />
        </div>

        {/* Sort Select */}
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm appearance-none cursor-pointer focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
          >
            <option value="name-asc" className="bg-white text-[#172033]">Sort A-Z</option>
            <option value="name-desc" className="bg-white text-[#172033]">Sort Z-A</option>
            <option value="newest" className="bg-white text-[#172033]">Sort: Newest Added</option>
            <option value="oldest" className="bg-white text-[#172033]">Sort: Oldest Added</option>
          </select>
          <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7890] pointer-events-none" />
        </div>

        {/* Layout Toggle switcher */}
        <div className="flex gap-2 justify-end w-full lg:w-auto">
          <button
            onClick={() => setViewType('table')}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              viewType === 'table' 
                ? 'bg-[#EEF4FF] border-[#E6EBF2] text-[#4F7CFF] font-semibold' 
                : 'bg-white border-[#E6EBF2] text-[#6B7890] hover:bg-[#F7F9FC]'
            }`}
          >
            <FiList size={18} />
          </button>
          <button
            onClick={() => setViewType('card')}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              viewType === 'card' 
                ? 'bg-[#EEF4FF] border-[#E6EBF2] text-[#4F7CFF] font-semibold' 
                : 'bg-white border-[#E6EBF2] text-[#6B7890] hover:bg-[#F7F9FC]'
            }`}
          >
            <FiGrid size={18} />
          </button>
        </div>
      </div>

      {/* Category selector pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer shrink-0 ${
              selectedCategory === cat 
                ? 'bg-[#4F7CFF] text-white border-[#4F7CFF] shadow-2xs' 
                : 'bg-white border-[#E6EBF2] text-[#6B7890] hover:bg-[#F7F9FC]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main vault render area */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-[#E6EBF2] shadow-xs p-12 rounded-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-[#F7F9FC] flex items-center justify-center text-[#6B7890] mx-auto mb-3">
            <FiSearch size={20} />
          </div>
          <h3 className="text-base font-bold text-[#172033] font-outfit">No credentials found</h3>
          <p className="text-[#6B7890] text-xs mt-1">Try broadening your search query or click "Add Item" to store new credentials.</p>
        </div>
      ) : viewType === 'table' ? (
        <div className="bg-white border border-[#E6EBF2] shadow-xs rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F7F9FC] border-b border-[#E6EBF2] text-[#6B7890] text-xs uppercase font-semibold tracking-wider">
                  <th className="p-4 pl-6">Website / Domain</th>
                  <th className="p-4">Account Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Secure Data</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBF2]">
                {filteredItems.map((item) => {
                  const details = parseNotes(item);
                  const isCard = item.category === 'Cards';
                  const isFinance = item.category === 'Finance';
                  const isSecureNote = item.category === 'Secure Notes';
                  
                  const displayValue = isCard ? (details?.cardNumber || item.password) : isFinance ? (details?.accountNumber || item.password) : item.password;
                  
                  return (
                    <tr key={item.id} className="hover:bg-[#F7F9FC] transition">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#EEF4FF] border border-[#E6EBF2] flex items-center justify-center text-[#4F7CFF] font-bold text-sm shrink-0 uppercase">
                            {item.website.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#172033] text-sm">{item.website}</h4>
                            {item.url && (
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs text-[#4F7CFF] hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <FiGlobe size={11} /> Visit link
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          {isCard ? (
                            <>
                              <div className="text-xs font-semibold text-[#172033]">
                                {details?.cardholderName || '(No Name)'}
                              </div>
                              <div className="text-[11px] text-[#6B7890]">Credit Card</div>
                            </>
                          ) : isFinance ? (
                            <>
                              <div className="text-xs font-semibold text-[#172033]">
                                {details?.bankName || '(No Bank)'}
                              </div>
                              <div className="text-[11px] text-[#6B7890]">Bank Account</div>
                            </>
                          ) : isSecureNote ? (
                            <div className="text-xs text-[#6B7890] italic">Secure Note</div>
                          ) : (
                            <>
                              <div className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                                <span>{item.username || '(No username)'}</span>
                                {item.username && (
                                  <button 
                                    onClick={() => copyToClipboard(item.username, 'Username')}
                                    className="text-[#6B7890] hover:text-[#172033] transition focus:outline-none"
                                  >
                                    <FiCopy size={12} />
                                  </button>
                                )}
                              </div>
                              <div className="text-[11px] text-[#6B7890]">{item.email || '(No email)'}</div>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F7F9FC] border border-[#E6EBF2] text-[#172033]">
                          {item.category}
                        </span>
                      </td>

                      <td className="p-4">
                        {isSecureNote ? (
                          <span className="text-xs text-[#6B7890] italic">Protected note</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type={visiblePasswords[item.id] ? 'text' : 'password'}
                              value={displayValue}
                              readOnly
                              className="bg-transparent border-none text-xs font-mono text-[#172033] focus:outline-none max-w-[120px]"
                            />
                            <button
                              onClick={() => togglePasswordVisibility(item.id)}
                              className="text-[#6B7890] hover:text-[#172033] transition focus:outline-none"
                            >
                              {visiblePasswords[item.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(displayValue, isCard ? 'Card Number' : isFinance ? 'Account Number' : 'Password')}
                              className="text-[#6B7890] hover:text-[#4F7CFF] transition focus:outline-none"
                            >
                              <FiCopy size={14} />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-4 pr-6 text-right space-x-1.5 shrink-0">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg bg-[#F7F9FC] hover:bg-[#EEF4FF] border border-[#E6EBF2] text-[#6B7890] hover:text-[#4F7CFF] transition cursor-pointer"
                          title="Edit"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="p-1.5 rounded-lg bg-[#FFF0F0] hover:bg-[#FFE0E0] border border-[#E6EBF2] text-[#D96B6B] transition cursor-pointer"
                          title="Delete"
                        >
                          <FiTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const details = parseNotes(item);
            const isCard = item.category === 'Cards';
            const isFinance = item.category === 'Finance';
            const isSecureNote = item.category === 'Secure Notes';
            const displayValue = isCard ? (details?.cardNumber || item.password) : isFinance ? (details?.accountNumber || item.password) : item.password;
            
            return (
              <motion.div
                layout
                key={item.id}
                whileHover={{ y: -2 }}
                className="bg-white border border-[#E6EBF2] shadow-xs p-6 rounded-2xl flex flex-col justify-between space-y-5 relative overflow-hidden hover:border-[#4F7CFF] transition"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EEF4FF] border border-[#E6EBF2] flex items-center justify-center text-[#4F7CFF] font-bold text-sm shrink-0 uppercase">
                      {item.website.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#172033] truncate max-w-[140px] text-sm">{item.website}</h4>
                      <span className="text-[11px] font-semibold text-[#6B7890]">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg bg-[#F7F9FC] hover:bg-[#EEF4FF] text-[#6B7890] hover:text-[#4F7CFF] transition cursor-pointer"
                    >
                      <FiEdit size={14} />
                    </button>
                    <button
                      onClick={() => confirmDelete(item)}
                      className="p-1.5 rounded-lg bg-[#FFF0F0] hover:bg-[#FFE0E0] text-[#D96B6B] transition cursor-pointer"
                    >
                      <FiTrash size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {isCard ? (
                    <>
                      <div className="flex justify-between items-center bg-[#F7F9FC] p-2.5 rounded-xl border border-[#E6EBF2]">
                        <div className="overflow-hidden pr-2">
                          <span className="text-[10px] uppercase font-semibold text-[#6B7890] block">Cardholder</span>
                          <span className="text-xs text-[#172033] truncate block font-medium mt-0.5">{details?.cardholderName || '(No Name)'}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-[#F7F9FC] p-2.5 rounded-xl border border-[#E6EBF2]">
                        <div className="overflow-hidden pr-2">
                          <span className="text-[10px] uppercase font-semibold text-[#6B7890] block">Card Number</span>
                          <input
                            type={visiblePasswords[item.id] ? 'text' : 'password'}
                            value={displayValue}
                            readOnly
                            className="bg-transparent border-none text-xs font-mono text-[#172033] focus:outline-none w-full mt-0.5"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => togglePasswordVisibility(item.id)}
                            className="text-[#6B7890] hover:text-[#172033] transition focus:outline-none"
                          >
                            {visiblePasswords[item.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(displayValue, 'Card Number')}
                            className="text-[#6B7890] hover:text-[#4F7CFF] transition focus:outline-none"
                          >
                            <FiCopy size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#F7F9FC] p-2 rounded-xl border border-[#E6EBF2] text-center">
                          <span className="text-[9px] uppercase font-semibold text-[#6B7890] block">Expiry</span>
                          <span className="text-xs font-mono text-[#172033] block mt-0.5">{details?.cardExpiry || 'MM/YY'}</span>
                        </div>
                        <div className="bg-[#F7F9FC] p-2 rounded-xl border border-[#E6EBF2] text-center">
                          <span className="text-[9px] uppercase font-semibold text-[#6B7890] block">CVV</span>
                          <span className="text-xs font-mono text-[#172033] block mt-0.5">•••</span>
                        </div>
                      </div>
                    </>
                  ) : isFinance ? (
                    <>
                      <div className="flex justify-between items-center bg-[#F7F9FC] p-2.5 rounded-xl border border-[#E6EBF2]">
                        <div className="overflow-hidden pr-2">
                          <span className="text-[10px] uppercase font-semibold text-[#6B7890] block">Bank</span>
                          <span className="text-xs text-[#172033] truncate block font-medium mt-0.5">{details?.bankName || '(No Bank)'}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-[#F7F9FC] p-2.5 rounded-xl border border-[#E6EBF2]">
                        <div className="overflow-hidden pr-2">
                          <span className="text-[10px] uppercase font-semibold text-[#6B7890] block">Account Number</span>
                          <input
                            type={visiblePasswords[item.id] ? 'text' : 'password'}
                            value={displayValue}
                            readOnly
                            className="bg-transparent border-none text-xs font-mono text-[#172033] focus:outline-none w-full mt-0.5"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => togglePasswordVisibility(item.id)}
                            className="text-[#6B7890] hover:text-[#172033] transition focus:outline-none"
                          >
                            {visiblePasswords[item.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(displayValue, 'Account Number')}
                            className="text-[#6B7890] hover:text-[#4F7CFF] transition focus:outline-none"
                          >
                            <FiCopy size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-[#F7F9FC] p-2.5 rounded-xl border border-[#E6EBF2]">
                        <span className="text-[10px] uppercase font-semibold text-[#6B7890] block">Routing Number</span>
                        <span className="text-xs font-mono text-[#172033] mt-0.5 block">{details?.routingNumber || 'N/A'}</span>
                      </div>
                    </>
                  ) : isSecureNote ? (
                    <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E6EBF2] text-center min-h-[92px] flex flex-col justify-center items-center">
                      <FiLock className="text-[#6B7890] mb-1.5" size={20} />
                      <span className="text-xs font-semibold text-[#6B7890] block">Protected Zero-Knowledge Note</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center bg-[#F7F9FC] p-2.5 rounded-xl border border-[#E6EBF2]">
                        <div className="overflow-hidden pr-2">
                          <span className="text-[10px] uppercase font-semibold text-[#6B7890] block">Account</span>
                          <span className="text-xs text-[#172033] truncate block font-medium mt-0.5">{item.username || '(No Username)'}</span>
                        </div>
                        {item.username && (
                          <button
                            onClick={() => copyToClipboard(item.username, 'Username')}
                            className="text-[#6B7890] hover:text-[#4F7CFF] transition focus:outline-none"
                          >
                            <FiCopy size={14} />
                          </button>
                        )}
                      </div>

                      <div className="flex justify-between items-center bg-[#F7F9FC] p-2.5 rounded-xl border border-[#E6EBF2]">
                        <div className="overflow-hidden pr-2">
                          <span className="text-[10px] uppercase font-semibold text-[#6B7890] block">Password</span>
                          <input
                            type={visiblePasswords[item.id] ? 'text' : 'password'}
                            value={item.password}
                            readOnly
                            className="bg-transparent border-none text-xs font-mono text-[#172033] focus:outline-none w-full mt-0.5"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => togglePasswordVisibility(item.id)}
                            className="text-[#6B7890] hover:text-[#172033] transition focus:outline-none"
                          >
                            {visiblePasswords[item.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.password, 'Password')}
                            className="text-[#6B7890] hover:text-[#4F7CFF] transition focus:outline-none"
                          >
                            <FiCopy size={14} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {(isSecureNote ? item.notes : (details?.notesText || item.notes)) && (
                  <div className="pt-3 border-t border-[#E6EBF2] flex gap-2 items-start text-xs text-[#6B7890]">
                    <FiBookOpen size={14} className="shrink-0 mt-0.5 text-[#6B7890]" />
                    <p className="line-clamp-2 leading-relaxed">
                      {isSecureNote ? item.notes : (details?.notesText || item.notes)}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormModal(false)}
              className="absolute inset-0 bg-[#172033]"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white p-6 md:p-8 relative z-10 border border-[#E6EBF2] rounded-2xl shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-[#E6EBF2] pb-4 mb-6">
                <h3 className="text-lg font-bold font-outfit text-[#172033]">
                  {currentEditItem ? 'Edit Credential Card' : 'Add New Credentials'}
                </h3>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="text-[#6B7890] hover:text-[#172033] transition focus:outline-none p-1"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Category</label>
                    <div className="relative">
                      <select
                        value={formFields.category}
                        onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm appearance-none cursor-pointer focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                      >
                        <option value="Logins" className="bg-white text-[#172033]">Logins</option>
                        <option value="Finance" className="bg-white text-[#172033]">Finance</option>
                        <option value="Cards" className="bg-white text-[#172033]">Cards</option>
                        <option value="Secure Notes" className="bg-white text-[#172033]">Secure Notes</option>
                      </select>
                      <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7890] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Website/Card Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. GitHub or Chase Card"
                      value={formFields.website}
                      onChange={(e) => setFormFields({ ...formFields, website: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                      required
                    />
                  </div>

                  {formFields.category !== 'Secure Notes' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">URL / Link</label>
                      <input
                        type="url"
                        placeholder="e.g. https://github.com"
                        value={formFields.url}
                        onChange={(e) => setFormFields({ ...formFields, url: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                      />
                    </div>
                  )}
                </div>

                {formFields.category === 'Logins' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Username</label>
                      <input
                        type="text"
                        placeholder="e.g. johndoe"
                        value={formFields.username}
                        onChange={(e) => setFormFields({ ...formFields, username: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. john@gmail.com"
                        value={formFields.email}
                        onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                      />
                    </div>
                  </div>
                )}

                {formFields.category === 'Cards' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={formFields.cardholderName}
                          onChange={(e) => setFormFields({ ...formFields, cardholderName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Card Number</label>
                        <input
                          type="text"
                          placeholder="4111 2222 3333 4444"
                          value={formFields.cardNumber}
                          onChange={(e) => setFormFields({ ...formFields, cardNumber: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm font-mono focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Expiration Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={formFields.cardExpiry}
                          onChange={(e) => setFormFields({ ...formFields, cardExpiry: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm font-mono focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">CVV Code</label>
                        <input
                          type="text"
                          placeholder="321"
                          value={formFields.cardCvv}
                          onChange={(e) => setFormFields({ ...formFields, cardCvv: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm font-mono focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formFields.category === 'Finance' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Bank Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Chase"
                          value={formFields.bankName}
                          onChange={(e) => setFormFields({ ...formFields, bankName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Account Number</label>
                        <input
                          type="text"
                          placeholder="123456789"
                          value={formFields.accountNumber}
                          onChange={(e) => setFormFields({ ...formFields, accountNumber: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm font-mono focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">Routing Number</label>
                        <input
                          type="text"
                          placeholder="987654321"
                          value={formFields.routingNumber}
                          onChange={(e) => setFormFields({ ...formFields, routingNumber: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm font-mono focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formFields.category === 'Logins' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider">Password *</label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-xs font-semibold text-[#4F7CFF] hover:text-[#3D68E8] transition focus:outline-none flex items-center gap-1"
                      >
                        <FiCpu size={14} /> Auto Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter password..."
                      value={formFields.password}
                      onChange={(e) => setFormFields({ ...formFields, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm font-mono focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition"
                      required
                    />

                    {formFields.password && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-[#6B7890]">Security Score: {strength.score}%</span>
                          <span className={
                            strength.rating === 'Strong' ? 'text-[#42A982] font-semibold' :
                            strength.rating === 'Moderate' ? 'text-[#D99A45] font-semibold' : 'text-[#D96B6B] font-semibold'
                          }>{strength.rating}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#F7F9FC] rounded-full overflow-hidden border border-[#E6EBF2]">
                          <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.score}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-2">
                    {formFields.category === 'Secure Notes' ? 'Secure Notes Content *' : 'Secure Notes / Memo'}
                  </label>
                  <textarea
                    placeholder={formFields.category === 'Secure Notes' ? 'Enter secret notes content...' : 'Add notes or memo...'}
                    value={formFields.notes}
                    onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}
                    rows={formFields.category === 'Secure Notes' ? 5 : 2}
                    className="w-full px-4 py-2.5 bg-white border border-[#E6EBF2] rounded-xl text-[#172033] text-sm focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#EEF4FF] transition resize-none"
                    required={formFields.category === 'Secure Notes'}
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#E6EBF2]">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="flex-1 py-2.5 bg-[#F7F9FC] hover:bg-[#EEF4FF] border border-[#E6EBF2] rounded-xl text-xs font-semibold text-[#172033] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#4F7CFF] hover:bg-[#3D68E8] rounded-xl text-xs font-semibold text-white transition shadow-xs cursor-pointer"
                  >
                    {currentEditItem ? 'Save Changes' : 'Add Credentials'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal (Danger Red Action) */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-[#172033]"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white p-6 text-center relative z-10 border border-[#E6EBF2] rounded-2xl shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-[#FFF0F0] flex items-center justify-center text-[#D96B6B] mx-auto mb-4 border border-[#E6EBF2]">
                <FiTrash size={20} />
              </div>

              <h3 className="text-lg font-bold font-outfit text-[#172033] mb-2">Delete Credential Card</h3>
              <p className="text-xs text-[#6B7890] leading-relaxed mb-6">
                Are you sure you want to delete credentials for <strong>{itemToDelete?.website}</strong>? This change cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 bg-[#F7F9FC] hover:bg-[#EEF4FF] border border-[#E6EBF2] rounded-xl text-xs font-semibold text-[#172033] transition cursor-pointer"
                >
                  Keep Item
                </button>
                <button
                  onClick={handleDeleteItem}
                  className="flex-1 py-2.5 bg-[#D96B6B] hover:bg-[#C55A5A] rounded-xl text-xs font-semibold text-white transition cursor-pointer shadow-xs"
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

export default Vault;
