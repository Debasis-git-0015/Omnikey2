import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiDownload, 
  FiFolder, 
  FiCheck, 
  FiCopy, 
  FiExternalLink, 
  FiX, 
  FiZap, 
  FiShield, 
  FiPlayCircle,
  FiToggleRight
} from 'react-icons/fi';

const ExtensionModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const extensionFolderPath = 'c:\\Users\\debas\\OneDrive\\Desktop\\passwordmanager\\browser-extension';

  const handleCopyPath = () => {
    navigator.clipboard.writeText(extensionFolderPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setDownloadStarted(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      let blob = null;

      // 1. Try backend download endpoint first
      try {
        const res = await fetch(`${apiUrl}/extension/download`);
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (err) {
        console.warn('Backend download failed, trying static fallback:', err);
      }

      // 2. Try static public file fallback
      if (!blob) {
        try {
          const res = await fetch('/omnikey-autofill-extension.zip');
          if (res.ok) {
            blob = await res.blob();
          }
        } catch (e) {}
      }

      // 3. Trigger native file download via Blob URL
      if (blob && blob.size > 0) {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = 'omnikey-autofill-extension.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      } else {
        // Fallback: direct window location
        window.location.href = `${apiUrl}/extension/download`;
      }
    } catch (err) {
      console.error('Download error:', err);
      window.open('http://localhost:8080/api/extension/download', '_blank');
    } finally {
      setTimeout(() => setDownloadStarted(false), 3000);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('omnikey_ext_setup_shown', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="fixed inset-0 bg-[#172033]/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-white border border-[#E6EBF2] rounded-3xl shadow-2xl p-6 sm:p-8 z-10 text-left my-8"
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F4F7FB] hover:bg-[#EEF4FF] text-[#6B7890] hover:text-[#172033] flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <FiX size={18} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#4F7CFF] text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
              <FiZap size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#4F7CFF] text-[11px] font-bold tracking-wide uppercase mb-1">
                <span>⚡ Browser Extension</span>
              </div>
              <h2 className="text-xl font-bold font-outfit text-[#172033] tracking-tight">
                Get Omnikey Smart Autofill
              </h2>
              <p className="text-xs text-[#6B7890] mt-0.5 leading-relaxed">
                Automatically fill saved passwords and prompt to save new account credentials whenever you register on any website.
              </p>
            </div>
          </div>

          {/* One-Click Download Box */}
          <div className="bg-[#F8FAFC] border border-[#E6EBF2] rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <FiFolder className="text-[#4F7CFF]" />
                  <span>Omnikey Extension Package (.zip)</span>
                </h4>
                <p className="text-[11px] text-[#6B7890] mt-0.5">
                  Ready-to-install manifest v3 bundle for Chrome, Brave, Edge & Opera.
                </p>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button
                  onClick={handleDownloadZip}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4F7CFF] hover:bg-[#3D68E8] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {downloadStarted ? (
                    <>
                      <FiCheck size={15} />
                      <span>Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <FiDownload size={15} />
                      <span>Download Package</span>
                    </>
                  )}
                </button>
                <a
                  href="http://localhost:8080/api/extension/download"
                  download="omnikey-autofill-extension.zip"
                  className="text-[10px] font-semibold text-[#6B7890] hover:text-[#4F7CFF] transition underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Direct link if download doesn't start
                </a>
              </div>
            </div>

            {/* Direct folder path alternative */}
            <div className="mt-3 pt-3 border-t border-[#E6EBF2]/80 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-[#6B7890] truncate font-mono">
                {extensionFolderPath}
              </span>
              <button
                onClick={handleCopyPath}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F7CFF] hover:underline cursor-pointer"
              >
                {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                <span>{copied ? 'Copied' : 'Copy Path'}</span>
              </button>
            </div>
          </div>

          {/* 3-Step Activation Guide */}
          <div className="space-y-3.5 mb-6">
            <h4 className="text-[11px] font-bold text-[#172033] uppercase tracking-wider font-mono">
              How to Activate in 3 Easy Steps:
            </h4>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 bg-white border border-[#E6EBF2] rounded-xl text-xs">
                <div className="w-6 h-6 rounded-lg bg-[#EEF4FF] text-[#4F7CFF] font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <strong className="text-[#172033]">Download & Unzip:</strong> Click the button above to download the zip file and extract it into a folder. (Or use the local path if running from this repository).
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 bg-white border border-[#E6EBF2] rounded-xl text-xs">
                <div className="w-6 h-6 rounded-lg bg-[#EEF4FF] text-[#4F7CFF] font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <strong className="text-[#172033]">Open Browser Extensions:</strong> In Chrome, Edge, or Brave, open a new tab and go to <code className="px-1.5 py-0.5 bg-[#F4F7FB] border border-[#E6EBF2] rounded text-[#4F7CFF] font-mono text-[11px]">chrome://extensions</code>. Toggle <strong>"Developer mode"</strong> ON in the top-right corner.
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 bg-white border border-[#E6EBF2] rounded-xl text-xs">
                <div className="w-6 h-6 rounded-lg bg-[#EEF4FF] text-[#4F7CFF] font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <strong className="text-[#172033]">Load Unpacked:</strong> Click the <strong>"Load unpacked"</strong> button in the top-left, and select the <code className="px-1.5 py-0.5 bg-[#F4F7FB] border border-[#E6EBF2] rounded text-[#4F7CFF] font-mono text-[11px]">browser-extension</code> folder. Done!
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E6EBF2]">
            <a
              href="http://localhost:8080/test-page"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F7CFF] hover:underline"
            >
              <FiPlayCircle size={15} />
              <span>Launch Verification Arena (Test Page)</span>
              <FiExternalLink size={12} />
            </a>

            <button
              onClick={handleDismiss}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#172033] hover:bg-[#232F48] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              I've Installed It / Got It
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExtensionModal;

