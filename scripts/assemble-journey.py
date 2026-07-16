#!/usr/bin/env python3
"""Extract + assemble the Meridian journey frames. NO CROSSFADES (law: one-continuous-video).

Chain (PSNR-proven order from LOG 2026-07-16):
  descent -> restaurant -> dining -> resort-glide -> suite-spa -> sphere/aerial

Desktop: 8 fps / 1920px (native source width) / WebP q75
Mobile:  FULL tour / 8 fps / 720px / q60  (was clips 1+6 with a 10-frame dissolve — law violation
         + broken story: HUD said RESTAURANT/SPA while showing sky)

Joins:   hard, frame-locked. Per join we search the last SEARCH x first SEARCH frames for the
         best-matching pair (min RMSE, grayscale 320px) and trim both sides to that pair.
         If the best pair is still above BRIDGE_RMSE, we synthesize BRIDGE_N REAL in-between
         frames with ffmpeg minterpolate (optical flow — motion, never opacity).
Trim:    suite-spa head -0.6s, tail -0.9s
Delogo:  cross 2-box over animated sparkle watermark @ ~1740,900 (1080p)
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
VIDEOS = ROOT / "assets-in" / "VIDEOS"
TMP = ROOT / "ingest-tmp"
OUT = ROOT / "site" / "public" / "frames" / "hero"
OUTM = ROOT / "site" / "public" / "frames" / "hero-mobile"

FFMPEG = os.environ.get(
    "FFMPEG",
    r"C:\Users\Rustam Gurbanov\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe",
)

# Proven chain order (filenames != contract names)
CLIPS = [
    ("c1", "Drone_POV_forward_descent_1080p_202607160056.mp4", 0.0, None),
    ("c2", "Drone_POV_through_restaurant_1080p_202607152008.mp4", 0.0, None),
    ("c3", "Drone_POV_through_dining_room_202607160224.mp4", 0.0, None),
    ("c4", "Camera_glide_through_resort_1080p_202607160229.mp4", 0.0, None),
    ("c5", "Camera_glides_through_suite_spa_202607160248.mp4", 0.6, 9.1),  # head-0.6 / tail-0.9 on 10s
    ("c6", "Camera_moves_through_glass_sphere_202607160316.mp4", 0.0, None),
]

# Cross-shaped delogo covering the sparkle watermark (1080p; measured ~1633,888 + LOG ~1740,900)
DELOGO = "delogo=x=1600:y=860:w=280:h=80:show=0,delogo=x=1680:y=820:w=80:h=180:show=0"

FPS = 8
DESKTOP_W = 1920
DESKTOP_Q = 75
MOBILE_W = 720
MOBILE_Q = 60
SEARCH = 8              # pair-search window on each side of a join
BRIDGE_RMSE = 30.0      # above this, the hard join pops -> synthesize optical-flow in-betweens
BRIDGE_MAX_RMSE = 55.0  # above this, optical flow produces mush (verified on join 2) ->
                        # hard join + the seam needs a real bridging CLIP (generation-sheet)
BRIDGE_N = 4            # real in-between frames per bridged join


def run(cmd: list[str]) -> None:
    print("+", " ".join(str(c) for c in cmd[-8:]))
    subprocess.run([str(c) for c in cmd], check=True, capture_output=True)


def extract(clip_id: str, src: Path, ss: float, to: float | None, width: int, q: int, outdir: Path) -> list[Path]:
    if os.environ.get("REUSE") == "1" and outdir.exists():
        cached = sorted(outdir.glob("f*.webp"))
        if cached:
            return cached
    outdir.mkdir(parents=True, exist_ok=True)
    for old in outdir.glob("*.webp"):
        old.unlink()
    vf = f"{DELOGO},fps={FPS},scale={width}:-2:flags=lanczos"
    pattern = str(outdir / "f%04d.webp")
    cmd = [FFMPEG, "-y"]
    if ss > 0:
        cmd += ["-ss", str(ss)]
    cmd += ["-i", str(src)]
    if to is not None:
        cmd += ["-t", str(max(0.1, to - ss))]
    cmd += ["-vf", vf, "-c:v", "libwebp", "-quality", str(q), "-compression_level", "4", pattern]
    run(cmd)
    return sorted(outdir.glob("f*.webp"))


def gray(path: Path, w: int = 320) -> np.ndarray:
    img = Image.open(path).convert("L")
    h = round(img.height * w / img.width)
    return np.asarray(img.resize((w, h), Image.Resampling.BILINEAR), dtype=np.float64)


def rmse(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.sqrt(np.mean((a - b) ** 2)))


def best_pair(prev: list[Path], nxt: list[Path]) -> tuple[int, int, float]:
    """Return (index into prev, index into nxt, rmse) for the best-matching join pair."""
    pa = [gray(p) for p in prev[-SEARCH:]]
    pb = [gray(p) for p in nxt[:SEARCH]]
    best = (len(prev) - 1, 0, float("inf"))
    for i, a in enumerate(pa):
        for j, b in enumerate(pb):
            d = rmse(a, b)
            if d < best[2]:
                best = (len(prev) - SEARCH + i, j, d)
    return best


def bridge(prev: list[Path], nxt: list[Path], ai: int, bi: int,
           tag: str, outdir: Path, width: int, q: int) -> list[Path]:
    """Synthesize BRIDGE_N REAL in-between frames (optical flow), never an opacity blend.

    minterpolate needs motion context: we feed a 6-frame mini-clip (3 tail frames of the
    previous clip + 3 head frames of the next) at the tour fps, interpolate (BRIDGE_N+1)x,
    and keep only the synthesized frames strictly between the join pair A|B."""
    CTX = 3
    ins = prev[max(0, ai - CTX + 1):ai + 1] + nxt[bi:bi + CTX]
    a_pos = len(prev[max(0, ai - CTX + 1):ai + 1]) - 1  # index of A within the mini-clip
    work = outdir / "_bridge"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    for k, p in enumerate(ins):
        Image.open(p).convert("RGB").save(work / f"p{k:02d}.png")
    factor = BRIDGE_N + 1
    run([FFMPEG, "-y", "-framerate", str(FPS), "-i", str(work / "p%02d.png"),
         "-vf", f"minterpolate=fps={FPS * factor}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1",
         "-start_number", "0", str(work / "o%03d.png")])
    outs = sorted(work.glob("o*.png"))
    lo = a_pos * factor + 1  # first synthesized frame after A
    picks = outs[lo:lo + BRIDGE_N]
    frames = []
    for k, p in enumerate(picks):
        img = Image.open(p).convert("RGB")
        if img.width != width:
            img = img.resize((width, round(img.height * width / img.width)), Image.Resampling.LANCZOS)
        dest = outdir / f"bridge_{tag}_{k}.webp"
        img.save(dest, quality=q, method=4)
        frames.append(dest)
    return frames


def assemble(clip_frames: list[list[Path]], joins: list[tuple[int, int, float]],
             outdir: Path, width: int, q: int, make_bridges: bool) -> tuple[int, list[str]]:
    if outdir.exists():
        shutil.rmtree(outdir)
    outdir.mkdir(parents=True)
    report: list[str] = []
    seq: list[Path] = []
    for ci, frames in enumerate(clip_frames):
        start = 0 if ci == 0 else joins[ci - 1][1]
        end = len(frames) - 1 if ci == len(clip_frames) - 1 else joins[ci][0]
        part = frames[start:end + 1]
        if ci > 0:
            ai, bi, d = joins[ci - 1]
            if d > BRIDGE_MAX_RMSE:
                report.append(f"join {ci}: pair ({ai},{bi}) rmse {d:.1f} -> hard join, SOURCE DISAGREEMENT (needs bridging clip)")
            elif d > BRIDGE_RMSE and make_bridges:
                tag = f"{clip_frames[ci][0].parent.name}"
                br = bridge(clip_frames[ci - 1], clip_frames[ci], ai, bi, tag, TMP, width, q)
                seq.extend(br)
                report.append(f"join {ci}: pair ({ai},{bi}) rmse {d:.1f} -> BRIDGED ({len(br)} flow frames)")
            else:
                report.append(f"join {ci}: pair ({ai},{bi}) rmse {d:.1f} -> hard join")
        seq.extend(part)
    n = 0
    for p in seq:
        n += 1
        shutil.copyfile(p, outdir / f"frame_{n:04d}.webp")
    Image.open(seq[0]).convert("RGB").save(outdir / "poster.webp", quality=80, method=4)
    return n, report


def main() -> int:
    if not Path(FFMPEG).exists():
        print("ffmpeg not found:", FFMPEG, file=sys.stderr)
        return 1

    desktop: list[list[Path]] = []
    mobile: list[list[Path]] = []
    for cid, name, ss, to in CLIPS:
        src = VIDEOS / name
        if not src.exists():
            print("missing", src, file=sys.stderr)
            return 1
        d = extract(cid, src, ss, to, DESKTOP_W, DESKTOP_Q, TMP / cid)
        m = extract(cid + "m", src, ss, to, MOBILE_W, MOBILE_Q, TMP / (cid + "m"))
        print(f"  {cid}: {len(d)} desktop / {len(m)} mobile frames from {name}")
        desktop.append(d)
        mobile.append(m)

    # Join pairs are computed ONCE on desktop frames; the same fps means the same
    # indices apply to mobile, keeping the two tours frame-aligned.
    joins = [best_pair(desktop[i], desktop[i + 1]) for i in range(len(desktop) - 1)]

    n, report = assemble(desktop, joins, OUT, DESKTOP_W, DESKTOP_Q, make_bridges=True)
    for line in report:
        print("  desktop", line)
    print(f"desktop frames: {n}")

    m, mreport = assemble(mobile, joins, OUTM, MOBILE_W, MOBILE_Q, make_bridges=True)
    print(f"mobile frames: {m}")

    total = sum(p.stat().st_size for p in OUT.glob("frame_*.webp"))
    totalm = sum(p.stat().st_size for p in OUTM.glob("frame_*.webp"))
    print(f"desktop payload: {total / 1e6:.1f} MB   mobile payload: {totalm / 1e6:.1f} MB")
    print("skin.ts fallback counts ->", n, "/", m, "(index.astro reads the real counts from disk)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
