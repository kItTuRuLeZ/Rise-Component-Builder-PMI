# Rise Component Builder (PMI Edition)

Rise Component Builder is a standalone browser-based authoring tool designed to create, preview, and export interactive eLearning components built specifically to **PMI (Project Management Institute) brand standards** for Articulate Rise 360 and compatible HTML learning platforms.

---

## Core Product Philosophy

> *"Use native Rise when Rise already does the job well. Use this builder when the learning experience requires behavior that Rise cannot provide."*

---

## Next-Level Architecture & Features (v2.5.0)

### 0. Course Projects Dashboard & Multi-Component Workspace (Schema v3)
- **Projects Dashboard**: Centralized course management with search, filter chips (*All*, *Favorites*, *Recent*), sorting, and template creation (*Standard*, *Compliance*, *Microlearning*, *Blank*).
- **Multi-Module Workspace**: Organize courses into sections/modules containing multiple component instances.
- **Component Picker**: Browse and insert any of the 26 interactive components directly into course sections.
- **Course Tools**: Full Course Preview (with Desktop/Tablet/Mobile viewports), Shared Media Library (with usage reference tracking), and Course QA Readiness Auditor.
- **Structured Multi-Component Export**: Download structured ZIP packages containing all modules, HTML blocks, media assets, and course navigation.
- *Detailed Architecture*: See [`docs/PROJECT-DASHBOARD.md`](docs/PROJECT-DASHBOARD.md).

### 1. Strategic Component Tiers
Every component in the 26-archetype registry is categorized with an intentional strategic tier:
- **Tier 1: Signature Interactions (Flagship)**: Complex behaviors unavailable in native Rise (e.g. *Interactive Video*, *Confidence Matrix*, *Dial Gauge*, *Comparison Slider*, *Card Carousel*, *Callout Matrix*).
- **Tier 2: Enhanced Rise Equivalents**: Advanced supersets of native Rise blocks offering sequential locking, progress badges, search, and granular tracking (e.g. *Accordion*, *Tab Blocks*, *Vertical Timeline*, *Flip Cards*).
- **Tier 3: Specialized Media & Assessments**: Bespoke layouts for custom structured content (e.g. *Learning Audio Player*, *Learning Video Player*, *Sorting Activity*, *Fill in the Blank*).

### 2. Learning-Purpose Discovery Taxonomy
Filter and discover components by their instructional learning objective:
- `Explore` · `Compare` · `Practice` · `Reflect` · `Assess` · `Explain` · `Navigate` · `Media`

### 3. Component Details & Quick Inspection
Inspect rich component previews, capability breakdowns, native Rise comparison advice, accessibility ratings, and ready-to-use starter presets before entering the editor.

### 4. 4-Section Editor Information Architecture
- **Content**: Block titles, descriptions, and dynamic item cards with instant inline editing.
- **Interaction**: Sequencing, shuffle, retry limits, hints, search, and branching behavior.
- **Appearance**: PMI editorial headline styling with an Aqua rule and an optional PMI symbol accent, spacing density (`Compact`, `Standard`, `Spacious`), and context bands.
- **Completion**: Plain-language exploration criteria, Rise iframe postMessage integration guidance, and host gating rules.

### 5. Standardized Item Authoring & Bounded History
- **Item Actions**: Reorder (Up/Down / `Alt+Up`/`Alt+Down`), Duplicate (`Alt+D`), Delete (`Alt+Delete`), and live item count badges.
- **Undo / Redo Manager**: 50-step bounded history stack with `Ctrl+Z` (Undo), `Ctrl+Y` / `Ctrl+Shift+Z` (Redo), and debounced input coalescing.

### 6. Authentic Workplace Starter Presets
Realistic project-management scenarios (project kickoff, delivery approaches, risk and scope handling, stakeholder conversations, status reporting, retrospectives) that instantly populate components with sample content to adapt. They are illustrative, not PMI policy.

### 7. Rise Canvas & 4-Pillars Preflight Widget
- **Rise Canvas**: Simulated 960px Rise 360 block container with multi-viewport testing (`Desktop`, `Tablet 768px`, `Mobile 430px`, `Mobile 375px`, `Full Popout`).
- **4-Pillars Preflight**: Real-time compliance verification across *Brand & Typography*, *WCAG 2.1 AA Accessibility*, *Rise 360 Compatibility*, and *Media Budgets*.

---

## Brand Compliance Standards

All component templates, stylesheets, and export generators follow PMI's brand identity, summarised in [`design/PMI-Rise-Design-Standards.md`](design/PMI-Rise-Design-Standards.md) and extracted from the source guidelines in [`design/PMI-BRAND-EXTRACT.md`](design/PMI-BRAND-EXTRACT.md). The 2024 colour guide is current; the 2019 Visual Identity Guidelines still govern logos and symbols.

### 1. Color System & Design Tokens
- Sourced from `design/pmi-tokens.css` (mirrored verbatim in `js/pmi-tokens.js`).
- **Violet 500 (`#4F17A8`)** is the primary brand colour and carries CTAs, links and focus rings (10.4:1 on white).
- **Aqua 500 (`#00799E`)** is the text-safe accent (5.0:1 on white). **Aqua 300 (`#05BFE0`)** and **Tangerine 300 (`#FF610F`)** are decorative only; on dark surfaces they may carry text.
- **Tangerine** (`#D5340B`) is the warning colour; Saddle is not used.
- **Neutrals**: warm neutrals (`#F7F4EF`, `#E7E4DC`, `#CFCBC2`), Off-Black `#200F3B`, muted text `#574E69`.

### 2. Typography
- **Aeonik** is the primary face (headlines, page titles, body; Bold for emphasis). **GT Pressura Mono** is secondary (subtitles, captions, footers). Fallback: Aptos, then Arial.
- **Six WOFF2 cuts** are subset to Latin and embedded in every export (Aeonik 400, 400 italic, 500, 700; GT Pressura Mono 400, 700), generated by `scripts/build-pmi-fonts.py` from the licensed files in `PMI branding guidelines/Fonts/` (not in git). These are commercial fonts embedded on the project owner's confirmation that PMI permits it; reconfirm before reusing this repository.
- **16px body floor**: All learner-facing body copy keeps a 16px minimum with `1.5` line-height.

### 3. Curvature & Geometry
- Outer block shells and content cards: `--pmi-radius-xl` / `--pmi-radius-lg` (24px)
- Buttons & form controls: `--pmi-radius-sm` (4px)
- Small cards & menus: `--pmi-radius-md` (8px)
- Chips & tags: `--pmi-radius-pill`

### 4. Symbols and logos
- Eight PMI symbols (`js/pmi-symbols.js`, generated from PMI's SVGs) are used as an optional block-header accent (on by default, "auto" picks one per component type), as photo "holding shapes" for item media, and as a dashboard pattern. Rules enforced in code: three core colours, spacing 1/7 of the symbol width, no same colour adjacent, under 75% coverage, decorative (`aria-hidden`), never behind text.
- The PMI logo (`js/pmi-logos.js`, generated by `scripts/build-pmi-logos.mjs`) is placed on the dashboard hero: white on dark, at least 32px tall with 1/2X clear space.

### 5. Iconography
- Functional icons come from `js/pmi-icons.js` (the icon set inherited from the AT&T build, kept by decision; they are generic functional glyphs).

### 6. Interaction States & Accessibility
- **Focus visible**: 3px solid `--pmi-focus` (Violet `#4F17A8`) outline with 2px offset.
- **Touch targets**: 44×44px minimum touch target size.
- **Motion**: Zeroed out under `@media (prefers-reduced-motion: reduce)`.
- **WCAG AA Compliance**: text pairs at 4.5:1 or better, non-text at 3:1, checked with axe in the end-to-end suite.

---

## Tooling & Verification Commands

- **Development server**: `npm run dev`
- **Unit & Integration tests**: `npm test`
- **Brand Compliance Linter**: `npm run lint:brand`
- **TypeScript type checking**: `npm run typecheck`
- **Code Coverage report**: `npm run test:coverage`
- **Cache-busting stamper**: `npm run stamp`
- **Full validation pipeline**: `npm run validate`
- **Capture brand visual snapshots**: `npm run snapshots:brand`
- **Generate export fixtures**: `npm run fixtures:exports`
