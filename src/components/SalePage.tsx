/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, ShoppingCart, Info, Check, HelpCircle, ShoppingBag } from 'lucide-react';
import { Product, Sale } from '../types';
import { loadDatabase, saveDatabase, PAYMENT_METHODS, getTodayDateString } from '../lib/db';

interface SalePageProps {
  onBack: () => void;
}

export function SalePage({ onBack }: SalePageProps) {
  const [saleDate, setSaleDate] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [estimatedProfit, setEstimatedProfit] = useState(0);

  useEffect(() => {
    setSaleDate(getTodayDateString());
    loadProducts();
  }, []);

  const loadProducts = () => {
    const db = loadDatabase();
    // Only show products which are in the database
    setProducts(db.products || []);
  };

  // Recalculate totals whenever selected product or quantity changes
  useEffect(() => {
    if (selectedProdId === '') {
      setTotalAmount(0);
      setEstimatedProfit(0);
      return;
    }

    const matched = products.find(p => p.id === selectedProdId);
    if (!matched) return;

    const tAmount = matched.sellPrice * qty;
    const tProfit = (matched.sellPrice - matched.buyPrice) * qty;

    setTotalAmount(tAmount);
    setEstimatedProfit(tProfit);
  }, [selectedProdId, qty, products]);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProdId(val === '' ? '' : parseInt(val));
    setQty(1); // Reset qty to 1 when changing products
  };

  const handleQuantityIncrease = () => {
    setQty(prev => prev + 1);
  };

  const handleQuantityDecrease = () => {
    setQty(prev => (prev > 1 ? prev - 1 : 1));
  };

  const triggerAlert = (message: string) => {
    if (typeof (window as any).customAlert === 'function') {
      (window as any).customAlert(message);
    } else {
      alert(message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleDate) {
      triggerAlert('দয়া করে বিক্রয়ের তারিখ নির্বাচন করুন!');
      return;
    }

    if (selectedProdId === '') {
      triggerAlert('দয়া করে একটি পণ্য তালিকা থেকে সিলেক্ট করুন!');
      return;
    }

    const matchedProd = products.find(p => p.id === selectedProdId);
    if (!matchedProd) {
      triggerAlert('নির্বাচিত পণ্যটি খুঁজে পাওয়া যায়নি!');
      return;
    }

    if (matchedProd.qty < qty) {
      triggerAlert(`❌ দুঃখিত, স্টকে পর্যাপ্ত পণ্য নেই! বর্তমান অবশিষ্টাংশ রয়েছে: ${matchedProd.qty} টি`);
      return;
    }

    const db = loadDatabase();
    
    // Create new sale transaction
    const newSale: Sale = {
      id: Date.now(),
      date: saleDate,
      prodId: matchedProd.id,
      prodName: matchedProd.name,
      qty: qty,
      method: paymentMethod,
      desc: notes.trim() || 'কাস্টমার সেল',
      amount: totalAmount,
      profit: estimatedProfit,
    };

    // Deduct stock from products list
    db.products = db.products.map(p => {
      if (p.id === matchedProd.id) {
        return {
          ...p,
          qty: p.qty - qty,
        };
      }
      return p;
    });

    db.sales.push(newSale);
    
    saveDatabase(db);
    triggerAlert('✅ বিক্রয় সফলভাবে সম্পন্ন ও স্টক তালিকা আপডেট করা হয়েছে!');
    
    // Reset Form
    setSelectedProdId('');
    setQty(1);
    setNotes('');
    loadProducts(); // Reload stock quantities in memory
  };

  const currentSelectedProduct = products.find(p => p.id === selectedProdId);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors cursor-pointer text-slate-600 focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">🛒 নতুন পণ্য বিক্রয় করুন</h2>
          <p className="text-xs text-slate-500">স্টক পণ্য নির্বাচন করে বিক্রয় ও লাভের তথ্য এন্ট্রি করুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Sale Date Input */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">বিক্রয়ের তারিখ (Sale Date)</label>
            <input
              id="sale-date"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-sans font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">পেমেন্ট মেথড (Payment Source)</label>
            <select
              id="sale-payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-xs font-sans font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
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

        {/* Product Dropdown Selection Card */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">পণ্য সিলেক্ট করুন (Choose Product)</label>
            <select
              id="sale-product-select"
              value={selectedProdId}
              onChange={handleProductSelect}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-sans font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
              required
            >
              <option value="">-- এখানে ক্লিক করে পণ্য বাছুন --</option>
              {products.map(p => (
                <option key={p.id} value={p.id} disabled={p.qty <= 0}>
                  {p.name} {p.qty <= 0 ? '(স্টক শেষ ❌)' : `(বিক্রয়: ${p.sellPrice.toFixed(0)} ৳ | স্টক: ${p.qty}টি)`}
                </option>
              ))}
            </select>
          </div>

          {currentSelectedProduct && (
            <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-blue-900 font-sans">স্টক তথ্য:</span> আস্থার সাথে কাস্টমারকে দিন। বর্তমানে এই পণ্যের মোট{' '}
                <span className="font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">{currentSelectedProduct.qty} টি</span> আইটেম আপনার মেইন স্টোররুমে অবশিষ্ট রয়েছে।
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Quantity Controls */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">পরিমাণ (Quantity)</label>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={handleQuantityDecrease}
                className="w-11 h-11 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl flex items-center justify-center text-lg transition-colors cursor-pointer"
              >
                -
              </button>
              <input
                id="sale-qty"
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center h-11 bg-slate-50 border border-slate-200 rounded-xl font-sans font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={handleQuantityIncrease}
                className="w-11 h-11 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl flex items-center justify-center text-lg transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Details Notes Input */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">আইটেম/বিক্রয় বিবরণী (Optional Description)</label>
            <input
              id="sale-desc"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: কাস্টমার সেল বা অন্যান্য বিবরণ"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans text-xs"
            />
          </div>

        </div>

        {/* Read-only Real-time Metrics Card */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
          <div className="space-y-1 text-center sm:text-left">
            <span className="block text-[11px] font-bold text-emerald-800 uppercase tracking-widest leading-none">মোট বিক্রয় মূল্য</span>
            <div className="relative inline-block mt-1">
              <input
                id="sale-amount"
                type="text"
                value={totalAmount > 0 ? `${totalAmount.toFixed(2)} ৳` : '0.00 ৳'}
                className="border-none bg-transparent font-sans font-black text-2xl text-emerald-950 p-0 focus:outline-none text-center sm:text-left focus:ring-0 w-36 pointer-events-none"
                readOnly
              />
            </div>
          </div>

          <div className="space-y-1 text-center sm:text-left border-l border-emerald-100 pl-4">
            <span className="block text-[11px] font-bold text-emerald-800 uppercase tracking-widest leading-none">নিট লাভের পরিমাণ</span>
            <div className="relative inline-block mt-1">
              <input
                id="sale-profit"
                type="text"
                value={estimatedProfit > 0 ? `${estimatedProfit.toFixed(2)} ৳` : '0.00 ৳'}
                className="border-none bg-transparent font-sans font-black text-2xl text-emerald-700 p-0 focus:outline-none text-center sm:text-left focus:ring-0 w-36 pointer-events-none"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Submit action */}
        <div className="border-t border-slate-100 pt-5 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            বিক্রি সেভ করুন
          </button>
        </div>

      </form>
    </div>
  );
}
