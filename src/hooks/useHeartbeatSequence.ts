import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { BEATS, beatShape, HEARTBEAT, REVEAL_AT } from '../lib/heartbeat';
import type { AudioEngine, ExperiencePhase } from '../types';

interface SequenceOptions {
  ready: boolean;
  experienceRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  audioRef: RefObject<AudioEngine>;
}

export function useHeartbeatSequence({
  ready,
  experienceRef,
  videoRef,
  audioRef,
}: SequenceOptions) {
  const [phase, setPhase] = useState<ExperiencePhase>('loading');
  const startedRef = useRef(false);
  const frameRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (ready) setPhase((current) => current === 'loading' ? 'ready' : current);
  }, [ready]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.cancelAnimationFrame(frameRef.current);
      experienceRef.current?.style.setProperty('--pulse', '0');
    };
  }, [experienceRef]);

  const start = useCallback(() => {
    if (!ready || startedRef.current) return;
    startedRef.current = true;
    setPhase('beating');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const runSequence = async () => {
      const { context, buffers } = audioRef.current;
      if (context) {
        try {
          await Promise.race([
            context.resume(),
            new Promise<void>((resolve) => window.setTimeout(resolve, 1000)),
          ]);
        } catch (error) {
          console.warn('[LUKA] Не удалось возобновить звук:', error);
        }
      }
      if (!mountedRef.current) return;

      const audioRunning = Boolean(context && context.state === 'running');
      const clock = audioRunning && context
        ? () => context.currentTime
        : () => performance.now() / 1000;
      const startAt = clock() + HEARTBEAT.scheduleAhead;

      if (audioRunning && context) {
        try {
          const heart = buffers.heart;
          if (heart && heart.duration > HEARTBEAT.fileStart) {
            const lastBeat = Math.max(...HEARTBEAT.beatPositions);
            const endingOffset = Math.min(heart.duration, lastBeat + HEARTBEAT.tail);
            const ending = startAt + Math.max(0, endingOffset - HEARTBEAT.fileStart);
            const source = context.createBufferSource();
            const volume = context.createGain();
            source.buffer = heart;
            source.connect(volume).connect(context.destination);
            volume.gain.setValueAtTime(0.88, startAt);
            volume.gain.setValueAtTime(0.88, Math.max(startAt, ending - 0.055));
            volume.gain.linearRampToValueAtTime(0, ending);
            source.start(startAt, HEARTBEAT.fileStart);
            source.stop(ending);
          }

          const music = buffers.bg;
          if (music) {
            const source = context.createBufferSource();
            const volume = context.createGain();
            source.buffer = music;
            source.loop = true;
            volume.gain.setValueAtTime(0, startAt);
            volume.gain.linearRampToValueAtTime(0.34, startAt + REVEAL_AT + 1.8);
            source.connect(volume).connect(context.destination);
            source.start(startAt);
            audioRef.current.musicSource = source;
          }
        } catch (error) {
          console.warn('[LUKA] Ошибка аудиосцены:', error);
        }
      }

      const animate = () => {
        if (!mountedRef.current) return;
        const elapsed = clock() - startAt;
        const pulse = reducedMotion ? 0 : Math.max(...BEATS.map((beat) => beatShape(elapsed - beat)));
        experienceRef.current?.style.setProperty('--pulse', pulse.toFixed(4));

        if (elapsed >= REVEAL_AT) {
          experienceRef.current?.style.setProperty('--pulse', '0');
          setPhase('entered');
          const playback = videoRef.current?.play();
          void playback?.catch(() => undefined);
          return;
        }
        frameRef.current = window.requestAnimationFrame(animate);
      };

      frameRef.current = window.requestAnimationFrame(animate);
    };

    void runSequence();
  }, [ready, audioRef, experienceRef, videoRef]);

  return { phase, start };
}
