---
version: alpha## Overview

PostHog's marketing system is built on the visual contradiction at the heart of the brand: a serious open-source product analytics platform rendered as if it were a friendly engineering sketchbook. The chrome runs on a warm cream canvas (`{colors.canvas}` — `#eeefe9`) — not white — and every page is dotted with hand-drawn hedgehog mascots in lab coats, lounge chairs, terminals, and reading glasses, scattered across the layout like marginalia in a textbook. Type sits in IBM Plex Sans Variable at olive-gray (`{colors.body}` — `#4d4f46`) for body and deep olive-charcoal (`{colors.ink}` — `#23251d`) for headlines, with weights stepped tightly between 400, 600, 700, and 800 to create hierarchy without color. The single saturated yellow-orange pill (`{colors.primary}` — `#f7a501`) is the brand's only loud chromatic moment; everything else is cream, olive, white card, and the occasional pastel callout band.

The system has a distinctive **two-mode body layout**: marketing pages (home, workflows, pricing) lean on alternating-pastel callout bands and feature tiles in white cards on cream, while documentation pages add a sticky 240px left sidebar with a rounded outline-icon section list. Code samples are full-width dark blocks on `{colors.surface-dark}` (the same olive-charcoal that carries body ink, used inverted) inside white doc cards, creating the system's most distinctive visual moment: a dark-on-dark code island floating inside a white card on a cream canvas, with a hedgehog mascot doodled in the margin.

Sections stack at `{spacing.section}` (80px) rhythm with cream canvas continuing edge-to-edge between them. The only color bands that interrupt the cream are pastel `{component.banner-tip-blue}` / `-green` / `-red` / `-purple` callout panels inside doc articles — soft tinted boxes that carry "💡 Tip", "✅ Success", "⚠️ Warning", "📘 Info" inline annotations. There are no decorative gradients, no atmospheric mesh backgrounds, and no full-bleed dark hero chapters; the cream canvas runs uninterrupted top to bottom and the hedgehogs are the entire visual identity.

**Key Characteristics:**
- Warm cream canvas (`{colors.canvas}` — #eeefe9) end-to-end with no surface alternation between sections — the page is one continuous sheet
- Single yellow-orange CTA pill (`{colors.primary}` — #f7a501) with deep olive text (`{colors.on-primary}`) — the brand's only saturated color
- IBM Plex Sans Variable across every text role with weights 400/500/600/700/800 — no other typeface in the system
- Hand-drawn hedgehog mascots scattered across the layout as the entire decorative system — no gradients, no mesh, no atmospheric backgrounds
- 4–8px radius card vocabulary: `{rounded.md}` (6px) for most components, `{rounded.lg}` (8px) for select containers, fully rounded for pill chips
- Pastel callout banners (`{colors.accent-blue-soft}`, `{colors.accent-green-soft}`, `{colors.accent-red-soft}`, `{colors.accent-purple-soft}`) break up doc article body with soft tinted side rails for tips/warnings/info
- Documentation pages add a sticky 240px `{component.doc-sidebar}` with rounded outline-icon section nav and an "Ask PostHog AI" CTA at the top

## Colors

> **Source pages:** `/` (home), `/pricing` (pricing detail), `/docs/product-analytics` (docs article), `/workflows` (product feature page). The chrome palette is identical across all four pages — only doc-specific accents (callout-banner pastels, code-block dark surface) appear exclusively inside the docs experience.

### Brand & Accent
- **PostHog Yellow** (`{colors.primary}` — `#f7a501`): the universal primary CTA. Sticky "Get started — free" pill in the top-right of every nav, hero CTAs, pricing-tier subscribe buttons, footer signup pill. The system's only saturated chromatic moment.
- **Yellow Pressed** (`{colors.primary-pressed}` — `#dd9001`): pressed state for the primary pill.
- **Yellow Active** (`{colors.primary-active}` — `#b17816`): deeply-pressed yellow + the system's gold-toned border accent (rare 1px gold rule on inline form elements).

### Surface
- **Canvas** (`{colors.canvas}` — `#eeefe9`): the warm cream page background. End-to-end on every page; the brand's most distinctive surface choice.
- **Soft Surface** (`{colors.surface-soft}` — `#e5e7e0`): button-secondary fill, sub-nav strip background, inline-code chip background.
- **Surface Card** (`{colors.surface-card}` — `#ffffff`): true white card and tile background sitting on top of the cream canvas. The dominant card surface.
- **Surface Doc** (`{colors.surface-doc}` — `#fcfcfa`): a faintly cream-warm white used inside doc article body cards — slightly softer than pure white to keep the page tonally unified.
- **Surface Dark** (`{colors.surface-dark}` — `#23251d`): the deep olive-charcoal used inverted as code-block background. The same hex as `{colors.ink}` — the brand uses one olive-near-black for both text and dark code surfaces.
- **Hairline** (`{colors.hairline}` — `#bfc1b7`): 1px card border, table rule, footer column dividers.
- **Hairline Soft** (`{colors.hairline-soft}` — `#dcdfd2`): in-card row divider, soft inset rule.
- **On Dark** (`{colors.on-dark}` — `#ffffff`): primary text on `{colors.surface-dark}` code blocks.

### Text
- **Ink** (`{colors.ink}` — `#23251d`): headlines, button text on light, primary nav links — deep olive-charcoal that reads near-black against cream.
- **Body** (`{colors.body}` — `#4d4f46`): default paragraph text, doc article body, inline link color before hover. The brand's most-used text color.
- **Charcoal** (`{colors.charcoal}` — `#33342d`): emphasized body text where body is too soft.
- **Mute** (`{colors.mute}` — `#6c6e63`): metadata, footer link text, in-list secondary annotations.
- **Ash** (`{colors.ash}` — `#9b9c92`): disabled-state text and lowest-emphasis utility.
- **Stone** (`{colors.stone}` — `#b6b7af`): least-emphasis caption text and disabled icon color.

### Semantic
- **Link Blue** (`{colors.link-blue}` — `#1d4ed8`): inline anchor link inside body prose. The system's primary informational link color.
- **Link Teal** (`{colors.link-teal}` — `#1078a3`): doc-article inline link variant, paired with body text.
- **Accent Blue** (`{colors.accent-blue}` — `#2c84e0`) + **Accent Blue Soft** (`{colors.accent-blue-soft}` — `#dceaf6`): "💡 Tip / Info" callout banner inside docs.
- **Accent Red** (`{colors.accent-red}` — `#cd4239`) + **Accent Red Soft** (`{colors.accent-red-soft}` — `#f7d6d3`): "⚠️ Warning / Caution" callout banner.
- **Accent Green** (`{colors.accent-green}` — `#2c8c66`) + **Accent Green Soft** (`{colors.accent-green-soft}` — `#d9eddf`): "✅ Success / Positive" callout banner.
- **Accent Purple** (`{colors.accent-purple}` — `#7c44a6`) + **Accent Purple Soft** (`{colors.accent-purple-soft}` — `#e7d8ee`): "📘 Note / Reference" callout banner.
- **Focus Ring** (`{colors.focus-ring}` — `rgba(59,130,246,0.5)`): translucent blue browser-default focus ring around interactive elements.

## Typography

### Font Family
**IBM Plex Sans Variable** is the system's primary face — used across every text role on every page at weights 400 (regular), 500 (medium), 600 (semibold), 700 (bold), and 800 (extra-bold). Falls back through `IBM Plex Sans` → `-apple-system` → `system-ui` → broad cross-platform sans stack.

**ui-monospace** + **Source Code Pro** carry code samples and inline-code chips at 14px / 1.43 line-height. Source Code Pro is the explicit display monospace; ui-monospace handles inline `<code>` chips.

The brand-distinctive choice is the **mixed weight ladder** (400 / 500 / 600 / 700 / 800) — most chrome lives in the 400–700 band, with weight 800 reserved exclusively for the larger display headlines on home and pricing. This gives the system its "engineering blog" feel: hierarchy is built from weight contrast much more than from size.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 36px | 700 | 1.5 | 0 | Hero headline ("The new way to build products") |
| `{typography.display-lg}` | 24px | 800 | 1.33 | -0.6px | Section headline, pricing tier name |
| `{typography.heading-lg}` | 21px | 700 | 1.4 | -0.5px | Sub-section heading, doc-article H2 |
| `{typography.heading-md}` | 20px | 700 | 1.4 | 0 | Card group title, in-grid heading |
| `{typography.heading-sm}` | 18px | 700 | 1.5 | 0 (uppercase) | Section eyebrow ("UNDERSTAND PRODUCT USAGE") |
| `{typography.heading-sm-mixed}` | 18px | 600 | 1.56 | 0 | Card title in mixed-case (no uppercase transform) |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Body copy, default paragraph |
| `{typography.body-strong}` | 16px | 600 | 1.5 | 0 | Inline emphasis, primary nav link, in-card label |
| `{typography.body-sm}` | 15px | 400 | 1.71 | 0 | Doc article body, marketing card description |
| `{typography.body-sm-strong}` | 15px | 600 | 1.71 | 0 | Sub-section emphasis inside doc article |
| `{typography.body-xs}` | 14px | 500 | 1.43 | 0 | Doc sidebar item, metadata, in-list caption |
| `{typography.caption-md}` | 14px | 700 | 1.71 | 0 | Card eyebrow, link cluster header |
| `{typography.caption-sm}` | 13px | 500 | 1.5 | 0 | Compact metadata caption |
| `{typography.caption-xs}` | 12px | 600 | 1.33 | 0 (uppercase) | Inline badge label |
| `{typography.utility-xs}` | 12px | 700 | 1.33 | 0 (uppercase) | Section-eyebrow utility text, footer category header |
| `{typography.link-md}` | 16px | 400 | 1.5 | 0 | Inline body anchor link |
| `{typography.button-md}` | 14px | 700 | 1.5 | 0 | Standard primary/secondary button label |
| `{typography.button-sm}` | 13px | 500 | 1 | 0 | Pill chip / compact CTA |
| `{typography.code-sm}` | 14px | 400 | 1.43 | 0 | Code block content |
| `{typography.code-xs}` | 14px | 500 | 1.43 | 0 | Inline code chip |

### Principles
The hierarchy is explicitly built from weight + size + occasional uppercase transform — there is no italic style, no decorative display variant, no proprietary face. The biggest display moments use weight 800 with -0.6px tracking, and the body settles at 400 with 1.5 line-height; everything else fills the band between. Section eyebrows (`{typography.heading-sm}` and `{typography.utility-xs}`) consistently render uppercase, which gives the doc layout its textbook-chapter feel.

### Note on Font Substitutes
IBM Plex Sans Variable is open-source and Google-Fonts-hosted. There is no need for a substitute — load it directly. If a substitute is genuinely needed, **Inter** is the closest geometric match at all five weights; pair with Inter's letter-spacing -0.5 to -0.6px on display sizes to approximate Plex's display tracking. For monospace, **JetBrains Mono** is a near-perfect substitute for Source Code Pro at body sizes.

## Layout

### Spacing System
- **Base unit:** 8px (with finer 2/4/6px steps for tight inline gaps in callout banners and pill buttons).
- **Tokens (front matter):** `{spacing.xxs}` (2px) · `{spacing.xs}` (4px) · `{spacing.sm}` (8px) · `{spacing.md}` (12px) · `{spacing.lg}` (16px) · `{spacing.xl}` (24px) · `{spacing.xxl}` (32px) · `{spacing.section}` (80px).
- **Universal section rhythm:** every page in the set uses `{spacing.section}` (80px) as the vertical gap between major content blocks. Card grids use `{spacing.lg}` (16px) gutters; card internal padding sits at `{spacing.xl}` (24px) for product cards and `{spacing.xxl}` (32px) for pricing tier cards.

### Grid & Container
- **Max width:** ~1280px content area at desktop with 24px gutters (~48px at ultrawide). Doc article body sits at ~720px max width with the 240px sidebar pushing the article column right of center.
- **Marketing card grid:** 4-up at desktop, 3-up at 1024px, 2-up at 768px, 1-up at 480px. Cards preserve a fixed 1:1 or 4:3 ratio.
- **Pricing tier grid:** 3-up at desktop with a left rail of plan info, collapsing to 2-up + 1 at tablet and 1-up at mobile.
- **Doc layout:** desktop 240px sticky left sidebar + ~720px article body + (optional) 200px right TOC rail = ~1160px content width.
- **Footer:** 6-column horizontal link grid at desktop, 3-up at tablet, 2-up at mobile.

### Whitespace Philosophy
Whitespace is generous on marketing pages and tight on doc pages. The home and workflows pages stack feature tiles with `{spacing.lg}` (16px) gutters and 24px internal padding, while doc articles tighten internal spacing to `{spacing.md}` (12px) between paragraphs to maximize information density. The cream canvas runs continuously through every section — there are no decorative dividers, no shaded section bands; only the 1px hairline beneath section eyebrows and footer column rules separate content blocks.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | No border, no shadow | Default for canvas-on-canvas blocks, hero text, body sections |
| 1 — Hairline border | 1px solid `{colors.hairline}` | Marketing cards, pricing tier cards, doc sidebar items, footer column rules |
| 2 — Hairline soft | 1px solid `{colors.hairline-soft}` | In-card row divider between adjacent rows |
| 3 — Inverted dark code block | `{colors.surface-dark}` fill | Code samples inside doc cards — the system's only "elevated" surface uses color, not shadow |

The system has no drop-shadow elevation in marketing or product chrome. Cards sit flat on cream with thin olive borders. The single inverted moment is the dark code-block surface used inside doc article body cards.

### Decorative Depth
Depth comes entirely from illustration and the pastel callout band system, not from CSS effects:
- **Hand-drawn hedgehog mascots** — characters in various costumes (lab coat, terminal, lounge chair, magnifying glass, hammock, hat) scattered across pages as marginalia. Always rendered as flat color illustrations, never photographs.
- **Pastel callout banners** — `{component.banner-tip-blue}` / `-green` / `-red` / `-purple` soft tinted side-rail panels inside doc articles, each prefixed with an emoji icon (💡 ✅ ⚠️ 📘) and carrying tip/warning/note copy.
- **Code blocks** — full-width dark olive-charcoal panels on `{colors.surface-dark}` with white code text. The system's most cinematic surface, used inside white doc cards.
- **Outline product icons** in the doc sidebar — small rounded-square mini-illustrations (chart icon, funnel, session-replay icon) mark each major product section.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Sub-nav strip, footer, doc sidebar, primary nav — flat structural surfaces |
| `{rounded.xs}` | 2px | Inline `<code>` chips, micro-rule highlights |
| `{rounded.sm}` | 4px | Inline buttons, form inputs, micro chips |
| `{rounded.md}` | 6px | Marketing cards, pricing cards, doc cards, code blocks, every standard CTA |
| `{rounded.lg}` | 8px | Tab top corners (`6px 6px 0 0` on active tab) and rare large containers |
| `{rounded.full}` | 9999px | Pill chips and pill-style CTAs ("Get started — free" sticky CTA in nav) |

The radius vocabulary clusters around 4–6px for nearly everything; the only fully-rounded element is the pill-style sticky nav CTA and inline pill chips.

### Photography Geometry
There is no photography. Visual elements are limited to:
- **Hedgehog character illustrations** — flat-color cartoon hedgehogs ranging from ~80px (in-card mascot) to ~240px (hero illustration). Always at native aspect, never cropped to a frame.
- **Outline product icons** in the doc sidebar — 20–24px rounded-square illustrations.
- **Inline emoji** at 14–16px inside callout banners (💡 ✅ ⚠️ 📘) — used as functional iconography rather than decoration.
- **Section illustrations** on the home page — small hedgehog vignettes paired with each "Understand product usage" / "Build sticky habits" / "Test before launch" feature row.

## Components

> **No hover states documented** per system policy. Each spec covers Default and Active/Pressed only.

### Buttons

**`button-primary`** — the universal PostHog CTA
- Background `{colors.primary}` (yellow-orange), text `{colors.on-primary}` (deep olive), type `{typography.button-md}`, padding `8px 16px`, height `40px`, rounded `{rounded.md}`.
- Used for "Get started — free" (sticky top-nav CTA), "Sign up", "Try it free", "Subscribe" — every primary action.
- Pressed state lives in `button-primary-pressed` — background drops to `{colors.primary-pressed}`.

**`button-secondary`** — soft alternative on cream canvas
- Background `{colors.surface-soft}` (`#e5e7e0`), text `{colors.ink}`, type `{typography.button-md}`, padding `8px 16px`, height `40px`, rounded `{rounded.md}`.
- "Talk to sales", "Read docs", "Watch demo" — second-tier actions paired with the yellow primary.

**`button-tertiary`** — ghost text button
- Background transparent, text `{colors.ink}`, type `{typography.button-md}`, padding `8px 12px`, rounded `{rounded.md}`.
- Lowest-emphasis action: "See all docs →", "Browse all features".

**`button-disabled`**
- Background `{colors.surface-soft}`, text `{colors.ash}` — flat soft cream-gray.

### Tabs & Chips

**`product-tab`** + **`product-tab-active`** — major product section tabs
- Default: transparent background, text `{colors.body}`, type `{typography.body-strong}`, padding `8px 12px`, rounded `{rounded.md}`.
- Active: background flips to `{colors.surface-card}` (white), text `{colors.ink}` — the tab card lifts off the cream canvas as the visual signal of selection.

**`pill-tab`** + **`pill-tab-active`** — compact filter pill
- Default: transparent background, text `{colors.body}`, type `{typography.button-sm}`, padding `6px 14px`, rounded `{rounded.full}`.
- Active: background flips to `{colors.ink}`, text `{colors.on-dark}` — the chip flips fully inverted on selection.

**`badge-uppercase`** — text-only utility label
- Background transparent, text `{colors.body}` in `{typography.utility-xs}` (uppercase) — used as in-list category prefix ("FEATURE FLAG", "EXPERIMENT", "HEATMAP").

**`badge-promo`** — small inline pill chip
- Background `{colors.accent-blue-soft}`, text `{colors.link-blue}`, type `{typography.caption-xs}`, padding `2px 8px`, rounded `{rounded.full}`.
- "New", "Beta", "Coming soon" pill labels overlaid on cards.

### Inputs & Forms

**`text-input`** + **`text-input-focused`**
- Default: background `{colors.surface-card}`, text `{colors.ink}`, 1px solid `{colors.hairline}`, type `{typography.body-md}`, padding `8px 12px`, height `36px`, rounded `{rounded.md}`.
- Focused: same surface; 2px solid `{colors.accent-blue}` border replaces the 1px hairline + a translucent `{colors.focus-ring}` outline.

**`search-input`** — utility search field (doc sidebar, "Ask PostHog AI")
- Same dimensions as `text-input` with a magnifier glyph at the left edge in `{colors.mute}`.

### Cards & Containers

**`product-card`** — marketing tile / feature card
- Container: background `{colors.surface-card}` (white), 1px solid `{colors.hairline}`, padding `{spacing.xl}` (24px), rounded `{rounded.md}`.
- Layout: small hedgehog illustration at top-left, `{typography.heading-sm-mixed}` title, `{typography.body-sm}` description, optional `{component.button-tertiary}` "Learn more →" link.

**`doc-card`** — doc article body card
- Container: background `{colors.surface-doc}` (`#fcfcfa` warm-white), 1px solid `{colors.hairline}`, padding `{spacing.xl}` (24px), rounded `{rounded.md}`.
- Carries article body sections, code blocks, callout banners, and tables inside doc pages.

**`feature-tile`** — small marketing feature tile
- Container: background `{colors.surface-card}`, 1px solid `{colors.hairline}`, padding `{spacing.lg}` (20px), rounded `{rounded.md}`.
- Used in 3-up or 4-up grids on home and workflows pages — paired with a small icon and a 1-line description.

**`pricing-tier-card`** — pricing plan card
- Container: background `{colors.surface-card}`, 1px solid `{colors.hairline}`, padding `{spacing.xxl}` (32px), rounded `{rounded.md}`.
- Layout: tier name in `{typography.display-lg}` (24px / 800 / -0.6px), large price + period, feature checklist with check-icon bullets, primary or secondary CTA at bottom.

**`hedgehog-mascot-card`** — feature card with margin-anchored hedgehog
- Same chrome as `{component.product-card}` but with a hand-drawn hedgehog illustration anchored in the right margin or top-right corner — the brand's signature card variant.

### Callout Banners

**`banner-tip-blue`** + **`banner-tip-green`** + **`banner-tip-red`** + **`banner-tip-purple`**
- Background `{colors.accent-blue-soft}` / `{colors.accent-green-soft}` / `{colors.accent-red-soft}` / `{colors.accent-purple-soft}`, text `{colors.ink}`, type `{typography.body-md}`, padding `16px 20px`, rounded `{rounded.md}`.
- Each prefixed with an inline emoji icon (💡 / ✅ / ⚠️ / 📘) followed by an inline label and body copy.
- Only appear inside doc article body. The four-color callout family is the brand's information-architecture vocabulary for inline tips/warnings/info inside long-form documentation.

### Code

**`code-block`** — dark code sample inside doc card
- Container: background `{colors.surface-dark}` (deep olive-charcoal), text `{colors.on-dark}` in `{typography.code-sm}`, padding `16px 20px`, rounded `{rounded.md}`.
- Syntax highlighting uses muted accent colors (blue for keywords, green for strings, purple for numbers) — never the bright accent colors used in callout banners.

**`inline-code`** — small inline `<code>` chip
- Background `{colors.surface-soft}`, text `{colors.ink}` in `{typography.code-xs}`, padding `2px 6px`, rounded `{rounded.xs}` (2px).
- Used inside body prose to mark code snippets and identifiers.

### Navigation

**`primary-nav`**
- Background `{colors.canvas}` (cream — same as the page), text `{colors.ink}`, height `56px`, type `{typography.body-strong}`, rounded `{rounded.none}`.
- Layout (desktop): PostHog wordmark + hedgehog logo at left, nav menu cluster ("Pricing · Docs · Community · Company"), right cluster with a search-glyph, "Login" link, and the always-yellow `{component.button-primary}` "Get started — free" pill anchored to the far right.

**`sub-nav-strip`** — secondary nav bar (under primary)
- Background `{colors.surface-soft}`, text `{colors.body}` in `{typography.body-xs}`, height `40px`, rounded `{rounded.none}`.
- Sits directly below the primary nav on workflows / product pages with section anchor links and a contextual "Get started →" link at the right.

**`doc-sidebar`** — sticky doc-page left sidebar
- Background `{colors.canvas}`, text `{colors.body}` in `{typography.body-xs}`, width `240px`, rounded `{rounded.none}`.
- Layout: search-input "Ask PostHog AI" at top, then a vertical list of section headers each with a small rounded outline-icon mini-illustration, then nested item links indented under the active header.

**Top Nav (Mobile)**
- Hamburger menu icon at left, PostHog wordmark + hedgehog at center, search + sticky yellow "Get started — free" CTA at right. Primary nav collapses into a full-height drawer that slides from the left.

### Footer

**`footer-section`**
- Background `{colors.canvas}`, text `{colors.body}` in `{typography.body-xs}`, padding `32px 24px`, rounded `{rounded.none}`, with a 1px `{colors.hairline}` top rule.
- Layout: 6-column horizontal link grid (Product · Resources · Company · Community · Pricing · Legal), each column with a `{typography.utility-xs}` (uppercase) header and a vertical list of links in `{typography.body-xs}` `{colors.body}`.
- Bottom row: PostHog wordmark + small hedgehog illustration, copyright in `{typography.caption-xs}` `{colors.mute}`, social-icon row at far-right.

### Inline

**`link-inline`** — body-prose anchor link
- `{colors.link-teal}` (`#1078a3`) in body prose with no underline by default; underline appears on focus. The brand's primary inline link color.

## Do's and Don'ts

### Do
- Use `{colors.canvas}` (cream — `#eeefe9`) as the page body. Never substitute pure white as the canvas.
- Reserve `{colors.primary}` (yellow-orange) for the primary CTA pill only. The "Get started — free" treatment is the brand's anchor.
- Render the brand wordmark with the hedgehog illustration alongside it, not as a stand-alone wordmark. The hedgehog IS the brand identity.
- Use IBM Plex Sans Variable across every text role — body 400, emphasis 600/700, display 800.
- Stack content sections at `{spacing.section}` (80px) rhythm with no decorative dividers between them; let the cream canvas continue uninterrupted.
- Use `{component.banner-tip-blue}` / `-green` / `-red` / `-purple` only inside doc article body for tip/warning/note panels — keep marketing chrome out of the four-color callout family.
- Pair every code sample with the dark `{component.code-block}` surface; inline `<code>` chips use `{component.inline-code}` (cream surface-soft chip).
- Anchor a hedgehog mascot illustration in feature tile margins on home and workflows pages — the system's signature decoration.

### Don't
- Don't introduce drop shadows on cards. Cards sit flat on cream with thin olive borders only.
- Don't add a second saturated chromatic CTA. Yellow-orange is the only loud color in the system.
- Don't replace the cream canvas with pure white or full-bleed dark hero bands. The cream is the brand.
- Don't use the four-color callout banner pastels (`{colors.accent-blue-soft}`, `-green`, `-red`, `-purple`) as marketing-card backgrounds. They belong to inline doc content only.
- Don't substitute the hedgehog illustration with a generic icon set. The character system is the brand.
- Don't use uppercase transform outside of `{typography.heading-sm}`, `{typography.utility-xs}`, and `{typography.caption-xs}`. Uppercase is reserved for eyebrows and footer category headers.
- Don't pad cards with 32px+ on all sides except for `{component.pricing-tier-card}`. Standard cards sit at 24px internal padding.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| ultrawide | 1920px+ | Content max-width holds at 1280px; outer gutters grow to ~80px |
| desktop-large | 1440px | Default — 4-up feature tile grid, 240px sticky doc sidebar visible |
| desktop | 1280px | Same layout with narrower outer gutters |
| desktop-small | 1024px | 4-up tiles collapse to 3-up; doc sidebar remains visible |
| tablet | 768px | 3-up tiles collapse to 2-up; doc sidebar collapses into a top accordion; primary nav becomes hamburger |
| mobile | 480px | Single-column everything; hero `{typography.display-xl}` scales 36px → ~28px |
| mobile-narrow | 320px | Section padding tightens to 32px |

### Touch Targets
All interactive elements meet WCAG AA (≥ 40×40px). `{component.button-primary}` and `{component.button-secondary}` sit at 40px height with 16px padding. `{component.text-input}` sits at 36px (just under AAA but above AA at this size). `{component.pill-tab}` is ~32–36px height with 14px padding extending to ~44px tappable via inline padding. Doc-sidebar items use 14px text with ~32px line-height + 6px vertical padding for ~44px tap rows.

### Collapsing Strategy
- **Primary nav:** desktop horizontal cluster → tablet hamburger drawer at 768px. The yellow "Get started — free" CTA stays visible at every breakpoint.
- **Sub-nav strip:** desktop horizontal anchor row → tablet horizontal scroll → mobile select dropdown.
- **Marketing card grid:** 4-up → 3-up → 2-up → 1-up at 1024, 768, and 480px; gutters drop from 16px to 12px on mobile.
- **Pricing grid:** 3-up → 2+1 → 1-up stacked at tablet and below.
- **Doc layout:** desktop 240px sidebar + 720px article → tablet sidebar collapses to a top accordion → mobile fully collapsed accordion.
- **Footer:** 6-up link columns → 3-up at tablet → 2-up at mobile.
- **Section padding:** `{spacing.section}` (80px) desktop → 64px tablet → 48px mobile.
- **Hero headline:** `{typography.display-xl}` (36px) at desktop, scaling to ~28px at mobile, line-height holding at 1.5.

### Image Behavior
The only "imagery" in the system is hand-drawn hedgehog illustrations rendered as inline SVG. They preserve their natural aspect at every breakpoint and scale via CSS `width: auto; max-width: 100%`. There is no responsive art-direction needed because there is no photography.

## Iteration Guide

1. Focus on ONE component at a time. Pull its YAML entry and verify every property resolves.
2. Reference component names and tokens directly (`{colors.primary}`, `{component.button-primary-pressed}`, `{rounded.md}`) — do not paraphrase.
3. Run `npx @google/design.md lint DESIGN.md` after edits — `broken-ref`, `contrast-ratio`, and `orphaned-tokens` warnings flag issues automatically.
4. Add new variants as separate component entries (`-pressed`, `-disabled`, `-focused`) — do not bury them inside prose.
5. Default body to `{typography.body-md}` (16px / 400 / 1.5); reach for `{typography.body-strong}` for emphasis; reserve `{typography.display-lg}` (24px / 800) strictly for marketing display moments.
6. Keep `{colors.primary}` scarce per viewport — at most one yellow-orange pill per fold.
7. When introducing a new component, ask whether it can be expressed with the existing card + 6px-radius + cream-canvas vocabulary before adding new tokens. The system's strength is that it almost never needs new ones.

## Known Gaps

- **Mobile screenshots not captured** — responsive behavior synthesizes PostHog's mobile pattern (hamburger drawer, single-column grid, doc sidebar accordion) from desktop evidence and the breakpoint stack.
- **Hover states not documented** by system policy.
- **In-product app chrome** (PostHog dashboard, charts, session replay player) not in the captured set — the marketing site is documented here, not the in-product analytics interface.
- **Authenticated chrome** (login modal, account dashboard, billing settings) not in the captured pages.
- **Form validation states** beyond the focused-state input not present in the captured surfaces.
- **Marketing illustration set** — the full library of hedgehog character poses is not enumerated here; specific poses (lab coat hedgehog, terminal hedgehog, hammock hedgehog) are noted as visible in screenshots but the full asset library is page-specific.

name: DataSpeak-design-system
description: A calm, paper-warm analytics workspace for non-technical people who ask questions of their database in plain English. Conversation and AI summaries borrow Notion's warm canvas and Linear's focused, quiet input craft. Data tables borrow Airtable's comfortable cells and clear headers. Charts, metric tiles and safety indicators borrow PostHog's high-contrast data visuals and its soft-tint semantic banners. One structural accent (blue) paints actions. Green and red are reserved almost entirely for safety state, so a user can read "is this safe?" from color alone.

colors:
  # Brand / action (Notion blue, the single structural accent)
  primary: "#0075de"
  primary-active: "#005bab"
  primary-soft: "#eaf3fc"
  primary-soft-border: "#c9e0f6"
  on-primary: "#ffffff"

  # Surfaces (Notion warm paper + white figure/ground)
  canvas: "#f6f5f4"
  surface: "#ffffff"
  surface-sunken: "#efeeec"
  surface-hover: "#f8fafc"
  hairline: "#e6e6e6"
  hairline-strong: "#dddddd"
  hairline-soft: "#eeeeec"

  # Text (Notion ink ladder)
  ink: "#0d0d0d"
  ink-secondary: "#31302e"
  ink-muted: "#615d59"
  ink-faint: "#a39e98"

  # Code surface (PostHog olive-charcoal, inverted)
  code-bg: "#23251d"
  code-ink: "#ffffff"
  code-comment: "#9b9c92"
  code-keyword: "#62aef0"
  code-string: "#8fd19e"
  code-number: "#fcab79"
  code-flag: "#ff8b82"

  # Safety semantics (PostHog accent family; -ink variants are derived for AA text contrast)
  safe: "#2c8c66"
  safe-soft: "#d9eddf"
  safe-ink: "#17543b"
  blocked: "#cd4239"
  blocked-soft: "#f7d6d3"
  blocked-ink: "#86241d"
  caution: "#f7a501"
  caution-soft: "#fdf0d0"
  caution-ink: "#6e4600"
  neutral-soft: "#e5e7e0"

  # Chart series (deliberately excludes red and green; those mean safety)
  series-1: "#0075de"
  series-2: "#f7a501"
  series-3: "#2a9d99"
  series-4: "#7c44a6"
  series-5: "#62aef0"
  series-6: "#d6409f"
  series-other: "#a39e98"
  chart-grid: "#e6e6e6"
  tooltip-bg: "#23251d"

typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1px
  heading-1:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.23
    letterSpacing: -0.6px
  heading-2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
  heading-3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  prompt:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: -0.1px
  summary:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  table-cell:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
    fontFeatureSettings: "tnum"
  table-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0.2px
  metric-xl:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -1.2px
    fontFeatureSettings: "tnum"
  metric-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.6px
    fontFeatureSettings: "tnum"
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  badge:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0.125px
  eyebrow:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0.6px
    textTransform: uppercase
  code:
    fontFamily: "JetBrains Mono"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  # ── Natural-language prompt (Notion / Linear) ──
  prompt-box:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.prompt}"
    rounded: "{rounded.xl}"
    padding: 16px 20px
    borderColor: "{colors.hairline-strong}"
  prompt-box-focused:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.primary}"
    focusRing: "2px {colors.primary} at 35% opacity"
  prompt-submit:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 36px
  prompt-submit-pressed:
    backgroundColor: "{colors.primary-active}"
  prompt-submit-disabled:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-faint}"
  suggestion-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 6px 12px
    borderColor: "{colors.hairline}"
  database-chip:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.badge}"
    rounded: "{rounded.sm}"
    padding: 4px 8px

  # ── AI summary (Notion callout) ──
  ai-summary-callout:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.summary}"
    rounded: "{rounded.lg}"
    padding: 20px 24px
    borderColor: "{colors.primary-soft-border}"
  ai-summary-footer:
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"

  # ── Generated SQL preview (PostHog code block) ──
  sql-preview:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.code-ink}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: 16px 20px

  # ── Data table (Airtable) ──
  data-table:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.table-cell}"
    rounded: "{rounded.lg}"
    borderColor: "{colors.hairline-strong}"
  data-table-header-cell:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.table-header}"
    height: 40px
    padding: 0 16px
  data-table-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.table-cell}"
    height: 44px
    padding: 12px 16px
    borderColor: "{colors.hairline-soft}"
  data-table-cell-compact:
    height: 32px
    padding: 6px 12px
  data-table-row-hover:
    backgroundColor: "{colors.surface-hover}"
  data-table-footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    height: 48px
    padding: 0 16px

  # ── Buttons ──
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
    height: 36px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
    height: 36px
    borderColor: "{colors.hairline-strong}"
  button-export-csv:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
    height: 36px
    borderColor: "{colors.hairline-strong}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink-secondary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 10px

  # ── Charts & metrics (PostHog) ──
  chart-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
    borderColor: "{colors.hairline}"
  metric-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px 24px
    borderColor: "{colors.hairline}"
  chart-tooltip:
    backgroundColor: "{colors.tooltip-bg}"
    textColor: "{colors.code-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
  chart-type-switch:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 2px
  chart-type-switch-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"

  # ── Safety indicators (PostHog badge + banner system) ──
  safety-badge-readonly:
    backgroundColor: "{colors.safe-soft}"
    textColor: "{colors.safe-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    padding: 4px 10px 4px 8px
    borderColor: "{colors.safe}"
  safety-badge-checking:
    backgroundColor: "{colors.neutral-soft}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    padding: 4px 10px 4px 8px
  safety-badge-caution:
    backgroundColor: "{colors.caution-soft}"
    textColor: "{colors.caution-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    padding: 4px 10px 4px 8px
    borderColor: "{colors.caution}"
  safety-badge-blocked:
    backgroundColor: "{colors.blocked}"
    textColor: "{colors.on-primary}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    padding: 4px 10px 4px 8px
  blocked-notice:
    backgroundColor: "{colors.blocked-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 16px 20px
    borderColor: "{colors.blocked}"
  caution-notice:
    backgroundColor: "{colors.caution-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
    borderColor: "{colors.caution}"
  info-notice:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 12px 16px

  # ── Shell ──
  app-sidebar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    width: 264px
    padding: 16px 12px
  history-row:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
  history-row-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
  top-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    height: 56px
    padding: 0 24px
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
    height: 36px
    borderColor: "{colors.hairline-strong}"
  empty-state-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 48px
    borderColor: "{colors.hairline}"
---

## Overview

DataSpeak is a place where someone who has never written SQL asks a question and gets an answer they can trust. The design has two jobs: make asking feel as easy as writing a note, and make the answer feel safe and checkable.

The system is three borrowed dialects, each assigned to the part of the product it suits best, and fused by one shared set of tokens:

| Product area | Reference | What we take |
|---|---|---|
| Prompt box, conversation, AI summaries | **Notion** (with Linear's focus discipline) | Warm paper canvas, Inter with tight display tracking, quiet hairline surfaces, one blue accent, soft callout blocks, 8px-base spacing |
| Results table, CSV export | **Airtable** | Roomy cell padding, a distinct header row with type cues, hairline grid, sober near-neutral buttons, uneven but comfortable density |
| Charts, metrics, safety badges and notices | **PostHog** | High-contrast data on white cards, olive-charcoal code and tooltip surfaces, soft-tint semantic banners (green, red, amber, blue), small bold badges |

**How the three are reconciled**

- **Canvas** is Notion's warm paper (`{colors.canvas}`), not PostHog's cream and not Linear's black. Every result card sits on it in pure white (`{colors.surface}`), which gives figure/ground without shadows.
- **One structural accent**: Notion blue (`{colors.primary}`). It paints the submit action, links, focus and selection. Nothing else decorative uses blue-as-action.
- **Green and red mean safety.** They are reserved for the Read-Only indicator and blocked-modification notices. They are removed from the chart palette so a red bar never reads as "something was blocked" and a green line never reads as "this is verified safe".
- **Type**: a single family, Inter, at Notion's tight negative tracking for headings. JetBrains Mono appears only inside SQL.
- **Elevation**: hairline-first (Notion, Airtable, PostHog all agree). Shadows are reserved for the focused prompt box and floating popovers.
- **Light first.** A dark theme is specified as a secondary mode (see Dark Mode) using Linear's surface-ladder logic.

**Key characteristics**

- The prompt box is the hero of the empty state and a sticky footer once a conversation exists.
- An answer is always a vertical stack in the same order: **Summary → Chart → Table → SQL**. Plain English first, evidence after, machinery last.
- A Read-Only badge is always visible in the top bar. A per-query safety status is always visible on the SQL panel. The user never has to wonder.
- Blocked actions are explained in plain English, never with raw database errors, and never offer an override.

## Colors

### Action
- **Primary** (`{colors.primary}`, #0075de): submit button, primary buttons, links, text-selection tint, focus ring, active nav indicator.
- **Primary Active** (`{colors.primary-active}`, #005bab): pressed state.
- **Primary Soft** (`{colors.primary-soft}`, #eaf3fc) and its border (`{colors.primary-soft-border}`): the AI-summary callout and info notices.

### Surfaces
- **Canvas** (`{colors.canvas}`, #f6f5f4): app background, sidebar, table header row, table footer.
- **Surface** (`{colors.surface}`, #ffffff): every card, input, table body, chart panel.
- **Surface Sunken** (`{colors.surface-sunken}`, #efeeec): segmented controls, database chip, disabled fills.
- **Surface Hover** (`{colors.surface-hover}`, #f8fafc): table row hover and keyboard-focus row (borrowed from Airtable's soft surface).
- **Hairlines**: `{colors.hairline}` (#e6e6e6) for cards; `{colors.hairline-strong}` (#dddddd) for inputs and the table outer border; `{colors.hairline-soft}` (#eeeeec) for in-table row dividers.

### Text
`{colors.ink}` for primary copy and numbers, `{colors.ink-secondary}` for table headers and nav, `{colors.ink-muted}` for metadata and axis labels, `{colors.ink-faint}` for placeholders, disabled text and null cells. Never set body copy lighter than `ink-muted` on white.

### Safety semantics
Every safety state has three parts: a **soft fill**, a **strong border or icon color**, and a **dark ink for text**. Use the `-ink` color for text, not the strong color. The strong green and red fail 4.5:1 for small text on their own soft fills.

| State | Fill | Border / icon | Text | Meaning |
|---|---|---|---|---|
| Read-only verified | `safe-soft` | `safe` | `safe-ink` | Connection is read-only and the current query passed validation |
| Checking | `neutral-soft` | `ink-muted` | `ink-secondary` | Validating or connecting |
| Caution | `caution-soft` | `caution` | `caution-ink` | Safe but altered: row limit applied, timeout, truncated, schema partially readable |
| Blocked | `blocked-soft` (notice) or `blocked` (solid badge) | `blocked` | `blocked-ink` / white | A statement that would change data was refused and **not executed** |

`caution` (PostHog yellow) is the one non-blue saturated color allowed to carry meaning outside charts. It signals "worth a glance", never an error.

### Chart palette
Six categorical series in this order: blue, amber, teal, purple, sky, pink (`series-1` to `series-6`). A seventh and beyond collapses into `series-other` (gray) labelled "Other". Never use red or green as a series color. Gridlines are `{colors.chart-grid}`; tooltips are the dark olive-charcoal `{colors.tooltip-bg}`.

### SQL syntax colors
On the dark `{colors.code-bg}` panel: keywords `code-keyword`, strings `code-string`, numbers `code-number`, comments `code-comment`, and any token that triggered a safety block is `code-flag` with a wavy underline.

## Typography

One family, **Inter** (open substitute for NotionInter and Linear's custom sans; both references recommend it). Apply the negative tracking in the tokens explicitly. Inter at default tracking reads looser than the references. Use **JetBrains Mono** for SQL and identifiers. Enable `font-feature-settings: "tnum"` on every numeric table cell, metric, axis label and tooltip so digits align vertically.

| Token | Size / weight | Use |
|---|---|---|
| `display` | 40 / 700, -1px | Empty-state greeting ("What do you want to know?") |
| `heading-1` | 26 / 700, -0.6px | Saved-question page titles |
| `heading-2` | 20 / 600 | Card titles (chart title, "Results") |
| `heading-3` | 16 / 600 | Sub-card labels, sidebar section titles |
| `prompt` | 18 / 400 | Text typed into the prompt box and the echoed user question |
| `summary` | 16 / 400, line-height 1.6 | AI summary body |
| `body` | 15 / 400 | General UI copy, notices |
| `table-cell` | 14 / 400, tabular | Table body |
| `table-header` | 12 / 600, +0.2px | Table column headers |
| `metric-xl` / `metric-md` | 44 / 700 and 28 / 700, tabular | Big-number tiles |
| `button` | 14 / 500 | All buttons |
| `caption` | 13 / 400 | Metadata, footers, axis labels |
| `badge` | 12 / 600 | Safety badges, database chip |
| `eyebrow` | 12 / 600, uppercase, +0.6px | Section labels ("AI SUMMARY", "GENERATED SQL") |

Principles: heavy weight is for headings and metrics only. Body stays at 400. Hierarchy comes from size, weight and the ink ladder, never from decorative type. Use sentence case everywhere except the eyebrow.

## Layout

### Spacing
Base unit 4px. Card padding is `lg` (24px) on chart and summary cards, 20px on metric tiles. Vertical gap between answer blocks is `lg` (24px). Gap between conversation turns is `xxl` (48px). Page section rhythm uses `section` (64px) only on the empty state.

### App shell (desktop ≥ 1024px)
```
┌───────────────┬──────────────────────────────────────────────────┐
│ Sidebar 264   │ Top bar 56:  [DB chip ▾]            [Read-only ✓]│
│  New question │──────────────────────────────────────────────────│
│  Saved        │  Conversation column (max 840, centered)         │
│  History      │    You: question                                 │
│  (grouped by  │    ┌ AI summary ───────────────────────────┐     │
│   day)        │    ├ Chart card ───────────────────────────┤     │
│               │    ├ Results table (may widen to 1120) ────┤     │
│  Connection   │    └ Generated SQL (collapsible) ──────────┘     │
│  status       │  ┌ Prompt box (sticky, max 840) ───────────┐     │
│               │  └─────────────────────────────────────────┘     │
└───────────────┴──────────────────────────────────────────────────┘
```
- Conversation column: `max-width: 840px`, centered. The table card may break out to `1120px` when it has more than 6 columns.
- Sidebar uses `{colors.canvas}` with no border; the main area is also canvas, so the sidebar separates only by content. A 1px `{colors.hairline}` divider appears between them.
- The top bar holds the database chip on the left and the **persistent Read-Only badge on the right**. It is never hidden, collapsed, or moved into a menu.

### Breakpoints
| Name | Width | Changes |
|---|---|---|
| Desktop | ≥ 1024px | Sidebar visible, full shell |
| Tablet | 768–1023px | Sidebar becomes an overlay drawer; table card fills the column; chart height 280px |
| Mobile | < 768px | Single column; prompt box pinned to bottom with safe-area padding; chart height 220px; metric tiles stack; SQL panel collapsed by default |
| Small mobile | < 480px | Tables render as horizontally scrolling grids with a pinned first column; offer "Card view" toggle (one record per card) |

Touch targets are at least 44×44px on touch devices. Table rows keep 44px height; the compact density option is hidden on touch.

### Whitespace
Whitespace groups; hairlines are for edges only. Don't add dividers between answer blocks. The 24px gap and the white-on-canvas contrast do that work.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0, flat | Hairline border, no shadow | Default for every card, table, chart card, notice |
| 1, focus | Border becomes `primary`, plus 2px `primary` ring at 35% and a Notion-style layered micro-shadow (`0 4px 18px rgba(0,0,0,0.04)`, `0 2px 8px rgba(0,0,0,0.03)`) | Focused prompt box |
| 2, floating | `0 23px 52px rgba(0,0,0,0.08)`, `0 8px 20px rgba(0,0,0,0.05)` | Popovers, DB switcher, export menu, modals |
| Inverted | `{colors.code-bg}` fill | SQL preview and chart tooltips |

No heavy drop shadows anywhere. Depth in the answer stack comes from white cards on warm canvas and from the single dark SQL island.

## Shapes

| Token | Value | Use |
|---|---|---|
| `xs` | 4px | Inline code chips, row-selection checkboxes |
| `sm` | 6px | Text inputs, history rows, database chip, tooltips, segmented-control thumbs |
| `md` | 8px | All buttons, segmented control track |
| `lg` | 12px | Cards (summary, chart, table, SQL, notices, metric tiles) |
| `xl` | 16px | Prompt box only (the one oversized, friendly surface) |
| `full` | 9999px | Safety badges, suggestion chips, submit button, avatars |

Rules from the references that carry over: inputs stay tight (no pill inputs, per Notion); buttons are 8px, not pill (Linear and Airtable's app chrome); pills are for status and chips.

## Components

### 1. Prompt box (`prompt-box`, Notion / Linear)

The most important surface in the product. Calm, wide, and obviously the place to type.

- **Anatomy** (top to bottom inside one white `xl` card): auto-growing textarea (min 2 lines, max 8 lines, then scrolls) → footer row with database chip on the left, keyboard hint `↵ to ask · ⇧↵ new line` in `ink-faint` center-left, and the circular **submit button** (36px, `primary`) on the right.
- **Placeholder** (`ink-faint`): rotate through realistic questions drawn from the connected schema, such as "Which products had the most returns last quarter?". Never lorem ipsum, never generic.
- **Empty state**: centered below the `display` greeting with 3–4 `suggestion-chip` examples generated from the schema. Chips are outlined white pills; clicking fills the box, it does not auto-submit.
- **Sticky mode**: after the first answer, the box docks to the bottom of the conversation column on a `canvas` fade (not a border) and shrinks to one line until focused.
- **Focus**: border → `primary`, 2px ring, Level-1 shadow. Transition 120ms ease-out.
- **Submit states**: disabled (sunken gray) while empty; `primary` with an up-arrow when ready; while running, becomes a stop square so the user can cancel.
- **Running state**: the prompt text stays visible and non-editable. A progress list appears under the user's echoed question showing steps, with one active at a time: *Reading your database → Writing the query → Checking it is read-only → Running → Summarizing*. Completed steps get a check in `ink-muted`; only the "Checking it is read-only" step turns green when it passes.
- **Do not** add a model picker, temperature, or other AI settings here. The audience is non-technical.

### 2. AI summary callout (`ai-summary-callout`, Notion callout)

The answer in words. It leads every response.

- White-on-blue-tint callout: `primary-soft` fill, 1px `primary-soft-border`, `lg` radius, 20/24px padding.
- Header: sparkle icon (16px, `primary`) + `eyebrow` "AI SUMMARY" in `primary-active`.
- Body: `summary` type (16/1.6), max line length ~68ch, **maximum 4 sentences** by default. Lead with the direct answer and a bold figure, e.g. "**Revenue grew 18% in Q3**, driven mostly by the Enterprise plan." Use `ink` for text; bold key numbers only.
- Optional bullets (max 3) for secondary findings, using a small `primary` dot marker.
- Footer (`ai-summary-footer`, `caption`, `ink-muted`): "Based on 1,284 rows · View SQL" so every claim is traceable. The "View SQL" link scrolls to and expands the SQL panel.
- Actions on hover or focus, top right: Copy, Thumbs up/down (ghost buttons).
- Loading: three-line skeleton shimmer in `primary-soft-border`. Streaming text is allowed; the caret is `primary`.
- Empty or zero rows: callout turns neutral (`neutral-soft`) and says plainly "No rows matched. Try widening the date range." Never fabricate commentary on empty data.
- If the model is uncertain (ambiguous column, assumption made), show a one-line `info-notice` above the summary stating the assumption: "I assumed 'sales' means `orders.total_amount`. Change this".

### 3. Results table (`data-table`, Airtable)

Comfortable, scannable, spreadsheet-familiar.

- **Container**: white, 1px `hairline-strong` outer border, `lg` radius, `overflow: hidden`. Contains a toolbar, the grid, and a footer.
- **Toolbar** (56px, white): table title + row count on the left ("Results · 248 rows"); on the right a density toggle (Comfortable / Compact), a column visibility menu, and the **Export CSV** button.
- **Header row** (`data-table-header-cell`): 40px, `canvas` fill, `table-header` type in `ink-secondary`, sticky at the top of the scroll container. Each header carries a 14px **type glyph** at left in `ink-faint` (`#` number, `Aa` text, calendar date, toggle boolean), the column name, and a sort arrow on hover or when sorted (`primary`). Click sorts; no inline filtering in MVP.
- **Body cell**: 44px row, `12px 16px` padding (Comfortable). Compact is 32px / `6px 12px`. Rows separated by 1px `hairline-soft` horizontal rules; vertical rules in `hairline-soft` too, so the grid reads as a grid.
- **Alignment**: text left, numbers and currency right with tabular figures, dates left, booleans centered as a check or dash. Header alignment matches its column.
- **Formatting**: thousands separators; currency symbol when the column name implies money; ISO dates rendered as "Oct 14, 2026" with the raw value in a title tooltip. Truncate long text with an ellipsis at ~240px column width and show the full value in a popover on click.
- **Null / empty**: a faint em dash (`ink-faint`), never the word "null".
- **Row hover**: `surface-hover` fill. Keyboard focus: 2px `primary` inset ring on the focused cell.
- **Pinned first column**: sticky left with a 1px `hairline-strong` right edge and a soft inset shadow when scrolled horizontally.
- **Pagination**: client-side virtualization up to 1,000 rows; footer reads "Showing 1–100 of 248" with Prev / Next ghost buttons. The footer (`data-table-footer`) is 48px on `canvas`.
- **Truncated results**: when the server applied a row limit, the footer swaps to a `caution-notice` row: "Showing the first 1,000 rows. Add a filter to narrow this down."
- **Responsive**: below 768px, keep the grid and scroll horizontally with the first column pinned; below 480px offer **Card view** (each row becomes a white card with label/value pairs in `ink-muted` / `ink`).
- **Zero rows**: render `empty-state-card` in place of the grid, with the headers preserved above it.

### 4. CSV export (`button-export-csv`, Airtable)

- Secondary button, white, 1px `hairline-strong`, `md` radius, 36px high, download icon at left (16px), label "Export CSV".
- Always lives in the table toolbar top right. Disabled with a tooltip when the result is empty.
- Click state: shows an inline spinner for exports over 5,000 rows; on completion a toast: "Downloaded results-2026-10-14.csv · 248 rows" with the toast surface at Level-2 elevation.
- Menu variant (optional): chevron opens a popover with **Download all rows** and **Download visible columns only**.
- Filename pattern: `dataspeak-{slugified-question}-{YYYY-MM-DD}.csv`.
- The export contains exactly what the table shows (post-limit). If it was truncated, say so in the toast.

### 5. Charts (`chart-card`, `chart-tooltip`, PostHog)

High contrast, no chartjunk, readable by someone who doesn't make charts.

- **Card**: white, 1px `hairline`, `lg` radius, 24px padding. Header row: title (`heading-2`, generated from the question, editable) at left; `chart-type-switch` (Bar / Line / Pie / Table icons) at right.
- **Automatic chart choice** (from the PRD's "bar, line, or pie based on query type"):
  - One numeric column over a date/time column → **line**.
  - One numeric column over a category (≤ 20 categories) → **bar** (horizontal when labels are long).
  - Parts of a whole, 2–6 categories → **pie rendered as a donut**, total in the center.
  - A single value → **metric tile** instead of a chart.
  - Anything else → no chart; the table carries the answer and a one-line note explains why.
- **Series**: use `series-1` … `series-6` in order; the first series is always blue. Bars have a 4px top radius; line stroke is 2px with no markers until hover; area fills (single series only) use the series color at 12% opacity.
- **Axes and grid**: no chart border. Horizontal gridlines only, 1px `chart-grid`, dashed on charts with dense data. Axis labels in `caption`, `ink-muted`, tabular figures. Zero-baseline always for bars. Abbreviate large numbers (1.2M) on axes and give exact values in tooltips.
- **Tooltip** (`chart-tooltip`): dark `tooltip-bg`, white text, `sm` radius, 8/12px padding, series swatch + label + exact value. Shows on hover and keyboard focus.
- **Legend**: inline under the title when 2+ series, as 8px round swatches with `caption` labels. Clicking toggles a series.
- **Pie/donut rules**: max 6 slices, remainder grouped as "Other" in `series-other`; labels outside with leader lines; percentage in the label.
- **Direct labelling** beats legends when a line series has ≤ 3 series; label the last point.
- **Motion**: 300ms ease-out draw-in on first render only. Respect `prefers-reduced-motion` (render static).
- **Accessibility**: every chart has a visually hidden data table fallback and a one-sentence `aria-label` describing the trend. The adjacent table counts as the long description.

### 6. Metric tile (`metric-tile`, PostHog)

For single-value answers and for headline figures above a chart.

- White, 1px `hairline`, `lg`, 20/24px padding. Stack: `eyebrow` label in `ink-muted` → `metric-xl` value in `ink` → delta line.
- Delta: arrow + percentage in `caption` 600. Up and down use text color only (`safe-ink` / `blocked-ink`), **never a filled chip**, which keeps filled green/red exclusive to safety states. If direction has no good/bad meaning (e.g. "returns"), use `ink-muted`.
- Optional 48px-high sparkline at the right in `series-1`.
- Grid: up to 4 tiles in a row at desktop, 2 at tablet, 1 on mobile; `md` (16px) gap.

### 7. Safety indicators (`safety-badge-*`, `blocked-notice`, PostHog)

Safety is a first-class interface, not fine print. It is shown in three places: the top bar (connection-level), the SQL panel (query-level), and inline notices (event-level).

**Badge anatomy**: pill, 24px high, icon 14px at left, label in `badge` type. Always icon **and** text; color alone never carries the state.

| Badge | Appearance | Icon | Label |
|---|---|---|---|
| `safety-badge-readonly` | `safe-soft` fill, 1px `safe` border, `safe-ink` text | Shield with check | **Read-only** |
| `safety-badge-checking` | `neutral-soft` fill, `ink-secondary` text | Spinner | Checking… |
| `safety-badge-caution` | `caution-soft` fill, 1px `caution` border, `caution-ink` text | Triangle | e.g. **Limited to 1,000 rows** |
| `safety-badge-blocked` | Solid `blocked` fill, white text | Shield with X | **Blocked** |

**Top-bar badge**: `safety-badge-readonly` is permanently present while connected. Hover/focus opens a popover (Level 2): "DataSpeak can only read from this database. It cannot add, change, or delete anything." plus the connection's credential type if verified read-only. If the connection could not be confirmed read-only, show the caution variant: "Couldn't confirm read-only access. Queries are still checked before running." with a "Learn more" link.

**SQL-panel status chip**: top-left of the SQL preview, shows the *current query's* state. "Read-only check passed" (green) before execution; "Blocked" (red) if the generated SQL contains a write.

**Blocked notice** (`blocked-notice`): shown in place of results when a request would modify data (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, GRANT, and anything unparseable).
- `blocked-soft` fill, 1px `blocked` border, a 4px solid `blocked` left rail, `lg` radius, 16/20px padding.
- Header: shield-X icon (20px, `blocked`) + title in `heading-3`, `blocked-ink`: "I can't do that: it would change your data".
- Body (`body`, `ink`): one or two plain sentences naming the intent, not the SQL: "Your question asks to delete rows from **customers**. DataSpeak is read-only, so nothing was run and your data is unchanged."
- Evidence: the offending statement is shown in the SQL panel with the blocked keyword in `code-flag` and a wavy underline.
- Actions: `button-secondary` "Edit my question" (focuses the prompt box with the text preserved) and a ghost "How read-only works". **No override, no "run anyway", no admin bypass in the UI.**
- Reassurance line is mandatory: "Nothing was run." This is the most important sentence on the screen.

**Caution notice**: for safe-but-altered outcomes (row limit applied, 30s timeout, large result). `caution-soft` fill, `caution` rail, short copy, one optional action.

**Rules**
- Green appears only for "verified read-only / check passed". It is never used for generic success toasts, "Connected", or positive deltas as a fill.
- Red fill appears only for blocked modification attempts. Connection or syntax errors use the caution or neutral style plus a plain-language message, not red.
- A blocked query must never display a result, chart, or summary. The stack collapses to the notice alone.

### 8. Generated SQL preview (`sql-preview`)

- Dark `code-bg` island, `lg` radius, inside the white-card stack. This is the only dark surface on a light page and should feel deliberate.
- Header strip (40px, slightly lighter than `code-bg`): safety status chip at left; "Copy" and "Collapse" ghost buttons (white at 70%) at right.
- Body: `code` type, 16/20px padding, horizontal scroll (no wrap), line numbers in `code-comment`.
- Expanded by default for a user's first three queries, then collapsed to a one-line "Show SQL · Read-only check passed ▸" row. Preference persists.
- Read-only in MVP: the user can **copy** but not edit SQL. (Edit-and-rerun is a post-MVP enhancement and must re-run validation.)
- Below the code, optional "Tables used: `orders`, `customers`" as `database-chip`s in white-on-dark outline form.

### 9. Query history and saved questions (`app-sidebar`, `history-row`)

- Sidebar sections with `eyebrow` headings: **Saved** (star icon) then **History** grouped by Today / Yesterday / Previous 7 days.
- Row: one-line truncated question (`body`), 8/12px padding, `sm` radius. Active row is white with a hairline; hover is `surface-sunken`.
- Row hover reveals a star (save) and a more menu (rename, delete from history). Saved items show a filled star in `caution` (the one permitted amber use outside safety and charts).
- Top of sidebar: **New question** `button-secondary` full width. Bottom: connection status block showing database name, engine (PostgreSQL / MySQL / SQLite) and the Read-only indicator repeated at small size.

### 10. Buttons and inputs

- **Primary**: `primary` fill, white text, 36px high, `md` radius, `8px 14px`. One per view region. Pressed → `primary-active`; also `transform: scale(0.98)` for 80ms.
- **Secondary**: white, 1px `hairline-strong`, `ink` text. Export CSV, Copy, Edit my question.
- **Ghost**: transparent, `ink-secondary`, hover `surface-sunken`.
- **Text input** (connection form fields, rename): 36px, white, 1px `hairline-strong`, `sm` radius; focus = `primary` border + 2px ring at 35%. Error = `caution` border plus helper text; credential errors never use red.
- **Segmented control** (`chart-type-switch`): `surface-sunken` track, `md` radius, 2px padding; active segment is white with `sm` radius and a hairline.

### 11. Database connection screen (MVP setup)

- A single centered `empty-state-card` (max 560px): engine picker as three selectable cards (PostgreSQL, MySQL, SQLite; Neon and Supabase appear as sub-labels under PostgreSQL), connection string field, and a prominent `info-notice`: "Create a **read-only** database user for DataSpeak. We also block write statements on our side."
- After connecting, show schema extraction progress, then a summary ("14 tables · 112 columns") and the first suggestion chips. The Read-only badge appears in the top bar the moment the connection is confirmed.

### 12. States

| State | Treatment |
|---|---|
| Loading answer | Progress list under the user's question (see Prompt box); cards appear as skeletons in `surface-sunken` with a 1.2s shimmer |
| Empty (no database) | `empty-state-card` with connect CTA |
| Empty (no rows) | Neutral summary + table headers with empty body |
| Query error (couldn't understand) | `info-notice`: "I couldn't turn that into a query. Try mentioning a table or time period." with two suggested rephrasings as chips |
| Query timeout | `caution-notice` with "Try a narrower date range" action |
| Blocked | `blocked-notice` only |
| Offline / connection lost | `caution-notice` pinned under the top bar; Read-only badge switches to the caution variant |

## Do's and Don'ts

### Do
- Lead every answer with the plain-English summary; evidence follows.
- Keep one blue accent. Let white cards on warm canvas do the structuring.
- Show the Read-only badge on every screen while connected, and the query-level safety status on every SQL panel.
- Pair safety colors with icons and text, and use the `-ink` colors for small text.
- Use tabular numerals for every number a user might compare.
- Give table cells room: 44px rows and 16px horizontal padding by default.
- Write blocked notices in plain English and always say "Nothing was run."
- Show how the answer was produced (row count, tables used, SQL) so the user can trust or challenge it.

### Don't
- Don't use red or green in charts, tags or decorative UI. They are reserved for safety.
- Don't fill delta chips green/red. Use colored text with an arrow.
- Don't offer any control that bypasses or weakens read-only mode.
- Don't surface raw database error text, stack traces or SQLSTATE codes in the main UI; put them behind a "Technical details" disclosure.
- Don't add a second structural accent (the sticker-palette and PostHog-yellow CTA from the references are decorative or semantic here, never action colors).
- Don't use pill shapes for inputs or buttons. Pills are for badges, chips and the submit button.
- Don't cram tables. If it needs more than 12 columns, default to hiding the lowest-value columns behind the column menu.
- Don't autoplay chart animation after the first render, and don't animate when `prefers-reduced-motion` is set.
- Don't hide the SQL. Collapse it, but never remove it.

## Accessibility

- **Contrast**: body text ≥ 4.5:1 on its surface; large text and UI boundaries ≥ 3:1. Verified pairs: `ink` on `canvas` and `surface` (> 15:1), `ink-muted` on `surface` (about 6:1), `safe-ink` on `safe-soft`, `blocked-ink` on `blocked-soft`, `caution-ink` on `caution-soft` (all ≥ 7:1). White on `blocked` (solid badge) is about 4.9:1 at badge size and weight. `ink-faint` is for placeholders and nulls only and is not relied on for essential text.
- **Not color alone**: every safety state has an icon and a text label. Chart series differ by color and, for lines, by dash pattern or direct label when the user enables "high-contrast charts".
- **Keyboard**: prompt box submits with Enter; Esc cancels a running query; `/` focuses the prompt from anywhere. Tables support arrow-key cell navigation, Enter to expand a truncated cell, and `S` to sort the focused column. Charts expose points via arrow keys with the tooltip following focus.
- **Screen readers**: the Read-only badge is a `role="status"` region. Blocked notices use `role="alert"`. Progress steps use `aria-live="polite"`. Tables use real `<table>` semantics with `scope` on headers and `aria-sort`.
- **Focus**: a 2px `primary` ring with 2px offset on every focusable element. Never remove outlines.
- **Motion**: all transitions ≤ 300ms and disabled under `prefers-reduced-motion`.
- **Targets**: ≥ 44×44px on touch; ≥ 24×24px with spacing on pointer devices.

## Dark Mode (secondary, post-MVP)

Uses Linear's surface-ladder approach: hierarchy through stepped surface lifts and hairlines, not shadows. Values below are derived; verify contrast before shipping.

| Token | Light | Dark |
|---|---|---|
| `canvas` | #f6f5f4 | #0e0e0f |
| `surface` | #ffffff | #161718 |
| `surface-sunken` | #efeeec | #1d1e20 |
| `hairline` | #e6e6e6 | #26282c |
| `hairline-strong` | #dddddd | #34363b |
| `ink` | #0d0d0d | #f7f8f8 |
| `ink-muted` | #615d59 | #9a9fa8 |
| `primary` | #0075de | #4da3f5 |
| `primary-soft` | #eaf3fc | #12263a |
| `safe-soft` / `safe-ink` | #d9eddf / #17543b | #10291f / #7ee0b4 |
| `blocked-soft` / `blocked-ink` | #f7d6d3 / #86241d | #331512 / #ff9a92 |
| `caution-soft` / `caution-ink` | #fdf0d0 / #6e4600 | #2e2308 / #f7c862 |

The SQL panel stays `code-bg`; in dark mode add a 1px `hairline-strong` border so it doesn't vanish. Chart series keep their hues, lightened about 10%.

## Content & Voice

- Speak like a helpful colleague: short, concrete, no jargon. Say "rows" and "columns", not "result set" and "fields". Say "ran a read-only query", not "executed a SELECT statement", except inside the SQL panel.
- Headlines are statements of what was found ("Revenue grew 18% in Q3"), not labels ("Revenue analysis").
- Always state the scope of an answer: time range, filters assumed, row count.
- Never apologize at length. When something fails, say what happened, what's safe, and what to try next.
- Example safety copy:
  - Badge tooltip: "DataSpeak can only read from this database. It cannot add, change, or delete anything."
  - Blocked title: "I can't do that: it would change your data."
  - Blocked body: "Nothing was run, and your data is unchanged. You can ask me to look at the data instead."

## Feature → Design Map (from PRD)

| PRD feature | Component(s) | Reference |
|---|---|---|
| Conversational NL→SQL | Prompt box, suggestion chips, progress list | Notion / Linear |
| Relational DB connector | Connection screen, database chip, engine cards | Notion |
| Strict read-only guardrails | Read-only badge, SQL status chip, blocked notice | PostHog |
| Interactive data table | Data table, density toggle, sort, pinned column | Airtable |
| Automated charts | Chart card, metric tile, chart-type switch | PostHog |
| AI plain-English summaries | AI summary callout | Notion |
| Query history & saved questions | Sidebar, history rows, star | Notion |
| CSV export | Export CSV button, toast | Airtable |

## Implementation Notes

- **Fonts**: Inter (variable, weights 400/500/600/700) and JetBrains Mono (400). Both are open source.
- **Token naming**: expose the YAML tokens above as CSS custom properties (`--ds-color-primary`, `--ds-radius-lg`, …). Light/dark swap by redefining variables under `[data-theme="dark"]`.
- **Suggested stack mapping**: Tailwind theme extension from `colors`, `rounded`, `spacing`; charts with Recharts or Visx using `series-*` tokens; tables with TanStack Table + virtualization; SQL highlighting with a Shiki or Prism theme built from the `code-*` tokens.
- **Validation**: run `npx @google/design.md lint DESIGN.md` after editing.

## Known Gaps

- The reference files describe marketing sites, not data apps. Table, chart, tooltip, toast and safety components are **adapted**, not extracted, and should be validated with real users.
- `-ink` safety colors, `primary-soft`, `surface-sunken`, dark-mode values and the chart palette ordering are derived for this product and were not in any source file.
- Row-level editing, SQL editing and multi-database switching are out of scope per the PRD; their UI is intentionally absent.
- Hover states are specified here (the Notion and Airtable references document none); tune them in review.
