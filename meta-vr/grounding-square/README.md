# Grounding Square — The Meltdown Room

A standalone woodland WebXR prototype for the competition, isolated under `meta-vr/grounding-square` on `feature/meta-grounding-square-vr`. Main website, founder-locked artwork and private command center are unchanged.

## Play

Use a current WebGL browser. Click the floating lights or use the keyboard-accessible buttons. Start the 16-second breathing activity; it can be paused. Gather Moon, Star, Sun and Comet in any order. Both activities are required to unlock the 11:11 reflection. Start again resets progress. Optional procedural stream sound starts only after interaction. Reduce motion pauses ambient movement.

On a WebXR headset browser, choose Enter VR. Point a controller ray and press the trigger (or use an available hand ray/pinch) on the floating symbols and orb. Reflection, restart, reduced-motion and Exit VR controls are in the scene. Physical Quest hand tracking remains unverified.

## Development

Node 20.19+; `npm ci`, `npm test`, `npm run dev`, `npm run build`. Deploy only this folder to the dedicated `grounding-square-vr-competition` Vercel project. The ordinary Vite configuration deliberately avoids loading the large IWSDK authoring plugin. The runtime uses Meta IWSDK World, RayInteractable and Pressed, with one shared journey for desktop and XR.

## Verification

- Production build and three progress tests passed.
- Chrome production-build test passed: all four actual 3D target clicks, timed breathing, gated reflection, and reset.
- Meta IWER Quest 3 emulator: immersive entry and real controller trigger/ray selection passed.
- Further capture and full simulator results are recorded in the submission handoff; do not infer hardware verification from emulation.

A small stylized 3D sanctuary, not a photorealistic environment. It is a general-wellbeing prototype and does not provide medical treatment. No accounts, trackers or saved personal information. The optional web fonts are external requests.
