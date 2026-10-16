"""Extract frames for the 1-min Ep.1 demo: 3 shots, living characters."""
import os
from playwright.sync_api import sync_playwright

BASE = "/home/hatch/workspace/kids-pipeline-demo/moon-prototype"
FPS = 24
SHOTS = [
    ("uncle-moon-prototype-v2.html", 265, "shot1"),
    ("pippa-prototype.html", 527, "shot2"),
    ("uncle-moon-prototype-v2.html", 422, "shot3"),
]

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1280, "height": 720})
    for html, n, name in SHOTS:
        out = f"{BASE}/ep1_frames/{name}"
        os.makedirs(out, exist_ok=True)
        for i in range(n):
            pg.goto(f"file://{BASE}/{html}?t={i / FPS:.4f}&clean=1")
            pg.wait_for_function("window.__frameReady === true", timeout=25000)
            pg.screenshot(path=f"{out}/f{i:04d}.png")
        print(f"done {name}: {n} frames", flush=True)
    b.close()
print("all shots done")
