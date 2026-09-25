# Zombie Land — Project Log

## Desktop

- Breakpoint: `821px+`.
- 3D zombie head is visible and keeps the desktop sizing/positioning.
- Hero uses `images/hero-background.webp` as a grayscale, darkened background.
- Background is anchored to the viewport top and fades into the page background at the bottom.
- Desktop hero background uses `background-size: cover` with an 80% black overlay.

## Mobile / Tablet

- Breakpoint: `820px` and below.
- Hero background remains visible.
- 3D head is centered, fully visible, and proportionally reduced to `72vw` with a `620px` maximum.
- At `399px` and below, the 3D head is completely hidden.
- At `399px` and below, the hero background uses `background-size: 200% auto`, is positioned at `30% 30%`, extends 47px below the hero to the top of the `Select` heading, and fades into the site background from 60% down.
- At `400px–820px`, the hero background uses `background-size: cover`.

## Current Implementation

- Responsive rules are in `style.css`.
- The stylesheet cache version is `style.css?v=50` in `index.html`.
- Head resize handling is fixed in `head3d.bundle.js`; resize parallax refresh is in `app.js`.
- Local preview: `http://127.0.0.1:4173`.

## Verification

- Run `node --check app.js`.
- Run `node --check head3d.bundle.js`.
- Desktop, tablet, 399px, and 400px breakpoint behavior has been checked in Chrome.
- The project has no package scripts, linter, or typecheck command.

## Git

- Branch: `main`.
- Remote: `origin/main`.
- Latest pushed commit at this log entry: `d62809e` (`Adjust small-screen hero background`).
- `.DS_Store` and `images/_backup/` are local temporary files and must not be committed.
