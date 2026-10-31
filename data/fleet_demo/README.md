# Ironline Freight — demo dataset

A fictional 4-truck dry van carrier in Columbus, OH, built for an "agents turn messy trucking paperwork into structured data and flag problems" demo.

- **`history/`** — 2 years of clean operating data (Nov 2024 → Oct 24, 2026). Load it into your database; it powers the KPI dashboard.
- **`inbox/`** — this week's raw paperwork (Mon 10/26 → Fri 10/30/2026), one folder per day. Feed it to your agents a day at a time.
- **`answer_key/`** — what the agents should extract and the 12 problems they should catch.

Everything is fictional: company, brokers, shippers, people, addresses, and MC/DOT numbers (`900xxx` pattern so they can't match a real carrier). Email domains end in `.example`.

## Demo flow

1. Load `history/*.csv` (dashboard shows revenue/mile, fuel cost, AR aging, IFTA miles by state, etc.).
2. Each "day", drop that day's `inbox/2026-10-2X/` files into the app. The extractor turns each file into records.
3. End of day, the reconciler/watchdog agents compare documents to each other and to history and write the owner briefing.
4. Check results against `answer_key/planted_issues.md`.

## `inbox/` — 47 files

| Kind | Format | Notes |
|---|---|---|
| Rate confirmations (5) | PDF | From 3 brokers. Line haul + DOE fuel surcharge, detention/lumper/shortage terms |
| Load tenders (2) | `.eml` text | Direct shippers, contract $/mi + FSC |
| BOL photos (7) / POD photos (6) | JPG | Phone-photo style: skewed, shadowed, handwritten fields, receiving stamp, in/out times |
| Fuel receipts (13) | JPG | Thermal-receipt style; card last 4, unit #, odometer, gallons, PPG, DEF |
| Lumper receipt, DVIR | JPG | |
| Invoice drafts (2) | DOCX | Written by the owner — both contain mistakes |
| Driver group texts | TXT | One per day, informal |
| Owner notes | TXT | One per day, Notepad style |

## The 12 planted problems (details in `answer_key/planted_issues.md`)

| # | Problem | $ / impact |
|---|---|---|
| P1 | Unbilled detention (BOL times 07:40→12:10, 2 hrs free, $65/hr) | $162.50 |
| P2 | Invoice billed to "Ridgeline Freight" — legal name is Ridgeline Freight Logistics LLC | data |
| P3 | Invoice uses first quote $1,380, signed rate con says $1,680 | $300.00 |
| P4 | Driver says delivered, but no POD uploaded → can't invoice | $2,279.65 blocked |
| P5 | POD exception "SHORT 1 PLT", seal intact → dispute before broker deducts | claim risk |
| P6 | $175 lumper receipt not on any invoice | $175.00 |
| P7 | T102's fuel card used in Amarillo 3 hrs after T102 used it in Kansas City (unit # 104 entered) | $800.73 |
| P8 | Same fuel receipt uploaded twice | $1,250.43 |
| P9 | DVIR defects not certified repaired, truck dispatched next morning | compliance |
| P10 | Past-due AR — Summit Lane invoice 41 days old, plus 7 others | cash |
| P11 | Driver D04's medical card expires in 12 days | compliance |
| P12 | 4 delivered loads with POD not yet invoiced | $14,192.68 |

## `history/` tables

| File | Rows | Key columns |
|---|---|---|
| `trucks.csv` | 4 | truck_id, fleet_unit, make, model_year, tank_capacity_gallons, fuel_card |
| `drivers.csv` | 4 | driver_id, name, phone, cdl_expiration, medical_card_expiration |
| `trailers.csv` | 6 | trailer_id |
| `customers.csv` | 15 | 12 shippers + 3 brokers, credit_terms_days |
| `lanes.csv` | 58 | origin/destination, typical_distance_miles (from source) |
| `loads.csv` | 852 | customer_id, customer_reference, linehaul, fuel_surcharge, detention_incurred vs detention_billed, lumper, total_billed, pickup/delivery dates |
| `trips.csv` | 1,175 | loaded + deadhead legs, miles, odometer start/end, gallons, mpg |
| `stop_events.csv` | 1,704 | appointment, arrived, departed, on_time, detention_minutes |
| `fuel_purchases.csv` | 1,375 | datetime, city/state, gallons, price, DEF, odometer, fuel_card |
| `ifta_state_miles.csv` | by truck/month/state | miles per jurisdiction |
| `maintenance_records.csv` | 199 | type, description, labor/parts, downtime |
| `invoices.csv` | 852 | invoice/due/paid dates, quick pay, short pays, status |

**Sanity numbers (vs. 2026 benchmarks):** ~141K miles/truck/yr, 11% deadhead, 6.48 mpg avg, line haul $2.08/mi in 2025 rising to $2.37/mi in Sep–Oct 2026 (DAT dry van spot linehaul ~$2.26–$2.65 in Oct 2026), fuel surcharge $0.875/mi at $6.50 diesel (DAT est. 84¢/mi in Sep), on-time 91–92%, detention on ~15% of stops with 31% of it never billed ($7.4K leaked — a good dashboard KPI), maintenance $0.26/mi (ATRI 2025 avg $0.215; these are 2015–16 trucks), $142K open AR across 37 invoices.

## How it was built

Source: Kaggle **yogape/logistics-operations-database** (fictional Class 8 carrier, 2022–2024, 14 tables).

**Reused:** lanes and distances; per-load revenue/mile, weight and booking type sampled from that lane's Dry Van loads; Columbus-terminal truck makes/units and driver names.

**Rebuilt, because the source isn't physically consistent:**
- Source trucks average ~470K mi/yr and consecutive trips aren't connected → trips here chain city to city with hours-of-service pacing, deadhead and home time.
- Source fuel locations pair random cities with random states ("New York, AZ") and purchased gallons don't match consumption → fuel stops are placed along each route and gallons reconcile with MPG (99.9%).
- Source fuel prices are 2022–24 levels → priced from a monthly 2026 diesel index × state factor.
- Source delivery on-time rate is 45% → ~91%; detention starts after 2 hrs free.
- No invoices or brokers in source → added, using source credit terms.
- 93 of the source's 200 customer names are duplicates → replaced with 12 distinct fictional shippers.

**Approximations to know about:** monthly diesel values for Nov 2024–Jan 2026 are estimates near EIA levels; 2026 values follow the anchors below. IFTA state miles use the nearest truck-stop town along a straight line, not real highway geometry. Demo-week rate cons are dated the business day before pickup.

**Regenerate:**
```
python3 scripts/build_history.py <kaggle csv dir> history
python3 scripts/build_docs.py history .
python3 scripts/write_answer_key.py .
```

## Market sources used for realism

- DAT dry van spot rates, Oct 2026 — https://www.dat.com/blog/?p=27688 · https://www.ajot.com/news/dat-spot-truckload-pricing-and-load-to-truck-ratios-for-oct-1016-2026-week-42
- DAT Sept 2026 (diesel > $6, fuel surcharge 84¢/mi) — https://finviz.com/news/401824/dat-truckload-rates-rise-in-september-as-diesel-tops-6-a-gallon
- Diesel by state, Sep 2026 (CA ~$7.71, OK ~$5.38) — https://keepingupwithinflation.com/diesel-prices-by-state-ranked/
- ATRI operational costs 2026 update — https://www.truckinginfo.com/news/trucking-fleets-faced-record-operating-costs-during-third-year-of-freight-recession
- Detention rates and free time — https://otrucking.com/resources/guides/detention-pay-rates-2026/
- Broker payment terms / quick pay — https://otrucking.com/resources/guides/broker-payment-terms/ · https://otrucking.com/resources/guides/quickpay-rates-by-broker/
- Rate con, BOL, POD and DVIR contents — https://otrucking.com/resources/glossary/rate-confirmation/ · https://parcelpath.com/freight-ltl/freight-freight-class-and-documentation/bill-of-lading/ · https://bubba.ai/blog/proof-of-delivery · https://heavyvehicleinspection.com/blog/post/dvir-template-form
