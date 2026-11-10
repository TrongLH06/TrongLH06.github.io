import React, { useState, useEffect } from 'react';
import { getTrendingTracks, getTrendingPlaylists, getPlaylistTracks, getPlaylistDetails } from '../services/audius.js';
import AudiusArtworkImage from './AudiusArtworkImage.jsx';

export default function SoundStreamPlaylistView({
  onPlayTrack,
  onPlayPlaylistAll,
  currentTrack,
  isPlaying,
  onTogglePlay,
  selectedPlaylistId,
  onSelectPlaylist,
  onToggleDownloadTrack
}) {
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [activeTrackId, setActiveTrackId] = useState(null);
  const [isLiked, setIsLiked] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [likedTrackIds, setLikedTrackIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load playlists from Audius
  useEffect(() => {
    let isMounted = true;
    getTrendingPlaylists(15).then(async (pls) => {
      if (!isMounted) return;
      setPlaylists(pls);
      let chosen = pls.find((p) => p.id === selectedPlaylistId);
      if (!chosen && selectedPlaylistId) {
        chosen = await getPlaylistDetails(selectedPlaylistId);
      }
      setActivePlaylist(chosen || pls[0]);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedPlaylistId]);

  // Load tracks when active playlist changes
  useEffect(() => {
    if (!activePlaylist) return;
    let isMounted = true;
    setIsLoading(true);
    getPlaylistTracks(activePlaylist.id).then((tList) => {
      if (!isMounted) return;
      setTracks(tList || []);
      if (tList && tList.length > 0) {
        setActiveTrackId(tList[0].id);
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [activePlaylist]);

  const filteredTracks = tracks.filter((t) =>
    (t.title || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (t.artist || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (t.genre || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  const toggleTrackLike = (id, e) => {
    e.stopPropagation();
    const next = new Set(likedTrackIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLikedTrackIds(next);
  };

  const handleSelectTrack = (track) => {
    setActiveTrackId(track.id);
    if (onPlayTrack) {
      onPlayTrack(track);
    }
  };

  const handleRefreshPlaylist = () => {
    if (!activePlaylist) return;
    setIsLoading(true);
    getPlaylistTracks(activePlaylist.id).then((tList) => {
      setTracks(tList || []);
      setIsLoading(false);
    });
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Immersive Gradient Header Area */}
      <div className="relative -mx-8 -mt-16 pt-20 px-8 pb-10 bg-gradient-to-b from-[#1a237e] via-[#0d1333] to-surface overflow-hidden">
        {/* Atmospheric Ambient Glow */}
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/2 right-12 w-80 h-80 bg-secondary/15 rounded-full blur-[90px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-end gap-7 pt-4">
          {/* High-Impact Playlist Artwork Cover */}
          <div className="relative group w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 bg-surface-container-highest border border-white/10">
            <AudiusArtworkImage
              artwork={activePlaylist?.artwork}
              src={activePlaylist?.artwork?.url}
              alt={activePlaylist?.name}
              size="480x480"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono tracking-widest text-primary font-bold uppercase">
              AUDIUS PROTOCOL
            </div>
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
            )}
          </div>

          {/* Header Metadata Context */}
          <div className="flex flex-col justify-end flex-grow pb-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-base">verified</span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                Verified Audius Playlist
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-black tracking-tight text-white mb-3 line-clamp-2 drop-shadow-md">
              {activePlaylist?.name || 'Top Songs - Audius Network'}
            </h1>
            <p className="text-sm font-medium text-on-surface-variant/90 mb-4 max-w-2xl leading-relaxed line-clamp-2">
              {activePlaylist?.description || 'Phát trực tiếp toàn bộ bài hát chất lượng lossless không giới hạn thời gian từ Audius Protocol.'}
            </p>
            {/* Curated Stats Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-on-surface">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[13px]">graphic_eq</span>
                </div>
                <span className="font-bold text-white hover:underline cursor-pointer">
                  {activePlaylist?.user?.name || 'Audius Editorial'}
                </span>
                {activePlaylist?.user?.isVerified && (
                  <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                )}
              </div>
              <span className="text-on-surface-variant">•</span>
              <span className="text-on-surface-variant font-mono">Full Audio Streaming</span>
              <span className="text-on-surface-variant">•</span>
              <span className="text-white font-mono">{tracks.length} bài hát</span>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Selector Pill Carousel */}
      {playlists.length > 1 && (
        <div className="px-8 pt-4 pb-2 flex items-center gap-3 overflow-x-auto no-scrollbar border-b border-white/5">
          <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">filter_list</span> Playlists:
          </span>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => {
                setActivePlaylist(pl);
                if (onSelectPlaylist) onSelectPlaylist(pl.id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activePlaylist?.id === pl.id
                  ? 'bg-primary text-black shadow-md shadow-primary/20 scale-105'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              <span>{pl.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({pl.trackCount || 10})</span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Controls Bar */}
      <div className="sticky top-0 z-20 -mx-8 px-8 py-4 bg-surface/90 backdrop-blur-xl flex items-center justify-between transition-all border-b border-surface-container-high/40">
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Master Green Play Button */}
          <button
            id="master-play-btn"
            type="button"
            aria-label="Play playlist"
            onClick={() => {
              if (onPlayPlaylistAll && filteredTracks.length > 0) {
                onPlayPlaylistAll(filteredTracks);
              } else if (onTogglePlay && currentTrack?.id) {
                onTogglePlay();
              } else if (tracks.length > 0) {
                handleSelectTrack(tracks[0]);
              }
            }}
            className="w-14 h-14 rounded-full bg-primary-container hover:bg-[#1db954] active:scale-95 hover:scale-105 transition-all text-on-primary-container flex items-center justify-center shadow-lg shadow-primary-container/20 group cursor-pointer"
            title="Phát toàn bộ danh sách"
          >
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Favorite / Save */}
          <button
            type="button"
            aria-label="Save to library"
            onClick={() => setIsLiked(!isLiked)}
            className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-high cursor-pointer"
          >
            <span className={`material-symbols-outlined text-3xl ${isLiked ? 'text-primary' : ''}`} style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}>
              favorite
            </span>
          </button>

          {/* Refresh from Audius */}
          <button
            type="button"
            aria-label="Tải lại từ Audius"
            onClick={handleRefreshPlaylist}
            className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-high cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Làm mới từ Audius Protocol"
          >
            <span className={`material-symbols-outlined text-2xl ${isLoading ? 'animate-spin text-primary' : ''}`}>sync</span>
            <span className="hidden md:inline">Cập nhật Audius</span>
          </button>

          {/* Download Entire Playlist Offline */}
          <button
            type="button"
            aria-label="Tải toàn bộ playlist offline"
            onClick={async () => {
              if (tracks.length > 0 && onToggleDownloadTrack) {
                for (const t of tracks.slice(0, 10)) {
                  await onToggleDownloadTrack(t);
                }
              }
            }}
            className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-high cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Tải toàn bộ danh sách về nghe ngoại tuyến"
          >
            <span className="material-symbols-outlined text-2xl">download_for_offline</span>
            <span className="hidden lg:inline">Tải offline ({tracks.length})</span>
          </button>

          {/* Context Overflow */}
          <button
            type="button"
            aria-label="More options"
            className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-surface-container-high cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">more_horiz</span>
          </button>
        </div>

        {/* Quick Search & Custom Filter */}
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg">search</span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter tracks..."
              className="h-9 w-44 lg:w-56 pl-9 pr-3 rounded-full bg-surface-container-high text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container-highest transition-colors border-0"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span>Custom order</span>
            <span className="material-symbols-outlined text-base">arrow_drop_down</span>
          </button>
        </div>
      </div>

      {/* Detailed Tracklist Section */}
      <div className="w-full mt-4 flex flex-col px-8">
        {/* Sticky Table Column Headers */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 border-b border-surface-container-high/40 select-none">
          <div className="col-span-1 text-center font-mono">#</div>
          <div className="col-span-5 md:col-span-4 lg:col-span-4">Title</div>
          <div className="hidden md:block md:col-span-4 lg:col-span-3">Genre / Album</div>
          <div className="hidden lg:block lg:col-span-3 font-medium">Streams</div>
          <div className="col-span-6 md:col-span-3 lg:col-span-1 flex justify-end items-center pr-2">
            <span className="material-symbols-outlined text-base">schedule</span>
          </div>
        </div>

        {/* Track List Rows */}
        <div className="flex flex-col mt-1 divide-y divide-transparent" id="tracklist-container">
          {isLoading ? (
            <div className="flex flex-col gap-2 py-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-14 bg-surface-container-high/40 rounded-lg animate-pulse flex items-center px-4 gap-4">
                  <div className="w-6 h-4 bg-surface-container-highest rounded"></div>
                  <div className="w-10 h-10 bg-surface-container-highest rounded"></div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="w-48 h-3.5 bg-surface-container-highest rounded"></div>
                    <div className="w-24 h-2.5 bg-surface-container-highest rounded"></div>
                  </div>
                  <div className="w-28 h-3 bg-surface-container-highest rounded hidden md:block"></div>
                  <div className="w-12 h-3 bg-surface-container-highest rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">music_off</span>
              <p className="text-base font-semibold text-on-surface">Không tìm thấy bài hát nào</p>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Thử tìm kiếm với từ khóa khác hoặc tải lại danh sách từ mạng Audius.
              </p>
              <button
                type="button"
                onClick={handleRefreshPlaylist}
                className="mt-2 px-4 py-2 rounded-full bg-primary text-black font-bold text-xs hover:scale-105 transition shadow cursor-pointer"
              >
                Tải lại danh sách từ Audius
              </button>
            </div>
          ) : (
            filteredTracks.map((track, idx) => {
              const isCurrent = (currentTrack?.id === track.id || currentTrack?.title === track.title);
              const isTrackLiked = likedTrackIds.has(track.id);

              return (
                <div
                  key={track.id || idx}
                  onClick={() => handleSelectTrack(track)}
                  className={`track-row group grid grid-cols-12 gap-4 px-4 py-2 rounded-lg hover:bg-surface-container-high transition-colors items-center cursor-pointer ${
                    isCurrent ? 'bg-surface-container-low/60' : ''
                  }`}
                >
                  <div className="col-span-1 flex items-center justify-center relative font-mono text-sm">
                    {isCurrent && isPlaying ? (
                      <span className="text-primary font-bold group-hover:hidden flex items-center">
                        <span className="material-symbols-outlined text-lg animate-pulse">volume_up</span>
                      </span>
                    ) : (
                      <span className="text-on-surface-variant group-hover:hidden">
                        {idx + 1}
                      </span>
                    )}
                    <button
                      type="button"
                      className="hidden group-hover:flex items-center justify-center text-white cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isCurrent && isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                  </div>

                  <div className="col-span-5 md:col-span-4 lg:col-span-4 flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded bg-surface-container-highest overflow-hidden flex-shrink-0 relative shadow-sm">
                      <AudiusArtworkImage
                        artwork={track.artwork}
                        src={track.img}
                        alt={track.title}
                        size="150x150"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-semibold truncate ${isCurrent ? 'text-primary' : 'text-white group-hover:text-white'}`}>
                        {track.title}
                      </span>
                      <span className="text-xs text-on-surface-variant hover:text-white truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:flex md:col-span-4 lg:col-span-3 text-xs text-on-surface-variant hover:text-white truncate items-center">
                    <span className="truncate">{track.genre || track.album || 'Audius Track'}</span>
                  </div>

                  <div className="hidden lg:flex lg:col-span-3 text-xs text-on-surface-variant/80 truncate items-center font-mono">
                    <span>{(track.playCount || 15400).toLocaleString()} plays</span>
                  </div>

                  <div className="col-span-6 md:col-span-3 lg:col-span-1 flex justify-end items-center gap-3 pr-2 text-xs font-mono text-on-surface-variant">
                    <button
                      type="button"
                      onClick={(e) => toggleTrackLike(track.id, e)}
                      className={`transition-colors cursor-pointer ${isTrackLiked ? 'text-primary opacity-100' : 'text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-white'}`}
                    >
                      <span className="material-symbols-outlined text-lg" style={isTrackLiked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                        favorite
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleDownloadTrack) onToggleDownloadTrack(track);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary transition-opacity cursor-pointer p-0.5"
                      title="Tải bài hát offline"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                    </button>
                    <span>{track.duration}</span>
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-white transition-opacity ml-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">more_horiz</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
