/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Save, Trash2, Search, Calendar, User, Phone, DollarSign } from 'lucide-react';
import { Ledger } from '../types';
import { loadDatabase, saveDatabase, getTodayDateString } from '../lib/db';

interface LedgerPageProps {
  onBack: () => void;
}

export function LedgerPage({ onBack }: LedgerPageProps) {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [ledgerDate, setLedgerDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setLedgerDate(getTodayDateString());
    loadLedgers();
  }, []);

  const loadLedgers = () => {
    const db = loadDatabase();
    setLedgers(db.ledgers || []);
  };

  const triggerAlert = (message: string) => {
    if (typeof (window as any).customAlert === 'function') {
      (window as any).customAlert(message);
    } else {
      alert(message);
    }
  };

  const handleDelete = (ledgerId: number, customerName: string) => {
    const action = () => {
      const db = loadDatabase();
      db.ledgers = db.ledgers.filter(l => l.id !== ledgerId);
      saveDatabase(db);
      loadLedgers();
    };

    if (typeof (window as any).customConfirm === 'function') {
      (window as any).customConfirm(`আপনি কি বাকি খাতা থেকে "${customerName}" এর এই খতিয়ানটি ডিলিট করতে চান?`, action);
    } else if (confirm(`আপনি কি বাকি খাতা থেকে "${customerName}" এর এই খতিয়ানটি ডিলিট করতে চান?`)) {
      action();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) {
      triggerAlert('দয়া করে সঠিক নাম এবং টাকার পরিমাণ নিশ্চিত করুন!');
      return;
    }

    const val = parseFloat(amount) || 0;
    const db = loadDatabase();

    const newLedger: Ledger = {
      id: Date.now(),
      date: ledgerDate,
      name: name.trim(),
      phone: phone.trim(),
      amount: val,
    };

    db.ledgers.push(newLedger);
    saveDatabase(db);
    
    triggerAlert('✅ বাকি খাতার এন্ট্রি সফলভাবে সংরক্ষিত হয়েছে!');
    
    // Reset Form
    setName('');
    setPhone('');
    setAmount('');
    loadLedgers();
  };

  const filteredLedgers = ledgers.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm)
  );

  const totalDues = filteredLedgers.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors cursor-pointer text-slate-600 focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">📖 কাস্টমার বাকি খাতা</h2>
            <p className="text-xs text-slate-500">বাকি লেনদেন, ক্রেতার মোবাইল নম্বর ও ডিউ ট্র্যাকার</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 mb-2 border-l-4 border-rose-600 pl-2">📝 নতুন বাকি যুক্ত করুন</h3>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">বাকি দেওয়ার তারিখ (Date)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                id="ledger-date"
                type="date"
                value={ledgerDate}
                onChange={(e) => setLedgerDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-sans font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">কাস্টমারের নাম (Customer Name)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="ledger-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: মোঃ রাজু আহমেদ"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">মোবাইল নাম্বার (Mobile Number)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                id="ledger-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: ০১৭১XXXXXXX"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">বাকি টাকার পরিমাণ (Amount)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <span className="text-sm font-bold">৳</span>
              </span>
              <input
                id="ledger-amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-sans font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-850 text-white font-bold rounded-xl shadow-lg shadow-orange-500/10 transition-colors duration-150 flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            বাকি এন্ট্রি করুন
          </button>
        </form>

        {/* RIGHT LEDGER TABLE LIST */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 border-l-4 border-blue-600 pl-2">📖 বাকি খাতার তালিকা</h3>
            
            {/* Live Search Input */}
            <div className="flex gap-2 items-center">
              {totalDues > 0 && (
                <span className="bg-red-50 text-red-700 border border-red-100 font-bold font-sans text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap">
                  মোট বাকি: {totalDues.toFixed(2)} ৳
                </span>
              )}
              <div className="relative w-40 sm:w-48">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="কাস্টমার নাম বা মোবাইল..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-250 bg-slate-50/50 rounded-xl text-[11px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm max-h-[440px] overflow-y-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-left text-slate-600 font-bold">তারিখ</th>
                  <th className="py-2.5 px-3 text-left text-slate-600 font-bold">কাস্টমার</th>
                  <th className="py-2.5 px-3 text-left text-slate-600 font-bold">মোবাইল</th>
                  <th className="py-2.5 px-3 text-right text-slate-600 font-bold w-20">টাকা</th>
                  <th className="py-2.5 px-3 text-center text-slate-600 font-bold w-12">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody id="ledger-table-body" className="divide-y divide-slate-100">
                {filteredLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                      কোনো বাকি রেকর্ড পাওয়া যায়নি!
                    </td>
                  </tr>
                ) : (
                  filteredLedgers.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                        {l.date}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {l.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans">
                        {l.phone || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap font-sans">
                        {l.amount.toFixed(2)} ৳
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(l.id, l.name)}
                          className="p-1 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="বাকি পরিশোধ বা মুছে ফেলা"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
