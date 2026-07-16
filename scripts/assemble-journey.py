#!/usr/bin/env python3
"""Re-extract Meridian journey frames at demo quality.

Chain (PSNR-proven order from LOG 2026-07-16):
  descent → restaurant → dining → resort-glide → suite-spa → sphere/aerial

Desktop: 8 fps / 1600px / WebP q62  (was 1152/q45 — soft on retina)
Mobile:  clips 1+6 @ 10 fps / 720 / q60
Joins:   6-frame motion crossfade (lab/002 pattern)
Trim:    suite-spa head -0.6s, tail -0.9s
Delogo:  cross 2-box over animated sparkle watermark @ ~1740,900 (1080p)
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

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

# Proven chain order (filenames ≠ contract names)
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

DESKTOP_W = 1600
DESKTOP_FPS = 8
DESKTOP_Q = 62
MOBILE_W = 720
MOBILE_FPS = 10
MOBILE_Q = 60
XFADE = 6


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd[-8:]))
    subprocess.run(cmd, check=True)


def extract(clip_id: str, src: Path, ss: float, to: float | None, width: int, fps: int, outdir: Path) -> list[Path]:
    outdir.mkdir(parents=True, exist_ok=True)
    for old in outdir.glob("*.webp"):
        old.unlink()
    vf = f"{DELOGO},fps={fps},scale={width}:-2:flags=lanczos"
    pattern = str(outdir / "f%04d.webp")
    cmd = [FFMPEG, "-y"]
    if ss > 0:
        cmd += ["-ss", str(ss)]
    cmd += ["-i", str(src)]
    if to is not None:
        # duration after -ss
        cmd += ["-t", str(max(0.1, to - ss))]
    cmd += ["-vf", vf, "-c:v", "libwebp", "-quality", str(DESKTOP_Q if width >= 1000 else MOBILE_Q), "-compression_level", "4", pattern]
    run(cmd)
    return sorted(outdir.glob("f*.webp"))


def blend_save(a: Image.Image, b: Image.Image, t: float, path: Path, q: int) -> None:
    img = Image.blend(a.convert("RGB"), b.convert("RGB"), t)
    img.save(path, quality=q, method=4)


def assemble(clip_frames: list[list[Path]], outdir: Path, q: int, xfade: int) -> int:
    if outdir.exists():
        shutil.rmtree(outdir)
    outdir.mkdir(parents=True)
    n = 0
    prev_last: Image.Image | None = None
    for ci, frames in enumerate(clip_frames):
        for fi, path in enumerate(frames):
            n += 1
            img = Image.open(path).convert("RGB")
            dest = outdir / f"frame_{n:04d}.webp"
            if prev_last is not None and fi < xfade:
                a = prev_last.resize(img.size, Image.Resampling.LANCZOS)
                t = (fi + 1) / (xfade + 1)
                blend_save(a, img, t, dest, q)
            else:
                img.save(dest, quality=q, method=4)
        prev_last = Image.open(frames[-1]).convert("RGB")
    # poster
    Image.open(clip_frames[0][0]).convert("RGB").save(outdir / "poster.webp", quality=80, method=4)
    return n


def main() -> int:
    if not Path(FFMPEG).exists():
        print("ffmpeg not found:", FFMPEG, file=sys.stderr)
        return 1

    if TMP.exists():
        shutil.rmtree(TMP)
    TMP.mkdir()

    desktop_clips: list[list[Path]] = []
    for cid, name, ss, to in CLIPS:
        src = VIDEOS / name
        if not src.exists():
            print("missing", src, file=sys.stderr)
            return 1
        frames = extract(cid, src, ss, to, DESKTOP_W, DESKTOP_FPS, TMP / cid)
        print(f"  {cid}: {len(frames)} frames from {name}")
        desktop_clips.append(frames)

    n = assemble(desktop_clips, OUT, DESKTOP_Q, XFADE)
    print(f"desktop frames: {n}")

    # mobile = c1 + c6 only
    mobile_clips: list[list[Path]] = []
    for cid, name, ss, to in (CLIPS[0], CLIPS[-1]):
        frames = extract(cid + "m", VIDEOS / name, ss, to, MOBILE_W, MOBILE_FPS, TMP / (cid + "m"))
        print(f"  mobile {cid}: {len(frames)} frames")
        mobile_clips.append(frames)
    m = assemble(mobile_clips, OUTM, MOBILE_Q, 10)
    print(f"mobile frames: {m}")

    # payload report
    total = sum(p.stat().st_size for p in OUT.glob("frame_*.webp"))
    print(f"desktop payload: {total / 1e6:.1f} MB")
    print("UPDATE skin.ts counts ->", n, "/", m)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
