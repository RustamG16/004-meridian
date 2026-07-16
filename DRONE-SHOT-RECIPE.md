# No-cut drone shot recipe — lab/004 J1 THE APPROACH (sky → restaurant entrance)
*Why Veo dissolved, and the ladder that fixes it. Applies to ANY long camera move, any model.*

## Autopsy of the failed take (`Drone_shot_for_website_202607151605.mp4`)
Frame extraction (2fps contact sheet) shows exactly what happened:
- **0–4 s:** near-static wide aerial (camera barely moves)
- **4–6.5 s:** a long **cross-dissolve** — two compositions ghosted over each other; the sky
  even changes from ember-sunset to grey overcast mid-"shot"
- **6.5–8 s:** a separately composed entrance close-up

Veo didn't cut *maliciously* — it **could not connect the endpoints with camera motion**, so it
fell back on the film grammar it learned: a dissolve. Neither prompt could have fixed this;
the request itself was impossible for one clip.

## Why models insert transitions (the three killers)
1. **Travel budget exceeded.** One 8–10 s clip can execute ONE modest camera move. Sky-wide →
   door-level is ~300 m of travel, a big pitch change, and a ~30–50× subject-scale change.
   When start and end can't be connected geometrically, interpolation degenerates into a
   dissolve/morph (exactly the ghosting in the failed take).
2. **Endpoint frames disagree.** The wide master has an ember-sunset sky; the entrance master
   is blue-hour overcast. Different sky/grade between first and last frame makes real motion
   interpolation impossible → dissolve is guaranteed *before the camera even matters*.
3. **Language invites editing grammar.** "zoom", "transition", "scroll animated website",
   "start frame and end frame" prime edit-speak; negations ("zero cuts, no transitions") are
   the weakest instruction type — models under-weight negatives. Say what the camera DOES,
   positively: "one unbroken take, slow forward dolly descent at constant speed."

## THE FIX — keyframe ladder (the 004 keyframe law, applied INSIDE the shot)
Never ask one clip to fly the whole route. Split the flight path into hops where every
adjacent keyframe pair is *interpolatable*:

```
KA (sky wide) ──8s──▶ KB (mid approach) ──8s──▶ KC (over water gardens) ──8s──▶ KD (entrance)
```

**The hop rule (add to every generation sheet):**
- adjacent keyframes must share **≥ 2/3 of their visual content**
- subject scale change **≤ 3× per hop**
- **identical sky, weather, grade** across the whole ladder — derive every intermediate
  keyframe FROM the master image (image-to-image with hero attached / camera-moves-closer
  edit / crop+outpaint), never a fresh text generation
- ONE camera move per hop, constant speed, stated positively; name what must NOT change
- clip N's end frame IS clip N+1's start frame (fencepost law) → the joins are pixel-locked,
  the stitch is invisible by construction

Stitch losslessly (`ffmpeg concat` demuxer, no re-encode) → one continuous `J1_Approach.mp4`
→ extract frames per the JOURNEY budget as usual.

## Ladder for THE MERIDIAN approach (Alpine setting, 3 hops)
First fix the grade conflict: **pick ONE sky** (recommend the ember-dusk of the wide master —
matches ink #0A0D13 + champagne #D5BE86) and regenerate the entrance keyframe to match it.

### Keyframes (Gate 1 — approve as a set, 2–3 variations each)
**KA · sky wide (start; re-use/re-grade existing wide master):**
> High aerial photograph at dusk over an Alpine lake: a lakeside luxury resort with green-roofed
> pavilion and wooden spa wings, warm champagne window light, dark infinity pool glowing; snow
> mountains and ember-orange sunset remnants on the horizon, ink-blue sky. The resort occupies
> the lower third, lake and peaks dominate. Editorial, film grain, no people, no readable text.

**KB · mid approach (derive from KA):**
> Same scene, same dusk sky and grade as the attached master, camera ~3× closer and lower:
> three-quarter aerial of the resort, the white-and-stone restaurant pavilion with green roof
> and onion-dome tower now in the left third at readable scale, water gardens and paths lit
> below, lake behind. Identical lighting, identical weather. No people, no text.

**KC · over the water gardens (derive from KB):**
> Same scene, same sky and grade, camera ~3× closer again, gliding low over the illuminated
> water gardens and stone paths toward the restaurant pavilion: the facade fills the upper half
> of frame, carved wooden entrance doors visible between the two towers, champagne light from
> the windows. Identical dusk grade. No people, no readable text yet.

**KD · the entrance (end; regenerate existing entrance master WITH the KA sky):**
> Head-on dusk photograph of the restaurant facade: white walls, green shingle roof, stone tower
> with onion dome, carved double wooden doors glowing warm at center, "MERIDIAN" lettering on
> the roof, manicured shrubs and path lights in the foreground, lake and mountains dim behind.
> SAME ember-dusk sky and grade as the attached KA master — not overcast. No people.

### Clips (Gate 2 — each `start_image = K(i)`, `end_image = K(i+1)`, 8 s, 1 take)
Template (adjust nouns per hop):
> Start frame and end frame attached — both are the SAME location seconds apart. One unbroken
> aerial take: the camera dollies forward and descends at constant speed from the start
> composition to the end composition. Single continuous motion, no speed changes. The buildings,
> sky, lighting and weather do not change; only the camera moves. Wind barely stirs the trees,
> window light flickers warm. Filmed in one take.

Never write: zoom, transition, cut, scene, morph, website, scroll.

### Verification (before accepting ANY clip)
```
ffmpeg -i clip.mp4 -vf "fps=2,scale=640:-1" f%02d.jpg   # contact sheet
```
- ghosting/double-exposure in any frame = dissolve → RETAKE
- sky/weather shift mid-clip = drift → RETAKE
- `ffprobe select=gt(scene,0.3)` should return zero scene changes
- after stitching: step through the two join frames — they must be identical pixels

## Anti-fade insurance (if a hop still dissolves)
Interpolation can cheat even on a legal hop. Two escalation levels:
1. **Retake rule:** contact-sheet every take; ghosting = reject. Cheap, usually enough.
2. **Forward chaining (dissolve-proof):** drop end frames entirely — start frame + camera
   instruction only, then use the clip's LITERAL last frame as the next clip's start frame.
   No interpolation target = no dissolve, structurally. Tradeoff: endpoint drift — steer via
   prompt, pick hops from takes. In Flow this is exactly the **Extend** button (7 s hops,
   same take, up to 20×) — the Veo-native answer to this problem.

## Nano Banana keyframe prompts (KB/KC derived from KA; chain, don't jump)
Rules: "re-photograph from a new camera position" (never "zoom"); state the move as a physical
camera relocation; hammer "identical — nothing changes but the camera"; always attach the
PREVIOUS keyframe (+ KA for grade), generate stepwise.

**KB (attach KA):**
> This is a real location. Re-photograph the exact same Alpine lakeside resort from a drone
> position 3× closer and lower, moved toward the white restaurant pavilion with the green roof
> and onion-dome tower on the left. Same lens. Identical ember-dusk sky, identical clouds,
> identical warm champagne window lighting, identical landscaping and architecture — nothing
> about the scene changes, only the camera position. The pavilion now occupies the left third
> at readable scale; water gardens and stone paths visible below; lake and snow mountains
> behind. Photorealistic aerial photograph, 16:9.

**KC (attach KB + KA):**
> Same scene, same dusk moment. Move the camera 3× closer again, descending to ~15 m above the
> illuminated water gardens, aimed at the restaurant pavilion: its facade fills the upper half
> of the frame, the carved double wooden doors visible between the two towers, stone path
> leading toward them in the foreground. Identical sky, lighting, architecture and vegetation
> as the reference images — only the camera has moved. 16:9.

**KD (attach entrance master + KA — re-light only):**
> Keep this facade photograph exactly as it is — same composition, same buildings, same
> "MERIDIAN" roof lettering — but re-light it to match the second reference image: ember-dusk
> sky with the last orange of sunset behind the mountains, deep ink-blue above, warmer
> champagne glow from windows and path lights. Change only the sky and light grade, nothing else.

## Backend routes
- **Seedance 2.0 / Higgsfield MCP (declared 004 backend):** native first+last frame per hop;
  attach KA to every generation as grade/architecture reference. Preferred.
- **Veo 3.1 / Flow:** either "Frames to Video" per hop with the ladder keyframes, or generate
  hop 1 and use **Extend** (7 s hops, continues the same take) with prompts that reference the
  ongoing motion ("maintaining the same forward descent…"). Avoid a single distant
  first/last pair — that is what produced the dissolve.
- **Also on the Higgsfield MCP:** Seedance 2.0 does up to 15 s/clip (whole route in 2 hops);
  Kling 3.0 Turbo (start-frame, 15 s); Cinema Studio Video (start+end frame, camera-focused).
- **Off-MCP, best explicit camera-path control (2026):** Runway Gen-4.5, Luma Ray3.
- **Nuclear option (dissolve-proof, heavy):** master image → 3D scene (splat), render a real
  camera path — deterministic and scrub-perfect; consider if this recurs across archetypes.
