"""Render docs/logo.gif — the README header animation.

    python3 docs/logo.py

Story: four nodes land, edges draw, one node gets dragged and the edges
re-route (the thing this repo is for), wordmark settles, loop.
Palette and easing come from skills/clean-diagram/assets/editorial-dark.css.
"""
import math, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, SS = 480, 250, 3          # output size, supersample factor
FPS, DUR = 25, 3.2              # loop length in seconds

BG      = (10, 10, 11)
PANEL   = (19, 20, 22)
FG      = (243, 242, 239)
SUB     = (151, 150, 143)
ACCENT  = (193, 68, 44)
LINE    = (243, 242, 239, 46)   # hairline
STRONG  = (243, 242, 239, 92)

MONO  = "/System/Library/Fonts/Menlo.ttc"
f_lbl = ImageFont.truetype(MONO, 10 * SS)
f_word = ImageFont.truetype(MONO, 15 * SS, index=1)

NODES = [  # cx, cy, label, is_entry
    (86, 66, "app", True),
    (222, 66, "api", False),
    (222, 128, "queue", False),
    (358, 128, "store", False),
]
EDGES = [(0, 1), (1, 2), (2, 3), (0, 2)]
NW, NH, NR = 76, 26, 5
DRAG_TO = (150, 174)            # where node 2 gets pulled

# timeline (ms)
T_NODE, T_NODE_STEP, T_NODE_DUR = 60, 90, 380
T_EDGE, T_EDGE_STEP, T_EDGE_DUR = 620, 90, 340
T_CUR_IN, T_DRAG, T_DRAG_DUR, T_CUR_OUT = 1050, 1250, 650, 1950
T_WORD, T_WORD_DUR, T_FADE = 1600, 400, 2850


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def seg(ms, start, dur): return clamp((ms - start) / dur)
def ease_out(t): return 1 - (1 - t) ** 4
def ease_back(t, s=0.35):
    t -= 1
    return 1 + (s + 1) * t ** 3 + s * t ** 2


def px(*v): return tuple(x * SS for x in v)


def new_layer(): return Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))


def blend(base, lay, a):
    if a <= 0.001:
        return base
    if a < 0.999:
        lay = lay.copy()
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * a)))
    return Image.alpha_composite(base, lay)


def node_rect(cx, cy):
    return [cx - NW / 2, cy - NH / 2, cx + NW / 2, cy + NH / 2]


def border_point(cx, cy, tx, ty, pad=4):
    """Where the line from (cx,cy) toward (tx,ty) leaves the node box."""
    dx, dy = tx - cx, ty - cy
    if dx == 0 and dy == 0:
        return cx, cy
    hw, hh = NW / 2 + pad, NH / 2 + pad
    sx = hw / abs(dx) if dx else 1e9
    sy = hh / abs(dy) if dy else 1e9
    s = min(sx, sy)
    return cx + dx * s, cy + dy * s


def draw_node(d, cx, cy, label, entry, glow=0.0):
    x0, y0, x1, y1 = node_rect(cx, cy)
    stroke = ACCENT if (entry or glow > 0) else None
    if glow > 0:  # dragged: accent halo
        d.rounded_rectangle(px(x0 - 3, y0 - 3, x1 + 3, y1 + 3), radius=(NR + 3) * SS,
                            outline=ACCENT + (int(70 * glow),), width=SS)
    d.rounded_rectangle(px(x0, y0, x1, y1), radius=NR * SS,
                        fill=PANEL + (255,),
                        outline=(stroke + (200,)) if stroke else STRONG,
                        width=SS if not stroke else int(1.4 * SS))
    if entry or glow > 0:
        d.rounded_rectangle(px(x0, y0, x1, y1), radius=NR * SS, fill=ACCENT + (34,))
    tw = d.textlength(label, font=f_lbl)
    d.text((cx * SS - tw / 2, cy * SS - 5.5 * SS), label, font=f_lbl,
           fill=(FG if (entry or glow > 0) else SUB) + (255,))


def draw_edge(d, a, b, p):
    """p = 0..1 draw progress."""
    if p <= 0:
        return
    ax, ay = border_point(*a, *b)
    bx, by = border_point(*b, *a)
    ex, ey = ax + (bx - ax) * p, ay + (by - ay) * p
    d.line(px(ax, ay, ex, ey), fill=SUB + (215,), width=SS)
    if p > 0.88:  # arrowhead settles last
        ang = math.atan2(by - ay, bx - ax)
        s, a2 = 5.0, 0.42
        d.polygon([px(ex, ey),
                   px(ex - s * math.cos(ang - a2), ey - s * math.sin(ang - a2)),
                   px(ex - s * math.cos(ang + a2), ey - s * math.sin(ang + a2))],
                  fill=SUB + (int(255 * (p - 0.88) / 0.12),))


def draw_cursor(d, x, y):
    p = [(0, 0), (0, 13), (3.4, 9.8), (5.8, 15), (8.1, 14), (5.7, 9.1), (10, 8.8)]
    pts = [px(x + a, y + b) for a, b in p]
    d.polygon(pts, fill=FG + (255,), outline=BG + (255,))


def background():
    img = Image.new("RGBA", (W * SS, H * SS), BG + (255,))
    glow = new_layer()
    ImageDraw.Draw(glow).ellipse(px(60, 20, 420, 210), fill=ACCENT + (22,))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(40 * SS)))
    dots = new_layer()
    dd = ImageDraw.Draw(dots)
    for gx in range(12, W, 16):
        for gy in range(12, H, 16):
            dd.ellipse(px(gx, gy, gx + 1.0, gy + 1.0), fill=FG + (38,))
    img = blend(img, dots, 1.0)
    return img


def frame_at(ms, bg):
    pos, alpha, glow = [], [], [0.0] * len(NODES)
    for i, (cx, cy, _, _) in enumerate(NODES):
        t = seg(ms, T_NODE + i * T_NODE_STEP, T_NODE_DUR)
        e = ease_out(t)
        pos.append([cx, cy + 12 * (1 - e)])
        alpha.append(t)
    dt = seg(ms, T_DRAG, T_DRAG_DUR)
    if dt > 0:
        e = ease_back(dt)
        sx, sy = NODES[2][0], NODES[2][1]
        arc = -14 * math.sin(math.pi * dt)          # lift on the way over
        pos[2] = [sx + (DRAG_TO[0] - sx) * e, sy + (DRAG_TO[1] - sy) * e + arc]
        glow[2] = 1.0 if dt < 1 else clamp(1 - seg(ms, T_DRAG + T_DRAG_DUR, 220))

    content = new_layer()
    lay = new_layer(); d = ImageDraw.Draw(lay)
    for i, (a, b) in enumerate(EDGES):
        p = ease_out(seg(ms, T_EDGE + i * T_EDGE_STEP, T_EDGE_DUR))
        draw_edge(d, pos[a], pos[b], p)
    content = blend(content, lay, 1.0)

    for i, (_, _, label, entry) in enumerate(NODES):
        lay = new_layer()
        draw_node(ImageDraw.Draw(lay), pos[i][0], pos[i][1], label, entry, glow[i])
        content = blend(content, lay, alpha[i])

    ca = clamp(seg(ms, T_CUR_IN, 200) - seg(ms, T_CUR_OUT, 220))
    if ca > 0:
        lay = new_layer()
        draw_cursor(ImageDraw.Draw(lay), pos[2][0] + 16, pos[2][1] + 2)
        content = blend(content, lay, ca)

    wt = seg(ms, T_WORD, T_WORD_DUR)
    if wt > 0:
        lay = new_layer(); d = ImageDraw.Draw(lay)
        word, track = "clean-diagram", 1.6 * SS
        wid = sum(d.textlength(c, font=f_word) + track for c in word) - track
        x, y = (W * SS - wid) / 2, (216 - 6 * (1 - ease_out(wt))) * SS
        for c in word:
            d.text((x, y), c, font=f_word, fill=FG + (255,))
            x += d.textlength(c, font=f_word) + track
        uw = wid * ease_out(seg(ms, T_WORD + 100, 420))
        d.rectangle([(W * SS - wid) / 2, y + 21 * SS,
                     (W * SS - wid) / 2 + uw, y + 21 * SS + 1.6 * SS], fill=ACCENT + (255,))
        content = blend(content, lay, wt)

    out = blend(bg, content, 1 - seg(ms, T_FADE, DUR * 1000 - T_FADE))
    return out.convert("RGB").resize((W, H), Image.LANCZOS)


def main():
    bg = background()
    n = int(FPS * DUR)
    here = os.path.dirname(os.path.abspath(__file__))
    with tempfile.TemporaryDirectory() as tmp:
        for i in range(n):
            frame_at(i * 1000 / FPS, bg).save(f"{tmp}/f{i:03d}.png")
        out = os.path.join(here, "logo.gif")
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS),
            "-i", f"{tmp}/f%03d.png",
            "-vf", "split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];"
                   "[b][p]paletteuse=dither=bayer:bayer_scale=4",
            "-loop", "0", out], check=True)
    print(out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
