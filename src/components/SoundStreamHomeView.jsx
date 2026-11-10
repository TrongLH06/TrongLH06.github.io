import React, { useState, useEffect } from 'react';
import { getTrendingTracks, getTrendingPlaylists, getPlaylistTracks, VIETNAMESE_ARTISTS } from '../services/audius.js';
import AudiusArtworkImage from './AudiusArtworkImage.jsx';

export default function SoundStreamHomeView({
  onPlayTrack,
  onPlayPlaylistAll,
  currentTrack,
  isPlaying,
  onSelectPlaylist,
  currentUser
}) {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [audiusTrending, setAudiusTrending] = useState([]);
  const [audiusPlaylists, setAudiusPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) timeGreeting = 'Chào buổi chiều';
    else if (hour >= 18 || hour < 5) timeGreeting = 'Chào buổi tối';

    if (currentUser?.isLoggedIn && currentUser?.name) {
      return `${timeGreeting}, ${currentUser.name}`;
    }
    return `${timeGreeting}!`;
  };

  // Fetch real trending tracks
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const genre =
      activeFilter === 'Trending Audius'
        ? 'audius'
        : activeFilter === 'Nhạc Việt' || activeFilter === 'Top Hits Việt Nam'
        ? 'V-Pop'
        : activeFilter === 'Rap / Trap'
        ? 'Rap'
        : activeFilter === 'Indie & Chill'
        ? 'Indie'
        : activeFilter !== 'Tất cả'
        ? activeFilter
        : '';

    getTrendingTracks(genre, 18)
      .then((tracks) => {
        if (isMounted) {
          if (tracks && tracks.length > 0) {
            setAudiusTrending(tracks);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  // Fetch real Audius trending playlists
  useEffect(() => {
    let isMounted = true;
    getTrendingPlaylists(12).then((pls) => {
      if (isMounted && pls && pls.length > 0) {
        setAudiusPlaylists(pls);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const quickAccessItems = audiusTrending.slice(0, 6);
  const topMixesItems = audiusTrending.length > 6 ? audiusTrending.slice(6, 18) : audiusTrending.slice(0, 6);

  const handlePlayPlaylistFirstTrack = (playlistId, e) => {
    if (e) e.stopPropagation();
    getPlaylistTracks(playlistId).then((tracks) => {
      if (tracks && tracks.length > 0) {
        if (onPlayPlaylistAll) {
          onPlayPlaylistAll(tracks);
        } else if (onPlayTrack) {
          onPlayTrack(tracks[0]);
        }
      }
    });
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Dynamic Ambient Glow Header Section */}
      <div className="relative -mx-8 px-8 pt-8 pb-10 bg-gradient-to-b from-primary/10 via-surface-container-low/40 to-transparent">
        {/* Greeting & Quick Filters */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight font-headline">
                {getGreeting()}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Lossless V-Pop & International Stream
              </span>
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                'Tất cả',
                'Top Hits Việt Nam',
                'Anh Trai Say Hi & Chông Gai',
                'Sơn Tùng M-TP',
                'Đen Vâu',
                'HIEUTHUHAI',
                'Vũ.',
                'Hòa Minzy',
                'RPT MCK',
                'SOOBIN',
                'MONO',
                'Ký Ức 8x/9x',
                'Trending Audius'
              ].map((pill) => (
                <button
                  key={pill}
                  onClick={() => setActiveFilter(pill)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    activeFilter === pill
                      ? 'bg-on-surface text-surface shadow-md'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* 6 Quick-Access Rectangular Cards (2 rows of 3 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {quickAccessItems.map((item) => {
              const isItemPlaying = (currentTrack?.id === item.id || currentTrack?.title === item.title) && isPlaying;
              return (
                <div
                  key={item.id}
                  onClick={() => onPlayTrack && onPlayTrack(item)}
                  className="group relative flex items-center bg-surface-container-high/60 hover:bg-surface-container-high backdrop-blur-sm rounded-md overflow-hidden transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden bg-surface-container-highest">
                    <AudiusArtworkImage
                      artwork={item.artwork}
                      src={item.img}
                      alt={item.title}
                      size="150x150"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 px-4 min-w-0 pr-14">
                    <p className={`font-bold text-sm truncate group-hover:text-white ${isItemPlaying ? 'text-primary' : 'text-on-surface'}`}>
                      {item.title}
                    </p>
                    <span className="text-[11px] text-on-surface-variant/80 font-medium truncate block">
                      {item.artist}
                    </span>
                  </div>
                  <button
                    aria-label={`Play ${item.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack && onPlayTrack(item);
                    }}
                    className={`absolute right-4 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer ${
                      isItemPlaying ? 'opacity-100 scale-105' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-2xl font-black">
                      {isItemPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section: Nghệ Sĩ Việt Nam Nổi Bật */}
      <section className="mt-8 flex flex-col gap-3 px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">verified</span>
              <span>Nghệ Sĩ Việt Nam Nổi Bật ({VIETNAMESE_ARTISTS.length})</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Top ca sĩ và rapper được yêu thích nhất trên SoundStream</p>
          </div>
          <button
            onClick={() => setActiveFilter('Tất cả')}
            className="text-xs font-bold text-on-surface-variant hover:text-on-surface tracking-wider uppercase transition cursor-pointer"
          >
            Tất cả
          </button>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
          {VIETNAMESE_ARTISTS.slice(0, 16).map((art) => (
            <div
              key={art.id}
              onClick={() => setActiveFilter(art.name)}
              className="group flex flex-col items-center text-center p-2 rounded-xl hover:bg-surface-container-high transition-all duration-200 cursor-pointer shrink-0 w-24"
            >
              <div className="relative w-18 h-18 rounded-full overflow-hidden shadow-lg mb-2 ring-2 ring-transparent group-hover:ring-primary transition-all">
                <img
                  src={art.avatar}
                  alt={art.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="font-bold text-xs text-on-surface truncate w-full group-hover:text-primary transition-colors">
                {art.shortName}
              </span>
              <span className="text-[10px] text-on-surface-variant truncate w-full">
                {art.role.split('/')[0]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 1: Top Ca Khúc Thịnh Hành */}
      <section className="mt-8 flex flex-col gap-4 px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">local_fire_department</span>
              <span>Bảng Xếp Hạng V-Pop & Thịnh Hành</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Các bài hát được nghe nhiều nhất hiện nay</p>
          </div>
          <button className="text-xs font-bold text-on-surface-variant hover:text-on-surface tracking-wider uppercase transition cursor-pointer">
            Xem tất cả
          </button>
        </div>

        {/* Responsive Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {topMixesItems.map((mix) => (
            <div
              key={mix.id}
              onClick={() => onPlayTrack && onPlayTrack(mix)}
              className="group p-3.5 bg-surface-container/60 hover:bg-surface-container-high rounded-xl transition-all duration-300 flex flex-col cursor-pointer relative shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-full aspect-square rounded-lg bg-surface-container-highest overflow-hidden relative shadow-md">
                <AudiusArtworkImage
                  artwork={mix.artwork}
                  src={mix.img}
                  alt={mix.title}
                  size="480x480"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-md text-[10px] font-bold text-primary uppercase tracking-wider">
                  {mix.genre || 'V-Pop'}
                </div>
                <button
                  aria-label={`Play ${mix.title}`}
                  className="absolute right-2.5 bottom-2.5 w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-2xl font-black">play_arrow</span>
                </button>
              </div>
              <div className="mt-3.5 flex flex-col min-w-0">
                <h3 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">{mix.title}</h3>
                <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 leading-snug">{mix.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Tuyển Chọn Playlist Audius */}
      {audiusPlaylists.length > 0 && (
        <section className="mt-12 flex flex-col gap-4 px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">queue_music</span>
                <span>Tuyển Chọn Playlist Trên Audius Protocol</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Khám phá các playlist cộng đồng và tuyển chọn chính thức từ Audius</p>
            </div>
            <button
              onClick={() => onSelectPlaylist && onSelectPlaylist(audiusPlaylists[0]?.id)}
              className="text-xs font-bold text-on-surface-variant hover:text-on-surface tracking-wider uppercase transition cursor-pointer"
            >
              Xem tất cả ({audiusPlaylists.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5">
            {audiusPlaylists.slice(0, 8).map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist && onSelectPlaylist(pl.id)}
                className="group p-4 bg-surface-container/60 hover:bg-surface-container-high rounded-xl transition-all duration-300 flex flex-col cursor-pointer relative shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-full aspect-square rounded-lg bg-surface-container-highest overflow-hidden relative shadow-md">
                  <AudiusArtworkImage
                    artwork={pl.artwork}
                    src={pl.artwork?.url}
                    alt={pl.name}
                    size="480x480"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/90">
                    {pl.trackCount} bài
                  </div>
                  <button
                    aria-label={`Play ${pl.name}`}
                    onClick={(e) => handlePlayPlaylistFirstTrack(pl.id, e)}
                    className="absolute right-3 bottom-3 w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 cursor-pointer"
                    type="button"
                    title="Phát toàn bộ playlist"
                  >
                    <span className="material-symbols-outlined text-2xl font-black">play_arrow</span>
                  </button>
                </div>
                <div className="mt-3.5 flex flex-col min-w-0">
                  <h3 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                    {pl.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 leading-snug">
                    {pl.user?.name || 'Audius Editorial'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Made For You (Bento Split Grid) */}
      <section className="mt-12 flex flex-col gap-4 px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight font-headline">Dành Riêng Cho Bạn</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Gợi ý âm nhạc mới nhất cập nhật mỗi ngày</p>
          </div>
          <button className="text-xs font-bold text-on-surface-variant hover:text-on-surface tracking-wider uppercase transition cursor-pointer">
            Xem tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Feature Card 1: V-Pop Daily Mix */}
          <div className="p-6 bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low rounded-2xl flex flex-col justify-between relative overflow-hidden group border-0 shadow-md">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all duration-500"></div>
            <div className="flex items-start justify-between z-10">
              <div className="flex flex-col">
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary font-mono">Tuyển Chọn Hàng Ngày</span>
                <h3 className="text-2xl font-extrabold text-on-surface mt-1">V-Pop Daily Mix</h3>
                <p className="text-xs text-on-surface-variant mt-1.5 max-w-xs">Giai điệu tuyển chọn từ Sơn Tùng M-TP, Đen Vâu, Vũ., HIEUTHUHAI, Hoà Minzy và nhiều nghệ sĩ khác.</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
            </div>
            <div className="mt-6 pt-4 flex items-center justify-between z-10">
              <button
                onClick={() => {
                  if (audiusTrending.length > 0) {
                    onPlayTrack && onPlayTrack(audiusTrending[0]);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg font-black">play_arrow</span>
                <span>Nghe Ngay</span>
              </button>
            </div>
          </div>

          {/* Feature Card 2: Indie & Lo-Fi Chill */}
          <div className="p-6 bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low rounded-2xl flex flex-col justify-between relative overflow-hidden group border-0 shadow-md">
            <div className="flex items-start justify-between z-10">
              <div className="flex flex-col">
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary font-mono">Thư Giãn & Tập Trung</span>
                <h3 className="text-2xl font-extrabold text-on-surface mt-1">Indie & Lo-Fi Chill</h3>
                <p className="text-xs text-on-surface-variant mt-1.5 max-w-xs">Bản hòa tấu acoustic, lofi piano và giọng hát mộc mạc cho buổi tối thư thái.</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">spa</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between z-10">
              <span className="text-xs text-on-surface font-semibold">Cập nhật liên tục</span>
              <button
                onClick={() => {
                  if (audiusTrending.length > 4) {
                    onPlayTrack && onPlayTrack(audiusTrending[4]);
                  }
                }}
                className="w-10 h-10 rounded-full bg-surface-container-highest hover:bg-primary text-on-surface hover:text-on-primary flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl font-black">play_arrow</span>
              </button>
            </div>
          </div>

          {/* Feature Card 3: SoundStream Radio */}
          <div className="p-6 bg-surface-container-high/80 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary font-mono">SoundStream AI</span>
                <h3 className="text-lg font-bold text-on-surface mt-0.5">Trạm Phát Radio</h3>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">podcasts</span>
            </div>

            {/* Inline Audio Waveform Visualizer */}
            <div className="my-4 p-3 bg-surface-container-lowest/60 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high">
                <img
                  className="w-full h-full object-cover"
                  alt="Radio"
                  src={audiusTrending[0]?.img || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&auto=format&fit=crop&q=60'}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">
                  {audiusTrending[0]?.title || 'Đừng Làm Trái Tim Anh Đau'}
                </p>
                <p className="text-[11px] text-on-surface-variant truncate">
                  {audiusTrending[0]?.artist || 'Sơn Tùng M-TP'}
                </p>
              </div>
              {/* Mini equalizer animation */}
              <div className="flex items-end gap-1 h-5 px-1">
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-5"></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3"></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-4"></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2"></span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-on-surface-variant">Phát liên tục không giới hạn</span>
              <button
                onClick={() => {
                  if (audiusTrending.length > 2) {
                    onPlayTrack && onPlayTrack(audiusTrending[2]);
                  }
                }}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                Bật Radio
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
