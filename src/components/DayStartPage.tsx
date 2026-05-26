/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Sparkles, DollarSign } from 'lucide-react';
import { AppDatabase, DayBalances, CustomItem } from '../types';
import { PAYMENT_KEYS, PAYMENT_METHODS, getTodayDateString, loadDatabase, saveDatabase } from '../lib/db';

interface DayStartPageProps {
  onBack: () => void;
}

export function DayStartPage({ onBack }: DayStartPageProps) {
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

  const [pawona, setPawona] = useState<CustomItem[]>([]);
  const [prevDayInfo, setPrevDayInfo] = useState<{
    date: string;
    expensesSum: Record<string, number>;
    closingBals: DayBalances;
  } | null>(null);

  useEffect(() => {
    const todayStr = getTodayDateString();
    setSelectedDate(todayStr);
    loadDateData(todayStr);
  }, []);

  const loadDateData = (dateStr: string) => {
    const db = loadDatabase();
    setPrevDayInfo(null);
    
    // Check if day start exists for this date
    if (db.dayStart[dateStr]) {
      setBalances(db.dayStart[dateStr]);
      
      // Load previous day end and expenses info for display even if custom start is already recorded
      const priorDates = Object.keys(db.dayEnd)
        .filter(d => d < dateStr)
        .sort((a, b) => b.localeCompare(a));
      if (priorDates.length > 0) {
        const prevDate = priorDates[0];
        const lastClosing = db.dayEnd[prevDate];
        const prevExpenses = db.expenses || [];
        const prevDateExpenses = prevExpenses.filter(e => e.date === prevDate);
        
        const sumExpMap: Record<string, number> = {};
        PAYMENT_KEYS.forEach(k => {
          sumExpMap[k] = prevDateExpenses
            .filter(e => e.method === k)
            .reduce((sum, e) => sum + (e.amount || 0), 0);
        });
        
        setPrevDayInfo({
          date: prevDate,
          expensesSum: sumExpMap,
          closingBals: lastClosing,
        });
      }
    } else {
      // Find latest previous dayEnd
      const priorDates = Object.keys(db.dayEnd)
        .filter(d => d < dateStr)
        .sort((a, b) => b.localeCompare(a));
        
      if (priorDates.length > 0) {
        const prevDate = priorDates[0];
        const lastClosing = db.dayEnd[prevDate];
        const prevExpenses = db.expenses || [];
        const prevDateExpenses = prevExpenses.filter(e => e.date === prevDate);
        
        const sumExpMap: Record<string, number> = {};
        const calculatedBalances: DayBalances = {
          cash: 0,
          bkash: 0,
          rocket: 0,
          nagad: 0,
          load1: 0,
          load2: 0,
          other: 0,
        };

        PAYMENT_KEYS.forEach(key => {
          const closingVal = lastClosing[key] || 0;
          const expVal = prevDateExpenses
            .filter(e => e.method === key)
            .reduce((sum, e) => sum + (e.amount || 0), 0);
          sumExpMap[key] = expVal;
          calculatedBalances[key] = closingVal - expVal;
        });

        setBalances(calculatedBalances);
        setPrevDayInfo({
          date: prevDate,
          expensesSum: sumExpMap,
          closingBals: lastClosing,
        });
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
        setPrevDayInfo(null);
      }
    }

    // Load Receivables
    if (db.pawona[dateStr]) {
      setPawona(
        db.pawona[dateStr].map(item => ({
          id: item.id || Math.random().toString(),
          label: item.label,
          amount: item.amount,
        }))
      );
    } else {
      setPawona([]);
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

  const addPawonaItem = () => {
    setPawona(prev => [
      ...prev,
      { id: Math.random().toString(), label: '', amount: 0 },
    ]);
  };

  const removePawonaItem = (id: string | number) => {
    setPawona(prev => prev.filter(item => item.id !== id));
  };

  const handlePawonaFieldChange = (index: number, field: 'label' | 'amount', value: string) => {
    setPawona(prev => {
      const copy = [...prev];
      if (field === 'label') {
        copy[index].label = value;
      } else if (field === 'amount') {
        copy[index].amount = parseFloat(value) || 0;
      }
      return copy;
    });
  };

  const totalPawona = pawona.reduce((sum, item) => sum + (item.amount || 0), 0);

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
      triggerAlert('দয়া করে একটি সঠিক তারিখ নির্বাচন করুন!');
      return;
    }

    const db = loadDatabase();
    db.dayStart[selectedDate] = balances;
    db.pawona[selectedDate] = pawona
      .filter(p => p.label.trim() !== '')
      .map(p => ({
        id: p.id,
        label: p.label,
        amount: p.amount,
      }));

    saveDatabase(db);
    triggerAlert(`✅ ${selectedDate} তারিখের দিনের শুরু ব্যালেন্স ও পাওনা তথ্য সংরক্ষিত হয়েছে!`);
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
          <h2 className="text-xl font-bold text-slate-900 font-sans">🌅 দিনের শুরু ব্যালেন্স ও পাওনা এন্ট্রি</h2>
          <p className="text-xs text-slate-500">প্রারম্ভিক ক্যাশ, ব্যালেন্স এবং পাওনার বিবরণ লিখুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selector */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-sm font-bold text-slate-800">তারিখ নির্বাচন (Date Selection)</span>
            <p className="text-xs text-slate-500">যে দিনের ক্যাশ শুরু করছেন</p>
          </div>
          <input
            id="start-date"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-850 font-sans font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />
        </div>

        {/* Dynamic Balance Entry List */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 border-l-4 border-blue-600 pl-2">💰 প্রারম্ভিক অ্যাকাউন্ট ব্যালেন্স</h3>
          
          {prevDayInfo && (
            <div className="mb-4 bg-blue-50/80 border border-blue-200/60 rounded-xl p-4 text-xs text-slate-700 space-y-1.5 shadow-sm">
              <span className="font-bold flex items-center gap-1.5 text-blue-900 text-sm">
                💡 স্বয়ংক্রিয় প্রারম্ভিক ব্যালেন্স (Deducted Previous Day Expenses)
              </span>
              <p className="leading-relaxed text-slate-600">
                পূর্ববর্তী দিনের শেষ হিসাব <strong>({prevDayInfo.date})</strong> এর ক্লোজিং ড্রয়ার ব্যালেন্স থেকে তৈরি করা ঐ দিনের যাবতীয় খরচের পরিমাণ স্বয়ংক্রিয়ভাবে বিয়োগ দিয়ে আজকের দিনের শুরুতে নিচের মতো সাজানো হয়েছে:
              </p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {PAYMENT_KEYS.map(k => {
                  const closeVal = prevDayInfo.closingBals[k] || 0;
                  const expSum = prevDayInfo.expensesSum[k] || 0;
                  if (closeVal > 0 || expSum > 0) {
                    return (
                      <div key={k} className="flex justify-between items-center bg-white/60 p-2 rounded-lg border border-slate-100 font-sans text-xs">
                        <span className="font-medium text-slate-600">{PAYMENT_METHODS[k]}:</span>
                        <span className="font-bold text-slate-800">
                          {closeVal.toFixed(1)} - {expSum.toFixed(1)} = <span className="text-blue-600">{(closeVal - expSum).toFixed(1)} ৳</span>
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAYMENT_KEYS.map(key => (
              <div key={key} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all p-3.5 rounded-xl flex items-center justify-between gap-4">
                <label className="text-sm font-semibold text-slate-700 leading-none shrink-0">
                  {PAYMENT_METHODS[key]}
                </label>
                <div className="relative max-w-[150px]">
                  <input
                    id={`start-${key}`}
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

        {/* Receivables List */}
        <div className="border-t border-slate-100 pt-5 mt-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800 border-l-4 border-amber-600 pl-2">📈 দিনান্তের সম্ভাব্য পাওনা সমুহ (Receivables)</h3>
              <p className="text-xs text-slate-400">পূর্বের দিন পর্যন্ত কাস্টমার/অন্যান্যদের কাছ থেকে পাওনা</p>
            </div>
            {totalPawona > 0 && (
              <span id="pawona-total-badge" className="bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1 rounded-full font-sans shadow-sm border border-amber-100">
                মোট: {totalPawona.toFixed(2)} ৳
              </span>
            )}
          </div>

          <div id="pawona-items" className="space-y-3">
            {pawona.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
                পূর্বে কোনো প্রারম্ভিক পাওনা তালিকা যোগ করা হয়নি
              </p>
            ) : (
              pawona.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.label}
                    placeholder={`পাওনার বিবরণ বা নাম ${index + 1}`}
                    onChange={(e) => handlePawonaFieldChange(index, 'label', e.target.value)}
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                  <div className="relative w-28 sm:w-36 shrink-0">
                    <input
                      type="number"
                      step="any"
                      value={item.amount || ''}
                      placeholder="টাকা"
                      onChange={(e) => handlePawonaFieldChange(index, 'amount', e.target.value)}
                      className="w-full pl-3 pr-6 py-2 text-right border border-slate-200 rounded-xl text-slate-900 font-semibold font-sans text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      required
                    />
                    <span className="absolute inset-y-0 right-2.5 flex items-center text-[10px] font-bold text-slate-400">৳</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePawonaItem(item.id)}
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
            onClick={addPawonaItem}
            className="add-item-btn w-full mt-3 py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 text-slate-600 hover:text-blue-600 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            নতুন পাওনা আইটেম যোগ করুন
          </button>
        </div>

        {/* Action Button */}
        <div className="border-t border-slate-100 pt-5 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer text-sm"
          >
            <Save className="w-4 h-4" />
            দিনের শুরু সেভ করুন
          </button>
        </div>
      </form>
    </div>
  );
}
