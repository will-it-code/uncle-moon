/* ============================================================================
 * cast/bird.js — Bibi the baby bird, in Uncle Moon's design language.
 *
 *   drawBird(p, x, y, scale, t, state)
 *     p     — p5 instance (pass `window` in global-mode pages)
 *     x, y  — center of his body, in canvas px
 *     scale — 1.0 = design size (body r=30)
 *     t     — scene time in seconds (breath, wing sway, eye glance)
 *     state — optional: { blink, breath, tilt }
 *             blink: 1 open … 0.15 shut (default 1)
 *             breath: -1..1 (default 0)
 *             tilt: radians of lean (default 0)
 *
 * Design (Oct 16, 2026 — Nandan's call): VIBRANT, no dull colours. Tangerine
 * body, sunny belly, teal wings, golden beak. Googly eyes (like Pippa).
 * NO spots, NO cheek patches. His beak is his mouth (no separate smile).
 * Requires cast/common.js (castRadialGlow).
 * ============================================================================
 */
"use strict";

const BIRD_BODY   = [238, 168, 128];   // soft apricot (house palette)
const BIRD_BELLY  = [248, 232, 208];   // cream
const BIRD_WING   = [95, 175, 170];    // dusty teal
const BIRD_BEAK   = [240, 180, 100];   // soft gold
const BIRD_INK    = [90, 60, 40];

function drawBird(p, x, y, scale, t, state) {
  state = Object.assign({ blink: 1, breath: 0, tilt: 0 }, state || {});
  const ctx = p.drawingContext;
  const sY = 1 + 0.02 * state.breath;
  const sX = 1 / sY;

  p.push();
  p.translate(x, y);
  p.rotate(state.tilt);
  p.scale(scale * sX, scale * sY);

  // soft shadow beneath him
  ctx.save(); ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(20,16,40,0.35)";
  ctx.beginPath(); ctx.ellipse(0, 34, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // tiny feet
  p.noStroke(); p.fill(215, 140, 100);
  p.ellipse(-12, 30, 14, 9);
  p.ellipse(12, 30, 14, 9);

  // wings: bright teal, swaying softly with his breath
  const sway = Math.sin((Math.PI * 2 * t) / 3.0 + 1.0) * 0.08;
  for (const s of [-1, 1]) {
    p.push();
    p.translate(s * 27, 4);
    p.rotate(s * (0.5 + sway));
    const wg = ctx.createLinearGradient(0, -12, 0, 12);
    wg.addColorStop(0, "rgb(120,190,185)");
    wg.addColorStop(1, "rgb(70,150,145)");
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.ellipse(s * 8, 0, 15, 24, 0, 0, Math.PI * 2); ctx.fill();
    p.pop();
  }

  // round fluffy body, lit from the upper-left
  const bg = ctx.createRadialGradient(-10, -12, 5, 0, 0, 34);
  bg.addColorStop(0, "rgb(250,195,160)");
  bg.addColorStop(0.6, `rgb(${BIRD_BODY[0]},${BIRD_BODY[1]},${BIRD_BODY[2]})`);
  bg.addColorStop(1, "rgb(210,130,95)");
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();

  // sunny belly
  const belly = ctx.createRadialGradient(0, 8, 2, 0, 12, 22);
  belly.addColorStop(0, "rgba(250,238,215,0.95)");
  belly.addColorStop(1, "rgba(245,225,195,0)");
  ctx.fillStyle = belly;
  ctx.beginPath(); ctx.ellipse(0, 12, 20, 15, 0, 0, Math.PI * 2); ctx.fill();

  // whisper of warm rim light, upper-left
  p.noFill(); p.stroke(250, 235, 210, 70); p.strokeWeight(2.5);
  p.arc(0, 0, 57, 57, Math.PI * 1.05, Math.PI * 1.45); p.noStroke();

  // head tuft: three little feathers
  p.noStroke();
  const tg = ctx.createLinearGradient(0, -48, 0, -28);
  tg.addColorStop(0, "rgb(248,215,160)"); tg.addColorStop(1, "rgb(238,168,128)");
  ctx.fillStyle = tg;
  for (const [tx, tr] of [[-10, -0.25], [0, 0], [10, 0.25]]) {
    p.push(); p.translate(tx, -28); p.rotate(tr);
    ctx.beginPath(); ctx.ellipse(0, -8, 7, 16, 0, 0, Math.PI * 2); ctx.fill();
    p.pop();
  }

  // googly eyes
  const gx = 4 * Math.sin((Math.PI * 2 * t) / 3.4);
  const gy = 2.5 * Math.cos((Math.PI * 2 * t) / 2.6);
  const eyeOpen = Math.max(0.15, state.blink);
  p.noStroke();
  p.fill(255, 255, 255);
  p.ellipse(-12, -10, 26, 26 * eyeOpen);
  p.ellipse(12, -10, 26, 26 * eyeOpen);
  if (eyeOpen > 0.4) {
    p.fill(45, 35, 30);
    p.circle(-12 + gx * eyeOpen, -10 + gy * eyeOpen, 12);
    p.circle(12 + gx * eyeOpen, -10 + gy * eyeOpen, 12);
    p.fill(255, 255, 255);
    p.circle(-14 + gx * eyeOpen, -12 + gy * eyeOpen, 4);
    p.circle(10 + gx * eyeOpen, -12 + gy * eyeOpen, 4);
  }

  // tiny golden beak (his mouth)
  const bkg = ctx.createLinearGradient(0, -2, 0, 10);
  bkg.addColorStop(0, "rgb(245,195,120)"); bkg.addColorStop(1, "rgb(225,160,95)");
  ctx.fillStyle = bkg;
  ctx.beginPath();
  ctx.moveTo(-8, 2); ctx.lineTo(8, 2); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill();

  p.pop();
}
