"""Plate proof renderer: the AI plate + camera push + code cast, 6s @ 24fps."""
import os, time
from playwright.sync_api import sync_playwright

BASE = "/home/hatch/workspace/kids-pipeline-demo/moon-prototype"
OUT = f"{BASE}/proof_frames"
DUR, FPS = 6.0, 24
N = round(DUR * FPS)

os.makedirs(OUT, exist_ok=True)
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1280, "height": 720})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(f"http://localhost:8123/kids-pipeline-demo/moon-prototype/plate_proof.html")
    pg.wait_for_function("window.__frameReady === true", timeout=60000)
    t0 = time.time()
    for i in range(N):
        pg.evaluate("window.__frameReady = false")
        pg.evaluate(f"window.__seek({i / FPS})")
        pg.wait_for_function("window.__frameReady === true", timeout=10000)
        pg.screenshot(path=f"{OUT}/f{i:04d}.png")
    dt = time.time() - t0
    b.close()
print(f"proof: {N} frames, {dt:.0f}s ({N/max(dt,1):.2f} fps), js_errors={len(errors)}", flush=True)
for e in errors[:3]:
    print("  ERR:", e[:200], flush=True)
