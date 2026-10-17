/* ============================================================================
 * cast/scenery.js — reusable storybook scenery: trees, castle, grass, flowers.
 *
 * All builders are pure functions of (t, state): deterministic, seek-exact.
 * One light direction (upper-left), atmospheric colors, calm motion only.
 * Requires cast/common.js (castRadialGlow, castMulberry32).
 * ============================================================================
 */
"use strict";

/* ------------------------------------------- detailed painterly tree */
const _leafCache = {};
function drawTreeDetailed(p, x, y, scale, t, state) {
  state = Object.assign({ swayAmp: 1 }, state || {});
  const ctx = p.drawingContext;
  const sway = Math.sin(t * 0.5) * 0.010 * state.swayAmp;

  // seeded leaf field, built once
  if (!_leafCache.leaves) {
    const rnd = castMulberry32(4242);
    const leaves = [];
    // canopy = union of blobs; scatter dabs inside them
    const blobs = [[-48,-165,58],[0,-190,68],[52,-162,56],[-22,-138,48],[30,-136,46],[0,-160,80]];
    for (const [bx, by, br] of blobs) {
      const n = Math.floor(br * 2.6);
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * br;
        const lx = bx + Math.cos(a) * rr, ly = by + Math.sin(a) * rr * 0.92;
        // light: moonlit on upper-left, deep in the core
        const li = Math.max(0, Math.min(1,
          0.5 - (lx / 160) * 0.5 - ((ly + 165) / 130) * 0.55 + (rnd() - 0.5) * 0.35));
        leaves.push({ x: lx, y: ly, r: 11 + rnd() * 13, rot: rnd() * 3.14,
                      li, wob: rnd() * 6.28 });
      }
    }
    _leafCache.leaves = leaves;
  }

  p.push();
  p.translate(x, y);
  p.scale(scale, scale);
  p.rotate(sway);

  // trunk: tapered, gently curved, bark shading
  const tg = ctx.createLinearGradient(-16, 0, 16, 0);
  tg.addColorStop(0, "rgb(30,26,52)");
  tg.addColorStop(0.45, "rgb(58,50,88)");
  tg.addColorStop(1, "rgb(32,28,54)");
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.quadraticCurveTo(-12, -75, 5, -128);
  ctx.lineTo(19, -128);
  ctx.quadraticCurveTo(4, -75, 17, 0);
  ctx.closePath(); ctx.fill();
  // branches reaching into the canopy
  ctx.strokeStyle = "rgb(48,42,76)"; ctx.lineCap = "round";
  const branches = [
    [4,-95,-34,-118,-58,-148,9],[8,-105,36,-124,56,-154,7],
    [6,-115,-8,-140,-16,-168,6],[7,-110,22,-132,34,-166,6],
  ];
  for (const [x0,y0,x1,y1,x2,y2,w] of branches) {
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo(x1,y1,x2,y2); ctx.stroke();
  }

  // soft dark base masses first (foliage body)
  const baseBlobs = [[-48,-165,58],[0,-190,68],[52,-162,56],[-22,-138,48],[30,-136,46],[0,-160,80]];
  for (const [bx, by, br] of baseBlobs) {
    const g = ctx.createRadialGradient(bx - br*0.3, by - br*0.35, br*0.2, bx, by, br);
    g.addColorStop(0, "rgb(44,86,92)");
    g.addColorStop(1, "rgb(22,48,62)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
  }

  // leaf masses: deep teal cores flowing into moonlit upper-left edges
  for (const L of _leafCache.leaves) {
    const wob = 1.5 * Math.sin(t * 0.8 + L.wob);
    const lit = Math.pow(L.li, 2.6);   // only the rim truly glows
    const r = 28 + lit * 150;
    const g = 58 + lit * 115;
    const b = 72 + lit * 95;
    ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
    ctx.beginPath();
    ctx.ellipse(L.x + wob, L.y, L.r, L.r * 0.78, L.rot, 0, Math.PI * 2);
    ctx.fill();
  }
  p.pop();
}

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

/* drawStoryTree(p, x, y, s, t, o): a tree DESIGNED for scenes where
 * something sits on it (nest, character, lantern). Clear trunk, one
 * strong branch for the payload, canopy held high and clear of it.
 * Returns { bx, by } — the branch-tip point (in canvas px) where the
 * nest/perch belongs. Nandan, Oct 16 2026. */
function drawStoryTree(p, x, y, s, t, o) {
  const ctx = p.drawingContext;
  const sway = Math.sin(t * 0.45) * 0.008;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(sway);

  // trunk: tapered, gentle S-curve
  const tg = ctx.createLinearGradient(-30, 0, 30, 0);
  tg.addColorStop(0, "rgb(66,45,34)");
  tg.addColorStop(0.5, "rgb(102,72,52)");
  tg.addColorStop(1, "rgb(66,45,34)");
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.quadraticCurveTo(-26, -150, -15, -280);
  ctx.lineTo(15, -280);
  ctx.quadraticCurveTo(26, -150, 30, 0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(70,55,45,0.9)"; ctx.lineWidth = 3; ctx.lineJoin = "round";
  ctx.stroke();
  grainOver(ctx, 0, -140, 32, 150, 0.09);

  // THE branch: thick, rising gently right — built to hold a nest
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgb(84,58,42)"; ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.moveTo(0, -215);
  ctx.quadraticCurveTo(100, -228, 205, -192);
  ctx.stroke();
  ctx.strokeStyle = "rgb(108,78,56)"; ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(8, -220);
  ctx.quadraticCurveTo(100, -231, 195, -196);
  ctx.stroke();
  ctx.strokeStyle = "rgba(70,55,45,0.9)"; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -215);
  ctx.quadraticCurveTo(100, -228, 205, -192);
  ctx.stroke();

  // upper limbs: reach from the trunk top INTO the canopy (no floating)
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgb(84,58,42)"; ctx.lineWidth = 14;
  for (const [dx, dy] of [[-70, -110], [60, -120], [0, -140]]) {
    ctx.beginPath();
    ctx.moveTo(0, -265);
    ctx.quadraticCurveTo(dx * 0.5, -265 + dy * 0.6, dx, -265 + dy);
    ctx.stroke();
  }

  // canopy: soft puffs anchored ON the trunk top, rising from it
  const rnd = castMulberry32(31);
  const cols = [[88,142,130],[72,122,112],[102,162,146],[80,132,120]];
  // crown ring: puffs touching the trunk top first (the anchor)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const lx = Math.cos(a) * 55, ly = -295 - Math.abs(Math.sin(a)) * 25;
    const lr = 34 + rnd() * 14;
    const c = cols[(rnd() * cols.length)|0];
    const g = ctx.createRadialGradient(lx - lr*0.3, ly - lr*0.3, lr*0.1, lx, ly, lr);
    g.addColorStop(0, `rgb(${c[0]+18},${c[1]+18},${c[2]+14})`);
    g.addColorStop(0.6, `rgb(${c[0]},${c[1]},${c[2]})`);
    g.addColorStop(1, `rgb(${c[0]-22},${c[1]-20},${c[2]-16})`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
  }
  // upper canopy rising from the crown
  for (let i = 0; i < 24; i++) {
    const lx = (rnd() - 0.5) * 300;
    const ly = -330 - rnd() * 130 - Math.abs(lx) * 0.15;
    const lr = 30 + rnd() * 26;
    const c = cols[(rnd() * cols.length)|0];
    const g = ctx.createRadialGradient(lx - lr*0.3, ly - lr*0.3, lr*0.1, lx, ly, lr);
    g.addColorStop(0, `rgb(${c[0]+18},${c[1]+18},${c[2]+14})`);
    g.addColorStop(0.6, `rgb(${c[0]},${c[1]},${c[2]})`);
    g.addColorStop(1, `rgb(${c[0]-22},${c[1]-20},${c[2]-16})`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
  }
  // moonlit rim across the canopy top
  ctx.strokeStyle = "rgba(210,230,255,0.35)"; ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const lx = (rnd() - 0.5) * 260;
    const ly = -380 - rnd() * 100;
    ctx.beginPath(); ctx.arc(lx, ly, 34 + rnd() * 20, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
  }
  ctx.restore();
  return { bx: x + 205 * s, by: y - 192 * s };
}
