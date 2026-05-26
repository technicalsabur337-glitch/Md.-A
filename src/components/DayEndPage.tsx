/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { AppDatabase, DayBalances, CustomItem } from '../types';
import { PAYMENT_KEYS, PAYMENT_METHODS, getTodayDateString, loadDatabase, saveDatabase } from '../lib/db';

interface DayEndPageProps {
  onBack: () => void;
}

export function DayEndPage({ onBack }: DayEndPageProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [balances, setBalances] = useState<DayBalances>({
    cash: 0,
    bkash: 0,
    rocket: 0,
    nagad: 0,
    load1: 0,
    load2: 0,
    other: 0,
  });

  const [porishod, setPorishod] = useState<CustomItem[]>([]);

  useEffect(() => {
    const todayStr = getTodayDateString();
    setSelectedDate(todayStr);
    loadDateData(todayStr);
  }, []);

  const loadDateData = (dateStr: string) => {
    const db = loadDatabase();

    // Load balances if dayEnd already recorded
    if (db.dayEnd[dateStr]) {
      setBalances(db.dayEnd[dateStr]);
    } else {
      // Pre-fill fields with current DayStart balances for convenience
      if (db.dayStart[dateStr]) {
        setBalances(db.dayStart[dateStr]);
      } else {
        // Reset to zeros
        setBalances({
          cash: 0,
          bkash: 0,
          rocket: 0,
          nagad: 0,
          load1: 0,
          load2: 0,
          other: 0,
        });
      }
    }

    // Load supplier payments (পরিশোধ)
    if (db.porishod[dateStr]) {
      setPorishod(
        db.porishod[dateStr].map(item => ({
          id: item.id || Math.random().toString(),
          label: item.label,
          amount: item.amount,
        }))
      );
    } else {
      setPorishod([]);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (newDate) {
      loadDateData(newDate);
    }
  };

  const handleValueChange = (key: keyof DayBalances, value: string) => {
    const numeric = parseFloat(value) || 0;
    setBalances(prev => ({
      ...prev,
      [key]: numeric,
    }));
  };

  const addPorishodItem = () => {
    setPorishod(prev => [
      ...prev,
      { id: Math.random().toString(), label: '', amount: 0 },
    ]);
  };

  const removePorishodItem = (id: string | number) => {
    setPorishod(prev => prev.filter(item => item.id !== id));
  };

  const handlePorishodFieldChange = (index: number, field: 'label' | 'amount', value: string) => {
    setPorishod(prev => {
      const copy = [...prev];
      if (field === 'label') {
        copy[index].label = value;
      } else if (field === 'amount') {
        copy[index].amount = parseFloat(value) || 0;
      }
      return copy;
    });
  };

  const totalPorishod = porishod.reduce((sum, item) => sum + (item.amount || 0), 0);

  const triggerAlert = (message: string) => {
    if (typeof (window as any).customAlert === 'function') {
      (window as any).customAlert(message);
    } else {
      alert(message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      triggerAlert('দয়া করে সঠিক তারিখ নির্বাচন করুন!');
      return;
    }

    const db = loadDatabase();
    db.dayEnd[selectedDate] = balances;
    db.porishod[selectedDate] = porishod
      .filter(item => item.label.trim() !== '')
      .map(item => ({
        id: item.id,
        label: item.label,
        amount: item.amount,
      }));

    saveDatabase(db);
    triggerAlert(`✅ ${selectedDate} তারিখের দিনের শেষ ক্লোজিং ব্যালেন্স ও পরিশোধসমূহ সফলভাবে সংরক্ষিত হয়েছে!`);
    onBack();
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors cursor-pointer text-slate-600 focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">🌌 দিনের শেষ ক্লোজিং ব্যালেন্স এন্ট্রি</h2>
          <p className="text-xs text-slate-500">দিনের শেষ ক্লোজিং ড্রয়ার ব্যালেন্স ও ক্যাশ আউট পেমেন্ট নিবন্ধন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selector */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-sm font-bold text-slate-800">তারিখ নির্বাচন (Date Selection)</span>
            <p className="text-xs text-slate-500">যে তারিখের ক্লোজিং ড্রয়ার হিসাব সম্পাদন করছেন</p>
          </div>
          <input
            id="end-date"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-850 font-sans font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />
        </div>

        {/* Dynamic Balance Entry List */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 border-l-4 border-blue-600 pl-2">💰 ক্লোজিং ড্রয়ার ব্যালেন্স</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAYMENT_KEYS.map(key => (
              <div key={key} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all p-3.5 rounded-xl flex items-center justify-between gap-4">
                <label className="text-sm font-semibold text-slate-700 leading-none shrink-0">
                  {PAYMENT_METHODS[key]}
                </label>
                <div className="relative max-w-[150px]">
                  <input
                    id={`end-${key}`}
                    type="number"
                    step="any"
                    value={balances[key] || ''}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-3 pr-7 py-2 text-right bg-white border border-slate-200 rounded-lg text-slate-900 font-sans font-semibold text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute inset-y-0 right-2.5 flex items-center text-xs font-bold text-slate-400">৳</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supplier payments lists */}
        <div className="border-t border-slate-100 pt-5 mt-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800 border-l-4 border-blue-600 pl-2">✅ প্রদান ও পরিশোধসমূহ (Payments Made)</h3>
              <p className="text-xs text-slate-400">মহাজন বা সাপ্লায়ারদের কাছে আজকে পরিশোধকৃত মোট টাকা</p>
            </div>
            {totalPorishod > 0 && (
              <span id="porishod-total-badge" className="bg-blue-100 text-blue-900 border border-blue-100 font-bold text-xs px-3 py-1 rounded-full font-sans shadow-sm">
                মোট: {totalPorishod.toFixed(2)} ৳
              </span>
            )}
          </div>

          <div id="porishod-items" className="space-y-3">
            {porishod.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
                আজকে কোনো প্রকার পরিশোধ বা ক্যাশ আউট বিতরণী করা হয়নি
              </p>
            ) : (
              porishod.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.label}
                    placeholder={`পরিশোধ কার নাম বা বিবরণ ${index + 1}`}
                    onChange={(e) => handlePorishodFieldChange(index, 'label', e.target.value)}
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                  <div className="relative w-28 sm:w-36 shrink-0">
                    <input
                      type="number"
                      step="any"
                      value={item.amount || ''}
                      placeholder="টাকা"
                      onChange={(e) => handlePorishodFieldChange(index, 'amount', e.target.value)}
                      className="w-full pl-3 pr-6 py-2 text-right border border-slate-200 rounded-xl text-slate-900 font-semibold font-sans text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      required
                    />
                    <span className="absolute inset-y-0 right-2.5 flex items-center text-[10px] font-bold text-slate-400">৳</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePorishodItem(item.id)}
                    className="p-2 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 text-rose-600 rounded-xl shrink-0 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={addPorishodItem}
            className="add-item-btn w-full mt-3 py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 text-slate-600 hover:text-blue-600 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            নতুন পরিশোধ আইটেম যোগ করুন
          </button>
        </div>

        {/* Action Button */}
        <div className="border-t border-slate-100 pt-5 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer text-sm"
          >
            <Save className="w-4 h-4" />
            দিনের শেষ সম্পন্ন করুন
          </button>
        </div>
      </form>
    </div>
  );
}
