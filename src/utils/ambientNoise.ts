/**
 * Pure Web Audio API synthesis for Focus Ambient Brown Noise & Transition Chime.
 * Zero external MP3 dependencies; adheres strictly to iOS Safari user-gesture audio policies.
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;
}

/**
 * Initializes or resumes the shared AudioContext inside a user gesture handler
 * (e.g., clicking Play or toggling Ambient Sound) to satisfy iOS Safari policies.
 */
export function unlockAudioContext(): AudioContext | null {
  try {
    const AudioCtx = getAudioContextClass();
    if (!AudioCtx) return null;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioCtx();
    }

    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => { });
    }

    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Generates smooth, looping Brown Noise (1/f^2 spectral density) using Web Audio API
 * with gentle low-pass warmth and click-free exponential gain ramps.
 */
export class BrownNoisePlayer {
  private sourceNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  public start(volume = 0.08): void {
    try {
      const ctx = unlockAudioContext();
      if (!ctx) return;

      if (this.isPlaying) {
        this.setVolume(volume);
        return;
      }

      // Create a 5-second seamless brown noise buffer
      const bufferDurationSeconds = 5;
      const bufferSize = ctx.sampleRate * bufferDurationSeconds;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = lastOut * 3.5; // Normalize amplitude
      }

      // Crossfade last 1024 samples with start to prevent loop boundary clicks
      const fadeSamples = Math.min(1024, Math.floor(bufferSize / 10));
      for (let i = 0; i < fadeSamples; i++) {
        const alpha = i / fadeSamples;
        const endIdx = bufferSize - fadeSamples + i;
        output[endIdx] = output[endIdx] * (1 - alpha) + output[i] * alpha;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      // Subtle low-pass filter for deep acoustic comfort
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(480, ctx.currentTime);

      const gain = ctx.createGain();
      const safeTarget = Math.max(0.001, Math.min(0.5, volume));
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(safeTarget, ctx.currentTime + 0.6);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(0);

      this.sourceNode = source;
      this.filterNode = filter;
      this.gainNode = gain;
      this.isPlaying = true;
    } catch {
      this.isPlaying = false;
    }
  }

  public setVolume(volume: number): void {
    try {
      const ctx = sharedAudioContext;
      if (!ctx || !this.gainNode || !this.isPlaying) return;
      const safeTarget = Math.max(0.0001, Math.min(0.5, volume));
      this.gainNode.gain.cancelScheduledValues(ctx.currentTime);
      this.gainNode.gain.setTargetAtTime(safeTarget, ctx.currentTime, 0.15);
    } catch {
      // Ignore audio adjustment errors
    }
  }

  public stop(): void {
    if (!this.isPlaying) return;
    const source = this.sourceNode;
    const filter = this.filterNode;
    const gain = this.gainNode;

    this.sourceNode = null;
    this.filterNode = null;
    this.gainNode = null;
    this.isPlaying = false;

    try {
      const ctx = sharedAudioContext;
      if (ctx && gain && ctx.state === 'running') {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        setTimeout(() => {
          try {
            source?.stop();
            source?.disconnect();
            filter?.disconnect();
            gain.disconnect();
          } catch {
            // Already stopped
          }
        }, 280);
      } else {
        source?.stop();
        source?.disconnect();
        filter?.disconnect();
        gain?.disconnect();
      }
    } catch {
      // Safe cleanup fallback
    }
  }

  public get active(): boolean {
    return this.isPlaying;
  }
}

/**
 * Plays a gentle, meditative two-tone sine harmonic chime on phase transitions.
 */
export function playTransitionChime(): void {
  try {
    const ctx = sharedAudioContext;
    if (!ctx || ctx.state === 'closed') return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { });
    }

    const now = ctx.currentTime;
    const frequencies = [528, 792]; // Soft harmonic fifth (C5 / G5)

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startTime = now + index * 0.18;
      const duration = 1.6;

      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.09, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  } catch {
    // Fail silently if audio is blocked by OS/browser
  }
}

