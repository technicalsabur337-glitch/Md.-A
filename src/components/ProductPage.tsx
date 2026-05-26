/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Package, Sparkles, Image as ImageIcon, Camera, Trash2, Edit3, X, Save, Search, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { loadDatabase, saveDatabase } from '../lib/db';

interface ProductPageProps {
  onBack: () => void;
}

export function ProductPage({ onBack }: ProductPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [qty, setQty] = useState('');
  const [details, setDetails] = useState('');
  const [imageBase64, setImageBase64] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const db = loadDatabase();
    setProducts(db.products || []);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setBuyPrice('');
    setSellPrice('');
    setQty('');
    setDetails('');
    setImageBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setBuyPrice(prod.buyPrice.toString());
    setSellPrice(prod.sellPrice.toString());
    setQty(prod.qty.toString());
    setDetails(prod.details || '');
    setImageBase64(prod.image || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerAlert = (message: string) => {
    if (typeof (window as any).customAlert === 'function') {
      (window as any).customAlert(message);
    } else {
      alert(message);
    }
  };

  const handleDelete = (prod: Product) => {
    const action = () => {
      const db = loadDatabase();
      db.products = db.products.filter(p => p.id !== prod.id);
      saveDatabase(db);
      loadProducts();
      resetForm();
    };

    if (typeof (window as any).customConfirm === 'function') {
      (window as any).customConfirm(`আপনি কি নিশ্চিত যে "${prod.name}" পণ্যটি স্টক তালিকা থেকে সম্পূর্ণ ডিলিট করতে চান?`, action);
    } else if (confirm(`আপনি কি নিশ্চিত যে "${prod.name}" পণ্যটি স্টক তালিকা থেকে সম্পূর্ণ ডিলিট করতে চান?`)) {
      action();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const buyVal = parseFloat(buyPrice) || 0;
    const sellVal = parseFloat(sellPrice) || 0;
    const qtyVal = parseInt(qty) || 0;

    const db = loadDatabase();

    if (editingId !== null) {
      // Update Mode
      db.products = db.products.map(p => {
        if (p.id === editingId) {
          return {
            ...p,
            name: name.trim(),
            buyPrice: buyVal,
            sellPrice: sellVal,
            qty: qtyVal,
            details: details.trim(),
            image: imageBase64,
          };
        }
        return p;
      });
      saveDatabase(db);
      triggerAlert('✅ পণ্যটির বিবরণ সফলভাবে আপডেট করা হয়েছে!');
    } else {
      // Add Mode
      const newProd: Product = {
        id: Date.now(),
        name: name.trim(),
        buyPrice: buyVal,
        sellPrice: sellVal,
        qty: qtyVal,
        details: details.trim(),
        image: imageBase64,
      };
      
      db.products.push(newProd);
      saveDatabase(db);
      triggerAlert('✅ নতুন পণ্য সফলভাবে স্টক তালিকায় যুক্ত করা হয়েছে!');
    }

    loadProducts();
    resetForm();
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.details && p.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <h2 className="text-xl font-bold text-slate-900 font-sans">
              {editingId !== null ? '✏️ পণ্য এডিট মোড' : '📦 নতুন পণ্য স্টক এন্ট্রি'}
            </h2>
            <p className="text-xs text-slate-500">আইটেম রেনোভেশন, ক্রয়বিক্রয় মূল্য নির্ধারণ ও বিবরণী</p>
          </div>
        </div>
        
        {editingId !== null && (
          <button
            type="button"
            onClick={resetForm}
            className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            এডিট বাতিল
          </button>
        )}
      </div>

      {editingId !== null && (
        <div id="product-edit-banner" className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center justify-between gap-3 text-xs">
          <span id="product-edit-label" className="font-bold flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            সম্পাদনা মোড সক্রিয়: &quot;{name}&quot;
          </span>
          <button
            type="button"
            className="text-[10px] font-bold text-rose-600 border border-rose-200/50 hover:bg-rose-100/50 px-2.5 py-1 rounded-lg"
            onClick={resetForm}
          >
            বাতিল ✕
          </button>
        </div>
      )}

      {/* Main Grid: Form Left, Stock List Right on Medium Screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-4">
          
          {/* Base64 Image Upload Wrapper */}
          <div className="space-y-1.5">
            <span className="block text-sm font-semibold text-slate-700">📸 পণ্যের ছবি যুক্ত করুন</span>
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl">
              <input
                id="prod-image"
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-250 bg-white hover:bg-slate-50 hover:border-blue-500 rounded-xl transition-all duration-200 text-slate-500 hover:text-blue-600 w-full cursor-pointer min-h-[90px]"
              >
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[11px] font-semibold">ক্যামেরা বা গ্যালারি</span>
              </button>
              
              {imageBase64 ? (
                <div id="preview-box" className="w-[85px] h-[85px] border border-slate-200 rounded-xl overflow-hidden relative shrink-0 bg-white shadow-sm ring-4 ring-slate-100">
                  <img
                    id="prod-img-preview"
                    src={imageBase64}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageBase64('')}
                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-[85px] h-[85px] border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 shrink-0 bg-white">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">পণ্যের বিবরণ / নাম</label>
            <input
              id="prod-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: ওয়্যারলেস মাউস, কিবোর্ড, মেমোরি কার্ড"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">ক্রয় মূল্য (টাকা)</label>
              <div className="relative">
                <input
                  id="prod-buy"
                  type="number"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3.5 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-sans font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
                <span className="absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400">৳</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">বিক্রয় মূল্য (টাকা)</label>
              <div className="relative">
                <input
                  id="prod-sell"
                  type="number"
                  step="any"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3.5 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-sans font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
                <span className="absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400">৳</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">স্টক পরিমাণ (Quantity)</label>
            <input
              id="prod-qty"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="যেমন: ১৫টি"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:border-blue-500 transition-all text-xs font-sans"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">ক্রয়ের বিস্তারিত বিবরণ (ঐচ্ছিক )</label>
            <textarea
              id="prod-details"
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="মেমো নাম্বার, সাপ্লায়ার নাম বা অন্যান্য মন্তব্য..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-sans"
            />
          </div>

          <button
            id="product-submit-btn"
            type="submit"
            className={`w-full py-3 px-4 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer ${
              editingId !== null
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/10'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
            }`}
          >
            <Save className="w-4 h-4" />
            {editingId !== null ? '✏️ পণ্য আপডেট করুন' : '💾 পণ্য সেভ করুন'}
          </button>
        </form>

        {/* STOCK TABLE LIST CONTAINER */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 border-l-4 border-blue-600 pl-2">📦 বর্তমান স্টক তালিকা</h3>
            
            {/* Live Search Input */}
            <div className="relative w-full sm:w-56">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="মডেল বা নাম খুঁজুন..."
                className="w-full pl-8 pr-4 py-2 border border-slate-250 bg-slate-50/50 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm max-h-[480px] overflow-y-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-center text-slate-600 font-bold w-12">ছবি</th>
                  <th className="py-2.5 px-3 text-left text-slate-600 font-bold">পণ্য বিবরণ</th>
                  <th className="py-2.5 px-3 text-right text-slate-600 font-bold w-16 whitespace-nowrap">ক্রয়</th>
                  <th className="py-2.5 px-3 text-right text-slate-600 font-bold w-16 whitespace-nowrap">বিক্রয়</th>
                  <th className="py-2.5 px-3 text-center text-slate-600 font-bold w-16">স্টক</th>
                  <th className="py-2.5 px-3 text-center text-slate-600 font-bold w-20">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody id="stock-table-body" className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                      কোনো রেকর্ড পাওয়া যায়নি!
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(prod => (
                    <tr
                      key={prod.id}
                      className={`hover:bg-slate-50/55 transition-colors ${
                        editingId === prod.id ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="stock-img w-9 h-9 object-cover rounded-md border border-slate-200 inline-block"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-slate-100 rounded-md border border-slate-150 flex items-center justify-center text-slate-400 inline-flex">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-800 leading-snug">{prod.name}</p>
                        {prod.details && (
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-2 max-w-[150px] sm:max-w-xs">{prod.details}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-rose-600 whitespace-nowrap font-sans">
                        {prod.buyPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 whitespace-nowrap font-sans">
                        {prod.sellPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            prod.qty <= 5
                              ? 'bg-rose-100 text-rose-800 border border-rose-100'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          }`}
                        >
                          {prod.qty} টি
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(prod)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg cursor-pointer transition-colors border border-amber-200/50"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer transition-colors border border-rose-200/50"
                            title="মুছে ফেলুন"
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
