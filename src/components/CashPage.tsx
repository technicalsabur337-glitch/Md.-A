/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Search, Calendar, CreditCard, Tag, Pencil, X } from 'lucide-react';
import { Expense } from '../types';
import { loadDatabase, saveDatabase, PAYMENT_METHODS, getTodayDateString } from '../lib/db';

interface CashPageProps {
  onBack: () => void;
}

export function CashPage({ onBack }: CashPageProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [expenseDate, setExpenseDate] = useState('');
  const [category, setCategory] = useState('সংসার');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);

  const CATEGORIES = [
    { value: 'নিজ', label: 'নিজ (Personal)' },
    { value: 'বাচ্চা', label: 'বাচ্চা (Kids)' },
    { value: 'স্ত্রী', label: 'স্ত্রী (Wife)' },
    { value: 'সংসার', label: 'সংসার (Family)' },
    { value: 'অন্যান্য', label: 'অন্যান্য (Others)' },
  ];

  useEffect(() => {
    setExpenseDate(getTodayDateString());
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const db = loadDatabase();
    setExpenses(db.expenses || []);
  };

  const triggerAlert = (message: string) => {
    if (typeof (window as any).customAlert === 'function') {
      (window as any).customAlert(message);
    } else {
      alert(message);
    }
  };

  const handleDelete = (expenseId: number, explanation: string) => {
    const action = () => {
      const db = loadDatabase();
      db.expenses = db.expenses.filter(e => e.id !== expenseId);
      saveDatabase(db);
      if (editingExpenseId === expenseId) {
        handleCancelEdit();
      } else {
        loadExpenses();
      }
    };

    if (typeof (window as any).customConfirm === 'function') {
      (window as any).customConfirm(`আপনি কি খরচের তালিকা থেকে "${explanation}" এর এই ব্যয়ের হিসাবটি ডিলিট করতে চান?`, action);
    } else if (confirm(`আপনি কি খরচের তালিকা থেকে "${explanation}" এর এই ব্যয়ের হিসাবটি ডিলিট করতে চান?`)) {
      action();
    }
  };

  const handleEdit = (ex: Expense) => {
    setExpenseDate(ex.date);
    setCategory(ex.category);
    setPaymentMethod(ex.method);
    setDesc(ex.desc);
    setAmount(ex.amount.toString());
    setEditingExpenseId(ex.id);
  };

  const handleCancelEdit = () => {
    setExpenseDate(getTodayDateString());
    setCategory('সংসার');
    setPaymentMethod('cash');
    setDesc('');
    setAmount('');
    setEditingExpenseId(null);
    loadExpenses();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      triggerAlert('দয়া করে সঠিক টাকার পরিমাণ দিন!');
      return;
    }

    const val = parseFloat(amount) || 0;
    const db = loadDatabase();

    if (editingExpenseId !== null) {
      // Edit mode
      db.expenses = (db.expenses || []).map(item => {
        if (item.id === editingExpenseId) {
          return {
            ...item,
            date: expenseDate,
            category: category,
            method: paymentMethod,
            desc: desc.trim() || category,
            amount: val
          };
        }
        return item;
      });
      saveDatabase(db);
      triggerAlert('✅ খরচের এন্ট্রি সফলভাবে সংশোধন/আপডেট করা হয়েছে!');
      setEditingExpenseId(null);
    } else {
      // Add mode
      const newExpense: Expense = {
        id: Date.now(),
        date: expenseDate,
        category: category,
        method: paymentMethod,
        desc: desc.trim() || category,
        amount: val,
      };
      db.expenses.push(newExpense);
      saveDatabase(db);
      triggerAlert('✅ খরচের এন্ট্রি সফলভাবে সংরক্ষিত হয়েছে!');
    }

    // Reset Form
    setDesc('');
    setAmount('');
    setExpenseDate(getTodayDateString());
    loadExpenses();
  };

  const filteredExpenses = expenses.filter(e =>
    e.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpensesSum = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

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
            <h2 className="text-xl font-bold text-slate-900 font-sans">💸 খরচ এন্ট্রি খতিয়ান</h2>
            <p className="text-xs text-slate-500">দোকান পরিচালনা, পার্সোনাল ড্রয়িং এবং অন্যান্য খরচ সংরক্ষণ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT EXPENSE ENTRY FORM */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-4">
          <h3 className={`text-sm font-bold text-slate-800 mb-2 border-l-4 pl-2 ${editingExpenseId !== null ? 'border-blue-600' : 'border-rose-600'}`}>
            {editingExpenseId !== null ? '✏️ খরচ হিসাব সংশোধন করুন' : '📝 খরচ হিসাব যোগ করুন'}
          </h3>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">খরচের তারিখ (Expense Date)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-sans font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">খরচের খাত (Category)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Tag className="w-4 h-4" />
              </span>
              <select
                id="expense-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-xs font-sans font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">পেমেন্ট সোর্স (Payment Source)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <CreditCard className="w-4 h-4" />
              </span>
              <select
                id="expense-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-sans font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                required
              >
                {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">খরচের বিবরণ (Description)</label>
            <input
              id="expense-desc"
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="যেমন: দুপুরের খাবারের বিল, বাচ্চার খেলনা"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">টাকার পরিমাণ (Amount)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <span className="text-sm font-bold">৳</span>
              </span>
              <input
                id="expense-amount"
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

          {editingExpenseId !== null ? (
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-colors duration-150 flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                আপডেট সেভ করুন
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors duration-150 flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
                বাতিল
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl shadow-lg shadow-rose-500/10 transition-colors duration-150 flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              খরচ সেভ করুন
            </button>
          )}
        </form>

        {/* RIGHT EXPENDITURE TABLE LIST */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 border-l-4 border-blue-600 pl-2">💸 খরচের তালিকা</h3>
            
            {/* Live Search Input */}
            <div className="flex gap-2 items-center">
              {totalExpensesSum > 0 && (
                <span className="bg-rose-50 text-rose-700 border border-rose-100 font-bold font-sans text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap">
                  মোট খরচ: {totalExpensesSum.toFixed(2)} ৳
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
                  placeholder="বিবরণ বা খাত খুঁজুন..."
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
                  <th className="py-2.5 px-3 text-left text-slate-600 font-bold">বিবরণ / খাত</th>
                  <th className="py-2.5 px-3 text-left text-slate-600 font-bold">মেথড</th>
                  <th className="py-2.5 px-3 text-right text-slate-600 font-bold w-20">টাকা</th>
                  <th className="py-2.5 px-3 text-center text-slate-600 font-bold w-12">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody id="expense-table-body" className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                      কোনো খরচের রেকর্ড পাওয়া যায়নি!
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(ex => (
                    <tr key={ex.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                        {ex.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-800">{ex.desc}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">খাত: {ex.category}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans">
                        {PAYMENT_METHODS[ex.method] || ex.method}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap font-sans">
                        {ex.amount.toFixed(2)} ৳
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(ex)}
                            className="p-1 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="খরচ সংশোধন করুন"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ex.id, ex.desc)}
                            className="p-1 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors cursor-pointer"
                            title="খরচ মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
