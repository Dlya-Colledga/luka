import type { ExperiencePhase } from '../types';

interface PreloaderProps {
  phase: ExperiencePhase;
  progress: number;
  onStart: () => void;
}

export default function Preloader({ phase, progress, onStart }: PreloaderProps) {
  const ready = phase === 'ready';
  const leaving = phase === 'entered';

  return (
    <button
      className={`intro${phase === 'beating' ? ' is-beating' : ''}${leaving ? ' is-leaving' : ''}`}
      type="button"
      disabled={!ready}
      data-ready={ready}
      onClick={onStart}
      aria-label={ready ? 'Нажмите, чтобы продолжить' : 'Загрузка LUKA'}
      aria-hidden={leaving}
      tabIndex={ready ? 0 : -1}
    >
      <span className="word-stage" aria-hidden="true">
        <span className="word word--outline">LUKA</span>
        <span className="word word--fill">LUKA</span>
      </span>
      <span className="loader-details">
        <span className="loader-details__count" aria-hidden="true">
          {`${String(Math.min(100, Math.max(0, Math.floor(progress)))).padStart(3, '0')}%`}
        </span>
        <span className="loader-details__cta">Нажмите, чтобы продолжить</span>
      </span>
    </button>
  );
}
