/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Users, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { User } from '../types';
import { loadUsers, saveUsers } from '../lib/db';

interface AdminBannerProps {
  currentUserId: string;
  trigger?: number;
}

export function AdminBanner({ currentUserId, trigger }: AdminBannerProps) {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    refreshPending();
  }, [trigger]);

  const refreshPending = () => {
    const list = loadUsers().filter(u => u.status === 'pending');
    setPendingUsers(list);
  };

  const handleApprove = (userId: string) => {
    const all = loadUsers();
    const updated = all.map(u => {
      if (u.id === userId) {
        return { ...u, status: 'active' as const };
      }
      return u;
    });
    saveUsers(updated);
    refreshPending();
    
    // Dispatch custom event to notify App component if needed
    window.dispatchEvent(new Event('usersUpdated'));
  };

  const handleReject = (userId: string) => {
    const action = () => {
      const all = loadUsers();
      const updated = all.filter(u => u.id !== userId);
      saveUsers(updated);
      refreshPending();
      window.dispatchEvent(new Event('usersUpdated'));
    };

    if (typeof (window as any).customConfirm === 'function') {
      (window as any).customConfirm('আপনি কি নিশ্চিত যে এই আবেদনটি বাতিল এবং মুছে ফেলতে চান?', action);
    } else if (confirm('আপনি কি নিশ্চিত যে এই আবেদনটি বাতিল এবং মুছে ফেলতে চান?')) {
      action();
    }
  };

  if (pendingUsers.length === 0) return null;

  return (
    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl overflow-hidden mt-4 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-amber-100/50 cursor-pointer text-amber-900"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-200/60 rounded-lg text-amber-800">
            <Users className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-amber-800 font-sans">
            ⏳ {pendingUsers.length} টি নতুন ইউজার অ্যাকাউন্ট অনুমোদনের অপেক্ষায় আছে!
          </span>
        </div>
        <div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-amber-700" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-amber-200 bg-white divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {pendingUsers.map(user => (
            <div key={user.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm leading-tight truncate">{user.name}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-none">
                  দোকান: <span className="font-semibold text-slate-600">{user.shopName}</span> | আইডি: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{user.id}</span>
                </p>
                {user.registeredAt && (
                  <p className="text-slate-400 text-[10px] mt-1">
                    নিবন্ধন তারিখ: {new Date(user.registeredAt).toLocaleDateString('bn-BD')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleApprove(user.id)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-colors text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  অনুমোদন
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(user.id)}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer transition-colors text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  বাতিল
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
