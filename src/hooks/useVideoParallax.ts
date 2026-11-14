import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Slight inverse cursor drift; only enabled on precise, hover-capable devices. */
export function useVideoParallax(
  driftRef: RefObject<HTMLDivElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const element = driftRef.current;
    if (!element) return;

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let frame = 0;

    const tick = () => {
      frame = 0;
      x += (targetX - x) * 0.09;
      y += (targetY - y) * 0.09;
      if (Math.abs(targetX - x) < 0.05) x = targetX;
      if (Math.abs(targetY - y) < 0.05) y = targetY;
      element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      if (x !== targetX || y !== targetY) frame = window.requestAnimationFrame(tick);
    };

    const requestTick = () => {
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const relativeX = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth - 0.5) * 2));
      const relativeY = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight - 0.5) * 2));
      targetX = -relativeX * 32;
      targetY = -relativeY * 24;
      requestTick();
    };

    const reset = () => {
      targetX = 0;
      targetY = 0;
      requestTick();
    };

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    window.addEventListener('resize', reset);

    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      window.removeEventListener('resize', reset);
      window.cancelAnimationFrame(frame);
      element.style.transform = '';
    };
  }, [active, driftRef]);
}
