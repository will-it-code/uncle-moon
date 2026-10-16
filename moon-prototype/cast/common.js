/* ============================================================================
 * cast/common.js — shared drawing helpers for the Uncle Moon cast library.
 * Plain script, no build step. Pages must run p5.js in GLOBAL mode and load
 * this file before the cast files. All helpers take the p5 instance `p`
 * (pass `window` in global-mode pages).
 * ============================================================================
 */
"use strict";

/* Seeded RNG (mulberry32) — deterministic worlds, no Math.random(). */
function castMulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Vertical linear gradient helper. `stops` = [[offset, [r,g,b]], ...]. */
function castLinGrad(p, x0, y0, x1, y1, stops) {
  const ctx = p.drawingContext;
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, `rgb(${c[0]},${c[1]},${c[2]})`);
  return g;
}

/* Soft radial glow disc. */
function castRadialGlow(p, x, y, r, rgb, alpha) {
  const ctx = p.drawingContext;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0.0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
  g.addColorStop(0.55, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.45})`);
  g.addColorStop(1.0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

/* Volumetric-style exponential-decay glow (v2/v3 look). */
function castExpGlow(p, x, y, r, rgb, peak, fall) {
  const ctx = p.drawingContext;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  const STOPS = 9;
  for (let i = 0; i <= STOPS; i++) {
    const f = i / STOPS;
    const a = peak * Math.exp(-fall * f * f);
    g.addColorStop(f, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(4)})`);
  }
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
