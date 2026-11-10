import React, { useState, useEffect } from 'react';
import { searchTracks, searchPlaylists, getTrendingTracks, getPlaylistTracks, VIETNAMESE_ARTISTS, ARTIST_CATEGORIES } from '../services/audius.js';
import AudiusArtworkImage from './AudiusArtworkImage.jsx';

const CATEGORIES = [
  { id: 'c0', name: '🇻🇳 Nhạc Việt Hot', from: '#BA5D07', to: '#693302', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e3/0b/38/e30b383e-5818-321a-7626-557b7b0f8ba3/24UMGIM61359.rgb.jpg/600x600bb.jpg' },
  { id: 'c1', name: 'V-Pop Hits', from: '#147230', to: '#0A3D19', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/25/53/6d/25536d14-c747-c636-97a9-a0add507eece/197188197605.jpg/600x600bb.jpg' },
  { id: 'c2', name: 'Rap Việt / Hiphop', from: '#E01E5A', to: '#700F2D', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8e/bb/ff/8ebbff69-0b36-118d-6dab-d2b3a9c3d677/602448945051_Cover.jpg/600x600bb.jpg' },
  { id: 'c3', name: 'Indie & Chill', from: '#6C5CE7', to: '#392E87', img: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/c2/7e/23/c27e23b0-9730-b12a-3800-61b4c22462de/artwork.jpg/600x600bb.jpg' },
  { id: 'c4', name: 'Lo-Fi Chill Beats', from: '#1E3264', to: '#0A1633', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=60' },
  { id: 'c5', name: 'US-UK & Pop', from: '#8400E7', to: '#45037d', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60' },
  { id: 'c6', name: 'Electronic & EDM', from: '#0D73EC', to: '#043A78', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=60' },
  { id: 'c7', name: 'Acoustic Buồn', from: '#006450', to: '#01352A', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=60' }
];

export default function SoundStreamSearchView({ onPlayTrack, onPlayPlaylistAll, onSelectPlaylist }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [playlistResults, setPlaylistResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recents, setRecents] = useState([]);

  // Load trending V-Pop hits on mount
  useEffect(() => {
    getTrendingTracks('', 12).then((tracks) => {
      if (tracks && tracks.length > 0) {
        setRecents(tracks);
      }
    });
  }, []);

  // Live debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setPlaylistResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      Promise.all([
        searchTracks(query, 16),
        searchPlaylists(query, 6)
      ])
        .then(([trackRes, plRes]) => {
          setSearchResults(trackRes || []);
          setPlaylistResults(plRes || []);
          setIsSearching(false);
        })
        .catch(() => {
          setIsSearching(false);
        });
    }, 280);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelectArtist = (artistQuery) => {
    setQuery(artistQuery);
  };

  const handleSelectCategory = (catName) => {
    const cleanTerm = catName.replace(/^[^\w\s]+/, '').trim();
    setQuery(cleanTerm);
  };

  return (
    <div className="flex flex-col w-full pb-16 px-8 pt-6">
      {/* Search Header & Interactive Input */}
      <div className="relative w-full max-w-3xl mb-8">
        <div className="group relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-4 text-secondary text-2xl transition-colors duration-200 group-focus-within:text-primary">
            search
          </span>
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bài hát, nghệ sĩ Việt (Sơn Tùng, Đen Vâu, Vũ., HIEUTHUHAI...), V-Pop, Rap..."
            className="w-full h-13 pl-12 pr-12 rounded-full bg-surface-container-high text-on-surface placeholder:text-secondary text-sm font-medium focus:outline-none focus:bg-surface-container-highest focus:ring-2 focus:ring-primary transition-all duration-200 shadow-lg border border-white/5"
          />
          {query.length > 0 && (
            <button
              id="clear-search-btn"
              type="button"
              aria-label="Xóa tìm kiếm"
              onClick={() => setQuery('')}
              className="absolute right-4 text-secondary hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            'Tất cả',
            'Sơn Tùng M-TP',
            'Đen Vâu',
            'HIEUTHUHAI',
            'Vũ.',
            'Hòa Minzy',
            'RPT MCK',
            'Tlinh',
            'SOOBIN',
            'MONO',
            'Wren Evans',
            'GREY D',
            'Low G',
            'Chillies',
            'Jack - J97',
            'Mỹ Tâm',
            'Đức Phúc',
            'Erik',
            'Phan Mạnh Quỳnh',
            'Tăng Duy Tân',
            'Quang Hùng MasterD',
            'Dương Domic',
            'Phương Ly',
            'Văn Mai Hương',
            'Trung Quân',
            'Bùi Anh Tuấn',
            'B Ray',
            'Karik',
            'Anh Trai Say Hi',
            'Chông Gai'
          ].map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => {
                setActiveFilter(pill);
                if (pill !== 'Tất cả') setQuery(pill);
                else setQuery('');
              }}
              className={`px-3.5 py-1.5 rounded-full font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeFilter === pill
                  ? 'bg-primary text-on-primary font-black shadow-md scale-105'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Vietnamese Artists Grid - 70+ Artists with Category Filter */}
      {query.trim().length === 0 && (
        <section className="flex flex-col gap-4 mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                <span>Nghệ Sĩ Việt Nam Nổi Bật ({VIETNAMESE_ARTISTS.length})</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Khám phá kho nhạc V-Pop, Rap Việt, Indie, Ballad từ các nghệ sĩ được yêu thích nhất
              </p>
            </div>
            <span className="text-xs text-secondary hidden sm:block">Bấm vào nghệ sĩ để nghe ngay</span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {ARTIST_CATEGORIES.map((cat) => {
              const count = cat.id === 'all'
                ? VIETNAMESE_ARTISTS.length
                : VIETNAMESE_ARTISTS.filter((a) => a.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-black shadow-md font-black scale-105'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-3.5">
            {(selectedCategory === 'all'
              ? VIETNAMESE_ARTISTS
              : VIETNAMESE_ARTISTS.filter((a) => a.category === selectedCategory)
            ).map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  setQuery(art.name);
                  setActiveFilter(art.name);
                }}
                className="group flex flex-col items-center text-center p-3 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high transition-all duration-300 cursor-pointer shadow hover:-translate-y-1"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-lg mb-2 ring-2 ring-transparent group-hover:ring-primary transition-all">
                  <img
                    src={art.avatar}
                    alt={art.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                </div>
                <span className="font-bold text-xs text-on-surface truncate w-full group-hover:text-primary transition-colors">
                  {art.name}
                </span>
                <span className="text-[10px] text-primary/80 font-medium truncate w-full mt-0.5">
                  {art.role}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Live Search Results */}
      {query.trim().length > 0 && (
        <section className="flex flex-col gap-5 mb-12">
          {/* Matched Artist Spotlight Banner */}
          {(() => {
            const qNorm = query
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .trim();
            const matched = VIETNAMESE_ARTISTS.find((art) => {
              const aName = art.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
              const aShort = art.shortName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
              const aId = art.id.toLowerCase();
              return aName.includes(qNorm) || qNorm.includes(aShort) || aId.includes(qNorm);
            });
            if (!matched) return null;
            return (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/15 via-surface-container-high to-surface-container flex flex-col sm:flex-row items-center gap-6 border border-primary/20 shadow-xl">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-2xl flex-shrink-0 ring-4 ring-primary/30">
                  <img src={matched.avatar} alt={matched.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-base">verified</span>
                    <span className="text-xs uppercase font-mono font-bold text-primary tracking-wider">
                      Nghệ Sĩ Được Xác Minh
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-headline font-black text-white truncate w-full">
                    {matched.name}
                  </h1>
                  <p className="text-xs font-semibold text-on-surface-variant mt-1">
                    {matched.role} • {matched.genre} • <span className="font-mono text-white">{matched.monthlyListeners}</span> người nghe
                  </p>
                  <p className="text-xs text-on-surface-variant/80 mt-1.5 max-w-xl line-clamp-2">
                    {matched.bio}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (searchResults.length > 0 && onPlayTrack) {
                          onPlayTrack(searchResults[0]);
                        }
                      }}
                      className="px-5 py-2 rounded-full bg-primary text-black font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg font-black">play_arrow</span>
                      <span>Phát Nhạc {matched.shortName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="px-3.5 py-2 rounded-full bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition cursor-pointer"
                    >
                      Xem tất cả nghệ sĩ
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface flex items-center gap-2">
              <span>Kết quả cho "{query}"</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-container-highest text-primary">
                {searchResults.length} bài hát
              </span>
            </h2>
            {isSearching && (
              <span className="text-xs text-primary font-mono animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                Đang tìm kiếm...
              </span>
            )}
          </div>

          {searchResults.length === 0 && !isSearching ? (
            <div className="p-8 rounded-xl bg-surface-container/40 text-center text-on-surface-variant">
              Không tìm thấy bài hát nào. Hãy thử từ khóa khác như "Sơn Tùng", "Đen", "Vũ", "Chillies", "V-Pop".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onPlayTrack && onPlayTrack(item)}
                  className="group relative flex flex-col p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative w-full aspect-square mb-3 overflow-hidden shadow-lg bg-surface-container-highest rounded-lg">
                    <AudiusArtworkImage
                      artwork={item.artwork}
                      src={item.img}
                      alt={item.title}
                      size="480x480"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-110 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-2xl font-black">
                        play_arrow
                      </span>
                    </button>
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/90">
                      {item.duration || '3:30'}
                    </div>
                  </div>

                  <span className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <span className="text-xs text-secondary truncate mt-0.5">{item.artist}</span>
                </div>
              ))}
            </div>
          )}

          {/* Search Result Playlists from Audius */}
          {playlistResults.length > 0 && (
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">queue_music</span>
                  <span>Danh Sách Phát Liên Quan ({playlistResults.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {playlistResults.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => onSelectPlaylist && onSelectPlaylist(pl.id)}
                    className="group relative flex flex-col p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="relative w-full aspect-square mb-3 overflow-hidden shadow-lg bg-surface-container-highest rounded-lg">
                      <AudiusArtworkImage
                        artwork={pl.artwork}
                        src={pl.artwork?.url}
                        alt={pl.name}
                        size="480x480"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/90">
                        {pl.trackCount} bài
                      </div>
                      <button
                        type="button"
                        aria-label={`Play ${pl.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          getPlaylistTracks(pl.id).then((t) => {
                            if (t && t.length > 0) {
                              if (onPlayPlaylistAll) onPlayPlaylistAll(t);
                              else if (onPlayTrack) onPlayTrack(t[0]);
                            }
                          });
                        }}
                        className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-110 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-2xl font-black">play_arrow</span>
                      </button>
                    </div>
                    <span className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                      {pl.name}
                    </span>
                    <span className="text-xs text-secondary truncate mt-0.5">{pl.user?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Recommended Top Vietnamese Songs when search is empty */}
      {query.trim().length === 0 && recents.length > 0 && (
        <section className="flex flex-col gap-4 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
              <span>Top Ca Khúc Thịnh Hành Việt Nam</span>
            </h2>
            <span className="text-xs font-mono text-secondary">Phát trực tiếp chất lượng cao</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recents.map((item) => (
              <div
                key={item.id}
                onClick={() => onPlayTrack && onPlayTrack(item)}
                className="group relative flex flex-col p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative w-full aspect-square mb-3 overflow-hidden shadow-lg bg-surface-container-highest rounded-lg">
                  <AudiusArtworkImage
                    artwork={item.artwork}
                    src={item.img}
                    alt={item.title}
                    size="480x480"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-110 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl font-black">
                      play_arrow
                    </span>
                  </button>
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/90">
                    {item.duration || '3:30'}
                  </div>
                </div>

                <span className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                  {item.title}
                </span>
                <span className="text-xs text-secondary truncate mt-0.5">{item.artist}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Browse All Genres Section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">Khám phá thể loại</h2>
          <span className="text-xs font-mono text-secondary tracking-widest uppercase">
            {CATEGORIES.length} Thể loại
          </span>
        </div>

        {/* Category Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.name)}
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${cat.from}, ${cat.to})`
              }}
              className="group relative h-48 rounded-xl overflow-hidden p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-300 shadow-lg"
            >
              <h3 className="font-headline font-extrabold text-2xl tracking-tight text-white z-10 break-words leading-none">
                {cat.name}
              </h3>
              <div className="absolute -right-4 -bottom-3 w-28 h-28 rounded-lg overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.6)] transform rotate-[25deg] group-hover:rotate-[20deg] group-hover:scale-105 transition-all duration-300">
                <img className="w-full h-full object-cover" alt={cat.name} src={cat.img} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
