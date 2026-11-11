/**
 * Multi-Source Vietnamese Music Helper (YouTube + SoundCloud + Apple Music VN Metadata)
 * - Strictly matches track title AND artist name (never pairs results by array index)
 * - Does not treat 30-second Apple Music previewUrl as a full-length audioUrl stream
 * - Does not fabricate playCount or verification badges
 */

const YT_CACHE_KEY = 'soundstream_yt_video_cache_v2';
const ITUNES_CACHE_KEY = 'soundstream_itunes_track_cache_v2';

let ytCache = {};
let itunesCache = {};

try {
  if (typeof localStorage !== 'undefined') {
    const savedYt = localStorage.getItem(YT_CACHE_KEY);
    if (savedYt) ytCache = JSON.parse(savedYt);
    const savedIt = localStorage.getItem(ITUNES_CACHE_KEY);
    if (savedIt) itunesCache = JSON.parse(savedIt);
  }
} catch (e) {}

function saveYtCache() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(YT_CACHE_KEY, JSON.stringify(ytCache));
    }
  } catch (e) {}
}

function saveItunesCache() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ITUNES_CACHE_KEY, JSON.stringify(itunesCache));
    }
  } catch (e) {}
}

export function normalizeMusicText(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verify that a candidate result matches BOTH the target track title and artist
 */
export function isMatchingTrackAndArtist(candidateTitle, candidateArtist, targetTitle, targetArtist) {
  const cTitle = normalizeMusicText(candidateTitle);
  const cArtist = normalizeMusicText(candidateArtist);
  const tTitle = normalizeMusicText(targetTitle);
  const tArtist = normalizeMusicText(targetArtist);

  if (!cTitle || !tTitle) return false;

  const titleMatched = cTitle === tTitle || cTitle.includes(tTitle) || tTitle.includes(cTitle);
  if (!titleMatched) return false;

  if (!tArtist) return true;

  // Split artist credits (e.g. "Shiki, Obito" -> ["shiki", "obito"])
  const targetTokens = String(targetArtist)
    .split(/[,&/]|(?:\s+x\s+)|(?:\s+ft\.?\s+)|(?:\s+feat\.?\s+)/i)
    .map((p) => normalizeMusicText(p))
    .filter((p) => p.length >= 2);

  if (targetTokens.length === 0) return true;

  const combinedCandidate = `${cArtist} ${cTitle}`;
  return targetTokens.some((tok) => combinedCandidate.includes(tok));
}

const PIPED_SEARCH_APIS = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de'
];

/**
 * Resolve YouTube Video IDs that strictly match both track title and artist
 */
export async function resolveYouTubeVideoIds(track) {
  if (!track) return [];
  if (track.youtubeId) return [track.youtubeId];

  const cacheKey = `${normalizeMusicText(track.title)}__${normalizeMusicText(track.artist)}`;
  if (ytCache[cacheKey] && Array.isArray(ytCache[cacheKey]) && ytCache[cacheKey].length > 0) {
    return ytCache[cacheKey];
  }

  const queries = [
    `${track.title} ${track.artist} official audio`,
    `${track.title} ${track.artist}`
  ];

  for (const base of PIPED_SEARCH_APIS) {
    for (const q of queries) {
      try {
        const res = await fetch(
          `${base}/search?q=${encodeURIComponent(q)}&filter=videos`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const items = (data?.items || []).filter(
          (it) =>
            it?.url &&
            it.url.includes('watch?v=') &&
            (it.duration >= 60 || !it.duration) &&
            it.duration < 900 &&
            isMatchingTrackAndArtist(it.title, it.uploaderName || '', track.title, track.artist)
        );
        if (items.length > 0) {
          const ids = items
            .map((it) => {
              const m = it.url.match(/v=([a-zA-Z0-9_-]{11})/);
              return m ? m[1] : null;
            })
            .filter(Boolean)
            .slice(0, 5);

          if (ids.length > 0) {
            ytCache[cacheKey] = ids;
            saveYtCache();
            return ids;
          }
        }
      } catch (e) {}
    }
  }

  return [];
}

/**
 * Resolve Apple Music Vietnam metadata & artwork (strictly matched by title + artist).
 * Note: previewUrl is a 30-second sample and is marked with isPreview: true (not used as a full-length stream).
 */
export async function resolveAppleMusicVietnamTrack(track) {
  if (!track || !track.title) return null;
  const cacheKey = `${normalizeMusicText(track.title)}__${normalizeMusicText(track.artist)}`;
  if (itunesCache[cacheKey]) {
    return itunesCache[cacheKey];
  }

  const query = `${track.title || ''} ${track.artist || ''}`.trim();
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=VN&entity=song&limit=8`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      const matched = (data?.results || []).find((r) =>
        isMatchingTrackAndArtist(r.trackName, r.artistName, track.title, track.artist)
      );
      if (matched) {
        const result = {
          previewUrl: matched.previewUrl || null,
          isPreview: true,
          artworkUrl: matched.artworkUrl100
            ? matched.artworkUrl100.replace('100x100bb', '600x600bb')
            : null,
          trackName: matched.trackName,
          artistName: matched.artistName,
          collectionName: matched.collectionName,
          durationSeconds: matched.trackTimeMillis ? Math.round(matched.trackTimeMillis / 1000) : null
        };
        itunesCache[cacheKey] = result;
        saveItunesCache();
        return result;
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Search Vietnamese tracks from live catalog metadata, matching YouTube items by title+artist (never by index)
 * and without assigning fake playCounts or using 30s previewUrl as full-length audioUrl.
 */
export async function searchLiveVietnameseMusic(query, limit = 12) {
  if (!query || !query.trim()) return [];
  const q = query.trim();
  const results = [];

  try {
    const [ytRes, itunesRes] = await Promise.allSettled([
      fetch(`${PIPED_SEARCH_APIS[0]}/search?q=${encodeURIComponent(q)}&filter=music_songs`, {
        signal: AbortSignal.timeout(4000)
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=VN&entity=song&limit=${limit}`, {
        signal: AbortSignal.timeout(4000)
      }).then((r) => (r.ok ? r.json() : null))
    ]);

    const itunesItems = itunesRes.status === 'fulfilled' ? itunesRes.value?.results || [] : [];
    const ytItems = ytRes.status === 'fulfilled' ? ytRes.value?.items || [] : [];

    itunesItems.forEach((item, idx) => {
      if (!item.trackName || !item.artistName) return;

      // Match YouTube item strictly by normalized title & artist, NEVER by index
      const ytMatch = ytItems.find((yt) =>
        isMatchingTrackAndArtist(yt.title, yt.uploaderName || '', item.trackName, item.artistName)
      );
      const ytIdMatch = ytMatch?.url?.match(/v=([a-zA-Z0-9_-]{11})/);
      const durSec = item.trackTimeMillis
        ? Math.round(item.trackTimeMillis / 1000)
        : ytMatch?.duration || 0;
      const m = Math.floor(durSec / 60);
      const s = durSec % 60;
      const cover = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : null;

      results.push({
        id: `live-vn-${item.trackId || idx}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || `${item.trackName} - Single`,
        genre: item.primaryGenreName || 'V-Pop',
        duration: durSec > 0 ? `${m}:${s < 10 ? '0' : ''}${s}` : '0:00',
        durationSeconds: durSec,
        playCount: null,
        audioUrl: '',
        previewUrl: item.previewUrl || null,
        isPreviewOnly: true,
        youtubeId: ytIdMatch ? ytIdMatch[1] : null,
        youtubeQuery: `${item.trackName} ${item.artistName} official audio`,
        img: cover,
        artwork: { url: cover, mirrors: [] },
        isLiveResult: true
      });
    });
  } catch (e) {}

  return results.slice(0, limit);
}

let scApiPromise = null;
export function loadSoundCloudWidgetApi() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.SC && window.SC.Widget) return Promise.resolve(window.SC);
  if (scApiPromise) return scApiPromise;

  scApiPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src*="w.soundcloud.com/player/api.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.SC));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => resolve(window.SC);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return scApiPromise;
}

let ytApiPromise = null;
export function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === 'function') prevCallback();
      resolve(window.YT);
    };
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    }
  });

  return ytApiPromise;
}
