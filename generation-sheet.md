# Generation Sheet — THE MERIDIAN (lab/004 · JOURNEY/TOUR · keyframe chain)
Backend: Seedance 2.0 on the Higgsfield MCP · std · 1080p · 16:9 · no audio · 8–10 s/clip.

**The authoritative prompt set lives in [lab/004-MERIDIAN-MEDIA-GUIDE.md](../004-MERIDIAN-MEDIA-GUIDE.md)**
(self-contained, paste-ready, 2–3 variations per keyframe). This sheet records the contract only.

## The keyframe law
```
K0 ──J1──▶ K1 ──J2──▶ K2 ──J3──▶ K3 ──J4──▶ K4     (5 stills bracket 4 clips)
```
- GATE 1 = the 5-keyframe SET (approve together: same tower, same grade, light only moves
  dusk→night forward). K0 = hero identity image, attached to every other generation.
- GATE 2 = clips, each with `start_image = K(i-1)`, `end_image = K(i)` — endpoints locked,
  drift impossible, 1 take each (2 max on J1/J4).
- Stills absorb ALL iteration. Video is generated ONCE — per-pitch reskins never touch it.

## Approval
Gate 1 (keyframe set): [ ] Russ    Gate 2 (clips): [ ] Russ

## Delivery — drop EXACTLY these names into `lab/004-meridian/assets-in/`
`K0_hero.jpg · K1_arrival.jpg · K2_living.jpg · K3_doors.jpg · K4_terrace.jpg`
`J1_Approach.mp4 · J2_Arrival.mp4 · J3_Flow.mp4 · J4_Terrace.mp4`
Optional extras (used if present): `still_living.jpg · still_kitchen.jpg · still_suite.jpg ·
still_agent.jpg` (space cards + agent portrait; otherwise frames from clips are used).

→ then run **lab/004-INGEST-PROMPT.md** in a fresh context window.

## NEEDED — 2026-07-16 (join 2 bridging clip)

**Problem:** the restaurant→dining seam (delivered clips `Drone_POV_through_restaurant_…` →
`Drone_POV_through_dining_room_…`) has no matching frame pair — full 20×20 RMSE matrix is flat
at 57–66 (a scale/framing disagreement: restaurant clip ends tracking TOWARD the buffet wide,
dining clip starts CLOSE-IN on the roast, lower camera). Optical-flow in-betweens produce
visible mush (verified). Currently shipped as a hard frame-locked cut. To make this seam a true
continuous move, one short bridging clip is needed:

**`J2b_BuffetApproach.mp4` — 4–6 s, 1080p, 16:9, no audio.**
- `start_image` = LAST frame of the restaurant clip (wide buffet view from the entrance side,
  candlelit, steam rising; extract: `ingest-tmp/c2/f0073.webp`).
- `end_image` = FIRST frame of the dining clip (close on the roast board, peppers right,
  fruit bowls behind; extract: `ingest-tmp/c3/f0001.webp`).
- Camera: one continuous slow push-in and slight lower-drop toward the roast — a dolly-in,
  NO cut, NO dissolve, no speed ramps. Same warm kitchen light, same steam.
- Both endpoint extracts attached as start/end images → seam frame-locks by construction.
