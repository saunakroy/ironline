# Planted problems - answer key

As of 2026-10-30. Your end-of-day agents should surface these from the inbox + history.

## P1 · UNBILLED_DETENTION  (money)
Load: `IRN-1852`

BOL shows check-in 07:40 / out 12:10 at pickup (270 min). Rate con: 2 hrs free, $65/hr. Billable 150 min = $162.50. Owner notified broker at 10:05 (within 30 min of free-time expiry at 09:40). Invoice draft INV-3253 omits it.

Amount at stake: **$162.50**

## P2 · BILL_TO_NAME_VARIANT  (data)
Load: `IRN-1852`

Invoice draft INV-3253 is addressed to 'Ridgeline Freight, Chicago IL'; legal name on rate con and in customers table is 'Ridgeline Freight Logistics LLC' (BRK001). Same entity - merge, use full name and billing address.

## P3 · RATE_MISMATCH  (money)
Load: `IRN-1856`

Invoice draft INV-3252 bills line haul $1,380.00 (the first quote in owner notes); signed rate con RFL-482355 says $1,680.00. Draft total $2,015.25 vs rate con $2,315.25 -> under-billed $300.00.

Amount at stake: **$300.00**

## P4 · MISSING_POD  (cash)
Load: `IRN-1854`

Driver texted 'delivered, receiver signed' on 10/27 14:10 but no POD photo was ever uploaded. Cannot invoice Buckeye Paper Products until POD is received.

## P5 · POD_EXCEPTION_SHORTAGE  (money)
Load: `IRN-1855`

POD notes 'SHORT 1 PLT - rec'd 21 of 22'. BOL shows 22 pallets and seal 7730125; driver says seal intact. Rate con: shortage claims deducted unless resolved - open an OS&D dispute with Summit Lane now (seal intact = shipper count issue).

## P6 · UNINVOICED_LUMPER  (money)
Load: `IRN-1853`

Driver paid $175.00 lumper at Crossroads Grocery DC (receipt photo 10/28). Rate con reimburses lumper at cost with receipt. Invoice for CLP-226905 should total $2,466.50.

Amount at stake: **$175.00**

## P7 · FUEL_CARD_MISMATCH  (fraud_or_error)

Card FC-7742 is assigned to T102, but was used at Lone Mesa Travel Plaza, Amarillo TX on 2026-10-28 09:20 with unit # 104 entered ($800.73). The same card was used by T102 in Kansas City at 06:10 that morning (~560 mi apart). T104 was in Amarillo then - driver D04 likely used the wrong card ('card acting weird'). Reassign the purchase to T104 for cost/IFTA and check card custody.

Amount at stake: **$800.73**

## P8 · DUPLICATE_RECEIPT  (data)

Same fuel receipt #148263 (T103, Whiteland IN, $1,250.43) uploaded twice (inbox/2026-10-28/receipt_1028_2250_103.jpg and inbox/2026-10-29/IMG_20261029_071228.jpg). Count once.

Amount at stake: **$1,250.43**

## P9 · DVIR_DEFECT_NOT_CERTIFIED  (compliance)

T102 post-trip DVIR 10/27 19:40 lists trailer marker lamp out and missing mud flap. 'Defects corrected' / mechanic signature blank, yet T102 was dispatched 10/28 07:00 (49 CFR 396.11 requires certification of repair before the vehicle is operated again).

## P10 · AR_PAST_DUE  (cash)

Open invoices past due as of 2026-10-30. Headline: INV for Summit Lane dated 2026-09-19 (Net 30, due 10/19) still unpaid - 41 days since invoice. Owner notes ask about it twice.

| Invoice | Customer | Invoice date | Due | Amount | Days past due |
|---|---|---|---|---|---|
| INV-3214 | Summit Lane Logistics Inc | 2026-09-19 | 2026-10-19 | $3,751.36 | 11 |
| INV-3219 | Ridgeline Freight Logistics LLC | 2026-09-23 | 2026-10-23 | $3,592.15 | 7 |
| INV-3220 | Scioto Valley Foods | 2026-09-23 | 2026-10-23 | $4,899.59 | 7 |
| INV-3221 | Scioto Valley Foods | 2026-09-24 | 2026-10-24 | $7,027.55 | 6 |
| INV-3188 | Buckeye Paper Products | 2026-08-28 | 2026-10-27 | $3,295.98 | 3 |
| INV-3224 | Ridgeline Freight Logistics LLC | 2026-09-28 | 2026-10-28 | $9,367.53 | 2 |
| INV-3209 | Prairie Pet Nutrition | 2026-09-14 | 2026-10-29 | $2,198.94 | 1 |
| INV-3226 | Scioto Valley Foods | 2026-09-29 | 2026-10-29 | $5,656.82 | 1 |

## P11 · MEDICAL_CARD_EXPIRING  (compliance)

John Davis's DOT medical card expires 2026-11-11 (12 days). He is in Los Angeles needing a reload - schedule the physical.

## P12 · READY_TO_INVOICE  (cash)

Delivered with POD, no invoice yet: IRN-1853 (CLP-226905, $2,466.50), IRN-1855 (SLL-2457710, $1,708.50), IRN-1857 (CLP-227118, $3,345.75), IRN-1858 (SVF-ORD-77104, $6,671.93). L4 should be invoiced together with the shortage dispute.

## Demo-week loads (ground truth)

| Load | Truck | Bill to | Ref | Lane | Miles | Line haul | FSC | Accessorials | Should invoice | POD |
|---|---|---|---|---|---|---|---|---|---|---|
| IRN-1852 | T101 | Ridgeline Freight Logistics LLC | RFL-482317 | Obetz → Philadelphia | 482 | $1,150.00 | $421.75 | detention $162.50 | $1,734.25 | clean |
| IRN-1853 | T101 | Coastal Load Partners LLC | CLP-226905 | Philadelphia → Indianapolis | 676 | $1,700.00 | $591.50 | lumper $175.00 | $2,466.50 | clean |
| IRN-1854 | T102 | Buckeye Paper Products | PO 4410-88213 | Columbus → Kansas City | 718 | $1,651.40 | $628.25 | - | $2,279.65 | missing |
| IRN-1855 | T102 | Summit Lane Logistics Inc | SLL-2457710 | Kansas City → Indianapolis | 524 | $1,250.00 | $458.50 | - | $1,708.50 | SHORT 1 PLT - rec'd 21 of 22 |
| IRN-1856 | T103 | Ridgeline Freight Logistics LLC | RFL-482355 | Columbus → Minneapolis | 726 | $1,680.00 | $635.25 | - | $2,315.25 | clean |
| IRN-1857 | T103 | Coastal Load Partners LLC | CLP-227118 | Minneapolis → Atlanta | 1058 | $2,420.00 | $925.75 | - | $3,345.75 | clean |
| IRN-1858 | T104 | Scioto Valley Foods | SVF-ORD-77104 | Groveport → Los Angeles | 2281 | $4,676.05 | $1,995.88 | - | $6,671.93 | clean |
