"""Build ~2 years of operating history for a fictional 4-truck dry van fleet
(Ironline Freight LLC, Columbus OH) from the Kaggle "logistics operations
database" (yogape/logistics-operations-database).

What is reused from the source dataset:
  - lanes (routes.csv: city pairs, distances)
  - per-load economics (revenue per mile, weight, pieces, booking type) sampled
    from that lane's Dry Van loads
  - truck make/model/unit numbers and driver names for the Columbus terminal
What is rebuilt (because the source is not physically consistent):
  - trips chain city-to-city with realistic hours-of-service pacing
    (source trucks average ~470K mi/yr and trips are not connected)
  - fuel stops along the actual route, gallons that reconcile with MPG,
    prices from a 2026 diesel index (source prices are 2022-24 levels and
    fuel locations pair random cities with random states)
  - appointment/arrival times with ~90-93% on-time (source: 45%) and
    detention after 2 hours free time
  - invoices and payments (not in the source), IFTA miles by state,
    maintenance at realistic cost levels

Usage: python3 build_history.py <dir with source CSVs> <output dir>
"""
import sys, os, math, random
from datetime import datetime, timedelta, date
import pandas as pd
import numpy as np
from common import *

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
rng = random.Random(20261031)
np.random.seed(20261031)

routes = pd.read_csv(os.path.join(SRC, "routes.csv"))
loads_src = pd.read_csv(os.path.join(SRC, "loads.csv"))
trucks_src = pd.read_csv(os.path.join(SRC, "trucks.csv"))
drivers_src = pd.read_csv(os.path.join(SRC, "drivers.csv"))
cust_src = pd.read_csv(os.path.join(SRC, "customers.csv"))

HOME = ("Columbus", "OH")
HOME_PT = CITY_COORD[HOME]

# ---------------------------------------------------------------- fleet
TRUCK_PICK = ["TRK00010", "TRK00050", "TRK00051", "TRK00058"]
DRIVER_PICK = ["DRV00002", "DRV00026", "DRV00039", "DRV00101"]
start_odo = [612_480, 734_915, 548_102, 689_377]
mpg_base = [6.6, 6.2, 6.9, 6.4]
trucks = trucks_src.set_index("truck_id").loc[TRUCK_PICK].reset_index()
trucks["fleet_unit"] = ["101", "102", "103", "104"]
trucks["source_truck_id"] = trucks["truck_id"]
trucks["truck_id"] = ["T101", "T102", "T103", "T104"]
trucks["fuel_card"] = ["FC-7741", "FC-7742", "FC-7743", "FC-7744"]
trucks["odometer_start"] = start_odo
trucks["baseline_mpg"] = mpg_base
trucks["tank_capacity_gallons"] = [200, 150, 250, 200]  # from source trucks
trucks["home_terminal"] = "Columbus, OH"
trucks["status"] = "Active"
trucks = trucks[["truck_id", "fleet_unit", "source_truck_id", "make", "model_year", "vin", "tank_capacity_gallons",
                 "baseline_mpg", "fuel_card", "odometer_start", "home_terminal", "status"]]

drivers = drivers_src.set_index("driver_id").loc[DRIVER_PICK].reset_index()
drivers["source_driver_id"] = drivers["driver_id"]
drivers["driver_id"] = ["D01", "D02", "D03", "D04"]
drivers["assigned_truck"] = ["T101", "T102", "T103", "T104"]
drivers["hire_date"] = ["2020-10-02", "2019-10-10", "2021-03-15", "2022-06-01"]
drivers["years_experience"] = [14, 22, 8, 6]
drivers["cdl_expiration"] = ["2028-11-03", "2027-08-17", "2029-08-14", "2027-03-03"]
# D04 medical card expires 12 days after AS_OF -> planted compliance flag
drivers["medical_card_expiration"] = ["2027-05-20", "2027-02-11", "2028-01-09", "2026-11-11"]
drivers["phone"] = ["(614) 555-0191", "(614) 555-0127", "(614) 555-0155", "(614) 555-0174"]
drivers["home_terminal"] = "Columbus, OH"
drivers = drivers[["driver_id", "source_driver_id", "first_name", "last_name", "phone", "hire_date", "years_experience",
                   "license_number", "license_state", "cdl_class", "cdl_expiration", "medical_card_expiration",
                   "assigned_truck", "home_terminal"]]

trailers = pd.DataFrame({
    "trailer_id": ["V5301", "V5302", "V5303", "V5304", "V5305", "V5306"],
    "trailer_type": "53' Dry Van", "model_year": [2019, 2019, 2020, 2021, 2017, 2018],
    "status": ["Active"] * 5 + ["Spare"],
})

# ---------------------------------------------------------------- customers
# Remap source customers to 12 fictional shippers; spot loads go to 3 fictional brokers.
src_contract = cust_src[cust_src.customer_type != "Spot"].customer_id.tolist()
shippers = []
for i, name in enumerate(SHIPPER_NAMES):
    src_id = src_contract[i]
    terms = int(cust_src.set_index("customer_id").loc[src_id, "credit_terms_days"])
    shippers.append(dict(customer_id=f"C{i+1:03d}", customer_name=name, customer_type="Shipper",
                         source_customer_id=src_id, credit_terms_days=terms,
                         billing_email=name.lower().replace(" ", "").replace("-", "") [:18] + "@ap.example"))
cust = pd.DataFrame(shippers + [dict(customer_id=b["id"], customer_name=b["name"], customer_type="Broker",
                                     source_customer_id="", credit_terms_days=b["terms_days"],
                                     billing_email=b["billing_email"]) for b in BROKERS])
slow_payers = {"C009": 18, "C004": 9}       # avg days late beyond terms
dedicated = ["C001", "C002"]                 # dedicated Columbus shippers

# ---------------------------------------------------------------- lanes
def city_pt(c, s):
    return CITY_COORD[(c, s)]

lanes = routes.copy()
lanes["o"] = list(zip(lanes.origin_city, lanes.origin_state))
lanes["d"] = list(zip(lanes.destination_city, lanes.destination_state))
dv = loads_src[loads_src.load_type == "Dry Van"]
lane_loads = {r: g for r, g in dv.groupby("route_id")}


def market_mult(d):
    if d < date(2026, 3, 1):
        return 0.95
    frac = min(1, (d - date(2026, 3, 1)).days / (date(2026, 10, 1) - date(2026, 3, 1)).days)
    return 0.95 + 0.17 * frac


def round30(t):
    m = (t.minute // 30 + (1 if t.minute % 30 else 0)) * 30
    return t.replace(minute=0, second=0, microsecond=0) + timedelta(minutes=m)


def next_window(t, earliest_h=5, latest_h=15):
    t = round30(t)
    if t.hour < earliest_h:
        t = t.replace(hour=earliest_h, minute=0)
    if t.hour >= latest_h:
        t = (t + timedelta(days=1)).replace(hour=rng.choice([5, 6, 7, 8, 9]), minute=rng.choice([0, 30]))
    return t


def drive_elapsed_hours(miles):
    driving = miles / 52.0
    return driving + 10 * math.floor(driving / 11.0)


# ---------------------------------------------------------------- simulation
rows = dict(loads=[], trips=[], stops=[], fuel=[], ifta=[], maint=[])
load_n, trip_n, stop_n, fuel_n, maint_n = [1000], [1], [1], [1], [1]


def run_leg(truck, st, a, b, miles, t0, trip_id, trip_type):
    """Drive from point a to b; buy fuel when low, tally IFTA state miles."""
    steps = max(1, int(miles // 10))
    step_mi = miles / steps
    elapsed = drive_elapsed_hours(miles)
    state_mi = {}
    for i in range(steps):
        f = (i + 0.5) / steps
        pt = interp(a, b, f)
        town = nearest_town(pt)
        state_mi[town[1]] = state_mi.get(town[1], 0) + step_mi
        st["fuel"] -= step_mi / st["mpg_now"]
        st["odo"] += step_mi
        if st["fuel"] < 0.28 * truck.tank_capacity_gallons:
            when = t0 + timedelta(hours=elapsed * f)
            fill = truck.tank_capacity_gallons * rng.uniform(0.88, 0.98) - st["fuel"]
            gal = round(min(fill, truck.tank_capacity_gallons - st["fuel"]), 1)
            price = round(diesel_index(when.date()) * STATE_FUEL_FACTOR.get(town[1], 1.0) * rng.uniform(0.97, 1.04), 3)
            def_gal = round(rng.uniform(4, 9), 1) if rng.random() < 0.35 else 0.0
            def_price = round(rng.uniform(3.69, 4.49), 3) if def_gal else 0.0
            rows["fuel"].append(dict(fuel_purchase_id=f"F{fuel_n[0]:06d}", trip_id=trip_id, truck_id=truck.truck_id,
                                     driver_id=st["driver"], purchase_datetime=when.strftime("%Y-%m-%d %H:%M"),
                                     city=town[0], state=town[1], gallons=gal, price_per_gallon=price,
                                     fuel_total=round(gal * price, 2), def_gallons=def_gal, def_price=def_price,
                                     def_total=round(def_gal * def_price, 2), odometer=int(st["odo"]),
                                     fuel_card=truck.fuel_card))
            fuel_n[0] += 1
            st["fuel"] += gal
    for s, m in state_mi.items():
        rows["ifta"].append(dict(trip_id=trip_id, truck_id=truck.truck_id, trip_type=trip_type,
                                 month=t0.strftime("%Y-%m"), state=s, miles=round(m, 1)))
    return elapsed


def add_maint(truck, when, mtype, desc, cost_lo, cost_hi, down_lo, down_hi, where, odo, labor_share=0.45):
    total = round(rng.uniform(cost_lo, cost_hi), 2)
    labor = round(total * rng.uniform(labor_share - 0.1, labor_share + 0.1), 2)
    rows["maint"].append(dict(maintenance_id=f"M{maint_n[0]:05d}", truck_id=truck.truck_id,
                              date=when.strftime("%Y-%m-%d"), maintenance_type=mtype, description=desc,
                              odometer=int(odo), location=where, labor_cost=labor, parts_cost=round(total - labor, 2),
                              total_cost=total, downtime_hours=round(rng.uniform(down_lo, down_hi), 1)))
    maint_n[0] += 1


for ti, truck in trucks.iterrows():
    st = dict(city=HOME, t=datetime(2024, 11, 1, 6, 0) + timedelta(hours=ti * 3), odo=truck.odometer_start,
              fuel=truck.tank_capacity_gallons * 0.9, driver=drivers.loc[ti, "driver_id"],
              days_out_since=datetime(2024, 11, 1), next_pm=truck.odometer_start + rng.randint(5000, 24000),
              next_tire=truck.odometer_start + rng.randint(20000, 90000),
              next_brake=truck.odometer_start + rng.randint(40000, 150000), last_dot=None,
              trailer=trailers.trailer_id[ti])
    end_by = datetime(2026, 10, 23, 18, 0)
    while True:
        here = st["city"]
        here_pt = city_pt(*here)
        days_out = (st["t"] - st["days_out_since"]).total_seconds() / 86400
        near_end = st["t"] > datetime(2026, 10, 15)
        # ---- go home?
        if (days_out >= 6 and haversine(here_pt, HOME_PT) < 260) or days_out >= 12 or \
                (near_end and here != HOME) or st["t"] > datetime(2026, 10, 20):
            if here != HOME:
                miles = round(haversine(here_pt, HOME_PT) * 1.17)
                tid = f"TR{trip_n[0]:06d}"; trip_n[0] += 1
                st["mpg_now"] = truck.baseline_mpg * rng.uniform(0.95, 1.05)
                odo0 = st["odo"]
                el = run_leg(truck, st, here_pt, HOME_PT, miles, st["t"], tid, "deadhead")
                rows["trips"].append(dict(trip_id=tid, load_id="", truck_id=truck.truck_id, driver_id=st["driver"],
                                          trailer_id=st["trailer"], trip_type="Deadhead",
                                          start_datetime=st["t"].strftime("%Y-%m-%d %H:%M"),
                                          end_datetime=(st["t"] + timedelta(hours=el)).strftime("%Y-%m-%d %H:%M"),
                                          origin=f"{here[0]}, {here[1]}", destination="Columbus, OH",
                                          miles=miles, odometer_start=int(odo0), odometer_end=int(st["odo"]),
                                          fuel_gallons_used=round(miles / st["mpg_now"], 1),
                                          mpg=round(st["mpg_now"], 2)))
                st["t"] += timedelta(hours=el)
                st["city"] = HOME
            if st["t"] > end_by:
                break
            # home time + maintenance at home
            home_h = rng.uniform(44, 76)
            if st["odo"] >= st["next_pm"]:
                add_maint(truck, st["t"], "Preventive", "PM-A service: oil, filters, lube, inspection",
                          650, 980, 3, 6, "Columbus, OH", st["odo"])
                st["next_pm"] = st["odo"] + rng.randint(23000, 27000)
            if st["odo"] >= st["next_tire"]:
                n = rng.choice([2, 4, 8])
                add_maint(truck, st["t"], "Tire", f"Replace {n} drive/steer tires", 560 * n, 680 * n, 2, 5,
                          "Columbus, OH", st["odo"], 0.15)
                st["next_tire"] = st["odo"] + rng.randint(80000, 110000)
            if st["odo"] >= st["next_brake"]:
                add_maint(truck, st["t"], "Brake", "Brake shoes, drums and slack adjusters (drive axles)",
                          1400, 2900, 5, 10, "Columbus, OH", st["odo"])
                st["next_brake"] = st["odo"] + rng.randint(140000, 180000)
            if st["last_dot"] is None or (st["t"] - st["last_dot"]).days > 330:
                add_maint(truck, st["t"], "Inspection", "Annual DOT inspection (49 CFR 396.17)", 175, 260, 1, 3,
                          "Columbus, OH", st["odo"])
                st["last_dot"] = st["t"]
            if rng.random() < 0.3:
                k = rng.choice(["Coolant leak repaired, hoses replaced", "Clutch adjustment", "Exhaust aftertreatment (DPF) cleaning",
                                "Wheel seal replaced", "APU service", "Starter replaced", "Fifth wheel rebuild"])
                add_maint(truck, st["t"], "Repair", k, 380, 3200, 3, 12, "Columbus, OH", st["odo"])
            st["t"] += timedelta(hours=home_h)
            st["days_out_since"] = st["t"]
            if rng.random() < 0.25:  # fuel up at home terminal before leaving
                pass
            continue

        # ---- roadside repair occasionally
        if rng.random() < 0.075:
            kind = rng.choice([("Repair", "Air leak / brake chamber replaced", 350, 1200, 2, 6),
                               ("Repair", "Alternator replaced", 650, 1350, 3, 8),
                               ("Tire", "Roadside tire replacement (1 drive tire)", 650, 950, 2, 4),
                               ("Repair", "Turbo actuator / DEF sensor repair", 900, 4200, 6, 26),
                               ("Repair", "Trailer light harness repair", 150, 420, 1, 3)])
            add_maint(truck, st["t"], kind[0], kind[1], kind[2], kind[3], kind[4], kind[5],
                      f"{here[0]}, {here[1]}", st["odo"])
            st["t"] += timedelta(hours=rows["maint"][-1]["downtime_hours"])

        # ---- pick next lane (allow up to ~300 mi deadhead to reach an origin)
        cand = []
        for _, r in lanes.iterrows():
            if r.route_id not in lane_loads:
                continue
            dh = haversine(here_pt, city_pt(*r.o)) * 1.17
            if dh > 320:
                continue
            w = math.exp(-dh / 110) * (1.0 if r.typical_distance_miles < 1400 else 0.35)
            dest_home = haversine(city_pt(*r.d), HOME_PT)
            if days_out >= 4 and dest_home < 260:
                w *= 8
            if near_end and dest_home > 700:
                w *= 0.05
            cand.append((w, r, dh))
        if not cand:  # nothing nearby: head home
            st["days_out_since"] -= timedelta(days=20)
            continue
        w = np.array([c[0] for c in cand]); w = w / w.sum()
        _, lane, dh = cand[np.random.choice(len(cand), p=w)]
        dh = round(dh) if dh > 15 else 0
        o_pt, d_pt = city_pt(*lane.o), city_pt(*lane.d)

        if dh:
            tid = f"TR{trip_n[0]:06d}"; trip_n[0] += 1
            st["mpg_now"] = truck.baseline_mpg * rng.uniform(0.95, 1.06)
            odo0 = st["odo"]
            el = run_leg(truck, st, here_pt, o_pt, dh, st["t"], tid, "deadhead")
            rows["trips"].append(dict(trip_id=tid, load_id="", truck_id=truck.truck_id, driver_id=st["driver"],
                                      trailer_id=st["trailer"], trip_type="Deadhead",
                                      start_datetime=st["t"].strftime("%Y-%m-%d %H:%M"),
                                      end_datetime=(st["t"] + timedelta(hours=el)).strftime("%Y-%m-%d %H:%M"),
                                      origin=f"{here[0]}, {here[1]}", destination=f"{lane.o[0]}, {lane.o[1]}",
                                      miles=dh, odometer_start=int(odo0), odometer_end=int(st["odo"]),
                                      fuel_gallons_used=round(dh / st["mpg_now"], 1), mpg=round(st["mpg_now"], 2)))
            st["t"] += timedelta(hours=el)

        # ---- load economics from a sampled source load on this lane
        src = lane_loads[lane.route_id].sample(1, random_state=rng.randint(0, 10**6)).iloc[0]
        lh_rpm = src.revenue / lane.typical_distance_miles * market_mult(st["t"].date())
        miles = int(round(lane.typical_distance_miles * rng.uniform(1.0, 1.04)))
        linehaul = round(lh_rpm * lane.typical_distance_miles / 5) * 5
        booking = src.booking_type
        if booking == "Spot":
            b = rng.choices(BROKERS, weights=[5, 3, 2])[0]
            cust_id, bill_ref = b["id"], f"{b['id'][-1]}{rng.randint(400000, 499999)}"
        else:
            cust_id = rng.choice(dedicated) if booking == "Dedicated" else f"C{rng.randint(3, 12):03d}"
            bill_ref = f"PO{rng.randint(1000000, 9999999)}"
        ci = rng.randrange(len(COMMODITIES))
        load_id = f"IRN-{load_n[0]}"; load_n[0] += 1
        trip_id = f"TR{trip_n[0]:06d}"; trip_n[0] += 1

        # ---- pickup
        appt = next_window(st["t"] + timedelta(hours=rng.uniform(2, 18)))
        late = rng.random() > 0.93
        arrive = appt + (timedelta(minutes=rng.randint(30, 150)) if late else -timedelta(minutes=rng.randint(5, 75)))
        clock = max(arrive, appt)
        load_min = rng.randint(45, 115)
        extra = int(min(330, rng.expovariate(1 / 80))) if rng.random() < 0.24 else 0
        depart_pu = clock + timedelta(minutes=load_min + extra)
        det_pu = 0 if late else max(0, int((depart_pu - clock).total_seconds() // 60) - 120)
        # ---- transit + delivery
        el = drive_elapsed_hours(miles)
        del_appt = round30(depart_pu + timedelta(hours=el + rng.uniform(0.5, 4)))
        if del_appt.hour < 4 or del_appt.hour > 18:
            del_appt = (del_appt + timedelta(hours=(28 - del_appt.hour) % 24)).replace(minute=0) + \
                       timedelta(hours=rng.choice([2, 3, 4, 5]))
        late_d = rng.random() > 0.90
        arrive_d = del_appt + (timedelta(minutes=rng.randint(30, 240)) if late_d else
                               -timedelta(minutes=rng.randint(5, 90)))
        clock_d = max(arrive_d, del_appt)
        extra_d = int(min(360, rng.expovariate(1 / 85))) if rng.random() < 0.27 else 0
        depart_d = clock_d + timedelta(minutes=rng.randint(40, 110) + extra_d)
        det_d = 0 if late_d else max(0, int((depart_d - clock_d).total_seconds() // 60) - 120)
        lumper = rng.choice([125, 150, 175, 200, 250]) if rng.random() < 0.12 else 0

        st["mpg_now"] = truck.baseline_mpg * rng.uniform(0.94, 1.05) * (0.97 if st["t"].month in (12, 1, 2) else 1)
        st["t"] = depart_pu
        odo0 = st["odo"]
        run_leg(truck, st, o_pt, d_pt, miles, depart_pu, trip_id, "loaded")
        det_rate = 65 if cust_id.startswith("BRK") else 60
        det_total_min = det_pu + det_d
        det_hours = math.ceil(det_total_min / 15) * 0.25 if det_total_min else 0
        det_incurred = round(det_hours * det_rate, 2)
        det_billed = det_incurred if (det_incurred and rng.random() < 0.68) else 0.0
        fsc = round(fsc_per_mile(depart_pu.date()) * miles, 2)
        weight = int(src.weight_lbs) if src.weight_lbs > 8000 else int(rng.uniform(18000, 42000))
        rows["loads"].append(dict(load_id=load_id, source_load_id=src.load_id, customer_id=cust_id,
                                  customer_reference=bill_ref, booking_type=booking,
                                  origin=f"{lane.o[0]}, {lane.o[1]}", destination=f"{lane.d[0]}, {lane.d[1]}",
                                  source_route_id=lane.route_id, commodity=COMMODITIES[ci][0],
                                  freight_class=COMMODITIES[ci][1], weight_lbs=weight,
                                  pallets=rng.randint(14, 26), loaded_miles=miles, linehaul=linehaul,
                                  fuel_surcharge=fsc, detention_incurred=det_incurred, detention_billed=det_billed,
                                  lumper_reimbursed=lumper, total_billed=round(linehaul + fsc + det_billed + lumper, 2),
                                  linehaul_rate_per_mile=round(linehaul / miles, 3),
                                  pickup_date=appt.strftime("%Y-%m-%d"), delivery_date=depart_d.strftime("%Y-%m-%d"),
                                  status="Delivered"))
        for kind, a_, ar, dp, dt, fac_city, onf in [("Pickup", appt, arrive, depart_pu, det_pu, lane.o, not late),
                                                    ("Delivery", del_appt, arrive_d, depart_d, det_d, lane.d, not late_d)]:
            rows["stops"].append(dict(stop_id=f"S{stop_n[0]:06d}", load_id=load_id, trip_id=trip_id, stop_type=kind,
                                      city=fac_city[0], state=fac_city[1],
                                      appointment=a_.strftime("%Y-%m-%d %H:%M"), arrived=ar.strftime("%Y-%m-%d %H:%M"),
                                      departed=dp.strftime("%Y-%m-%d %H:%M"), on_time=onf, detention_minutes=dt))
            stop_n[0] += 1
        rows["trips"].append(dict(trip_id=trip_id, load_id=load_id, truck_id=truck.truck_id, driver_id=st["driver"],
                                  trailer_id=st["trailer"], trip_type="Loaded",
                                  start_datetime=depart_pu.strftime("%Y-%m-%d %H:%M"),
                                  end_datetime=arrive_d.strftime("%Y-%m-%d %H:%M"),
                                  origin=f"{lane.o[0]}, {lane.o[1]}", destination=f"{lane.d[0]}, {lane.d[1]}",
                                  miles=miles, odometer_start=int(odo0), odometer_end=int(st["odo"]),
                                  fuel_gallons_used=round(miles / st["mpg_now"], 1), mpg=round(st["mpg_now"], 2)))
        st["t"] = depart_d
        st["city"] = lane.d

loads = pd.DataFrame(rows["loads"])
# renumber loads chronologically (they were generated truck by truck)
loads = loads.sort_values(["pickup_date", "load_id"]).reset_index(drop=True)
remap = {old_id: f"IRN-{1000 + i}" for i, old_id in enumerate(loads.load_id)}
loads["load_id"] = loads.load_id.map(remap)
for tbl in ("trips", "stops"):
    for r in rows[tbl]:
        if r.get("load_id"):
            r["load_id"] = remap[r["load_id"]]

# ---------------------------------------------------------------- invoices & payments
inv = []
for i, l in loads.iterrows():
    d = datetime.strptime(l.delivery_date, "%Y-%m-%d").date()
    lag = rng.choices([1, rng.randint(2, 4), rng.randint(5, 12)], weights=[70, 22, 8])[0]
    inv_date = d + timedelta(days=lag)
    if inv_date > HISTORY_END:
        inv_date = HISTORY_END
    c = cust.set_index("customer_id").loc[l.customer_id]
    terms = int(c.credit_terms_days)
    due = inv_date + timedelta(days=terms)
    amount = l.total_billed
    qp = False
    if l.customer_id.startswith("BRK") and rng.random() < 0.18:
        qp = True
        pct = next(b for b in BROKERS if b["id"] == l.customer_id)["quick_pay_pct"]
        paid = inv_date + timedelta(days=rng.randint(1, 3))
        paid_amt = round(amount * (1 - pct / 100), 2)
    else:
        late = slow_payers.get(l.customer_id, 3)
        paid = due + timedelta(days=int(rng.gauss(late, 6)))
        paid_amt = amount if rng.random() > 0.03 else round(amount - rng.choice([75, 150, 250, 400]), 2)
    if paid > AS_OF:
        paid, paid_amt = None, None
    inv.append(dict(invoice_id=f"INV-{2400 + i}", load_id=l.load_id, customer_id=l.customer_id,
                    invoice_date=inv_date.isoformat(), terms_days=terms, due_date=due.isoformat(),
                    amount=amount, quick_pay=qp, paid_date=paid.isoformat() if paid else "",
                    amount_paid=paid_amt if paid_amt is not None else "",
                    short_paid=round(amount - paid_amt, 2) if paid_amt is not None and not qp else 0.0,
                    status="Paid" if paid else "Open"))
invoices = pd.DataFrame(inv)

# Planted: Summit Lane invoice from 9/19 still unpaid (41 days old, 11 days past due on Net 30)
cands = loads[(loads.delivery_date >= "2026-09-14") & (loads.delivery_date <= "2026-09-18")].index
pi = cands[0]
loads.loc[pi, "customer_id"] = "BRK002"
loads.loc[pi, "booking_type"] = "Spot"
loads.loc[pi, "customer_reference"] = "2" + str(rng.randint(400000, 499999))
invoices.loc[pi, ["customer_id", "invoice_date", "terms_days", "due_date", "quick_pay", "paid_date", "amount_paid",
                  "short_paid", "status"]] = ["BRK002", "2026-09-19", 30, "2026-10-19", False, "", "", 0.0, "Open"]
invoices = invoices.sort_values(["invoice_date", "load_id"]).reset_index(drop=True)
invoices["invoice_id"] = [f"INV-{2400 + i}" for i in range(len(invoices))]
PLANTED_AGING = invoices[invoices.load_id == loads.loc[pi, "load_id"]].invoice_id.iloc[0]

# ---------------------------------------------------------------- write
trucks.to_csv(f"{OUT}/trucks.csv", index=False)
drivers.to_csv(f"{OUT}/drivers.csv", index=False)
trailers.to_csv(f"{OUT}/trailers.csv", index=False)
cust.to_csv(f"{OUT}/customers.csv", index=False)
loads.to_csv(f"{OUT}/loads.csv", index=False)
pd.DataFrame(rows["trips"]).to_csv(f"{OUT}/trips.csv", index=False)
pd.DataFrame(rows["stops"]).to_csv(f"{OUT}/stop_events.csv", index=False)
pd.DataFrame(rows["fuel"]).to_csv(f"{OUT}/fuel_purchases.csv", index=False)
ifta = pd.DataFrame(rows["ifta"]).groupby(["truck_id", "month", "state"], as_index=False).miles.sum()
ifta["miles"] = ifta.miles.round(1)
ifta.to_csv(f"{OUT}/ifta_state_miles.csv", index=False)
pd.DataFrame(rows["maint"]).to_csv(f"{OUT}/maintenance_records.csv", index=False)
invoices.to_csv(f"{OUT}/invoices.csv", index=False)
lanes[["route_id", "origin_city", "origin_state", "destination_city", "destination_state",
       "typical_distance_miles"]].to_csv(f"{OUT}/lanes.csv", index=False)

# end-of-history state for the document generator
end_state = pd.DataFrame([dict(truck_id=t.truck_id,
                               odometer=int(pd.DataFrame(rows["trips"]).query("truck_id==@t.truck_id").odometer_end.max()))
                          for _, t in trucks.iterrows()])
end_state.to_csv(f"{OUT}/_end_state.csv", index=False)
print("planted aging invoice:", PLANTED_AGING, loads.loc[pi, "load_id"])
print({k: len(v) for k, v in rows.items()})
