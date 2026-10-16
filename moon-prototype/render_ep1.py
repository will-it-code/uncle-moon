"""Ep1 trial production renderer: one page load per scene, __seek per frame."""
import sys, os, time
from playwright.sync_api import sync_playwright

BASE = "/home/hatch/workspace/kids-pipeline-demo/moon-prototype"
OUT = f"{BASE}/ep1_frames"

def render_scene(tag, html, duration):
    n = round(duration * 24)
    outdir = f"{OUT}/{tag}"
    os.makedirs(outdir, exist_ok=True)
    existing = [f for f in os.listdir(outdir) if f.endswith(".png")]
    if len(existing) >= n:
        print(f"{tag}: {len(existing)}/{n} frames already present, skipping", flush=True)
        return
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        pg = b.new_page(viewport={"width": 1280, "height": 720})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"file://{BASE}/{html}?t=0&clean=1")
        pg.wait_for_function("window.__frameReady === true", timeout=30000)
        t0 = time.time()
        for i in range(n):
            if f"f{i:04d}.png" in existing:
                continue
            pg.evaluate("window.__frameReady = false")
            pg.evaluate(f"window.__seek({i / 24.0})")
            pg.wait_for_function("window.__frameReady === true", timeout=8000)
            pg.screenshot(path=f"{outdir}/f{i:04d}.png")
        dt = time.time() - t0
        b.close()
    done = len([f for f in os.listdir(outdir) if f.endswith(".png")])
    print(f"{tag}: {done}/{n} frames, {dt:.0f}s ({n/max(dt,1):.2f} fps), js_errors={len(errors)}", flush=True)
    for e in errors[:3]:
        print("  ERR:", e[:200], flush=True)

if __name__ == "__main__":
    args = sys.argv[1:]
    for i in range(0, len(args), 3):
        render_scene(args[i], args[i + 1], float(args[i + 2]))
