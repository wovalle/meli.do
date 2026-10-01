---
version: alpha
name: mellen.do
description: >-
  Design system of mellen.do, the portfolio of Melissa Encarnación, a
  Dominican art director. Lavender paper, navy ink, hot-pink accents, an
  editorial serif with a handwritten aside. Warm, playful, con sabor.
  Every value below is extracted from the code; the comment next to each one
  says where it lives. Read this before generating anything for the brand
  (OG cards, social posts, new pages).

# Source of truth for colors: the Tailwind v4 @theme block in
# src/styles/global.css (lines 3-21). The OG renderer repeats them as
# constants in src/lib/og.ts (lines 7-12).
colors:
  primary: "#FF1493"          # --color-hot-pink, global.css:7 · HOT_PINK og.ts:10
  secondary: "#1A2B4A"        # --color-navy, global.css:6 · NAVY og.ts:7
  tertiary: "#FFE484"         # --color-butter, global.css:9 · BUTTER og.ts:12
  neutral: "#D9D0F5"          # --color-lavender, global.css:4 · LAVENDER og.ts:8 · theme-color PublicLayout.astro:95
  surface: "#FFF5EC"          # --color-cream, global.css:5 · CREAM og.ts:9
  on-surface: "#1A2B4A"       # body text-navy, PublicLayout.astro:120
  on-primary: "#FFF5EC"       # bg-hot-pink text-cream, index.astro:62, 289
  coral: "#FF7F50"            # --color-coral, global.css:8 · CORAL og.ts:11
  mint: "#B8E6D0"             # --color-mint, global.css:10
  sky: "#B8D7FF"              # --color-sky, global.css:11
  envelope-back: "#C9BDF0"    # hard-coded, play.css:210
  envelope-flap-open: "#C3B6EE" # hard-coded, play.css:217
  envelope-flap: "#D2C7F3"    # hard-coded, play.css:238
  # Case-study OG card only — these DISAGREE with the theme, see "Known
  # inconsistencies" below. Kept here so the file mirrors the code.
  og-case-pink: "#FF2E88"     # og.ts:254 (accent bar) vs hot-pink #FF1493
  og-case-cream: "#FFF9F0"    # og.ts:257, 260 (title, subtitle) vs cream #FFF5EC
  og-case-shade: "#0F1424"    # rgba(15,20,36,…) gradient, og.ts:251 vs navy #1A2B4A

# Fonts are loaded from Google Fonts in PublicLayout.astro:104-107
# (Instrument Serif 400 + italic, Poppins 300/400/500/600, Kalam 300/400/700)
# and mapped in global.css:13-15 (--font-display / --font-sans / --font-hand).
# The OG renderer loads Instrument Serif 400 + italic, Poppins 500, Kalam 400
# (og.ts:43-55).
typography:
  display-xl:                 # home h1, index.astro:65 (64px → sm 96px → lg 152px)
    fontFamily: Instrument Serif
    fontSize: 152px
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: -0.02em
  display-lg:                 # case-study h1, work/[slug].astro:102 (48 → 80 → 128px)
    fontFamily: Instrument Serif
    fontSize: 128px
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: -0.02em
  headline-lg:                # section h2, index.astro:150 (44 → lg 80px)
    fontFamily: Instrument Serif
    fontSize: 80px
    fontWeight: 400
    lineHeight: 0.95
  headline-md:                # featured project title, index.astro:229 (40 → lg 56px)
    fontFamily: Instrument Serif
    fontSize: 56px
    fontWeight: 400
    lineHeight: 0.95
  headline-sm:                # tile title, index.astro:269
    fontFamily: Instrument Serif
    fontSize: 28px
    fontWeight: 400
    lineHeight: 0.95
  marquee:                    # discipline marquee, italic, index.astro:95 (28 → lg 44px)
    fontFamily: Instrument Serif
    fontSize: 44px
    fontWeight: 400
  wordmark:                   # "mellen" in the header, PublicLayout.astro:128 (tracking-tight)
    fontFamily: Instrument Serif
    fontSize: 22px
    fontWeight: 400
    letterSpacing: -0.025em
  body-lg:                    # hero intro, index.astro:76 (18 → lg 22px)
    fontFamily: Poppins
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.55
  body-md:                    # about card, index.astro:166 (16 → lg 18px)
    fontFamily: Poppins
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
  body-sm:                    # project summary, index.astro:231
    fontFamily: Poppins
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.65
  label-md:                   # buttons + nav, index.astro:82, PublicLayout.astro:130
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: 500
  label-sm:                   # badges / chips, index.astro:58, 62, 170
    fontFamily: Poppins
    fontSize: 12px
    fontWeight: 500
  label-caps:                 # stat captions, index.astro:157 (uppercase tracking-wider)
    fontFamily: Poppins
    fontSize: 12px
    fontWeight: 500
    letterSpacing: 0.05em
  hand-lg:                    # "selected work", "let's make something warm", index.astro:187, 296 (28 → lg 36px)
    fontFamily: Kalam
    fontSize: 36px
    fontWeight: 400
  hand-md:                    # postcard inputs, polaroid label, play.css:162, index.astro:138
    fontFamily: Kalam
    fontSize: 22px
    fontWeight: 400
  hand-sm:                    # asides, "or browse the archive →", index.astro:85
    fontFamily: Kalam
    fontSize: 18px
    fontWeight: 400
  og-headline:                # OG site card headline, og.ts:170-171, 178; size per card in og/[page].png.ts (96-160px)
    fontFamily: Instrument Serif
    fontSize: 104px
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: -0.02em
  og-badge:                   # OG badge, og.ts:125-126
    fontFamily: Poppins
    fontSize: 20px
    fontWeight: 500
  og-subtitle:                # OG subtitle, og.ts:184
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: 500
  og-signature:               # "mellen.do" in hot pink, og.ts:187
    fontFamily: Kalam
    fontSize: 30px
    fontWeight: 400

# Tailwind v4 default scale (--spacing: 0.25rem = 4px); no override in
# global.css. Named values are the ones the pages actually use.
spacing:
  base: 4px                   # Tailwind default --spacing
  shell: 1440px               # --container-shell, global.css:20 (max-w-shell)
  page-x: 24px                # px-6, index.astro:45 (lg:px-10 = 40px)
  page-x-lg: 40px             # lg:px-10, index.astro:45
  section-y: 80px             # py-20, index.astro:110 (lg:py-28 = 112px)
  section-y-lg: 112px         # lg:py-28, index.astro:110
  gutter: 24px                # gap-6, index.astro:75 (lg:gap-10 = 40px)
  gutter-lg: 40px             # lg:gap-10, index.astro:75
  card: 24px                  # p-6 on cards, index.astro:155, 165
  grid-columns: 12            # grid-cols-12, index.astro:75, 111, 209
  og-width: 1200px            # og.ts:4
  og-height: 630px            # og.ts:5
  og-padding-y: 56px          # og.ts:169 ('56px 72px')
  og-padding-x: 72px          # og.ts:169

rounded:
  caption: 4px                # polaroid caption label, play.css:99
  focus: 8px                  # sabor dial focus ring, play.css:58
  envelope: 14px              # envelope, play.css:209
  inner: 18px                 # card inside a frame: rounded-[18px], index.astro:122, 307
  xxl: 24px                   # --radius-xxl, global.css:17 (cards, tiles, polaroid)
  full: 999px                 # --radius-pill, global.css:18 (buttons, badges, header)

components:
  button-primary:             # "See my work →", index.astro:82; header CTA PublicLayout.astro:135
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 12px 24px
  button-primary-hover:       # hover:bg-hot-pink
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
  button-secondary:           # "Let's collab ✦", index.astro:83 (border-navy/20)
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 12px 24px
  button-secondary-hover:     # hover:bg-butter
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-surface}"
  button-pink:                # postcard "Stamp it & send ✦", index.astro:322, 381
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 12px 24px
  button-pink-hover:          # hover:bg-navy
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
  badge-cream:                # "Open for 2026 projects", index.astro:58 · og.ts:121-122; coral dot index.astro:59, og.ts:129
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 6px 16px
  badge-cream-dot:            # the pulsing status dot
    backgroundColor: "{colors.coral}"
    size: 8px
    rounded: "{rounded.full}"
  badge-pink:                 # "10 years designing", index.astro:62 · og.ts:121-122
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 6px 16px
  chip-skill:                 # "Brand Identity" etc., index.astro:170
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  chip-service-checked:       # postcard service picker, index.astro:371
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 6px 12px
  card-stat-butter:           # "10+ years", index.astro:155
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xxl}"
    padding: 24px
  card-stat-sky:              # "EN · ES", index.astro:159
    backgroundColor: "{colors.sky}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xxl}"
    padding: 24px
  card-cream:                 # about card, index.astro:165
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xxl}"
    padding: 24px
  project-card-media:         # featured case study image, index.astro:211 (border-navy/10, .lift)
    backgroundColor: "{colors.secondary}"
    rounded: "{rounded.xxl}"
  project-tile-coral:         # archive tiles cycle butter → coral → mint → sky, index.astro:32, 261
    backgroundColor: "{colors.coral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-sm}"
    rounded: "{rounded.xxl}"
    padding: 20px
  project-tile-mint:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xxl}"
    padding: 20px
  polaroid:                   # index.astro:121 (rotate -3deg, .lift)
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xxl}"
    padding: 16px
  polaroid-photo:             # index.astro:122
    backgroundColor: "{colors.secondary}"
    rounded: "{rounded.inner}"
  polaroid-caption:           # play.css:94-104 (rotate -2deg, tape on top)
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.hand-md}"
    rounded: "{rounded.caption}"
    padding: 2px 12px 4px
  postcard:                   # airmail frame + cream card, index.astro:306-307, global.css:92-100
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xxl}"
    padding: 48px
  postcard-input:             # dashed underline in Kalam, play.css:156-166
    textColor: "{colors.on-surface}"
    typography: "{typography.hand-md}"
  postcard-stamp:             # perforated stamp, index.astro:333, global.css:104-118
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
    width: 148px
  envelope:                   # play.css:193-255
    backgroundColor: "{colors.envelope-back}"
    rounded: "{rounded.envelope}"
  envelope-flap:
    backgroundColor: "{colors.envelope-flap}"
  envelope-flap-open:
    backgroundColor: "{colors.envelope-flap-open}"
  envelope-seal:              # play.css:245-255
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
    size: 44px
    rounded: "{rounded.full}"
  header:                     # PublicLayout.astro:123 (bg-cream/80 + blur 14px)
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    padding: 12px 24px
  footer:                     # PublicLayout.astro:143
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
  contact-section:            # index.astro:289
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  og-site-card:               # og.ts:156-190
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.og-headline}"
    width: 1200px
    height: 630px
  og-case-card:               # og.ts:215-262 (photo + dark gradient)
    backgroundColor: "{colors.og-case-shade}"
    textColor: "{colors.og-case-cream}"
  og-case-accent:             # og.ts:254
    backgroundColor: "{colors.og-case-pink}"
    width: 88px
    height: 8px
---

# mellen.do — DESIGN.md

This file follows Google Labs' [DESIGN.md spec](https://github.com/google-labs-code/design.md)
(version `alpha`). The front matter holds the tokens; this body explains how
to use them. **Agents: read this before you generate anything for mellen.do**
— OG cards, social posts, new pages, decks. Don't invent new colors or fonts;
everything here already lives in the code, and the YAML comments say where.

Lint it with `npx @google/design.md lint DESIGN.md`.

## Overview

mellen.do is Melissa Encarnación's portfolio: a Dominican art director who
builds brand systems that feel "warm, specific, and a little bit homemade".
The site should feel like a scrapbook on a sunny desk in Santo Domingo:
lavender paper, navy ink, a hot-pink marker, butter-yellow tape, a postcard,
a polaroid. Editorial, but with sabor — never corporate, never cold.

**Voice.** Warm, first-person, playful, a little flirty with words. English
is the base language, with Spanish woven in naturally — not translated, just
the way she talks: "¡Hola! I'm Melissa", "Say hola ✦", "who loves *sabor*",
"hecho con ♥ en Santo Domingo", "Términos del *servicio*". Short sentences.
Lowercase handwritten asides ("let's make something warm", "or browse the
archive →", "selected work"). The ✦ sparkle is the house punctuation mark —
use it on CTAs and as a list separator. Caribbean warmth over hype: say
"Let's collab ✦", not "Unlock synergies".

**Motion is part of the brand.** Things float, wave, lift and wobble like
paper being handled (see Elevation & Depth). Every motion has a still
fallback under `prefers-reduced-motion`.

## Colors

Lavender paper, navy ink, one hot-pink marker, and a handful of pastel
"stickers".

- **Hot Pink (`primary`, #FF1493):** The accent and the "sabor". Italic
  emphasis words in headlines (*Melissa*, *Caribbean warmth*, *love letter*),
  hover states, the contact section, the pink badge, the hand-drawn underline
  (`global.css:71`). Use it on one or two words per headline, not whole lines.
- **Navy (`secondary`, #1A2B4A):** The ink. All body text, primary buttons,
  footer. Shadows are navy at low alpha, never black. Muted text is navy at
  45–80% opacity (`text-navy/70`, `/60`, `/50`), not grey.
- **Butter (`tertiary`, #FFE484):** Tape, stamps, sparkles, the hover of
  secondary buttons, the stat card. Tape is butter at 90%
  (`rgba(255,228,132,.9)`, `global.css:81`, `play.css:112`).
- **Lavender (`neutral`, #D9D0F5):** The page background (`bg-lavender`,
  `PublicLayout.astro:120`), the browser `theme-color`
  (`PublicLayout.astro:95`) and the OG card background (`og.ts:168`).
- **Cream (`surface`, #FFF5EC):** Paper: cards, header, polaroid, postcard,
  badges. Text on pink and navy is cream, never pure white.
- **Coral (#FF7F50), Mint (#B8E6D0), Sky (#B8D7FF):** Sticker colors for
  tiles, stat cards, sparkles and the status dot. The archive tiles cycle
  butter → coral → mint → sky (`index.astro:32`); the draggable sparkles
  cycle pink, butter, coral, mint, sky, navy (`SPARKLE_PALETTE`,
  `src/lib/play/toys.ts:41`).
- **Airmail stripe:** a -45° repeating stripe of pink / cream / navy / cream
  (`global.css:92-100`, `play.css:232`). It is the frame of the postcard.

Contrast notes: navy on cream/lavender/butter/mint/sky passes AA easily. Cream
on hot pink is 3.38:1 and pink on butter (stamp lettering, envelope seal) is
2.89:1 — both below WCAG AA for normal text (4.5:1). The site uses cream on
pink for large headlines, but also for 12–14px buttons, badges and chips.
`npx @google/design.md lint` flags these as warnings on purpose: the tokens
mirror the code. For new work, keep text on pink large, or use navy.

## Typography

Three families, each with one job (`global.css:13-15`):

- **Instrument Serif** (`font-display`) — every headline, the wordmark, the
  marquee. Regular weight only; the *italic* is the expressive move (the pink
  italic "*Melissa*" in the hero and the OG card is the signature look).
  Tight leading (0.95) and -0.02em tracking on big sizes. Headlines get huge:
  152px on desktop for the hero.
- **Poppins** (`font-sans`) — body, buttons, badges, labels. 400 for body,
  500 (`font-medium`) for UI, 600 only for the small featured badge and
  counters. Body leading is generous (1.55–1.7).
- **Kalam** (`font-hand`) — the handwritten voice: asides, captions, the
  postcard form, the "mellen.do" signature on OG cards. Always lowercase-ish
  and conversational. Never for long paragraphs.

Pages are responsive by stepping sizes per breakpoint (e.g. hero
64 → 96 → 152px); the tokens record the largest step and the comments list
the rest.

## Layout

- Max content width 1440px (`max-w-shell`), centred, with 24px side padding
  (40px from `lg`).
- 12-column grid, 24px gutters (40px from `lg`). Sections breathe: 80px
  vertical padding (112px from `lg`).
- Spacing follows Tailwind's default 4px scale; nothing custom.
- Sections alternate lavender and cream bands separated by a navy/10 hairline
  (`border-y border-navy/10`), ending in a hot-pink contact band and a navy
  footer.
- Things are slightly off-axis on purpose: the polaroid at -3°, the postcard
  at -1°, stamps at ±3–4°, tape at ±6°. Small rotations, never more than ~6°
  on content.
- **OG cards** are 1200×630, lavender, 56/72px padding: badges top-left,
  a 2–3 line serif headline with one pink italic word, Poppins subtitle
  bottom-left in navy at 75%, Kalam "mellen.do" in pink bottom-right, and a
  cluster of sparkles (pink star, butter sparkle, coral dashed circle, coral
  star) on the right (`og.ts:79-95`).

## Elevation & Depth

Depth is paper on a desk: soft, long, navy-tinted shadows with a negative
spread, plus tape and rotation. No hard drop shadows, no black.

| Use | Shadow | Source |
| --- | --- | --- |
| Header pill | `0 12px 32px -20px rgba(26,43,74,.25)` | `PublicLayout.astro:123` |
| Hover lift | `0 24px 40px -20px rgba(26,43,74,.25)` | `global.css:64` |
| Polaroid | `0 30px 60px -30px rgba(26,43,74,.3)` | `index.astro:121` |
| Postcard | `0 30px 60px -30px rgba(26,43,74,.45)` | `index.astro:306` |
| Archive CTA | `0 20px 40px -20px rgba(26,43,74,.45)` | `index.astro:278` |
| Polaroid caption | `0 6px 14px -6px rgba(26,43,74,.5)` | `play.css:103` |
| Tape | `0 2px 6px rgba(26,43,74,.12)` | `global.css:82` |
| Stamp | `drop-shadow(0 4px 6px rgba(26,43,74,.18))` | `global.css:117` |
| Scattered tile | `0 0 0 8px cream, 0 18px 30px -14px rgba(26,43,74,.45)` | `play.css:129` |
| Envelope | `0 30px 50px -24px rgba(26,43,74,.55)` | `play.css:211` |

The header is `bg-cream/80` with a 14px backdrop blur (`.glassy`,
`global.css:66`).

### Motion

Two easing curves (`global.css:23-26`):

- `--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1)` — entrances, shadows.
- `--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1)` — anything that should
  feel bouncy: lift, flips, the envelope, the seal.

| Motion | Value | Source |
| --- | --- | --- |
| Entrance `soft-up` | 900ms, 20px rise, staggered 100ms (`.d-100`…`.d-400`) | `global.css:33-41` |
| Hover `lift` | 500ms back, -6px and -0.5° | `global.css:63-64` |
| Wave 👋🏽 | 2.4s loop | `global.css:43-51` |
| Floating sparkles | 6s / 8s / 9s loops | `global.css:53-58` |
| Spinning star logo | 18s linear | `global.css:60-61` |
| Marquee | 30s linear | `global.css:68-69` |
| Color hovers | 200ms | `play.css:20, 78` |
| Postcard flip | 850ms back, 3D rotateY | `play.css:144-154` |
| Wobbly spring (toys) | stiffness 170, damping 9 | `src/lib/play/motion.ts:13` |

Under `prefers-reduced-motion: reduce` every loop and transition stops
(`global.css:120-125`, `play.css:278-292`). Any new motion must do the same.

## Shapes

Soft and friendly. Buttons, badges, chips and the header are full pills
(`rounded-pill`, 999px). Cards, tiles, the polaroid and the postcard use
`rounded-xxl` (24px); a card inside a frame steps down to 18px so the corners
stay concentric. Small paper bits (caption label 4px, envelope 14px) are the
exceptions. Decorative shapes are hand-drawn-feeling: the 4-point star
(`M24 2 L28 20 L46 24 …`), the curvy sparkle, a dashed circle, a wobbly
pink underline, dashed navy rules, perforated stamp edges.

## Components

- **Buttons.** Pills, Poppins 14px medium, `px-6 py-3`. Primary is navy →
  pink on hover; secondary is cream with a navy/20 border → butter on hover;
  inside the pink contact section, buttons go pink → navy. CTAs often end in
  ✦ or →.
- **Badges.** Pills, Poppins 12px medium. Cream with a coral status dot
  ("Open for 2026 projects"), or pink with cream text ("10 years designing").
  Same pair on the OG card at 20px. The featured-project badge is 11px
  semibold in pink or coral (`index.astro:222`).
- **Skill chips.** Lavender pills on a cream card, 12px medium.
- **Polaroid.** Cream frame, 16px padding (40px at the bottom), 24px radius,
  -3°; navy photo well with an 18px radius; a cream "paper label" caption in
  Kalam with a scrap of butter tape; "Santo Domingo, 2026" underneath in
  Kalam.
- **Postcard form.** Airmail-stripe frame (7px) around a cream card; a
  dashed navy/30 divider splits message and address; inputs are borderless
  Kalam 22px on a dashed underline that turns pink on focus; a perforated
  butter (front) or mint (back) stamp; a navy postmark; it folds into a
  lavender envelope sealed with a pink ✦.
- **Project cards.** Featured: big 24px-radius image on navy with a navy/10
  border, a numbered pink/coral badge, a serif title, a Poppins summary and
  an underlined "Read the case study →" link. Archive tiles: square, 24px
  radius, colored backgrounds cycling butter/coral/mint/sky, lifting on
  hover.
- **Header.** Floating cream/80 pill with blur, spinning pink star + serif
  "mellen" wordmark, Poppins nav, navy "Say hola ✦" button.

## Do's and Don'ts

- Do start from lavender + cream + navy, and spend hot pink on one or two
  words or one action per view.
- Do put the emotional word of a headline in *Instrument Serif italic*, often
  in pink.
- Do mix English and Spanish the way the site does ("¡Hola!", "Say hola",
  "sabor", "hecho con ♥ en Santo Domingo").
- Do use ✦ as the sparkle/separator and the 4-point star as decoration.
- Do tint shadows navy and keep rotations small (±1–6°).
- Do give every animation a reduced-motion fallback.
- Don't use pure black, pure white or grey for text — use navy and its
  opacities, and cream on dark/pink.
- Don't put small body text in cream on hot pink (3.38:1).
- Don't introduce new fonts or colors; if a new value is truly needed, add it
  to `@theme` in `src/styles/global.css` first and then here.
- Don't set long paragraphs in Kalam or in italics.

## Known inconsistencies

The code has more than one value for a few things. They are recorded as-is
above; nothing was silently picked. Decide and fix in code, then update this
file.

1. **Case-study OG card uses its own palette** (`src/lib/og.ts:251-260`):
   accent bar `#FF2E88` instead of hot pink `#FF1493`; title/subtitle
   `#FFF9F0` instead of cream `#FFF5EC`; the gradient shade is
   `rgba(15,20,36,…)` (#0F1424) instead of navy `#1A2B4A`.
2. **Colors are duplicated as literals** outside `@theme`: `og.ts:7-12`,
   `SPARKLE_PALETTE` in `src/lib/play/toys.ts:41`, inline SVG fills in
   `index.astro`, `work/index.astro`, `404.astro`, `PublicLayout.astro:126`,
   and the airmail stripes in `global.css:92-100` / `play.css:232`. Values
   match today, but they can drift.
3. **Envelope lavenders are untokenized** — `#C9BDF0`, `#C3B6EE`, `#D2C7F3`
   (`play.css:210, 217, 238`) are hand-picked darker lavenders not in
   `@theme`.
4. **Headline leading**: the site uses 0.95 (`leading-[0.95]`) but the OG
   site card uses 0.98 (`og.ts:178`).
5. **Featured badge** is 11px semibold (`index.astro:222`) while every other
   badge is 12px medium.
6. **/links uses white cards** (`bg-white`, `border-white`,
   `src/pages/links.astro:46, 48, 62`) instead of cream, plus third-party brand
   colors for the Instagram gradient and LinkedIn blue
   (`links.astro:16, 23`).
7. **Favicon**: `PublicLayout.astro:96` links `/favicon.svg`, which is not in
   `public/` on `main` yet. A site icon is in progress elsewhere; not
   documented here until it lands.
