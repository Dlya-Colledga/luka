export type ExperiencePhase = 'loading' | 'ready' | 'beating' | 'entered';

export type SoundName = 'heart' | 'start' | 'loop';

export interface AudioEngine {
  context: AudioContext | null;
  buffers: Partial<Record<SoundName, AudioBuffer>>;
}
