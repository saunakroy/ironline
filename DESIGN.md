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
  caption:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
  caption-sm:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
  caption-xs:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1.2
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

<details open>
<summary><h2>1. Overview</h2></summary>

**Creative North Star: "The Night Shift Dispatcher"**

Ironline is built for long-haul trucking fleet owners and in-cab drivers operating in high-stakes, fatigue-prone nocturnal environments. The visual language firmly rejects generic SaaS dashboard templates in favor of authoritative industrial craft: deep obsidian canvas surfaces (`#070b14`), high-contrast white text (`#f8fafc`), precision tabular numerals, and safety orange signals (`#f97316`) that illuminate recoverable dollars before payroll settlement.

The interface functions as an autonomous digital ledger that never sleeps. Surfaces feel solid, tactile, and layered, using subtle micro-ambient glows to immediately direct the eye to critical margin leaks while keeping operational monitoring legible at an arm's length on iPad and phone screens.

**Communication Architecture & The Dispatcher Air-Gap:**
In real freight operations, **the driver and the broker never talk**. Drivers communicate exclusively with their dispatcher (or the autonomous fleet agent acting on behalf of dispatch). Brokers never reach into the cab. The autonomous agent is the sole entity negotiating, reconciling clauses, and transmitting invoices or detention claims to the broker. The UI strictly enforces this separation: drivers see zero broker friction, while owners see the agent's broker-facing audit trails.

**Key Characteristics:**
- **Nocturnal High Contrast:** Obsidian background (`#070b14`) paired with crisp white text (`#f8fafc`) for glare-free outdoor and night cab viewing.
- **Dollars as the Stars:** Financial figures are rendered in oversized tabular monospace (`JetBrains Mono`) so amounts line up cleanly and command the screen.
- **Precision Evidence Anchors:** Discrepancies do not just state claims; they anchor to physical document proof with glowing problem field overlays.
- **Collapsible Section Density:** Every primary operational screen area is an expandable dropdown accordion, ensuring compact vertical control on mobile.

</details>

<details open>
<summary><h2>2. Colors</h2></summary>

The palette draws inspiration from highway signage, terminal telematics, nocturnal dashboard backlights, and logistics safety equipment.

### Primary
- **Safety Orange** (`#f97316`): The primary actionable signal. Reserved exclusively for money at risk, hero CTAs, active file drop zones, and critical attention items.
- **Hazard Amber** (`#f59e0b`): Secondary cautionary warnings (overdue receivables, documents requiring human review, fuel alert thresholds).

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
**The Dispatcher Air-Gap Color Rule.** Driver-facing ingestion surfaces use calm, zero-friction neutrals and sky accents; broker-reconciled discrepancies are reserved for high-signal orange and amber.

</details>

<details open>
<summary><h2>3. Typography</h2></summary>

**Display & Headline Font:** Plus Jakarta Sans  
**Body Font:** Plus Jakarta Sans  
**Tabular & Monospace Font:** JetBrains Mono  

**Character:** Modern geometric legibility paired with mechanical tabular numbers designed for rapid visual verification under cab lighting.

### Hierarchy
- **Display** (800 weight, 2.25rem / 36px, line-height 1.15): Hero dollar totals ($2,689 count-up).
- **Headline** (700 weight, 1.5rem / 24px, line-height 1.25): Screen titles and hero briefing headlines.
- **Title** (700 weight, 1.125rem / 18px, line-height 1.35): Briefing card titles and document classification tags.
- **Body** (400 weight, 0.875rem / 14px, line-height 1.5): Problem explanations and contract clauses.
- **Label / Tabular** (600 weight, 0.875rem / 14px, letter-spacing -0.01em): Numeric dollar values, timestamps, and load references.

### Named Rules
**The Tabular Money Rule.** Every dollar amount must render in `font-mono tabular-nums` to prevent layout jitter during count-up animations and maintain visual alignment.

</details>

<details open>
<summary><h2>4. Layout</h2></summary>

- **Spatial Grid:** 8px baseline rhythm across all cards and sections.
- **Max Width:** Constrained to `max-w-6xl` (1152px) for focused scannability on desktop; full fluid bleed on mobile.
- **Touch Targets:** Minimum 44px height for interactive targets on mobile viewports.
- **The Collapsible Section Doctrine:** Every operational section (Paperwork Dropzone, Just Processed Strip, Discrepancies List, Also on Watch Box) renders as an interactive dropdown accordion. Users can collapse completed sections to preserve vertical screen density.
- **Responsive Stacking:** Desktop uses multi-column metric strips and side-by-side evidence views; mobile (<640px) collapses to single-column swipeable cards and bottom-sheet drawers.

</details>

<details open>
<summary><h2>5. Elevation & Depth</h2></summary>

Surfaces rely on tonal layering and subtle 1px border strokes rather than heavy drop shadows.

- **Resting Layer:** Background canvas (`#070b14`).
- **Elevated Layer:** Cards (`#0f172a`) with subtle 1px border (`#1e293b`).
- **Active / Hover Layer:** Surface lifts slightly (`transform: translateY(-2px)`) with a soft radial orange glow (`box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.16)`).
- **Backdrop Blur:** Modal drawers and floating navigation bars use `backdrop-blur-md` over a 75% dark overlay.

### Named Rules
**The Tone-Over-Shadow Rule.** Depth is created through surface luminance steps (`#070b14` → `#0f172a` → `#1e293b`), not blurry artificial shadows.

</details>

<details open>
<summary><h2>6. Shapes</h2></summary>

- **Base Radius:** 16px (`rounded-2xl`) for primary cards, dropzones, and modals.
- **Secondary Radius:** 12px (`rounded-xl`) for metric widgets, action buttons, and nested frames.
- **Small Radius:** 6px–8px (`rounded-md` / `rounded-lg`) for table rows, tags, and chips.
- **Pill Radius:** 9999px (`rounded-full`) for status badges, live indicator dots, and mobile drag handles.
- **Border Treatment:** 1px solid semi-transparent stroke (`rgba(51, 65, 85, 0.8)`) to preserve clean geometry without harsh clipping.

</details>

<details open>
<summary><h2>7. Components</h2></summary>

### 1. Accordion Section Headers (Dropdowns)
- **Style:** Subtle font-mono uppercase header with chevron toggle (`ChevronUp` / `ChevronDown`).
- **Interaction:** 1-tap collapse/expand of operational sections with smooth 150ms fade transitions.

### 2. Briefing Cards
- **Corner Style:** 16px radius (`rounded-xl` / `rounded-2xl`).
- **Surface:** Slate-900 (`#0f172a`) with border Slate-800 (`#334155`).
- **Hover:** 2px vertical lift with Safety Orange accent border glow.
- **Dollar Display:** Prominent tabular monospace font in Safety Orange (`text-orange-400 tabular-nums`).
- **Evidence Link:** Dedicated button with external link icon opening the drawer.

### 3. Evidence Viewer Drawer
- **Desktop:** 540px slide-in right drawer with `backdrop-blur-md` overlay.
- **Mobile (390px):** Smooth slide-up bottom sheet with top drag handle pill.
- **Confidence Meter:** Animated horizontal progress bar filling from 0% to extraction score.
- **Pulsing Highlight:** Problem fields in the extracted table pulse with an amber border glow (`animate-problem-pulse`).
- **Collapsible Dropdown Bodies:** Physical Document Proof, Extracted Fields, and Agent Recommendations are individually collapsible accordions.

### 4. Compact Paperwork Dropzone
- **Resting State:** Subtle dashed border (`border-dashed border-slate-800`) with quick *"Load demo files"* 1-click action.
- **Dragging State:** Highlighted border in Safety Orange with glowing amber-tinted backdrop.
- **Mobile State:** Prominently displays *"Take photo / choose file"* touch button (`min-h-[44px]`).
- **Error State:** In-line dismissible red alert banner for unsupported file types.

### 5. Agent Relay Feed (The Dispatcher Air-Gap Interface)
- **Message Cards:** Clear sender-to-recipient routing (`[Extractor] -> [Reconciler]`).
- **Agent Color Coding:** Sky for Extractor, Purple for Reconciler, Amber for Watchdog, Emerald for Briefer.
- **Air-Gap Enforcement:** Driver SMS messages feed only into Extractor/Dispatch; Reconciler transmits claims to Brokers.

</details>

<details open>
<summary><h2>8. Do's and Don'ts</h2></summary>

### Do:
- **Do** format every dollar amount with consistent precision in tabular numerals (`$1,250.43`).
- **Do** wrap operational sections in collapsible dropdowns so users can manage screen space.
- **Do** isolate drivers from brokers: drivers speak only to dispatch/agents; agents speak to brokers.
- **Do** display an extraction confidence score on every parsed document record.
- **Do** anchor every financial discrepancy to verifiable document evidence.
- **Do** ensure 100% touch target ergonomics (≥44px) on 390px mobile screens.

### Don't:
- **Don't** ever show or facilitate direct driver-to-broker communication; the dispatcher/agent owns all broker discussions.
- **Don't** use bright light backgrounds that cause glare in dark truck cabs.
- **Don't** require drivers or owners to fill in manual spreadsheet forms.
- **Don't** bury dollar amounts behind secondary navigation clicks; money is always the headline.
- **Don't** animate elements longer than 600ms (except smooth count-up).

</details>
