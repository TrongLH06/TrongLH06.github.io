/**
 * SoundStream Audius & Spotify Account Service
 * Supports:
 * 1. Custom Local Profile (Hồ sơ người dùng cá nhân)
 * 2. Audius Protocol Web3 Authentication (Kết nối ví/handle Audius thật)
 * 3. 1-Click Vietnamese Artist Demo Accounts
 */

const APP_NAME = 'SoundStream';
const AUDIUS_API_BASE = 'https://api.audius.co/v1';
const USER_STORAGE_KEY = 'soundstream_audius_user';

export const PRESET_AVATARS = [
  {
    id: 'av-music-neon',
    name: 'DJ Neon Vibes',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-rocker',
    name: 'Urban Rocker',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-pop-star',
    name: 'Vocal Star',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-indie',
    name: 'Indie Artist',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-cyberpunk',
    name: 'Cyber Wave',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-vinyl',
    name: 'Vinyl Collector',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-vpop-king',
    name: 'V-Pop King',
    url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e3/0b/38/e30b383e-5818-321a-7626-557b7b0f8ba3/24UMGIM61359.rgb.jpg/600x600bb.jpg'
  },
  {
    id: 'av-audius-official',
    name: 'Audius Web3',
    url: 'https://audius.co/assets/TokenAUDIO-B9fxmOIn.png'
  }
];

export const DEMO_AUDIUS_ACCOUNTS = [
  {
    handle: 'sontungmtp',
    name: 'Sơn Tùng M-TP',
    role: 'V-Pop Superstar',
    bio: 'Nghệ sĩ tiên phong của âm nhạc Việt Nam hiện đại.',
    avatar: 'https://cdn-images.dzcdn.net/images/artist/736c5b8ff5a001b724fb92c7471c9f1d/500x500-000000-80-0-0.jpg',
    badge: 'V-Pop King',
    followerCount: 2540000,
    audioTokenBalance: 8880,
    isVerified: true
  },
  {
    handle: 'denvau',
    name: 'Đen Vâu',
    role: 'Nhạc sĩ & Rapper Mộc Mạc',
    bio: 'Mang chất thơ mộc mạc và câu chuyện đời thực vào âm nhạc Việt.',
    avatar: 'https://cdn-images.dzcdn.net/images/artist/f9817109258089a609fe01a4b9bd7054/500x500-000000-80-0-0.jpg',
    badge: 'Đồng Âm Việt Nam',
    followerCount: 1890000,
    audioTokenBalance: 5200,
    isVerified: true
  },
  {
    handle: 'hieuthuhai',
    name: 'HIEUTHUHAI',
    role: 'Hip-Hop / Rap & R&B Star',
    bio: 'Say Hi & Chông Gai. Âm nhạc thời thượng chinh phục thế hệ trẻ.',
    avatar: 'https://cdn-images.dzcdn.net/images/artist/731891d7627e78e25ea9e507d3fd8333/500x500-000000-80-0-0.jpg',
    badge: 'King of Say Hi',
    followerCount: 1450000,
    audioTokenBalance: 4600,
    isVerified: true
  },
  {
    handle: 'vu',
    name: 'Vũ.',
    role: 'Hoàng tử Indie Việt',
    bio: 'Những bản tình ca Indie sâu lắng chạm đến tâm hồn.',
    avatar: 'https://cdn-images.dzcdn.net/images/artist/3b39de9719ace79996aa2a893a1d42c7/500x500-000000-80-0-0.jpg',
    badge: 'Indie Legend',
    followerCount: 980000,
    audioTokenBalance: 3200,
    isVerified: true
  },
  {
    handle: 'audius',
    name: 'Audius Official',
    role: 'Open Audio Protocol',
    bio: 'The official Audius account! Creating a decentralized streaming music platform.',
    avatar: 'https://audius.co/assets/TokenAUDIO-B9fxmOIn.png',
    badge: 'Official Protocol',
    followerCount: 3820000,
    audioTokenBalance: 50000,
    isVerified: true
  },
  {
    handle: 'deadmau5',
    name: 'deadmau5',
    role: 'Electronic Music Pioneer',
    bio: 'Grammy-nominated producer and decentralized music pioneer.',
    avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80',
    badge: 'EDM Icon',
    followerCount: 2100000,
    audioTokenBalance: 12500,
    isVerified: true
  }
];

export const GUEST_USER = {
  isLoggedIn: false,
  id: 'guest',
  handle: 'guest',
  name: 'Khách',
  role: 'Khách vãng lai',
  bio: 'Tài khoản khách trên SoundStream. Đăng nhập để lưu danh sách phát và cá nhân hóa trải nghiệm âm nhạc!',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  followerCount: 0,
  followingCount: 0,
  trackCount: 0,
  playlistCount: 0,
  audioTokenBalance: 0,
  isVerified: false
};

export function getStoredAudiusUser() {
  if (typeof localStorage === 'undefined') {
    return GUEST_USER;
  }
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isLoggedIn) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading stored user', e);
  }
  return GUEST_USER;
}

export async function fetchAudiusUserProfile(handle) {
  if (!handle) throw new Error('Handle is required');
  const cleanHandle = handle.replace(/^@/, '').trim().toLowerCase();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `${AUDIUS_API_BASE}/users/handle/${cleanHandle}?app_name=${APP_NAME}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        const u = json.data;
        const pic = u.profile_picture || {};
        const avatarUrl =
          pic['480x480'] ||
          pic['150x150'] ||
          pic['1000x1000'] ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';

        const tokenBalance = Math.round(Number(u.total_audio_balance || 0));

        return {
          isLoggedIn: true,
          authType: 'audius',
          id: u.id || cleanHandle,
          handle: u.handle || cleanHandle,
          name: u.name || cleanHandle,
          role: u.is_verified ? 'Verified Audius Artist' : 'Audius Community Member',
          bio: u.bio || 'Thành viên cộng đồng âm nhạc Audius Protocol.',
          avatar: avatarUrl,
          followerCount: u.follower_count || 0,
          followingCount: u.followee_count || 0,
          trackCount: u.track_count || 0,
          playlistCount: u.playlist_count || 0,
          audioTokenBalance: tokenBalance,
          isVerified: Boolean(u.is_verified),
          wallet: u.wallet || u.erc_wallet || null
        };
      }
    }
  } catch (err) {
    console.warn(`Live Audius user fetch error for @${cleanHandle}:`, err);
  }

  // Fallback demo match or generated profile
  const demo = DEMO_AUDIUS_ACCOUNTS.find((d) => d.handle.toLowerCase() === cleanHandle);
  if (demo) {
    return {
      isLoggedIn: true,
      authType: 'audius',
      id: demo.handle,
      handle: demo.handle,
      name: demo.name,
      role: demo.role,
      bio: demo.bio,
      avatar: demo.avatar,
      followerCount: demo.followerCount || 10000,
      followingCount: 45,
      trackCount: 12,
      playlistCount: 4,
      audioTokenBalance: demo.audioTokenBalance || 1000,
      isVerified: Boolean(demo.isVerified)
    };
  }

  return {
    isLoggedIn: true,
    authType: 'audius',
    id: cleanHandle,
    handle: cleanHandle,
    name: cleanHandle.toUpperCase(),
    role: 'Audius Enthusiast',
    bio: `Thành viên @${cleanHandle} trên giao thức âm nhạc Audius.`,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    followerCount: 2450,
    followingCount: 120,
    trackCount: 5,
    playlistCount: 3,
    audioTokenBalance: 250,
    isVerified: cleanHandle === 'audius' || cleanHandle === 'deadmau5' || cleanHandle === 'sontungmtp'
  };
}

export async function fetchUserPlaylists(userId) {
  if (!userId || userId === 'guest') return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const url = `${AUDIUS_API_BASE}/users/${userId}/playlists?app_name=${APP_NAME}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data.map((pl) => {
          const art = pl.artwork || {};
          return {
            id: String(pl.id),
            name: pl.playlist_name || 'My Audius Playlist',
            description: pl.description || 'Playlist cá nhân trên Audius',
            trackCount: pl.track_count || (Array.isArray(pl.playlist_contents) ? pl.playlist_contents.length : 0),
            user: { name: pl.user?.name, handle: pl.user?.handle },
            artwork: {
              url: art['480x480'] || art['150x150'] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'
            }
          };
        });
      }
    }
  } catch (err) {
    console.warn(`User playlists fetch error for ${userId}:`, err);
  }
  return [];
}

/**
 * Đăng nhập nhanh bằng Hồ Sơ Cá Nhân (Local Profile)
 */
export function saveCustomUserProfile({ name, bio, avatar }) {
  const trimmedName = (name || '').trim() || 'Người yêu âm nhạc';
  const cleanHandle = trimmedName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');

  const profile = {
    isLoggedIn: true,
    authType: 'custom',
    id: 'user_' + Date.now(),
    handle: cleanHandle || 'musiclover',
    name: trimmedName,
    role: 'Thành viên SoundStream VIP',
    bio: (bio || '').trim() || 'Người yêu âm nhạc trực tuyến chất lượng cao.',
    avatar: avatar || PRESET_AVATARS[0].url,
    followerCount: 1,
    followingCount: 12,
    trackCount: 0,
    playlistCount: 0,
    audioTokenBalance: 100,
    isVerified: true
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('soundstream_auth_change', { detail: profile }));
  return profile;
}

/**
 * Cập nhật thông tin tài khoản hiện có
 */
export function updateStoredUserProfile(updates) {
  const current = getStoredAudiusUser();
  const updated = {
    ...current,
    ...updates,
    isLoggedIn: true
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('soundstream_auth_change', { detail: updated }));
  return updated;
}

export async function loginAudiusAccount(handle) {
  const profile = await fetchAudiusUserProfile(handle);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('soundstream_auth_change', { detail: profile }));
  return profile;
}

export function logoutAudiusAccount() {
  localStorage.removeItem(USER_STORAGE_KEY);
  const guest = GUEST_USER;
  window.dispatchEvent(new CustomEvent('soundstream_auth_change', { detail: guest }));
  return guest;
}
