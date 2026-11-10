import React, { useState, useEffect } from 'react';
import { getTrendingPlaylists, VERIFIED_AUDIUS_PLAYLISTS } from '../services/audius.js';
import AudiusArtworkImage from './AudiusArtworkImage.jsx';

export default function SoundStreamLibraryView({
  onPlayTrack,
  onPlayPlaylistAll,
  onSelectPlaylist,
  downloadedTracks = [],
  onToggleDownloadTrack
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentSort, setCurrentSort] = useState('Recently Added');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [playlists, setPlaylists] = useState(VERIFIED_AUDIUS_PLAYLISTS);

  useEffect(() => {
    getTrendingPlaylists(10).then((pls) => {
      if (pls && pls.length > 0) {
        setPlaylists(pls);
      }
    });
  }, []);

  const filteredItems = playlists.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Playlists') return true;
    if (activeFilter === 'Artists') return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-16 px-8 pt-6">
      {/* Interactive Top Action & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap" id="filter-container">
          {['All', 'Playlists', '⚡ Đã tải (Offline)', 'Artists', 'Albums'].map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => setActiveFilter(pill)}
              className={`filter-pill px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${
                activeFilter === pill
                  ? 'bg-primary text-black font-black scale-105'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              <span>{pill}</span>
              {pill.includes('Offline') && (
                <span className="text-[10px] opacity-80 font-mono">({downloadedTracks.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Sorting and View Toggle Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Sort Dropdown */}
          <div className="relative group">
            <button
              type="button"
              id="sort-btn"
              onClick={() => setSortMenuOpen(!sortMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">swap_vert</span>
              <span id="current-sort">{currentSort}</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>

            {sortMenuOpen && (
              <div
                id="sort-menu"
                className="absolute right-0 mt-2 w-44 rounded-xl bg-surface-container-high shadow-xl py-2 z-20 flex flex-col gap-1 backdrop-blur-xl border border-white/5"
              >
                {['Recently Added', 'Alphabetical', 'Creator'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setCurrentSort(opt);
                      setSortMenuOpen(false);
                    }}
                    className={`sort-option w-full text-left px-4 py-2 text-xs font-medium hover:bg-surface-container-highest transition-colors flex items-center justify-between cursor-pointer ${
                      currentSort === opt ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>{opt}</span>
                    {currentSort === opt && (
                      <span className="material-symbols-outlined text-sm">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Switcher */}
          <div className="flex items-center p-1 rounded-full bg-surface-container">
            <button
              type="button"
              id="view-grid"
              title="Grid View"
              onClick={() => setViewMode('grid')}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface-container-highest text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
            <button
              type="button"
              id="view-list"
              title="Compact List View"
              onClick={() => setViewMode('list')}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-surface-container-highest text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">view_headline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Offline Downloaded Tracks View */}
      {activeFilter === '⚡ Đã tải (Offline)' ? (
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div>
              <h3 className="font-headline font-bold text-lg text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">offline_pin</span>
                <span>Bài Hát Đã Tải Ngoại Tuyến ({downloadedTracks.length})</span>
              </h3>
              <p className="text-xs text-on-surface-variant">Có thể nghe mượt mà không cần kết nối mạng Internet</p>
            </div>
            {downloadedTracks.length > 0 && (
              <button
                type="button"
                onClick={() => onPlayPlaylistAll && onPlayPlaylistAll(downloadedTracks)}
                className="px-4 py-2 rounded-full bg-primary text-black font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition shadow-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-base font-black">play_arrow</span>
                <span>Phát tất cả offline</span>
              </button>
            )}
          </div>

          {downloadedTracks.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3 bg-surface-container/30 rounded-2xl p-8">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">download_for_offline</span>
              <p className="text-base font-semibold text-white">Chưa có bài hát nào được tải xuống</p>
              <p className="text-xs text-on-surface-variant max-w-md">
                Bấm vào biểu tượng tải xuống trên thanh phát nhạc hoặc danh sách bài hát để lưu nhạc vào bộ nhớ thiết bị và nghe offline không cần mạng!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {downloadedTracks.map((tr) => (
                <div
                  key={tr.id}
                  onClick={() => onPlayTrack && onPlayTrack(tr)}
                  className="group p-3.5 bg-surface-container hover:bg-surface-container-high rounded-xl transition-all flex items-center gap-3.5 cursor-pointer border border-white/5 hover:border-primary/40 relative shadow-md"
                >
                  <img src={tr.img} alt={tr.title} className="w-14 h-14 rounded-lg object-cover shrink-0 shadow" />
                  <div className="flex-1 min-w-0 pr-10">
                    <h4 className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors">
                      {tr.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{tr.artist}</p>
                    <span className="text-[10px] text-primary font-mono flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-xs">offline_pin</span>
                      <span>Sẵn sàng offline</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleDownloadTrack) onToggleDownloadTrack(tr);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-red-400 p-2 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer"
                    title="Xóa khỏi bộ nhớ offline"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Primary Content Grid / List Area */
        <div
          id="library-container"
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 pt-2'
              : 'flex flex-col gap-2 pt-2 divide-y divide-surface-container-high/20'
          }
        >
        {/* Hero Feature Tile: Liked Songs (Spans 2 columns on desktop) */}
        {viewMode === 'grid' && (
          <div
            onClick={() => onSelectPlaylist && onSelectPlaylist('audius-pl-1')}
            className="group relative col-span-1 sm:col-span-2 rounded-2xl p-6 bg-gradient-to-br from-[#4A154B] via-[#2F195F] to-[#121414] overflow-hidden flex flex-col justify-between min-h-[260px] shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

            <div className="flex items-start justify-between z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-2xl text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 text-on-surface backdrop-blur-md">
                Audius Liked
              </span>
            </div>

            <div className="relative z-10 pt-8">
              <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface tracking-tight leading-tight">
                Liked Songs
              </h2>
              <p className="text-xs font-medium text-tertiary mt-2 flex items-center gap-2">
                <span>124 saved tracks</span>
                <span className="w-1 h-1 rounded-full bg-outline"></span>
                <span>Open Audio Protocol</span>
              </p>
            </div>

            <div className="absolute right-6 bottom-6 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20">
              <button
                type="button"
                className="w-12 h-12 rounded-full bg-primary-container hover:bg-primary text-on-primary-container shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Audius Playlists */}
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectPlaylist && onSelectPlaylist(item.id)}
            className={
              viewMode === 'grid'
                ? 'group relative rounded-2xl p-4 bg-surface-container hover:bg-surface-container-high transition-all duration-200 cursor-pointer flex flex-col items-start shadow-sm'
                : 'group flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors cursor-pointer'
            }
          >
            {viewMode === 'grid' ? (
              <>
                <div className="relative w-full aspect-square overflow-hidden mb-4 shadow-md bg-surface-container-highest rounded-lg">
                  <AudiusArtworkImage
                    artwork={item.artwork}
                    size="480x480"
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute right-2 bottom-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container shadow-lg flex items-center justify-center hover:scale-105 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                    </button>
                  </div>
                </div>
                <div className="w-full flex flex-col truncate">
                  <span className="font-headline font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                    {item.name}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium mt-0.5 truncate">
                    Playlist • {item.user?.name || 'Audius'} ({item.trackCount} tracks)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 overflow-hidden shrink-0 shadow bg-surface-container-highest rounded">
                    <AudiusArtworkImage
                      artwork={item.artwork}
                      size="150x150"
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    <span className="text-xs text-on-surface-variant truncate">
                      Playlist • {item.user?.name || 'Audius'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow transition-opacity cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
