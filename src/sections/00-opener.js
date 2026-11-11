// B01: one dot per runner. 45.500 at JAKIM 2026, then sorted next to JRF 2026's 37.000.
import { scrolly, dur } from '../lib/scrolly.js';
import { fmt } from '../lib/data.js';

export function init(root, data) {
  const jakim = data.get('jakim', 2026).runners; // 45500
  const jrf = data.get('jrf', 2026).runners; // 37000
  const N = jakim + jrf;
  const canvas = root.querySelector('canvas');
  const label = root.querySelector('.dots-label');
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const cone = css.getPropertyValue('--cone').trim();
  const fajar = css.getPropertyValue('--fajar').trim();

  let W, H, dpr, size;
  const from = new Float32Array(N * 3); // x, y, alpha
  const to = new Float32Array(N * 3);
  const cur = new Float32Array(N * 3);
  const seed = new Float32Array(N * 2).map(() => Math.random());
  let mode = 'field';
  let t0 = 0;
  let T = 1;

  function layout(m) {
    const out = new Float32Array(N * 3);
    if (m === 'field') {
      for (let i = 0; i < N; i++) {
        out[i * 3] = seed[i * 2] * W;
        out[i * 3 + 1] = seed[i * 2 + 1] * H;
        out[i * 3 + 2] = i < jakim ? 0.85 : 0;
      }
    } else {
      // two columns, JAKIM left, JRF right, filled bottom-up so heights compare
      const colW = Math.min(W * 0.3, 260);
      const gap = Math.min(W * 0.08, 60);
      const left = W / 2 - gap / 2 - colW;
      const bottom = H * 0.86;
      const cols = Math.floor(colW / size);
      for (let i = 0; i < N; i++) {
        const j = i < jakim ? i : i - jakim;
        const x0 = i < jakim ? left : W / 2 + gap / 2;
        out[i * 3] = x0 + (j % cols) * size;
        out[i * 3 + 1] = bottom - Math.floor(j / cols) * size;
        out[i * 3 + 2] = 0.9;
      }
    }
    return out;
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // dot pitch so 45.500 fit in a column of about 0.3W x 0.7H
    const colW = Math.min(W * 0.3, 260);
    size = Math.max(1, Math.sqrt((colW * H * 0.7) / jakim));
    const l = layout(mode);
    to.set(l);
    cur.set(l);
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const s = Math.max(1, size * 0.8);
    for (let k = 0; k < 2; k++) {
      ctx.fillStyle = k === 0 ? cone : fajar;
      const a = k === 0 ? 0 : jakim;
      const b = k === 0 ? jakim : N;
      for (let i = a; i < b; i++) {
        const al = cur[i * 3 + 2];
        if (al < 0.02) continue;
        ctx.globalAlpha = al;
        ctx.fillRect(cur[i * 3], cur[i * 3 + 1], s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    const p = Math.min(1, (now - t0) / T);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    for (let i = 0; i < N; i++) {
      // stagger a little so the field pours rather than jumps
      const st = Math.min(1, Math.max(0, e * 1.25 - seed[i * 2] * 0.25));
      for (let c = 0; c < 3; c++) cur[i * 3 + c] = from[i * 3 + c] + (to[i * 3 + c] - from[i * 3 + c]) * st;
    }
    draw();
    if (p < 1) requestAnimationFrame(tick);
  }

  function go(m) {
    if (m === mode) return;
    mode = m;
    from.set(cur);
    to.set(layout(m));
    T = dur(1600);
    if (!T) {
      cur.set(to);
      draw();
    } else {
      t0 = performance.now();
      requestAnimationFrame(tick);
    }
    label.innerHTML =
      m === 'field'
        ? `<b>${fmt(jakim)}</b> pelari, satu titik satu orang`
        : `<span class="k-cone">JAKIM ${fmt(jakim)}</span><span class="k-fajar">JRF ${fmt(jrf)}</span>`;
    label.classList.toggle('split', m === 'split');
  }

  resize();
  label.innerHTML = `<b>${fmt(jakim)}</b> pelari, satu titik satu orang`;
  window.addEventListener('resize', resize);
  scrolly(root, { onStep: (s) => go(s === 'split' ? 'split' : 'field') });
}
