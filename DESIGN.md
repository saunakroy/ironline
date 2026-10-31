---
name: Ironline Design System
description: Night-shift industrial craft for fleet back-office autonomous agents
colors:
  primary: "#f97316"
  primary-hover: "#ea580c"
  primary-glow: "rgba(249, 115, 22, 0.15)"
  secondary: "#38bdf8"
  secondary-subtle: "rgba(56, 189, 248, 0.12)"
  neutral-bg: "#070b14"
  neutral-surface: "#0f172a"
  neutral-surface-raised: "#1e293b"
  neutral-border: "#334155"
  neutral-border-subtle: "rgba(51, 65, 85, 0.6)"
  text-primary: "#f8fafc"
  text-secondary: "#94a3b8"
  text-muted: "#64748b"
  status-success: "#10b981"
  status-warning: "#f59e0b"
  status-danger: "#ef4444"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, -apple-system, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.neutral-surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  card-surface:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: Ironline

## Overview

**Creative North Star: "The Night Shift Dispatcher"**

Ironline is built for long-haul trucking owners and in-cab drivers operating in high-stakes, fatigue-prone environments. The visual language rejects SaaS template defaults in favor of an authoritative, nocturnal industrial craft: high-contrast dark surfaces, precision tabular numerals, and safety orange callouts that highlight dollars at stake before settlement.

The interface functions as a digital ledger that never sleeps. Surfaces feel solid and layered, with micro-ambient glows that immediately direct attention to high-value margin leaks while keeping secondary operational data legible at an arm's length on iPads and phones.

**Key Characteristics:**
- **Nocturnal High Contrast:** Obsidian background (`#070b14`) paired with crisp white text (`#f8fafc`) for glare-free outdoor and night cab viewing.
- **Dollars as the Stars:** Financial figures are rendered in oversized tabular monospace (`JetBrains Mono`) so amounts line up cleanly and command the screen.
- **Precision Evidence Anchors:** Discrepancies do not just state claims; they anchor to physical document proof with glowing problem field overlays.

## Colors

The palette draws inspiration from highway signage, terminal telematics, and logistics safety gear.

### Primary
- **Safety Orange** (`#f97316`): The primary actionable signal. Reserved exclusively for money at risk, hero CTAs, and critical attention items.
- **Hazard Amber** (`#f59e0b`): Secondary cautionary warnings (overdue receivables, review required).

### Secondary
- **Telematics Cyan** (`#38bdf8`): Used for system connectivity, active load routes, and durable actor state indicators.
- **Terminal Green** (`#10b981`): Live heartbeat pulses, verified document extractions, and confirmed margin recoveries.

### Neutral
- **Obsidian Dark** (`#070b14`): Deep root background canvas.
- **Surface Layer 1** (`#0f172a`): Primary container and card background.
- **Surface Layer 2** (`#1e293b`): Elevated rows, secondary buttons, and active hover states.
- **Muted Steel Border** (`#334155`): Structural border dividers and card bounding boxes.
- **Primary Text** (`#f8fafc`): Uncompromising high-legibility body and headline copy.
- **Muted Slate Text** (`#94a3b8`): Secondary metadata, timestamps, and contextual captions.

### Named Rules
**The Rarity of Orange Rule.** Safety orange is used on ≤5% of screen real estate. When orange appears, it means dollars need immediate human attention.

## Typography

**Display & Headline Font:** Plus Jakarta Sans  
**Body Font:** Plus Jakarta Sans  
**Tabular & Monospace Font:** JetBrains Mono  

**Character:** Modern geometric legibility paired with mechanical tabular numbers designed for fast numeric scanning.

### Hierarchy
- **Display** (800 weight, 2.25rem / 36px, line-height 1.15): Hero dollar totals ($2,689 count-up).
- **Headline** (700 weight, 1.5rem / 24px, line-height 1.25): Screen titles and hero briefing headlines.
- **Title** (700 weight, 1.125rem / 18px, line-height 1.35): Briefing card titles and document classification tags.
- **Body** (400 weight, 0.875rem / 14px, line-height 1.5): Problem explanations and contractor terms.
- **Label / Tabular** (600 weight, 0.875rem / 14px, letter-spacing -0.01em): Numeric dollar values, timestamps, and load references.

### Named Rules
**The Tabular Money Rule.** Every dollar amount must render in `font-mono tabular-nums` to prevent layout jitter during count-up animations and maintain visual alignment.

## Layout

- **Spatial Grid:** 8px baseline rhythm across all cards and sections.
- **Max Width:** Constrained to `max-w-5xl` (1024px) for focused scannability on desktop; full fluid bleed on mobile.
- **Touch Targets:** Minimum 44px height for interactive targets on mobile viewports.
- **Responsive Stacking:** Desktop uses multi-column metric strips and side-by-side evidence views; mobile (<640px) collapses to single-column swipeable cards and bottom-sheet drawers.

## Elevation & Depth

Surfaces rely on tonal layering and subtle 1px border strokes rather than heavy drop shadows.

- **Resting Layer:** Background canvas (`#070b14`).
- **Elevated Layer:** Cards (`#0f172a`) with subtle 1px border (`#1e293b`).
- **Active / Hover Layer:** Surface lifts slightly (`transform: translateY(-2px)`) with a soft radial orange glow (`box-shadow: 0 8px 24px rgba(249, 115, 22, 0.12)`).

## Shapes

- **Base Radius:** 16px (`rounded-2xl`) for cards and containers.
- **Pill Radius:** 9999px (`rounded-full`) for status chips, agent badges, and category tags.
- **Border Treatment:** 1px solid stroke with semi-transparent alphas to avoid harsh lines.

## Components

### Briefing Cards
- **Corner Style:** 16px radius (`rounded-2xl`).
- **Surface:** Slate-900 (`#0f172a`) with border Slate-800 (`#1e293b`).
- **Hover:** Subtle 2px lift with border transition to Orange-500/40.
- **Dollar Display:** Prominent right-aligned tabular numerals in Safety Orange.

### Evidence Viewer
- **Desktop:** 540px slide-in right drawer with `backdrop-blur-md` overlay.
- **Mobile (390px):** Smooth slide-up bottom sheet with swipe-down dismiss handle.
- **Confidence Meter:** Animated horizontal progress bar filling from 0% to score.
- **Pulsing Highlight:** Problem fields in the extracted table pulse with an amber border glow.

### Compact Paperwork Dropzone
- **Resting State:** Subtle dashed border (`border-dashed border-slate-700`) with quick *"Load demo files"* 1-click action.
- **Dragging State:** Highlighted border in Safety Orange with glowing backdrop.
- **Mobile State:** Converts into a touch-first *"Take photo / Choose file"* action bar.

## Do's and Don'ts

### Do:
- **Do** format every dollar amount with consistent 2-decimal precision (`$1,250.43`).
- **Do** display an extraction confidence badge on every parsed document.
- **Do** anchor every financial discrepancy to verifiable document evidence.
- **Do** ensure 100% responsive fluid behavior on 390px iPhone/iPad screens.

### Don't:
- **Don't** use bright light backgrounds that cause glare in night driving conditions.
- **Don't** require drivers or owners to fill in manual spreadsheet forms.
- **Don't** bury dollar amounts behind secondary clicks; money is always hero.
- **Don't** animate elements longer than 600ms (except smooth count-up).
