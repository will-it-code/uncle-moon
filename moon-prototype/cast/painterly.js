/* ============================================================================
 * cast/painterly.js — the soft Studio-Ghibli finish for the cast.
 *
 * Hand-painted feel in code: a seeded fBm grain tile overlaid on every
 * body fill (breaks up flat vector gradients), plus helpers for gentle
 * multi-stop light. Same silhouettes, same faces — only the finish
 * changes, so the characters sit inside the AI-painted world.
 *
 * Usage (inside a character's transform):
 *   grainOver(ctx, cx, cy, rx, ry, alpha)   // texture the body you just filled
 * Requires: nothing. Load before the cast files that use it.
 * ============================================================================
 */
"use strict";

function _phash(x, y) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}
function _pnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = _phash(xi, yi), b = _phash(xi + 1, yi);
  const c = _phash(xi, yi + 1), d = _phash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function _pfbm(x, y) {
  let v = 0, a = 0.5;
  for (let i = 0; i < 4; i++) {
    v += a * _pnoise(x, y);
    x = x * 2.03 + 17.3; y = y * 2.03 + 9.1; a *= 0.5;
  }
  return v;
}

let _grainTile = null;
/* A tileable-ish fBm blotch tile, centered on mid-gray so that the
 * 'overlay' blend only adds hand-painted variation, never a tint. */
function painterlyGrainTile(size) {
  size = size || 256;
  if (_grainTile) return _grainTile;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");
  const img = x.createImageData(size, size);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const n = _pfbm(i * 0.045, j * 0.045);       // soft blotches
      const n2 = _pnoise(i * 0.35, j * 0.35);        // fine tooth
      const v = 128 + (n - 0.5) * 34 + (n2 - 0.5) * 14;
      const k = (j * size + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.max(0, Math.min(255, v));
      img.data[k + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  _grainTile = c;
  return c;
}

/* Lay hand-painted grain over the ellipse you just filled. Call inside the
 * character's transform, right after the body fill. Alpha ~0.06-0.10. */
function grainOver(ctx, cx, cy, rx, ry, alpha) {
  if (alpha === undefined) alpha = 0.08;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = ctx.createPattern(painterlyGrainTile(), "repeat");
  ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  ctx.restore();
}

/* A soft three-stop radial fill: light kisses the upper-left, mid holds the
 * local color, dark pools gently at the rim. Gentler than a hard 2-stop. */
function softRadial(ctx, cx, cy, r, lx, ly, light, mid, dark) {
  const g = ctx.createRadialGradient(cx + lx, cy + ly, r * 0.08, cx, cy, r);
  const f = (c) => `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;
  g.addColorStop(0, f(light));
  g.addColorStop(0.55, f(mid));
  g.addColorStop(1, f(dark));
  return g;
}
