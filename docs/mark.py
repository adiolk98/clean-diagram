"""Render docs/mark.gif — the README logo mark (concept 01, "flow").

    python3 docs/mark.py

Two nodes draw themselves, an edge elbows between them, one accent dot runs
the edge twice. Icon only — the wordmark lives in docs/logo.gif below it.
Palette from skills/clean-diagram/assets/editorial-dark.css.
"""
import math, os, subprocess, tempfile
from PIL import Image, ImageDraw

W = H = 200
SS = 4                      # supersample
FPS, DUR = 25, 3.0

BG     = (10, 10, 11)
FG     = (243, 242, 239)
SUB    = (151, 150, 143)
ACCENT = (193, 68, 44)
LINE   = (243, 242, 239, 40)

# art is authored in the 120x120 viewBox of the proposal sheet
S, OX, OY = 1.5, 31 - 14 * 1.5, 50 - 22 * 1.5


def m(x, y): return (OX + x * S, OY + y * S)


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def seg(ms, start, dur): return clamp((ms - start) / dur)
def ease_out(t): return 1 - (1 - t) ** 4
def ease_in_out(t): return 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2


def rrect_pts(x, y, w, h, r, step=0.6):
    """Rounded-rect outline as a point list, clockwise from the top edge."""
    pts = [(x + r, y)]

    def line(qx, qy):
        px, py = pts[-1]
        n = max(2, int(math.hypot(qx - px, qy - py) / step))
        pts.extend((px + (qx - px) * i / n, py + (qy - py) * i / n) for i in range(1, n + 1))

    def arc(cx, cy, a0, a1):
        n = max(3, int(r * math.radians(abs(a1 - a0)) / step))
        for i in range(1, n + 1):
            a = math.radians(a0 + (a1 - a0) * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))

    line(x + w - r, y);          arc(x + w - r, y + r, -90, 0)
    line(x + w, y + h - r);      arc(x + w - r, y + h - r, 0, 90)
    line(x + r, y + h);          arc(x + r, y + h - r, 90, 180)
    line(x, y + r);              arc(x + r, y + r, 180, 270)
    return [m(px, py) for px, py in pts]


def elbow_pts(pts, r=5, step=0.7):
    """Polyline with rounded corners, sampled."""
    out = []
    for i in range(len(pts) - 1):
        (ax, ay), (bx, by) = pts[i], pts[i + 1]
        d = math.hypot(bx - ax, by - ay)
        a0 = r if i > 0 else 0
        a1 = r if i < len(pts) - 2 else 0
        n = max(2, int(d / step))
        for j in range(n + 1):
            k = (a0 + (d - a0 - a1) * j / n) / d
            out.append((ax + (bx - ax) * k, ay + (by - ay) * k))
        if i < len(pts) - 2:                      # quarter-round the corner
            (cx, cy) = pts[i + 1]
            (nx, ny) = pts[i + 2]
            nd = math.hypot(nx - cx, ny - cy)
            for j in range(1, 7):
                t = j / 6
                p0 = out[-1]
                p2 = (cx + (nx - cx) * r / nd, cy + (ny - cy) * r / nd)
                out.append(((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * cx + t ** 2 * p2[0],
                            (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * cy + t ** 2 * p2[1]))
    return [m(px, py) for px, py in out]


def stroke(d, pts, p, color, width, cap=True):
    """Draw the first p of a point list, with a round tip."""
    if p <= 0:
        return
    n = max(2, int(len(pts) * p))
    seq = [(x * SS, y * SS) for x, y in pts[:n]]
    d.line(seq, fill=color + (255,), width=int(width * SS), joint="curve")
    if cap:
        for x, y in (seq[0], seq[-1]):
            r = width * SS / 2
            d.ellipse([x - r, y - r, x + r, y + r], fill=color + (255,))


def along(pts, p):
    """Point at fraction p of a polyline, by arc length."""
    segs = [math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
            for i in range(len(pts) - 1)]
    target, run = sum(segs) * clamp(p), 0.0
    for i, s in enumerate(segs):
        if run + s >= target:
            k = (target - run) / s if s else 0
            return (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k,
                    pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k)
        run += s
    return pts[-1]


NODE_A = rrect_pts(14, 22, 52, 30, 8)
NODE_B = rrect_pts(60, 60, 46, 28, 8)
EDGE = elbow_pts([(40, 52), (40, 74), (53, 74)])

T_A, T_B, T_E, T_ARROW = 0, 180, 420, 900
T_DRAW = 550
DOT = [(1000, 800), (1850, 800)]     # start, duration — two runs
T_FADE = 2700


def new(): return Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))


def blend(base, lay, a):
    if a <= 0.001:
        return base
    if a < 0.999:
        lay = lay.copy()
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * a)))
    return Image.alpha_composite(base, lay)


def background():
    img = Image.new("RGBA", (W * SS, H * SS), BG + (255,))
    d = ImageDraw.Draw(img)
    d.rectangle([SS // 2, SS // 2, W * SS - SS, H * SS - SS], outline=LINE, width=SS)
    return img


def frame_at(ms, bg):
    lay = new()
    d = ImageDraw.Draw(lay)
    stroke(d, NODE_A, ease_out(seg(ms, T_A, T_DRAW)), FG, 3 * S, cap=False)
    stroke(d, NODE_B, ease_out(seg(ms, T_B, T_DRAW)), FG, 3 * S, cap=False)
    stroke(d, EDGE, ease_out(seg(ms, T_E, T_DRAW)), SUB, 2.2 * S)

    ap = ease_out(seg(ms, T_ARROW, 280))
    if ap > 0:
        tip, back = m(60, 74), 8 * S
        a = 0.42
        pts = [(tip[0] * SS, tip[1] * SS),
               ((tip[0] - back * math.cos(-a)) * SS, (tip[1] - back * math.sin(-a)) * SS),
               ((tip[0] - back * math.cos(a)) * SS, (tip[1] - back * math.sin(a)) * SS)]
        cx = sum(p[0] for p in pts) / 3, sum(p[1] for p in pts) / 3
        k = 0.6 + 0.4 * ap                       # small pop
        d.polygon([(cx[0] + (x - cx[0]) * k, cx[1] + (y - cx[1]) * k) for x, y in pts],
                  fill=SUB + (int(255 * ap),))

    for start, dur in DOT:
        t = seg(ms, start, dur)
        if 0 < t < 1:
            x, y = along(EDGE, ease_in_out(t))
            r = 3.6 * S * SS
            fade = min(1, t / .12, (1 - t) / .12)
            d.ellipse([x * SS - r, y * SS - r, x * SS + r, y * SS + r],
                      fill=ACCENT + (int(255 * fade),))

    out = blend(bg, lay, 1 - seg(ms, T_FADE, DUR * 1000 - T_FADE))
    return out.convert("RGB").resize((W, H), Image.LANCZOS)


def main():
    bg, n = background(), int(FPS * DUR)
    here = os.path.dirname(os.path.abspath(__file__))
    with tempfile.TemporaryDirectory() as tmp:
        for i in range(n):
            frame_at(i * 1000 / FPS, bg).save(f"{tmp}/f{i:03d}.png")
        out = os.path.join(here, "mark.gif")
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS),
            "-i", f"{tmp}/f%03d.png",
            "-vf", "split[a][b];[a]palettegen=max_colors=96:stats_mode=full[p];"
                   "[b][p]paletteuse=dither=bayer:bayer_scale=4",
            "-loop", "0", out], check=True)
    print(out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
