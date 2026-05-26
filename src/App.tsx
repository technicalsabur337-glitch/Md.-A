/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Sunrise, 
  Package, 
  ShoppingCart, 
  BookOpen, 
  CreditCard, 
  TrendingUp, 
  Sunset, 
  LogOut, 
  Store, 
  User as UserIcon,
  Shield,
  HelpCircle
} from 'lucide-react';

import { User } from './types';
import { AuthSection } from './components/AuthSection';
import { AdminBanner } from './components/AdminBanner';
import { DayStartPage } from './components/DayStartPage';
import { ProductPage } from './components/ProductPage';
import { SalePage } from './components/SalePage';
import { LedgerPage } from './components/LedgerPage';
import { CashPage } from './components/CashPage';
import { DayEndPage } from './components/DayEndPage';
import { ReportPage } from './components/ReportPage';

import { 
  getActiveSession, 
  setActiveSession, 
  DEFAULT_USERS, 
  loadUsers, 
  isUserAdmin 
} from './lib/db';

const getAppBaseUrl = (): string => {
  let origin = window.location.origin;
  if (origin === 'null' || !origin) {
    try {
      const url = new URL(window.location.href);
      origin = url.protocol + '//' + url.host;
    } catch (e) {
      origin = '';
    }
  }
  return origin || '';
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard-section');
  const [adminUpdateTrigger, setAdminUpdateTrigger] = useState(0);

  const appBaseUrl = getAppBaseUrl();
  const zipAbsoluteLink = appBaseUrl ? `${appBaseUrl}/it-zone.zip` : '/it-zone.zip';
  const htmlAbsoluteLink = appBaseUrl ? `${appBaseUrl}/it-zone.txt` : '/it-zone.txt';

  // Custom alert/confirm modal states
  const [modalType, setModalType] = useState<'alert' | 'confirm' | null>(null);
  const [modalMessage, setModalMessage] = useState('');
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  const [isHtmlDownloading, setIsHtmlDownloading] = useState(false);
  const [isZipDownloading, setIsZipDownloading] = useState(false);

  // Restore user session on mount
  useEffect(() => {
    const savedUserId = getActiveSession();
    if (savedUserId) {
      const allUsers = [...DEFAULT_USERS, ...loadUsers()];
      const foundUser = allUsers.find(u => u.id === savedUserId && u.status === 'active');
      if (foundUser) {
        setCurrentUser(foundUser);
      } else {
        setActiveSession(null);
      }
    }

    // Expose beautiful global dialog triggers
    (window as any).customConfirm = (message: string, callback: () => void) => {
      setModalMessage(message);
      setModalCallback(() => callback);
      setModalType('confirm');
    };

    (window as any).customAlert = (message: string) => {
      setModalMessage(message);
      setModalType('alert');
    };

    // Listener for custom event dispatched from subcomponents (e.g., Admin approvals)
    const handleUsersUpdate = () => {
      setAdminUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('usersUpdated', handleUsersUpdate);
    return () => {
      window.removeEventListener('usersUpdated', handleUsersUpdate);
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveSession(user.id);
    setCurrentPage('dashboard-section');
  };

  const handleLogout = () => {
    if (typeof (window as any).customConfirm === 'function') {
      (window as any).customConfirm('আপনি কি হিসাব খাতা থেকে লগআউট করতে চান?', () => {
        setCurrentUser(null);
        setActiveSession(null);
        setCurrentPage('dashboard-section');
      });
    } else {
      // Fallback
      setCurrentUser(null);
      setActiveSession(null);
      setCurrentPage('dashboard-section');
    }
  };

  // Render correct page view
  const renderPageView = () => {
    switch (currentPage) {
      case 'day-start-page':
        return <DayStartPage onBack={() => setCurrentPage('dashboard-section')} />;
      case 'product-page':
        return <ProductPage onBack={() => setCurrentPage('dashboard-section')} />;
      case 'sale-page':
        return <SalePage onBack={() => setCurrentPage('dashboard-section')} />;
      case 'ledger-page':
        return <LedgerPage onBack={() => setCurrentPage('dashboard-section')} />;
      case 'cash-page':
        return <CashPage onBack={() => setCurrentPage('dashboard-section')} />;
      case 'day-end-page':
        return <DayEndPage onBack={() => setCurrentPage('dashboard-section')} />;
      case 'report-page':
        return <ReportPage onBack={() => setCurrentPage('dashboard-section')} />;
      default:
        return renderDashboard();
    }
  };

  // Helper functions for base64 decoding and downloading
  const base64ToBlob = (base64Clean: string, mimeType: string): Blob => {
    try {
      const byteCharacters = atob(base64Clean);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (e) {
      console.error('Base64 decode failed:', e);
      throw e;
    }
  };

  const downloadFileFromBase64 = async (url: string, defaultName: string, mimeType: string, setProgress: (val: boolean) => void) => {
    setProgress(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const base64Text = await response.text();
      const cleanB64 = base64Text.replace(/\s/g, '');
      const blob = base64ToBlob(cleanB64, mimeType);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      if (typeof (window as any).customAlert === 'function') {
        (window as any).customAlert(`সফলভাবে ${defaultName} ডাউনলোড হয়েছে!`);
      }
    } catch (err) {
      console.error('Download failed:', err);
      if (typeof (window as any).customAlert === 'function') {
        (window as any).customAlert('অফলাইন ফাইল সরাসরি ডাউনলোড ব্যর্থ হয়েছে! আইফ্রেম বা ব্রাউজার ব্লকের কারণে হতে পারে। দয়া করে পদ্ধতি ২ (লিংক কপি) ব্যবহার করুন।');
      }
    } finally {
      setProgress(false);
    }
  };

  const renderDashboard = () => {
    if (!currentUser) return null;

    const isAdmin = isUserAdmin(currentUser.id);

    return (
      <div id="dashboard-section" className="space-y-6">
        
        {/* Active Shop Profile and Welcome Header */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-6 rounded-2xl shadow-lg border border-blue-600/10 space-y-3 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-white/5 pointer-events-none">
            <Store className="w-48 h-48" />
          </div>

          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-blue-100/70">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>আইটি জোন Ledger v3</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black font-sans tracking-tight">{currentUser.shopName}</h2>
            <p id="welcome-user" className="text-xs font-semibold text-blue-100/95 flex items-center gap-1.5 pt-0.5">
              <UserIcon className="w-3.5 h-3.5 mt-px shrink-0 text-blue-300" />
              প্রোপাইটর: <span className="underline decoration-blue-400 font-bold decoration-2">{currentUser.name}</span>
            </p>
          </div>
        </div>

        {/* Admin Review Banner controls (only visible to admin accounts) */}
        {isAdmin && (
          <AdminBanner trigger={adminUpdateTrigger} currentUserId={currentUser.id} />
        )}

        {/* Practical Menu Nav Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          
          <button
            type="button"
            onClick={() => setCurrentPage('day-start-page')}
            className="group flex flex-col justify-between text-left p-4 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/60 hover:border-emerald-250 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer shadow-sm relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
          >
            <div className="p-3 bg-emerald-500/10 text-emerald-700 group-hover:bg-emerald-500/20 rounded-xl w-11 h-11 flex items-center justify-center transition-colors">
              <Sunrise className="w-5.5 h-5.5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-slate-800 text-sm font-sans tracking-tight leading-none">দিনের শুরু</h4>
              <p className="text-[10px] text-slate-500 mt-1 lines-clamp-1">প্রারম্ভিক ব্যালেন্স এন্ট্রি</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('product-page')}
            className="group flex flex-col justify-between text-left p-4 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/60 hover:border-emerald-250 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer shadow-sm relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
          >
            <div className="p-3 bg-teal-500/10 text-teal-700 group-hover:bg-teal-500/20 rounded-xl w-11 h-11 flex items-center justify-center transition-colors">
              <Package className="w-5.5 h-5.5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-slate-800 text-sm font-sans tracking-tight leading-none">পণ্য স্টক এন্ট্রি</h4>
              <p className="text-[10px] text-slate-500 mt-1 lines-clamp-1">ইনভেন্টরি এন্ট্রি ও তালিকা</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('sale-page')}
            className="group flex flex-col justify-between text-left p-4 bg-slate-50 hover:bg-blue-50/40 border border-slate-200/60 hover:border-blue-250 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer shadow-sm relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          >
            <div className="p-3 bg-blue-500/10 text-blue-700 group-hover:bg-blue-500/20 rounded-xl w-11 h-11 flex items-center justify-center transition-colors">
              <ShoppingCart className="w-5.5 h-5.5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-slate-800 text-sm font-sans tracking-tight leading-none">নতুন বিক্রি এন্ট্রি</h4>
              <p className="text-[10px] text-slate-500 mt-1 lines-clamp-1">নতুন পণ্য সেল এন্ট্রি করুন</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('ledger-page')}
            className="group flex flex-col justify-between text-left p-4 bg-slate-50 hover:bg-orange-50/40 border border-slate-200/60 hover:border-orange-250 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer shadow-sm relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-500/10"
          >
            <div className="p-3 bg-orange-500/10 text-orange-700 group-hover:bg-orange-500/20 rounded-xl w-11 h-11 flex items-center justify-center transition-colors">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-slate-800 text-sm font-sans tracking-tight leading-none">বাকি খাতা</h4>
              <p className="text-[10px] text-slate-500 mt-1 lines-clamp-1">বাকি খাতা লেনদেন হিসাব</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('cash-page')}
            className="group flex flex-col justify-between text-left p-4 bg-slate-50 hover:bg-rose-50/40 border border-slate-200/60 hover:border-rose-250 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer shadow-sm relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-500/10"
          >
            <div className="p-3 bg-rose-500/10 text-rose-700 group-hover:bg-rose-500/20 rounded-xl w-11 h-11 flex items-center justify-center transition-colors">
              <CreditCard className="w-5.5 h-5.5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-slate-800 text-sm font-sans tracking-tight leading-none">খরচ এন্ট্রি</h4>
              <p className="text-[10px] text-slate-500 mt-1 lines-clamp-1">দৈনিক দোকান বা নিজ খরচ</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('report-page')}
            className="group flex flex-col justify-between text-left p-4 bg-slate-50 hover:bg-blue-50/40 border border-slate-200/60 hover:border-blue-250 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer shadow-sm relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          >
            <div className="p-3 bg-indigo-500/10 text-indigo-700 group-hover:bg-indigo-500/20 rounded-xl w-11 h-11 flex items-center justify-center transition-colors">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-slate-800 text-sm font-sans tracking-tight leading-none">লাভ-ক্ষতি রিপোর্ট</h4>
              <p className="text-[10px] text-slate-500 mt-1 lines-clamp-1">আয়-ব্যয় খতিয়ান চার্ট</p>
            </div>
          </button>

          <div className="col-span-2">
            <button
              type="button"
              onClick={() => setCurrentPage('day-end-page')}
              className="group w-full flex items-center justify-between text-left p-4 bg-slate-900 hover:bg-slate-950 text-white hover:shadow-md transition-all duration-200 rounded-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-indigo-300 group-hover:bg-indigo-950 rounded-xl w-11 h-11 flex items-center justify-center">
                  <Sunset className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-50 text-sm font-sans tracking-tight leading-none">দিনের শেষ সম্পন্ন করুন</h4>
                  <p className="text-[10px] text-slate-400 mt-1">ক্লোজিং ক্যাশ হিসেব ও ডে-এন্ড ক্লোজার</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 hover:bg-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-700">🌌 শেষ করুন</span>
            </button>
          </div>

        </div>

        {/* Mobile Application Link & Download Section */}
        <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex flex-col gap-4 mt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-700 rounded-xl animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smartphone"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-800 text-sm font-sans tracking-tight">অফলাইন মোবাইল ও ডেক্সটপ ফাইল</h4>
              <p className="text-[10px] text-slate-500">সম্পূর্ণ অফলাইনে কাস্টম অ্যাপ বা ব্রাউজারে চালানোর জন্য ফাইল</p>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-left space-y-1.5">
            <p className="text-[10px] text-blue-800 leading-relaxed font-semibold">
              ⚠️ ব্রাউজার সিকিউরিটি (Iframe Sandbox) ও CORS নিয়মের কারণে আইফ্রেমের ভেতর থেকে সরাসরি ডাউনলোড হয়তো ব্লক হতে পারে। নিচের যেকোনো পদ্ধতি ব্যবহার করুন:
            </p>
            <ul className="list-decimal list-inside text-[9px] text-slate-600 space-y-1">
              <li><b>পদ্ধতি ১ (সরাসরি):</b> নিচের নীল বা সবুজ বাটনে চাপ দিয়ে সরাসরি ইন-ব্রাউজার ডাউনলোড করুন।</li>
              <li><b>পদ্ধতি ২ (লিংক কপি):</b> কপিকৃত লিংকটি ব্রাউজারের নতুন ট্যাবে পেস্ট করুন।</li>
              <li><b>পদ্ধতি ৩ (নতুন ট্যাবে সরাসরি ভিজিট):</b> সরাসরি নতুন ট্যাবে ফুল-ভলিউম ফাইলটি ওপেন করতে ডানদিকের <b>"ভিজিট করুন ↗"</b> লিংকে ক্লিক করুন ও ক্রোম ব্রাউজারে <b>Ctrl + S</b> চেপে সেভ করে নিন।</li>
            </ul>
          </div>

          {/* METHOD 1: Direct Base64 Decoded Downloads */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">পদ্ধতি ১: সরাসরি ইন-ব্রাউজার ডাউনলোড</div>
            <div className="grid grid-cols-2 gap-2 w-full">
              {/* HTML Download Button */}
              <button 
                type="button"
                disabled={isHtmlDownloading}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-350 text-white font-bold text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-1 shadow-sm text-center cursor-pointer font-sans"
                onClick={() => downloadFileFromBase64(appBaseUrl ? `${appBaseUrl}/it-zone-html-base64.txt` : '/it-zone-html-base64.txt', 'it-zone.html', 'text/html', setIsHtmlDownloading)}
              >
                {isHtmlDownloading ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ডাউনলোড হচ্ছে...
                  </span>
                ) : (
                  '📄 HTML ডাউনলোড'
                )}
              </button>

              {/* ZIP Download Button */}
              <button 
                type="button"
                disabled={isZipDownloading}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-350 text-white font-bold text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-1 shadow-sm text-center cursor-pointer font-sans"
                onClick={() => downloadFileFromBase64(appBaseUrl ? `${appBaseUrl}/it-zone-zip-base64.txt` : '/it-zone-zip-base64.txt', 'it-zone.zip', 'application/zip', setIsZipDownloading)}
              >
                {isZipDownloading ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ডাউনলোড হচ্ছে...
                  </span>
                ) : (
                  '📦 ZIP ডাউনলোড'
                )}
              </button>
            </div>
          </div>

          {/* METHOD 2: Link Copier Buttons */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">পদ্ধতি ২: নতুন ট্যাবে ডাউনলোড (লিংক কপি)</div>
            <div className="grid grid-cols-2 gap-2 w-full">
              {/* Copy ZIP Link */}
              <button 
                type="button"
                className="py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-1 shadow-sm text-center cursor-pointer font-sans"
                onClick={() => {
                  const absoluteLink = zipAbsoluteLink;
                  navigator.clipboard.writeText(absoluteLink).then(() => {
                    if (typeof (window as any).customAlert === 'function') {
                      (window as any).customAlert('জিপ ডাউনলোড লিংক ক্লিপবোর্ডে কপি হয়েছে! নতুন ট্যাবে বা অন্য ব্রাউজারে লিংকটি পেস্ট করে এন্টার চেপে রিলিজ বা ডাউনলোড করুন।');
                    }
                  }).catch(() => {
                    if (typeof (window as any).customAlert === 'function') {
                      (window as any).customAlert(`লিংকটি কপি করুন: ${absoluteLink}`);
                    }
                  });
                }}
              >
                🔗 কপি ZIP লিংক
              </button>

              {/* Copy HTML Source Link */}
              <button 
                type="button"
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-1 shadow-sm text-center cursor-pointer font-sans"
                onClick={() => {
                  const absoluteLink = htmlAbsoluteLink;
                  navigator.clipboard.writeText(absoluteLink).then(() => {
                    if (typeof (window as any).customAlert === 'function') {
                      (window as any).customAlert('এইচটিএমএল টেক্সট সোর্স লিংক কপি হয়েছে! নতুন ট্যাবে এটি খুললে আপনি কোড ফাইল দেখতে পাবেন ও Ctrl+S চেপে সেভ করতে পারবেন।');
                    }
                  }).catch(() => {
                    if (typeof (window as any).customAlert === 'function') {
                      (window as any).customAlert(`সরাসরি সোর্স লিংক: ${absoluteLink}`);
                    }
                  });
                }}
              >
                🔗 কপি HTML লিংক
              </button>
            </div>
          </div>

          {/* METHOD 3: Interactive manual URL boxes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">পদ্ধতি ৩: ম্যানুয়াল সোর্স ও সরাসরি ভিজিট লিংক</div>
            <div className="space-y-1.5">
              <div className="flex gap-2 items-center bg-slate-100/60 p-2 rounded-xl border border-slate-200/50">
                <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">ZIP URL</span>
                <input 
                  type="text" 
                  readOnly 
                  value={zipAbsoluteLink} 
                  onClick={(e) => (e.target as any).select()}
                  className="text-[10px] font-mono select-all truncate bg-transparent focus:outline-none flex-1 text-slate-600 font-medium"
                />
                <a href={zipAbsoluteLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-650 hover:text-blue-800 shrink-0 px-2 py-1 bg-white hover:bg-blue-50/20 border border-slate-200 rounded-lg shadow-xs transition-all">ভিজিট করুন ↗</a>
              </div>
              <div className="flex gap-2 items-center bg-slate-100/60 p-2 rounded-xl border border-slate-200/50">
                <span className="text-[9px] font-bold text-slate-500 bg-slate-300 px-1.5 py-0.5 rounded shrink-0">TXT HTML</span>
                <input 
                  type="text" 
                  readOnly 
                  value={htmlAbsoluteLink} 
                  onClick={(e) => (e.target as any).select()}
                  className="text-[10px] font-mono select-all truncate bg-transparent focus:outline-none flex-1 text-slate-600 font-medium"
                />
                <a href={htmlAbsoluteLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-teal-650 hover:text-teal-800 shrink-0 px-2 py-1 bg-white hover:bg-teal-50/20 border border-slate-200 rounded-lg shadow-xs transition-all">ভিজিট করুন ↗</a>
              </div>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors duration-150 flex items-center justify-center gap-2 mt-4 cursor-pointer text-xs border border-rose-100"
        >
          <LogOut className="w-4 h-4" />
          🚪 অ্যাকাউন্ট লগআউট করুন
        </button>

      </div>
    );
  };

  const handleModalConfirm = () => {
    if (modalCallback) {
      modalCallback();
    }
    setModalType(null);
    setModalCallback(null);
  };

  const handleModalCancel = () => {
    setModalType(null);
    setModalCallback(null);
  };

  return (
    <div className="w-full flex justify-center items-start min-h-screen bg-slate-50/50 p-0 sm:py-6">
      <div className="app-container w-full max-w-lg bg-white p-4 sm:p-5 flex flex-col min-h-screen sm:min-h-[92vh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-100 overflow-y-auto">
        {currentUser ? renderPageView() : <AuthSection onLoginSuccess={handleLoginSuccess} />}
      </div>

      {/* Custom Modern Confirm/Alert Modal */}
      {modalType !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 transform transition-all">
            <div className="flex flex-col items-center text-center space-y-4">
              {modalType === 'confirm' ? (
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
              )}
              
              <div className="space-y-1.5 px-1">
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {modalMessage}
                </p>
              </div>

              <div className="flex gap-2 w-full mt-2">
                {modalType === 'confirm' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleModalConfirm}
                      className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                    >
                      হ্যাঁ, নিশ্চিত
                    </button>
                    <button
                      type="button"
                      onClick={handleModalCancel}
                      className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      বাতিল
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                  >
                    ঠিক আছে
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
