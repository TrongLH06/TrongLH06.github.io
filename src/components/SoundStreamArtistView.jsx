import React, { useState, useEffect, useMemo } from 'react';
import { getArtistDetails, getArtistTracks, VIETNAMESE_ARTISTS, ARTIST_CATEGORIES } from '../services/audius.js';

export default function SoundStreamArtistView({
  artistId,
  onPlayTrack,
  onPlayPlaylistAll,
  currentTrack,
  isPlaying,
  onTogglePlay,
  likedTracks = [],
  onToggleLikeTrack,
  onToggleDownloadTrack,
  isTrackDownloaded,
  onSelectArtist
}) {
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'popular' | 'albums' | 'collab' | 'about'
  const [hoveredTrackId, setHoveredTrackId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setFilterQuery('');
    setActiveSection('all');

    const art = getArtistDetails(artistId);
    setArtist(art);

    getArtistTracks(artistId).then((tList) => {
      if (!isMounted) return;
      setTracks(tList || []);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [artistId]);

  // Group tracks by album for the Albums/EP showcase
  const albumsList = useMemo(() => {
    const map = new Map();
    for (const t of tracks) {
      const albName = t.album || `${artist?.shortName || artist?.name} - Single`;
      if (!map.has(albName)) {
        map.set(albName, {
          name: albName,
          img: t.img || artist?.avatar,
          tracks: [],
          year: '2024'
        });
      }
      map.get(albName).tracks.push(t);
    }
    return Array.from(map.values());
  }, [tracks, artist]);

  const collabTracks = useMemo(
    () =>
      tracks.filter(
        (t) =>
          !t.isPrimaryArtist ||
          (t.artist && /[,&x]|feat\.?|ft\.?/i.test(t.artist)) ||
          (Array.isArray(t.featuredArtistIds) && t.featuredArtistIds.length > 1)
      ),
    [tracks]
  );

  const displayedTracks = useMemo(() => {
    let base = tracks;
    if (activeSection === 'popular') {
      base = [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 6);
    } else if (activeSection === 'collab') {
      base = collabTracks;
    }

    if (!filterQuery.trim()) return base;
    const q = filterQuery.toLowerCase();
    return base.filter(
      (t) =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.artist || '').toLowerCase().includes(q) ||
        (t.album || '').toLowerCase().includes(q)
    );
  }, [tracks, collabTracks, activeSection, filterQuery]);

  // Related artists in the same category first, then others
  const relatedArtists = useMemo(() => {
    if (!artist) return VIETNAMESE_ARTISTS.slice(0, 14);
    const sameCat = VIETNAMESE_ARTISTS.filter((a) => a.id !== artist.id && a.category === artist.category);
    const otherCat = VIETNAMESE_ARTISTS.filter((a) => a.id !== artist.id && a.category !== artist.category);
    return [...sameCat, ...otherCat].slice(0, 16);
  }, [artist]);

  if (!artist && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl text-primary mb-3">person_off</span>
        <p className="text-base font-bold text-white">Không tìm thấy nghệ sĩ này</p>
      </div>
    );
  }

  const isCurrentArtistPlaying =
    isPlaying && tracks.some((t) => t.id === currentTrack?.id || t.title === currentTrack?.title);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isCurrentArtistPlaying) {
      if (onTogglePlay) onTogglePlay();
    } else {
      let queue = [...displayedTracks.length > 0 ? displayedTracks : tracks];
      if (isShuffled) {
        queue.sort(() => Math.random() - 0.5);
      }
      if (onPlayPlaylistAll) {
        onPlayPlaylistAll(queue, queue[0]);
      } else if (onPlayTrack) {
        onPlayTrack(queue[0]);
      }
    }
  };

  const categoryInfo = ARTIST_CATEGORIES.find((c) => c.id === artist?.category);

  // Render clickable individual artist names in a track credit string (e.g. "Shiki, Obito")
  const renderClickableArtistCredits = (creditStr) => {
    if (!creditStr) return artist?.name;
    const parts = String(creditStr)
      .split(/([,&]|(?:\s+x\s+)|(?:\s+ft\.?\s+)|(?:\s+feat\.?\s+))/i)
      .filter(Boolean);

    return parts.map((part, idx) => {
      if (/^([,&]|(\s+x\s+)|(\s+ft\.?\s+)|(\s+feat\.?\s+))$/i.test(part)) {
        return <span key={idx}>{part}</span>;
      }
      const trimmed = part.trim();
      const matchedArt = VIETNAMESE_ARTISTS.find(
        (a) =>
          a.name.toLowerCase() === trimmed.toLowerCase() ||
          (a.shortName && a.shortName.toLowerCase() === trimmed.toLowerCase())
      );
      if (matchedArt) {
        return (
          <span
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectArtist) onSelectArtist(matchedArt.id);
            }}
            className="hover:underline hover:text-primary cursor-pointer transition-colors"
            title={`Mở trang nghệ sĩ ${matchedArt.name}`}
          >
            {trimmed}
          </span>
        );
      }
      return <span key={idx}>{trimmed}</span>;
    });
  };

  return (
    <div className="flex flex-col w-full pb-20 select-none">
      {/* Immersive Artist Hero Banner (Spotify Emerald / Dark Forest Tone) */}
      <div className="relative -mx-8 -mt-16 pt-24 px-8 pb-10 bg-gradient-to-b from-[#0e3b36] via-[#092420] to-[#121414] overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[110px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-7 pt-2">
          {/* Artist Avatar Circle */}
          <div className="relative group w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-2xl flex-shrink-0 bg-surface-container-highest border-2 border-white/10 ring-4 ring-primary/25">
            {artist?.avatar ? (
              <img
                src={artist.avatar}
                alt={artist.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-container text-primary">
                <span className="material-symbols-outlined text-6xl">person</span>
              </div>
            )}
          </div>

          {/* Artist Metadata */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left min-w-0">
            {/* Verified Badge & Category Tag */}
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-2">
              <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <span>Nghệ sĩ được xác minh</span>
              </div>
              {categoryInfo && (
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">{categoryInfo.icon}</span>
                  <span>{categoryInfo.name}</span>
                </span>
              )}
            </div>

            {/* Artist Main Title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-headline line-clamp-1 drop-shadow-md">
              {artist?.name || 'Nghệ Sĩ'}
            </h1>

            {/* Bio Description */}
            {artist?.bio && (
              <p className="text-xs sm:text-sm text-white/75 mt-2.5 max-w-2xl line-clamp-2 leading-relaxed">
                {artist.bio}
              </p>
            )}

            {/* Listener count & Stats */}
            <div className="flex items-center gap-2.5 mt-3.5 text-xs sm:text-sm text-on-surface-variant font-medium flex-wrap justify-center md:justify-start">
              <span className="text-white font-bold">{artist?.monthlyListeners || '1,500,000'}</span>
              <span>người nghe hàng tháng</span>
              <span>•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono text-xs">
                {artist?.role || artist?.genre || 'V-Pop / R&B'}
              </span>
              <span>•</span>
              <span className="text-primary font-bold">{tracks.length} bài hát chính thức</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Control Bar & Filter Tabs (Matching Spotify screenshot) */}
      <div className="px-8 py-4 flex flex-col gap-4 border-b border-white/5 bg-[#121414]/95 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Big Green Play Button */}
            <button
              type="button"
              onClick={handlePlayAll}
              className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition cursor-pointer"
              title={isCurrentArtistPlaying ? 'Tạm dừng' : `Phát tất cả bài hát của ${artist?.name}`}
            >
              <span className="material-symbols-outlined text-3xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isCurrentArtistPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Mini Album Cover Thumbnail */}
            {tracks[0]?.img && (
              <img
                src={tracks[0].img}
                alt="Cover"
                className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10 hidden sm:block shadow-md"
              />
            )}

            {/* Shuffle Toggle */}
            <button
              type="button"
              onClick={() => setIsShuffled((prev) => !prev)}
              className={`p-2 rounded-full transition cursor-pointer ${
                isShuffled ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-white'
              }`}
              title={isShuffled ? 'Đang phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
            >
              <span className="material-symbols-outlined text-2xl">shuffle</span>
            </button>

            {/* Follow Button Pill */}
            <button
              type="button"
              onClick={() => setIsFollowing((prev) => !prev)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                isFollowing
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-white/30 text-white hover:border-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isFollowing ? 'check' : 'person_add'}
              </span>
              <span>{isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
            </button>

            {/* Download Discography */}
            <button
              type="button"
              onClick={async () => {
                if (onToggleDownloadTrack && tracks.length > 0) {
                  for (const t of tracks.slice(0, 5)) {
                    await onToggleDownloadTrack(t);
                  }
                }
              }}
              className="p-2 rounded-full text-on-surface-variant hover:text-white transition cursor-pointer"
              title="Tải 5 bài hát nổi bật về máy nghe offline"
            >
              <span className="material-symbols-outlined text-2xl">arrow_circle_down</span>
            </button>
          </div>

          {/* Right Side: Search inside artist & View Label */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-2 material-symbols-outlined text-on-surface-variant text-sm">
                search
              </span>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={`Tìm bài của ${artist?.shortName || artist?.name}...`}
                className="w-44 md:w-56 h-8 pl-8 pr-7 rounded-full bg-white/5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary border border-white/10"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-2 text-on-surface-variant hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
              <span>Danh sách</span>
              <span className="material-symbols-outlined text-base">format_list_bulleted</span>
            </div>
          </div>
        </div>

        {/* Discography Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `Tất cả bài hát (${tracks.length})`, icon: 'queue_music' },
            { id: 'popular', label: 'Phổ biến nhất', icon: 'local_fire_department' },
            { id: 'albums', label: `Album & EP (${albumsList.length})`, icon: 'album' },
            ...(collabTracks.length > 0
              ? [{ id: 'collab', label: `Hợp tác Feat. (${collabTracks.length})`, icon: 'group' }]
              : []),
            { id: 'about', label: 'Giới thiệu', icon: 'info' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeSection === tab.id
                  ? 'bg-primary text-black shadow-md'
                  : 'bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tracklist Table (Shown in 'all', 'popular', 'collab', or 'albums') */}
      {activeSection !== 'about' && (
        <div className="px-8 mt-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant border-b border-white/10 mb-2">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-8 sm:col-span-6 md:col-span-5">Tiêu đề</div>
            <div className="hidden md:block md:col-span-3">Album / Đĩa đơn</div>
            <div className="hidden sm:block sm:col-span-3 md:col-span-2 text-center">Lượt nghe / Thao tác</div>
            <div className="col-span-3 sm:col-span-2 md:col-span-1 text-right flex items-center justify-end">
              <span className="material-symbols-outlined text-base">schedule</span>
            </div>
          </div>

          {/* Tracks Rows */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <span className="text-xs">Đang tải danh sách bài hát của {artist?.name}...</span>
            </div>
          ) : displayedTracks.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-sm">
              Không tìm thấy bài hát nào phù hợp với từ khóa "{filterQuery}".
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {displayedTracks.map((track, index) => {
                const isSelected =
                  currentTrack?.id === track.id || currentTrack?.title === track.title;
                const isHovered = hoveredTrackId === track.id;
                const isDownloaded = isTrackDownloaded ? isTrackDownloaded(track.id) : false;
                const isLiked = likedTracks.some(
                  (t) => t.id === track.id || t.title === track.title
                );

                return (
                  <div
                    key={track.id || index}
                    onMouseEnter={() => setHoveredTrackId(track.id)}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    onClick={() => onPlayTrack && onPlayTrack(track)}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-xl items-center transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-white/10 text-white shadow-sm ring-1 ring-primary/30'
                        : 'hover:bg-white/5 text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {/* Number / Play Button */}
                    <div className="col-span-1 text-center font-mono text-sm flex items-center justify-center">
                      {isHovered || isSelected ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSelected && onTogglePlay) onTogglePlay();
                            else if (onPlayTrack) onPlayTrack(track);
                          }}
                          className="text-white hover:text-primary transition"
                        >
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isSelected && isPlaying ? 'pause' : 'play_arrow'}
                          </span>
                        </button>
                      ) : (
                        <span className={isSelected ? 'text-primary font-bold' : ''}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Title & Clickable Artist Credits */}
                    <div className="col-span-8 sm:col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                      <img
                        src={track.img || artist?.avatar}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-bold text-sm truncate ${
                              isSelected ? 'text-primary' : 'text-white group-hover:text-primary transition-colors'
                            }`}
                          >
                            {track.title}
                          </h4>
                          {!track.isPrimaryArtist && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-mono uppercase shrink-0">
                              Feat.
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          {renderClickableArtistCredits(track.artist)}
                        </p>
                      </div>
                    </div>

                    {/* Album */}
                    <div className="hidden md:block md:col-span-3 text-xs text-on-surface-variant truncate">
                      {track.album || `${artist?.shortName} - Single`}
                    </div>

                    {/* Play Count & Action Icons (Like + Download) */}
                    <div className="hidden sm:flex sm:col-span-3 md:col-span-2 items-center justify-center gap-2.5">
                      <span className="text-[11px] font-mono text-on-surface-variant/75 hidden lg:inline">
                        {((track.playCount || 850000) / 1000000).toFixed(2)}M
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleLikeTrack) onToggleLikeTrack(track);
                        }}
                        className={`p-1 rounded-full transition cursor-pointer ${
                          isLiked ? 'text-primary' : 'text-on-surface-variant hover:text-white'
                        }`}
                        title={isLiked ? 'Đã thích' : 'Thích bài hát'}
                      >
                        <span className="material-symbols-outlined text-lg" style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                          {isLiked ? 'favorite' : 'favorite_border'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleDownloadTrack) onToggleDownloadTrack(track);
                        }}
                        className={`p-1 rounded-full transition cursor-pointer ${
                          isDownloaded ? 'text-amber-400' : 'text-on-surface-variant hover:text-white'
                        }`}
                        title={isDownloaded ? 'Đã tải ngoại tuyến' : 'Tải về máy'}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {isDownloaded ? 'download_done' : 'download'}
                        </span>
                      </button>
                    </div>

                    {/* Duration */}
                    <div className="col-span-3 sm:col-span-2 md:col-span-1 text-right font-mono text-xs text-on-surface-variant">
                      {track.duration || '3:30'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Albums & EPs Visual Grid */}
      {(activeSection === 'all' || activeSection === 'albums') && albumsList.length > 0 && (
        <div className="px-8 mt-10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">album</span>
            <span>Đĩa Đơn, EP & Tuyển Tập Của {artist?.shortName || artist?.name} ({albumsList.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {albumsList.slice(0, 6).map((alb, i) => (
              <div
                key={alb.name + i}
                onClick={() => {
                  if (alb.tracks.length > 0 && onPlayPlaylistAll) {
                    onPlayPlaylistAll(alb.tracks);
                  }
                }}
                className="group p-3.5 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high transition-all cursor-pointer border border-white/5 hover:border-primary/30 shadow-md"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-surface-container-highest">
                  <img
                    src={alb.img}
                    alt={alb.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
                  >
                    <span className="material-symbols-outlined text-xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </button>
                </div>
                <h4 className="font-bold text-xs text-white truncate group-hover:text-primary transition-colors">
                  {alb.name}
                </h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  2024 • {alb.tracks.length} bài hát
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Artist Section */}
      {(activeSection === 'about' || activeSection === 'all') && (
        <div className="px-8 mt-10">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-low border border-white/5 flex flex-col md:flex-row items-center gap-6">
            <img
              src={artist?.avatar}
              alt={artist?.name}
              className="w-24 h-24 rounded-full object-cover ring-2 ring-primary/40 shrink-0"
            />
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                <span>Hồ Sơ Nghệ Sĩ Việt Nam Chính Thức</span>
              </div>
              <h3 className="text-xl font-black text-white">{artist?.name}</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed max-w-3xl">
                {artist?.bio} Sở hữu <strong>{artist?.monthlyListeners}</strong> người nghe hàng tháng trên SoundStream với dòng nhạc chủ đạo <strong>{artist?.genre}</strong>.
              </p>
              <div className="mt-3 flex items-center justify-center md:justify-start gap-2 flex-wrap">
                {(artist?.popularHits || []).slice(0, 6).map((hit) => (
                  <span
                    key={hit}
                    onClick={() => setFilterQuery(hit)}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-primary/20 text-[11px] text-white/80 hover:text-primary cursor-pointer transition"
                  >
                    🎵 {hit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Release & Copyright Footer (Matching Spotify screenshot) */}
      <div className="px-8 mt-8 pt-6 border-t border-white/5 text-xs text-on-surface-variant/70 space-y-1">
        <p className="font-medium text-white/60">Phát hành & Bản quyền Âm nhạc Chính thức</p>
        <p>© 2024 - 2026 {artist?.name} / SoundStream Vietnam Artist Catalog</p>
        <p>℗ SoundStream Lossless Open Audio Protocol • Tất cả {tracks.length} bài hát bản đầy đủ</p>
      </div>

      {/* Related Vietnamese Artists Carousel */}
      <div className="px-8 mt-10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">recommend</span>
          <span>Nghệ sĩ cùng thể loại & Khám phá thêm ({VIETNAMESE_ARTISTS.length} Nghệ Sĩ)</span>
        </h3>
        <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
          {relatedArtists.map((art) => (
            <div
              key={art.id}
              onClick={() => onSelectArtist && onSelectArtist(art.id)}
              className="group flex flex-col items-center text-center p-3.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200 cursor-pointer shrink-0 w-32 border border-white/5 hover:border-primary/40 shadow"
            >
              <div className="relative w-20 h-20 rounded-full overflow-hidden mb-2.5 ring-2 ring-white/10 group-hover:ring-primary transition-all">
                <img
                  src={art.avatar}
                  alt={art.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <span className="font-bold text-xs text-white truncate w-full group-hover:text-primary transition-colors">
                {art.name}
              </span>
              <span className="text-[10px] text-on-surface-variant truncate w-full mt-0.5">
                {art.role}
              </span>
              <span className="text-[9px] text-primary/80 font-mono mt-1">
                {(art.popularHits || []).length} bài hát
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
