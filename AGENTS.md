# Zombie Land — Project Log

## Stack / Layout

- Static site, no build step: `index.html` + `style.css` + `app.js`, plus a pre-bundled three.js file.
- `head3d.bundle.js` (~1 MB) = three.js r160 + GLTFLoader + the custom `initHead()` scene at the very end of the file (`// head3d.js` marker, ~line 23430).
- `head3d.data.js` = one line, `var __HEAD_GLB_BASE64 = "..."` — the zombie head GLB inlined as base64 (decoded with `atob` inside `initHead()`).
- Fonts: Inter 400–900 + IBM Plex Mono 400/500, from Google Fonts.
- Theme is hard-locked dark (`<html data-theme="dark">`); the toggle was removed from `app.js`.
- Photos are all 768×1376 (vertical). `images/hero-background.webp` is 2000×1117.
- Cache-busting: `style.css?v=85`, `app.js?v=42`, `favicon.svg?v=1`, `images/hero-background.webp?v=5`, `images/hero-background-mobile.webp?v=1`.
  Bump the `?v=` number in `index.html` whenever the file behind it changes, otherwise returning visitors keep the stale copy. Bump `app.js` too if you edited JS, not just the CSS.
  **Always `grep` the current `?v=` value before writing the `sed` pattern.** A chain of `sed 's|v=74|v=75|'` commands silently no-opped because `index.html` was still on `v=71`, and `sed -i ''` prints nothing on a miss, so it looked like it worked. Verify afterwards with `grep -on 'style\.css?v=[0-9]*' index.html` and by curling the served file and grepping for the new rule.
- The film-grain overlay (`.grain`) uses `inset:-5%`, **not** `-100%`. `grainShift` offsets by up to 3%, and `translate()` percentages resolve against the element's own box, so a 110% box still covers the seam. It was originally `-100%`, which made the composited layer 9× the viewport area (4320×2700 = 44.5 MB of layer texture, and 178 MB on a 2× Retina display) — that was the main cause of janky scrolling. Measured `-5%` at 1584×990 = 1.21× the viewport and 23.9 MB on Retina, i.e. 7.4× less, with the same visual result. Never raise that `inset` without re-measuring.

## Breakpoints

| Tier | Query | Purpose |
| --- | --- | --- |
| Desktop | `> 820px` (i.e. 821px+) | default rules — plus one narrow block at `style.css:208` holding only `.lightbox-img` |
| Tablet | `max-width:820px` | `style.css:272` |
| Phone | `max-width:480px` | `style.css:326` |
| Small phone | `max-width:399px` | `style.css:371` |

Re-derive these line numbers with `grep -n "^@media" style.css` — they drift on every edit.

## Desktop (821px+)

- Hero: `height:100vh`, `min-height:640px`, `margin-top:150px`, `overflow-x:clip` + `overflow-y:visible`.
- Hero background is `.hero::before`, `top:-150px; right:0; bottom:0; left:0`, `z-index:0`, `pointer-events:none`, `background-position:center top`, `no-repeat`, `background-size:cover`.
  - **Current state: three layers, all `cover`, `center top`, on the BASE rule (every width).** No `@media (min-width:821px)` hero override exists at all — the only thing in that block is `.lightbox-img`. Layers, topmost first: `linear-gradient(to bottom, transparent 46%, var(--bg) 96%)` (fades the photo's bottom edge into the page bg), `linear-gradient(rgba(0,0,0,.8), rgba(0,0,0,.8))` (80% darkening), then `url("images/hero-background.webp?v=5")`. Plus `background-color:var(--bg)` behind them.
  - **No grayscale, no brightness filter, no `transform`, no `contain`, no zoom on desktop.** A long chain of desktop experiments (contain, 40%/60%/85%/92% darkening, `filter:grayscale(1)`, `transform:scale(1.2) translateX(...)`) was tried and the user reverted every one of it with "верни как было". Do not re-add them without being asked.
  - The `max-width:399px` block no longer has a `.hero::before` rule at all (see the mobile note below).
  - The image is a shared asset, so replacing it changes the hero on every width. It was last replaced from `~/Downloads/20260928_074030_0_UTC_0.png` (2752×1536, actually JPEG data despite the `.png` name) → `cwebp -q 82 -m 6 -resize 2000 0` → 2000×1117, 239 KB. The previous version is kept in `images/_backup/hero-background.v5.webp`; older ones in `images/_backup/hero-background.v3.webp`. `images/_backup/` is local-only and must never be committed.
  - **Mobile has its own hero photo** (a deliberate user request, not a fallback): `images/hero-background-mobile.webp`, from `~/Desktop/20260928_064040_0_UTC_0.jpeg` (1536×2752 portrait) → `cwebp -q 78 -m 6 -resize 1200 0` → 1200×2150, 320 KB, referenced as `?v=1` from the `max-width:820px` block only. The desktop/base rule still points at the landscape `hero-background.webp` — do not "unify" these, they are intentionally different pictures.
  - `background-image` is **not** an additive property, so a media query that changes only the photo must redeclare the whole layer list (both gradients + the `url()`). Positions and `background-size` are inherited from the base rule, so those can be left alone.
  - **Mobile mirrors the main page exactly** ("надо сделать так же как на главной, я про цвет и затемнение и затушёвку внизу"). The `max-width:820px` override declares only what genuinely differs — the `url()` and `bottom:-150px`. The fade (`transparent 46% → var(--bg) 96%`), the 80% black, `background-color/position/repeat/size` are all inherited from the base rule, so the two treatments can never drift apart. The `max-width:399px` block has **no `.hero::before` rule at all** any more; its old lighter values (55% black, 60% fade stop) are gone.
  - **The hero photo bleeds `-150px` past the hero on every mobile width.** It used to bleed only `-47px` and only below 400px, so from 400px to 820px the photo stopped dead at the hero edge and the entire "Select" heading sat on flat page background — the user reported the picture was missing under the heading. Measured: the heading block spans 138px below the hero bottom (368→496 at 360–430px), so `-150px` covers all of it; at 768px the heading starts 80px into the bleed.
  - The bleed forced a companion fix: `.work{position:relative;z-index:1}` now sits in the `max-width:820px` block, not just at ≤399px. A positioned `z-index:0` pseudo-element paints *over* static in-flow text, so without lifting `.work` the bleeding photo covered the headings on 400–820px.
  - The mobile photo is **full-bleed**: image layer `background-size: cover`, `background-position: center top`, so its left and right edges land exactly on the viewport edges with no side bands. The user asked for "вписанная" that way after `auto 100%` (fit-by-height) left 53–200px dark bands per side — a 9:16 photo cannot be both full-height and full-width in a box that is only ~455px tall on a 390px phone. Because of `center top` the crop comes off the bottom.
  - The fade reaching full `var(--bg)` at 96% of the box, i.e. *before* the photo is sliced at 100%, is what makes the bottom edge invisible. Verified by sampling real pixels down a clean column at x=6 (`seam.mjs`, which decodes a `Page.captureScreenshot` strip with zlib + manual PNG unfiltering): at 390px the cut is at y=508 and the rows read 19, 12, 12 | 13, 14, 15 across it; at 768px the cut is at y=809 and the rows read 19, 20 | 19, 20, 22. No step at the seam on either.
  - The **desktop** rule is untouched: landscape asset, three layers, `cover,cover,cover`, `center top`. Do not change it.
  - **The user is emphatic that "desktop" means desktop only.** When a change is requested for 821px+, it goes in a `min-width:821px` block; the base rule and every `max-width` rule stay untouched. I got this wrong several times by styling the hero on mobile unasked. Note `filter` is inherited by narrower widths from the base rule, so desktop-only styling must be scoped in a `min-width` block, never added to the base declaration.
- 3D head (`.head3d`): `right:calc(4vw - 80px)`, `top:-180px`, `width/height:min(89vw,1138px)`, `z-index:1`, `pointer-events:none`.
  - Canvas: forced to 100%/100%, `filter:grayscale(1) contrast(1.8) brightness(.92)`.
- Head content is scaled to fit the camera: `fitHead()` uses fov 35, `camera.position.z = 6`, and `scale = (visibleH * 0.82) / maxDim`, then recentres the bounding box. Bounds are computed once and cached in `headFitBounds`.
- Head reacts to mouse: `targetRot.y = nx*0.6`, `targetRot.x = ny*0.4`, lerped at 0.06 per frame. Runs on all devices (no touch gate); paused by `IntersectionObserver` with `rootMargin:"200px 0px"`.
- Parallax IS active on desktop: `hero-content` → `translateY(y*0.18)`, `head3d` → `translateY(y*-0.12)`, plus every `[data-parallax]` element (the quote block, `data-parallax="0.18"`). rAF-throttled on scroll, re-measured on resize.
- Nav: fixed, `padding:22px 40px`, white text, transparent. `.nav.scrolled` (past 20px) → `rgba(10,10,12,.12)` + `blur(6px)`. Links absolutely centred, gap 34px, mono `.68rem` / `.28em` letter-spacing. Sound button is a 40×40 circle pushed right by `margin-left:auto`. Hamburger is `display:none`.
- Gallery: `.edit-grid` = 3 equal columns, `gap:14px`, `aspect-ratio:768/1376`, images `object-fit:contain`, `filter:grayscale(1) contrast(1.12) brightness(1.02)` → on hover `scale(1.03)` + `contrast(1.06) brightness(1.06)`. Caption `.edit-card-num` is hidden (opacity 0, translateY 8px) until hover.
- Hover distortion on cards runs only when `(hover: hover) and (pointer: fine)`. It's a 2D canvas tile-warp: tile ≈ `min(W,H)/dpr/26`, amplitude `sin(π·p) * 0.045`, `DUR = 520ms`, canvas opacity 0→1 on `mouseenter`/`focus`.
- Sections: `max-width:1440px; margin:0 auto; padding:120px 40px`. `.studio` `margin-top:60px`; `.quote` `margin-top:-80px`; `.studio .section-head` `margin-top:-200px`.
- Studio: 2-column grid `1.1fr 1fr`, gap 60px. The visual is `position:sticky; top:100px` with `clip-path:inset(0 0 100px 0)`.
- Footer: `grid-template-columns:1fr auto 1fr` — copyright left, nav centred, tagline right.
- Known remaining scroll cost: two fixed full-viewport canvases (`.forever-blood`, `.cursor-blood`) each `clearRect` + refill every rAF with no idle skip or tab-visibility pause; the head3d WebGL loop renders continuously; `.nav.scrolled` uses `backdrop-filter: blur(6px)`; 92 per-letter `letter-drift` spans plus `title-wobble` and `glitch` animations are always running. Measured 60 fps with 0 long tasks on a discrete GPU at `devicePixelRatio` 1, so the bottleneck is GPU compositing, not JS.
- Ambient blood rain (`.forever-blood`): fixed canvas, `z-index:0`, `opacity:.85`, `saturate(.7) brightness(.95)`, colour `#a01416`, max 220 drips.
- Cursor blood (`.cursor-blood`): desktop-only, `z-index:0`, spawns every 2nd `mousemove`, max 160 drops, hides itself when `isNarrow()`.
- Hamburger (`.nav-hamburger`, 3 × 22×2px bars) morphs into an X via `.active`: bars 1 and 3 rotate to `top:19px` ±45deg and the middle one fades out. In that state the bars are **`var(--blood)` red** (`#e24a4a` under the dark theme), not white — the user asked for the close X to be red. `background .3s` is in the `transition` alongside `transform`/`opacity` so the colour change animates with the rotation. Applies at every width, but the button is only displayed ≤820px, so in practice it is mobile-only. Verified in-browser at 390px: closed = `rgb(255,255,255)` with no rotation, open = `rgb(226,74,74)` on all three bars with `matrix(0.707107, 0.707107, …)` on bars 1/3, and the menu overlay gets `.open`.

## Mobile / Tablet (820px and below)

- JavaScript-side narrowing is a single helper: `isNarrow() => window.innerWidth <= 820` (`app.js:85`). Everything JS-driven keys off it.
- Parallax is fully disabled: `onScrollParallax()` clears both `hero-content` and `head3d` transforms and returns early.
- Cursor blood is skipped entirely (`app.js:289` returns `{}` on touch devices / narrow) and the loop clears its drops when `isNarrow()` (`app.js:326`).
- Ambient rain is **denser** on mobile: `dense = isTouchDevice || isNarrow()` → count `W/16` instead of `W/(22*dpr)`, bigger radius (×1.25), higher alpha (0.22 base), faster fall (`vy` 0.7 base).
- Hero: `height:auto; min-height:0`, so the hero is content-driven. `margin-top` is still `150px` here (only the `max-width:480px` rule lowers it to `100px`).
- Hero content: `padding:120px 24px 80px`, `margin-bottom:0` (desktop's `300px` negative pull is gone).
- 3D head (400px–820px): centred via `left:50%; transform:translateX(-50%)`, `top:calc(8vh - 120px)`, `width/height:min(72vw,620px)`, `opacity:1`.
  - There used to be a second, earlier `@media (max-width:820px)` block overriding this to `92vw`; it was removed as dead code. If you ever re-add a head rule, only the one inside the single `max-width:820px` block matters.
- Gallery: 2 columns, `gap:10px` (and `gap:8px` at `max-width:480px`).
- Studio: single column (`grid-template-columns:1fr`, gap 40px), visual is `position:static` with `clip-path:none`.
- Nav: `.nav-links` hidden, hamburger shown, `.nav-sound{margin-left:0}`.
- Hero background at 400–820px: the portrait `hero-background-mobile.webp`, `cover` + `center top`, bleeding `-150px` past the hero. Colour/darkening/fade are inherited from the base rule so they match the main page — see the Desktop hero section for the full reasoning and the seam measurement.

## Phone (480px and below)

- Nav `padding:16px 16px`, sound button 36×36.
- Hero `margin-top:100px`; `.hero-content` `padding:24px 16px 40px`, `justify-content:flex-start`, `height:auto`.
- `.hero-foot` becomes a column, `align-items:flex-start`, `gap:20px`, `margin-top:32px`. `.hero-sub` `.82rem`. `.scroll-hint` is `display:none`.
- Section padding drops: `.work` `10px 16px 44px`, `.studio` `16px 16px 40px`, `.contact` `26px 16px 48px`. `.section-head` `margin-bottom:32px`; `.studio .section-head` `margin-top:-80px`.
- `.contact-mail` font-size `clamp(1.2rem,7vw,2rem)`, `.contact-tg` `margin-top:18px`.
- The close button draws its own X with `::before`/`::after` in `var(--blood)`. Its text content is deliberately empty — only `aria-label="Close"` is kept, because a literal `&times;` glyph gets centred by the button box and lands inside the drawn X as a double cross. The `max-width:480px` rule sets `width/height:48px` and `top:12px` for touch — but no `right`, the horizontal position comes from `placeNav()`.
- Footer becomes a centred vertical stack, `padding:28px 16px`, `gap:28px`.
- The 3D head is still visible here (72vw) — it only disappears below 400px.

## Small phone (399px and below) — `style.css:371`

- `.head3d{display:none}` — the 3D head is completely removed, not just shrunk.
- `.work{position:relative; z-index:1}` — lifts the gallery above the bleeding hero background. Redundant now that the same rule lives in the 820px block, but harmless and it documents *why* the lift is needed.
- **There is no `.hero::before` rule in this block any more.** It used to carry a lighter treatment of its own (55% black, `60%` fade stop, `30% 30%` position, `260% auto` zoom, `bottom:-47px`) that was tuned for the old landscape photo. With the portrait mobile photo the user asked for the treatment to match the main page, so everything is inherited from the 820px block, which itself mirrors the base rule. Do not reintroduce per-breakpoint hero values here.

## Content / Behaviour

- Sections: `#top` hero → `#work` (01 / The Horde, 15-card gallery) → `#studio` (02) → quote → `#contact` (03) → footer.
- 15 cards generated in `app.js` from `IMG_COUNT = 15` + the `titles` array. `srcOf(i)` returns `images/z16.webp` for the last card and `images/z01..z15.webp` otherwise — so `z16` is shared with `.studio-visual`.
- Card click opens the lightbox (backdrop click, `×`, or `Escape`); `body` scroll is locked while open.
- Lightbox paging (all viewports, mobile/tablet and desktop alike):
  - `gallery[]` is built in card-creation order (`app.js`), so the lightbox index matches the grid order exactly.
  - Paging is driven by **Pointer Events**, not touch events, so one code path covers finger and mouse. Drag left/right to page, wrapping at both ends. Axis-locked: a gesture whose vertical component dominates is abandoned, so on touch it never fights page scroll and on desktop it never looks like a mis-click. Threshold `DRAG_MIN = 45px`; the image tracks the pointer at 0.55× and dims, then either advances or springs back.
  - `pointerdown` ignores anything inside `.lightbox-close, .lightbox-nav`, so a tap on a control never starts a drag. Non-primary mouse buttons are ignored too.
  - A completed drag fires a synthetic `click` right after, which would otherwise land on the backdrop and close the lightbox — `suppressClick` swallows it for 350ms.
  - Keyboard: `ArrowLeft` / `ArrowRight` page, `Escape` closes. The handler is a no-op unless `.lightbox.open`.
  - Arrow placement (`placeNav()` in `app.js`): on desktop the arrows sit `NAV_GAP = 20px` outside the photo's own left/right edges, on mobile they stay pinned to the viewport edges because a portrait photo at 90vw leaves no room for an outside gap. Both are positioned by JS via `style.left`; `left` is the only anchor either button uses.
  - The **close button is positioned by the same `placeNav()` call**, sharing the right-hand gutter with the next arrow: `left + wide + NAV_GAP` on desktop, `box - closeWidth` on mobile. Its `right` anchor is gone (`right:auto` in effect) — if `right` is ever set again alongside the JS `left`, the button gets over-constrained and the X lands in the wrong place. The 20px gap is measured from the photo's right edge, not from the viewport.
  - The X is 43px (down from 64px, i.e. 1.5× smaller) with 2px bars drawn by `::before`/`::after`; the `max-width:480px` rule bumps it back to 48px for touch. That's why `placeNav()` reads `lightboxClose.offsetWidth` instead of hardcoding a size.
  - The X never collides with the next arrow: the X occupies y 24–67px, the nav starts at 96px, and the X has `z-index:3` above the nav's `z-index:2`.
  - Arrows are white at 75% opacity and turn `--blood` red on `:hover` / `:focus-visible` (plus `:active`).
  - `placeNav()` **must** measure with `offsetLeft`/`offsetWidth`, never `getBoundingClientRect()`. `render()` kicks off a 0.34s slide-in, and a CSS transition that has only just started still reports the *old* transformed geometry — `getBoundingClientRect()` measured the photo 38% (172px) to the right and threw the arrows off-screen after every page. Layout offsets ignore transforms, so they are safe. It re-runs on the image's `load` event and on `resize`.
  - `@media (min-width:821px)` caps `.lightbox-img` at `min(90vw, calc(100vw - 200px))` to reserve room beside the photo. The photos are portrait, so the `90vh` height cap normally decides the width and this never binds; it only guards a future landscape photo.
  - The paging animation is a **slide with no opacity fade**. An earlier version faded the photo `opacity: 0` on page and dimmed it to `0.25` while dragging; while the photo was semi-transparent the pure-black gallery cards behind it showed through at almost the same size (444×796 vs the photo's 452×810) and read as a black plate flashing under the photo. Measured after the fix: `opacity` is `1` on all 55 sampled frames of the transition.
  - A `click` is dispatched at the nearest common ancestor of the press and release points, so pressing on the photo and releasing on the backdrop fires on `.lightbox` and would close the lightbox. `downOnBackdrop` records where the press started, and the backdrop branch requires it — the close-button branch deliberately does not, or the X would stop working.
  - `.lightbox.open .lightbox-nav, .lightbox.open .lightbox-counter{display:flex}` in the **base** rules, not the 820px block. The slide-in animation and the controls are deliberately NOT gated on `isNarrow()`.
  - **The nav buttons must not overlap the close button.** They are inset `top:96px;bottom:72px` and the close button carries `z-index:3` above the nav's `z-index:2`. Full-height nav buttons used to sit under the X: at 390px the X spans 330–378px and a `right:0` button spans 338–390px, which blocked 20 of 25 sampled points and made a tap on the X page to the next photo instead of closing. Both guards exist because either one alone leaves part of the X dead.
  - Adjacent photos are warmed with `new Image()` so paging does not flash.
  - `.lightbox.open` gets `touch-action:none` and `.lightbox-img` gets `user-select:none` + `-webkit-user-drag:none` in the base rules (harmless on desktop, and it protects touch-screen laptops above the 820px breakpoint). The `<img>` also carries `draggable="false"` so the browser's native image drag cannot hijack a horizontal swipe on desktop.
- `smoothScrollTo()` is a custom eased rAF scroll, 500ms, cubic ease-in-out. It calls `window.scrollTo({ top, behavior: 'instant' })` on purpose — `behavior:'instant'` is required because `html{scroll-behavior:smooth}` otherwise makes every per-frame `scrollTo` a fresh CSS-smooth animation, which fights the rAF loop and makes the page crawl to the target over ~2.5s instead of 500ms. Despite the comment it applies **no** fixed-nav offset (`- 0`).
- Scroll reveal: `IntersectionObserver` with `threshold:0.06`, `rootMargin:'0px 0px 30px 0px'`; hidden state is `opacity:0` + `translateY(80px)` + `blur(2px)`, revealed over ~2.1–2.3s. Cards stagger by 0.12s each, everything else by `(i % 4) * 0.07s`.
- Headings use two effects: `.letters-drift` wraps each letter in a `drift-l` span (duration `6 + (i%5)*1.3 s`, delay `i*0.18s`) and `h1/.section-title/.studio-col h4` run a 9s `title-wobble`. `.glitch` uses `::before`/`::after` with `data-text`, 4.2s `steps(1)`, red `#c33` / cyan `#3bf` at `z-index:-1/-2`.
- Music: `music/dark-circus.m4a`, `loop`, `volume = 0.12`, `preload="metadata"`, toggled from the nav ♪ button (icon swaps ♪ / ⏸, button pulses via `soundbeat`). `preload` must stay `metadata`, not `auto` — the file is 1.3 MB and there is no reason to pull it for visitors who never press play.
- Contact: `mailto:Kenoid@yandex.ru` and `https://t.me/Kenoid` (opens in a new tab).

## Verification

- Run `node --check app.js`.
- Run `node --check head3d.bundle.js`.
- Sanity-check the CSS braces: `python3 -c "s=open('style.css').read(); print(s.count('{')==s.count('}'))"`.
- Local preview: `http://127.0.0.1:4173`.
- Check 4 widths in Chrome: 821px+ (desktop), 400–820px (tablet), exactly 480px, and 399px/400px — the 399/400 pair is the sensitive edge because the head appears/disappears there.
- There is no build step and no unit tests. Everything above was verified by driving headless Chrome over CDP with throwaway scripts in `/var/folders/f0/…/T/opencode/`: `fit2.mjs`/`fit3.mjs` (hero background-size/position per width), `bleed.mjs` (hero/work geometry and `elementFromPoint` hit-testing), `seam.mjs` (real pixel sampling across the photo's bottom cut, includes a small zlib + manual PNG unfilter decoder), `burger.mjs` (hamburger → X state). They are scratch files and are not part of the repo; rewrite them if you need them again.
- **When driving that harness, wait for `document.querySelectorAll('.edit-card').length > 0` before clicking anything.** A fixed `wait(2000)` is not enough on a cold profile — `head3d.data.js` is a multi-MB base64 line and `app.js` had not executed yet, so `getElementById('navHamburger').click()` silently did nothing and the probe read white bars. It looked like a CSS bug and was not one.
- Known leftovers, harmless: `data-split` appears on 5 headings but no JS or CSS reads it; the `data-letters-drift` mention in an `app.js` comment is stale (the real selector is `.letters-drift`); `blockquote` and `h1` are styled as bare element selectors.

## Git

- Branch `main`, tracking `origin/main`. Commit style: subject line only, no body, sentence case, imperative ("Increase small-screen hero background"). Every commit so far has a single-line message — keep it that way.
- Recent history: `804634c` Make mobile menu close icon red → `41cb1ef` Add lightbox paging and mobile-specific hero background → `d447953` Increase small-screen hero background.
- `.DS_Store` and `images/_backup/` are local temporary files and must never be committed. They are the only two entries that ever show up as untracked; if anything else does, stop and look at it before staging.
- `head3d.bundle.js` is generated/bundled but committed, so a diff there is real and must be read, not waved through.
