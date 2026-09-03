# The Meltdown Room — Mobile Store Readiness

QA branch only. Production is not approved or changed by this work.

## Identity
- App name: The Meltdown Room
- Developer display name: Sunshine
- Support/privacy email: oc2co33610@gmail.com
- Proposed bundle/package id: com.sunshine.themeltdownroom (confirm before first store registration)

## Build
1. Install Node.js 22+, Android Studio, and (for iOS) Xcode on a Mac.
2. Run `npm install`.
3. Run `npm run mobile:web`.
4. First build only: `npx cap add android` and `npx cap add ios`.
5. Run `npm run mobile:sync`.
6. Open with `npx cap open android` or `npx cap open ios`.
7. Build a signed Android App Bundle and an iOS Archive using the store developer accounts.

## Before submission
- Create and approve a square, opaque 1024×1024 store icon without transparency.
- Capture current phone and tablet screenshots from the approved QA build.
- Verify every permission purpose string and remove unused permissions.
- Complete Apple App Privacy and Google Play Data Safety answers from the published privacy policy.
- Enter the public privacy URL: `/privacy.html`.
- Enter the external account deletion URL: `/delete-account.html`.
- Test account creation, email verification, sign-in, backup/restore, and permanent deletion with a disposable QA account.
- Test offline/poor-network behavior, phone/tablet safe areas, rotation, back behavior, external links, share sheet, photo picker, location consent, and accessibility.
- Provide App Review with a working test account if any feature requires sign-in.
- Do not submit production until Founder review approves the complete QA sweep.

## Important
Capacitor creates a real iOS/Android container, but Apple and Google make the final approval decision. A thin website wrapper can be rejected; the app’s interactive rooms, private tools, saved state, companion, animations, and device integrations must be demonstrated in review notes.
