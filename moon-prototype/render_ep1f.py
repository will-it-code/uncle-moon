#!/usr/bin/env python3
"""Render Ep1 (Final): 9 scenes, 24fps, seek-exact frames."""
import os, sys, time
from playwright.sync_api import sync_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "ep1f_frames")
FPS = 24
SCENES = [
    ("s1", 30), ("s2", 60), ("s3", 30), ("s4", 25), ("s5", 25),
    ("s6", 25), ("s7", 45), ("s8", 30), ("s9", 30),
]

def main():
    os.makedirs(OUT, exist_ok=True)
    total = sum(d * FPS for _, d in SCENES)
    print(f"ep1f: {len(SCENES)} scenes, {total} frames", flush=True)
    t0 = time.time()
    done = 0
    js_errors = 0
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        for name, dur in SCENES:
            sdir = os.path.join(OUT, name)
            os.makedirs(sdir, exist_ok=True)
            n = dur * FPS
            pg = b.new_page(viewport={"width": 1280, "height": 720})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
            pg.goto(f"http://localhost:8123/kids-pipeline-demo/moon-prototype/ep1f/{name}.html")
            pg.wait_for_function("window.__frameReady === true", timeout=60000)
            for i in range(n):
                t = i / FPS
                pg.evaluate(f"window.__frameReady = false; window.__seek({t})")
                pg.wait_for_function("window.__frameReady === true", timeout=30000)
                pg.screenshot(path=os.path.join(sdir, f"f{i:04d}.png"))
                done += 1
                if done % 240 == 0:
                    el = time.time() - t0
                    print(f"  {done}/{total} ({done/total*100:.0f}%) {el/60:.1f}min", flush=True)
            js_errors += len(errs)
            if errs:
                print(f"  {name} js errors: {errs[:3]}", flush=True)
            pg.close()
        b.close()
    el = time.time() - t0
    print(f"done: {done} frames, {el/60:.1f}min, js_errors={js_errors}", flush=True)

if __name__ == "__main__":
    main()
