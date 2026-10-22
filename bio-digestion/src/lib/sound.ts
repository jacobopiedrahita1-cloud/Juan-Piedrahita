// Efectos sintetizados con Web Audio: sin archivos, apagados por defecto.

const KEY = 'biodigestion.sound';
let ctx: AudioContext | null = null;
let enabled = false;
try { enabled = localStorage.getItem(KEY) === 'on'; } catch { /* almacenamiento no disponible */ }

export const sound = {
  get enabled() { return enabled; },
  set(on: boolean) {
    enabled = on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* ignorar */ }
    if (on) this.play('tap');
  },
  play(kind: 'ok' | 'bad' | 'tap' | 'win') {
    if (!enabled) return;
    try {
      ctx ??= new AudioContext();
      if (ctx.state === 'suspended') void ctx.resume();
      const notes: Record<typeof kind, [number, number][]> = {
        ok: [[660, 0], [990, 0.08]],
        bad: [[220, 0], [180, 0.1]],
        tap: [[520, 0]],
        win: [[523, 0], [659, 0.1], [784, 0.2], [1046, 0.32]],
      };
      for (const [f, t] of notes[kind]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        const start = ctx.currentTime + t;
        o.type = kind === 'bad' ? 'triangle' : 'sine';
        o.frequency.setValueAtTime(f, start);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
        o.connect(g).connect(ctx.destination);
        o.start(start);
        o.stop(start + 0.25);
      }
    } catch { /* audio no disponible */ }
  },
};
