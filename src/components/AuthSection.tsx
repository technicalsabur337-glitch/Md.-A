/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, User, UserPlus, AlertCircle, CheckCircle, Store } from 'lucide-react';
import { User as UserType } from '../types';
import { DEFAULT_USERS, loadUsers, saveUsers } from '../lib/db';

interface AuthSectionProps {
  onLoginSuccess: (user: UserType) => void;
}

export function AuthSection({ onLoginSuccess }: AuthSectionProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Register State
  const [regName, setRegName] = useState('');
  const [regShopName, setRegShopName] = useState('');
  const [regId, setRegId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsPendingApproval(false);

    const uid = loginId.trim();
    const pass = loginPassword;

    // Combine default admin users with local registers
    const allUsers = [...DEFAULT_USERS, ...loadUsers()];
    const matchedUser = allUsers.find(u => u.id === uid && u.password === pass);

    if (!matchedUser) {
      setLoginError('❌ ইউজার আইডি বা পাসওয়ার্ড ভুল হয়েছে!');
      return;
    }

    if (matchedUser.status === 'pending') {
      setIsPendingApproval(true);
      return;
    }

    onLoginSuccess(matchedUser);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const name = regName.trim();
    const shop = regShopName.trim();
    const uid = regId.trim();
    const pass = regPassword;
    const confirmPass = regConfirmPassword;

    if (!name || !shop || !uid || !pass) {
      setRegError('সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন!');
      return;
    }

    if (pass !== confirmPass) {
      setRegError('পাসওয়ার্ড দুটি মিলছে না!');
      return;
    }

    if (pass.length < 4) {
      setRegError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!');
      return;
    }

    const allUsers = [...DEFAULT_USERS, ...loadUsers()];
    const userAlreadyExists = allUsers.some(u => u.id.toLowerCase() === uid.toLowerCase());

    if (userAlreadyExists) {
      setRegError('ঐ ইউজার আইডিটি ইতিমধ্যে নিবন্ধিত! অন্য একটি দিন।');
      return;
    }

    const currentLocalUsers = loadUsers();
    const newUser: UserType = {
      id: uid,
      password: pass,
      name,
      shopName: shop,
      status: 'pending',
      registeredAt: new Date().toISOString()
    };

    saveUsers([...currentLocalUsers, newUser]);
    
    setRegSuccess('✅ রেজিস্ট্রেশন সফল হয়েছে! অ্যাডমিন অনুমোদন করলে আপনি লগইন করতে পারবেন।');
    
    // Reset Form
    setRegName('');
    setRegShopName('');
    setRegId('');
    setRegPassword('');
    setRegConfirmPassword('');
    
    // Auto shift to login tab after 3 seconds
    setTimeout(() => {
      setActiveTab('login');
      setLoginId(uid);
      setIsPendingApproval(true);
    }, 2500);
  };

  return (
    <div id="auth-section" className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-6 sm:p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-sans">আইটি জোন</h1>
        <p className="text-slate-500 text-sm mt-1">দোকান লেনদেন ও লাভ-ক্ষতি খতিয়ান অ্যাপ</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
        <button
          id="tab-login-btn"
          type="button"
          onClick={() => {
            setActiveTab('login');
            setLoginError('');
            setIsPendingApproval(false);
          }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
            activeTab === 'login'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          লগইন
        </button>
        <button
          id="tab-reg-btn"
          type="button"
          onClick={() => {
            setActiveTab('register');
            setRegError('');
            setRegSuccess('');
          }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
            activeTab === 'register'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          রেজিস্ট্রেশন
        </button>
      </div>

      {activeTab === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">ইউজার আইডি (User ID)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="loginId"
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="ইউজার আইডি লিখুন"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">পাসওয়ার্ড (Password)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="loginPassword"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans text-sm"
                required
              />
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-xs text-left">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {isPendingApproval && (
            <div id="login-pending" className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1.5">
              <span className="text-2xl">⏳</span>
              <h4 className="font-bold text-amber-800 text-sm">অ্যাকাউন্ট অনুমোদনের অপেক্ষায়</h4>
              <p className="text-amber-700 text-xs leading-relaxed">
                আপনার অ্যাকাউন্ট রেজিস্ট্রেশন সফল হয়েছে। অ্যাডমিন বা মো: আব্দুর সবুর ভাই অনুমোদন করলে এই আইডি দিয়ে লগইন করতে পারবেন।
              </p>
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-colors duration-150 flex items-center justify-center gap-2 mt-4 text-sm"
          >
            <Lock className="w-4 h-4" />
            লগইন করুন
          </button>

          <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
            নতুন অ্যাকাউন্ট নেই?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline"
            >
              রেজিস্ট্রেশন করুন
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">আপনার নাম (Full Name)</label>
            <input
              id="regName"
              type="text"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="যেমন: মোঃ আব্দুর সবুর"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-sans"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">দোকানের নাম (Shop Name)</label>
            <input
              id="regShop"
              type="text"
              value={regShopName}
              onChange={(e) => setRegShopName(e.target.value)}
              placeholder="যেমন: আইটি জোন"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-sans"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">ইউজার আইডি (User ID)</label>
            <input
              id="regId"
              type="text"
              value={regId}
              onChange={(e) => setRegId(e.target.value)}
              placeholder="যেমন: 25800"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-sans font-mono"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">পাসওয়ার্ড (Password)</label>
            <input
              id="regPass"
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">পাসওয়ার্ড নিশ্চিত করুন</label>
            <input
              id="regPass2"
              type="password"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              placeholder="পাসওয়ার্ড আবার লিখুন"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              required
            />
          </div>

          {regError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-xs text-left">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          {regSuccess && (
            <div id="reg-success" className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-emerald-800 text-xs text-left">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          <button
            id="reg-submit"
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-colors duration-150 flex items-center justify-center gap-2 mt-4 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            রেজিস্ট্রেশন করুন
          </button>

          <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
            ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline"
            >
              লগইন করুন
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
