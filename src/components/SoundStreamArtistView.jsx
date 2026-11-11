import React, { useState, useEffect, useMemo } from 'react';
import { getArtistDetails, getArtistTracks, VIETNAMESE_ARTISTS, ARTIST_CATEGORIES } from '../services/audius.js';
import AudiusArtworkImage from './AudiusArtworkImage.jsx';

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
      let queue = [...(displayedTracks.length > 0 ? displayedTracks : tracks)];
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
            className="hover:underline hover:text-white cursor-pointer transition-colors"
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
    <div className="flex flex-col w-full pb-20 select-none bg-[#121212]">
      {/* Spotify Emerald / Dark Teal Header Banner */}
      <div className="relative px-6 sm:px-8 pt-8 pb-7 bg-gradient-to-b from-[#134e46] via-[#0c2f2a] to-[#121212] overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Artist Portrait Circle */}
          <div className="relative group w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex-shrink-0 bg-[#181818] ring-2 ring-white/15">
            <AudiusArtworkImage
              src={artist?.avatar}
              alt={artist?.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Artist Metadata */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start mb-1.5">
              {artist?.isVerified !== false && (
                <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                  <span
                    className="material-symbols-outlined text-[#3d91f4] text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  <span>Nghệ sĩ được xác minh</span>
                </div>
              )}
              {categoryInfo && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#1ed760]">{categoryInfo.icon}</span>
                  <span>{categoryInfo.name}</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-headline line-clamp-1 drop-shadow-md">
              {artist?.name || 'Nghệ Sĩ'}
            </h1>

            {artist?.bio && (
              <p className="text-xs sm:text-sm text-white/75 mt-2 max-w-2xl line-clamp-2 leading-relaxed">
                {artist.bio}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-white/80 font-medium flex-wrap justify-center sm:justify-start">
              {artist?.monthlyListeners && (
                <>
                  <span className="text-white font-bold">{artist.monthlyListeners}</span>
                  <span>người nghe hàng tháng</span>
                  <span>•</span>
                </>
              )}
              <span className="text-[#1ed760] font-bold">{tracks.length} bài hát</span>
              <span>•</span>
              <span className="text-white/70">{artist?.genre || 'V-Pop'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spotify Action Control Row (Exact match to Spotify screenshot) */}
      <div className="px-6 sm:px-8 py-4 flex flex-col gap-4 bg-gradient-to-b from-[#0d1f1d]/80 to-[#121212] sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-5">
            {/* Big Spotify Green Play Button */}
            <button
              type="button"
              onClick={handlePlayAll}
              className="w-14 h-14 rounded-full bg-[#1ed760] hover:bg-[#3be477] flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
              title={isCurrentArtistPlaying ? 'Tạm dừng' : `Phát danh sách của ${artist?.name}`}
            >
              <span className="material-symbols-outlined text-3xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isCurrentArtistPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Framed Mini Cover Preview (Exact match to screenshot) */}
            <div
              onClick={handlePlayAll}
              className="w-9 h-11 rounded-md p-0.5 border-2 border-white/30 hover:border-white overflow-hidden cursor-pointer hidden sm:block shadow-md transition"
              title={`Bìa đĩa đơn của ${artist?.name}`}
            >
              <AudiusArtworkImage
                src={tracks[0]?.img || artist?.avatar}
                alt={artist?.name}
                className="w-full h-full rounded-xs object-cover"
              />
            </div>

            {/* Shuffle Toggle */}
            <button
              type="button"
              onClick={() => setIsShuffled((prev) => !prev)}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                isShuffled ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
              }`}
              title={isShuffled ? 'Đang bật phát ngẫu nhiên' : 'Phát ngẫu nhiên'}
            >
              <span className="material-symbols-outlined text-2xl">shuffle</span>
            </button>

            {/* Plus Circle (Follow / Add Artist to Library) */}
            <button
              type="button"
              onClick={() => setIsFollowing((prev) => !prev)}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                isFollowing ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
              }`}
              title={isFollowing ? 'Đã lưu vào thư viện' : 'Lưu nghệ sĩ vào thư viện'}
            >
              <span className="material-symbols-outlined text-2xl">
                {isFollowing ? 'check_circle' : 'add_circle'}
              </span>
            </button>

            {/* Download Circle Button */}
            <button
              type="button"
              onClick={async () => {
                if (onToggleDownloadTrack && tracks.length > 0) {
                  for (const t of tracks.slice(0, 5)) {
                    await onToggleDownloadTrack(t);
                  }
                }
              }}
              className="p-1.5 rounded-full text-[#b3b3b3] hover:text-white transition cursor-pointer"
              title="Tải xuống danh sách bài hát"
            >
              <span className="material-symbols-outlined text-2xl">arrow_circle_down</span>
            </button>

            {/* More Dots (...) */}
            <button
              type="button"
              onClick={() => setActiveSection((prev) => (prev === 'about' ? 'all' : 'about'))}
              className="p-1.5 rounded-full text-[#b3b3b3] hover:text-white transition cursor-pointer"
              title="Tùy chọn & Giới thiệu nghệ sĩ"
            >
              <span className="material-symbols-outlined text-2xl">more_horiz</span>
            </button>
          </div>

          {/* Right Side: Filter Input & "Danh sách" Label */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute left-3 top-2 material-symbols-outlined text-[#b3b3b3] text-sm">
                search
              </span>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={`Tìm bài của ${artist?.shortName || artist?.name}...`}
                className="w-40 md:w-52 h-8 pl-8 pr-7 rounded-full bg-white/10 text-xs text-white placeholder:text-[#b3b3b3] focus:outline-none focus:ring-1 focus:ring-[#1ed760]"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-2 text-[#b3b3b3] hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#b3b3b3] hover:text-white cursor-pointer font-medium">
              <span>Danh sách</span>
              <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
            </div>
          </div>
        </div>

        {/* Discography Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `Tất cả (${tracks.length})` },
            { id: 'popular', label: 'Phổ biến' },
            { id: 'albums', label: `Album & Single (${albumsList.length})` },
            ...(collabTracks.length > 0 ? [{ id: 'collab', label: `Hợp tác (${collabTracks.length})` }] : []),
            { id: 'about', label: 'Giới thiệu' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeSection === tab.id
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#2a2a2a] text-white hover:bg-[#333333]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spotify Tracklist Table (Exact match to screenshot) */}
      {activeSection !== 'about' && (
        <div className="px-6 sm:px-8 mt-2">
          {/* Table Header: # | Tiêu đề | Clock Icon */}
          <div className="grid grid-cols-[36px_1fr_90px] md:grid-cols-[36px_4fr_2fr_110px] gap-4 px-4 py-2 text-xs font-medium text-[#b3b3b3] border-b border-white/10 mb-2">
            <div className="text-center">#</div>
            <div>Tiêu đề</div>
            <div className="hidden md:block">Album</div>
            <div className="text-right flex items-center justify-end pr-4">
              <span className="material-symbols-outlined text-base">schedule</span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
              <div className="w-8 h-8 rounded-full border-2 border-[#1ed760] border-t-transparent animate-spin"></div>
              <span className="text-xs">Đang tải danh sách bài hát của {artist?.name}...</span>
            </div>
          ) : displayedTracks.length === 0 ? (
            <div className="py-12 text-center text-[#b3b3b3] text-sm">
              Không tìm thấy bài hát nào phù hợp với từ khóa "{filterQuery}".
            </div>
          ) : (
            <div className="flex flex-col">
              {displayedTracks.map((track, index) => {
                const isSelected =
                  currentTrack?.id === track.id || currentTrack?.title === track.title;
                const isHovered = hoveredTrackId === track.id;
                const isLiked = likedTracks.some(
                  (t) => t.id === track.id || t.title === track.title
                );

                return (
                  <div
                    key={track.id || index}
                    onMouseEnter={() => setHoveredTrackId(track.id)}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    onClick={() => onPlayTrack && onPlayTrack(track)}
                    className={`grid grid-cols-[36px_1fr_90px] md:grid-cols-[36px_4fr_2fr_110px] gap-4 px-4 py-2.5 rounded-md items-center transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-[#2a2a2a] text-white'
                        : 'hover:bg-[#2a2a2a]/70 text-[#b3b3b3]'
                    }`}
                  >
                    {/* Column 1: Track Number or Play Triangle */}
                    <div className="text-center text-sm flex items-center justify-center">
                      {isHovered || isSelected ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSelected && onTogglePlay) onTogglePlay();
                            else if (onPlayTrack) onPlayTrack(track);
                          }}
                          className="text-white hover:text-[#1ed760] flex items-center justify-center cursor-pointer"
                        >
                          <span
                            className="material-symbols-outlined text-xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {isSelected && isPlaying ? 'pause' : 'play_arrow'}
                          </span>
                        </button>
                      ) : (
                        <span className="font-normal text-[#b3b3b3]">{index + 1}</span>
                      )}
                    </div>

                    {/* Column 2: Song Title & Artist Credits */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded overflow-hidden bg-[#282828] shrink-0">
                        <AudiusArtworkImage
                          src={track.img || artist?.avatar}
                          artwork={track.artwork}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`font-semibold text-[15px] truncate leading-snug ${
                            isSelected ? 'text-[#1ed760]' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <p className="text-[13px] text-[#b3b3b3] truncate leading-snug">
                          {renderClickableArtistCredits(track.artist)}
                        </p>
                      </div>
                    </div>

                    {/* Column 3: Album (Desktop) */}
                    <div className="hidden md:block text-[13px] text-[#b3b3b3] truncate">
                      {track.album || `${artist?.shortName || artist?.name} - Single`}
                    </div>

                    {/* Column 4: Plus Icon + Duration + More Dots (Exact match to screenshot) */}
                    <div className="flex items-center justify-end gap-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleLikeTrack) onToggleLikeTrack(track);
                        }}
                        className={`transition cursor-pointer ${
                          isLiked
                            ? 'text-[#1ed760] opacity-100'
                            : isHovered || isSelected
                            ? 'text-[#b3b3b3] hover:text-white opacity-100'
                            : 'opacity-0 group-hover:opacity-100 text-[#b3b3b3]'
                        }`}
                        title={isLiked ? 'Đã thêm vào Bài hát đã thích' : 'Thêm vào Bài hát đã thích'}
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {isLiked ? 'check_circle' : 'add_circle'}
                        </span>
                      </button>

                      <span className="font-normal text-[13px] text-[#b3b3b3] min-w-[34px]">
                        {track.duration || '3:15'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleDownloadTrack) onToggleDownloadTrack(track);
                        }}
                        className={`transition cursor-pointer ${
                          isHovered || isSelected
                            ? 'text-white opacity-100'
                            : 'opacity-0 group-hover:opacity-100 text-[#b3b3b3]'
                        }`}
                        title="Tùy chọn / Tải bài hát"
                      >
                        <span className="material-symbols-outlined text-lg">more_horiz</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Spotify Release Date & Copyright Footer (Exact match to bottom-left of screenshot) */}
          <div className="mt-8 px-2 text-[#b3b3b3] space-y-0.5">
            <p className="text-sm font-medium text-[#b3b3b3]">27 tháng 6, 2024</p>
            <p className="text-[11px] text-[#b3b3b3]/80">© 2024 {artist?.name} / SoundStream Records</p>
            <p className="text-[11px] text-[#b3b3b3]/80">℗ 2024 {artist?.name} / SoundStream Records</p>
          </div>
        </div>
      )}

      {/* Albums & EPs Visual Grid */}
      {(activeSection === 'all' || activeSection === 'albums') && albumsList.length > 0 && (
        <div className="px-6 sm:px-8 mt-10">
          <h3 className="text-xl font-bold text-white mb-4">
            Đĩa nhạc của {artist?.shortName || artist?.name}
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
                className="group p-3 rounded-lg bg-[#181818] hover:bg-[#282828] transition-colors cursor-pointer"
              >
                <div className="relative aspect-square rounded-md overflow-hidden mb-3 bg-[#282828] shadow-lg">
                  <AudiusArtworkImage
                    src={alb.img}
                    alt={alb.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
                  >
                    <span className="material-symbols-outlined text-2xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </button>
                </div>
                <h4 className="font-bold text-sm text-white truncate">{alb.name}</h4>
                <p className="text-xs text-[#b3b3b3] mt-1">2024 • Đĩa đơn ({alb.tracks.length} bài)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Artist Card */}
      {(activeSection === 'about' || activeSection === 'all') && (
        <div className="px-6 sm:px-8 mt-10">
          <h3 className="text-xl font-bold text-white mb-4">Giới thiệu</h3>
          <div className="p-6 rounded-xl bg-[#181818] hover:bg-[#242424] transition-colors flex flex-col md:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-full overflow-hidden shrink-0 shadow-xl ring-2 ring-white/10">
              <AudiusArtworkImage
                src={artist?.avatar}
                alt={artist?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="text-sm font-bold text-white mb-1">
                {artist?.monthlyListeners || '1,500,000'} người nghe hàng tháng
              </div>
              <p className="text-sm text-[#b3b3b3] leading-relaxed max-w-3xl">
                {artist?.bio}
              </p>
              <div className="mt-4 flex items-center justify-center md:justify-start gap-2 flex-wrap">
                {(artist?.popularHits || []).slice(0, 6).map((hit) => (
                  <span
                    key={hit}
                    onClick={() => {
                      setActiveSection('all');
                      setFilterQuery(hit);
                    }}
                    className="px-3 py-1 rounded-full bg-[#2a2a2a] hover:bg-[#1ed760] text-xs text-white hover:text-black font-semibold cursor-pointer transition"
                  >
                    {hit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Vietnamese Artists Carousel */}
      <div className="px-6 sm:px-8 mt-10">
        <h3 className="text-xl font-bold text-white mb-4">Fan cũng thích</h3>
        <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
          {relatedArtists.map((art) => (
            <div
              key={art.id}
              onClick={() => onSelectArtist && onSelectArtist(art.id)}
              className="group flex flex-col items-center text-center p-3.5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-colors cursor-pointer shrink-0 w-36"
            >
              <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3 shadow-lg bg-[#282828]">
                <AudiusArtworkImage
                  src={art.avatar}
                  alt={art.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="font-bold text-sm text-white truncate w-full">{art.name}</span>
              <span className="text-xs text-[#b3b3b3] truncate w-full mt-1">Nghệ sĩ</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
