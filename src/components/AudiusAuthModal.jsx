import React, { useState } from 'react';
import {
  PRESET_AVATARS,
  DEMO_AUDIUS_ACCOUNTS,
  loginAudiusAccount,
  logoutAudiusAccount,
  saveCustomUserProfile,
  updateStoredUserProfile
} from '../services/audius_auth.js';

export default function AudiusAuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  likedCount = 0,
  playlistCount = 0,
  offlineCount = 0
}) {
  const [activeTab, setActiveTab] = useState('custom'); // 'custom' | 'demo' | 'audius'
  const [isEditing, setIsEditing] = useState(false);

  // Custom Profile Form State
  const [customName, setCustomName] = useState(currentUser?.name && currentUser?.isLoggedIn ? currentUser.name : '');
  const [customBio, setCustomBio] = useState(currentUser?.bio && currentUser?.isLoggedIn ? currentUser.bio : '');
  const [selectedAvatar, setSelectedAvatar] = useState(
    currentUser?.avatar || PRESET_AVATARS[0].url
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Audius Handle State
  const [handleInput, setHandleInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  if (!isOpen) return null;

  const triggerSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // 1. Submit Custom Profile (Create / Edit)
  const handleSaveCustomProfile = (e) => {
    if (e) e.preventDefault();
    if (!customName.trim()) {
      setErrorMsg('Vui lòng nhập Tên hiển thị hoặc Nickname của bạn');
      return;
    }
    setErrorMsg(null);
    const avatarToUse = customAvatarUrl.trim() || selectedAvatar;

    let updatedUser;
    if (currentUser?.isLoggedIn) {
      updatedUser = updateStoredUserProfile({
        name: customName.trim(),
        bio: customBio.trim(),
        avatar: avatarToUse
      });
      triggerSuccess('Đã cập nhật hồ sơ cá nhân thành công!');
      setIsEditing(false);
    } else {
      updatedUser = saveCustomUserProfile({
        name: customName.trim(),
        bio: customBio.trim(),
        avatar: avatarToUse
      });
      triggerSuccess(`Chào mừng ${updatedUser.name} đến với SoundStream!`);
    }

    if (onLoginSuccess) onLoginSuccess(updatedUser);
  };

  // 2. Login via Audius Handle
  const handleAudiusLogin = async (targetHandle) => {
    const handleToUse = targetHandle || handleInput;
    if (!handleToUse.trim()) {
      setErrorMsg('Vui lòng nhập Handle Audius (@username)');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const user = await loginAudiusAccount(handleToUse);
      setIsLoading(false);
      triggerSuccess(`Đã kết nối tài khoản Audius: ${user.name} 🚀`);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Không thể kết nối tài khoản Audius. Vui lòng kiểm tra lại handle!');
    }
  };

  // 3. Logout
  const handleLogout = () => {
    const guest = logoutAudiusAccount();
    if (onLoginSuccess) onLoginSuccess(guest);
    setIsEditing(false);
    setCustomName('');
    setCustomBio('');
    triggerSuccess('Đã đăng xuất tài khoản.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#181a1b] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-secondary/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <span className="material-symbols-outlined text-black font-black text-2xl">
                {currentUser?.isLoggedIn ? 'account_circle' : 'login'}
              </span>
            </div>
            <div>
              <h2 className="font-headline font-black text-lg sm:text-xl text-white">
                {currentUser?.isLoggedIn ? 'Hồ Sơ & Tài Khoản Cá Nhân' : 'Đăng Nhập SoundStream'}
              </h2>
              <p className="text-xs text-on-surface-variant font-mono">
                {currentUser?.isLoggedIn
                  ? `Đang đăng nhập dưới dạng ${currentUser.name}`
                  : 'Cá nhân hóa kho nhạc Lossless & Playlist của riêng bạn'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Success / Error Notification */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-primary/20 border border-primary/40 text-primary text-xs font-bold flex items-center gap-2 animate-bounce">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{successToast}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 relative z-10 space-y-6">
          {currentUser?.isLoggedIn && !isEditing ? (
            /* VIEW LOGGED IN PROFILE */
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-surface-container-high to-surface-container border border-primary/30 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="relative shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/40 shadow-xl"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black shadow">
                    <span className="material-symbols-outlined text-sm font-black">music_note</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg text-white truncate">{currentUser.name}</h3>
                    {currentUser.isVerified && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>Đã xác minh</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-primary font-mono block mt-0.5">@{currentUser.handle}</span>
                  <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
                    {currentUser.bio || 'Chưa có tiểu sử cá nhân.'}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-surface-container-high border border-white/5 text-center">
                  <span className="text-[11px] text-on-surface-variant block">Bài hát thích</span>
                  <span className="font-mono font-black text-lg text-primary">{likedCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-high border border-white/5 text-center">
                  <span className="text-[11px] text-on-surface-variant block">Playlist tạo</span>
                  <span className="font-mono font-black text-lg text-white">{playlistCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-high border border-white/5 text-center">
                  <span className="text-[11px] text-on-surface-variant block">Nhạc Offline</span>
                  <span className="font-mono font-black text-lg text-amber-400">{offlineCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-high border border-primary/20 text-center">
                  <span className="text-[11px] text-primary block">Số dư $AUDIO</span>
                  <span className="font-mono font-black text-lg text-primary">
                    {(currentUser.audioTokenBalance || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomName(currentUser.name);
                    setCustomBio(currentUser.bio || '');
                    setSelectedAvatar(currentUser.avatar);
                    setIsEditing(true);
                  }}
                  className="flex-1 py-3 px-4 rounded-full bg-surface-container-highest hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border border-white/10"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  <span>Chỉnh sửa hồ sơ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="py-3 px-4 rounded-full bg-primary/20 hover:bg-primary/30 text-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border border-primary/30"
                >
                  <span className="material-symbols-outlined text-base">swap_horiz</span>
                  <span>Đổi tài khoản</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-3 px-4 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border border-red-500/20"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          ) : (
            /* LOGIN / REGISTER / EDIT FORM */
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex items-center p-1 rounded-2xl bg-surface-container-high border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab('custom')}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'custom'
                      ? 'bg-primary text-black shadow-md'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>Hồ Sơ Cá Nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('demo')}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'demo'
                      ? 'bg-primary text-black shadow-md'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">star</span>
                  <span>Nghệ Sĩ Nổi Bật</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audius')}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'audius'
                      ? 'bg-primary text-black shadow-md'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">token</span>
                  <span>Audius Web3</span>
                </button>
              </div>

              {/* TAB 1: CUSTOM LOCAL PROFILE */}
              {activeTab === 'custom' && (
                <form onSubmit={handleSaveCustomProfile} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                      Tên hiển thị / Nickname của bạn <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Ví dụ: Trọng Lê, Alex, Linh Dan..."
                      className="w-full h-12 px-4 rounded-xl bg-surface-container-high text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary border border-white/10 transition-all placeholder:text-white/30"
                      maxLength={50}
                    />
                  </div>

                  {/* Choose Avatar */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
                      <span>Chọn Ảnh Đại Diện (Avatar)</span>
                      <span className="text-[11px] text-primary lowercase">chọn 1 ảnh bên dưới</span>
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                      {PRESET_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(av.url);
                            setCustomAvatarUrl('');
                          }}
                          className={`relative rounded-full aspect-square overflow-hidden cursor-pointer transition-all ${
                            selectedAvatar === av.url && !customAvatarUrl
                              ? 'ring-4 ring-primary scale-105 shadow-lg shadow-primary/30'
                              : 'opacity-70 hover:opacity-100 hover:scale-105 ring-1 ring-white/10'
                          }`}
                          title={av.name}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    {/* Custom Image URL Option */}
                    <div className="pt-1">
                      <input
                        type="url"
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        placeholder="Hoặc dán URL link ảnh đại diện riêng của bạn..."
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary border border-white/5"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                      Tiểu sử / Giới thiệu ngắn
                    </label>
                    <textarea
                      value={customBio}
                      onChange={(e) => setCustomBio(e.target.value)}
                      placeholder="Chia sẻ gu âm nhạc yêu thích của bạn (V-Pop, Indie, Hip-Hop...)"
                      rows={2}
                      className="w-full p-3 rounded-xl bg-surface-container-high text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary border border-white/10 transition-all resize-none placeholder:text-white/30"
                      maxLength={150}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center gap-3 pt-2">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="py-3.5 px-5 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-3.5 rounded-full bg-primary text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-primary/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>{isEditing ? 'Lưu Thay Đổi Hồ Sơ' : 'Bắt Đầu Nghe Nhạc Ngay'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: DEMO ARTIST ACCOUNTS */}
              {activeTab === 'demo' && (
                <div className="space-y-4">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Trải nghiệm ngay 1-click với tư cách các nghệ sĩ hàng đầu Việt Nam & Quốc tế. Dữ liệu tài khoản, huy hiệu Verified và token sẽ được kích hoạt tự động:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {DEMO_AUDIUS_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.handle}
                        type="button"
                        onClick={() => handleAudiusLogin(acc.handle)}
                        className="p-3 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest transition-all flex items-center gap-3 text-left border border-white/5 hover:border-primary/50 cursor-pointer group"
                      >
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-white/10 group-hover:ring-primary transition-all"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-xs text-white truncate group-hover:text-primary transition-colors">
                              {acc.name}
                            </span>
                            {acc.isVerified && (
                              <span className="material-symbols-outlined text-primary text-[13px]">verified</span>
                            )}
                          </div>
                          <span className="text-[10px] text-primary font-mono block">@{acc.handle}</span>
                          <span className="text-[10px] text-on-surface-variant line-clamp-1 mt-0.5">{acc.badge}</span>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">
                          arrow_forward
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIUS WEB3 HANDLE LOGIN */}
              {activeTab === 'audius' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl shrink-0">hub</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Kết nối trực tiếp với giao thức âm nhạc phi tập trung <strong>Audius Protocol</strong> để tải danh sách bài hát cá nhân, số dư $AUDIO token và huy hiệu nghệ sĩ.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="audius-handle-input" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                      Nhập Audius Handle (@username)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-primary font-mono font-bold text-base">@</span>
                      <input
                        id="audius-handle-input"
                        type="text"
                        value={handleInput}
                        onChange={(e) => setHandleInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAudiusLogin()}
                        placeholder="ví dụ: suntungmtp, denvau, audius..."
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-high text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary border border-white/10 transition-all placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAudiusLogin()}
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
                        <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                        <span>Đồng Bộ Tài Khoản Audius Web3</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
