/**
 * SoundStream Audius Account & Profile Authentication Service
 * Connects with Audius Protocol to load user metadata, verified badges, token balance, and playlists
 */

const APP_NAME = 'SoundStream';
const AUDIUS_API_BASE = 'https://api.audius.co/v1';
const USER_STORAGE_KEY = 'soundstream_audius_user';

export const DEMO_AUDIUS_ACCOUNTS = [
  {
    handle: 'audius',
    name: 'Audius Official',
    role: 'Open Audio Network',
    bio: 'The official Audius account! Creating a decentralized streaming music platform.',
    avatar: 'https://audius.co/assets/TokenAUDIO-B9fxmOIn.png',
    badge: 'Official Protocol'
  },
  {
    handle: 'deadmau5',
    name: 'deadmau5',
    role: 'Legendary Electronic Producer',
    bio: 'Electronic music producer and early Audius innovator.',
    avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    badge: 'Audius Icon'
  },
  {
    handle: 'sontungmtp',
    name: 'Sơn Tùng M-TP',
    role: 'V-Pop King',
    bio: 'Nghệ sĩ tiên phong của âm nhạc Việt Nam hiện đại.',
    avatar: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e3/0b/38/e30b383e-5818-321a-7626-557b7b0f8ba3/24UMGIM61359.rgb.jpg/600x600bb.jpg',
    badge: 'V-Pop Superstar'
  },
  {
    handle: 'alexvance',
    name: 'Alex Vance',
    role: 'Spotify & Audius Curator',
    bio: 'Music enthusiast exploring lossless audio and global decentralized beats.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    badge: 'SoundStream Pro'
  }
];

export function getStoredAudiusUser() {
  if (typeof localStorage === 'undefined') {
    return {
      isLoggedIn: false,
      id: 'guest',
      handle: 'alexvance',
      name: 'Alex Vance',
      role: 'SoundStream Guest',
      bio: 'Tài khoản khách trên SoundStream. Đăng nhập Audius để đồng bộ playlist cá nhân và $AUDIO token!',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      followerCount: 1420,
      followingCount: 38,
      trackCount: 0,
      playlistCount: 4,
      audioTokenBalance: 0,
      isVerified: false
    };
  }
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored user', e);
  }
  // Default guest user
  return {
    isLoggedIn: false,
    id: 'guest',
    handle: 'alexvance',
    name: 'Alex Vance',
    role: 'SoundStream Guest',
    bio: 'Tài khoản khách trên SoundStream. Đăng nhập Audius để đồng bộ playlist cá nhân và $AUDIO token!',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    followerCount: 1420,
    followingCount: 38,
    trackCount: 0,
    playlistCount: 4,
    audioTokenBalance: 0,
    isVerified: false
  };
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
  return {
    isLoggedIn: true,
    id: cleanHandle,
    handle: cleanHandle,
    name: demo ? demo.name : cleanHandle.toUpperCase(),
    role: demo ? demo.role : 'Audius Enthusiast',
    bio: demo ? demo.bio : `Thành viên @${cleanHandle} trên giao thức âm nhạc Audius.`,
    avatar: demo ? demo.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    followerCount: 2450,
    followingCount: 120,
    trackCount: 5,
    playlistCount: 3,
    audioTokenBalance: 250,
    isVerified: cleanHandle === 'audius' || cleanHandle === 'deadmau5' || cleanHandle === 'sontungmtp'
  };
}

export async function fetchUserPlaylists(userId) {
  if (!userId) return [];
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

export async function loginAudiusAccount(handle) {
  const profile = await fetchAudiusUserProfile(handle);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('soundstream_auth_change', { detail: profile }));
  return profile;
}

export function logoutAudiusAccount() {
  localStorage.removeItem(USER_STORAGE_KEY);
  const guest = getStoredAudiusUser();
  window.dispatchEvent(new CustomEvent('soundstream_auth_change', { detail: guest }));
  return guest;
}
