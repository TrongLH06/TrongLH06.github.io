---
name: Sonic Dark Canvas
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#181818'
  surface-container-high: '#292a2a'
  surface-container-highest: '#343535'
  on-surface: '#e3e2e2'
  on-surface-variant: '#bbcbb8'
  inverse-surface: '#e3e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#859583'
  outline-variant: '#3c4a3c'
  surface-tint: '#34e36a'
  primary: '#4cf479'
  on-primary: '#003913'
  primary-container: '#1ed760'
  on-primary-container: '#005721'
  inverse-primary: '#006e2c'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#d9d7d6'
  on-tertiary: '#303030'
  tertiary-container: '#bdbbbb'
  on-tertiary-container: '#4b4b4b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#69ff89'
  primary-fixed-dim: '#34e36a'
  on-primary-fixed: '#002108'
  on-primary-fixed-variant: '#00531f'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#121414'
  on-background: '#e3e2e2'
  surface-variant: '#343535'
  brand-green-press: '#1DB954'
  surface-base: '#121212'
  surface-elevated: '#242424'
  surface-highlight: '#2A2A2A'
  text-primary: '#FFFFFF'
  text-muted: '#A7A7A7'
  category-pink: '#DC148C'
  category-teal: '#006450'
  category-blue: '#0D73EC'
  category-purple: '#8400E7'
  category-orange: '#E13300'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system channels an immersive, audio-first dark aesthetic rooted in modern music streaming interfaces. The brand personality is bold, rhythmic, focused, and fluid. The visual experience is crafted around deep atmospheric darks that recede into the backdrop, allowing dynamic cover artwork, high-energy category tiles, and crisp typography to take center stage.

Targeting music lovers, creators, and listeners seeking friction-free exploration, the interface balances utility with discovery. Visual complexity is minimized to keep attention on playback, curated discovery, and tactical search navigation. The emotional tone evokes late-night listening sessions: sleek, focused, low-fatigue, and unmistakably vibrant.

The design movement combines **Modern High-Contrast Dark Mode** with **Tactile/Pill Modular Elements**. It utilizes layered, matte-dark surfaces instead of harsh borders, paired with signature electric accents and expressive browse tiles to drive engagement.

## Colors

The palette revolves around deep pitch and charcoal surfaces accented by an unmistakable electric green. 

- **Primary (`#1ED760`)**: Reserved strictly for high-priority interactive moments—play actions, active toggle states, primary CTAs, and active progress indicators. It shifts to `#1DB954` on active/pressed interactions.
- **Surface Hierarchy**: `#121212` serves as the canvas backdrop. Content blocks nest within `#181818` containers, while interactive cards and floating surfaces rise to `#242424` and `#2A2A2A` on hover.
- **Text Layers**: Pure `#FFFFFF` commands the primary hierarchy for titles, artists, and prominent actions. Secondary metadata, timestamps, and placeholder labels adopt `#B3B3B3` and `#A7A7A7` to maintain optical balance and eliminate eye strain in dark environments.
- **Category Accents**: Vibrant category-specific tokens (`category-pink`, `category-teal`, `category-blue`, etc.) provide saturated, expressive backgrounds for discovery cards within the search and browse grids.

## Typography

The type system is powered by **Plus Jakarta Sans**, offering a clean geometric construction with rounded inner forms that capture the contemporary spirit of modern streaming platforms.

- **Headlines & Display**: Set with tight negative letter-spacing and heavy weights (`700` and `800`) to create authoritative section headers and search entry points.
- **Body & Captions**: Clean, legible, and unpretentious at small scale. Body copy relies on neutral tones (`#B3B3B3`) to separate secondary descriptions and track credits from track titles.
- **Labels**: Capitalized or medium-weighted tokens for pill tags, navigation categories, and compact metadata badges use slightly increased letter tracking to maintain legibility against dark backdrops.

## Layout & Spacing

The layout adopts a flexible fluid-grid framework paired with a fixed left navigation sidebar on desktop and a compact navigation rail or bottom bar on smaller devices.

- **Grid Architecture**: 
  - **Desktop (1024px+)**: 12-column grid, `margin: 2rem`, `gutter: 1.5rem`. Browse cards arrange in responsive repeating columns (spanning 2 to 3 columns per item).
  - **Tablet (768px - 1023px)**: 8-column grid, `margin: 1.5rem`, `gutter: 1rem`.
  - **Mobile (< 768px)**: 4-column grid, `margin: 1rem`, `gutter: 1rem`. Browse categories collapse to a 2-column card layout.
- **Vertical Rhythm**: Main sections maintain `space-xl` (32px) separation. Search filter chips and track listing items rely on compact `space-xs` to `space-sm` increments to maximize content density without visual noise.

## Elevation & Depth

This system avoids heavy drop shadows, instead utilizing **tonal surface stepping** and **ambient dark diffusion** to establish hierarchy.

1. **Level 0 (Canvas Base)**: `#121212` — Root viewport background.
2. **Level 1 (Panels & Shells)**: `#181818` — Fixed navigation panels, side drawers, and persistent search shells.
3. **Level 2 (Resting Cards & Tiles)**: `#242424` or pure saturated category color hexes.
4. **Level 3 (Hover & Floating Elements)**: `#2A2A2A` for track rows and hovered cards, accompanied by an ambient soft shadow (`0 8px 24px rgba(0, 0, 0, 0.5)`) for popovers, context menus, and elevated floating play buttons.
5. **Backdrop Blur**: Modals, dropdown menus, and sticky navigation headers leverage a subtle frosted blur (`backdrop-filter: blur(24px); background-color: rgba(18, 18, 18, 0.75)`) ensuring seamless layering over moving content.

## Shapes

The shape system leans into extreme soft radii and full pill capsules, creating a friendly, organic, and tactile touch experience.

- **Pill Capsules (`roundedness: 3`)**: Applied to search input fields, category filter tags, primary action buttons, and status chips.
- **Card Containers**: Browse categories, album tiles, and modal dialogs feature a refined `rounded-lg` (1rem) or `rounded-xl` (1.5rem) border radius to soften geometric cards.
- **Album & Track Artwork**: Retains an intentional compact radius of 4px to 8px to preserve cover art framing.
- **Browse Category Cutouts**: Dynamic category tiles feature an internal tilted square image rotated between 18° and 25°, masked and clipped within the rounded card overflow.

## Components

### Buttons
- **Primary Play Button**: High-saturation `#1ED760` circular or pill-shaped container, `#121212` bold icon/label. Scale up slightly (`transform: scale(1.04)`) on hover; shift to `#1DB954` when active.
- **Secondary / Ghost Button**: Fully transparent background, pure `#FFFFFF` text with a 1px subtle outline (`rgba(255, 255, 255, 0.3)`), shifting to solid white border on hover.
- **Pill Filter Tags**: Neutral pill buttons using `#242424` fill, `#FFFFFF` text. Active state switches to full `#FFFFFF` fill with `#121212` text.

### Search Bar
- Pill-shaped input container (`height: 48px`, full capsule radius).
- Background: `#242424` resting, shifting to `#2A2A2A` with a 1px border (`#FFFFFF`) on focus.
- Leading search icon in `#B3B3B3`, persistent clear button on the trailing edge.

### Browse & Category Cards
- Bold, colorful rectangular containers (`aspect-ratio: 1 / 1` on mobile, `1.6 / 1` on desktop).
- Top-left aligned bold headline (`headline-md`, white).
- Bottom-right rotated album art (rotated at 25 degrees, overlapping the card boundary with hidden overflow, casting an internal shadow `0 2px 8px rgba(0,0,0,0.4)`).

### Track Lists & Row Items
- Full-width interactive horizontal row. Height: 56px.
- Background: Transparent resting; transitions to `#2A2A2A` on hover with a 4px corner radius.
- Leading track index switches to an inline green play icon on hover.
- Title in `#FFFFFF`, artist name and album in `#B3B3B3`.

### Inputs, Checkboxes & Radio Buttons
- Form controls adopt dark `#242424` base fills with 1px muted outlines.
- Selected state fills with `#1ED760` using high-contrast `#121212` check/bullet marks.