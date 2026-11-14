export type ExperiencePhase = 'loading' | 'ready' | 'beating' | 'entered';

export type SoundName = 'heart' | 'bg';

export interface AudioEngine {
  context: AudioContext | null;
  buffers: Partial<Record<SoundName, AudioBuffer>>;
  musicSource: AudioBufferSourceNode | null;
}
