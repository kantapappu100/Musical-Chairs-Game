/**
 * Web Audio API procedural sound and music synthesizer for Musical Chairs.
 * Generates an upbeat disco/funk rhythm during the 30s countdown,
 * sudden cutoff, loud brass horn honk, sit-down chimes, elimination sad trombone,
 * and celebratory victory fanfares.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMusicPlaying = false;
  private musicInterval: number | null = null;
  private step = 0;
  private tempo = 126; // BPM
  private soundEnabled = true;
  private musicEnabled = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled && this.isMusicPlaying) {
      this.stopMusic();
    }
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  /**
   * Starts playing procedural upbeat dance music
   */
  public startMusic() {
    if (!this.musicEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.step = 0;

    const stepDurationMs = (60 / this.tempo / 4) * 1000; // 16th notes
    this.musicInterval = window.setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx) return;
      this.playStep(this.step);
      this.step = (this.step + 1) % 16;
    }, stepDurationMs);
  }

  /**
   * Stops music immediately (e.g., when 30s timer reaches 0)
   */
  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public isPlaying(): boolean {
    return this.isMusicPlaying;
  }

  private playStep(step: number) {
    if (!this.ctx || !this.musicEnabled) return;
    const now = this.ctx.currentTime;

    // Drum beat: 4-on-the-floor kick
    if (step % 4 === 0) {
      this.triggerKick(now);
    }

    // Snare on 4 and 12
    if (step === 4 || step === 12) {
      this.triggerSnare(now);
    }

    // Hi-hat on every off-beat 16th
    if (step % 2 === 1) {
      this.triggerHiHat(now, step % 4 === 2);
    }

    // Bassline notes (groovy funk in A minor / D minor)
    const bassScale = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 123.47];
    if (step % 2 === 0) {
      const noteIdx = Math.floor(step / 2) % bassScale.length;
      this.triggerBass(now, bassScale[noteIdx]);
    }

    // Arpeggiated cheerful chords (synth bells)
    const melodyPattern = [
      440, 523.25, 659.25, 523.25,
      587.33, 659.25, 698.46, 659.25,
      523.25, 440, 523.25, 659.25,
      783.99, 659.25, 587.33, 523.25
    ];
    if (step % 2 === 0 || step % 3 === 0) {
      this.triggerSynthLead(now, melodyPattern[step]);
    }
  }

  private triggerKick(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  private triggerSnare(time: number) {
    if (!this.ctx) return;
    // Tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
    oscGain.gain.setValueAtTime(0.2, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(time);
  }

  private triggerHiHat(time: number, accent: boolean) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();
    const vol = accent ? 0.12 : 0.06;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(time);
  }

  private triggerBass(time: number, freq: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.15);

    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.18);
  }

  private triggerSynthLead(time: number, freq: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  /**
   * Sound the loud horn signal (Requirement 4)
   * Loud brass car horn / air horn double blast: HONK! HONK!
   */
  public playHorn() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Play two rapid horn blasts
    this.blastHorn(now, 0.28);
    this.blastHorn(now + 0.32, 0.45);
  }

  private blastHorn(startTime: number, duration: number) {
    if (!this.ctx) return;

    // Dual detuned saw waves for thick loud brass horn tone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Typical party / car air horn frequency ~ 349Hz (F4) + 440Hz (A4)
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(349, startTime);
    osc1.frequency.linearRampToValueAtTime(340, startTime + duration);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(440, startTime);
    osc2.frequency.linearRampToValueAtTime(430, startTime + duration);

    osc3.type = 'square';
    osc3.frequency.setValueAtTime(220, startTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.Q.value = 2.5;

    // Punchy envelope
    gain.gain.setValueAtTime(0.0, startTime);
    gain.gain.linearRampToValueAtTime(0.48, startTime + 0.02);
    gain.gain.setValueAtTime(0.45, startTime + duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
    osc3.stop(startTime + duration);
  }

  /**
   * Sound when player safely sits on a chair
   */
  public playChairSit() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Sound when a player is eliminated (sad comical slide)
   */
  public playElimination() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Sad trombone slide
    osc.frequency.setValueAtTime(293.66, now); // D4
    osc.frequency.setValueAtTime(277.18, now + 0.2); // C#4
    osc.frequency.setValueAtTime(261.63, now + 0.4); // C4
    osc.frequency.linearRampToValueAtTime(196, now + 0.85); // G3 slide

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  /**
   * Sound when round is successfully prepared
   */
  public playRoundStart() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25]; // G4, C5, E5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const time = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + 0.2);
    });
  }

  /**
   * Celebratory victory music & fanfare when the winner is declared
   */
  public playVictoryFanfare() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Triumphant brass melody: C5, C5, C5, E5, D5, E5, G5, High C6
    const melody = [
      { freq: 523.25, start: 0.0, dur: 0.14 },
      { freq: 523.25, start: 0.14, dur: 0.14 },
      { freq: 523.25, start: 0.28, dur: 0.14 },
      { freq: 659.25, start: 0.44, dur: 0.38 },
      { freq: 587.33, start: 0.84, dur: 0.18 },
      { freq: 659.25, start: 1.04, dur: 0.18 },
      { freq: 783.99, start: 1.24, dur: 0.32 },
      { freq: 1046.5, start: 1.58, dur: 1.4 }, // High C6 finale
    ];

    melody.forEach(({ freq, start, dur }) => {
      const t = now + start;

      // Primary brass sawtooth
      const osc = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const osc3 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 0.5, t); // Octave below for warmth

      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(freq * 1.5, t); // Perfect fifth overtone

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, t);

      const isFinale = freq > 1000;
      const peakVol = isFinale ? 0.34 : 0.26;

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(peakVol, t + 0.02);
      gain.gain.setValueAtTime(peakVol * 0.85, t + dur - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc2.start(t);
      osc3.start(t);
      osc.stop(t + dur);
      osc2.stop(t + dur);
      osc3.stop(t + dur);
    });

    // 2. Timpani hit on the finale beat
    const finaleTime = now + 1.58;
    const timpaniOsc = this.ctx.createOscillator();
    const timpaniGain = this.ctx.createGain();
    timpaniOsc.type = 'sine';
    timpaniOsc.frequency.setValueAtTime(130.81, finaleTime);
    timpaniOsc.frequency.exponentialRampToValueAtTime(65.4, finaleTime + 0.5);

    timpaniGain.gain.setValueAtTime(0.4, finaleTime);
    timpaniGain.gain.exponentialRampToValueAtTime(0.001, finaleTime + 0.6);

    timpaniOsc.connect(timpaniGain);
    timpaniGain.connect(this.ctx.destination);
    timpaniOsc.start(finaleTime);
    timpaniOsc.stop(finaleTime + 0.6);

    // 3. Shimmer noise crash on finale
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const crashSource = this.ctx.createBufferSource();
    crashSource.buffer = buffer;

    const crashFilter = this.ctx.createBiquadFilter();
    crashFilter.type = 'highpass';
    crashFilter.frequency.value = 5000;

    const crashGain = this.ctx.createGain();
    crashGain.gain.setValueAtTime(0.18, finaleTime);
    crashGain.gain.exponentialRampToValueAtTime(0.001, finaleTime + 0.6);

    crashSource.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(this.ctx.destination);
    crashSource.start(finaleTime);
  }
}

export const soundEngine = new SoundEngine();
