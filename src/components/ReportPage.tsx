/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Calendar, BookOpen, TrendingUp, TrendingDown, ClipboardList, Wallet, FileText, Settings, ShoppingBag, Download } from 'lucide-react';
import { AppDatabase, CustomItem, DayBalances } from '../types';
import { loadDatabase, getTodayDateString, getCurrentMonthString, PAYMENT_METHODS, PAYMENT_KEYS } from '../lib/db';

const PRINT_PAYMENT_KEYS = ['cash', 'bkash', 'rocket', 'nagad', 'load1', 'load2', 'other'];
const PRINT_PAYMENT_METHODS: Record<string, string> = {
  cash: 'ক্যাশ বাক্স (Cash Drawer)',
  bkash: 'বিকাশ (bKash)',
  rocket: 'রকেট (Rocket)',
  nagad: 'নগদ (Nagad)',
  load1: 'ফ্লেক্সিলোড ১ (Flexiload 1)',
  load2: '�ͲǕ͸��ˡ � (Flexiload 2)',
  other: '��ͯ��ͯ (Other Accounts)',
};

function getDailyPrintableHTML(dateStr: string, metrics: any, manualPurchase: number) {
  const startBal = metrics.startBal;
  const endBal = metrics.endBal;
  const totalPawona = metrics.totalPawona;
  const totalPorishod = metrics.totalPorishod;
  const totalExpenses = metrics.totalExpenses;
  const totalProfit = metrics.totalProfit;
  const totalSales = metrics.totalSales;
  const totalLedgers = metrics.totalLedgers;
  const dayStartTotal = metrics.dayStartTotal;
  const dayEndTotal = metrics.dayEndTotal;
  const netIncome = metrics.netIncome;

  // Pre-calculate start balances rows
  const startDataRows = PRINT_PAYMENT_KEYS.map(key => {
    const val = metrics.startData ? (metrics.startData[key] || 0) : 0;
    return `<tr>
        <td class="p-2.5 font-semibold">${PRINT_PAYMENT_METHODS[key]}</td>
        <td class="p-2.5 text-right font-bold text-slate-900 font-sans">${val.toFixed(2)} ৳</td>
    </tr>`;
  }).join('');

  // Pre-calculate pawona rows
  const pawonaRows = metrics.pawona.length === 0 
    ? '<tr><td colSpan="2" class="p-2.5 text-center text-slate-400 italic">কোনো পাওনা নেই</td></tr>' 
    : metrics.pawona.map((item: any) => `<tr>
        <td class="p-2.5 pl-4 text-slate-600">🔍 ${item.label}</td>
        <td class="p-2.5 text-right font-bold font-sans text-slate-900">${item.amount.toFixed(2)} ৳</td>
    </tr>`).join('');

  // Pre-calculate payment end rows
  const endDataRows = PRINT_PAYMENT_KEYS.map(key => {
    const val = metrics.endData ? (metrics.endData[key] || 0) : 0;
    return `<tr>
        <td class="p-2.5 font-semibold">${PRINT_PAYMENT_METHODS[key]}</td>
        <td class="p-2.5 text-right font-bold text-slate-900 font-sans">${val.toFixed(2)} ৳</td>
    </tr>`;
  }).join('');

  // Pre-calculate porishod rows
  const porishodRows = metrics.porishod.length === 0 
    ? '<tr><td colSpan="2" class="p-2.5 text-center text-slate-400 italic">কোনো পরিশোধ নেই</td></tr>' 
    : metrics.porishod.map((item: any) => `<tr>
        <td class="p-2.5 pl-4 text-slate-600">✔ ${item.label}</td>
        <td class="p-2.5 text-right font-bold font-sans text-slate-900">${item.amount.toFixed(2)} ৳</td>
    </tr>`).join('');

  // Pre-calculate expenses rows
  const dayExpensesRows = metrics.dayExpenses.length === 0 
    ? '<tr><td colSpan="2" class="p-2.5 text-center text-slate-400 italic">কোনো খরচ পাওয়া যায়নি</td></tr>' 
    : metrics.dayExpenses.map((ex: any) => `<tr>
        <td class="p-2.5 pl-4 text-slate-600">❌ ${ex.desc} <span class="text-[9px] text-slate-400 font-sans">(${PRINT_PAYMENT_METHODS[ex.method] || ex.method})</span></td>
        <td class="p-2.5 text-right font-bold text-rose-600 font-sans">${ex.amount.toFixed(2)} ৳</td>
    </tr>`).join('');

  // Pre-calculate sales rows
  const daySalesRows = metrics.daySales.length === 0 
    ? '<tr><td colSpan="4" class="text-center py-6 text-slate-400 italic">এই দিনে কোনো পণ্য বিক্রয় করা হয়নি</td></tr>' 
    : metrics.daySales.map((sale: any) => `<tr class="hover:bg-slate-50/50">
        <td class="p-3 font-semibold text-slate-800">
            ${sale.prodName}
            <span class="block text-[10px] text-slate-450 font-normal mt-0.5">${sale.desc} (${PRINT_PAYMENT_METHODS[sale.method] || sale.method})</span>
        </td>
        <td class="p-3 text-center font-bold text-slate-600 font-sans">${sale.qty} টি</td>
        <td class="p-3 text-right font-semibold text-slate-800 font-sans">${sale.amount.toFixed(2)} ৳</td>
        <td class="p-3 text-right font-bold text-emerald-600 font-sans">+${sale.profit.toFixed(2)} ৳</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>দৈনিক হিসাব বিবরণী - ${dateStr}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Hind Siliguri', 'Inter', sans-serif;
        }
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background: white;
                color: black;
                padding: 0;
            }
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 p-4 sm:p-8">

    <div class="no-print max-w-4xl mx-auto mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm text-xs sm:text-sm">
        <div>
            <strong class="text-blue-900 block mb-1">🖨️ প্রিন্ট বিবরণী ও PDF ডাউনলোড নির্দেশিকা:</strong>
            <p>নিচে আপনার সম্পূর্ণ দৈনিক হিসাব তৈরি করা হয়েছে। আপনার কম্পিউটারে বা মোবাইলে এটিকে সরাসরি <b>PDF/প্রিন্ট</b> করতে পাশের বাটনে চাপুন।</p>
            <p class="text-slate-500 mt-1 text-[11px]"><i>(মেশিন বা ড্রাইভার সিলেক্ট করে "Save as PDF" অপশন দিন)</i></p>
        </div>
        <button onclick="window.print()" class="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-xs cursor-pointer">
            PDF ডাউনলোড / প্রিন্ট করুন
        </button>
    </div>

    <div class="max-w-4xl mx-auto bg-white p-6 sm:p-10 border border-slate-200 rounded-3xl shadow-lg relative">
        
        <div class="text-center border-b-2 border-slate-900 pb-5 mb-8">
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">আইটি জোন</h1>
            <p class="text-xs sm:text-sm font-semibold text-slate-600">Baliadangi, Thakurgaon, Bangladesh</p>
            <p class="text-xs text-slate-400 mt-0.5 font-sans">Proprietor: Md. Abdur Sabur (সবুর ভাই)</p>
            
            <div class="inline-block mt-4 px-4 py-1.5 bg-slate-100 rounded-full font-bold text-xs sm:text-sm border border-slate-200">
                🗓️ দৈনিক হিসাব বিবরণী — তারিখ: ${dateStr}
            </div>
        </div>

        <div class="bg-slate-900 text-white rounded-2xl p-6 text-center space-y-2 mb-8">
            <span class="text-xs font-semibold text-slate-455 tracking-wider">💡 দৈনিক নিট ক্যাশ ইনকাম (Net Income)</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-emerald-400">
                ${netIncome.toFixed(2)} ৳
            </h2>
            <p class="text-[10px] text-slate-500 font-mono">
                = (দিনের শেষ মোট ব্যালেন্স) - (দিনের শুরু মোট ব্যালেন্স)
            </p>
            <div class="flex items-center justify-center gap-4 text-xs font-bold pt-2 text-slate-300">
                <span>🌅 শুরু মোট: ${dayStartTotal.toFixed(2)} ৳</span>
                <span>|</span>
                <span>🌌 শেষ মোট: ${dayEndTotal.toFixed(2)} ৳</span>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200 font-bold">
                    <span class="text-xs text-slate-700">🌅 দিনের শুরু বিস্তারিত</span>
                    <span class="text-xs font-sans text-slate-900">${dayStartTotal.toFixed(2)} ৳</span>
                </div>
                <table class="w-full text-xs text-left text-slate-700">
                    <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                        <tr>
                            <th class="p-2.5 font-bold">ব্যালেন্স খাতসমূহ</th>
                            <th class="p-2.5 text-right font-bold">টাকা</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${startDataRows}
                        <tr class="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                            <td class="p-2.5 text-slate-600">ব্যালেন্স উপমোট</td>
                            <td class="p-2.5 text-right font-sans">${startBal.toFixed(2)} ৳</td>
                        </tr>
                        
                        <tr class="bg-amber-50/40">
                            <td colSpan="2" class="p-2 text-[10px] font-bold text-amber-900 uppercase">💰 কাস্টমার পাওনা (Receivables)</td>
                        </tr>
                        ${pawonaRows}
                        ${metrics.pawona.length > 0 ? `
                        <tr class="bg-amber-50/20 text-yellow-900 font-bold">
                            <td class="p-2.5 text-amber-800">পাওনা উপমোট</td>
                            <td class="p-2.5 text-right font-sans">${totalPawona.toFixed(2)} ৳</td>
                        </tr>` : ''}

                        <tr class="bg-rose-50/30">
                            <td class="p-2.5 font-bold text-rose-900">📦 নতুন মালামাল ক্রয় ব্যয়</td>
                            <td class="p-2.5 text-right font-bold text-rose-800 font-sans">+${manualPurchase.toFixed(2)} ৳</td>
                        </tr>

                        <tr class="bg-slate-900 text-white font-bold text-xs font-sans">
                            <td class="p-3">দিনের শুরু মোট =</td>
                            <td class="p-3 text-right">${dayStartTotal.toFixed(2)} ৳</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200 font-bold">
                    <span class="text-xs text-slate-700">🌌 দিনের শেষ বিস্তারিত</span>
                    <span class="text-xs font-sans text-slate-900">${dayEndTotal.toFixed(2)} ৳</span>
                </div>
                <table class="w-full text-xs text-left text-slate-700">
                    <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                        <tr>
                            <th class="p-2.5 font-bold">ব্যালেন্স খাতসমূহ</th>
                            <th class="p-2.5 text-right font-bold">টাকা</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${endDataRows}
                        <tr class="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                            <td class="p-2.5 text-slate-600">ব্যালেন্স উপমোট</td>
                            <td class="p-2.5 text-right font-sans">${endBal.toFixed(2)} ৳</td>
                        </tr>

                        <tr class="bg-indigo-50/40">
                            <td colSpan="2" class="p-2 text-[10px] font-bold text-indigo-900 uppercase">✅ প্রদান ও পরিশোধসমূহ</td>
                        </tr>
                        ${porishodRows}
                        ${metrics.porishod.length > 0 ? `
                        <tr class="bg-indigo-50/20 text-indigo-950 font-bold">
                            <td class="p-2.5 text-indigo-850">পরিশোধ উপমোট</td>
                            <td class="p-2.5 text-right font-sans">${totalPorishod.toFixed(2)} ৳</td>
                        </tr>` : ''}

                        <tr class="bg-rose-50/30">
                            <td colSpan="2" class="p-2 text-[10px] font-bold text-rose-905 uppercase">💸 ব্যয় বিস্তারিত (Debit)</td>
                        </tr>
                        ${dayExpensesRows}
                        ${metrics.dayExpenses.length > 0 ? `
                        <tr class="bg-rose-50/10 text-rose-900 font-bold">
                            <td class="p-2.5 text-rose-800">খরচ উপমোট</td>
                            <td class="p-2.5 text-right font-sans">${totalExpenses.toFixed(2)} ৳</td>
                        </tr>` : ''}

                        <tr class="bg-emerald-50/40">
                            <td class="p-2.5 font-bold text-emerald-950">📈 বিক্রয় লাভ (Product Profit)</td>
                            <td class="p-2.5 text-right font-bold text-emerald-600 font-sans">+${totalProfit.toFixed(2)} ৳</td>
                        </tr>

                        <tr class="bg-slate-955 text-white border-t border-slate-900 font-semibold font-sans">
                            <td class="p-3 text-sm font-black">দিনের শেষ মোট =</td>
                            <td class="p-3 text-right text-sm font-black font-sans">${dayEndTotal.toFixed(2)} ৳</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
            <div class="text-center">
                <span class="block text-[10px] font-bold text-slate-500 uppercase">মোট বিক্রয়</span>
                <span class="text-sm font-bold font-sans text-slate-800">${totalSales.toFixed(2)} ৳</span>
            </div>
            <div class="text-center">
                <span class="block text-[10px] font-bold text-slate-500 uppercase">বিক্রয় লাভ</span>
                <span class="text-sm font-bold font-sans text-emerald-600">+${totalProfit.toFixed(2)} ৳</span>
            </div>
            <div class="text-center">
                <span class="block text-[10px] font-bold text-slate-500 uppercase">মোট খরচ</span>
                <span class="text-sm font-bold font-sans text-rose-600">-${totalExpenses.toFixed(2)} ৳</span>
            </div>
            <div class="text-center">
                <span class="block text-[10px] font-bold text-slate-500 uppercase">নতুন বাকি</span>
                <span class="text-sm font-bold font-sans text-orange-600">${totalLedgers.toFixed(2)} ৳</span>
            </div>
        </div>

        <div class="space-y-3 mb-10">
            <h3 class="text-sm font-bold text-slate-800 border-l-4 border-slate-900 pl-2">🛒 বিক্রির বিবরণী তালিকা</h3>
            <table class="w-full text-xs text-left text-slate-700 border border-slate-150 rounded-xl overflow-hidden border-collapse">
                <thead class="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                        <th class="p-3 text-left">পণ্য ও বিবরণ</th>
                        <th class="p-3 text-center w-20">পরিমাণ</th>
                        <th class="p-3 text-right w-28">বিক্রয় মূল্য</th>
                        <th class="p-3 text-right w-24">লাভ</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-150">
                    ${daySalesRows}
                </tbody>
            </table>
        </div>

        <div class="grid grid-cols-2 gap-10 pt-16 text-center text-xs font-bold text-slate-600">
            <div>
                <span class="block border-t border-slate-300 pt-1 w-32 mx-auto">ব্যবস্থাপক স্বাক্ষর</span>
            </div>
            <div>
                <span class="block border-t border-slate-300 pt-1 w-32 mx-auto">মালিক স্বাক্ষর</span>
            </div>
        </div>

    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 600);
        };
    </script>
</body>
</html>`;
}

function getMonthlyPrintableHTML(
  monthStr: string,
  metrics: any,
  manualPurchase: number,
  activeDatesData: any[]
) {
  const totalSalesM = metrics.totalSalesM;
  const totalProfitM = metrics.totalProfitM;
  const totalExpensesM = metrics.totalExpensesM;
  const totalLedgerM = metrics.totalLedgerM;
  const netIncomeM = metrics.netIncomeM;

  // Pre-calculate active date rows
  const activeDatesRows = activeDatesData.length === 0
    ? '<tr><td colSpan="7" class="text-center py-10 text-slate-400 italic">এই মাসে কোনো তথ্য নথিভুক্ত নেই!</td></tr>'
    : activeDatesData.map((dayMet: any) => `<tr>
        <td class="p-2.5 font-bold text-slate-800">${dayMet.date}</td>
        <td class="p-2.5 text-right font-medium">${dayMet.totalSales.toFixed(0)} ৳</td>
        <td class="p-2.5 text-right font-bold text-emerald-600">+${dayMet.totalProfit.toFixed(0)}</td>
        <td class="p-2.5 text-right font-bold text-rose-600">-${dayMet.totalExpenses.toFixed(0)}</td>
        <td class="p-2.5 text-right text-slate-450">${dayMet.dayStartTotal.toFixed(0)}</td>
        <td class="p-2.5 text-right text-slate-450">${dayMet.dayEndTotal.toFixed(0)}</td>
        <td class="p-2.5 text-right font-extrabold ${dayMet.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${dayMet.netIncome.toFixed(0)} ৳</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>মাসিক হিসাব বিবরণী - ${monthStr}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Hind Siliguri', 'Inter', sans-serif;
        }
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background: white;
                color: black;
                padding: 0;
            }
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 p-4 sm:p-8">

    <div class="no-print max-w-4xl mx-auto mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm text-xs sm:text-sm">
        <div>
            <strong class="text-blue-900 block mb-1">🖨️ প্রিন্ট বিবরণী ও PDF ডাউনলোড নির্দেশিকা:</strong>
            <p>নিচে আপনার সম্পূর্ণ মাসিক হিসাব তৈরি করা হয়েছে। আপনার কম্পিউটারে বা মোবাইলে এটিকে সরাসরি <b>PDF/প্রিন্ট</b> করতে পাশের বাটনে চাপুন।</p>
            <p class="text-slate-500 mt-1 text-[11px]"><i>(মেশিন বা ড্রাইভার সিলেক্ট করে "Save as PDF" অপশন দিন)</i></p>
        </div>
        <button onclick="window.print()" class="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-xs cursor-pointer">
            PDF ডাউনলোড / প্রিন্ট করুন
        </button>
    </div>

    <div class="max-w-4xl mx-auto bg-white p-6 sm:p-10 border border-slate-200 rounded-3xl shadow-lg relative">
        
        <div class="text-center border-b-2 border-slate-900 pb-5 mb-8">
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">আইটি জোন</h1>
            <p class="text-xs sm:text-sm font-semibold text-slate-600">Baliadangi, Thakurgaon, Bangladesh</p>
            <p class="text-xs text-slate-400 mt-0.5">Proprietor: Md. Abdur Sabur (সবুর ভাই)</p>
            
            <div class="inline-block mt-4 px-4 py-1.5 bg-slate-100 rounded-full font-bold text-xs sm:text-sm border border-slate-200">
                🗓️ মাসিক হিসাব বিবরণী — মাস: ${monthStr}
            </div>
        </div>

        <div class="bg-slate-900 text-white rounded-2xl p-6 text-center space-y-2 mb-8 animate-fade-in">
            <span class="text-xs font-semibold text-slate-455 tracking-wider">💡 মাসিক নিট ব্যবসা লাভ (Net Profit)</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-sans">
                ${netIncomeM.toFixed(2)} ৳
            </h2>
            <p class="text-[10px] text-slate-500 font-mono">
                = (মোট বিক্রয় লাভ) - (মোট খরচ) - (ক্রয় ব্যয়)
            </p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                <span class="block text-[10px] font-bold text-emerald-800 uppercase">মোট বিক্রয়</span>
                <span class="text-sm font-bold font-sans text-slate-800">${totalSalesM.toFixed(2)} ৳</span>
            </div>
            <div class="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                <span class="block text-[10px] font-bold text-emerald-800 uppercase">মোট লাভ</span>
                <span class="text-sm font-bold font-sans text-emerald-600 font-sans">+${totalProfitM.toFixed(2)} ৳</span>
            </div>
            <div class="bg-rose-50 border border-rose-100 p-3 rounded-2xl text-center">
                <span class="block text-[10px] font-bold text-rose-800 uppercase">মোট খরচ</span>
                <span class="text-sm font-bold font-sans text-rose-600 font-sans">-${totalExpensesM.toFixed(2)} ৳</span>
            </div>
            <div class="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-center">
                <span class="block text-[10px] font-bold text-amber-800 uppercase">মোট বাকি</span>
                <span class="text-sm font-bold font-sans text-slate-800 font-sans">${totalLedgerM.toFixed(2)} ৳</span>
            </div>
        </div>

        <div class="space-y-3 mb-10">
            <h3 class="text-sm font-bold text-slate-800 border-l-4 border-slate-900 pl-2">📅 দিনভিত্তিক লেনদেন তালিকা</h3>
            <table class="w-full text-xs text-left text-slate-700 border border-slate-150 rounded-xl overflow-hidden border-collapse">
                <thead class="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                        <th class="p-2.5 text-left">তারিখ</th>
                        <th class="p-2.5 text-right">বিক্রয়</th>
                        <th class="p-2.5 text-right text-emerald-800">লাভ</th>
                        <th class="p-2.5 text-right text-rose-800">খরচ</th>
                        <th class="p-2.5 text-right">শুরু মোট</th>
                        <th class="p-2.5 text-right">শেষ মোট</th>
                        <th class="p-2.5 text-right">ইনকাম</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-150 font-sans text-slate-700">
                    ${activeDatesRows}
                </tbody>
                ${activeDatesData.length > 0 ? `
                <tfoot class="bg-slate-900 text-white font-bold text-xs font-sans">
                    <tr>
                        <td class="p-3 text-white">হিসেব সমষ্টী:</td>
                        <td class="p-3 text-right">${totalSalesM.toFixed(0)} ৳</td>
                        <td class="p-3 text-right text-emerald-300 font-sans">+${totalProfitM.toFixed(0)}</td>
                        <td class="p-3 text-right text-rose-300 font-sans">-${totalExpensesM.toFixed(0)}</td>
                        <td colSpan="2" class="p-3 text-right text-slate-400 font-sans">ক্রয়: -${manualPurchase.toFixed(0)}</td>
                        <td class="p-3 text-right text-emerald-400 font-extrabold font-sans">${netIncomeM.toFixed(0)} ৳</td>
                    </tr>
                </tfoot>` : ''}
            </table>
        </div>

        <div class="grid grid-cols-2 gap-10 pt-16 text-center text-xs font-bold text-slate-600">
            <div>
                <span class="block border-t border-slate-300 pt-1 w-32 mx-auto">ব্যবস্থাপক স্বাক্ষর</span>
            </div>
            <div>
                <span class="block border-t border-slate-300 pt-1 w-32 mx-auto">মালিক স্বাক্ষর</span>
            </div>
        </div>

    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 600);
        };
    </script>
</body>
</html>`;
}

interface ReportPageProps {
  onBack: () => void;
}

export function ReportPage({ onBack }: ReportPageProps) {
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [manualPurchase, setManualPurchase] = useState<number>(0);

  // Database snapshot
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());

  useEffect(() => {
    setSelectedDate(getTodayDateString());
    setSelectedMonth(getCurrentMonthString());
    setDb(loadDatabase());
  }, []);

  const handlePrint = () => {
    let htmlContent = '';
    let fileName = '';

    if (reportMode === 'daily') {
      if (!selectedDate) return;
      const metrics = getDailyMetrics(selectedDate);
      htmlContent = getDailyPrintableHTML(selectedDate, metrics, manualPurchase);
      fileName = `Daily_Report_${selectedDate}.html`;
    } else {
      if (!selectedMonth) return;
      const metrics = getMonthlyMetrics(selectedMonth);
      // Calculate daily metrics array for all active dates of this month
      const activeDatesData = metrics.activeDates.map(dateStr => {
        const dMet = getDailyMetrics(dateStr);
        return {
          date: dateStr,
          totalSales: dMet.totalSales,
          totalProfit: dMet.totalProfit,
          totalExpenses: dMet.totalExpenses,
          dayStartTotal: dMet.dayStartTotal,
          dayEndTotal: dMet.dayEndTotal,
          netIncome: dMet.netIncome,
        };
      });
      htmlContent = getMonthlyPrintableHTML(selectedMonth, metrics, manualPurchase, activeDatesData);
      fileName = `Monthly_Report_${selectedMonth}.html`;
    }

    try {
      // Create and trigger download of the self-contained printable document
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF/HTML report", err);
      // Fallback
      window.print();
    }
  };

  const sumBalances = (bal: DayBalances | undefined): number => {
    if (!bal) return 0;
    return PAYMENT_KEYS.reduce((sum, key) => sum + (bal[key] || 0), 0);
  };

  // Calculations for Daily Mode
  const getDailyMetrics = (dateStr: string) => {
    const startData = db.dayStart[dateStr];
    const endData = db.dayEnd[dateStr];

    const startBal = sumBalances(startData);
    const endBal = sumBalances(endData);

    const pawona = db.pawona[dateStr] || [];
    const porishod = db.porishod[dateStr] || [];

    const totalPawona = pawona.reduce((s, p) => s + (p.amount || 0), 0);
    const totalPorishod = porishod.reduce((s, p) => s + (p.amount || 0), 0);

    const daySales = db.sales.filter(s => s.date === dateStr);
    const dayExpenses = db.expenses.filter(e => e.date === dateStr);
    const dayLedgers = db.ledgers.filter(l => l.date === dateStr);

    const totalSales = daySales.reduce((s, x) => s + (x.amount || 0), 0);
    const totalProfit = daySales.reduce((s, x) => s + (x.profit || 0), 0);
    const totalExpenses = dayExpenses.reduce((s, x) => s + (x.amount || 0), 0);
    const totalLedgers = dayLedgers.reduce((s, x) => s + (x.amount || 0), 0);

    // Dynamic valuation models
    const dayStartTotal = startBal + totalPawona + manualPurchase;
    const dayEndTotal = endBal + totalPorishod + totalExpenses + totalProfit;
    const netIncome = dayEndTotal - dayStartTotal;

    return {
      startData,
      endData,
      startBal,
      endBal,
      pawona,
      porishod,
      totalPawona,
      totalPorishod,
      daySales,
      dayExpenses,
      dayLedgers,
      totalSales,
      totalProfit,
      totalExpenses,
      totalLedgers,
      dayStartTotal,
      dayEndTotal,
      netIncome,
    };
  };

  // Calculations for Monthly Mode
  const getMonthlyMetrics = (monthStr: string) => {
    const mSales = db.sales.filter(s => s.date.startsWith(monthStr));
    const mExpenses = db.expenses.filter(e => e.date.startsWith(monthStr));
    const mLedgers = db.ledgers.filter(l => l.date.startsWith(monthStr));

    const totalSalesM = mSales.reduce((s, x) => s + (x.amount || 0), 0);
    const totalProfitM = mSales.reduce((s, x) => s + (x.profit || 0), 0);
    const totalExpensesM = mExpenses.reduce((s, x) => s + (x.amount || 0), 0);
    const totalLedgerM = mLedgers.reduce((s, x) => s + (x.amount || 0), 0);

    const netIncomeM = totalProfitM - totalExpensesM - manualPurchase;

    // Detect all distinct active dates relevant to this month
    const datesSet = new Set<string>();
    mSales.forEach(s => datesSet.add(s.date));
    mExpenses.forEach(e => datesSet.add(e.date));
    Object.keys(db.dayStart).filter(d => d.startsWith(monthStr)).forEach(d => datesSet.add(d));
    Object.keys(db.dayEnd).filter(d => d.startsWith(monthStr)).forEach(d => datesSet.add(d));

    const activeDates = Array.from(datesSet).sort();

    return {
      mSales,
      mExpenses,
      mLedgers,
      totalSalesM,
      totalProfitM,
      totalExpensesM,
      totalLedgerM,
      netIncomeM,
      activeDates,
    };
  };

  const daily = getDailyMetrics(selectedDate);
  const monthly = getMonthlyMetrics(selectedMonth);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm">
      
      {/* 1. Header (Hides on Printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors cursor-pointer text-slate-600 focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">📊 আয়-ব্যয় ও লাভ-ক্ষতি খতিয়ান</h2>
            <p className="text-xs text-slate-500">দৈনিক এবং মাসিক ভিত্তিতে লাভ ও ক্যাশ হিসেবের নিখুঁত বিবরণী</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer text-xs"
        >
          <Printer className="w-4 h-4" />
          রিপোর্ট PDF ডাউনলোড / প্রিন্ট
        </button>
      </div>

      {/* 2. Mode select tabs (Hides on Printing) */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl mb-5 no-print">
        <button
          type="button"
          onClick={() => setReportMode('daily')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
            reportMode === 'daily'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          দৈনিক রিপোর্ট
        </button>
        <button
          type="button"
          onClick={() => setReportMode('monthly')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
            reportMode === 'monthly'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          মাসিক রিপোর্ট
        </button>
      </div>

      {/* 3. Filters (Hides on Printing) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-5 no-print">
        
        {reportMode === 'daily' ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase">তারিখ সিলেক্ট করুন</label>
            <input
              id="report-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-250 bg-white rounded-xl text-xs font-medium font-sans text-slate-800"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase">মাস সিলেক্ট করুন</label>
            <input
              id="report-month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-250 bg-white rounded-xl text-xs font-medium font-sans text-slate-800"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 uppercase">📦 মোট মাল ক্রয় খরচ (৳)</label>
          <div className="relative">
            <input
              id="purchase-amount"
              type="number"
              step="any"
              value={manualPurchase || ''}
              onChange={(e) => setManualPurchase(parseFloat(e.target.value) || 0)}
              placeholder="আজকে কত টাকার নতুন মালামাল কিনেছেন"
              className="w-full pl-3.5 pr-7 py-2 border border-slate-250 bg-white rounded-xl text-xs font-semibold font-sans text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute inset-y-0 right-3.5 flex items-center text-xs font-bold text-slate-400">৳</span>
          </div>
        </div>

      </div>

      {/* 4. Display Printable Header (Shown ONLY when printing) */}
      <div className="print-only text-center border-b-2 border-slate-900 pb-5 mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">আইটি জোন</h1>
        <p className="text-sm font-semibold text-slate-600">Baliadangi, Thakurgaon, Bangladesh</p>
        <p className="text-xs text-slate-500 font-sans mt-0.5">Proprietor: Md. Abdur Sabur (সবুর ভাই)</p>
        <h2 className="text-lg font-bold text-blue-900 mt-4 leading-none underline">
          {reportMode === 'daily'
            ? `দৈনিক হিসাব বিবরণী ⎯ তারিখ: ${selectedDate}`
            : `মাসিক হিসাব বিবরণী ⎯ মাস: ${selectedMonth}`}
        </h2>
      </div>

      {/* 5. Render Core Report Content */}
      <div id="report-content" className="space-y-6">
        
        {reportMode === 'daily' ? (
          /* ========================================================= */
          /* DAILY REPORT RENDER MODULE                                */
          /* ========================================================= */
          <>
            {/* Net Income Headline Banner */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-950 text-white rounded-3xl p-6 shadow-md text-center space-y-3">
              <span className="text-xs font-bold tracking-wider text-blue-100/80 uppercase">💡 দৈনিক নিট ক্যাশ ইনকাম (Net Income)</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">
                {daily.netIncome.toFixed(2)} ৳
              </h2>
              <p className="text-[10px] text-blue-200/80 font-mono">
                = (দিনের শেষ মোট ব্যালেন্স) − (দিনের শুরু মোট ব্যালেন্স)
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-bold">
                <span className="bg-white/10 px-3 py-1 rounded-full border border-white/5">
                  🌅 শুরু মোট মূল্য: {daily.dayStartTotal.toFixed(2)} ৳
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full border border-white/5">
                  🌌 শেষ মোট মূল্য: {daily.dayEndTotal.toFixed(2)} ৳
                </span>
              </div>
            </div>

            {/* Grid for DayStart vs DayEnd detailed ledgers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Day Start Ledger Sheet */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-emerald-700 text-white p-3.5 flex items-center justify-between gap-3">
                  <span className="font-bold text-sm">🌅 দিনের শুরু বিস্তারিত</span>
                  <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    মোট: {daily.dayStartTotal.toFixed(2)} ৳
                  </span>
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                      <th className="p-2.5 text-left">ব্যালেন্স খাতসমূহ</th>
                      <th className="p-2.5 text-right">টাকা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {PAYMENT_KEYS.map(key => {
                      const v = daily.startData ? (daily.startData[key] || 0) : 0;
                      return (
                        <tr key={key} className={v > 0 ? 'bg-emerald-50/20' : ''}>
                          <td className="p-2.5 text-slate-700 font-semibold">{PAYMENT_METHODS[key]}</td>
                          <td className={`p-2.5 text-right font-bold ${v > 0 ? 'text-emerald-800' : 'text-slate-400'}`}>
                            {v.toFixed(2)} ৳
                          </td>
                        </tr>
                      );
                    })}
                    {/* Balances Subtotal */}
                    <tr className="bg-emerald-50/40 border-t-2 border-emerald-100">
                      <td className="p-2.5 text-emerald-800 font-bold">ব্যালেন্স উপমোট</td>
                      <td className="p-2.5 text-right text-emerald-800 font-extrabold">{daily.startBal.toFixed(2)} ৳</td>
                    </tr>
                    
                    {/* Receivables detail lines */}
                    <tr className="bg-slate-50">
                      <td colSpan={2} className="p-2 py-1.5 text-amber-700 font-bold border-t border-slate-100 uppercase tracking-widest text-[10px]">
                        💰 কাস্টমার পাওনা (Receivables)
                      </td>
                    </tr>
                    {daily.pawona.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-2.5 text-center text-slate-400 italic">কোনো পাওনা নেই</td>
                      </tr>
                    ) : (
                      daily.pawona.map((item, i) => (
                        <tr key={item.id || i} className="bg-amber-50/10">
                          <td className="p-2.5 text-slate-600 pl-4 font-semibold">🔍 {item.label}</td>
                          <td className="p-2.5 text-right text-amber-600 font-bold font-sans">{item.amount.toFixed(2)} ৳</td>
                        </tr>
                      ))
                    )}
                    {daily.pawona.length > 0 && (
                      <tr className="bg-amber-50/30">
                        <td className="p-2.5 text-amber-800 font-bold">পাওনা উপমোট</td>
                        <td className="p-2.5 text-right text-amber-800 font-extrabold">{daily.totalPawona.toFixed(2)} ৳</td>
                      </tr>
                    )}

                    {/* Manual purchase valuation */}
                    <tr className="bg-amber-50/40 border-t border-slate-200">
                      <td className="p-2.5 text-amber-900 font-bold">📦 ক্রয় ব্যয় (Purchase Debit)</td>
                      <td className="p-2.5 text-right text-amber-900 font-extrabold font-sans">+{manualPurchase.toFixed(2)} ৳</td>
                    </tr>

                    {/* Final Opening Aggregate */}
                    <tr className="bg-slate-900 text-white border-t border-slate-800 font-semibold font-sans">
                      <td className="p-3 text-sm font-black">দিনের শুরু মোট =</td>
                      <td className="p-3 text-right text-sm font-black">{daily.dayStartTotal.toFixed(2)} ৳</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Day End Ledger Sheet */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-blue-800 text-white p-3.5 flex items-center justify-between gap-3">
                  <span className="font-bold text-sm">🌌 দিনের শেষ বিস্তারিত</span>
                  <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    মোট: {daily.dayEndTotal.toFixed(2)} ৳
                  </span>
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                      <th className="p-2.5 text-left">ব্যালেন্স খাতসমূহ</th>
                      <th className="p-2.5 text-right">টাকা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {PAYMENT_KEYS.map(key => {
                      const v = daily.endData ? (daily.endData[key] || 0) : 0;
                      return (
                        <tr key={key} className={v > 0 ? 'bg-blue-50/10' : ''}>
                          <td className="p-2.5 text-slate-700 font-semibold">{PAYMENT_METHODS[key]}</td>
                          <td className={`p-2.5 text-right font-bold ${v > 0 ? 'text-blue-800' : 'text-slate-400'}`}>
                            {v.toFixed(2)} ৳
                          </td>
                        </tr>
                      );
                    })}
                    {/* Closing Balance Subtotal */}
                    <tr className="bg-blue-50/30 border-t-2 border-blue-100">
                      <td className="p-2.5 text-blue-800 font-bold">ব্যালেন্স উপমোট</td>
                      <td className="p-2.5 text-right text-blue-800 font-extrabold">{daily.endBal.toFixed(2)} ৳</td>
                    </tr>

                    {/* Custom supplier payments details */}
                    <tr className="bg-slate-50">
                      <td colSpan={2} className="p-2 py-1.5 text-indigo-700 font-bold border-t border-slate-100 uppercase tracking-widest text-[10px]">
                        ✅ প্রদান ও পরিশোধসমূহ (Payments)
                      </td>
                    </tr>
                    {daily.porishod.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-2.5 text-center text-slate-400 italic">কোনো পরিশোধ নেই</td>
                      </tr>
                    ) : (
                      daily.porishod.map((item, i) => (
                        <tr key={item.id || i} className="bg-indigo-50/10">
                          <td className="p-2.5 text-slate-600 pl-4 font-semibold">✔ {item.label}</td>
                          <td className="p-2.5 text-right text-indigo-600 font-bold font-sans">{item.amount.toFixed(2)} ৳</td>
                        </tr>
                      ))
                    )}
                    {daily.porishod.length > 0 && (
                      <tr className="bg-indigo-50/30">
                        <td className="p-2.5 text-indigo-800 font-bold">পরিশোধ উপমোট</td>
                        <td className="p-2.5 text-right text-indigo-800 font-extrabold">{daily.totalPorishod.toFixed(2)} ৳</td>
                      </tr>
                    )}

                    {/* Expenditure detailed layout */}
                    <tr className="bg-slate-50">
                      <td colSpan={2} className="p-2 py-1.5 text-rose-700 font-bold border-t border-slate-100 uppercase tracking-widest text-[10px]">
                        💸 ব্যয় বিস্তারিত (Expenses Debit)
                      </td>
                    </tr>
                    {daily.dayExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-2.5 text-center text-slate-400 italic">কোনো খরচ রেকর্ড হয়নি</td>
                      </tr>
                    ) : (
                      daily.dayExpenses.map((ex, i) => (
                        <tr key={ex.id || i} className="bg-rose-50/10">
                          <td className="p-2.5 text-slate-600 pl-4 font-semibold">
                            ❌ {ex.desc}{' '}
                            <span className="text-[9px] text-slate-400 font-mono">
                              ({PAYMENT_METHODS[ex.method] || ex.method})
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-rose-600 font-bold font-sans">{ex.amount.toFixed(2)} ৳</td>
                        </tr>
                      ))
                    )}
                    {daily.dayExpenses.length > 0 && (
                      <tr className="bg-rose-50/20">
                        <td className="p-2.5 text-rose-800 font-bold">খরচ উপমোট</td>
                        <td className="p-2.5 text-right text-rose-800 font-extrabold">{daily.totalExpenses.toFixed(2)} ৳</td>
                      </tr>
                    )}

                    {/* Sales profit addition */}
                    <tr className="bg-emerald-50/45 border-t border-slate-200">
                      <td className="p-2.5 text-emerald-800 font-bold">📈 বিক্রয় লাভ (Product Sales Profit)</td>
                      <td className="p-2.5 text-right text-emerald-850 font-extrabold font-sans">+{daily.totalProfit.toFixed(2)} ৳</td>
                    </tr>

                    {/* Final Closing Aggregate */}
                    <tr className="bg-slate-950 text-white border-t border-slate-900 font-semibold font-sans">
                      <td className="p-3 text-sm font-black">দিনের শেষ মোট =</td>
                      <td className="p-3 text-right text-sm font-black">{daily.dayEndTotal.toFixed(2)} ৳</td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>

            {/* Daily stats scorecard */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-150 p-2.5 rounded-xl text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">🛒 মোট বিক্রয়</span>
                <b className="block text-sm text-slate-800 mt-1 font-sans">{daily.totalSales.toFixed(2)} ৳</b>
              </div>
              <div className="bg-white border border-slate-150 p-2.5 rounded-xl text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">📈 বিক্রয় লাভ</span>
                <b className="block text-sm text-emerald-600 mt-1 font-sans">+{daily.totalProfit.toFixed(2)} ৳</b>
              </div>
              <div className="bg-white border border-slate-150 p-2.5 rounded-xl text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">💸 মোট খরচ</span>
                <b className="block text-sm text-rose-600 mt-1 font-sans">-{daily.totalExpenses.toFixed(2)} ৳</b>
              </div>
              <div className="bg-white border border-slate-150 p-2.5 rounded-xl text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">📖 নতুন বাকি</span>
                <b className="block text-sm text-orange-600 mt-1 font-sans">{daily.totalLedgers.toFixed(2)} ৳</b>
              </div>
            </div>

            {/* Daily sales table list */}
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-bold text-slate-800 border-l-4 border-blue-600 pl-2">🛒 বিক্রির বিবরণী তালিকা</h3>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-250 font-bold">
                    <tr>
                      <th className="p-2.5 text-left">পণ্য ও বিবরণ</th>
                      <th className="p-2.5 text-center w-16 whitespace-nowrap">পরিমাণ</th>
                      <th className="p-2.5 text-right w-24">বিক্রয় মূল্য</th>
                      <th className="p-2.5 text-right w-20">লাভ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daily.daySales.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400 italic">এই দিনে কোনো পণ্য বিক্রয় করা হয়নি</td>
                      </tr>
                    ) : (
                      daily.daySales.map((sale, i) => (
                        <tr key={sale.id || i} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <span className="font-bold text-slate-800">{sale.prodName}</span>
                            <span className="block text-[10px] text-slate-450 font-medium">
                              {sale.desc} ({PAYMENT_METHODS[sale.method] || sale.method})
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700 font-sans">{sale.qty} টি</td>
                          <td className="p-2.5 text-right font-semibold text-slate-850 font-sans">{sale.amount.toFixed(2)} ৳</td>
                          <td className="p-2.5 text-right font-bold text-emerald-600 font-sans">+{sale.profit.toFixed(2)} ৳</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        ) : (
          /* ========================================================= */
          /* MONTHLY REPORT RENDER MODULE                              */
          /* ========================================================= */
          <>
            {/* Net Income Monthly Headline */}
            <div className="bg-gradient-to-br from-indigo-800 to-indigo-950 text-white rounded-3xl p-6 shadow-md text-center space-y-3">
              <span className="text-xs font-bold tracking-wider text-indigo-100/80 uppercase">💡 মাসিক নিট ব্যবসা লাভ (Net Profit)</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">
                {monthly.netIncomeM.toFixed(2)} ৳
              </h2>
              <p className="text-[10px] text-indigo-200/80 font-mono">
                = (মোট বিক্রয় লাভ) − (মোট খরচ) − (ক্রয় ব্যয়)
              </p>
            </div>

            {/* Scorecard grids */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-emerald-800 uppercase">🛒 মোট বিক্রয়</span>
                <b className="block text-base text-emerald-950 mt-1 font-sans">{monthly.totalSalesM.toFixed(2)} ৳</b>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-emerald-800 uppercase">📈 মোট লাভ</span>
                <b className="block text-base text-emerald-900 mt-1 font-sans">+{monthly.totalProfitM.toFixed(2)} ৳</b>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-rose-800 uppercase">💸 মোট খরচ</span>
                <b className="block text-base text-rose-600 mt-1 font-sans">-{monthly.totalExpensesM.toFixed(2)} ৳</b>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-amber-800 uppercase">📖 মোট বাকি</span>
                <b className="block text-base text-amber-950 mt-1 font-sans">{monthly.totalLedgerM.toFixed(2)} ৳</b>
              </div>
            </div>

            {/* Daily log chart table list */}
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-bold text-slate-800 border-l-4 border-indigo-600 pl-2">📅 দিনভিত্তিক লেনদেন তালিকা</h3>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-[500px] overflow-y-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10 font-bold">
                    <tr>
                      <th className="p-2.5 text-left">তারিখ</th>
                      <th className="p-2.5 text-right">বিক্রয়</th>
                      <th className="p-2.5 text-right text-emerald-700">লাভ</th>
                      <th className="p-2.5 text-right text-rose-700">খরচ</th>
                      <th className="p-2.5 text-right">শুরু মোট</th>
                      <th className="p-2.5 text-right">শেষ মোট</th>
                      <th className="p-2.5 text-right">ইনকাম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {monthly.activeDates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-450 italic">এই মাসে কোনো তথ্য নথিভুক্ত নেই!</td>
                      </tr>
                    ) : (
                      monthly.activeDates.map(date => {
                        const metrics = getDailyMetrics(date);
                        return (
                          <tr key={date} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-slate-700 font-bold shrink-0">{date}</td>
                            <td className="p-2.5 text-right font-medium text-slate-600">{metrics.totalSales.toFixed(0)} ৳</td>
                            <td className="p-2.5 text-right font-bold text-emerald-600">+{metrics.totalProfit.toFixed(0)}</td>
                            <td className="p-2.5 text-right font-bold text-rose-600">-{metrics.totalExpenses.toFixed(0)}</td>
                            <td className="p-2.5 text-right text-slate-450">{metrics.dayStartTotal.toFixed(0)}</td>
                            <td className="p-2.5 text-right text-slate-450">{metrics.dayEndTotal.toFixed(0)}</td>
                            <td className={`p-2.5 text-right font-extrabold ${metrics.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {metrics.netIncome.toFixed(0)} ৳
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {monthly.activeDates.length > 0 && (
                    <tfoot className="bg-slate-900 text-white font-bold text-xs sticky bottom-0 z-10 font-sans">
                      <tr>
                        <td className="p-3">হিসেব সমষ্টী:</td>
                        <td className="p-3 text-right">{monthly.totalSalesM.toFixed(0)} ৳</td>
                        <td className="p-3 text-right text-emerald-400">+{monthly.totalProfitM.toFixed(0)}</td>
                        <td className="p-3 text-right text-rose-400">-{monthly.totalExpensesM.toFixed(0)}</td>
                        <td colSpan={2} className="p-3 text-right">ক্রয়: -{manualPurchase.toFixed(0)}</td>
                        <td className="p-3 text-right text-emerald-300 font-black">{monthly.netIncomeM.toFixed(0)} ৳</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
