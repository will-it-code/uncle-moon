/* ============================================================================
 * cast/pippa.js — Pippa the firefly, in Uncle Moon's design language.
 *
 *   drawPippa(p, x, y, scale, t, state)
 *     p     — p5 instance (pass `window` in global-mode pages)
 *     x, y  — center of his body, in canvas px (the SCENE moves him;
 *             this function does not pick its own flight path)
 *     scale — 1.0 = design size (body r=26)
 *     t     — scene time in seconds (wing flutter, glow pulse)
 *     state — optional: { glow, tilt, blink, expression }
 *             glow: lantern brightness (0.9 calm … 1.2 joyful; ~0.15 = out)
 *             tilt: radians of lean (default 0)
 *             blink: 1 open … 0.15 shut (default 1)
 *             expression: "sleepy" (default) | "happy" | "gentle", or a
 *             param object {eyeA0, eyeA1, eyeW, smileW, smileH, smileY}
 *             (angles in units of PI). Same face language as the moon:
 *             curved line eyes + smile, warm cream ink on his dark body.
 *
 * Design (Oct 16, 2026 — Nandan's call): like the moon — NO spots, NO cheek
 * patches, clean smooth body. His face: signature googly eyes (white with
 * glancing pupils) + a clean cream smile. His light is an aura AROUND him,
 * never a spot on him. His signatures: the aura, translucent wings,
 * antennae with glowing tips.
 * Requires cast/common.js (castRadialGlow).
 * ============================================================================
 */
"use strict";

const PIPPA_GLOW = [255, 214, 130];
const PIPPA_INK  = [255, 240, 210];   // warm cream lines on his dark body
const PIPPA_BODY = [58, 50, 72];
const PIPPA_GLOW_PERIOD = 2.2;
const PIPPA_WING_HZ = 6.0;

const PIPPA_EXPRESSIONS = {
  sleepy: { eyeA0: 0.15, eyeA1: 0.85, eyeW: 18, smileW: 20, smileH: 14, smileY: 8 },
  happy:  { eyeA0: 1.15, eyeA1: 1.85, eyeW: 20, smileW: 26, smileH: 18, smileY: 6 },
  gentle: { eyeA0: 0.18, eyeA1: 0.82, eyeW: 16, smileW: 16, smileH: 11, smileY: 9 },
};

function pippaExprParams(expr) {
  if (typeof expr === "object" && expr !== null) return expr;
  return PIPPA_EXPRESSIONS[expr] || PIPPA_EXPRESSIONS.sleepy;
}

function drawPippa(p, x, y, scale, t, state) {
  state = Object.assign(
    { glow: 1.0, tilt: 0, blink: 1, expression: "sleepy" }, state || {});
  const ctx = p.drawingContext;
  const face = pippaExprParams(state.expression);
  const pulse = (0.72 + 0.28 * Math.sin((Math.PI * 2 * t) / PIPPA_GLOW_PERIOD)) * state.glow;

  p.push();
  p.translate(x, y);
  p.scale(scale, scale);
  p.rotate(state.tilt);

  // his light lives AROUND him, never as a spot on him: a soft aura hugging
  // his body (drawn first, so his body covers its center and only the glow
  // around him shows) + the wide halo that lights the world.
  castRadialGlow(p, 0, 10, 62 * pulse + 28, PIPPA_GLOW, 0.50 * pulse);
  castRadialGlow(p, 0, 0, 150 * pulse + 40, PIPPA_GLOW, 0.30 * pulse);
  castRadialGlow(p, 0, 0, 70, PIPPA_GLOW, 0.45 * pulse);

  // wings: translucent, fluttering softly
  const flap = Math.sin(Math.PI * 2 * t * PIPPA_WING_HZ) * 0.45;
  p.noStroke();
  for (const s of [-1, 1]) {
    p.push();
    p.translate(s * 10, -18);
    p.rotate(s * (0.5 + flap * 0.6));
    p.fill(235, 242, 255, 90);
    p.ellipse(s * 16, -14, 44, 20);
    p.fill(255, 255, 255, 60);
    p.ellipse(s * 16, -14, 30, 12);
    p.pop();
  }

  // smooth dark body, softly lit from the upper-left (one light direction)
  const bg = ctx.createRadialGradient(-9, -11, 4, 0, 0, 30);
  bg.addColorStop(0, "rgb(96,86,120)");
  bg.addColorStop(0.6, `rgb(${PIPPA_BODY[0]},${PIPPA_BODY[1]},${PIPPA_BODY[2]})`);
  bg.addColorStop(1, "rgb(38,32,50)");
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
  grainOver(ctx, 0, 0, 26, 26, 0.08); // hand-painted tooth

  // whisper of warm rim light, upper-left (echoes the moon's rim)
  p.noFill(); p.stroke(255, 226, 160, 70); p.strokeWeight(2.5);
  p.arc(0, 0, 49, 49, Math.PI * 1.05, Math.PI * 1.45); p.noStroke();

  // bee stripes: warm amber bands bowing across his lower body,
  // clipped to the body circle, with a soft honey glow
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.clip();
  ctx.shadowColor = "rgba(255,190,90,0.8)";
  ctx.shadowBlur = 8;
  for (const sy of [7, 15, 23]) {
    const sg = ctx.createLinearGradient(0, sy - 3.5, 0, sy + 3.5);
    sg.addColorStop(0, "rgb(255,208,115)");
    sg.addColorStop(0.5, "rgb(255,182,82)");
    sg.addColorStop(1, "rgb(232,152,62)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-26, sy - 3.5);
    ctx.quadraticCurveTo(0, sy + 2.5, 26, sy - 3.5);
    ctx.lineTo(26, sy + 3.5);
    ctx.quadraticCurveTo(0, sy + 9.5, -26, sy + 3.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // (no lantern spot: his glow is the aura around him, drawn above)

  // face: his signature googly eyes + the moon's clean smile in cream ink.
  // clean: no cheek patches, ever.
  const gx = 5 * Math.sin((Math.PI * 2 * t) / 3.1);
  const gy = 3 * Math.cos((Math.PI * 2 * t) / 2.3);
  const eyeOpen = Math.max(0.15, state.blink);
  p.noStroke();
  p.fill(255, 255, 255);
  p.ellipse(-11, -8, 26, 26 * eyeOpen);
  p.ellipse(13, -8, 26, 26 * eyeOpen);
  if (eyeOpen > 0.4) {
    p.fill(40, 34, 52);
    p.circle(-11 + gx * eyeOpen, -8 + gy * eyeOpen, 12);
    p.circle(13 + gx * eyeOpen, -8 + gy * eyeOpen, 12);
    p.fill(255, 255, 255);
    p.circle(-13 + gx * eyeOpen, -10 + gy * eyeOpen, 4);
    p.circle(11 + gx * eyeOpen, -10 + gy * eyeOpen, 4);
  }
  // smile morphs with the expression (sleepy/happy/gentle)
  p.noFill();
  p.stroke(PIPPA_INK[0], PIPPA_INK[1], PIPPA_INK[2]);
  p.strokeWeight(3.5); p.strokeCap(p.ROUND);
  p.arc(1, face.smileY, face.smileW, face.smileH, Math.PI * 0.15, Math.PI * 0.85);
  p.noStroke();

  // little antennae with glowing tips
  p.noFill();
  p.stroke(90, 80, 110); p.strokeWeight(2.5);
  p.bezier(-8, -24, -14, -34, -20, -38, -26, -40);
  p.bezier(8, -24, 14, -34, 20, -38, 26, -40);
  p.noStroke();
  castRadialGlow(p, -26, -40, 7, PIPPA_GLOW, 0.8);
  castRadialGlow(p, 26, -40, 7, PIPPA_GLOW, 0.8);

  p.pop();
}
