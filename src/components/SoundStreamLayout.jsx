import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import SoundStreamHomeView from './SoundStreamHomeView.jsx';
import AudiusArtworkImage from './AudiusArtworkImage.jsx';
import {
  getTrendingTracks,
  getTrendingPlaylists,
  searchArtists,
  searchArtistsAsync,
  searchTracks,
  getArtistDetails,
  resolvePlayableAudioUrl,
  removeVietnameseTones,
  VERIFIED_AUDIUS_TRACKS,
  VIETNAMESE_ARTISTS
} from '../services/audius.js';
import { getStoredAudiusUser, fetchUserPlaylists, logoutAudiusAccount } from '../services/audius_auth.js';
import {
  getDownloadedTracks,
  downloadTrackOffline,
  removeTrackOffline,
  isTrackDownloaded
} from '../services/offline_storage.js';

// Code-split routes and heavy components for optimized bundle size & fast initial paint
const SoundStreamSearchView = lazy(() => import('./SoundStreamSearchView.jsx'));
const SoundStreamPlaylistView = lazy(() => import('./SoundStreamPlaylistView.jsx'));
const SoundStreamLibraryView = lazy(() => import('./SoundStreamLibraryView.jsx'));
const SoundStreamLikedSongsView = lazy(() => import('./SoundStreamLikedSongsView.jsx'));
const SoundStreamArtistView = lazy(() => import('./SoundStreamArtistView.jsx'));
const SpotifyRightSidebar = lazy(() => import('./SpotifyRightSidebar.jsx'));
const AudiusAuthModal = lazy(() => import('./AudiusAuthModal.jsx'));

function ViewSkeleton() {
  return (
    <div className="p-8 animate-pulse space-y-6">
      <div className="h-44 rounded-2xl bg-surface-container-high/60 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-surface-container-high/40" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-surface-container-high/30 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function SoundStreamLayout() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'search' | 'playlist' | 'library' | 'liked' | 'artist'
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('vn-pl-1');
  const [selectedArtistId, setSelectedArtistId] = useState('shiki');
  const [sidebarPlaylists, setSidebarPlaylists] = useState([]);
  const [sidebarFilter, setSidebarFilter] = useState('artists'); // 'all' | 'artists' | 'playlists'
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [topSearchQuery, setTopSearchQuery] = useState('');
  const [showTopSearchDropdown, setShowTopSearchDropdown] = useState(false);
  const [topMatchedArtists, setTopMatchedArtists] = useState([]);
  const [topMatchedTracks, setTopMatchedTracks] = useState([]);
  const [searchPageInitQuery, setSearchPageInitQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('soundstream_volume');
    return saved ? Number(saved) : 75;
  });
  const [prevVolume, setPrevVolume] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(279);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('all'); // 'off' | 'all' | 'one'
  const [playlistQueue, setPlaylistQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Advanced Spotify playback controls
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sleepTimer, setSleepTimer] = useState(null); // null | 15 | 30 | 45 | 60 | 'endOfTrack'
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Spotify Right Sidebar: 'nowPlaying' | 'queue' | 'lyrics' | null
  const [rightSidebarView, setRightSidebarView] = useState(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  // Audius Account & Profile State
  const [currentUser, setCurrentUser] = useState(getStoredAudiusUser);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // PWA Offline mode & downloaded music
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [downloadedTracks, setDownloadedTracks] = useState(getDownloadedTracks);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Custom User Playlists
  const [customPlaylists, setCustomPlaylists] = useState(() => {
    const saved = localStorage.getItem('soundstream_custom_playlists');
    return saved ? JSON.parse(saved) : [];
  });

  // Liked Tracks
  const [likedTracks, setLikedTracks] = useState(() => {
    const saved = localStorage.getItem('soundstream_liked_tracks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default top 4 hits
    return VERIFIED_AUDIUS_TRACKS.slice(0, 4);
  });

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const shouldAutoPlayRef = useRef(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Save liked tracks
  useEffect(() => {
    localStorage.setItem('soundstream_liked_tracks', JSON.stringify(likedTracks));
  }, [likedTracks]);

  // Save custom playlists
  useEffect(() => {
    localStorage.setItem('soundstream_custom_playlists', JSON.stringify(customPlaylists));
  }, [customPlaylists]);

  // Save volume
  useEffect(() => {
    localStorage.setItem('soundstream_volume', String(volume));
  }, [volume]);

  // Initialize playlist queue with Top Hits & sidebar playlists
  useEffect(() => {
    let isMounted = true;
    getTrendingTracks('', 20).then((tracks) => {
      if (isMounted && tracks && tracks.length > 0) {
        setPlaylistQueue(tracks);
      }
    });

    getTrendingPlaylists(8).then((pls) => {
      if (isMounted && pls && pls.length > 0) {
        setSidebarPlaylists(pls);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Online / Offline, Auth & PWA Lifecycle Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Đã kết nối Internet trở lại 🟢');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Đã chuyển sang Chế độ Ngoại Tuyến (Offline Mode) ⚡');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleDownloadChange = () => {
      setDownloadedTracks(getDownloadedTracks());
    };
    window.addEventListener('soundstream_download_change', handleDownloadChange);

    const handleAuthChange = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
        if (e.detail.id && e.detail.id !== 'guest') {
          fetchUserPlaylists(e.detail.id).then((pls) => {
            if (pls && pls.length > 0) {
              setSidebarPlaylists((prev) => [...pls, ...prev.filter((p) => !pls.some((x) => x.id === p.id))]);
            }
          });
        }
      }
    };
    window.addEventListener('soundstream_auth_change', handleAuthChange);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('soundstream_download_change', handleDownloadChange);
      window.removeEventListener('soundstream_auth_change', handleAuthChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const currentTrack = playlistQueue[currentTrackIndex] || VERIFIED_AUDIUS_TRACKS[0];

  const isCurrentTrackDownloaded = isTrackDownloaded(currentTrack?.id || currentTrack?.audiusId);

  const handleToggleDownloadTrack = async (trackToDownload) => {
    const target = trackToDownload || currentTrack;
    if (!target) return;
    const downloaded = isTrackDownloaded(target.id || target.audiusId);
    if (downloaded) {
      await removeTrackOffline(target.id || target.audiusId);
      showToast(`Đã xóa "${target.title}" khỏi kho nhạc ngoại tuyến`);
    } else {
      showToast(`Đang tải "${target.title}" về máy...`);
      try {
        await downloadTrackOffline(target);
        showToast(`Đã tải xong "${target.title}"! Nghe ngoại tuyến không cần mạng ⚡`);
      } catch (err) {
        showToast(`Không thể tải bài hát "${target.title}". Vui lòng thử lại!`);
      }
    }
  };

  const handleInstallApp = async () => {
    if (!installPrompt) {
      showToast('SoundStream đã sẵn sàng chạy dưới dạng ứng dụng PWA!');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Cài đặt SoundStream PWA thành công 🎉');
      setInstallPrompt(null);
    }
  };

  const isCurrentTrackLiked = likedTracks.some(
    (t) => t.id === currentTrack?.id || t.title === currentTrack?.title
  );

  const toggleLikeCurrentTrack = (trackToToggle) => {
    const target = trackToToggle || currentTrack;
    if (!target) return;
    const exists = likedTracks.some((t) => t.id === target.id || t.title === target.title);
    if (exists) {
      setLikedTracks(likedTracks.filter((t) => t.id !== target.id && t.title !== target.title));
      showToast(`Đã xóa "${target.title}" khỏi Bài hát đã thích`);
    } else {
      setLikedTracks([target, ...likedTracks]);
      showToast(`Đã thêm "${target.title}" vào Bài hát đã thích ❤️`);
    }
  };

  const handleCreatePlaylist = () => {
    const newId = 'custom-' + Date.now();
    const count = customPlaylists.length + 1;
    const newPl = {
      id: newId,
      name: `Danh sách phát của tôi #${count}`,
      description: 'Tạo bởi bạn trên SoundStream',
      trackCount: 0,
      user: { name: currentUser?.name || 'Bạn', handle: currentUser?.handle || 'user' },
      artwork: {
        url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
        mirrors: []
      }
    };
    const updated = [newPl, ...customPlaylists];
    setCustomPlaylists(updated);
    setSelectedPlaylistId(newId);
    setCurrentTab('playlist');
    showToast(`Đã tạo "${newPl.name}"!`);
  };

  const handleSelectArtist = (artId) => {
    setSelectedArtistId(artId);
    setCurrentTab('artist');
    setShowTopSearchDropdown(false);
  };

  // Live top search bar suggestions (matching Vietnamese artists & full-length songs)
  useEffect(() => {
    const q = topSearchQuery.trim();
    if (!q) {
      setTopMatchedArtists(VIETNAMESE_ARTISTS.slice(0, 6));
      setTopMatchedTracks(VERIFIED_AUDIUS_TRACKS.slice(0, 5));
      return;
    }
    const arts = searchArtists(q, 6);
    setTopMatchedArtists(arts);
    let isCancelled = false;
    searchArtistsAsync(q, 6).then((liveArts) => {
      if (!isCancelled && Array.isArray(liveArts) && liveArts.length > 0) {
        setTopMatchedArtists(liveArts);
      }
    });
    searchTracks(q, 6).then((trs) => {
      if (!isCancelled) setTopMatchedTracks(trs || []);
    });
    return () => {
      isCancelled = true;
    };
  }, [topSearchQuery]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Handle Speed Cycle: 0.75x -> 1x -> 1.25x -> 1.5x -> 2x
  const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
  const handleCycleSpeed = () => {
    const nextIdx = (SPEEDS.indexOf(playbackSpeed) + 1) % SPEEDS.length;
    const newSpeed = SPEEDS[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
    showToast(`Tốc độ phát: ${newSpeed}x`);
  };

  // Handle Sleep Timer Cycle: 15m -> 30m -> 45m -> 60m -> Hết bài -> Tắt
  const SLEEP_OPTIONS = [null, 15, 30, 45, 60, 'endOfTrack'];
  const handleCycleSleepTimer = () => {
    const nextIdx = (SLEEP_OPTIONS.indexOf(sleepTimer) + 1) % SLEEP_OPTIONS.length;
    const nextOpt = SLEEP_OPTIONS[nextIdx];
    setSleepTimer(nextOpt);
    if (!nextOpt) {
      setSleepTimeRemaining(null);
      showToast('Đã tắt hẹn giờ');
    } else if (nextOpt === 'endOfTrack') {
      setSleepTimeRemaining(null);
      showToast('Hẹn giờ: Dừng khi hết bài');
    } else {
      setSleepTimeRemaining(nextOpt * 60);
      showToast(`Hẹn giờ tắt nhạc: ${nextOpt} phút`);
    }
  };

  // Sleep Timer countdown ticker
  useEffect(() => {
    if (typeof sleepTimeRemaining !== 'number' || sleepTimeRemaining <= 0) return;
    const timer = setInterval(() => {
      setSleepTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          setSleepTimer(null);
          showToast('Đã hết thời gian hẹn giờ - Dừng phát nhạc');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepTimeRemaining]);

  // Enhanced Keyboard Shortcuts (Spotify style)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
        }
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume((v) => Math.min(100, v + 5));
        setIsMuted(false);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume((v) => Math.max(0, v - 5));
      } else if (key === 'l') {
        e.preventDefault();
        toggleLikeCurrentTrack(currentTrack);
      } else if (key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (key === 's') {
        e.preventDefault();
        handleCycleSpeed();
      } else if (key === 't') {
        e.preventDefault();
        handleCycleSleepTimer();
      } else if (key === 'k') {
        e.preventDefault();
        toggleRightSidebar('lyrics');
      } else if (key === 'q') {
        e.preventDefault();
        toggleRightSidebar('queue');
      } else if (key === '?' || key === 'h') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.code === 'Escape') {
        setShowShortcutsModal(false);
        setRightSidebarView(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, currentTrack, volume, isMuted, playbackSpeed, sleepTimer]);

  // Auto-resolve playable stream URL & auto-play when current track changes
  useEffect(() => {
    let isCancelled = false;
    if (!currentTrack || !audioRef.current) return;

    resolvePlayableAudioUrl(currentTrack, 0).then((resolvedUrl) => {
      if (isCancelled || !audioRef.current) return;
      if (resolvedUrl && audioRef.current.src !== resolvedUrl) {
        currentTrack.audioUrl = resolvedUrl;
        audioRef.current.src = resolvedUrl;
      }
      if (shouldAutoPlayRef.current || isPlaying) {
        audioRef.current
          .play()
          .then(() => {
            if (!isCancelled) setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Playback gesture required or stream error:', err);
            if (!isCancelled) setIsPlaying(false);
          });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.id, currentTrack?.title]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      shouldAutoPlayRef.current = false;
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      shouldAutoPlayRef.current = true;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(async (error) => {
          console.warn('Initial play failed, resolving fallback stream:', error);
          const fallbackUrl = await resolvePlayableAudioUrl(currentTrack, 1);
          if (fallbackUrl && audioRef.current) {
            audioRef.current.src = fallbackUrl;
            audioRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {
                shouldAutoPlayRef.current = false;
                setIsPlaying(false);
                showToast('Không thể phát bài hát này.');
              });
          } else {
            shouldAutoPlayRef.current = false;
            setIsPlaying(false);
            showToast('Không thể phát bài hát này.');
          }
        });
    }
  };

  const handlePlayTrack = (track) => {
    if (!track) return;
    track._retryCount = 0;
    shouldAutoPlayRef.current = true;
    const foundIdx = playlistQueue.findIndex(
      (t) => t.id === track.id || t.title.toLowerCase() === (track.title || '').toLowerCase()
    );

    if (foundIdx !== -1) {
      setCurrentTrackIndex(foundIdx);
    } else {
      setPlaylistQueue((prev) => [track, ...prev]);
      setCurrentTrackIndex(0);
    }

    showToast(`Đang phát: "${track.title}" - ${track.artist} 🎵`);
    resolvePlayableAudioUrl(track, 0).then((resolvedUrl) => {
      if (audioRef.current) {
        if (resolvedUrl) {
          track.audioUrl = resolvedUrl;
          audioRef.current.src = resolvedUrl;
        }
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    });
  };

  const handlePlayPlaylistAll = (tracks) => {
    if (!tracks || tracks.length === 0) return;
    tracks[0]._retryCount = 0;
    shouldAutoPlayRef.current = true;
    setPlaylistQueue(tracks);
    setCurrentTrackIndex(0);
    showToast(`Đang phát toàn bộ playlist (${tracks.length} bài hát) 🎵`);
    resolvePlayableAudioUrl(tracks[0], 0).then((resolvedUrl) => {
      if (audioRef.current) {
        if (resolvedUrl) {
          tracks[0].audioUrl = resolvedUrl;
          audioRef.current.src = resolvedUrl;
        }
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    });
  };

  const handleAudioError = (e) => {
    console.warn('Audio playback error on track:', currentTrack?.title, e);
    if (!currentTrack) return;

    currentTrack._retryCount = (currentTrack._retryCount || 0) + 1;
    if (currentTrack._retryCount <= 3) {
      resolvePlayableAudioUrl(currentTrack, currentTrack._retryCount).then((fallbackUrl) => {
        if (fallbackUrl && audioRef.current) {
          currentTrack.audioUrl = fallbackUrl;
          audioRef.current.src = fallbackUrl;
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      });
      return;
    }

    shouldAutoPlayRef.current = false;
    setIsPlaying(false);
    showToast(`Không thể phát bài "${currentTrack?.title}". Vui lòng thử lại hoặc chọn bài khác.`);
  };

  const handleNextTrack = () => {
    if (playlistQueue.length === 0) return;
    shouldAutoPlayRef.current = true;
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * playlistQueue.length);
      setCurrentTrackIndex(nextIdx);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlistQueue.length);
    }
  };

  const handlePrevTrack = () => {
    if (playlistQueue.length === 0) return;
    shouldAutoPlayRef.current = true;
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      setCurrentTime(0);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + playlistQueue.length) % playlistQueue.length);
    }
  };

  const handleRemoveFromQueue = (index) => {
    const nextQueue = playlistQueue.filter((_, i) => i !== index);
    setPlaylistQueue(nextQueue);
    showToast('Đã xóa bài hát khỏi Hàng đợi phát');
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const onAudioEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else if (repeatMode === 'all') {
      handleNextTrack();
    } else {
      if (currentTrackIndex < playlistQueue.length - 1) {
        handleNextTrack();
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handleScrubberClick = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume > 0 ? prevVolume : 75);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
  };

  const toggleRightSidebar = (view) => {
    if (rightSidebarView === view) {
      setRightSidebarView(null);
    } else {
      setRightSidebarView(view);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-surface font-body text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container h-screen w-screen overflow-hidden flex flex-col justify-between relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onAudioEnded}
        onError={handleAudioError}
        preload="auto"
      />

      {/* Main App Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Fixed (w-72) - Full Spotify Modern Library & Artist Directory */}
        <aside className="w-72 bg-surface-container-lowest z-40 flex flex-col justify-between p-3.5 shrink-0 border-r border-white/5 select-none overflow-hidden">
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {/* Logo */}
            <div
              onClick={() => setCurrentTab('home')}
              className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer group shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-on-primary text-2xl font-bold">graphic_eq</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-extrabold text-lg tracking-tight text-on-surface leading-tight">
                    SoundStream
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-primary font-bold uppercase">
                    {VIETNAMESE_ARTISTS.length} Nghệ Sĩ Việt
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreatePlaylist();
                }}
                className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-primary hover:text-black flex items-center justify-center text-on-surface-variant transition cursor-pointer"
                title="Tạo danh sách phát mới"
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>

            {/* Primary Compact Nav */}
            <nav className="grid grid-cols-3 gap-1 bg-surface-container/50 p-1 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all text-xs cursor-pointer ${
                  currentTab === 'home'
                    ? 'bg-primary text-black font-black shadow-sm'
                    : 'text-on-surface-variant hover:text-white font-semibold'
                }`}
              >
                <span className="material-symbols-outlined text-base">home</span>
                <span>Trang chủ</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('search')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all text-xs cursor-pointer ${
                  currentTab === 'search'
                    ? 'bg-primary text-black font-black shadow-sm'
                    : 'text-on-surface-variant hover:text-white font-semibold'
                }`}
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>Khám phá</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('library')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all text-xs cursor-pointer ${
                  currentTab === 'library'
                    ? 'bg-primary text-black font-black shadow-sm'
                    : 'text-on-surface-variant hover:text-white font-semibold'
                }`}
              >
                <span className="material-symbols-outlined text-base">library_music</span>
                <span>Thư viện</span>
              </button>
            </nav>

            {/* Thư Viện Nghệ Sĩ & Playlist Header + Filter Pills */}
            <div className="flex flex-col gap-2 bg-surface-container/30 rounded-2xl p-2.5 flex-1 min-h-0 border border-white/5">
              {/* Filter Tabs: Nghệ sĩ (90) | Tất cả | Playlist */}
              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  { id: 'artists', label: `Nghệ sĩ (${VIETNAMESE_ARTISTS.length})` },
                  { id: 'all', label: 'Tất cả' },
                  { id: 'playlists', label: 'Playlist' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSidebarFilter(f.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      sidebarFilter === f.id
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Quick Filter Input inside Sidebar */}
              <div className="relative shrink-0">
                <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-sm text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Tìm nhanh nghệ sĩ, playlist..."
                  className="w-full h-7 pl-8 pr-6 rounded-lg bg-surface-container-high/80 text-[11px] text-white placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary border border-white/5"
                />
                {sidebarSearch && (
                  <button
                    type="button"
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2 top-1.5 text-on-surface-variant hover:text-white cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                )}
              </div>

              {/* Scrollable Library List (Liked Songs + 90 Vietnamese Artists + Playlists) */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-0.5 no-scrollbar">
                {/* Pinned Liked Songs Item */}
                {sidebarFilter !== 'artists' && !sidebarSearch && (
                  <button
                    type="button"
                    onClick={() => setCurrentTab('liked')}
                    className={`p-2 rounded-xl transition-all text-left cursor-pointer flex items-center gap-2.5 shrink-0 ${
                      currentTab === 'liked'
                        ? 'bg-surface-container-high text-white font-bold'
                        : 'hover:bg-surface-container text-on-surface-variant hover:text-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#450af5] to-[#1ed760] flex items-center justify-center shrink-0 shadow">
                      <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        favorite
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white block truncate">Bài hát đã thích</span>
                      <span className="text-[10px] text-primary font-mono block truncate">
                        Danh sách phát • {likedTracks.length} bài
                      </span>
                    </div>
                  </button>
                )}

                {/* Vietnamese Artists Directory (All 90 Artists!) */}
                {(sidebarFilter === 'all' || sidebarFilter === 'artists') &&
                  VIETNAMESE_ARTISTS.filter((art) => {
                    if (!sidebarSearch.trim()) return true;
                    const q = removeVietnameseTones(sidebarSearch);
                    return (
                      removeVietnameseTones(art.name).includes(q) ||
                      removeVietnameseTones(art.shortName || '').includes(q) ||
                      removeVietnameseTones(art.role || '').includes(q)
                    );
                  }).map((art) => {
                    const isSelected = currentTab === 'artist' && selectedArtistId === art.id;
                    return (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => handleSelectArtist(art.id)}
                        className={`p-1.5 rounded-xl text-xs transition-all text-left cursor-pointer hover:bg-surface-container flex items-center gap-2.5 shrink-0 ${
                          isSelected
                            ? 'text-primary font-bold bg-surface-container-high shadow-sm ring-1 ring-primary/30'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ${
                            isSelected ? 'ring-primary' : 'ring-white/10'
                          }`}
                        >
                          <img src={art.avatar} alt={art.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className={`truncate font-bold ${isSelected ? 'text-primary' : 'text-white'}`}>
                              {art.name}
                            </span>
                            <span className="material-symbols-outlined text-primary text-[11px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                              verified
                            </span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant/75 block truncate">
                            Nghệ sĩ • {(art.popularHits || []).length} bài hát
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></span>
                        )}
                      </button>
                    );
                  })}

                {/* Playlists Directory */}
                {(sidebarFilter === 'all' || sidebarFilter === 'playlists') &&
                  [
                    ...(sidebarPlaylists.length > 0
                      ? sidebarPlaylists
                      : [
                          { id: 'vn-pl-1', name: 'Top Hits Việt Nam 2026', trackCount: 22 },
                          { id: 'vn-pl-2', name: 'Ký Ức V-Pop 8x/9x', trackCount: 16 },
                          { id: 'vn-pl-3', name: 'Anh Trai Say Hi & Chông Gai', trackCount: 18 },
                          { id: 'vn-pl-4', name: 'Rap Việt All-Stars', trackCount: 20 }
                        ]),
                    ...customPlaylists
                  ]
                    .filter((pl) => {
                      if (!sidebarSearch.trim()) return true;
                      return removeVietnameseTones(pl.name).includes(removeVietnameseTones(sidebarSearch));
                    })
                    .map((pl) => {
                      const isPlSelected = currentTab === 'playlist' && selectedPlaylistId === pl.id;
                      return (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlaylistId(pl.id);
                            setCurrentTab('playlist');
                          }}
                          className={`p-1.5 rounded-xl text-xs transition-colors text-left cursor-pointer hover:bg-surface-container flex items-center gap-2.5 shrink-0 ${
                            isPlSelected
                              ? 'text-primary font-bold bg-surface-container-high'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-container-high shrink-0">
                            <img
                              src={pl.artwork?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                              alt={pl.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="truncate block font-semibold text-white">{pl.name}</span>
                            <span className="text-[10px] text-on-surface-variant/75 block truncate">
                              Danh sách phát • {pl.trackCount || 15} bài
                            </span>
                          </div>
                        </button>
                      );
                    })}
              </div>
            </div>
          </div>

          {/* Bottom Desktop App CTA */}
          <div className="px-2 pt-2 shrink-0 flex items-center justify-between text-[11px] text-on-surface-variant">
            <button
              type="button"
              onClick={() => showToast(`Kho nhạc Việt: ${VIETNAMESE_ARTISTS.length} nghệ sĩ & ${VERIFIED_AUDIUS_TRACKS.length} bài hát!`)}
              className="flex items-center gap-1.5 font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-primary">verified</span>
              <span>{VIETNAMESE_ARTISTS.length} Nghệ Sĩ • {VERIFIED_AUDIUS_TRACKS.length} Bài</span>
            </button>
            <span className="font-mono text-[10px] text-primary">Hi-Fi</span>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Top Fixed Header (Spotify Modern Layout with Centered Home + Live Search Bar) */}
          <header className="h-16 bg-surface/90 backdrop-blur-xl z-30 flex items-center justify-between gap-4 px-6 shadow-[0_1px_8px_rgba(0,0,0,0.12)] border-b border-white/5 shrink-0">
            {/* Left Navigation Arrows */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (currentTab === 'artist' || currentTab === 'playlist' || currentTab === 'liked') setCurrentTab('home');
                  else if (currentTab === 'search') setCurrentTab('home');
                  else if (currentTab === 'library') setCurrentTab('search');
                }}
                className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Quay lại"
              >
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentTab === 'home') setCurrentTab('search');
                  else if (currentTab === 'search') setCurrentTab('artist');
                }}
                className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Tiếp theo"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </div>

            {/* Center: Home Button + Global Interactive Search Bar (Matching Spotify Screenshot) */}
            <div className="flex items-center gap-2.5 flex-1 max-w-xl relative">
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('home');
                  setShowTopSearchDropdown(false);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  currentTab === 'home'
                    ? 'bg-surface-container-highest text-white ring-1 ring-primary/40'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-white hover:scale-105'
                }`}
                title="Trang chủ"
              >
                <span className="material-symbols-outlined text-xl" style={currentTab === 'home' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  home
                </span>
              </button>

              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-on-surface-variant text-xl pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={topSearchQuery}
                  onFocus={() => setShowTopSearchDropdown(true)}
                  onChange={(e) => {
                    setTopSearchQuery(e.target.value);
                    setShowTopSearchDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && topSearchQuery.trim()) {
                      setSearchPageInitQuery(topSearchQuery.trim());
                      setCurrentTab('search');
                      setShowTopSearchDropdown(false);
                    }
                  }}
                  placeholder="Bạn muốn phát nội dung gì? (Tìm nghệ sĩ, bài hát Việt...)"
                  className="w-full h-10 pl-10 pr-20 rounded-full bg-surface-container-high hover:bg-surface-container-highest focus:bg-surface-container-highest text-xs sm:text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary border border-white/10 transition-all"
                />
                <div className="absolute right-3 top-2 flex items-center gap-1.5">
                  {topSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setTopSearchQuery('');
                        setSearchPageInitQuery('');
                      }}
                      className="text-on-surface-variant hover:text-white p-0.5 cursor-pointer"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                  <span className="w-px h-4 bg-white/15"></span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTopSearchDropdown(false);
                      setCurrentTab('search');
                    }}
                    className="text-on-surface-variant hover:text-primary p-0.5 cursor-pointer"
                    title="Duyệt tìm tất cả nghệ sĩ & thể loại"
                  >
                    <span className="material-symbols-outlined text-lg">travel_explore</span>
                  </button>
                </div>

                {/* Live Instant Search Dropdown (Artists + Songs) */}
                {showTopSearchDropdown && (
                  <div
                    onMouseLeave={() => setShowTopSearchDropdown(false)}
                    className="absolute left-0 right-0 top-12 rounded-2xl bg-[#181b1c] border border-white/15 shadow-2xl p-3 z-50 max-h-[75vh] overflow-y-auto flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary font-mono">
                        {topSearchQuery.trim()
                          ? `Kết quả nhanh cho "${topSearchQuery}"`
                          : 'Nghệ sĩ & Bài hát đề xuất'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTopSearchDropdown(false)}
                        className="text-xs text-on-surface-variant hover:text-white cursor-pointer"
                      >
                        Đóng
                      </button>
                    </div>

                    {/* Matched Artists Section */}
                    {topMatchedArtists.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Nghệ sĩ Việt Nam ({topMatchedArtists.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {topMatchedArtists.map((art) => (
                            <button
                              key={art.id}
                              type="button"
                              onClick={() => handleSelectArtist(art.id)}
                              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-left transition cursor-pointer group"
                            >
                              <img
                                src={art.avatar}
                                alt={art.name}
                                className="w-10 h-10 rounded-full object-cover ring-1 ring-primary/40 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-white truncate group-hover:text-primary">
                                    {art.name}
                                  </span>
                                  <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    verified
                                  </span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant block truncate">
                                  {art.role} • {(art.popularHits || []).length} bài hát
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched Songs Section */}
                    {topMatchedTracks.length > 0 && (
                      <div className="flex flex-col gap-1 border-t border-white/10 pt-2">
                        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Bài hát phát ngay ({topMatchedTracks.length})
                        </span>
                        {topMatchedTracks.map((tr) => (
                          <div
                            key={tr.id}
                            onClick={() => {
                              handlePlayTrack(tr);
                              setShowTopSearchDropdown(false);
                            }}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/10 transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <img
                                src={tr.img}
                                alt={tr.title}
                                className="w-9 h-9 rounded-lg object-cover shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate group-hover:text-primary">
                                  {tr.title}
                                </p>
                                <p className="text-[10px] text-on-surface-variant truncate">
                                  {tr.artist}
                                </p>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-primary text-xl opacity-80 group-hover:opacity-100">
                              play_circle
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* View All Results Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchPageInitQuery(topSearchQuery.trim());
                        setCurrentTab('search');
                        setShowTopSearchDropdown(false);
                      }}
                      className="w-full py-2 rounded-xl bg-primary/15 hover:bg-primary text-primary hover:text-black font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">manage_search</span>
                      <span>
                        {topSearchQuery.trim()
                          ? `Xem tất cả kết quả cho "${topSearchQuery}"`
                          : `Mở Đại Từ Điển ${VIETNAMESE_ARTISTS.length} Nghệ Sĩ Việt Nam`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Offline Mode Indicator */}
              {!isOnline && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                  <span className="material-symbols-outlined text-sm">cloud_off</span>
                  <span className="hidden sm:inline">CHẾ ĐỘ NGOẠI TUYẾN</span>
                </div>
              )}

              {/* Install PWA Button */}
              {installPrompt && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-bold text-primary border border-primary/30 transition-all cursor-pointer shadow-sm hover:scale-105"
                  title="Cài đặt SoundStream PWA về thiết bị"
                >
                  <span className="material-symbols-outlined text-base">download_for_offline</span>
                  <span>Cài đặt App</span>
                </button>
              )}

              {/* Spotify Live Streaming Badge */}
              <div className="hidden 2xl:flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono shrink-0">
                <div className="flex items-end gap-0.5 h-3">
                  <span className={`w-0.5 bg-primary h-3 ${isPlaying ? 'animate-[pulse_0.6s_infinite]' : ''}`}></span>
                  <span className={`w-0.5 bg-primary h-2 ${isPlaying ? 'animate-[pulse_0.4s_infinite]' : ''}`}></span>
                  <span className={`w-0.5 bg-primary h-3 ${isPlaying ? 'animate-[pulse_0.8s_infinite]' : ''}`}></span>
                  <span className={`w-0.5 bg-primary h-1.5 ${isPlaying ? 'animate-[pulse_0.5s_infinite]' : ''}`}></span>
                </div>
                <span>HI-FI LOSSLESS</span>
              </div>

              {/* Audius User Profile / Auth Button */}
              {currentUser?.isLoggedIn ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAccountMenu((prev) => !prev)}
                    className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-surface-container-lowest hover:bg-surface-container transition-all cursor-pointer ring-1 ring-white/10 hover:ring-primary/50 group shadow-sm"
                    title="Quản lý hồ sơ tài khoản"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center shrink-0 ring-2 ring-primary/40">
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate max-w-[100px] group-hover:text-primary transition-colors">
                          {currentUser.name}
                        </span>
                        {currentUser.isVerified && (
                          <span className="material-symbols-outlined text-primary text-[13px]">verified</span>
                        )}
                      </div>
                      <span className="text-[10px] text-primary font-mono leading-none">
                        {currentUser.authType === 'audius'
                          ? `${(currentUser.audioTokenBalance || 0).toLocaleString()} $AUDIO`
                          : 'VIP Member'}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-base">expand_more</span>
                  </button>

                  {/* Account Dropdown Menu */}
                  {showAccountMenu && (
                    <div
                      className="absolute right-0 top-11 w-56 rounded-2xl bg-[#1c1f20] border border-white/10 shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-fade-in"
                      onMouseLeave={() => setShowAccountMenu(false)}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          setShowAuthModal(true);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-base text-primary">account_circle</span>
                        <span>Hồ sơ cá nhân & Cài đặt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          setCurrentTab('liked');
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-medium text-white transition cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-base text-red-400">favorite</span>
                        <span>Bài hát đã thích ({likedTracks.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          setCurrentTab('library');
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-medium text-white transition cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-base text-secondary">library_music</span>
                        <span>Thư viện playlist</span>
                      </button>
                      <div className="h-[1px] bg-white/10 my-1"></div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          const guest = logoutAudiusAccount();
                          setCurrentUser(guest);
                          showToast('Đã đăng xuất tài khoản');
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/10 text-xs font-bold text-red-400 transition cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-black font-extrabold text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition shadow-lg shadow-primary/20 cursor-pointer"
                  title="Đăng nhập hoặc tạo hồ sơ cá nhân"
                >
                  <span className="material-symbols-outlined text-base font-black">login</span>
                  <span>Đăng Nhập</span>
                </button>
              )}
            </div>
          </header>

          {/* Main Content + Right Sidebar Split */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Main Scrollable Viewport */}
            <main className="flex-1 overflow-y-auto bg-surface relative">
              <Suspense fallback={<ViewSkeleton />}>
                {currentTab === 'home' && (
                  <SoundStreamHomeView
                    onPlayTrack={handlePlayTrack}
                    onPlayPlaylistAll={handlePlayPlaylistAll}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    currentUser={currentUser}
                    onSelectPlaylist={(plId) => {
                      setSelectedPlaylistId(plId);
                      setCurrentTab('playlist');
                    }}
                    onSelectArtist={handleSelectArtist}
                  />
                )}

                {currentTab === 'search' && (
                  <SoundStreamSearchView
                    onPlayTrack={handlePlayTrack}
                    onPlayPlaylistAll={handlePlayPlaylistAll}
                    onSelectPlaylist={(plId) => {
                      setSelectedPlaylistId(plId);
                      setCurrentTab('playlist');
                    }}
                    onSelectArtist={handleSelectArtist}
                    initialQuery={searchPageInitQuery}
                  />
                )}

                {currentTab === 'playlist' && (
                  <SoundStreamPlaylistView
                    onPlayTrack={handlePlayTrack}
                    onPlayPlaylistAll={handlePlayPlaylistAll}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    selectedPlaylistId={selectedPlaylistId}
                    onSelectPlaylist={(plId) => setSelectedPlaylistId(plId)}
                    onToggleDownloadTrack={handleToggleDownloadTrack}
                  />
                )}

                {currentTab === 'library' && (
                  <SoundStreamLibraryView
                    onPlayTrack={handlePlayTrack}
                    onPlayPlaylistAll={handlePlayPlaylistAll}
                    onSelectPlaylist={(plId) => {
                      setSelectedPlaylistId(plId);
                      setCurrentTab('playlist');
                    }}
                    downloadedTracks={downloadedTracks}
                    onToggleDownloadTrack={handleToggleDownloadTrack}
                  />
                )}

                {currentTab === 'liked' && (
                  <SoundStreamLikedSongsView
                    likedTracks={likedTracks}
                    onPlayTrack={handlePlayTrack}
                    onPlayPlaylistAll={handlePlayPlaylistAll}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    onRemoveLiked={(id) => {
                      setLikedTracks(likedTracks.filter((t) => t.id !== id));
                      showToast('Đã xóa bài hát khỏi danh sách thích');
                    }}
                  />
                )}

                {currentTab === 'artist' && (
                  <SoundStreamArtistView
                    artistId={selectedArtistId}
                    onPlayTrack={handlePlayTrack}
                    onPlayPlaylistAll={handlePlayPlaylistAll}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    likedTracks={likedTracks}
                    onToggleLikeTrack={toggleLikeCurrentTrack}
                    onToggleDownloadTrack={handleToggleDownloadTrack}
                    isTrackDownloaded={isTrackDownloaded}
                    onSelectArtist={handleSelectArtist}
                  />
                )}
              </Suspense>
            </main>

            {/* Spotify Interactive Right Sidebar (Now Playing / Queue / Lyrics) */}
            {rightSidebarView && (
              <Suspense fallback={<div className="w-80 bg-surface-container-low animate-pulse" />}>
                <SpotifyRightSidebar
                  activeView={rightSidebarView}
                  onClose={() => setRightSidebarView(null)}
                  currentTrack={currentTrack}
                  playlistQueue={playlistQueue}
                  currentTrackIndex={currentTrackIndex}
                  onPlayTrack={handlePlayTrack}
                  onRemoveFromQueue={handleRemoveFromQueue}
                  currentTime={currentTime}
                  isLiked={isCurrentTrackLiked}
                  onToggleLike={() => toggleLikeCurrentTrack(currentTrack)}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Bottom Player Bar 96px (h-24) - Full Spotify Design */}
      <footer className="h-24 bg-surface-container-low z-50 px-6 flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.4)] border-t border-white/5 shrink-0 select-none">
        {/* Left Track Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
          <div
            onClick={() => toggleRightSidebar('nowPlaying')}
            className="w-14 h-14 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center overflow-hidden shadow relative group cursor-pointer"
            title="Mở bảng thông tin bài hát"
          >
            <AudiusArtworkImage
              artwork={currentTrack?.artwork}
              src={currentTrack?.img}
              alt={currentTrack?.title}
              size="150x150"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl animate-pulse">graphic_eq</span>
              </div>
            )}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/70 rounded-full p-0.5 text-white transition-opacity">
              <span className="material-symbols-outlined text-sm">expand_less</span>
            </div>
          </div>
          <div className="flex flex-col truncate min-w-0">
            <span
              onClick={() => toggleRightSidebar('nowPlaying')}
              className="text-sm font-semibold text-on-surface truncate hover:underline cursor-pointer"
            >
              {currentTrack?.title}
            </span>
            <span
              onClick={() => {
                if (currentTrack?.artistId) {
                  handleSelectArtist(currentTrack.artistId);
                } else if (currentTrack?.artist) {
                  const artMatch = getArtistDetails(currentTrack.artist);
                  handleSelectArtist(artMatch ? artMatch.id : currentTrack.artist);
                }
              }}
              className="text-xs text-on-surface-variant truncate hover:underline hover:text-primary transition-colors cursor-pointer"
              title={`Xem danh sách bài hát riêng của ${currentTrack?.artist}`}
            >
              {currentTrack?.artist}
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleLikeCurrentTrack(currentTrack)}
            className={`transition-colors ml-2 cursor-pointer ${isCurrentTrackLiked ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            title={isCurrentTrackLiked ? 'Bỏ thích' : 'Thích bài hát'}
          >
            <span className="material-symbols-outlined text-xl" style={isCurrentTrackLiked ? { fontVariationSettings: "'FILL' 1" } : {}}>
              favorite
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleDownloadTrack(currentTrack)}
            className={`transition-colors ml-1 p-1 rounded-full hover:bg-surface-container cursor-pointer ${
              isCurrentTrackDownloaded ? 'text-primary' : 'text-on-surface-variant hover:text-white'
            }`}
            title={isCurrentTrackDownloaded ? 'Đã tải ngoại tuyến (Bấm để xóa)' : 'Tải xuống để nghe offline'}
          >
            <span className="material-symbols-outlined text-xl">
              {isCurrentTrackDownloaded ? 'offline_pin' : 'arrow_circle_down'}
            </span>
          </button>
        </div>

        {/* Center Transport Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-lg px-4">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setIsShuffle(!isShuffle);
                showToast(isShuffle ? 'Đã tắt chế độ xáo trộn' : 'Đã bật chế độ xáo trộn');
              }}
              className={`transition-colors cursor-pointer ${isShuffle ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
            >
              <span className="material-symbols-outlined text-xl">shuffle</span>
            </button>

            <button
              type="button"
              onClick={handlePrevTrack}
              className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer active:scale-90"
              title="Bài trước"
            >
              <span className="material-symbols-outlined text-2xl">skip_previous</span>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-on-surface hover:scale-105 active:scale-95 text-surface flex items-center justify-center transition-transform cursor-pointer shadow-lg hover:bg-white"
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleNextTrack}
              className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer active:scale-90"
              title="Bài tiếp theo"
            >
              <span className="material-symbols-outlined text-2xl">skip_next</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (repeatMode === 'all') {
                  setRepeatMode('one');
                  showToast('Lặp lại 1 bài hát');
                } else if (repeatMode === 'one') {
                  setRepeatMode('off');
                  showToast('Tắt chế độ lặp lại');
                } else {
                  setRepeatMode('all');
                  showToast('Lặp lại toàn bộ danh sách');
                }
              }}
              className={`transition-colors cursor-pointer relative ${
                repeatMode !== 'off' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title={`Chế độ lặp lại: ${repeatMode}`}
            >
              <span className="material-symbols-outlined text-xl">
                {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
              </span>
              {repeatMode !== 'off' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></span>
              )}
            </button>
          </div>

          {/* Interactive Progress Scrubber */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[11px] font-mono text-on-surface-variant min-w-[32px] text-right">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressBarRef}
              onClick={handleScrubberClick}
              className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer group py-0.5"
            >
              <div
                className="h-full bg-on-surface group-hover:bg-primary rounded-full transition-all relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow"></div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-on-surface-variant min-w-[32px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Volume & Spotify Controls */}
        <div className="flex items-center justify-end gap-2 w-1/4 shrink-0">
          {/* Now Playing View Button */}
          <button
            type="button"
            onClick={() => toggleRightSidebar('nowPlaying')}
            className={`transition-colors cursor-pointer p-1 rounded-md ${
              rightSidebarView === 'nowPlaying' ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Đang phát (Now Playing View)"
          >
            <span className="material-symbols-outlined text-xl">slideshow</span>
          </button>

          {/* Lyrics Button (Spotify Karaoke) */}
          <button
            type="button"
            onClick={() => toggleRightSidebar('lyrics')}
            className={`transition-colors cursor-pointer p-1 rounded-md ${
              rightSidebarView === 'lyrics' ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Lời bài hát (Lyrics)"
          >
            <span className="material-symbols-outlined text-xl">mic</span>
          </button>

          {/* Queue Button */}
          <button
            type="button"
            onClick={() => toggleRightSidebar('queue')}
            className={`transition-colors cursor-pointer p-1 rounded-md ${
              rightSidebarView === 'queue' ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Danh sách chờ (Queue)"
          >
            <span className="material-symbols-outlined text-xl">queue_music</span>
          </button>

          {/* Playback Speed Button */}
          <button
            type="button"
            onClick={handleCycleSpeed}
            className="hidden xl:inline-flex text-[11px] font-mono font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high"
            title={`Tốc độ phát: ${playbackSpeed}x (Phím tắt: S)`}
          >
            {playbackSpeed}x
          </button>

          {/* Sleep Timer Button */}
          <button
            type="button"
            onClick={handleCycleSleepTimer}
            className={`hidden xl:inline-flex transition-colors cursor-pointer p-1 rounded-md relative ${
              sleepTimer ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title={
              sleepTimer
                ? `Hẹn giờ: ${sleepTimeRemaining ? `${Math.ceil(sleepTimeRemaining / 60)}p` : 'Hết bài'}`
                : 'Hẹn giờ tắt nhạc (Phím tắt: T)'
            }
          >
            <span className="material-symbols-outlined text-xl">timer</span>
            {sleepTimer && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            )}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="hidden xl:inline-flex text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer p-1 rounded-md"
            title="Phím tắt Spotify (Phím ? hoặc H)"
          >
            <span className="material-symbols-outlined text-xl">keyboard</span>
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title={isMuted ? 'Bật âm' : 'Tắt âm'}
            >
              <span className="material-symbols-outlined text-xl">
                {isMuted || volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
              </span>
            </button>
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setVolume(Math.round(pos * 100));
                setIsMuted(false);
              }}
              className="w-20 h-1.5 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer group"
            >
              <div
                className="h-full bg-on-surface group-hover:bg-primary rounded-full transition-colors relative"
                style={{ width: isMuted ? '0%' : `${volume}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow"></div>
              </div>
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            title="Toàn màn hình"
          >
            <span className="material-symbols-outlined text-xl">open_in_full</span>
          </button>
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high max-w-md w-full rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">keyboard</span>
                <h3 className="text-lg font-bold text-on-surface">Phím Tắt Spotify</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-on-surface-variant hover:text-white p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Phát / Tạm dừng</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">Space</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Tua tới / lui 5s</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">← / →</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Tăng / Giảm âm lượng</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">↑ / ↓</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Bật / Tắt âm</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">M</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Thích bài hát</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">L</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Đổi tốc độ phát</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">S</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Hẹn giờ tắt nhạc</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">T</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Karaoke Lời bài hát</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">K</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Hàng đợi phát</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">Q</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                <span className="text-on-surface-variant">Đóng bảng phụ</span>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest font-mono font-bold text-primary">Esc</kbd>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 rounded-full bg-primary text-black font-bold text-xs hover:scale-105 transition cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Audius Web3 Account Modal (Lazy Loaded only when opened) */}
      {showAuthModal && (
        <Suspense fallback={null}>
          <AudiusAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            currentUser={currentUser}
            likedCount={likedTracks.length}
            playlistCount={customPlaylists.length + sidebarPlaylists.length}
            offlineCount={downloadedTracks.length}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              if (user.isLoggedIn) {
                showToast(`Chào mừng ${user.name} 🚀`);
              } else {
                showToast('Đã đăng xuất tài khoản.');
              }
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
