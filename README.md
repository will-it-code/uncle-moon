# Uncle Moon

A bedtime-story animation franchise, rendered entirely with JavaScript. Every
character is code-drawn (no AI imagery for the cast), every frame is
deterministic, and every scene is directed by one question: *does it lower
the heart rate?*

## The pipeline

Scenes are HTML pages: p5.js draws the characters, GSAP owns a paused master
timeline, and a headless Chromium seeks the timeline to exact times and
screenshots each frame. Frame = f(t), byte-identical across runs. Frames are
assembled with ffmpeg; voiceover and a music bed are mixed under.

- `moon-prototype/cast/` — the character library (`uncle-moon.js`,
  `pippa.js`, `common.js` glow/shading helpers, `motion.js` for springs and
  eased arcs)
- `moon-prototype/vendor/` — p5, GSAP (+ MotionPathPlugin, CustomEase),
  Anime.js (spring/easing math only)
- `moon-prototype/ep1_s1..s9.html` — Episode 1 scenes
- `moon-prototype/render_ep1.py` — headless frame extraction
- `moon-prototype/sky_test.html` — living GLSL nebula sky (deterministic)
- `moon-prototype/moon_crescent.html` — crescent moon + expressions sample
- `moon-prototype/motion_test.html` — motion system proof (arcs, springs)
- `build/` — episode script and voiceover sources

## Render a sample

```bash
cd moon-prototype
python3 render_ep1.py crescent moon_crescent.html 6   # 144 frames
ffmpeg -framerate 24 -i ep1_frames/crescent/f%04d.png -c:v libx264 \
  -pix_fmt yuv420p -movflags +faststart crescent.mp4
```

Built with JavaScript. No keyframes were harmed.
