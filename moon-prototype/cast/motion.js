/* ============================================================================
 * cast/motion.js — Uncle Moon channel motion vocabulary (FULL POWER).
 *
 * Architecture (verified Oct 16, 2026):
 *   - GSAP owns the timeline: one paused timeline per scene, window.__seek(t).
 *   - MotionPathPlugin + CustomEase extend GSAP (arcs, signature eases).
 *   - Anime.js contributes SPRING PHYSICS (the one thing GSAP core lacks):
 *     anime.spring() is deterministic under manual seek (verified identical
 *     6-decimal values across separate browser launches).
 *   - No clock conflicts: GSAP drives time; Anime.js only provides math.
 *
 * Requires loaded before this file: gsap, MotionPathPlugin, CustomEase,
 * anime (UMD). Call motionInit() once per page.
 * ============================================================================
 */
"use strict";

function motionInit() {
  gsap.registerPlugin(MotionPathPlugin, CustomEase);
  // moonEase: our signature. Softer than sine.inOut at both ends —
  // everything arrives like it's landing on a pillow.
  CustomEase.create("moonEase", "M0,0 C0.42,0,0.58,1,1,1");
  // moonRise: gentle entrances (opacity / scale in).
  CustomEase.create("moonRise", "M0,0 C0.30,0,0.42,1,1,1");
}

/* Calm springs — overdamped (zeta > 1), so nothing ever bounces.
 * Bedtime-safe: things settle, they never boing. */
function springSettle() { return anime.spring({ stiffness: 70, damping: 19, mass: 1 }); } // zeta ~1.14
function springDrift()  { return anime.spring({ stiffness: 45, damping: 15, mass: 1 }); } // zeta ~1.12, floatier

/* Arc flight: tween a state {x, y} along a bezier arc instead of a line.
 * points: [{x,y}, {x,y}, ...] waypoints; the path curves through them.
 * Returns tween vars: tl.to(state, Object.assign(motionArc(pts), {duration, ease}), pos)
 * Closes studio-comparison P3 (arcs on all paths). */
function motionArc(points, curviness) {
  return { motionPath: { path: points, curviness: curviness || 1.6 } };
}

/* Stagger with the channel's signature feel. */
function moonStaggerEach(each) {
  return { each: each, ease: "moonEase" };
}
