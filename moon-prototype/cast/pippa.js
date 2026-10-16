/* ============================================================================
 * cast/pippa.js — Pippa the firefly as a reusable cast member.
 *
 *   drawPippa(p, x, y, scale, t, state)
 *     p     — p5 instance (pass `window` in global-mode pages)
 *     x, y  — center of her body, in canvas px (the SCENE moves her;
 *             this function does not pick its own flight path)
 *     scale — 1.0 = design size (body r=26, identical to pippa-prototype)
 *     t     — scene time in seconds (wing flutter, glow pulse, eye glance)
 *     state — optional: { glow, tilt }
 *             glow: lantern brightness multiplier (0.9 calm … 1.2 joyful;
 *                   use ~0.15 for "glow all gone")
 *             tilt: radians of lean (default 0)
 *
 * Drawing code transcribed 1:1 from pippa-prototype.html — at scale=1 the
 * pixels are identical. Requires cast/common.js (castRadialGlow).
 * ============================================================================
 */
"use strict";

const PIPPA_GLOW = [255, 214, 130];
const PIPPA_BODY = [52, 46, 64];
const PIPPA_GLOW_PERIOD = 2.2;
const PIPPA_WING_HZ = 6.0;

function drawPippa(p, x, y, scale, t, state) {
  state = Object.assign({ glow: 1.0, tilt: 0 }, state || {});
  const ctx = p.drawingContext;

  const pulse = (0.72 + 0.28 * Math.sin((Math.PI * 2 * t) / PIPPA_GLOW_PERIOD)) * state.glow;

  p.push();
  p.translate(x, y);
  p.scale(scale, scale);
  p.rotate(state.tilt);

  // her warm halo lights the world around her
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

  // tiny dark round body
  const bg = ctx.createRadialGradient(-8, -10, 4, 0, 0, 30);
  bg.addColorStop(0, "rgb(74,66,92)");
  bg.addColorStop(1, `rgb(${PIPPA_BODY[0]},${PIPPA_BODY[1]},${PIPPA_BODY[2]})`);
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();

  // glowing abdomen (her lantern)
  castRadialGlow(p, 4, 12, 20 * pulse + 6, PIPPA_GLOW, 0.85);
  p.fill(255, 226, 150, 235);
  p.ellipse(4, 12, 22 * pulse + 8, 16 * pulse + 6);

  // big cute eyes, glancing around curiously
  const gx = 5 * Math.sin((Math.PI * 2 * t) / 3.1);
  const gy = 3 * Math.cos((Math.PI * 2 * t) / 2.3);
  p.noStroke();
  p.fill(255, 255, 255);
  p.circle(-11, -8, 26);
  p.circle(13, -8, 26);
  p.fill(40, 34, 52);
  p.circle(-11 + gx, -8 + gy, 12);
  p.circle(13 + gx, -8 + gy, 12);
  p.fill(255, 255, 255);
  p.circle(-13 + gx, -10 + gy, 4);
  p.circle(11 + gx, -10 + gy, 4);

  // tiny sweet smile + rosy cheeks
  p.noFill();
  p.stroke(70, 58, 78); p.strokeWeight(3); p.strokeCap(p.ROUND);
  p.arc(1, 6, 16, 12, Math.PI * 0.2, Math.PI * 0.8);
  p.noStroke();
  castRadialGlow(p, -20, 4, 7, [255, 150, 150], 0.5);
  castRadialGlow(p, 22, 4, 7, [255, 150, 150], 0.5);

  // little antennae with glowing tips
  p.noFill();
  p.stroke(70, 58, 78); p.strokeWeight(2.5);
  p.bezier(-8, -24, -14, -34, -20, -38, -26, -40);
  p.bezier(8, -24, 14, -34, 20, -38, 26, -40);
  p.noStroke();
  castRadialGlow(p, -26, -40, 7, PIPPA_GLOW, 0.8);
  castRadialGlow(p, 26, -40, 7, PIPPA_GLOW, 0.8);

  p.pop();
}
