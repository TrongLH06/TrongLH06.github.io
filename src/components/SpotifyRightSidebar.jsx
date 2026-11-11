import React, { useEffect, useRef } from 'react';
import { getLyricsForTrack } from '../services/lyrics.js';

export default function SpotifyRightSidebar({
  activeView, // 'nowPlaying' | 'queue' | 'lyrics'
  onClose,
  currentTrack,
  playlistQueue,
  currentTrackIndex,
  onPlayTrack,
  onRemoveFromQueue,
  currentTime,
  isLiked,
  onToggleLike
}) {
  const lyricsContainerRef = useRef(null);

  if (!activeView) return null;

  const lyrics = currentTrack ? getLyricsForTrack(currentTrack.title) : [];
  const nextTracks = playlistQueue.slice(currentTrackIndex + 1);

  // Auto-scroll lyrics to keep active line centered
  useEffect(() => {
    if (activeView === 'lyrics' && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector('.active-lyric-line');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, activeView]);

  return (
    <aside className="w-80 lg:w-96 bg-surface-container-low border-l border-white/5 flex flex-col h-full z-40 shrink-0 select-none overflow-hidden transition-all duration-300">
      {/* Top Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-surface/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            {activeView === 'nowPlaying' ? 'info' : activeView === 'queue' ? 'queue_music' : 'mic'}
          </span>
          <h2 className="font-headline font-bold text-base text-on-surface">
            {activeView === 'nowPlaying' && 'Đang phát'}
            {activeView === 'queue' && 'Danh sách phát (Queue)'}
            {activeView === 'lyrics' && 'Lời bài hát (Lyrics)'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          title="Đóng bảng"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 1. NOW PLAYING VIEW */}
        {activeView === 'nowPlaying' && currentTrack && (
          <div className="flex flex-col gap-6">
            {/* Big Artwork */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-surface-container-highest relative group">
              <img
                src={currentTrack.img}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button
                type="button"
                onClick={onToggleLike}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-primary transition-colors cursor-pointer shadow-lg"
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={isLiked ? { fontVariationSettings: "'FILL' 1", color: '#4cf479' } : {}}
                >
                  favorite
                </span>
              </button>
            </div>

            {/* Track Info */}
            <div className="flex flex-col">
              <h3 className="font-headline font-extrabold text-2xl text-on-surface leading-tight">
                {currentTrack.title}
              </h3>
              <p className="text-base font-semibold text-secondary hover:text-on-surface hover:underline cursor-pointer mt-1">
                {currentTrack.artist}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-secondary font-mono">
                <span className="px-2.5 py-1 rounded-full bg-surface-container font-sans text-primary font-bold">
                  {currentTrack.genre || 'V-Pop'}
                </span>
                <span>• {currentTrack.duration || '3:30'}</span>
                {typeof currentTrack.playCount === 'number' && currentTrack.playCount > 0 && (
                  <span>• {currentTrack.playCount.toLocaleString()} lượt nghe</span>
                )}
              </div>
            </div>

            {/* Artist Card (Spotify About The Artist) */}
            <div className="p-5 rounded-2xl bg-surface-container/70 border border-white/5 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Thông tin nghệ sĩ</span>
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container-highest shrink-0 shadow">
                  <img src={currentTrack.img} alt={currentTrack.artist} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-on-surface truncate">{currentTrack.artist}</span>
                  {currentTrack.isVerified !== false && (
                    <span className="text-xs text-primary font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span> Nghệ sĩ đã xác minh
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed line-clamp-3">
                {currentTrack.artist} là một trong những nghệ sĩ được yêu thích nhất trên nền tảng với hàng triệu người nghe mỗi tháng.
              </p>
            </div>

            {/* Credits / Album */}
            <div className="p-5 rounded-2xl bg-surface-container/40 flex flex-col gap-2 text-xs">
              <span className="font-bold text-on-surface">Thông tin phát hành</span>
              <div className="flex justify-between text-secondary">
                <span>Album / Single:</span>
                <span className="font-medium text-on-surface truncate max-w-[180px]">{currentTrack.album || 'Single'}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Định dạng:</span>
                <span className="font-mono text-primary font-bold">Lossless 256kbps AAC</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. QUEUE VIEW */}
        {activeView === 'queue' && (
          <div className="flex flex-col gap-6">
            {/* Now Playing */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Đang phát</span>
              {currentTrack && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-primary/20 shadow-md">
                  <img src={currentTrack.img} alt={currentTrack.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-sm text-primary truncate">{currentTrack.title}</span>
                    <span className="text-xs text-secondary truncate">{currentTrack.artist}</span>
                  </div>
                  <span className="material-symbols-outlined text-primary text-xl animate-pulse">volume_up</span>
                </div>
              )}
            </div>

            {/* Next in Queue */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Tiếp theo trong hàng đợi ({nextTracks.length})
                </span>
              </div>

              {nextTracks.length === 0 ? (
                <p className="text-xs text-secondary italic py-4 text-center">
                  Hết bài hát trong danh sách chờ. Nhạc sẽ tự động tiếp tục ngẫu nhiên!
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {nextTracks.map((track, idx) => (
                    <div
                      key={track.id + '-' + idx}
                      onClick={() => onPlayTrack && onPlayTrack(track)}
                      className="group flex items-center gap-3 p-2.5 rounded-xl bg-surface-container/40 hover:bg-surface-container transition-all cursor-pointer"
                    >
                      <span className="w-5 text-center text-xs font-mono text-secondary group-hover:hidden">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        className="w-5 text-center hidden group-hover:flex items-center justify-center text-primary"
                      >
                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                      </button>

                      <img src={track.img} alt={track.title} className="w-10 h-10 rounded-md object-cover shrink-0" />

                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                          {track.title}
                        </span>
                        <span className="text-[11px] text-secondary truncate">{track.artist}</span>
                      </div>

                      <span className="text-xs font-mono text-secondary shrink-0">{track.duration || '3:30'}</span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromQueue && onRemoveFromQueue(currentTrackIndex + 1 + idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-secondary hover:text-red-400 p-1 transition-opacity cursor-pointer"
                        title="Xóa khỏi hàng đợi"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. LYRICS VIEW (Spotify Karaoke Style) */}
        {activeView === 'lyrics' && (
          <div ref={lyricsContainerRef} className="flex flex-col gap-6 py-4">
            <div className="text-center pb-4 border-b border-white/5">
              <h3 className="font-headline font-bold text-lg text-on-surface">{currentTrack?.title}</h3>
              <p className="text-xs text-secondary">{currentTrack?.artist}</p>
            </div>

            <div className="flex flex-col gap-6 text-center">
              {lyrics.map((line, idx) => {
                const nextLineTime = lyrics[idx + 1] ? lyrics[idx + 1].time : 9999;
                const isActive = currentTime >= line.time && currentTime < nextLineTime;
                const isPassed = currentTime >= nextLineTime;

                return (
                  <p
                    key={idx}
                    className={`text-lg sm:text-xl font-headline font-bold transition-all duration-300 cursor-pointer select-none ${
                      isActive
                        ? 'active-lyric-line text-primary scale-105 drop-shadow-[0_0_12px_rgba(76,244,121,0.4)]'
                        : isPassed
                        ? 'text-on-surface/80 hover:text-on-surface'
                        : 'text-on-surface/30 hover:text-on-surface/60'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
