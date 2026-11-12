import React, { useState, useEffect } from 'react';

/**
 * Clean neutral SVG Vinyl/Disc placeholder so failed external images NEVER show another artist's album cover.
 */
const DEFAULT_VINYL_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#132a23"/>
          <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg)"/>
      <circle cx="200" cy="200" r="145" fill="#111827" stroke="#10b981" stroke-opacity="0.28" stroke-width="3"/>
      <circle cx="200" cy="200" r="115" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="2"/>
      <circle cx="200" cy="200" r="85" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2"/>
      <circle cx="200" cy="200" r="46" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-opacity="0.6" stroke-width="2"/>
      <circle cx="200" cy="200" r="14" fill="#090d16"/>
    </svg>`
  );

/**
 * AudiusArtworkImage with mirror retry logic & no-referrer CDN compatibility.
 * Supports both square track/album covers and circular artist avatars.
 * Never falls back to a random other artist's album cover.
 */
export default function AudiusArtworkImage({
  src,
  artwork,
  fallbackSrc,
  alt = 'Track Artwork',
  className = '',
  size = '480x480'
}) {
  const defaultFallback = fallbackSrc || DEFAULT_VINYL_PLACEHOLDER;
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
    } else if (currentSrc !== DEFAULT_VINYL_PLACEHOLDER) {
      setCurrentSrc(DEFAULT_VINYL_PLACEHOLDER);
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
