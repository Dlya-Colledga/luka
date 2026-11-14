import type { RefObject } from 'react';
import { assetUrl } from '../lib/assets';

interface LandingProps {
  active: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  driftRef: RefObject<HTMLDivElement | null>;
}

export default function Landing({ active, videoRef, driftRef }: LandingProps) {
  return (
    <main className="main" aria-hidden={!active} inert={!active}>
      <div className="main__video-drift" ref={driftRef} aria-hidden="true">
        <video
          ref={videoRef}
          className="main__video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={assetUrl('assets/media/bg.webm')} type="video/webm" />
        </video>
      </div>
      <div className="main__shade" aria-hidden="true" />
      <div className="main__grain" aria-hidden="true" />
      <div className="main__edges" aria-hidden="true" />
      <div className="main__content">
        <h1 className="main__title">
          <span>Эта страница</span>
          <span>зарезервирована</span>
          <span>
            для <em>Госпожи Луки.</em>
          </span>
        </h1>
        <p className="subline">Её мир скоро откроется.</p>
      </div>
    </main>
  );
}
