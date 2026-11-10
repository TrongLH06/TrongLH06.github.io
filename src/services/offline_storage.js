/**
 * SoundStream Offline Audio Storage Service
 * Uses Cache Storage API and localStorage to cache full-length songs for offline playback
 */

const AUDIO_CACHE_NAME = 'soundstream-offline-tracks-v1';
const STORAGE_KEY = 'soundstream_downloaded_tracks';

export function getDownloadedTracks() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse downloaded tracks from localStorage', e);
    return [];
  }
}

export function isTrackDownloaded(trackId) {
  if (!trackId) return false;
  const list = getDownloadedTracks();
  const clean = String(trackId).replace(/^aud-/, '');
  return list.some((t) => t.id === trackId || t.audiusId === clean || String(t.id).replace(/^aud-/, '') === clean);
}

export async function downloadTrackOffline(track, onProgress) {
  if (!track || !track.audioUrl) {
    throw new Error('Track audioUrl missing');
  }

  const cleanId = String(track.audiusId || track.id).replace(/^aud-/, '');
  const targetId = 'aud-' + cleanId;

  if (isTrackDownloaded(targetId)) {
    return { success: true, alreadyExists: true };
  }

  try {
    if (onProgress) onProgress(15);

    // Fetch the audio stream
    const res = await fetch(track.audioUrl, {
      mode: 'cors'
    });

    if (onProgress) onProgress(50);

    if (!res.ok) {
      throw new Error(`Failed to fetch audio stream: ${res.statusText}`);
    }

    // Clone response to store into cache
    const resClone = res.clone();
    if ('caches' in window) {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      // Cache both by direct audioUrl and synthetic offline URL
      await cache.put(track.audioUrl, resClone);
    }

    if (onProgress) onProgress(85);

    // Save metadata
    const currentList = getDownloadedTracks();
    const offlineTrack = {
      ...track,
      id: targetId,
      audiusId: cleanId,
      downloadedAt: new Date().toISOString(),
      isOfflineAvailable: true
    };

    const nextList = [offlineTrack, ...currentList.filter((t) => t.id !== targetId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));

    if (onProgress) onProgress(100);

    window.dispatchEvent(new CustomEvent('soundstream_download_change', { detail: { trackId: targetId, action: 'added' } }));
    return { success: true, track: offlineTrack };
  } catch (err) {
    console.error('Download offline track error:', err);
    throw err;
  }
}

export async function removeTrackOffline(trackId) {
  const cleanId = String(trackId).replace(/^aud-/, '');
  const targetId = 'aud-' + cleanId;
  const currentList = getDownloadedTracks();
  const targetTrack = currentList.find((t) => t.id === targetId || t.audiusId === cleanId);

  if ('caches' in window && targetTrack?.audioUrl) {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      await cache.delete(targetTrack.audioUrl);
    } catch (e) {
      console.warn('Could not remove audio from cache storage:', e);
    }
  }

  const nextList = currentList.filter((t) => t.id !== targetId && t.audiusId !== cleanId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));

  window.dispatchEvent(new CustomEvent('soundstream_download_change', { detail: { trackId: targetId, action: 'removed' } }));
  return { success: true };
}

export async function getOfflineTrackBlobUrl(audioUrl) {
  if (!('caches' in window) || !audioUrl) return null;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const cachedResponse = await cache.match(audioUrl);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.warn('Error reading from cache storage:', e);
  }
  return null;
}
