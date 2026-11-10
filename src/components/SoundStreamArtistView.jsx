import React, { useState, useEffect } from 'react';
import { getArtistDetails, getArtistTracks, VIETNAMESE_ARTISTS } from '../services/audius.js';

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
  const [hoveredTrackId, setHoveredTrackId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

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
      let queue = [...tracks];
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

  const filteredTracks = tracks.filter((t) =>
    (t.title || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (t.artist || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (t.album || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full pb-20 select-none">
      {/* Immersive Artist Header (Matching Spotify Emerald / Dark Forest Tone) */}
      <div className="relative -mx-8 -mt-16 pt-24 px-8 pb-12 bg-gradient-to-b from-[#0e3b36] via-[#09221f] to-[#121414] overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[110px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-7 pt-4">
          {/* Artist Avatar Circle / Artwork */}
          <div className="relative group w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden shadow-2xl flex-shrink-0 bg-surface-container-highest border-2 border-white/10 ring-4 ring-primary/20">
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
            {/* Verified Badge */}
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Nghệ sĩ được xác minh</span>
            </div>

            {/* Artist Main Title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-headline line-clamp-1 drop-shadow-md">
              {artist?.name || 'Nghệ Sĩ'}
            </h1>

            {/* Listener count & Role */}
            <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-on-surface-variant font-medium flex-wrap justify-center md:justify-start">
              <span className="text-white font-bold">{artist?.monthlyListeners || '1,200,000'}</span>
              <span>người nghe hàng tháng</span>
              <span>•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono text-xs">
                {artist?.role || artist?.genre || 'V-Pop / R&B'}
              </span>
              <span>•</span>
              <span className="text-primary font-bold">{tracks.length} bài hát</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Control Bar (Exactly matching Spotify screenshot) */}
      <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-[#121414]/90 sticky top-16 z-20 backdrop-blur-md">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Big Green Play Button */}
          <button
            type="button"
            onClick={handlePlayAll}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition cursor-pointer"
            title={isCurrentArtistPlaying ? 'Tạm dừng' : `Phát tất cả bài hát của ${artist?.name}`}
          >
            <span className="material-symbols-outlined text-3xl font-black">
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

          {/* Follow / Library Toggle */}
          <button
            type="button"
            onClick={() => setIsFollowing((prev) => !prev)}
            className={`p-2 rounded-full transition cursor-pointer ${
              isFollowing ? 'text-primary' : 'text-on-surface-variant hover:text-white'
            }`}
            title={isFollowing ? 'Đang theo dõi' : 'Thêm vào thư viện'}
          >
            <span className="material-symbols-outlined text-2xl">
              {isFollowing ? 'check_circle' : 'add_circle'}
            </span>
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
            title="Tải album ngoại tuyến"
          >
            <span className="material-symbols-outlined text-2xl">arrow_circle_down</span>
          </button>

          {/* More Options */}
          <button
            type="button"
            className="p-2 rounded-full text-on-surface-variant hover:text-white transition cursor-pointer"
            title="Tùy chọn khác"
          >
            <span className="material-symbols-outlined text-2xl">more_horiz</span>
          </button>
        </div>

        {/* Right Side: View Label */}
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <span className="absolute left-3 top-2.5 material-symbols-outlined text-on-surface-variant text-sm">
              search
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Tìm bài hát..."
              className="w-36 md:w-48 h-8 pl-8 pr-3 rounded-full bg-white/5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary border border-white/5"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
            <span>Danh sách</span>
            <span className="material-symbols-outlined text-base">format_list_bulleted</span>
          </div>
        </div>
      </div>

      {/* Tracklist Table (Line-for-line matching Spotify screenshot) */}
      <div className="px-8 mt-4">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant border-b border-white/10 mb-2">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-8 sm:col-span-6 md:col-span-5">Tiêu đề</div>
          <div className="hidden md:block md:col-span-3">Album / Phát hành</div>
          <div className="hidden sm:block sm:col-span-3 md:col-span-2 text-center">Thao tác</div>
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
        ) : filteredTracks.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant text-sm">
            Không tìm thấy bài hát nào phù hợp.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredTracks.map((track, index) => {
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
                      ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5'
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
                        <span className="material-symbols-outlined text-xl">
                          {isSelected && isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                    ) : (
                      <span className={isSelected ? 'text-primary font-bold' : ''}>
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <div className="col-span-8 sm:col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                    <img
                      src={track.img}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`font-bold text-sm truncate ${
                          isSelected ? 'text-primary' : 'text-white group-hover:text-primary transition-colors'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="hidden md:block md:col-span-3 text-xs text-on-surface-variant truncate">
                    {track.album || 'Có Đôi Điều - Single'}
                  </div>

                  {/* Action Icons (Like + Download) */}
                  <div className="hidden sm:flex sm:col-span-3 md:col-span-2 items-center justify-center gap-3">
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
                      <span className="material-symbols-outlined text-lg">
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

        {/* Release & Copyright Footer (Matching Spotify screenshot) */}
        <div className="mt-12 pt-6 border-t border-white/5 text-xs text-on-surface-variant/70 space-y-1">
          <p className="font-medium text-white/60">27 tháng 6, 2024</p>
          <p>© 2024 {artist?.name}/CIRCLE R • Phát hành chính thức</p>
          <p>℗ 2024 SoundStream Hi-Fi Lossless Music Protocol</p>
        </div>

        {/* More Vietnamese Artists Carousel */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">recommend</span>
            <span>Khám phá thêm nghệ sĩ khác</span>
          </h3>
          <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
            {VIETNAMESE_ARTISTS.filter((a) => a.id !== artist?.id)
              .slice(0, 12)
              .map((art) => (
                <div
                  key={art.id}
                  onClick={() => onSelectArtist && onSelectArtist(art.id)}
                  className="group flex flex-col items-center text-center p-3 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200 cursor-pointer shrink-0 w-28 border border-white/5 hover:border-primary/40"
                >
                  <div className="relative w-20 h-20 rounded-full overflow-hidden mb-2 ring-2 ring-white/10 group-hover:ring-primary transition-all">
                    <img src={art.avatar} alt={art.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="font-bold text-xs text-white truncate w-full group-hover:text-primary transition-colors">
                    {art.name}
                  </span>
                  <span className="text-[10px] text-on-surface-variant truncate w-full mt-0.5">
                    {art.role}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
