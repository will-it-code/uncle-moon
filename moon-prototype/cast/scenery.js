/* ============================================================================
 * cast/scenery.js — reusable storybook scenery: trees, castle, grass, flowers.
 *
 * All builders are pure functions of (t, state): deterministic, seek-exact.
 * One light direction (upper-left), atmospheric colors, calm motion only.
 * Requires cast/common.js (castRadialGlow, castMulberry32).
 * ============================================================================
 */
"use strict";

/* ------------------------------------------------------------------ tree */
function drawTree(p, x, y, scale, t, state) {
  state = Object.assign({ swayAmp: 1 }, state || {});
  const ctx = p.drawingContext;
  const sway = Math.sin(t * 0.5) * 0.012 * state.swayAmp;

  p.push();
  p.translate(x, y);
  p.scale(scale, scale);
  p.rotate(sway);

  // trunk: gently curved, dark blue-bark
  ctx.fillStyle = "rgb(44,38,70)";
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.quadraticCurveTo(-10, -70, 6, -120);
  ctx.lineTo(16, -120);
  ctx.quadraticCurveTo(2, -70, 14, 0);
  ctx.closePath(); ctx.fill();
  // branches
  ctx.strokeStyle = "rgb(44,38,70)"; ctx.lineCap = "round";
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(4, -90); ctx.quadraticCurveTo(-30, -110, -52, -140); ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(8, -100); ctx.quadraticCurveTo(34, -118, 50, -148); ctx.stroke();

  // canopy: overlapping moonlit blobs
  const blobs = [[-45,-160,52],[0,-185,62],[48,-158,50],[-20,-135,44],[28,-132,42]];
  for (const [bx, by, br] of blobs) {
    const g = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.35, br * 0.2, bx, by, br);
    g.addColorStop(0, "rgb(56,108,112)");
    g.addColorStop(1, "rgb(24,52,66)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
  }
  // moonlit top edges
  p.noFill(); p.stroke(150, 205, 205, 65); p.strokeWeight(3);
  for (const [bx, by, br] of blobs) {
    p.arc(bx, by, br * 1.72, br * 1.72, Math.PI * 1.08, Math.PI * 1.42);
  }
  p.noStroke();
  p.pop();
}

/* ---------------------------------------------------------------- castle */
function drawCastle(p, x, y, scale, t, state) {
  state = state || {};
  const ctx = p.drawingContext;
  const body = "rgb(40,48,96)";
  const roofC = "rgb(30,36,76)";

  p.push();
  p.translate(x, y);
  p.scale(scale, scale);

  // towers + keep (distant silhouette)
  ctx.fillStyle = body;
  ctx.fillRect(-95, -120, 44, 120);   // left tower
  ctx.fillRect(51, -120, 44, 120);    // right tower
  ctx.fillRect(-32, -170, 64, 170);   // center keep
  // pointed roofs
  ctx.fillStyle = roofC;
  for (const [rx, rw, ry] of [[-73, 44, -120], [73, 44, -120], [0, 64, -170]]) {
    ctx.beginPath();
    ctx.moveTo(rx - rw / 2 - 6, ry);
    ctx.lineTo(rx, ry - 54);
    ctx.lineTo(rx + rw / 2 + 6, ry);
    ctx.closePath(); ctx.fill();
  }
  // crenellations
  ctx.fillStyle = body;
  for (let cx = -95; cx < -51; cx += 12) ctx.fillRect(cx, -132, 7, 12);
  for (let cx = 51; cx < 95; cx += 12) ctx.fillRect(cx, -132, 7, 12);
  for (let cx = -32; cx < 32; cx += 12) ctx.fillRect(cx, -182, 7, 12);

  // glowing windows: warm light in the dark (the bedtime signature)
  const wins = [[-73,-80],[73,-80],[-16,-118],[16,-118],[0,-58],[-73,-38],[73,-38]];
  for (const [wx, wy] of wins) {
    castRadialGlow(p, wx, wy, 15, [255, 200, 120], 0.55);
    ctx.fillStyle = "rgb(255,206,132)";
    ctx.fillRect(wx - 4, wy - 8, 8, 15);
  }
  // great door
  castRadialGlow(p, 0, -10, 24, [255, 200, 120], 0.45);
  ctx.fillStyle = "rgb(255,206,132)";
  ctx.beginPath(); ctx.arc(0, 0, 11, Math.PI, 0); ctx.fill();
  ctx.fillRect(-11, -11, 22, 11);

  p.pop();
}

/* ------------------------------------------------------------------ grass */
const _grassCache = {};
function drawGrassField(p, t, seed, yBase, n, hMin, hMax, tone) {
  // tone 0 = back layer (shorter, bluer), 1 = front (taller, moonlit tips)
  if (!_grassCache[seed]) {
    const rnd = castMulberry32(seed);
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({ x: -60 + rnd() * 1400, h: hMin + rnd() * (hMax - hMin),
                 ph: rnd() * 6.28, w: 2.5 + rnd() * 2.5 });
    }
    _grassCache[seed] = arr;
  }
  const ctx = p.drawingContext;
  const dark  = tone < 0.5 ? [22, 34, 66]  : [26, 52, 62];
  const light = tone < 0.5 ? [70, 95, 150] : [95, 150, 135];
  ctx.lineCap = "round";
  for (const b of _grassCache[seed]) {
    const sway = Math.sin(t * 1.1 + b.ph + b.x * 0.004) * (8 + tone * 7);
    const tx = b.x + sway, ty = yBase - b.h;
    ctx.strokeStyle = `rgb(${dark[0]},${dark[1]},${dark[2]})`;
    ctx.lineWidth = b.w;
    ctx.beginPath();
    ctx.moveTo(b.x, yBase);
    ctx.quadraticCurveTo(b.x + sway * 0.4, yBase - b.h * 0.6, tx, ty);
    ctx.stroke();
    // moonlit tip
    ctx.strokeStyle = `rgba(${light[0]},${light[1]},${light[2]},0.75)`;
    ctx.lineWidth = b.w * 0.65;
    ctx.beginPath();
    ctx.moveTo(b.x + sway * 0.72, yBase - b.h * 0.72);
    ctx.quadraticCurveTo(b.x + sway * 0.9, yBase - b.h * 0.9, tx, ty);
    ctx.stroke();
  }
}

/* ---------------------------------------------------------------- flowers */
const _flowerCache = {};
function drawNightFlowers(p, t, seed, n, yBase) {
  if (!_flowerCache[seed]) {
    const rnd = castMulberry32(seed);
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({ x: 40 + rnd() * 1200, h: 26 + rnd() * 30,
                 ph: rnd() * 6.28, r: 4 + rnd() * 2.5,
                 tint: rnd() });
    }
    _flowerCache[seed] = arr;
  }
  const ctx = p.drawingContext;
  for (const f of _flowerCache[seed]) {
    const sway = Math.sin(t * 1.1 + f.ph + f.x * 0.004) * 7;
    const fx = f.x + sway, fy = yBase - f.h;
    // stem
    ctx.strokeStyle = "rgb(30,60,66)"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(f.x, yBase);
    ctx.quadraticCurveTo(f.x + sway * 0.5, yBase - f.h * 0.6, fx, fy); ctx.stroke();
    // petals: soft white-lavender
    const pc = f.tint > 0.5 ? [235, 230, 250] : [250, 240, 220];
    ctx.fillStyle = `rgb(${pc[0]},${pc[1]},${pc[2]})`;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + f.ph;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * f.r, fy + Math.sin(a) * f.r, f.r * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgb(255,205,130)";
    ctx.beginPath(); ctx.arc(fx, fy, f.r * 0.55, 0, Math.PI * 2); ctx.fill();
  }
}
