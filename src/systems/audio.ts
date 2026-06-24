/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private bgmNodes: { oscillators: OscillatorNode[]; gain: GainNode } | null = null;
  private bgmInterval: any = null;
  private bgmVolume = 0.5;
  private sfxVolume = 0.8;
  private currentBgm: string | null = null;

  public init() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      try {
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn('Failed to create AudioContext:', e);
      }
    }
  }

  private resume() {
    if (this.ctx) {
      if (this.ctx.state === 'closed') {
        this.ctx = null;
        this.init();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch((e) => {
          console.warn('Failed to resume suspended AudioContext:', e);
        });
      }
    }
  }

  public setVolumes(bgm: number, sfx: number) {
    this.bgmVolume = bgm;
    this.sfxVolume = sfx;
    if (this.bgmNodes && this.ctx && this.ctx.state !== 'closed') {
      try {
        this.bgmNodes.gain.gain.setValueAtTime(this.bgmVolume * 0.15, this.ctx.currentTime);
      } catch (e) {
        console.warn('Failed to set BGM volume:', e);
      }
    }
  }

  public playSwordHit() {
    this.init();
    this.resume();
    if (!this.ctx || this.ctx.state === 'closed') return;

    try {
      const now = this.ctx.currentTime;
      // Short white noise burst + filtered crackle
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (e) {
      console.warn('Failed to play sword hit SFX:', e);
    }
  }

  public playSpellCast(color: string = '#00ccff') {
    this.init();
    this.resume();
    if (!this.ctx || this.ctx.state === 'closed') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Determine tone based on skill style / color
      if (color === '#9933ff' || color === '#aa88ff') { // Purple - Evil spirit / Nova (Deep bass swell)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
      } else if (color === '#00cc33') { // Poison (Sizzling)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);
      } else { // Magic/Ice (High-pitch chime)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.3);
      }

      gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('Failed to play spell cast SFX:', e);
    }
  }

  public playLevelUp() {
    this.init();
    this.resume();
    if (!this.ctx || this.ctx.state === 'closed') return;

    try {
      const now = this.ctx.currentTime;
      // Ascending major chord fan-fare
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx || this.ctx.state === 'closed') return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.2, now + idx * 0.12 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + 1.0);
        } catch (e) {}
      });
    } catch (e) {
      console.warn('Failed to play level up SFX:', e);
    }
  }

  public playItemDrop() {
    this.init();
    this.resume();
    if (!this.ctx || this.ctx.state === 'closed') return;

    try {
      const now = this.ctx.currentTime;
      // Double high metallic chime
      const playChime = (time: number, freq: number) => {
        if (!this.ctx || this.ctx.state === 'closed') return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          gain.gain.setValueAtTime(this.sfxVolume * 0.18, time);
          gain.gain.exponentialRampToValueAtTime(0.005, time + 0.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(time);
          osc.stop(time + 0.3);
        } catch (e) {}
      };

      playChime(now, 1200);
      playChime(now + 0.08, 1500);
    } catch (e) {
      console.warn('Failed to play item drop SFX:', e);
    }
  }

  public playDeath() {
    this.init();
    this.resume();
    if (!this.ctx || this.ctx.state === 'closed') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(55, now + 1.0);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.1);
    } catch (e) {
      console.warn('Failed to play death SFX:', e);
    }
  }

  public startBGM(mapName: 'Lorencia' | 'Dungeon' | 'Devias') {
    this.init();
    this.resume();
    if (!this.ctx || this.ctx.state === 'closed') return;

    if (this.currentBgm === mapName) return;
    this.stopBGM();
    this.currentBgm = mapName;

    try {
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.bgmVolume * 0.15, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);

      const oscillators: OscillatorNode[] = [];
      this.bgmNodes = { oscillators, gain: masterGain };

      // Procedural Ambient Music Engine
      let notes: number[] = [];
      let speed = 2000; // time per chord / sequence in ms

      if (mapName === 'Lorencia') {
        // Warm, mysterious minor progression (A-minor, D-minor)
        notes = [220.00, 261.63, 329.63, 440.00]; // Am
        speed = 3000;
      } else if (mapName === 'Dungeon') {
        // Dark, eerie Phrygian scale
        notes = [146.83, 155.56, 196.00, 293.66]; // D-Phrygian
        speed = 4000;
      } else {
        // Ice cold, airy, high pitch Devias synth
        notes = [293.66, 349.23, 440.00, 587.33]; // Dm high
        speed = 2500;
      }

      const playAmbientChord = () => {
        if (!this.ctx || this.ctx.state === 'closed' || this.currentBgm !== mapName) return;
        try {
          const now = this.ctx.currentTime;

          // Play soft drones
          notes.forEach((freq, idx) => {
            if (!this.ctx || this.ctx.state === 'closed') return;
            try {
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();

              // Custom waveforms based on map feeling
              osc.type = mapName === 'Lorencia' ? 'sine' : mapName === 'Dungeon' ? 'triangle' : 'sine';
              
              // Add tiny detune for chorus/space effect
              osc.frequency.setValueAtTime(freq + (idx % 2 === 0 ? 1 : -1) * 1.5, now);
              
              // Fade in and out gently
              gain.gain.setValueAtTime(0, now);
              gain.gain.linearRampToValueAtTime(0.18, now + speed * 0.0004);
              gain.gain.exponentialRampToValueAtTime(0.001, now + speed * 0.001);

              osc.connect(gain);
              gain.connect(masterGain);

              osc.start(now);
              osc.stop(now + speed / 1000 + 0.5);

              // Keep reference to clean up if stopped
              oscillators.push(osc);
            } catch (e) {}
          });
        } catch (e) {
          console.warn('Failed to play ambient chord:', e);
        }
      };

      // Immediate first play
      playAmbientChord();
      this.bgmInterval = setInterval(playAmbientChord, speed);
    } catch (e) {
      console.warn('Failed to start BGM:', e);
    }
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmNodes) {
      try {
        this.bgmNodes.oscillators.forEach(o => o.stop());
      } catch (e) {}
      this.bgmNodes = null;
    }
    this.currentBgm = null;
  }
}

export const audioManager = new AudioSynthesizer();
export default audioManager;
