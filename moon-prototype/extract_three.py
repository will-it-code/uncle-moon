"""Extract 6s @ 24fps deterministic frames for the three new characters."""
import os
from playwright.sync_api import sync_playwright

FPS, SECS = 24, 6
N = FPS * SECS
BASE = "/home/hatch/workspace/kids-pipeline-demo/moon-prototype"
JOBS = [
    ("mama-earth-prototype.html", "frames_mama_earth"),
    ("pippa-prototype.html", "frames_pippa"),
    ("silver-tail-prototype.html", "frames_silver_tail"),
]

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1280, "height": 720})
    for html, outdir in JOBS:
        out = os.path.join(BASE, outdir)
        os.makedirs(out, exist_ok=True)
        for i in range(N):
            pg.goto(f"file://{BASE}/{html}?t={i / FPS:.4f}&clean=1")
            pg.wait_for_function("window.__frameReady === true", timeout=25000)
            pg.screenshot(path=f"{out}/f{i:04d}.png")
        print(f"done {outdir}: {N} frames", flush=True)
    b.close()
print("ALL DONE")
