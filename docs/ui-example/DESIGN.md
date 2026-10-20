---
name: Calm Analytics Workspace
colors:
  surface: '#ffffff'
  surface-dim: '#d8dae3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fc'
  surface-container: '#ecedf7'
  surface-container-high: '#e6e8f1'
  surface-container-highest: '#e0e2eb'
  on-surface: '#181c22'
  on-surface-variant: '#414753'
  inverse-surface: '#2d3037'
  inverse-on-surface: '#eef0fa'
  outline: '#717784'
  outline-variant: '#c1c6d5'
  surface-tint: '#005eb4'
  primary: '#005db2'
  on-primary: '#ffffff'
  primary-container: '#0075de'
  on-primary-container: '#fffeff'
  inverse-primary: '#a8c8ff'
  secondary: '#825500'
  on-secondary: '#ffffff'
  secondary-container: '#fdaa0e'
  on-secondary-container: '#684300'
  tertiary: '#9b4300'
  on-tertiary: '#ffffff'
  tertiary-container: '#c15600'
  on-tertiary-container: '#fffeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a8c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#00468a'
  secondary-fixed: '#ffddb3'
  secondary-fixed-dim: '#ffb951'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#633f00'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68f'
  on-tertiary-fixed: '#331100'
  on-tertiary-fixed-variant: '#773200'
  background: '#f9f9ff'
  on-background: '#181c22'
  surface-variant: '#e0e2eb'
  canvas: '#f6f5f4'
  surface-sunken: '#efeeec'
  surface-hover: '#f8fafc'
  hairline: '#e6e6e6'
  ink: '#0d0d0d'
  ink-secondary: '#31302e'
  ink-muted: '#615d59'
  ink-faint: '#a39e98'
  safe: '#2c8c66'
  safe-soft: '#d9eddf'
  blocked: '#cd4239'
  blocked-soft: '#f7d6d3'
  caution: '#f7a501'
  caution-soft: '#fdf0d0'
typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -1px
  heading-1:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: '1.23'
    letterSpacing: -0.6px
  heading-2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.2px
  heading-3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  prompt:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: -0.1px
  summary:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  table-cell:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.43'
    letterSpacing: '0'
  table-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.33'
    letterSpacing: 0.2px
  metric-xl:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: '700'
    lineHeight: '1.05'
    letterSpacing: -1.2px
  metric-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.15'
    letterSpacing: -0.6px
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: '0'
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: '0'
  badge:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.33'
    letterSpacing: 0.125px
  eyebrow:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.33'
    letterSpacing: 0.6px
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 16px
  margin: 24px
  space-xs: 8px
  space-sm: 12px
  space-md: 16px
  space-lg: 24px
  space-xl: 32px
---

version: alpha
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