// Event-cue audio engine for Please Forward the Town.
// Original procedural synthesis via WebAudio — no samples, no libraries.
// Stable event IDs; repeated identical cues within a short window are deduped
// (also protects co-op where the same world event can arrive twice).

export type PftCue =
  | "parcel.pickup"
  | "parcel.drop"
  | "parcel.pack"
  | "piece.deploy"
  | "piece.deliver"
  | "ferry.horn"
  | "ferry.dock"
  | "ferry.ride"
  | "mail.send"
  | "mail.flag"
  | "order.open"
  | "order.strand"
  | "town.complete"
  | "ui.tick";

type Voice = {
  kind: OscillatorType | "noise";
  freq: number;
  freqEnd?: number;
  gain: number;
  attack?: number;
  decay: number;
  delay?: number;
  filter?: number;
};

const CUES: Record<PftCue, Voice[]> = {
  "parcel.pickup": [
    { kind: "sine", freq: 587, gain: 0.08, decay: 0.1 },
    { kind: "sine", freq: 740, gain: 0.06, decay: 0.14, delay: 0.05 },
  ],
  "parcel.drop": [
    { kind: "sine", freq: 740, freqEnd: 587, gain: 0.07, decay: 0.12 },
    { kind: "triangle", freq: 180, gain: 0.07, decay: 0.1 },
  ],
  "parcel.pack": [
    { kind: "noise", freq: 0, gain: 0.07, decay: 0.15, filter: 1800 },
    { kind: "noise", freq: 0, gain: 0.06, decay: 0.12, delay: 0.1, filter: 1400 },
    { kind: "sine", freq: 523, gain: 0.06, decay: 0.15, delay: 0.16 },
  ],
  "piece.deploy": [
    { kind: "triangle", freq: 220, gain: 0.1, decay: 0.2 },
    { kind: "noise", freq: 0, gain: 0.06, decay: 0.3, filter: 1000 },
    { kind: "sine", freq: 440, gain: 0.07, decay: 0.25, delay: 0.18 },
  ],
  "piece.deliver": [
    { kind: "sine", freq: 659, gain: 0.09, decay: 0.2 },
    { kind: "sine", freq: 880, gain: 0.08, decay: 0.3, delay: 0.1 },
    { kind: "sine", freq: 1108, gain: 0.06, decay: 0.4, delay: 0.22 },
  ],
  "ferry.horn": [
    { kind: "sawtooth", freq: 175, gain: 0.09, decay: 0.7, filter: 900 },
    { kind: "sawtooth", freq: 220, gain: 0.05, decay: 0.7, filter: 900 },
  ],
  "ferry.dock": [
    { kind: "sine", freq: 120, freqEnd: 80, gain: 0.12, decay: 0.25 },
    { kind: "noise", freq: 0, gain: 0.06, decay: 0.2, filter: 700 },
  ],
  "ferry.ride": [
    { kind: "noise", freq: 0, gain: 0.05, decay: 0.9, filter: 600 },
    { kind: "triangle", freq: 85, gain: 0.05, decay: 0.8 },
  ],
  "mail.send": [
    { kind: "noise", freq: 0, gain: 0.06, decay: 0.1, filter: 2400 },
    { kind: "sine", freq: 988, gain: 0.06, decay: 0.15, delay: 0.08 },
  ],
  "mail.flag": [
    { kind: "square", freq: 660, gain: 0.05, decay: 0.08 },
    { kind: "square", freq: 880, gain: 0.04, decay: 0.1, delay: 0.08 },
  ],
  "order.open": [
    { kind: "sine", freq: 523, gain: 0.06, decay: 0.12 },
    { kind: "sine", freq: 587, gain: 0.05, decay: 0.15, delay: 0.08 },
  ],
  "order.strand": [
    { kind: "sawtooth", freq: 247, freqEnd: 208, gain: 0.06, decay: 0.35 },
    { kind: "sawtooth", freq: 262, freqEnd: 220, gain: 0.05, decay: 0.35 },
  ],
  "town.complete": [
    { kind: "sine", freq: 523, gain: 0.1, decay: 0.5 },
    { kind: "sine", freq: 659, gain: 0.09, decay: 0.5, delay: 0.15 },
    { kind: "sine", freq: 784, gain: 0.09, decay: 0.6, delay: 0.3 },
    { kind: "sine", freq: 1046, gain: 0.1, decay: 0.9, delay: 0.45 },
    { kind: "sine", freq: 1318, gain: 0.08, decay: 1.1, delay: 0.6 },
  ],
  "ui.tick": [{ kind: "sine", freq: 1046, gain: 0.05, decay: 0.06 }],
};

export class PftAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private lastPlay = new Map<string, number>();

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AC = window.AudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }

  get isMuted() {
    return this.muted;
  }

  /** Play a cue. `eventId` dedupes identical world events (e.g. co-op replays). */
  play(cue: PftCue, eventId?: string) {
    const key = eventId ? `${cue}#${eventId}` : cue;
    const now = performance.now();
    const last = this.lastPlay.get(key) ?? -Infinity;
    if (now - last < 120) return; // dedupe window
    this.lastPlay.set(key, now);
    if (this.lastPlay.size > 512) this.lastPlay.clear();

    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime;
    for (const v of CUES[cue]) {
      const start = t0 + (v.delay ?? 0);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(v.gain, start + (v.attack ?? 0.01));
      g.gain.exponentialRampToValueAtTime(0.0008, start + v.decay);
      let node: AudioScheduledSourceNode;
      if (v.kind === "noise") {
        const len = Math.max(1, Math.floor(ctx.sampleRate * (v.decay + 0.05)));
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        node = src;
      } else {
        const osc = ctx.createOscillator();
        osc.type = v.kind;
        osc.frequency.setValueAtTime(v.freq, start);
        if (v.freqEnd) osc.frequency.exponentialRampToValueAtTime(v.freqEnd, start + v.decay);
        node = osc;
      }
      if (v.filter) {
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = v.filter;
        node.connect(f).connect(g);
      } else {
        node.connect(g);
      }
      g.connect(this.master);
      node.start(start);
      node.stop(start + v.decay + 0.1);
    }
  }
}

export const pftAudio = new PftAudio();
