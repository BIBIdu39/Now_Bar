/**
 * Procedural Audio Synthesizer for Timer Completion and Alerts
 * Uses Web Audio API without external file dependencies.
 */
class AudioService {
  constructor() {
    this.ctx = null;
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play a clean, Apple-like crystal bell chime
   * @param {number} volume 0.0 to 1.0
   */
  playChime(volume = 0.8) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(volume, 1.0)), now);
      masterGain.connect(ctx.destination);

      // Chime notes: C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz), C7 (2093.0Hz)
      const notes = [
        { freq: 1046.50, delay: 0.0, duration: 1.2 },
        { freq: 1318.51, delay: 0.1, duration: 1.4 },
        { freq: 1567.98, delay: 0.2, duration: 1.6 },
        { freq: 2093.00, delay: 0.32, duration: 2.0 },
      ];

      notes.forEach(({ freq, delay, duration }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        // Gentle envelope: fast attack, smooth exponential decay
        noteGain.gain.setValueAtTime(0.0001, now + delay);
        noteGain.gain.linearRampToValueAtTime(0.25, now + delay + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + delay);
        osc.stop(now + delay + duration);
      });
    } catch (err) {
      console.warn('Audio chime failed to play:', err);
    }
  }

  /**
   * Play a gentle subtle click/tap for UI feedback
   */
  playTap(volume = 0.2) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore tap errors
    }
  }
}

export const audioService = new AudioService();
