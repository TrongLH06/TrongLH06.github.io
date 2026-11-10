import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import SoundStreamHomeView from './SoundStreamHomeView.jsx';
import AudiusArtworkImage from './AudiusArtworkImage.jsx';
import { getTrendingTracks, getTrendingPlaylists, VERIFIED_AUDIUS_TRACKS } from '../services/audius.js';
import { getStoredAudiusUser, fetchUserPlaylists } from '../services/audius_auth.js';
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
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'search' | 'playlist' | 'library' | 'liked'
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('vn-pl-1');
  const [sidebarPlaylists, setSidebarPlaylists] = useState([]);
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

  const currentTrack = playlistQueue[currentTrackIndex] || VERIFIED_AUDIUS_TRACKS[0];

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
      user: { name: 'Alex Vance', handle: 'alexvance' },
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

  // Auto-play when current track changes
  useEffect(() => {
    if (isPlaying && audioRef.current && currentTrack?.audioUrl) {
      audioRef.current.play().catch((err) => {
        console.warn('Playback gesture required:', err);
      });
    }
  }, [currentTrack?.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(true);
      });
    }
  };

  const handlePlayTrack = (track) => {
    if (!track) return;
    const foundIdx = playlistQueue.findIndex(
      (t) => t.id === track.id || t.title.toLowerCase() === (track.title || '').toLowerCase()
    );

    if (foundIdx !== -1) {
      setCurrentTrackIndex(foundIdx);
    } else {
      setPlaylistQueue((prev) => [track, ...prev]);
      setCurrentTrackIndex(0);
    }

    setIsPlaying(true);
    showToast(`Đang phát: "${track.title}" - ${track.artist} 🎵`);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }, 100);
  };

  const handlePlayPlaylistAll = (tracks) => {
    if (!tracks || tracks.length === 0) return;
    setPlaylistQueue(tracks);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
    showToast(`Đang phát toàn bộ playlist (${tracks.length} bài hát) 🎵`);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }, 100);
  };

  const handleAudioError = (e) => {
    console.warn('Audio playback error on track:', currentTrack?.title, e);
    if (currentTrack?.streamMirrors && currentTrack.streamMirrors.length > 0 && !currentTrack._triedMirror) {
      currentTrack._triedMirror = true;
      const cleanId = String(currentTrack.audiusId || currentTrack.id).replace(/^aud-/, '');
      const mirrorUrl = `${currentTrack.streamMirrors[0]}/tracks/${cleanId}/stream?app_name=SoundStream`;
      if (audioRef.current) {
        audioRef.current.src = mirrorUrl;
        audioRef.current.play().catch(() => {});
        return;
      }
    }
    showToast(`Không thể tải bài "${currentTrack?.title}". Chuyển bài tiếp theo...`);
    setTimeout(() => {
      handleNextTrack();
    }, 1200);
  };

  const handleNextTrack = () => {
    if (playlistQueue.length === 0) return;
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * playlistQueue.length);
      setCurrentTrackIndex(nextIdx);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlistQueue.length);
    }
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    if (playlistQueue.length === 0) return;
    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + playlistQueue.length) % playlistQueue.length);
      setIsPlaying(true);
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
        {/* Left Sidebar Fixed 64 (w-64) */}
        <aside className="w-64 bg-surface-container-lowest z-40 flex flex-col justify-between p-4 shrink-0 border-r border-white/5 select-none">
          <div className="flex flex-col gap-6">
            {/* Logo */}
            <div
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary text-2xl font-bold">graphic_eq</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-extrabold text-xl tracking-tight text-on-surface leading-tight">SoundStream</span>
                <span className="text-[10px] font-mono tracking-widest text-primary font-bold uppercase">Spotify Edition</span>
              </div>
            </div>

            {/* Primary Nav */}
            <nav className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all text-left cursor-pointer ${
                  currentTab === 'home'
                    ? 'bg-surface-container text-on-surface font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-semibold text-sm'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">home</span>
                <span>Trang chủ</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('search')}
                className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all text-left cursor-pointer ${
                  currentTab === 'search'
                    ? 'bg-surface-container text-on-surface font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-semibold text-sm'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">search</span>
                <span>Tìm kiếm</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('library')}
                className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all text-left cursor-pointer ${
                  currentTab === 'library'
                    ? 'bg-surface-container text-on-surface font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-semibold text-sm'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">library_music</span>
                <span>Thư viện</span>
              </button>
            </nav>

            {/* Spotify Quick Actions */}
            <div className="flex flex-col gap-1 pt-2">
              <button
                type="button"
                onClick={handleCreatePlaylist}
                className="flex items-center gap-4 px-4 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all text-sm font-medium text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">add</span>
                </div>
                <span>Tạo danh sách phát</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('liked')}
                className={`flex items-center gap-4 px-4 py-2.5 rounded-full transition-all text-sm font-medium text-left cursor-pointer ${
                  currentTab === 'liked'
                    ? 'text-on-surface bg-surface-container font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
                <div className="flex items-center justify-between flex-1">
                  <span>Bài hát đã thích</span>
                  <span className="text-[10px] font-mono text-secondary px-1.5 py-0.5 rounded-full bg-surface-container-highest">
                    {likedTracks.length}
                  </span>
                </div>
              </button>
            </div>

            <div className="h-px w-full bg-surface-container-high my-1"></div>

            {/* Playlists List */}
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-450px)]">
              <span className="px-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">
                Audius & V-Pop Playlists
              </span>
              {[
                ...(sidebarPlaylists.length > 0
                  ? sidebarPlaylists
                  : [
                      { id: 'vn-pl-1', name: 'Top Hits Việt Nam 2026' },
                      { id: 'vn-pl-2', name: 'Lo-Fi Chill & Indie Việt' },
                      { id: 'vn-pl-3', name: 'Rap Việt All-Stars' },
                      { id: 'audius-pl-1', name: 'Audius Global EDM' }
                    ]),
                ...customPlaylists
              ].map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlaylistId(pl.id);
                    setCurrentTab('playlist');
                  }}
                  className={`px-4 py-2 rounded-lg text-sm truncate transition-colors text-left cursor-pointer hover:bg-surface-container flex items-center justify-between ${
                    currentTab === 'playlist' && selectedPlaylistId === pl.id
                      ? 'text-primary font-bold bg-surface-container'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="truncate">{pl.name}</span>
                  {pl.trackCount && (
                    <span className="text-[10px] opacity-60 font-mono ml-1">
                      {pl.trackCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Desktop App CTA */}
          <div className="px-3">
            <button
              type="button"
              onClick={() => showToast('SoundStream Spotify Web Player Active!')}
              className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">hub</span>
              <span>Spotify Web Mode Active</span>
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Top Fixed Header */}
          <header className="h-16 bg-surface/80 backdrop-blur-xl z-30 flex items-center justify-between px-8 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (currentTab === 'playlist' || currentTab === 'liked') setCurrentTab('home');
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
                  else if (currentTab === 'search') setCurrentTab('playlist');
                }}
                className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Tiếp theo"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
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
              <div className="hidden md:flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
                <div className="flex items-end gap-0.5 h-3">
                  <span className={`w-0.5 bg-primary h-3 ${isPlaying ? 'animate-[pulse_0.6s_infinite]' : ''}`}></span>
                  <span className={`w-0.5 bg-primary h-2 ${isPlaying ? 'animate-[pulse_0.4s_infinite]' : ''}`}></span>
                  <span className={`w-0.5 bg-primary h-3 ${isPlaying ? 'animate-[pulse_0.8s_infinite]' : ''}`}></span>
                  <span className={`w-0.5 bg-primary h-1.5 ${isPlaying ? 'animate-[pulse_0.5s_infinite]' : ''}`}></span>
                </div>
                <span>AUDIUS & SPOTIFY LOSSLESS</span>
              </div>

              {/* Audius User Profile / Auth Button */}
              <div
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2.5 p-1 pl-2 pr-3.5 rounded-full bg-surface-container-lowest hover:bg-surface-container transition-all cursor-pointer ring-1 ring-white/5 hover:ring-primary/40 group shadow-sm"
                title="Quản lý tài khoản Audius & Web3"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center shrink-0 ring-1 ring-primary/40">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-black text-lg">person</span>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate max-w-[110px] group-hover:text-primary transition-colors">
                      {currentUser.name}
                    </span>
                    {currentUser.isVerified && (
                      <span className="material-symbols-outlined text-primary text-[13px]">verified</span>
                    )}
                  </div>
                  {currentUser.isLoggedIn ? (
                    <span className="text-[10px] text-primary font-mono leading-none">
                      {(currentUser.audioTokenBalance || 0).toLocaleString()} $AUDIO
                    </span>
                  ) : (
                    <span className="text-[10px] text-on-surface-variant font-mono leading-none">Đăng nhập Audius</span>
                  )}
                </div>
              </div>
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
                    onSelectPlaylist={(plId) => {
                      setSelectedPlaylistId(plId);
                      setCurrentTab('playlist');
                    }}
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
            <span className="text-xs text-on-surface-variant truncate hover:underline cursor-pointer">
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
        <div className="flex flex-col items-center gap-2 max-w-xl w-2/4 px-4">
          <div className="flex items-center gap-6">
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
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[240px]">
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
            className="text-[11px] font-mono font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high"
            title={`Tốc độ phát: ${playbackSpeed}x (Phím tắt: S)`}
          >
            {playbackSpeed}x
          </button>

          {/* Sleep Timer Button */}
          <button
            type="button"
            onClick={handleCycleSleepTimer}
            className={`transition-colors cursor-pointer p-1 rounded-md relative ${
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
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer p-1 rounded-md"
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
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              showToast(`Đã kết nối tài khoản Audius: ${user.name} 🚀`);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
