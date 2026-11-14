import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { assetUrl } from '../lib/assets';
import type { AudioEngine, SoundName } from '../types';

type Resource = SoundName | 'fonts' | 'video';

const WEIGHTS: Record<Resource, number> = {
  heart: 0.35,
  bg: 0.33,
  fonts: 0.12,
  video: 0.20,
};

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function useMediaPreloader(videoRef: RefObject<HTMLVideoElement | null>) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const audioRef = useRef<AudioEngine>({ context: null, buffers: {}, musicSource: null });

  useEffect(() => {
    let cancelled = false;
    let progressFrame = 0;
    let progressTarget = 0;
    let progressDisplayed = 0;
    let tasksCompleted = false;
    const resources: Record<Resource, number> = { heart: 0, bg: 0, fonts: 0, video: 0 };
    const controller = new AbortController();

    const AudioContextConstructor = window.AudioContext ||
      (window as WebkitAudioWindow).webkitAudioContext;
    let context: AudioContext | null = null;

    try {
      if (AudioContextConstructor) {
        context = new AudioContextConstructor({ latencyHint: 'interactive' });
      }
    } catch (error) {
      console.warn('[LUKA] AudioContext недоступен:', error);
    }

    audioRef.current = { context, buffers: {}, musicSource: null };

    function updateResource(resource: Resource, amount: number) {
      if (cancelled) return;
      resources[resource] = Math.min(1, Math.max(0, amount));
      progressTarget = (Object.keys(WEIGHTS) as Resource[]).reduce(
        (sum, key) => sum + WEIGHTS[key] * resources[key],
        0,
      ) * 100;
    }

    async function fetchBytes(path: string, resource: SoundName): Promise<ArrayBuffer> {
      const response = await fetch(assetUrl(path), {
        cache: 'force-cache',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${response.status}: ${path}`);

      const total = Number(response.headers.get('content-length')) || 0;
      const reader = response.body?.getReader();
      if (!reader) {
        const bytes = await response.arrayBuffer();
        updateResource(resource, 0.80);
        return bytes;
      }

      const chunks: Uint8Array[] = [];
      let received = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        if (total) {
          updateResource(resource, Math.min(0.80, (received / total) * 0.80));
        } else {
          updateResource(resource, Math.min(0.75, 0.1 + 0.65 * (1 - Math.exp(-received / 180000))));
        }
      }

      const data = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return data.buffer;
    }

    async function loadSound(name: SoundName, paths: string[]) {
      if (!context) {
        updateResource(name, 1);
        return;
      }

      for (const path of paths) {
        if (cancelled) break;
        try {
          const bytes = await fetchBytes(path, name);
          updateResource(name, 0.87);
          const buffer = await context.decodeAudioData(bytes.slice(0));
          if (!cancelled) audioRef.current.buffers[name] = buffer;
          break;
        } catch (error) {
          if (!cancelled) console.warn(`[LUKA] Звук ${path} не загружен:`, error);
        }
      }
      updateResource(name, 1);
    }

    async function loadFonts() {
      try {
        await document.fonts?.ready;
      } catch (error) {
        console.warn('[LUKA] Ошибка загрузки шрифта:', error);
      } finally {
        updateResource('fonts', 1);
      }
    }

    let stopVideoLoad: (() => void) | undefined;

    function loadVideo(): Promise<void> {
      return new Promise((resolve) => {
        const video = videoRef.current;
        if (!video) {
          updateResource('video', 1);
          resolve();
          return;
        }

        let settled = false;
        let timeout = 0;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          video.removeEventListener('loadeddata', finish);
          video.removeEventListener('error', finish);
          updateResource('video', 1);
          resolve();
        };

        stopVideoLoad = finish;
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          finish();
          return;
        }
        video.addEventListener('loadeddata', finish, { once: true });
        video.addEventListener('error', finish, { once: true });
        timeout = window.setTimeout(finish, 8000);
        video.load();
        void video.play().catch(() => {
          // Autoplay may be blocked; the visitor can still enter on click.
        });
      });
    }

    function loadingFrame() {
      if (cancelled) return;
      const target = tasksCompleted ? 100 : Math.min(99.7, progressTarget);
      progressDisplayed += (target - progressDisplayed) * 0.085;
      if (Math.abs(target - progressDisplayed) < 0.1) progressDisplayed = target;
      setProgress(progressDisplayed);
      if (tasksCompleted && progressDisplayed >= 99.65) {
        setProgress(100);
        setReady(true);
        return;
      }
      progressFrame = window.requestAnimationFrame(loadingFrame);
    }

    progressFrame = window.requestAnimationFrame(loadingFrame);

    void Promise.all([
      loadSound('heart', ['assets/audio/heart.mp3']),
      loadSound('bg', ['assets/audio/bg.ogg', 'assets/audio/bg.mp3']),
      loadFonts(),
      loadVideo(),
    ]).finally(() => {
      if (!cancelled) tasksCompleted = true;
    });

    // Broken or unreachable media must never lock the page forever.
    const guard = window.setTimeout(() => {
      if (!cancelled) tasksCompleted = true;
    }, 14000);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(guard);
      window.cancelAnimationFrame(progressFrame);
      stopVideoLoad?.();
      if (context && context.state !== 'closed') {
        void context.close().catch(() => undefined);
      }
    };
  }, [videoRef]);

  return { ready, progress, audioRef };
}
