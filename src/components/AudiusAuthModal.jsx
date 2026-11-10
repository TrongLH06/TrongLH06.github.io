import React, { useState } from 'react';
import { DEMO_AUDIUS_ACCOUNTS, loginAudiusAccount, logoutAudiusAccount } from '../services/audius_auth.js';

export default function AudiusAuthModal({ isOpen, onClose, currentUser, onLoginSuccess }) {
  const [handleInput, setHandleInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleLogin = async (targetHandle) => {
    const handleToUse = targetHandle || handleInput;
    if (!handleToUse.trim()) {
      setErrorMsg('Vui lòng nhập Handle hoặc chọn tài khoản mẫu');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const user = await loginAudiusAccount(handleToUse);
      setIsLoading(false);
      if (onLoginSuccess) onLoginSuccess(user);
      onClose();
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Không thể kết nối tài khoản Audius. Vui lòng thử lại!');
    }
  };

  const handleLogout = () => {
    const guest = logoutAudiusAccount();
    if (onLoginSuccess) onLoginSuccess(guest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-surface-container rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-secondary/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-black font-black text-2xl">account_circle</span>
            </div>
            <div>
              <h2 className="font-headline font-black text-xl text-white">Tài Khoản Audius & Spotify</h2>
              <p className="text-xs text-on-surface-variant font-mono">Decentralized Audio & Web3 Identity</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Current User Status (if logged in) */}
        {currentUser?.isLoggedIn ? (
          <div className="py-6 flex flex-col gap-5 relative z-10">
            <div className="p-4 rounded-2xl bg-surface-container-high border border-primary/30 flex items-center gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-primary shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base text-white truncate">{currentUser.name}</h3>
                  {currentUser.isVerified && (
                    <span className="material-symbols-outlined text-primary text-base">verified</span>
                  )}
                </div>
                <span className="text-xs text-primary font-mono block">@{currentUser.handle}</span>
                <span className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{currentUser.role}</span>
              </div>
            </div>

            {/* Profile Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-container-high text-center">
                <span className="text-xs text-on-surface-variant font-medium block">Người theo dõi</span>
                <span className="font-mono font-bold text-base text-white">
                  {(currentUser.followerCount || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high text-center">
                <span className="text-xs text-on-surface-variant font-medium block">Bài hát & PL</span>
                <span className="font-mono font-bold text-base text-white">
                  {(currentUser.trackCount || 0) + (currentUser.playlistCount || 0)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high text-center border border-primary/20">
                <span className="text-xs text-primary font-medium block">Số dư $AUDIO</span>
                <span className="font-mono font-bold text-base text-primary">
                  {(currentUser.audioTokenBalance || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {currentUser.bio && (
              <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl leading-relaxed">
                {currentUser.bio}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleLogin(currentUser.handle)}
                disabled={isLoading}
                className="flex-1 py-3 rounded-full bg-primary text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition cursor-pointer shadow-lg"
              >
                <span className="material-symbols-outlined text-base">sync</span>
                <span>{isLoading ? 'Đang đồng bộ...' : 'Đồng bộ lại dữ liệu'}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-3 rounded-full bg-surface-container-high text-red-400 hover:bg-red-500/20 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          /* Login Form */
          <div className="py-6 flex flex-col gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <label htmlFor="audius-handle-input" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Nhập Audius Handle hoặc Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-primary font-mono font-bold text-base">@</span>
                <input
                  id="audius-handle-input"
                  type="text"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="ví dụ: audius, suntungmtp, alexvance..."
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-high text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary border border-white/5 transition-all"
                />
              </div>
              {errorMsg && <p className="text-xs text-red-400 font-medium mt-1">{errorMsg}</p>}
            </div>

            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={isLoading}
              className="w-full py-3.5 rounded-full bg-primary text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                  <span>Đang kết nối Audius Network...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">login</span>
                  <span>Đăng Nhập Tài Khoản Audius</span>
                </>
              )}
            </button>

            {/* Quick Demo Accounts */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant text-center">
                Hoặc trải nghiệm ngay 1-click với tài khoản mẫu
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {DEMO_AUDIUS_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.handle}
                    type="button"
                    onClick={() => handleLogin(acc.handle)}
                    className="p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-all flex items-center gap-3 text-left border border-white/5 hover:border-primary/40 cursor-pointer group"
                  >
                    <img src={acc.avatar} alt={acc.name} className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/10 group-hover:ring-primary" />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-white truncate block group-hover:text-primary transition-colors">
                        {acc.name}
                      </span>
                      <span className="text-[10px] text-primary font-mono truncate block">@{acc.handle}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
