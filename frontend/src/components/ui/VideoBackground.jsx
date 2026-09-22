import { useRef, useEffect, useState } from 'react';

export function VideoBackground({ 
  src = '/videos/login-bg.mp4', 
  poster = '/videos/login-poster.jpg',
  fallbackGradient = true,
  className = '',
  video = true,
  overlayClassName = 'bg-black/30',
  gradientClassName = 'bg-[linear-gradient(135deg,var(--bg-gradient-start),var(--bg-gradient-mid),var(--bg-gradient-end))] bg-[size:400%_400%] animate-gradient-shift',
  children 
}) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.load();
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -z-10">
        <div className={`absolute inset-0 w-full h-full ${gradientClassName}`}
          aria-hidden="true"
        />
        {video && (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoReady && !videoError ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden="true"
          />
        )}
        <div className={`absolute inset-0 ${overlayClassName}`} aria-hidden="true" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}