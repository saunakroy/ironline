# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Fleet Owners**: Owners of small 1–3 truck carriers who spend 12–18 hours/week managing paperwork, billing, and driver settlements. They need glanceable visibility into unbilled detention, rate mismatches, fuel fraud, and open receivables before settlement.
2. **Truck Drivers**: Drivers on long-haul routes who need a fast, zero-form way to upload physical paperwork (signed BOLs, fuel receipts, lumper slips, DVIR safety reports) from phones or iPads directly in the cab.

## Product Purpose

Ironline automates back-office operations for small trucking fleets. Physical paperwork and phone photos are immediately classified and extracted into structured records. Every evening, autonomous agents cross-check documents across each load to catch money leaking in the gaps—unbilled detention, rate discrepancies, missing PODs, duplicate receipts, and fuel fraud—briefing the owner on exactly what needs attention before money is lost.

## Positioning

Unlike conventional TMS or document filers (e.g., Bubba.ai, TruckingOffice) that simply store PDFs, Ironline actively cross-reconciles multiple independent documents against contract terms and telematics every night, surfacing direct financial leakage with click-through document proof.

## Operating Context

- **Environment**: Mobile and iPad browsers in truck cabs (touch-friendly targets, high contrast, arm's-length readability) and desktop/tablet browsers for fleet owners.
- **Documents Handled**: Rate confirmations (PDF/EML), bills of lading (BOL photos with stamps/handwriting), proof of delivery (POD), thermal fuel receipts, lumper receipts, and daily vehicle inspection reports (DVIR).
- **Core Integrations**: Comdata/Fleet fuel card transaction feeds, Samsara/telematics GPS logs, and broker factoring profiles.

## Capabilities and Constraints

- **Autonomous Agent Relay**: 4 collaborating back-office agents (Extractor, Reconciler, Watchdog, Briefer) passing structured messages.
- **Durable Actor Architecture**: Each freight load lives as a persistent durable actor from rate con negotiation to final broker payment, surviving server restarts and executing scheduled 18:00 EST reconciliation alarms.
- **Zero Forms for Drivers**: Drivers upload raw camera photos or receipts; AI extracts timestamps, PO numbers, and amounts automatically.
- **Click-to-Proof Auditing**: Any flagged financial discrepancy directly links to the source document photo with extracted timestamp/clause proof.
- **Current Scope Boundaries**: Single-fleet vertical (trucking dry van/reefer); no complex auth/multi-tenant or manual inline spreadsheet editing for hackathon demo.

## Brand Commitments

- **Name**: Ironline (Ironline Freight LLC).
- **Voice**: Clean, calm, authoritative, non-technical, and margin-focused.
- **Theme**: Crisp, high-contrast light theme (slate-50 canvas, pure white cards, refined typography) optimized for mobile and iPad viewing.

## Evidence on Hand

- Hackathon onboarding brief: `Ironline Fleet Back-Office Agents — Team Onboarding.pdf`.
- 12 verified planted problem scenarios ($2,688.66 in flagged night leaks across P1–P12: unbilled detention, rate underbilling, capstone lumper, fuel card cloning, duplicate receipts).
- 4-truck synthetic dataset (Ironline Freight LLC, Columbus OH; Trucks 101–104).

## Product Principles

1. **Evidence Before Assertions**: Every flagged dollar must be backed by verifiable document or telematics proof.
2. **Zero In-Cab Friction**: Drivers must never have to type data into forms while on duty; 1-tap capture is mandatory.
3. **Calm Executive Clarity**: Owners should see simple, prioritized action items and direct dollar impacts, not raw developer logs or noisy alarms.
4. **Stateful Durability**: Load lifecycles and scheduled reconciliation triggers persist reliably across any system downtime.
