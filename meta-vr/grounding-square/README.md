# The Meltdown Room — Grounding Square VR

A standalone **unpublished competition prototype**, isolated under `meta-vr/grounding-square/`. It does not replace The Meltdown Room's production site or any founder-locked property artwork, and it makes no changes to the private 11S x S11 Founder Command Center.

## Features implemented in source

- Seated, stationary 3D garden with a front-facing set of large selectable buttons.
- Meta IWSDK `RayInteractable` + `Pressed`: browser clicks and WebXR ray/hand-pinch input.
- Guided 16-second activity: breathe in for 4 seconds, out for 4 seconds, twice.
- Collect four celestial symbols (Moon, Star, Sun, Comet) and see progress.
- Unlock the 11:11 reflection after **both** breathing and collecting are complete.
- Start-over and motion-toggle buttons; honors OS reduced-motion preference.
- No sign-in, health data, trackers, advertising, or medical claims.

## Run on Windows

Use Node.js 20.19 or later.

```powershell
cd meta-vr/grounding-square
npm install
npm test
npm run dev
```

For XR emulation: `npm run dev:emulator`. Meta's official [IWSDK testing guide](https://iwsdk.dev/guides/02-testing-experience.html) explains Enter XR and IWER input controls. To build for HTTPS hosting: `npm run build`, then host the resulting `dist/` on a **separate** preview domain or site.

### Status and important limitations

The JS source passed `node --check` and three pure-logic unit tests passed in the authoring environment. **A running 3D/XR preview, dependency install, simulator recording and device hand tracking have NOT yet been verified**, because the authoring environment cannot reach npm. Do not claim the VR demo is fully playable or publish a judging link until these checks pass.

The project must remain accessible to judges through the deadline and judging period. Confirm Meta VR Start program membership before submission.

## Demo video: 2 minutes 55 seconds

| Time | Real footage to capture once VR runtime works |
| --- | --- |
| 0:00–0:20 | Introduction, purpose, hands-first input |
| 0:20–0:50 | Immersive garden navigation and pinch interaction |
| 0:50–1:25 | Guided breathing and reduced-motion control |
| 1:25–2:10 | Collect all four celestial symbols |
| 2:10–2:40 | Unlock 11:11 and replay |
| 2:40–2:55 | Accessibility and closing |

Record **real simulator or Quest runtime footage**, not a slideshow. Upload to YouTube Public or Unlisted without a password, then add the accessible WebXR app link + YouTube video link + complete details to Devpost. Deadline: November 18, 2026, 3:00 p.m. Eastern.

This scene is a new, separate VR proof of concept. Before merging visuals with the production website, compare against Sunshine's founder-locked reference artwork. The approved farmhouse app and its artwork remain untouched.
