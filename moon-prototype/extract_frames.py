"""Extract deterministic frames from the Uncle Moon prototype for video assembly."""
import os
from playwright.sync_api import sync_playwright

FPS, SECS = 24, 8
N = FPS * SECS
OUT = "/home/hatch/workspace/kids-pipeline-demo/moon-prototype/frames"
os.makedirs(OUT, exist_ok=True)
URL = ("file:///home/hatch/workspace/kids-pipeline-demo/"
       "moon-prototype/uncle-moon-prototype.html")

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1280, "height": 720})
    for i in range(N):
        pg.goto(f"{URL}?t={i / FPS:.4f}&clean=1")
        pg.wait_for_function("window.__frameReady === true", timeout=25000)
        pg.screenshot(path=f"{OUT}/f{i:04d}.png")
        if i % 48 == 0:
            print(f"frame {i}/{N}", flush=True)
    b.close()
print("done", N, "frames")
