import React, { useState, useEffect } from 'react';

/**
 * AudiusArtworkImage with mirror retry logic as specified in audius.co/skill.md
 * Never strips mirrors; swaps host sequentially on error until one succeeds or all fail.
 */
export default function AudiusArtworkImage({
  src,
  artwork,
  alt = 'Track Artwork',
  className = '',
  size = '480x480'
}) {
  const defaultFallback = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60';
  
  // Extract initial URL
  const initialUrl = artwork?.sizes?.[size] || artwork?.url || src || defaultFallback;
  const mirrors = artwork?.mirrors || [];

  const [currentSrc, setCurrentSrc] = useState(initialUrl);
  const [mirrorIndex, setMirrorIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  useEffect(() => {
    setCurrentSrc(artwork?.sizes?.[size] || artwork?.url || src || defaultFallback);
    setMirrorIndex(0);
    setHasFailedAll(false);
  }, [src, artwork, size]);

  const handleError = () => {
    // If there are mirrors left to try
    if (mirrors && mirrorIndex < mirrors.length) {
      try {
        const urlObj = new URL(currentSrc);
        const nextMirror = mirrors[mirrorIndex];
        const mirrorHost = new URL(nextMirror).host;
        urlObj.host = mirrorHost;
        setMirrorIndex((prev) => prev + 1);
        setCurrentSrc(urlObj.toString());
      } catch (err) {
        // Direct replacement fallback
        setMirrorIndex((prev) => prev + 1);
        if (mirrors[mirrorIndex]) {
          setCurrentSrc(mirrors[mirrorIndex]);
        }
      }
    } else {
      // All mirrors exhausted: fallback to unsplash gradient
      setHasFailedAll(true);
      setCurrentSrc(defaultFallback);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
