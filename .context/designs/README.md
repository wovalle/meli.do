# meli.do — Portfolio Design Explorations

Six static HTML prototypes for Melissa Encarnacion's portfolio landing page. Two style directions (Editorial + Y2K), with multiple variations per direction. Each design is a single-file HTML + Tailwind (CDN) + Google Fonts prototype, desktop-first and mobile-responsive, using real Behance-sourced imagery for Estelar and Alkasa.

Goal: pick a direction, then port to the production stack (likely Next.js + Tailwind + Framer Motion / GSAP + Lottie).

## Files

```
.context/designs/
├── editorial-dashboard.html      Direction A · Variation 1
├── editorial-zine.html           Direction A · Variation 2
├── y2k-illustrated.html          Direction B · Variation 1 (lavender · playful)
├── y2k-illustrated-v2.html       Direction B · Variation 1.b (peach · scrapbook)
├── y2k-maximalist.html           Direction B · Variation 2 (red · punk-loud)
├── y2k-maximalist-pink.html      Direction B · Variation 2.b (bubblegum · femme-loud)
└── screenshots/
    ├── editorial-dashboard-full.png / -mobile.png
    ├── editorial-zine-full.png / -mobile.png
    ├── y2k-illustrated-full.png / -mobile.png
    ├── y2k-illustrated-v2-full.png / -mobile.png
    ├── y2k-maximalist-full.png / -mobile.png
    └── y2k-maximalist-pink-full.png / -mobile.png
```

## Shared structure (across all 4)

- Sticky nav
- Hero with role + stats (10+ years, 5 designers led, 13 brands)
- 2 featured case studies: **Estelar** (Nov 2024) + **Alkasa** (Oct 2024), rendered with real Behance imagery
- Mini archive (Liquid Beer, Humano Seguros, Bien Picaito, Banco Popular 60)
- About / bio
- Contact with email CTA + social links
- Footer

## Shared technical notes

- Tailwind config inlined in `<script>`, tokens defined per file
- Google Fonts loaded via `<link>`: **Archivo Black, Fraunces, Inter, Instrument Serif, Poppins, Caveat, DM Serif Display, Space Grotesk, Righteous, JetBrains Mono**
- Hero imagery: Behance CDN (`mir-s3-cdn-cf.behance.net`) `fs_webp/` variants
- Reveal uses IntersectionObserver-friendly CSS animations (no external JS lib)
- All animation eases defined as CSS vars: `--ease-out-quint`, `--ease-out-back`, `--ease-in-out-expo`

---

## Direction A — Editorial

**Feel:** serious, confident, "creative director who reads." Ink-dominant palette, heavy display type, generous white space.

### A1 — `editorial-dashboard.html`

**Palette**
| Token | Hex | Use |
|---|---|---|
| ink | `#0A0A0A` | Type, borders |
| bone | `#F5F0E8` | Background |
| volt | `#E8FF00` | Accent blocks, hover |
| charcoal | `#2A2A2A` | Secondary surfaces |
| mustard | `#FFB800` | Marker / pointer |

**Type**
- Display: **Archivo Black** — 64/96/148 px
- Body: **Inter** — 16/20/28 px, weight 300–500
- Meta: **JetBrains Mono** — 11 px uppercase, tracking 0.18em

**Layout**
- 12-col, max 1440
- Hero + 3-up metric dashboard (year / team / brands)
- Two large case cards with contrasting backgrounds (ink vs volt)
- Featured Estelar strip on ink background with meta-grid (dl)
- 4-tile services grid with grid-bg
- Dark about section

**Animation intent**
| Element | Behavior | Duration / Ease | Framework hint |
|---|---|---|---|
| Hero headline | Clip-path mask reveal, line-by-line | 900ms, stagger 0/100/200ms, `ease-out-quint` | Framer Motion `<motion.span>` or GSAP SplitText |
| Metric cards | Fade + 12px translateY | 700ms, 250ms delay, `ease-out-quint` | CSS-only fine; or Motion `whileInView` |
| Cursor "_" | 2-step blink | 1s infinite steps(2) | CSS keyframes (already wired) |
| Ticker marquee | `translateX(-50%)` loop | 40s linear infinite | CSS (GSAP if need drag/scrub) |
| Case card hover | Image scale 1 → 1.06, arrow translate | 900ms / 400ms, `ease-out-quint` | CSS transitions |
| Images | Fade on `load` | 600ms | `.lazy-fade.loaded` class toggle |

### A2 — `editorial-zine.html`

**Palette** — same ink/bone base + **rust `#B8431E`** as primary accent, **mustard** secondary, **cream `#EFE7DA`** for essay bleed.

**Type**
- Display: **Fraunces** (variable, opsz 144, weight 300) — drives every headline, italics are hero
- Body: **Fraunces** opsz 14 weight 400 for long-form
- Meta: **JetBrains Mono** 11 px

**Layout**
- Masthead like a magazine issue (Issue N° 01, Vol. 10)
- Editorial hero with drop-cap intro paragraph
- Table of contents with page numbers + dashed rules
- Feature 01 (Estelar) on ink bg with giant "01" numeral in rust
- Feature 02 (Alkasa) on bone bg, mirrored layout with "02"
- Two-column essay section (About) with drop caps
- Letters/colophon contact

**Animation intent**
| Element | Behavior | Duration / Ease | Framework hint |
|---|---|---|---|
| Headline | Mask-up reveal per line, stagger 150ms | 1100ms, `ease-out-quint` | Framer Motion + split-lines |
| Rotating stamp (SVG textPath) | 360° rotate | 14s linear infinite | CSS |
| Info-line byline | Horizontal wipe cover → reveal | 900ms, 500ms delay | CSS pseudo-element (already wired) |
| Drop cap | Optional: per-char fade on scroll | 600ms cascading | GSAP ScrollTrigger |
| Figure hover | Scale 1 → 1.04, saturate 1 → 1.1 | 1200ms / 800ms `ease-out-quint` | CSS |
| TOC dashed rules | Draw-in left→right on view | 800ms | Lottie or `@property --length` + stroke-dasharray |

---

## Direction B — Y2K-influenced warmth

**Feel:** Melissa as a person. Warmer palettes, rounded forms, playful ornaments, more "brand-forward" treatment.

### B1 — `y2k-illustrated.html`

**Palette**
| Token | Hex | Use |
|---|---|---|
| lavender | `#D9D0F5` | Background |
| cream | `#FFF5EC` | Cards |
| navy | `#1A2B4A` | Primary text |
| hot-pink | `#FF1493` | Accent |
| coral | `#FF7F50` | Secondary accent |
| butter | `#FFE484` | Tertiary |
| mint / sky | `#B8E6D0` / `#B8D7FF` | Chip backgrounds |

**Type**
- Display: **Instrument Serif** (regular + italic) — 40/64/152 px
- Body: **Poppins** — 13/15/18/22 px
- Handwritten: **Caveat** — 22/28/36 px (hand-drawn captions + section kickers)

**Layout**
- Floating pill nav with glassy backdrop
- Big playful hero: "¡Hola! I'm Melissa" + wave emoji
- Hand-drawn SVG underline under "art director"
- Polaroid-style About card with rotation
- 2-up case studies with floating stars
- 4-up mini archive as color-block cards
- "Studio mix" Spotify-style playlist module (brand personality)
- Hot-pink contact section with spinning stars

**Animation intent**
| Element | Behavior | Duration / Ease | Framework hint |
|---|---|---|---|
| Hero lines | Fade + 20px translateY, stagger 100ms | 900ms `ease-out-quint` | Motion `whileInView` |
| Waving hand emoji | Rotation keyframe (14° → -8° → …) | 2.4s `ease-in-out` infinite | CSS (wired) |
| Floating stars | 3 parallax orbits, different speeds | 6–9s ease-in-out infinite | CSS; could upgrade to Lottie for shape variations |
| Spinning logo star | 360° | 18s linear infinite | CSS |
| Card hover (`.lift`) | `translateY(-6px) rotate(-.5deg)` + shadow | 500ms `ease-out-back` | CSS |
| Polaroid | Persistent `-3deg` rotation + lift on hover | 500ms | CSS |
| Hand-drawn underline | Inline SVG background image, pre-rendered | static | Upgrade: Rough.js at runtime OR Lottie stroke-in on view |
| Contact star rotators | `spin-slow` 18s, one reversed | infinite | CSS |

### B1.b — `y2k-illustrated-v2.html` — *scrapbook*

Same warm y2k feeling as B1, shifted from lavender/cream to a peach/sage/rose palette and reorganized as a scrapbook/letter. Centered polaroid hero with orbiting sticky-notes; case studies as taped polaroids; About section as a handwritten letter; Contact as a literal postcard.

**Palette**
| Token | Hex | Use |
|---|---|---|
| peach | `#FFE9D4` | Background |
| cream | `#FFFBF2` | Cards |
| cacao | `#2E1E14` | Primary text (warmer than navy) |
| rose | `#E8528F` | Primary accent |
| sage | `#7FB085` | Secondary accent |
| tangerine | `#F4A261` | Tertiary |
| lilac | `#C5B3F5` | Chip accents |
| butter | `#FFEDA0` | Tape, highlights |
| cherry | `#C44569` | Reserved |

**Type**
- Display: **Instrument Serif** (italic-heavy) — 40/56/96/136 px
- Handwritten: **Caveat** — 20/22/26/32 px (heavier use than B1 — structural, not decorative)
- Body: **Poppins** — 14/16/18 px

**Layout beats**
- Centered polaroid portrait with rotated yellow-tape corners
- 4 sticky-note cards float around portrait (stats as handwritten notes)
- Two case studies as taped polaroid cards, alternating rotations
- "What I'm on this month" — a personality widget (listening / reading / eating / sketching)
- About as an illustrated letter with "Dear reader, … con cariño, Melissa"
- Contact as a literal postcard with stamp, address field, dashed divider

**Animation intent**
| Element | Behavior | Duration / Ease | Framework hint |
|---|---|---|---|
| Hero ornaments | `.f1 / .f2 / .f3` parallax floats, `translate + rotate`, different phases | 6–9s `ease-in-out` infinite | CSS custom-prop `--rot` so rotation animates around author-set angle |
| Hand-drawn underline | Inline SVG path, rose stroke | static | Upgrade: Rough.js runtime OR Lottie stroke-in on view |
| Polaroid cards | Rotate on load, `lift` on hover (`-6px, -.6deg`) | 500ms `ease-out-back` | CSS |
| Contact postcard | `rotate(-1deg)` persistent, tape corners absolute | static | CSS; could add drag-release spring via Framer Motion |
| Dot grid (`.dot-grid`) | Static | n/a | Background radial-gradient pattern |
| Wave hand | Rotation keyframe on hero emoji | 2.6s infinite | CSS |
| Letter-style About | Dashed borders, handwritten caption kickers | static | Semantic `<article>` with styled `<blockquote>` |

---

### B2 — `y2k-maximalist.html`

**Palette**
| Token | Hex | Use |
|---|---|---|
| hot-red | `#E63946` | Case 01 bg |
| neon-pink | `#FF006E` | Accents, About bg |
| ink-navy | `#0F1B3D` | Primary text, dark surfaces |
| cream | `#FFF8F3` | Background |
| volt | `#F5FF00` | Stickers, offsets |
| elec-blue | `#00B4FF` | Case 02 bg |
| lime | `#C7FF5B` | Reserved |

**Type**
- Display: **DM Serif Display** (regular + italic) — 56/120/224 px
- Sans: **Space Grotesk** — 11/14/16/18 px, weight 400–700
- Accent: **Righteous** — 22/26/28 px uppercase for logo + footer marquee

**Layout**
- Top ticker banner + sticky nav with sticker CTA
- Radial-gradient hero (neon-pink → hot-red → ink-navy) with noise overlay, floating stickers
- 4-cell stat strip (color blocks, sharp borders)
- Giant serif marquee (`BRAND ★ EDITORIAL ★ …`)
- Case 01 (hot-red bg) + Case 02 (electric-blue bg) as full-bleed color sections
- Sticker-style sidebar cards (`box-shadow: 6px 6px 0` offset, varying colors)
- 13-project archive grid on cream
- Neon-pink About with polaroid placeholder
- Ink-navy contact with spinning stars + sticker CTA
- Volt footer marquee

**Animation intent**
| Element | Behavior | Duration / Ease | Framework hint |
|---|---|---|---|
| Hero "MELISSA" / "ENCARNACION" | Mask reveal per word, stagger 100ms | 1000ms `ease-out-quint` | Motion split + `clip-path` |
| Sticker cards | Hover → offset shadow grows (6 → 10px), translate (-3,-3) | 300ms `ease-out-back` | CSS |
| Two marquees | One forward, one reversed | 22s linear infinite | CSS `.marq` / `.marq-rev` |
| Floating stickers (3) | `translate + rotate` parallax orbits | 5–7s `ease-in-out` infinite | CSS |
| Pulsing "open" dot | 2-step blink | 1s steps(2) infinite | CSS |
| Noise overlay | Static SVG turbulence, `mix-blend-mode: multiply` | n/a | Inline SVG data URI (wired) |
| Spin stars in contact | Slow rotate 14s, one reversed | infinite | CSS |
| Text outline | `-webkit-text-stroke` on display | n/a | CSS (fallback: SVG) |
| Ticker blink | .blink on "NEW" dot | 1s infinite | CSS |

### B2.b — `y2k-maximalist-pink.html` — *bubblegum*

Structurally identical to B2 (same stickers, marquees, noise, text-outline serifs) with the primary color swapped from hot-red `#E63946` to bubblegum `#FF3E9D` and a deeper magenta `#D400A8` replacing the electric-blue case-study section. Feels femme-loud instead of punk-loud.

**Palette**
| Token | Hex | Use |
|---|---|---|
| bubble | `#FF3E9D` | **Primary** — hero gradient stop, case 01, CTAs |
| magenta | `#D400A8` | Case 02 bg, hero gradient mid |
| cotton | `#FFB3D9` | About bg, archive chip |
| blush | `#FFDAE9` | Stat card row |
| ink-navy | `#0F1B3D` | Text, dark surfaces |
| cream | `#FFF8F3` | Background |
| volt | `#F5FF00` | Offsets, marquees, stickers |
| elec-blue | `#00B4FF` | Reserved (unused here — was case 02 in B2) |

**Palette diff vs B2**
- Hero gradient: `hot-red → navy` → now `bubble → magenta → navy`
- Case 01 bg: `hot-red` → `bubble`
- Case 02 bg: `elec-blue` → `magenta`
- About bg: `neon-pink` → `cotton` (softer)
- `-webkit-text-stroke` outline: `#0F1B3D` still; added `.outline-text-bubble` variant

**Animation intent** — identical to B2 (mask reveal, sticker hover offset, dual marquees, spinning stars, noise overlay, blinking dot). Nothing structurally changed, only color tokens.

**When to pick this over B2**
- Brand feels more "beauty · lifestyle · feminine" than "punk · editorial"
- Paired with softer photography / portraiture
- Bubblegum as dominant reads playful-bold; red reads aggressive-bold

---

## Images

All hero/detail imagery is hot-linked from Behance CDN:
- Estelar: `mir-s3-cdn-cf.behance.net/project_modules/1400/3666ab229654899.68685cc14afa5.jpg`
- Alkasa: `mir-s3-cdn-cf.behance.net/project_modules/1400/6f22aa231578247.68d6abb0e599d.png`
- Liquid Beer: `mir-s3-cdn-cf.behance.net/project_modules/1400/6fe3ac231427501.688b827153a47.png`
- + secondary `fs_webp/` detail plates from the same source per project

For production: proxy + optimize via Next.js `<Image>` or Cloudflare Images; all 45 source URLs are in `.context/behance_structured.json`.

---

## Conversion path to production code

Recommended stack: **Next.js 15 (App Router) + Tailwind v4 + Framer Motion + Sanity/Payload CMS**. Each design converts cleanly:

1. **Lift Tailwind tokens** from the inline `tailwind.config` into `tailwind.config.ts` or `@theme` block.
2. **Page sections → React components** — `<Hero/>`, `<CaseCard/>`, `<Marquee/>`, `<StickerPill/>`, `<Colophon/>`.
3. **Animations → Framer Motion variants.** Most CSS keyframes here map 1:1:
   - `mask-reveal` → `motion.span` with `initial={{ y: '105%' }}` + `whileInView`
   - Card `lift` → `whileHover={{ y: -6, rotate: -0.5 }}`
   - Marquees → `motion.div` with `animate={{ x: ['0%','-50%'] }}` + `repeat: Infinity`
4. **Lottie where CSS tops out** — hand-drawn underline stroke-in, scribble star, animated salami illustration for case hero.
5. **Content → CMS.** Case studies + bio + stats are all editable. 13 projects already catalogued in `.context/` with copy + image refs.
6. **Accessibility pass** — all four designs use real semantic HTML (`article`, `figure`, `dl`, `nav`, `header`, `footer`, `aside`), but color-contrast on `y2k-illustrated` (lavender bg) needs check for body copy; `y2k-maximalist` has `-webkit-text-stroke` which doesn't always pass AA.

---

## How to view

```sh
cd .context/designs
python3 -m http.server 7788
# open http://localhost:7788/editorial-dashboard.html
```

Then resize to 375 × 812 in devtools for mobile check.

---

## Open questions for Melissa

1. Which direction — A (editorial/serious) or B (y2k/warm)?
2. Between the two variations of the chosen direction: which feels more **you**?
3. Are the two case studies (Estelar + Alkasa) the right pair for the landing page, or should Humano Seguros / Banco Popular 60 swap in?
4. Do we want a dedicated `/work` page with all 13 projects, or keep everything on the landing?
5. Portrait photo — provide a high-res portrait? All 4 designs have a placeholder waiting for it.
6. Resume PDF link — attach, or skip in favor of LinkedIn?
