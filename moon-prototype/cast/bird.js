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

// Expressions (Oct 17, 2026 — Nandan: crying must read). crying = sad + tears.
const BIRD_EXPRESSIONS = {
  happy:  { eyeScale: 1.0, beakOpen: 0.6, tears: false },
  gentle: { eyeScale: 0.9, beakOpen: 0.0, tears: false },
  sleepy: { eyeScale: 0.35, beakOpen: 0.0, tears: false },
  sad:    { eyeScale: 0.7, beakOpen: 0.0, tears: false, droop: true },
  crying: { eyeScale: 0.7, beakOpen: 0.3, tears: true, droop: true },
};

function drawBird(p, x, y, scale, t, state) {
  state = Object.assign({ blink: 1, breath: 0, tilt: 0, expression: null }, state || {});
  const face = state.expression || BIRD_EXPRESSIONS.gentle;
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
    ctx.strokeStyle = "rgba(70,55,45,0.7)"; ctx.lineWidth = 2; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.ellipse(s * 8, 0, 15, 24, 0, 0, Math.PI * 2); ctx.stroke();
    p.pop();
  }

  // round fluffy body, lit from the upper-left
  const bg = ctx.createRadialGradient(-10, -12, 5, 0, 0, 34);
  bg.addColorStop(0, "rgb(250,195,160)");
  bg.addColorStop(0.6, `rgb(${BIRD_BODY[0]},${BIRD_BODY[1]},${BIRD_BODY[2]})`);
  bg.addColorStop(1, "rgb(210,130,95)");
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
  grainOver(ctx, 0, 0, 30, 30, 0.08); // hand-painted tooth
  // soft hand-drawn outline (warm dark brown, never black)
  ctx.strokeStyle = "rgba(70,55,45,0.85)"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();

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

  // googly eyes (scaled by expression; droop when sad)
  const gx = 4 * Math.sin((Math.PI * 2 * t) / 3.4);
  const gy = 2.5 * Math.cos((Math.PI * 2 * t) / 2.6);
  const eyeOpen = Math.max(0.15, state.blink) * face.eyeScale;
  const droopY = face.droop ? 3 : 0;
  p.noStroke();
  p.fill(255, 255, 255);
  p.ellipse(-12, -10 + droopY, 26, 26 * eyeOpen);
  p.ellipse(12, -10 + droopY, 26, 26 * eyeOpen);
  if (eyeOpen > 0.4) {
    p.fill(45, 35, 30);
    p.circle(-12 + gx * eyeOpen, -10 + droopY + gy * eyeOpen, 12);
    p.circle(12 + gx * eyeOpen, -10 + droopY + gy * eyeOpen, 12);
    p.fill(255, 255, 255);
    p.circle(-14 + gx * eyeOpen, -12 + droopY + gy * eyeOpen, 4);
    p.circle(10 + gx * eyeOpen, -12 + droopY + gy * eyeOpen, 4);
  }
  // tears: animated droplets when crying (Nandan Oct 17 — must read)
  if (face.tears) {
    for (const s of [-1, 1]) {
      const fall = ((t * 0.7 + (s > 0 ? 0.5 : 0)) % 1);
      const ty = 2 + fall * 26;
      const ta = 1 - fall;
      ctx.fillStyle = `rgba(150,200,240,${0.9 * ta})`;
      ctx.beginPath();
      ctx.ellipse(s * 12, ty, 4.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.7 * ta})`;
      ctx.beginPath(); ctx.arc(s * 12 - 1.5, ty - 2, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  // tiny golden beak (his mouth; opens when happy/crying)
  const bkg = ctx.createLinearGradient(0, -2, 0, 10);
  bkg.addColorStop(0, "rgb(245,195,120)"); bkg.addColorStop(1, "rgb(225,160,95)");
  ctx.fillStyle = bkg;
  ctx.beginPath();
  const bo = face.beakOpen * 6;
  ctx.moveTo(-8, 2); ctx.lineTo(8, 2); ctx.lineTo(0, 12 + bo); ctx.closePath(); ctx.fill();

  p.pop();
}
