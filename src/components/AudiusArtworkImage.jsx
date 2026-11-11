import React, { useState, useEffect } from 'react';

/**
 * AudiusArtworkImage with mirror retry logic & no-referrer CDN compatibility.
 * Supports both square track/album covers and circular artist avatars.
 */
const VERIFIED_FALLBACK_COVERS = [
  'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e3/0b/38/e30b383e-5818-321a-7626-557b7b0f8ba3/24UMGIM61359.rgb.jpg/600x600bb.jpg',
  'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8e/bb/ff/8ebbff69-0b36-118d-6dab-d2b3a9c3d677/602448945051_Cover.jpg/600x600bb.jpg',
  'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/c2/7e/23/c27e23b0-9730-b12a-3800-61b4c22462de/artwork.jpg/600x600bb.jpg',
  'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/25/53/6d/25536d14-c747-c636-97a9-a0add507eece/197188197605.jpg/600x600bb.jpg'
];

export default function AudiusArtworkImage({
  src,
  artwork,
  alt = 'Track Artwork',
  className = '',
  size = '480x480'
}) {
  const hashIndex = alt ? Math.abs(alt.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % VERIFIED_FALLBACK_COVERS.length : 0;
  const defaultFallback = VERIFIED_FALLBACK_COVERS[hashIndex];

  const initialUrl = artwork?.sizes?.[size] || artwork?.url || src || defaultFallback;
  const mirrors = artwork?.mirrors || [];

  const [currentSrc, setCurrentSrc] = useState(initialUrl);
  const [mirrorIndex, setMirrorIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  useEffect(() => {
    setCurrentSrc(artwork?.sizes?.[size] || artwork?.url || src || defaultFallback);
    setMirrorIndex(0);
    setHasFailedAll(false);
  }, [src, artwork, size, defaultFallback]);

  const handleError = () => {
    if (mirrors && mirrorIndex < mirrors.length) {
      try {
        const urlObj = new URL(currentSrc);
        const nextMirror = mirrors[mirrorIndex];
        const mirrorHost = new URL(nextMirror).host;
        urlObj.host = mirrorHost;
        setMirrorIndex((prev) => prev + 1);
        setCurrentSrc(urlObj.toString());
        return;
      } catch (err) {
        setMirrorIndex((prev) => prev + 1);
        if (mirrors[mirrorIndex]) {
          setCurrentSrc(mirrors[mirrorIndex]);
          return;
        }
      }
    }
    if (!hasFailedAll && currentSrc !== defaultFallback) {
      setHasFailedAll(true);
      setCurrentSrc(defaultFallback);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      referrerPolicy="no-referrer"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
