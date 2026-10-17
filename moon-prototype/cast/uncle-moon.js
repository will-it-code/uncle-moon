/* ============================================================================
 * cast/uncle-moon.js — Uncle Moon: a crescent moon with a face.
 *
 *   drawUncleMoon(p, x, y, scale, t, state)
 *     p     — p5 instance (pass `window` in global-mode pages)
 *     x, y  — center of the moon disc, in canvas px
 *     scale — 1.0 = design size (r=150)
 *     t     — scene time in seconds (drives pompom spring; deterministic)
 *     state — timeline-driven values (all optional, sensible defaults):
 *             { breath, bobY, glowPulse, blink, greetGlow, tilt, expression }
 *             breath: -1..1 (squash & stretch), bobY: px drift,
 *             glowPulse: 0.8..1.0 halo strength, blink: 1 open .. 0.15 shut,
 *             greetGlow: 0..1 entrance swell (use 1 when already on screen),
 *             tilt: radians of gentle lean (0 = upright),
 *             expression: "sleepy" (default) | "happy" | "gentle", or a
 *             param object {eyeA0, eyeA1, eyeW, smileW, smileH, smileY, cheek}
 *             (angles in units of PI). Blend between presets by lerping.
 *
 * Design (Oct 16, 2026 — Nandan's call): NO dark-side disc. The moon is a
 * true crescent: the bite is punched transparent (destination-out) on an
 * offscreen buffer so the sky shows through. Same face, same nightcap,
 * same identity — only the light and the expressions are new.
 * Requires cast/common.js (castExpGlow, castRadialGlow, castMulberry32).
 * ============================================================================
 */
"use strict";

const MOON_CREAM = [255, 243, 214];
const MOON_INK   = [96, 76, 56];
const MOON_R     = 150;          // design radius; scaled by `scale`
const MOON_SQUASH = 0.015;
const MOON_BOB_PERIOD = 6.0;
const MOON_BOB_AMT = 9;
// bite (transparent crescent cut): center + radius, design coords
const MOON_BITE = { x: 105, y: -60, r: 132 };
// moon buffer: design-space bounds x[-200,200], y[-310,210]
const MOON_BUF = { w: 400, h: 520, cx: 200, cy: 310 };

/* Expression presets — all bedtime-calm. Angles in units of PI. */
const MOON_EXPRESSIONS = {
  sleepy: { eyeA0: 0.15, eyeA1: 0.85, eyeW: 48, smileW: 88, smileH: 64, smileY: 28 },
  happy:  { eyeA0: 1.15, eyeA1: 1.85, eyeW: 54, smileW: 114, smileH: 86, smileY: 20 },
  gentle: { eyeA0: 0.18, eyeA1: 0.82, eyeW: 44, smileW: 70, smileH: 48, smileY: 30 },
  sad:    { eyeA0: 0.10, eyeA1: 0.55, eyeW: 44, smileW: 70, smileH: 44, smileY: 38, frown: true },
};

function moonExprParams(expr) {
  if (typeof expr === "object" && expr !== null) return expr;
  return MOON_EXPRESSIONS[expr] || MOON_EXPRESSIONS.sleepy;
}

/* Overdamped pompom spring — pure function of t, pre-rolled from t=-3,
 * so every frame is settled and deterministic. */
function moonSpringLag(t) {
  const wn = Math.PI * 2 * 1.1, zeta = 1.35, dt = 1 / 120;
  const w = Math.PI * 2 / MOON_BOB_PERIOD;
  let sx = 0, sy = 26, vx = 0, vy = 0;
  const t0 = -3;
  const steps = Math.max(1, Math.round((t - t0) / dt));
  const h = (t - t0) / steps;
  for (let i = 1; i <= steps; i++) {
    const ti = t0 + i * h;
    const bobV = MOON_BOB_AMT * w * Math.cos(w * ti + 1.0);
    const txg = 5 * Math.sin((Math.PI * 2 * ti) / 2.3 + 2.0);
    const tyg = 26 - 0.35 * bobV;
    const ax = wn * wn * (txg - sx) - 2 * zeta * wn * vx;
    const ay = wn * wn * (tyg - sy) - 2 * zeta * wn * vy;
    vx += ax * h; vy += ay * h;
    sx += vx * h; sy += vy * h;
  }
  return { x: sx, y: sy };
}

function moonDrawFace(p, ctx, face, blink) {
  const fx = -95, fy = 8;
  const eyeH = Math.max(3, face.eyeW * blink);
  p.noFill();
  p.stroke(MOON_INK[0], MOON_INK[1], MOON_INK[2]);
  p.strokeWeight(9); p.strokeCap(p.ROUND);
  p.arc(fx - 38, fy - 14, face.eyeW, eyeH, face.eyeA0 * Math.PI, face.eyeA1 * Math.PI);
  p.arc(fx + 38, fy - 14, face.eyeW, eyeH, face.eyeA0 * Math.PI, face.eyeA1 * Math.PI);
  p.strokeWeight(10);
  if (face.frown) {
    p.arc(fx, fy + face.smileY + 26, face.smileW, face.smileH, Math.PI * 1.12, Math.PI * 1.88);
  } else {
    p.arc(fx, fy + face.smileY, face.smileW, face.smileH, Math.PI * 0.12, Math.PI * 0.88);
  }
  p.noStroke();
  // no blush (Nandan, Oct 16, 2026): the face stays completely clean.
}

function moonDrawNightcap(p, ctx, t, lag) {
  // Slim sleepy cap, flopped gently left along the crescent's upper limb.
  // Base corners verified on the lit crescent, clear of the transparent bite.
  p.push();
  p.translate(-62, -12);
  p.rotate(-0.28 + 0.004 * (lag.x - 5 * Math.sin((Math.PI * 2 * t) / 2.3 + 2.0)));

  const grad = ctx.createLinearGradient(0, -225, 0, -80);
  grad.addColorStop(0, "rgb(150,160,255)");
  grad.addColorStop(1, "rgb(92,102,220)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-38, -95);
  ctx.quadraticCurveTo(-30, -170, 5, -225);   // left edge up to the tip
  ctx.quadraticCurveTo(32, -172, 37, -88);    // right edge back down
  ctx.quadraticCurveTo(0, -78, -38, -95);      // base
  ctx.closePath(); ctx.fill();

  // fabric shading: multiply away from the key light + soft fold shadows
  ctx.save(); ctx.globalCompositeOperation = "multiply";
  const sh = ctx.createLinearGradient(-38, 0, 37, 0);
  sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(60,70,140,0.40)");
  ctx.fillStyle = sh; ctx.fill();
  ctx.fillStyle = "rgba(70,80,160,0.26)";
  ctx.beginPath(); ctx.ellipse(-14, -140, 9, 28, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14, -125, 7, 22, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // contact shadow under the base so the cap sits on the moon
  ctx.save(); ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(90,80,140,0.30)";
  ctx.beginPath(); ctx.ellipse(0, -86, 32, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  p.noFill(); p.stroke(70, 78, 190, 90); p.strokeWeight(6); p.strokeCap(p.ROUND);
  p.bezier(-16, -170, -4, -152, 6, -136, 14, -118);
  p.noStroke();

  // pompom on a short string from the tip, riding the spring lag
  const tx = 5, ty = -225;
  const px = tx + lag.x, py = ty + lag.y;
  p.stroke(200, 205, 255, 160); p.strokeWeight(4);
  p.line(tx, ty, px, py);
  p.noStroke();
  const pg = ctx.createRadialGradient(px - 5, py - 6, 2, px, py, 16);
  pg.addColorStop(0, "rgb(255,255,255)");
  pg.addColorStop(1, "rgb(205,210,235)");
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(px, py, 15, 0, Math.PI * 2); ctx.fill();
  p.pop();
}

let _moonBuf = null;
function _moonBuffer(p) {
  if (!_moonBuf) _moonBuf = p.createGraphics(MOON_BUF.w, MOON_BUF.h);
  return _moonBuf;
}

function drawUncleMoon(p, x, y, scale, t, state) {
  state = Object.assign(
    { breath: -1, bobY: MOON_BOB_AMT, glowPulse: 0.9, blink: 1,
      greetGlow: 1, tilt: 0, expression: "sleepy" }, state || {});
  const R = MOON_R;
  const face = moonExprParams(state.expression);
  const lag = moonSpringLag(t);

  const sY = 1 + MOON_SQUASH * state.breath;
  const sX = 1 / sY;
  const bob = state.bobY;
  const greetF = 0.72 + 0.28 * state.greetGlow;
  const glowPulse = state.glowPulse;

  // ---- paint the crescent on the offscreen buffer
  const b = _moonBuffer(p);
  b.clear();
  const ctx = b.drawingContext;
  const cx = MOON_BUF.cx, cy = MOON_BUF.cy;
  const bx = cx + MOON_BITE.x, by = cy + MOON_BITE.y, br = MOON_BITE.r;

  // lit disc: soft radial shading, brightest upper-left (key light)
  let g = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.1, cx, cy, R * 1.25);
  g.addColorStop(0.00, "rgb(255,250,232)");
  g.addColorStop(0.55, `rgb(${MOON_CREAM[0]},${MOON_CREAM[1]},${MOON_CREAM[2]})`);
  g.addColorStop(1.00, "rgb(214,196,170)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  grainOver(ctx, cx, cy, R, R, 0.05); // hand-painted tooth (whisper)
  // soft hand-drawn outline, whisper-thin (warm dark brown, never black)
  ctx.strokeStyle = "rgba(70,55,45,0.5)"; ctx.lineWidth = 2; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

  // render-stack passes, clipped to the disc
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  ctx.globalCompositeOperation = "multiply"; // form shadow gathers lower-right
  g = ctx.createRadialGradient(cx + R * 0.7, cy + R * 0.7, R * 0.1, cx + R * 0.7, cy + R * 0.7, R * 1.5);
  g.addColorStop(0, "rgba(150,120,150,0.38)"); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.globalCompositeOperation = "screen"; // key light kisses upper-left
  g = ctx.createRadialGradient(cx - R * 0.55, cy - R * 0.55, R * 0.05, cx - R * 0.55, cy - R * 0.55, R * 0.95);
  g.addColorStop(0, "rgba(255,253,244,0.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  // NO craters (Nandan, Oct 16, 2026): the moon face stays clean and smooth.

  // THE BITE: punched transparent — the sky shows through, no black patch
  ctx.save(); ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // rim light: canonical upper-left limb + subtle crescent-edge rim
  b.push(); b.translate(cx, cy);
  b.noFill(); b.stroke(255, 252, 240, 110); b.strokeWeight(5);
  b.arc(0, 0, R * 1.97, R * 1.97, Math.PI * 1.02, Math.PI * 1.45); b.noStroke();
  const rctx = b.drawingContext;
  rctx.save(); rctx.globalCompositeOperation = "lighter";
  rctx.strokeStyle = "rgba(255,244,220,0.55)"; rctx.lineWidth = 4;
  rctx.shadowColor = "rgba(255,236,200,0.7)"; rctx.shadowBlur = 12;
  rctx.beginPath(); rctx.arc(0, 0, R - 3, Math.PI * 0.12, Math.PI * 0.55); rctx.stroke();
  rctx.restore();
  b.pop();

  // face + nightcap (drawn in buffer coords: shift by (cx, cy))
  b.push(); b.translate(cx, cy);
  moonDrawFace(b, b.drawingContext, face, state.blink);
  moonDrawNightcap(b, b.drawingContext, t, lag);
  b.pop();

  // grain, seeded (skip the transparent bite)
  const rnd = castMulberry32(42);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  for (let i = 0; i < 2400; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * R;
    const gx = cx + Math.cos(a) * d, gy = cy + Math.sin(a) * d;
    const dx = gx - bx, dy = gy - by;
    if (dx * dx + dy * dy < Math.pow(br * 0.94, 2)) continue;
    ctx.fillStyle = rnd() > 0.5 ? `rgba(120,85,60,${0.05 + rnd() * 0.07})` : `rgba(255,250,240,${0.05 + rnd() * 0.07})`;
    ctx.fillRect(gx, gy, 1.4, 1.4);
  }
  ctx.restore();

  // ---- composite onto the scene
  p.push();
  p.translate(x, y + bob * scale);
  p.rotate(state.tilt);
  p.scale(scale * sX, scale * sY);

  // halo: triple exponential bloom (over the sky, under the moon)
  castExpGlow(p, 0, 0, 560, [255, 238, 196], 0.10 * glowPulse * greetF, 3.4);
  castExpGlow(p, 0, 0, 360, [255, 241, 203], 0.17 * glowPulse * greetF, 2.7);
  castExpGlow(p, 0, 0, 225, [255, 244, 210], 0.24 * glowPulse * greetF, 2.1);

  p.image(b, -MOON_BUF.cx, -MOON_BUF.cy);
  p.pop();
}
