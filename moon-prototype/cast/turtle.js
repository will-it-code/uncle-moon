/* ============================================================================
 * cast/turtle.js — Tommy the turtle, in Uncle Moon's design language.
 *
 *   drawTurtle(p, x, y, scale, t, state)
 *     p     — p5 instance (pass `window` in global-mode pages)
 *     x, y  — center of his shell, in canvas px
 *     scale — 1.0 = design size (shell w=110)
 *     t     — scene time in seconds (breath, head bob, blinks)
 *     state — optional: { blink, breath, tilt, expression }
 *             blink: 1 open … 0.15 shut (default 1)
 *             breath: -1..1 (default 0)
 *             tilt: radians of lean (default 0)
 *             expression: "sleepy" (default) | "happy" | "gentle" —
 *             curved line eyes + smile in dark ink on his teal head.
 *
 * Design (Oct 16, 2026 — Nandan's call): VIBRANT, no dull colours. Emerald
 * shell with golden rim, teal head and legs. NO shell spots or patterns,
 * NO cheek patches. A slow, gentle old soul.
 * Requires cast/common.js (castRadialGlow).
 * ============================================================================
 */
"use strict";

const TURTLE_SHELL = [50, 205, 135];   // vivid emerald
const TURTLE_RIM   = [255, 200, 100];  // golden rim
const TURTLE_SKIN  = [70, 195, 185];   // bright teal
const TURTLE_INK   = [60, 50, 40];

const TURTLE_EXPRESSIONS = {
  sleepy: { eyeA0: 0.15, eyeA1: 0.85, eyeW: 20, smileW: 22, smileH: 15, smileY: 26 },
  happy:  { eyeA0: 1.15, eyeA1: 1.85, eyeW: 22, smileW: 28, smileH: 19, smileY: 24 },
  gentle: { eyeA0: 0.18, eyeA1: 0.82, eyeW: 18, smileW: 18, smileH: 12, smileY: 27 },
};

function turtleExprParams(expr) {
  if (typeof expr === "object" && expr !== null) return expr;
  return TURTLE_EXPRESSIONS[expr] || TURTLE_EXPRESSIONS.sleepy;
}

function drawTurtle(p, x, y, scale, t, state) {
  state = Object.assign(
    { blink: 1, breath: 0, tilt: 0, expression: "sleepy" }, state || {});
  const ctx = p.drawingContext;
  const face = turtleExprParams(state.expression);
  const sY = 1 + 0.015 * state.breath;
  const headBob = 2 * Math.sin((Math.PI * 2 * t) / 4.0);

  p.push();
  p.translate(x, y);
  p.rotate(state.tilt);
  p.scale(scale / sY, scale * sY);

  // soft shadow beneath him
  ctx.save(); ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(20,16,40,0.35)";
  ctx.beginPath(); ctx.ellipse(0, 44, 58, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // stubby legs
  p.noStroke();
  const lg = ctx.createLinearGradient(0, 20, 0, 44);
  lg.addColorStop(0, "rgb(95,215,200)"); lg.addColorStop(1, "rgb(50,165,155)");
  ctx.fillStyle = lg;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(s * 34, 32, 13, 17, 0, 0, Math.PI * 2); ctx.fill();
  }

  // head poking out, bobbing gently
  const hg = ctx.createRadialGradient(-6, 12 + headBob, 4, 0, 20 + headBob, 24);
  hg.addColorStop(0, "rgb(110,225,210)");
  hg.addColorStop(0.6, `rgb(${TURTLE_SKIN[0]},${TURTLE_SKIN[1]},${TURTLE_SKIN[2]})`);
  hg.addColorStop(1, "rgb(45,150,140)");
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(0, 20 + headBob, 21, 0, Math.PI * 2); ctx.fill();

  // face: sleepy line eyes + small smile, dark ink on teal
  const eyeH = Math.max(2, face.eyeW * state.blink);
  p.noFill();
  p.stroke(TURTLE_INK[0], TURTLE_INK[1], TURTLE_INK[2]);
  p.strokeWeight(4); p.strokeCap(p.ROUND);
  p.arc(-10, 14 + headBob, face.eyeW, eyeH, face.eyeA0 * Math.PI, face.eyeA1 * Math.PI);
  p.arc(10, 14 + headBob, face.eyeW, eyeH, face.eyeA0 * Math.PI, face.eyeA1 * Math.PI);
  p.strokeWeight(4);
  p.arc(0, face.smileY + headBob, face.smileW, face.smileH, Math.PI * 0.15, Math.PI * 0.85);
  p.noStroke();

  // emerald dome shell, lit from the upper-left. CLEAN: no spots, no patterns.
  const shg = ctx.createRadialGradient(-25, -30, 8, 0, -5, 75);
  shg.addColorStop(0, "rgb(120,235,165)");
  shg.addColorStop(0.55, `rgb(${TURTLE_SHELL[0]},${TURTLE_SHELL[1]},${TURTLE_SHELL[2]})`);
  shg.addColorStop(1, "rgb(30,150,95)");
  ctx.fillStyle = shg;
  ctx.beginPath(); ctx.arc(0, 5, 55, Math.PI, 0); ctx.closePath(); ctx.fill();
  grainOver(ctx, 0, 5, 55, 55, 0.08); // hand-painted tooth (shell + head)
  // soft hand-drawn outline on the shell dome (warm dark brown, never black)
  ctx.strokeStyle = "rgba(70,55,45,0.85)"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.arc(0, 5, 55, Math.PI, 0); ctx.stroke();

  // golden rim along the shell's base
  p.noFill(); p.stroke(TURTLE_RIM[0], TURTLE_RIM[1], TURTLE_RIM[2]); p.strokeWeight(7);
  p.strokeCap(p.ROUND);
  p.arc(0, 5, 106, 106, Math.PI * 1.02, Math.PI * 1.98);
  p.noStroke();

  // lime highlight kiss on the shell's crown
  ctx.save(); ctx.globalCompositeOperation = "screen";
  const hl = ctx.createRadialGradient(-22, -28, 2, -22, -28, 26);
  hl.addColorStop(0, "rgba(200,255,210,0.55)"); hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.arc(-22, -28, 26, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  p.pop();
}
