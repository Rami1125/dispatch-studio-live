/**
 * H. Saban Logistics Sound Engine
 * Enterprise Web Audio API synthesizer with fallback to audio files.
 * Supports:
 * - New Order Arrival chime (/sounds/new_order.mp3)
 * - Order Ready / Success chime (/sounds/success.mp3)
 * - SLA Overrun / Annoying Buzzer (/sounds/annoying_buzzer.mp3)
 * - Status Change notification ping
 */

let audioCtx: AudioContext | null = null;
let isMutedState = false;
let globalVolume = 0.85;

const MUTE_STORAGE_KEY = "saban_sound_engine_muted";
const VOLUME_STORAGE_KEY = "saban_sound_engine_volume";

// Load user preferences
if (typeof window !== "undefined") {
  try {
    const storedMute = localStorage.getItem(MUTE_STORAGE_KEY);
    if (storedMute !== null) {
      isMutedState = storedMute === "true";
    }
    const storedVol = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (storedVol !== null) {
      const v = parseFloat(storedVol);
      if (!isNaN(v) && v >= 0 && v <= 1) {
        globalVolume = v;
      }
    }
  } catch {
    /* ignore storage errors */
  }
}

type SoundListener = (muted: boolean) => void;
const listeners = new Set<SoundListener>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn(isMutedState);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeSoundMute(listener: SoundListener): () => void {
  listeners.add(listener);
  listener(isMutedState);
  return () => {
    listeners.delete(listener);
  };
}

export function isAudioMuted(): boolean {
  return isMutedState;
}

export function setAudioMuted(muted: boolean): void {
  isMutedState = muted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch {
      /* ignore */
    }
  }
  notifyListeners();
}

export function toggleAudioMute(): boolean {
  setAudioMuted(!isMutedState);
  return isMutedState;
}

export function getAudioVolume(): number {
  return globalVolume;
}

export function setAudioVolume(volume: number): void {
  globalVolume = Math.max(0, Math.min(1, volume));
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(globalVolume));
    } catch {
      /* ignore */
    }
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      // @ts-expect-error webkit audio context fallback
      window.webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// User-interaction unlocker
if (typeof window !== "undefined") {
  const unlock = () => {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("click", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

/**
 * Play audio file with automatic fallback to Web Audio API synthesizer
 */
function tryPlayAudioFile(url: string, synthFallback: () => void) {
  if (isMutedState) return;

  try {
    const audio = new Audio(url);
    audio.volume = globalVolume;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Audio file missing or blocked by browser -> run synth fallback
        synthFallback();
      });
    }
  } catch {
    synthFallback();
  }
}

/**
 * 1. New Order Arrival Chime
 * Harmonic two-tone warm chime (A4 -> C#5 -> E5)
 */
export function playNewOrderSound(): void {
  if (isMutedState) return;

  tryPlayAudioFile("/sounds/new_order.mp3", () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 440, time: 0, dur: 0.3 }, // A4
      { freq: 554.37, time: 0.12, dur: 0.35 }, // C#5
      { freq: 659.25, time: 0.24, dur: 0.55 }, // E5
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.28 * globalVolume, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  });
}

/**
 * 2. Order Ready / Success Chime
 * Bright ascending celebratory triad (C5 -> E5 -> G5 -> C6)
 */
export function playSuccessSound(): void {
  if (isMutedState) return;

  tryPlayAudioFile("/sounds/success.mp3", () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3 * globalVolume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  });
}

/**
 * 3. SLA Overrun Annoying Warning Buzzer
 * High-intensity dual-tone pulsing industrial buzzer
 */
export function playAlarmSound(): void {
  if (isMutedState) return;

  tryPlayAudioFile("/sounds/annoying_buzzer.mp3", () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // 3 sharp urgent pulses
    for (let pulse = 0; pulse < 3; pulse++) {
      const pulseStart = now + pulse * 0.22;

      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(pulse % 2 === 0 ? 780 : 880, pulseStart);

      gain1.gain.setValueAtTime(0.35 * globalVolume, pulseStart);
      gain1.gain.exponentialRampToValueAtTime(0.01, pulseStart + 0.16);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(pulseStart);
      osc1.stop(pulseStart + 0.18);

      // Sub-harmonic tone for industrial weight
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(390, pulseStart);

      gain2.gain.setValueAtTime(0.18 * globalVolume, pulseStart);
      gain2.gain.exponentialRampToValueAtTime(0.01, pulseStart + 0.16);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(pulseStart);
      osc2.stop(pulseStart + 0.18);
    }
  });
}

/**
 * 4. Gentle Status Update Ping
 */
export function playStatusChime(): void {
  if (isMutedState) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08); // D6

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2 * globalVolume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}
