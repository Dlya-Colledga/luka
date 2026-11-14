import { useRef } from 'react';
import type { CSSProperties } from 'react';
import Landing from './components/Landing';
import Preloader from './components/Preloader';
import { useHeartbeatSequence } from './hooks/useHeartbeatSequence';
import { useMediaPreloader } from './hooks/useMediaPreloader';
import { useVideoParallax } from './hooks/useVideoParallax';

type ExperienceStyle = CSSProperties & { '--load-progress': string };

export default function App() {
  const experienceRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);

  const { ready, progress, audioRef } = useMediaPreloader(videoRef);
  const { phase, start } = useHeartbeatSequence({
    ready,
    audioRef,
    experienceRef,
    videoRef,
  });
  const entered = phase === 'entered';

  useVideoParallax(driftRef, entered);

  return (
    <div
      ref={experienceRef}
      className={`experience${entered ? ' is-entered' : ''}`}
      style={{ '--load-progress': `${progress.toFixed(3)}%` } as ExperienceStyle}
    >
      <Preloader phase={phase} progress={progress} onStart={start} />
      <Landing active={entered} videoRef={videoRef} driftRef={driftRef} />
      <div className="reveal-flare" aria-hidden="true" />
    </div>
  );
}
