import React, { useState } from 'react';

export default function SoundStreamLikedSongsView({
  likedTracks = [],
  onPlayTrack,
  onPlayPlaylistAll,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onRemoveLiked
}) {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = likedTracks.filter((t) =>
    (t.title || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (t.artist || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Spotify Iconic Purple Gradient Header */}
      <div className="relative -mx-8 -mt-16 pt-20 px-8 pb-10 bg-gradient-to-b from-[#4A154B] via-[#240c26] to-surface overflow-hidden">
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-purple-600/25 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-end gap-7 pt-4">
          {/* Liked Songs Purple Heart Artwork */}
          <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 bg-gradient-to-br from-[#450af5] via-[#8e8ee5] to-[#c4efd9] p-6 flex items-center justify-center relative group">
            <span className="material-symbols-outlined text-white text-8xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </div>

          {/* Header Metadata */}
          <div className="flex flex-col justify-end flex-grow pb-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80 mb-2">Playlist Cá Nhân</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-black tracking-tight text-white mb-4 drop-shadow-md">
              Bài hát đã thích
            </h1>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
              <span className="font-bold text-white">Alex Vance</span>
              <span>•</span>
              <span>{likedTracks.length} bài hát</span>
              <span>•</span>
              <span className="text-white/70">Cập nhật theo thời gian thực</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar (Play All Button & Search in playlist) */}
      <div className="px-8 py-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (likedTracks.length > 0) {
                if (onPlayPlaylistAll) {
                  onPlayPlaylistAll(likedTracks);
                } else if (onPlayTrack) {
                  onPlayTrack(likedTracks[0]);
                }
              }
            }}
            disabled={likedTracks.length === 0}
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary-container text-on-primary flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Phát tất cả bài hát đã thích"
          >
            <span className="material-symbols-outlined text-3xl font-black">
              {isPlaying && currentTrack && likedTracks.some(t => t.id === currentTrack.id) ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
            search
          </span>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Lọc trong danh sách..."
            className="w-full h-9 pl-9 pr-4 rounded-full bg-surface-container text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary border border-white/5"
          />
        </div>
      </div>

      {/* Tracks Table */}
      <div className="px-8">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface-container/30 border border-white/5">
            <span className="material-symbols-outlined text-5xl text-secondary mb-3">favorite_border</span>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
              Chưa có bài hát nào trong danh sách
            </h3>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              Nhấn vào biểu tượng trái tim ở bất kỳ bài hát nào tại Trang chủ hoặc Tìm kiếm để thêm vào đây!
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_4fr_3fr_100px] gap-4 px-4 py-2 border-b border-white/5 text-xs font-semibold text-secondary uppercase tracking-wider">
              <span>#</span>
              <span>Tiêu đề</span>
              <span className="hidden sm:block">Album</span>
              <span className="text-right flex items-center justify-end gap-1">
                <span className="material-symbols-outlined text-base">schedule</span>
              </span>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-1 mt-2">
              {filtered.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
                return (
                  <div
                    key={track.id + '-' + idx}
                    onClick={() => onPlayTrack && onPlayTrack(track)}
                    className={`group grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_4fr_3fr_100px] gap-4 px-4 py-2.5 rounded-xl transition-all cursor-pointer items-center ${
                      isCurrent
                        ? 'bg-surface-container-high text-primary'
                        : 'hover:bg-surface-container/70 text-on-surface'
                    }`}
                  >
                    {/* Index or Animated Eq */}
                    <div className="flex items-center justify-center">
                      {isCurrent && isPlaying ? (
                        <span className="material-symbols-outlined text-primary text-base animate-pulse">volume_up</span>
                      ) : (
                        <>
                          <span className="text-xs font-mono text-secondary group-hover:hidden">{idx + 1}</span>
                          <span className="material-symbols-outlined text-lg text-on-surface hidden group-hover:block">play_arrow</span>
                        </>
                      )}
                    </div>

                    {/* Title & Artist */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={track.img} alt={track.title} className="w-10 h-10 rounded-md object-cover shrink-0 shadow" />
                      <div className="flex flex-col min-w-0">
                        <span className={`font-bold text-sm truncate ${isCurrent ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>
                          {track.title}
                        </span>
                        <span className="text-xs text-secondary truncate">{track.artist}</span>
                      </div>
                    </div>

                    {/* Album */}
                    <span className="hidden sm:block text-xs text-secondary truncate">
                      {track.album || 'Single Release'}
                    </span>

                    {/* Actions & Duration */}
                    <div className="flex items-center justify-end gap-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveLiked && onRemoveLiked(track.id);
                        }}
                        className="text-primary hover:text-red-400 transition-colors cursor-pointer"
                        title="Bỏ thích"
                      >
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          favorite
                        </span>
                      </button>
                      <span className="text-xs font-mono text-secondary">{track.duration || '3:30'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
