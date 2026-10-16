"""v3 fast-path verification: single page load, __seek per frame, no reloads.

Checks:
  1. Zero JS errors on load; __frameReady fires.
  2. Determinism A: two fresh ?t=2.5 loads -> identical MD5.
  3. Determinism B: __seek(2.5) twice on one page -> identical MD5.
  4. Determinism C: ?t=2.5 reload vs __seek(2.5) -> identical MD5.
  5. Fast path: 48 frames via __seek, report per-frame seconds.
"""
import hashlib, os, time
from playwright.sync_api import sync_playwright

BASE = "/home/hatch/workspace/kids-pipeline-demo/moon-prototype"
HTML = "uncle-moon-prototype-v3.html"
OUT = "/tmp/fast_v3"
os.makedirs(OUT, exist_ok=True)

def md5(path):
    return hashlib.md5(open(path, "rb").read()).hexdigest()

errors = []

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1280, "height": 720})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    # --- 1. load check (?t mode) ---
    pg.goto(f"file://{BASE}/{HTML}?t=1.1&clean=1")
    pg.wait_for_function("window.__frameReady === true", timeout=25000)
    pg.screenshot(path=f"{OUT}/t_fixed.png")
    h_tfixed = md5(f"{OUT}/t_fixed.png")
    print("load ok, ?t=1.1 md5:", h_tfixed)

    # --- 2a. determinism A: two fresh ?t=2.5 loads ---
    pg.goto(f"file://{BASE}/{HTML}?t=2.5&clean=1")
    pg.wait_for_function("window.__frameReady === true", timeout=25000)
    pg.screenshot(path=f"{OUT}/a1.png")
    pg.goto(f"file://{BASE}/{HTML}?t=2.5&clean=1")
    pg.wait_for_function("window.__frameReady === true", timeout=25000)
    pg.screenshot(path=f"{OUT}/a2.png")
    ha1, ha2 = md5(f"{OUT}/a1.png"), md5(f"{OUT}/a2.png")
    print("A reload-vs-reload:", "IDENTICAL" if ha1 == ha2 else f"MISMATCH {ha1} vs {ha2}")

    # --- single live page for seek-based checks ---
    pg.goto(f"file://{BASE}/{HTML}?clean=1")
    pg.wait_for_function("window.__frameReady === true", timeout=25000)
    # stop the live draw loop so seeks are the only driver
    pg.evaluate("if (window.noLoop) noLoop()")

    def seek_shot(t, path):
        pg.evaluate("window.__frameReady = false")
        pg.evaluate(f"window.__seek({t})")
        pg.wait_for_function("window.__frameReady === true", timeout=5000)
        pg.screenshot(path=path)
        return md5(path)

    # --- 2b. determinism B: seek twice, no reload ---
    hb1 = seek_shot(2.5, f"{OUT}/b1.png")
    hb2 = seek_shot(2.5, f"{OUT}/b2.png")
    print("B seek-vs-seek:  ", "IDENTICAL" if hb1 == hb2 else f"MISMATCH {hb1} vs {hb2}")

    # --- 2c. determinism C: ?t= reload vs __seek ---
    print("C reload-vs-seek:", "IDENTICAL" if ha1 == hb1 else f"MISMATCH {ha1} vs {hb1}")

    # --- state sanity: labels exist, values move with seeks ---
    info = pg.evaluate("""() => ({
        labels: Object.entries(tl.labels).map(([n, t]) => n + '@' + t),
        dur: tl.duration(),
        s1: JSON.stringify({bobY: state.bobY.toFixed(3), breath: state.breath.toFixed(3),
                            blink: state.blink.toFixed(3), glow: state.glowPulse.toFixed(3)}),
    })""")
    print("labels:", info["labels"])
    print("timeline duration:", info["dur"])
    pg.evaluate("window.__seek(1.0)")
    s_a = pg.evaluate("JSON.stringify({bobY: state.bobY.toFixed(4), blink: state.blink.toFixed(4)})")
    pg.evaluate("window.__seek(1.0)")
    s_b = pg.evaluate("JSON.stringify({bobY: state.bobY.toFixed(4), blink: state.blink.toFixed(4)})")
    pg.evaluate("window.__seek(3.0)")
    s_c = pg.evaluate("JSON.stringify({bobY: state.bobY.toFixed(4), blink: state.blink.toFixed(4)})")
    print("state @1.0:", s_a)
    print("state @1.0 again:", s_b, "->", "SAME" if s_a == s_b else "DIFFERENT!")
    print("state @3.0:", s_c, "->", "MOVED" if s_c != s_a else "STUCK!")

    # --- 3. fast path: 48 frames, one page, __seek per frame ---
    N, FPS = 48, 24
    t0 = time.time()
    for i in range(N):
        seek_shot(i / FPS, f"{OUT}/f{i:04d}.png")
    dt = time.time() - t0
    print(f"fast path: {N} frames in {dt:.1f}s = {dt / N:.3f}s/frame")
    b.close()

print("JS errors:", errors if errors else "none")
