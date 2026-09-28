# The Meltdown Room

## What this app is

The Meltdown Room is a gentle, family-friendly web app for people who want a quiet place to pause, sort out a thought, save an encouraging note, or choose a simple activity. It is designed for adults, teens, and families who prefer clear choices over a busy or confusing interface.

Visitors begin in the Great Room and can choose a room such as Calm, Hope, Reflection, Learning, Resources, Planning, Family & Fun, or Memorial. Each room has a small number of choices and a clear way back home. The project also includes Good Vibes Arcade, a separate collection of short browser games.

### Important notes

- The app is a static website and can be hosted on any standard web host. It does not need a database, API key, or secret environment variable to run.
- Entries saved in the app are kept in the visitor's own browser/device storage. They are not sent to the project owner, Reddit, or another user. Clearing browser data may remove them.
- The app does not provide emergency, medical, legal, therapy, or crisis services. It does not connect a visitor to a live person.
- Audio never starts on its own. Visitors choose whether to use any available sound.
- The app is intended to be supportive and easy to use; it is not a replacement for professional care.
- The current project does not read Reddit account information, post or comment on Reddit, moderate a subreddit, collect passwords, or make purchases.

## Main features

- **Great Room:** the simplest starting point and room map.
- **Calm and Hope:** short calming choices, encouragement, and a personal Hope Box for saved notes.
- **Reflection:** private reflection prompts and saved items on the visitor's device.
- **Learning, Resources, Planning, Family & Fun, and Memorial:** lightweight pages for ideas, routines, family activities, and remembrance.
- **Good Vibes Arcade:** small, replayable games that work with mouse, touch, or keyboard controls where applicable.
- **Accessibility:** readable labels, visible buttons, reduced-motion support, and no required drag controls in the arcade games.

The unfinished Celebration Room, Thinking Room, Rant Room, and Smash & Release options have been removed from the public navigation so visitors are not sent to incomplete or confusing experiences.

## How to use the app

1. Open the home page (`index.html`) in a modern browser.
2. Select **Enter the Meltdown Room** to open the main experience (`app-fixed.html`).
3. Choose a room from the on-screen tiles or the room map.
4. Use the room's main choices, then select **Back**, **More Rooms**, or **Home** when you are ready to move on.
5. When a room offers a save action, look for its matching personal board (for example, the Hope Box). Saved items remain only on that device/browser.
6. Open **Good Vibes Arcade** from the home page to play its browser games. Each game explains its goal on screen and offers replay options.

## Configure and deploy

This project is intentionally simple. No account setup, database setup, or environment variables are required for the website.

### Host the website

1. Download or clone this repository.
2. Upload the repository's website files to the root folder of a static hosting service. The entry page is `index.html`.
3. Keep `app.html`, `app-fixed.html`, the `games` folder, and all image/style/script files together. `app-fixed.html` loads the main app content from `app.html`.
4. If using a custom domain, point the domain to the chosen hosting service according to that service's instructions.
5. After deployment, open the site on a phone and desktop browser. Check the home page, the main room, one saved-note board, and one arcade game.

### Run a local preview

Use any local static web server from the repository folder, then open its displayed address in a browser. For example, a local preview can serve the repository root and open `index.html` or `app-fixed.html` directly.

### Build the optional mobile wrapper

The same website can be packaged as a Capacitor mobile app. This is optional and is not needed to host the web version.

1. Install Node.js, then run `npm install` from the repository folder.
2. Run `npm run mobile:web` to prepare the web files for the mobile wrapper.
3. Run `npm run mobile:sync` to copy those files into the installed Android/iOS Capacitor projects.
4. Run `npm run mobile:android` or `npm run mobile:ios` to open the platform project in its normal mobile development tool.

## Project boundaries and privacy

This repository is maintained as a supportive static web experience. It does not require Reddit permissions for its current features. If Reddit or Devvit features are added in the future, they should be documented here before release, including what information is used, what actions the app takes, and how a user can control those actions.

## Troubleshooting

- If an older room or button appears after an update, refresh the page fully or clear the site's cached files, then reopen `app-fixed.html`.
- If a saved note is missing, confirm that the same browser and device are being used and that browser storage was not cleared.
- If a page looks incomplete after uploading, make sure the full repository contents were uploaded together rather than only `index.html`.
