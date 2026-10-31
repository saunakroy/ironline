"""Generate the demo-week inbox (Mon 10/26 - Fri 10/30/2026) for Ironline Freight:
messy source documents (rate con PDFs, load tender emails, BOL/POD phone photos,
fuel and lumper receipts, a DVIR, invoice drafts, driver texts, owner notes)
plus an answer key with the ground-truth records and planted problems.

Usage: python3 build_docs.py <history dir> <output root>
"""
import sys, os, json, math, random
from datetime import datetime, timedelta
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import numpy as np
import pandas as pd
from common import *

HIST, ROOT = sys.argv[1], sys.argv[2]
INBOX = os.path.join(ROOT, "inbox")
KEY = os.path.join(ROOT, "answer_key")
os.makedirs(KEY, exist_ok=True)
rng = random.Random(1031)
np.random.seed(1031)

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
def F(name, size):
    return ImageFont.truetype(FONT_DIR + name, size)
SANS, BOLD, MONO, MONOB, OBL = "DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "DejaVuSansMono.ttf", \
    "DejaVuSansMono-Bold.ttf", "DejaVuSans-Oblique.ttf"
INK = (28, 45, 140)

hist_trucks = pd.read_csv(f"{HIST}/trucks.csv").set_index("truck_id")
hist_drivers = pd.read_csv(f"{HIST}/drivers.csv").set_index("driver_id")
end_odo = pd.read_csv(f"{HIST}/_end_state.csv").set_index("truck_id").odometer.to_dict()
hist_cust = pd.read_csv(f"{HIST}/customers.csv").set_index("customer_id")
next_load = int(pd.read_csv(f"{HIST}/loads.csv").load_id.str[4:].astype(int).max()) + 1
next_inv = int(pd.read_csv(f"{HIST}/invoices.csv").invoice_id.str[4:].astype(int).max()) + 1
BRK = {b["id"]: b for b in BROKERS}
OWNER = "Dave Kessler"
FSC = fsc_per_mile(datetime(2026, 10, 26).date())  # (6.50 - 1.25) / 6 = 0.875

def dt(s):
    return datetime.strptime(s, "%Y-%m-%d %H:%M")

def money(x):
    return f"${x:,.2f}"

# =============================================================== scenario
L = {}
def add_load(key, **kw):
    kw["load_id"] = f"IRN-{next_load + len(L)}"
    kw["fuel_surcharge"] = round(kw["miles"] * FSC, 2)
    if kw.get("contract_rpm"):
        kw["linehaul"] = round(kw["contract_rpm"] * kw["miles"], 2)
    kw["rate_total"] = round(kw["linehaul"] + kw["fuel_surcharge"], 2)
    L[key] = kw

add_load("L1", truck="T101", driver="D01", bill_to="BRK001", broker_ref="RFL-482317", miles=482,
         linehaul=1150.00, commodity="Housewares", weight=31840, pallets=20, pieces=1240,
         shipper=("Great Lakes Housewares DC", "4900 Alum Creek Dr", "Obetz, OH 43207"),
         consignee=("Liberty Home Supply DC", "2700 Red Lion Rd", "Philadelphia, PA 19114"),
         pu_appt="2026-10-26 07:30", pu_in="2026-10-26 07:40", pu_out="2026-10-26 12:10",
         del_appt="2026-10-27 06:00", del_in="2026-10-27 05:35", del_out="2026-10-27 07:10",
         bol="GLH-7718204", seal="0044817", receiver_sig="M. Russo", pod_exception=None, pod_uploaded=True)
add_load("L2", truck="T101", driver="D01", bill_to="BRK003", broker_ref="CLP-226905", miles=676,
         linehaul=1700.00, commodity="Packaged dry foods", weight=40120, pallets=24, pieces=1920,
         shipper=("Delaware Valley Foods", "7400 State Rd", "Philadelphia, PA 19136"),
         consignee=("Crossroads Grocery DC", "5900 W Raymond St", "Indianapolis, IN 46241"),
         pu_appt="2026-10-27 10:00", pu_in="2026-10-27 09:20", pu_out="2026-10-27 11:05",
         del_appt="2026-10-28 08:00", del_in="2026-10-28 07:25", del_out="2026-10-28 09:35",
         bol="DVF-0938812", seal="2290431", receiver_sig="T. Okafor", pod_exception=None, pod_uploaded=True,
         lumper=175.00)
add_load("L3", truck="T102", driver="D02", bill_to="C001", broker_ref="PO 4410-88213", miles=718,
         contract_rpm=2.30, commodity="Paper products", weight=36500, pallets=22, pieces=880,
         shipper=("Buckeye Paper Products", "1850 Williams Rd", "Columbus, OH 43207"),
         consignee=("Blue Valley Office Products", "1800 Universal Ave", "Kansas City, MO 64120"),
         pu_appt="2026-10-26 14:00", pu_in="2026-10-26 13:35", pu_out="2026-10-26 15:20",
         del_appt="2026-10-27 13:00", del_in="2026-10-27 12:40", del_out="2026-10-27 14:05",
         bol="BPP-221093", seal="5518370", receiver_sig="J. Alvarez", pod_exception=None, pod_uploaded=False)
add_load("L4", truck="T102", driver="D02", bill_to="BRK002", broker_ref="SLL-2457710", miles=524,
         linehaul=1250.00, commodity="Hardware / tools", weight=38400, pallets=22, pieces=22,
         shipper=("Heartland Mills Distribution", "3200 Gardner Ave", "Kansas City, MO 64120"),
         consignee=("Hoosier Hardware Supply DC", "2200 S Holt Rd", "Indianapolis, IN 46241"),
         pu_appt="2026-10-28 07:00", pu_in="2026-10-28 06:40", pu_out="2026-10-28 08:15",
         del_appt="2026-10-29 06:00", del_in="2026-10-29 05:45", del_out="2026-10-29 07:30",
         bol="HMD-55120-7", seal="7730125", receiver_sig="K. Brandt", pod_exception="SHORT 1 PLT - rec'd 21 of 22",
         pod_uploaded=True)
add_load("L5", truck="T103", driver="D03", bill_to="BRK001", broker_ref="RFL-482355", miles=726,
         linehaul=1680.00, commodity="Pet food", weight=42150, pallets=26, pieces=2080,
         shipper=("Westbelt Consumer Products", "3800 Westbelt Dr", "Columbus, OH 43228"),
         consignee=("North Star Retail DC", "600 Industrial Blvd NE", "Minneapolis, MN 55413"),
         pu_appt="2026-10-26 09:00", pu_in="2026-10-26 08:30", pu_out="2026-10-26 10:15",
         del_appt="2026-10-27 08:00", del_in="2026-10-27 07:40", del_out="2026-10-27 09:05",
         bol="WCP-0661204", seal="1182906", receiver_sig="A. Lindqvist", pod_exception=None, pod_uploaded=True,
         quoted_linehaul=1380.00)
add_load("L6", truck="T103", driver="D03", bill_to="BRK003", broker_ref="CLP-227118", miles=1058,
         linehaul=2420.00, commodity="Corrugated packaging", weight=24600, pallets=26, pieces=26,
         shipper=("Twin Cities Box Co", "2100 Kennedy St NE", "Minneapolis, MN 55413"),
         consignee=("Peachtree Distribution Center", "4500 Fulton Industrial Blvd SW", "Atlanta, GA 30336"),
         pu_appt="2026-10-28 08:00", pu_in="2026-10-28 07:45", pu_out="2026-10-28 09:20",
         del_appt="2026-10-30 07:00", del_in="2026-10-30 06:30", del_out="2026-10-30 08:10",
         bol="TCB-339021", seal="6604413", receiver_sig="D. Holloway", pod_exception=None, pod_uploaded=True)
add_load("L7", truck="T104", driver="D04", bill_to="C002", broker_ref="SVF-ORD-77104", miles=2281,
         contract_rpm=2.05, commodity="Packaged dry foods", weight=41300, pallets=24, pieces=1680,
         shipper=("Scioto Valley Foods", "2900 Rohr Rd", "Groveport, OH 43125"),
         consignee=("Pacific Gateway Distribution", "1600 S Mateo St", "Los Angeles, CA 90021"),
         pu_appt="2026-10-26 10:00", pu_in="2026-10-26 09:40", pu_out="2026-10-26 11:30",
         del_appt="2026-10-30 08:00", del_in="2026-10-30 07:20", del_out="2026-10-30 09:15",
         bol="SVF-1104887", seal="3391760", receiver_sig="R. Navarro", pod_exception=None, pod_uploaded=True)

# detention for L1 (2 hrs free from the later of check-in and appointment; $65/hr)
l1 = L["L1"]
clock = max(dt(l1["pu_in"]), dt(l1["pu_appt"]))
l1_det_min = int((dt(l1["pu_out"]) - clock).total_seconds() // 60) - 120   # 150
l1_det_amt = round(l1_det_min / 60 * 65, 2)                                    # 162.50

# fuel purchases (one row per receipt). price = Oct-2026 index x state factor x small noise
def price(state, noise):
    return round(DIESEL_INDEX["2026-10"] * STATE_FUEL_FACTOR[state] * noise, 3)

FUEL = [
    # truck card_truck unit_typed time city state station gallons noise def_gal
    ("T101", "T101", "101", "2026-10-26 05:55", "Columbus", "OH", "Crossroads Travel Center #118", 168.4, 1.004, 0),
    ("T103", "T103", "103", "2026-10-26 17:48", "Gary", "IN", "Big Iron Fuel Stop #22", 141.7, 1.010, 6.2),
    ("T104", "T104", "104", "2026-10-26 06:30", "Columbus", "OH", "Crossroads Travel Center #118", 176.9, 1.004, 0),
    ("T102", "T102", "102", "2026-10-27 09:55", "Kingdom City", "MO", "Prairie Star Truck Plaza", 96.3, 0.992, 0),
    ("T104", "T104", "104", "2026-10-27 12:35", "Joplin", "MO", "Prairie Star Truck Plaza #4", 121.8, 0.998, 7.5),
    ("T101", "T101", "101", "2026-10-27 14:22", "Carlisle", "PA", "Keystone Truck Stop", 148.2, 1.006, 0),
    ("T102", "T102", "102", "2026-10-28 06:10", "Kansas City", "MO", "Big Iron Fuel Stop #31", 104.6, 1.003, 5.1),
    ("T104", "T102", "104", "2026-10-28 09:20", "Amarillo", "TX", "Lone Mesa Travel Plaza", 128.9, 1.006, 0),   # card anomaly
    ("T103", "T103", "103", "2026-10-28 22:50", "Whiteland", "IN", "Crossroads Travel Center #64", 186.3, 0.995, 8.0),
    ("T104", "T104", "104", "2026-10-29 06:45", "Flagstaff", "AZ", "Ponderosa Fuel & Diner", 117.4, 1.012, 0),
    ("T104", "T104", "104", "2026-10-29 13:40", "Barstow", "CA", "Desert Rose Truck Stop", 64.2, 1.006, 0),
    ("T102", "T102", "102", "2026-10-29 09:40", "Whiteland", "IN", "Crossroads Travel Center #64", 88.5, 0.999, 0),
]
odo = dict(end_odo)
fuel_rows = []
leg_miles_before = {  # miles driven since history end to each receipt (approximate, for odometer prompt)
    ("T101", "2026-10-26 05:55"): 4, ("T103", "2026-10-26 17:48"): 318, ("T104", "2026-10-26 06:30"): 6,
    ("T102", "2026-10-27 09:55"): 412, ("T104", "2026-10-27 12:35"): 763, ("T101", "2026-10-27 14:22"): 618,
    ("T102", "2026-10-28 06:10"): 726, ("T104", "2026-10-28 09:20"): 1281, ("T103", "2026-10-28 22:50"): 1311,
    ("T104", "2026-10-29 06:45"): 1880, ("T104", "2026-10-29 13:40"): 2160, ("T102", "2026-10-29 09:40"): 1262,
}
for i, (tk, card_tk, unit, t, city, stt, station, gal, noise, defg) in enumerate(FUEL):
    p = price(stt, noise)
    defp = 4.19 if defg else 0
    fuel_rows.append(dict(receipt_no=f"{rng.randint(100000, 999999)}", truck_id=tk,
                          card=hist_trucks.loc[card_tk, "fuel_card"], card_assigned_truck=card_tk, unit_entered=unit,
                          datetime=t, city=city, state=stt, station=station, gallons=gal, price_per_gallon=p,
                          fuel_total=round(gal * p, 2), def_gallons=defg, def_price=defp,
                          def_total=round(defg * defp, 2),
                          odometer=int(end_odo[tk] + leg_miles_before[(tk, t)]),
                          driver_id={"T101": "D01", "T102": "D02", "T103": "D03", "T104": "D04"}[tk]))
for r in fuel_rows:
    r["total"] = round(r["fuel_total"] + r["def_total"], 2)

# =============================================================== image helpers
def hsh(x):
    return sum((i + 1) * ord(c) for i, c in enumerate(str(x)))


def photoize(img, path, angle=None, crop_jitter=True, dark=0.0, seed=None):
    """Make a clean render look like a phone photo of paper on a desk."""
    r = random.Random(seed or rng.random())
    w, h = img.size
    bg = Image.new("RGB", (int(w * 1.18), int(h * 1.14)), (r.randint(70, 110), r.randint(60, 90), r.randint(45, 70)))
    ang = angle if angle is not None else r.uniform(-3.2, 3.2)
    paper = img.convert("RGBA").rotate(ang, expand=True, resample=Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    shadow = Image.new("RGBA", paper.size, (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 110), mask=paper.split()[3])
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    ox, oy = (bg.width - paper.width) // 2 + r.randint(-25, 25), (bg.height - paper.height) // 2 + r.randint(-20, 20)
    bg.paste(shadow, (ox + 14, oy + 18), shadow)
    bg.paste(paper, (ox, oy), paper)
    arr = np.asarray(bg).astype(np.float32)
    yy, xx = np.mgrid[0:arr.shape[0], 0:arr.shape[1]]
    grad = 1.0 - dark - 0.22 * (xx / arr.shape[1]) * r.uniform(0.5, 1.2) - 0.10 * (yy / arr.shape[0])
    arr = arr * grad[..., None] + np.random.normal(0, 5.5, arr.shape)
    out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    if crop_jitter:
        cx, cy = r.randint(0, 40), r.randint(0, 40)
        out = out.crop((cx, cy, out.width - r.randint(0, 40), out.height - r.randint(0, 40)))
    out = out.resize((int(out.width * 0.62), int(out.height * 0.62)), Image.LANCZOS)
    out.save(path, "JPEG", quality=r.randint(68, 80))


def hand(draw, xy, text, size=34, color=INK, seed=None):
    """Handwriting-ish: oblique font with per-character jitter."""
    r = random.Random(seed if seed is not None else text)
    x, y = xy
    for ch in text:
        f = F(OBL, int(size * r.uniform(0.92, 1.08)))
        draw.text((x, y + r.uniform(-3, 3)), ch, font=f, fill=color)
        x += draw.textlength(ch, font=f) * r.uniform(0.95, 1.08)
    return x


def signature(draw, x, y, w=260, seed=0, color=INK):
    r = random.Random(seed)
    pts = []
    for i in range(40):
        t = i / 39
        pts.append((x + t * w + r.uniform(-6, 6), y + 22 * math.sin(t * r.uniform(9, 15)) + r.uniform(-8, 8)))
    draw.line(pts, fill=color, width=3, joint="curve")
    draw.line([(x + 10, y + 30), (x + w * 0.8, y + 18)], fill=color, width=2)


def box(d, x, y, w, h, label=None, lf=None, width=2):
    d.rectangle([x, y, x + w, y + h], outline=(20, 20, 20), width=width)
    if label:
        d.text((x + 8, y + 5), label, font=lf or F(BOLD, 18), fill=(20, 20, 20))


# =============================================================== BOL / POD
def render_bol(load, pod=False):
    W, H = 1700, 2200
    im = Image.new("RGB", (W, H), (250, 249, 244))
    d = ImageDraw.Draw(im)
    d.text((60, 50), "STRAIGHT BILL OF LADING - SHORT FORM", font=F(BOLD, 40), fill=(10, 10, 10))
    d.text((60, 102), "ORIGINAL - NOT NEGOTIABLE", font=F(SANS, 22), fill=(10, 10, 10))
    box(d, 1100, 40, 540, 110, "BILL OF LADING NO.")
    d.text((1120, 82), load["bol"], font=F(MONOB, 40), fill=(10, 10, 10))
    # shipper / consignee / carrier
    y = 180
    for label, ent in [("SHIP FROM", load["shipper"]), ("SHIP TO", load["consignee"])]:
        box(d, 60, y, 800, 190, label)
        for j, line in enumerate(ent):
            d.text((80, y + 45 + j * 40), line, font=F(SANS, 30), fill=(10, 10, 10))
        y += 210
    box(d, 880, 180, 760, 400, "CARRIER")
    d.text((900, 225), CARRIER["name"], font=F(SANS, 30), fill=(10, 10, 10))
    d.text((900, 265), f"{CARRIER['mc']}   {CARRIER['usdot']}", font=F(SANS, 26), fill=(10, 10, 10))
    d.text((900, 320), "Trailer #:", font=F(SANS, 26), fill=(10, 10, 10))
    hand(d, (1040, 315), "V530" + load["truck"][-1], 34)
    d.text((900, 370), "Seal #:", font=F(SANS, 26), fill=(10, 10, 10))
    hand(d, (1010, 365), load["seal"], 34)
    d.text((900, 420), "Truck #:", font=F(SANS, 26), fill=(10, 10, 10))
    hand(d, (1020, 415), load["truck"][1:], 34)
    d.text((900, 470), "Customer ref / PO:", font=F(SANS, 26), fill=(10, 10, 10))
    d.text((900, 510), load["broker_ref"], font=F(MONO, 30), fill=(10, 10, 10))
    # freight table
    y = 610
    cols = [("HANDLING UNITS", 60, 230), ("TYPE", 290, 130), ("PIECES", 420, 150), ("DESCRIPTION OF ARTICLES", 570, 620),
            ("NMFC / CLASS", 1190, 200), ("WEIGHT (LBS)", 1390, 250)]
    for name, x, w in cols:
        box(d, x, y, w, 60)
        d.text((x + 8, y + 18), name, font=F(BOLD, 19), fill=(10, 10, 10))
    vals = [str(load["pallets"]), "PLT", f"{load['pieces']:,}", load["commodity"].upper(),
            f"{rng.randint(10000, 99999)} / {dict(COMMODITIES).get(load['commodity'], 55)}", f"{load['weight']:,}"]
    for (name, x, w), v in zip(cols, vals):
        box(d, x, y + 60, w, 90)
        d.text((x + 10, y + 90), v, font=F(SANS, 28), fill=(10, 10, 10))
    box(d, 60, y + 150, 1580, 70)
    d.text((80, y + 172), f"TOTAL:  {load['pallets']} PLT    {load['weight']:,} LBS", font=F(BOLD, 26), fill=(10, 10, 10))
    d.text((60, y + 250), "Freight charges are PREPAID unless marked collect.  Third party bill to: "
           + (BRK[load["bill_to"]]["name"] if load["bill_to"].startswith("BRK") else hist_cust.loc[load["bill_to"], "customer_name"]),
           font=F(SANS, 22), fill=(10, 10, 10))
    # shipper section with in/out times
    y = 1000
    box(d, 60, y, 780, 330, "SHIPPER SIGNATURE / DATE")
    signature(d, 100, y + 90, 300, seed=hsh(load["bol"]) % 1000, color=(20, 20, 20))
    hand(d, (100, y + 170), dt(load["pu_out"]).strftime("%m/%d/%y"), 32, (20, 20, 20))
    d.text((80, y + 230), "Time in:", font=F(SANS, 26), fill=(10, 10, 10))
    hand(d, (200, y + 225), dt(load["pu_in"]).strftime("%H:%M"), 34)
    d.text((380, y + 230), "Time out:", font=F(SANS, 26), fill=(10, 10, 10))
    hand(d, (510, y + 225), dt(load["pu_out"]).strftime("%H:%M"), 34)
    box(d, 860, y, 780, 330, "CARRIER SIGNATURE / PICKUP DATE")
    drv = hist_drivers.loc[load["driver"]]
    signature(d, 900, y + 90, 280, seed=hsh(drv.last_name) % 1000)
    hand(d, (900, y + 170), f"{drv.first_name[0]}. {drv.last_name}  {dt(load['pu_out']).strftime('%m/%d/%y')}", 32)
    d.text((880, y + 240), "Driver acknowledges receipt of packages, apparent good order.", font=F(SANS, 20),
           fill=(10, 10, 10))
    # consignee / delivery section
    y = 1370
    box(d, 60, y, 1580, 420, "CONSIGNEE - RECEIVED SUBJECT TO EXCEPTIONS NOTED")
    d.text((80, y + 60), "Received by (print):", font=F(SANS, 26), fill=(10, 10, 10))
    d.text((80, y + 140), "Signature:", font=F(SANS, 26), fill=(10, 10, 10))
    d.text((80, y + 220), "Date / time in:", font=F(SANS, 26), fill=(10, 10, 10))
    d.text((800, y + 220), "Time out:", font=F(SANS, 26), fill=(10, 10, 10))
    d.text((80, y + 300), "Exceptions (OS&D):", font=F(SANS, 26), fill=(10, 10, 10))
    if pod:
        hand(d, (380, y + 52), load["receiver_sig"], 36)
        signature(d, 260, y + 140, 320, seed=hsh(load["receiver_sig"]) % 1000)
        hand(d, (300, y + 212), dt(load["del_in"]).strftime("%m/%d/%y  %H:%M"), 34)
        hand(d, (940, y + 212), dt(load["del_out"]).strftime("%H:%M"), 34)
        if load["pod_exception"]:
            hand(d, (340, y + 292), load["pod_exception"], 38, (170, 20, 20))
        else:
            hand(d, (340, y + 292), "none", 34)
        # receiving stamp
        st = Image.new("RGBA", (520, 200), (0, 0, 0, 0))
        sd = ImageDraw.Draw(st)
        sd.rectangle([5, 5, 515, 195], outline=(185, 30, 40, 200), width=7)
        sd.text((40, 25), "RECEIVED", font=F(BOLD, 64), fill=(185, 30, 40, 200))
        sd.text((40, 110), dt(load["del_in"]).strftime("%b %d %Y").upper() + "  DOCK " + str(rng.randint(3, 40)),
                font=F(BOLD, 34), fill=(185, 30, 40, 200))
        st = st.rotate(rng.uniform(-14, -6), expand=True)
        im.paste(st, (1050, y + 30), st)
    d.text((60, 1830), "This is to certify that the above named materials are properly classified, packaged, marked "
           "and labeled, and are in proper condition for transportation.", font=F(SANS, 18), fill=(40, 40, 40))
    d.text((60, 2120), "Uniform Straight Bill of Lading  |  Page 1 of 1  |  " +
           ("CONSIGNEE COPY" if pod else "CARRIER COPY"), font=F(SANS, 18), fill=(60, 60, 60))
    return im


# =============================================================== receipts
def render_fuel_receipt(r, variant=0):
    lines = [
        ("C", r["station"].upper(), True), ("C", f"{r['city'].upper()}, {r['state']}", False),
        ("C", "STORE #" + r["station"].split("#")[-1] if "#" in r["station"] else "TRUCK FUELING", False), ("", "", False),
        ("L", f"DATE {dt(r['datetime']).strftime('%m/%d/%y')}   TIME {dt(r['datetime']).strftime('%H:%M')}", False),
        ("L", f"RECEIPT  {r['receipt_no']}", False), ("L", f"PUMP {rng.randint(3, 18):02d}   DIESEL LANE", False), ("", "", False),
        ("L", f"FLEET CARD   ************{r['card'][-4:]}", False), ("L", f"UNIT #       {r['unit_entered']}", False),
        ("L", f"ODOMETER     {r['odometer']:,}", False), ("", "", False),
        ("L", "PRODUCT        GAL     PPG      AMT", True),
        ("L", f"DSL #2 ULSD {r['gallons']:7.1f} {r['price_per_gallon']:7.3f} {r['fuel_total']:8.2f}", False),
    ]
    if r["def_gallons"]:
        lines.append(("L", f"DEF BULK    {r['def_gallons']:7.1f} {r['def_price']:7.3f} {r['def_total']:8.2f}", False))
    lines += [("", "", False), ("L", f"TOTAL                       {r['total']:8.2f}", True),
              ("L", "PAYMENT      FLEET CARD", False), ("L", "AUTH #       " + str(rng.randint(100000, 999999)), False),
              ("", "", False), ("C", "SIGNATURE ON FILE", False), ("C", "THANK YOU - DRIVE SAFE", False)]
    W, lh = 640, 40
    H = 80 + lh * len(lines) + 60
    im = Image.new("RGB", (W, H), (246, 244, 236))
    d = ImageDraw.Draw(im)
    y = 50
    for al, txt, b in lines:
        f = F(MONOB if b else MONO, 23)
        x = (W - d.textlength(txt, font=f)) / 2 if al == "C" else 34
        d.text((x, y), txt, font=f, fill=(35, 35, 40))
        y += lh
    # faded thermal streaks
    arr = np.asarray(im).astype(np.float32)
    for _ in range(2):
        c, w = rng.randint(0, W - 40), rng.randint(10, 26)
        arr[:, c:c + w] = arr[:, c:c + w] * 0.78 + 255 * 0.22   # faded thermal band, still legible
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    return im


def render_lumper(load, amount, when):
    W, H = 900, 1150
    im = Image.new("RGB", (W, H), (252, 250, 240))
    d = ImageDraw.Draw(im)
    d.text((50, 40), "PROLOAD UNLOADING SERVICES", font=F(BOLD, 34), fill=(15, 15, 15))
    d.text((50, 90), "Third-party unloading - Crossroads Grocery DC", font=F(SANS, 22), fill=(15, 15, 15))
    d.text((50, 125), "5900 W Raymond St, Indianapolis, IN 46241", font=F(SANS, 22), fill=(15, 15, 15))
    d.line([(50, 170), (850, 170)], fill=(15, 15, 15), width=2)
    rows = [("Receipt #", f"PL-{rng.randint(300000, 399999)}"), ("Date", when.strftime("%m/%d/%Y")),
            ("Carrier", CARRIER["name"]), ("Truck / Trailer", f"{load['truck'][1:]} / V530{load['truck'][-1]}"),
            ("PO / Ref", load["broker_ref"]), ("BOL #", load["bol"]), ("Pallets", str(load["pallets"])),
            ("Service", "Floor unload / restack"), ("Payment", "Fleet check #50-2231-0098")]
    y = 200
    for k, v in rows:
        d.text((60, y), k + ":", font=F(BOLD, 26), fill=(15, 15, 15))
        d.text((380, y), v, font=F(SANS, 26), fill=(15, 15, 15))
        y += 62
    d.rectangle([50, y + 20, 850, y + 120], outline=(15, 15, 15), width=3)
    d.text((70, y + 45), "AMOUNT PAID", font=F(BOLD, 34), fill=(15, 15, 15))
    d.text((560, y + 45), money(amount), font=F(BOLD, 40), fill=(15, 15, 15))
    d.text((60, y + 160), "Driver signature:", font=F(SANS, 24), fill=(15, 15, 15))
    signature(d, 300, y + 160, 260, seed=11)
    d.text((60, H - 70), "Keep this receipt for reimbursement. No refunds.", font=F(OBL, 20), fill=(60, 60, 60))
    return im


def render_dvir(truck, driver, when, odo_val, defects, certified):
    W, H = 1700, 2200
    im = Image.new("RGB", (W, H), (251, 250, 246))
    d = ImageDraw.Draw(im)
    d.text((60, 50), "DRIVER'S VEHICLE INSPECTION REPORT", font=F(BOLD, 44), fill=(10, 10, 10))
    d.text((60, 108), "Completion of this report required by federal law, 49 CFR 396.11 & 396.13", font=F(SANS, 22),
           fill=(10, 10, 10))
    d.text((60, 150), CARRIER["name"] + "  -  " + CARRIER["address"], font=F(SANS, 22), fill=(10, 10, 10))
    fields = [("Truck/Tractor No.", truck[1:]), ("Trailer No.", "V530" + truck[-1]), ("Date", when.strftime("%m/%d/%y")),
              ("Mileage (no tenths)", f"{odo_val:,}"), ("Location", "Kansas City, MO"), ("Pre-trip / Post-trip", "POST")]
    x, y = 60, 210
    for i, (k, v) in enumerate(fields):
        bx, by = 60 + (i % 3) * 540, 210 + (i // 3) * 120
        box(d, bx, by, 520, 105, k)
        hand(d, (bx + 20, by + 45), v, 36)
    items = ["Air Compressor", "Air Lines", "Battery", "Brake Accessories", "Brakes, Parking", "Brakes, Service",
             "Clutch", "Coupling Devices", "Defroster/Heater", "Drive Line", "Engine", "Exhaust", "Fifth Wheel",
             "Frame and Assembly", "Front Axle", "Fuel Tanks", "Horn", "Lights - Head/Tail/Stop/Turn/Marker",
             "Mirrors", "Muffler", "Oil Pressure", "Radiator", "Rear End", "Reflectors", "Safety Equipment",
             "Springs", "Starter", "Steering", "Tires", "Wheels and Rims", "Windows", "Windshield Wipers",
             "Trailer: Doors", "Trailer: Hitch", "Trailer: Landing Gear", "Trailer: Mud Flaps", "Trailer: Lights"]
    y0 = 500
    d.text((60, y0 - 40), "Check any defective item and give details under REMARKS", font=F(BOLD, 24), fill=(10, 10, 10))
    flagged = {"Lights - Head/Tail/Stop/Turn/Marker", "Trailer: Mud Flaps"}
    for i, it in enumerate(items):
        cx, cy = 60 + (i // 13) * 540, y0 + (i % 13) * 52
        d.rectangle([cx, cy, cx + 30, cy + 30], outline=(10, 10, 10), width=2)
        d.text((cx + 45, cy + 2), it, font=F(SANS, 22), fill=(10, 10, 10))
        if it in flagged:
            hand(d, (cx + 2, cy - 8), "X", 38)
    y = 1180
    box(d, 60, y, 1580, 260, "REMARKS")
    for j, line in enumerate(defects):
        hand(d, (90, y + 55 + j * 60), line, 34)
    y = 1470
    d.rectangle([60, y, 90, y + 30], outline=(10, 10, 10), width=2)
    d.text((105, y), "CONDITION OF THE ABOVE VEHICLE IS SATISFACTORY", font=F(SANS, 24), fill=(10, 10, 10))
    box(d, 60, y + 60, 780, 160, "DRIVER'S SIGNATURE")
    signature(d, 100, y + 140, 280, seed=hsh(driver) % 999)
    hand(d, (450, y + 135), when.strftime("%m/%d/%y %H:%M"), 30)
    y = 1740
    d.rectangle([60, y, 90, y + 30], outline=(10, 10, 10), width=2)
    d.text((105, y), "ABOVE DEFECTS CORRECTED", font=F(SANS, 24), fill=(10, 10, 10))
    d.rectangle([60, y + 50, 90, y + 80], outline=(10, 10, 10), width=2)
    d.text((105, y + 50), "ABOVE DEFECTS NEED NOT BE CORRECTED FOR SAFE OPERATION OF VEHICLE", font=F(SANS, 24),
           fill=(10, 10, 10))
    box(d, 60, y + 110, 780, 150, "MECHANIC'S SIGNATURE / DATE")
    box(d, 860, y + 110, 780, 150, "DRIVER'S SIGNATURE (REVIEWING) / DATE")
    if certified:
        hand(d, (64, y - 6), "X", 38)
    return im


# =============================================================== PDFs / DOCX
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch


def ratecon_pdf(path, load):
    b = BRK[load["bill_to"]]
    c = canvas.Canvas(path, pagesize=letter)
    W, H = letter
    c.setFillColorRGB(0.12, 0.2, 0.33); c.rect(0, H - 1.0 * inch, W, 1.0 * inch, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1); c.setFont("Helvetica-Bold", 20); c.drawString(0.5 * inch, H - 0.55 * inch, b["name"].upper())
    c.setFont("Helvetica", 9); c.drawString(0.5 * inch, H - 0.8 * inch, f"{b['address']}  |  {b['phone']}  |  {b['mc']}")
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 15); c.drawString(0.5 * inch, H - 1.35 * inch, "CARRIER RATE CONFIRMATION")
    c.setFont("Helvetica", 10)
    c.drawRightString(W - 0.5 * inch, H - 1.3 * inch, f"Load #: {load['broker_ref']}")
    pu = dt(load["pu_appt"])
    issued = (pu - timedelta(days=1 if pu.weekday() else 3)).replace(hour=13 + len(load["broker_ref"]) % 4,
                                                                     minute=7 * len(load["bol"]) % 60)
    c.drawRightString(W - 0.5 * inch, H - 1.48 * inch, f"Date: {issued.strftime('%m/%d/%Y %I:%M %p')}")
    y = H - 1.85 * inch
    c.setFont("Helvetica-Bold", 10); c.drawString(0.5 * inch, y, "CARRIER"); c.drawString(4.3 * inch, y, "DISPATCH / DRIVER")
    c.setFont("Helvetica", 10)
    drv = hist_drivers.loc[load["driver"]]
    for i, (a, bb) in enumerate([(CARRIER["name"], f"Dispatcher: {OWNER}  {CARRIER['phone']}"),
                                 (CARRIER["address"], f"Driver: {drv.first_name} {drv.last_name}  {drv.phone}"),
                                 (f"{CARRIER['mc']}  {CARRIER['usdot']}", f"Truck {load['truck'][1:]}  /  Trailer V530{load['truck'][-1]}"),
                                 (CARRIER["email"], "Equipment: 53' Dry Van")]):
        c.drawString(0.5 * inch, y - 14 * (i + 1), a); c.drawString(4.3 * inch, y - 14 * (i + 1), bb)
    y -= 90
    for n, (kind, ent, appt) in enumerate([("PICKUP 1", load["shipper"], load["pu_appt"]),
                                           ("DELIVERY 1", load["consignee"], load["del_appt"])]):
        c.setFillColorRGB(0.92, 0.94, 0.97); c.rect(0.5 * inch, y - 72, W - inch, 78, fill=1, stroke=0)
        c.setFillColorRGB(0, 0, 0); c.setFont("Helvetica-Bold", 10); c.drawString(0.6 * inch, y - 8, kind)
        c.setFont("Helvetica", 10)
        c.drawString(0.6 * inch, y - 24, ent[0]); c.drawString(0.6 * inch, y - 38, ent[1]); c.drawString(0.6 * inch, y - 52, ent[2])
        c.drawString(4.3 * inch, y - 24, f"Appt: {dt(appt).strftime('%a %m/%d/%Y %H:%M')} (FCFS not allowed)")
        c.drawString(4.3 * inch, y - 38, f"Ref: {load['bol'] if n == 0 else 'DEL-' + load['broker_ref'][-5:]}")
        c.drawString(4.3 * inch, y - 52, f"Commodity: {load['commodity']}  {load['weight']:,} lbs  {load['pallets']} pallets")
        y -= 90
    c.setFont("Helvetica-Bold", 11); c.drawString(0.5 * inch, y, "RATE")
    y -= 18
    c.setFont("Helvetica", 10)
    rate_lines = [("Line Haul (flat)", load["linehaul"]),
                  (f"Fuel Surcharge ({load['miles']} mi @ ${FSC:.3f}/mi, DOE index)", load["fuel_surcharge"])]
    for k, v in rate_lines:
        c.drawString(0.6 * inch, y, k); c.drawRightString(W - 0.6 * inch, y, money(v)); y -= 15
    c.line(0.6 * inch, y + 5, W - 0.6 * inch, y + 5)
    c.setFont("Helvetica-Bold", 11); c.drawString(0.6 * inch, y - 8, "TOTAL CARRIER PAY (USD)")
    c.drawRightString(W - 0.6 * inch, y - 8, money(load["rate_total"])); y -= 34
    c.setFont("Helvetica-Bold", 10); c.drawString(0.5 * inch, y, "TERMS AND CONDITIONS"); y -= 14
    c.setFont("Helvetica", 8.3)
    terms = [
        f"1. Payment: Net {b['terms_days']} days from receipt of signed rate confirmation, invoice and clean signed BOL/POD. "
        f"Quick Pay available at {b['quick_pay_pct']}% of total carrier pay.",
        "2. Detention: 2 hours free at each stop measured from the later of appointment time or check-in. $65.00/hr thereafter,",
        "   billed in 15-minute increments. Carrier must notify broker within 30 minutes of free-time expiration and in/out times",
        "   must be noted on the BOL. Detention not reported within 24 hours of departure will not be paid.",
        "3. Lumper: reimbursed at cost with original lumper receipt submitted with invoice. TONU: $150.00.",
        "4. Any overage, shortage or damage must be noted on the BOL at delivery and reported to broker immediately. Shortage",
        "   claims will be deducted from carrier pay at the declared value per pallet unless resolved.",
        "5. Carrier may not re-broker, co-broker or assign this load. Driver must accept tracking for the duration of the load.",
        "6. This confirmation supplements the Broker-Carrier Agreement on file. In case of conflict, the agreement governs.",
        f"7. Send invoice, signed rate confirmation and POD to {b['billing_email']}. Reference load # on all documents.",
    ]
    for t in terms:
        c.drawString(0.55 * inch, y, t); y -= 12
    y -= 20
    c.setFont("Helvetica", 9)
    c.drawString(0.5 * inch, y, f"Broker: Electronically signed by J. Whitfield, Carrier Sales, {issued.strftime('%m/%d/%Y')}")
    c.drawString(0.5 * inch, y - 16, "Carrier acceptance: ____________________________   Date: __________")
    c.setFont("Helvetica-Oblique", 14); c.drawString(2.0 * inch, y - 13, "Dave Kessler")
    c.setFont("Helvetica", 9); c.drawString(4.6 * inch, y - 13, issued.strftime("%m/%d/%Y"))
    c.setFont("Helvetica", 7.5); c.drawString(0.5 * inch, 0.4 * inch, f"{b['name']}  |  Load {load['broker_ref']}  |  Page 1 of 1")
    c.save()


from docx import Document
from docx.shared import Pt


def invoice_docx(path, inv_no, inv_date, load, bill_to_name, lines, note=None):
    doc = Document()
    st = doc.styles["Normal"]; st.font.name = "Calibri"; st.font.size = Pt(11)
    doc.add_heading("INVOICE", 0)
    doc.add_paragraph(f"{CARRIER['name']}\n{CARRIER['address']}\n{CARRIER['phone']}  |  {CARRIER['email']}\n"
                      f"{CARRIER['mc']}  {CARRIER['usdot']}")
    doc.add_paragraph(f"Invoice #: {inv_no}\nInvoice date: {inv_date}\nTerms: Net 30\n"
                      f"Our load #: {load['load_id']}\nYour ref / load #: {load['broker_ref']}")
    doc.add_paragraph(f"Bill to:\n{bill_to_name}")
    doc.add_paragraph(f"Pickup: {load['shipper'][0]}, {load['shipper'][2]}  ({dt(load['pu_appt']).strftime('%m/%d/%Y')})\n"
                      f"Delivery: {load['consignee'][0]}, {load['consignee'][2]}  ({dt(load['del_appt']).strftime('%m/%d/%Y')})\n"
                      f"Truck {load['truck'][1:]}  |  BOL {load['bol']}")
    t = doc.add_table(rows=1, cols=2); t.style = "Light Grid Accent 1"
    t.rows[0].cells[0].text, t.rows[0].cells[1].text = "Description", "Amount"
    tot = 0
    for k, v in lines:
        r = t.add_row().cells; r[0].text = k; r[1].text = money(v); tot += v
    r = t.add_row().cells; r[0].text = "TOTAL DUE"; r[1].text = money(round(tot, 2))
    if note:
        doc.add_paragraph(note)
    doc.add_paragraph("Please remit to Ironline Freight LLC. Thank you for your business!")
    doc.save(path)
    return round(tot, 2)


# =============================================================== write inbox
def day_dir(d):
    p = os.path.join(INBOX, d)
    os.makedirs(p, exist_ok=True)
    return p

docs = []
def reg(day, fname, kind, load=None, **extra):
    docs.append(dict(day=day, file=f"inbox/{day}/{fname}", kind=kind, load=L[load]["load_id"] if load else None, **extra))

# rate confirmations (broker loads)
for key, day in [("L1", "2026-10-26"), ("L5", "2026-10-26"), ("L2", "2026-10-27"), ("L4", "2026-10-27"),
                 ("L6", "2026-10-27")]:
    fn = f"RateCon_{L[key]['broker_ref']}.pdf"
    ratecon_pdf(os.path.join(day_dir(day), fn), L[key]); reg(day, fn, "rate_confirmation", key)

# load tender emails (direct shippers)
tenders = {
    "L3": ("2026-10-26", "Wed, 21 Oct 2026", "shipping@buckeyepaper.example", "Mary Chen, Transportation Coordinator"),
    "L7": ("2026-10-26", "Fri, 23 Oct 2026", "logistics@sciotovalleyfoods.example", "Greg Paulson, Logistics Manager"),
}
for key, (day, sent, frm, sig) in tenders.items():
    ld = L[key]
    body = f"""From: {frm}
To: {CARRIER['email']}
Date: {sent} 15:42:07 -0400
Subject: Load tender {ld['broker_ref']} - {ld['shipper'][2].split(',')[0]} to {ld['consignee'][2].split(',')[0]}

Dave,

Please confirm the following load under our {'dedicated' if ld['bill_to'] in ('C001','C002') else ''} contract:

  Order / PO:     {ld['broker_ref']}
  Pick up:        {ld['shipper'][0]}, {ld['shipper'][1]}, {ld['shipper'][2]}
                  {dt(ld['pu_appt']).strftime('%a %m/%d %H:%M')} appointment
  Deliver to:     {ld['consignee'][0]}, {ld['consignee'][1]}, {ld['consignee'][2]}
                  {dt(ld['del_appt']).strftime('%a %m/%d %H:%M')} appointment
  Commodity:      {ld['commodity']}, {ld['pallets']} pallets, approx {ld['weight']:,} lbs
  Equipment:      53' dry van, load locks required

Rate per contract schedule: ${ld['contract_rpm']:.2f}/mi line haul x {ld['miles']} mi + fuel surcharge per DOE weekly
table (current week ${FSC:.3f}/mi). Detention $60/hr after 2 hrs free per contract.

Please reply to confirm and send driver name/truck #.

Thanks,
{sig}
{hist_cust.loc[ld['bill_to'], 'customer_name']}
"""
    fn = f"email_tender_{ld['broker_ref'].replace(' ', '_')}.eml"
    open(os.path.join(day_dir(day), fn), "w").write(body); reg(day, fn, "load_tender_email", key)

# BOL photos at pickup, POD photos at delivery
for key, ld in L.items():
    pu_day = ld["pu_appt"][:10]
    fn = f"IMG_{dt(ld['pu_out']).strftime('%Y%m%d_%H%M')}{rng.randint(10,59)}.jpg"
    photoize(render_bol(ld, pod=False), os.path.join(day_dir(pu_day), fn), seed=key + "bol")
    reg(pu_day, fn, "bol_photo", key, uploaded_by=ld["driver"])
    if ld["pod_uploaded"]:
        dday = ld["del_out"][:10]
        fn = f"IMG_{dt(ld['del_out']).strftime('%Y%m%d_%H%M')}{rng.randint(10,59)}.jpg"
        photoize(render_bol(ld, pod=True), os.path.join(day_dir(dday), fn), seed=key + "pod",
                 dark=0.08 if key == "L4" else 0.0)
        reg(dday, fn, "pod_photo", key, uploaded_by=ld["driver"])

# fuel receipts (+ one duplicate upload of the same receipt)
for i, r in enumerate(fuel_rows):
    day = r["datetime"][:10]
    fn = f"receipt_{dt(r['datetime']).strftime('%m%d_%H%M')}_{r['unit_entered']}.jpg"
    img = render_fuel_receipt(r)
    photoize(img, os.path.join(day_dir(day), fn), seed=f"fuel{i}")
    reg(day, fn, "fuel_receipt", None, receipt_no=r["receipt_no"], truck_id=r["truck_id"])
    r["file"] = f"inbox/{day}/{fn}"
    if r["truck_id"] == "T103" and r["city"] == "Whiteland":
        fn2 = f"IMG_20261029_0712{rng.randint(10,59)}.jpg"
        photoize(img, os.path.join(day_dir("2026-10-29"), fn2), seed="dup", angle=-4.5)
        reg("2026-10-29", fn2, "fuel_receipt", None, receipt_no=r["receipt_no"], truck_id="T103", duplicate_of=r["file"])
        DUP = dict(original=r["file"], duplicate=f"inbox/2026-10-29/{fn2}", receipt_no=r["receipt_no"], amount=r["total"])

# lumper receipt for L2
fn = "IMG_20261028_093644.jpg"
photoize(render_lumper(L["L2"], L["L2"]["lumper"], dt(L["L2"]["del_out"])), os.path.join(day_dir("2026-10-28"), fn), seed="lump")
reg("2026-10-28", fn, "lumper_receipt", "L2", amount=L["L2"]["lumper"])

# DVIR for T102 with uncorrected defects, dated Tue evening in Kansas City
dvir_when = datetime(2026, 10, 27, 19, 40)
dvir_odo = end_odo["T102"] + 724
fn = "IMG_20261027_194812.jpg"
photoize(render_dvir("T102", "D02", dvir_when, dvir_odo,
                     ["R/R marker lamp out on trailer", "drivers side mud flap missing (trailer)"], certified=False),
         os.path.join(day_dir("2026-10-27"), fn), seed="dvir")
reg("2026-10-27", fn, "dvir_photo", None, truck_id="T102")

# invoice drafts written by the owner (with planted mistakes)
inv_l5_no, inv_l1_no = f"INV-{next_inv}", f"INV-{next_inv + 1}"
l5 = L["L5"]
l5_draft_total = invoice_docx(os.path.join(day_dir("2026-10-27"), f"{inv_l5_no}_Ridgeline_MPLS.docx"), inv_l5_no,
                              "10/27/2026", l5, "Ridgeline Freight Logistics LLC\n401 W Lake St, Ste 900\nChicago, IL 60606",
                              [("Line haul", l5["quoted_linehaul"]), ("Fuel surcharge", l5["fuel_surcharge"])])
reg("2026-10-27", f"{inv_l5_no}_Ridgeline_MPLS.docx", "invoice_draft", "L5", invoice_no=inv_l5_no, total=l5_draft_total)
l1_draft_total = invoice_docx(os.path.join(day_dir("2026-10-28"), f"{inv_l1_no}_ridgeline.docx"), inv_l1_no,
                              "10/28/2026", l1, "Ridgeline Freight\nChicago IL",
                              [("Line haul", l1["linehaul"]), ("Fuel surcharge", l1["fuel_surcharge"])])
reg("2026-10-28", f"{inv_l1_no}_ridgeline.docx", "invoice_draft", "L1", invoice_no=inv_l1_no, total=l1_draft_total)

# driver texts (group thread export) and owner notes
TEXTS = {
"2026-10-26": [
 ("05:41", "D01", "morning. headed to great lakes in obetz for the philly load"),
 ("06:02", "D04", "fueled at crossroads, heading to scioto valley. 10am appt"),
 ("07:44", "D01", "checked in 7:40. guard says theyre backed up, door assignment pending"),
 ("08:35", "D03", "loaded at westbelt, 26 plts pet food. rolling to mpls"),
 ("09:52", "D01", "still no door. 2+ hrs here now"),
 ("10:05", "OWNER", "ok calling ridgeline now. make sure they write in/out times on the bol"),
 ("11:21", "D04", "loaded, 24 plts. bol pic sent. ~2280 mi, ill be in LA fri morning"),
 ("12:14", "D01", "finally loaded. door 14 at 11:20, out the gate 12:10. they wrote the times on it"),
 ("15:26", "D02", "loaded at buckeye, 22 plts. leaving for KC"),
 ("17:55", "D03", "fuel at gary"),
],
"2026-10-27": [
 ("09:58", "D02", "fuel kingdom city"),
 ("07:12", "D01", "delivered liberty home philly, clean pod. pic sent"),
 ("09:10", "D03", "empty in mpls. pod signed, all good"),
 ("09:22", "OWNER", "D01 - coastal load philly to indy, 10am at delaware valley foods. ratecon in your email"),
 ("11:10", "D01", "loaded 24 plts, rolling"),
 ("14:10", "D02", "delivered blue valley KC. receiver signed. going to the truck stop for reset til tomorrow"),
 ("14:12", "OWNER", "great. send me the pod pic when u can"),
 ("14:13", "D02", "👍"),
 ("19:52", "D02", "dvir done. marker light on trailer out and a mudflap is gone. pic sent"),
],
"2026-10-28": [
 ("06:15", "D02", "fueled KC. heading to heartland mills"),
 ("07:58", "D03", "loaded at twin cities box, 26 plts, light load. atl fri 7am"),
 ("09:26", "D04", "fueled in amarillo. card was acting weird had to try twice"),
 ("08:31", "D02", "loaded 22 plts at heartland, leaving for indy"),
 ("09:40", "D01", "delivered crossroads. had to pay lumper 175 on the fleet check. receipt pic sent"),
 ("09:42", "OWNER", "thx. come home after, nothing loaded out of indy today"),
 ("22:56", "D03", "fuel whiteland"),
],
"2026-10-29": [
 ("06:05", "D02", "unloading hoosier hardware"),
 ("07:41", "D02", "receiver says 1 pallet short. 21 of 22. i counted 22 at heartland, seal was intact. they wrote it on the pod"),
 ("07:46", "OWNER", "ugh ok. take pics of the seal and the empty trailer. ill call summit lane"),
 ("07:15", "D03", "resending fuel receipt from last night idk if it went thru"),
 ("09:42", "D02", "fueled whiteland, deadheading home"),
 ("06:52", "D04", "flagstaff. on schedule"),
 ("13:46", "D04", "topped off in barstow, pricey out here lol. 8.50 a gallon. at the receiver tonight, appt is 8am"),
],
"2026-10-30": [
 ("06:35", "D03", "at peachtree, checked in"),
 ("08:14", "D03", "delivered atl clean. pod sent"),
 ("09:20", "D04", "delivered LA, pod sent. need a reload out of here"),
 ("09:24", "OWNER", "working on it"),
],
}
for day, msgs in TEXTS.items():
    names = {"OWNER": "Dave (owner)"}
    for k in ["D01", "D02", "D03", "D04"]:
        names[k] = f"{hist_drivers.loc[k, 'first_name']} {hist_drivers.loc[k, 'last_name']} ({hist_drivers.loc[k, 'phone']})"
    txt = f"Ironline Drivers - group text export - {day}\n\n" + \
          "\n".join(f"[{day} {t}] {names[w]}: {m}" for t, w, m in sorted(msgs))
    open(os.path.join(day_dir(day), f"texts_{day}.txt"), "w").write(txt + "\n")
    reg(day, f"texts_{day}.txt", "driver_texts")

NOTES = {
"2026-10-26": """mon 10/26
- (from fri) jen @ ridgeline - mpls load (RFL-482355). first quote was 1380, countered, she came up to 1680 + fuel. ok
- will on great lakes load, sitting at shipper. called ridgeline 10:05 re detention, jen said note times on bol and send w/ invoice
- john (104) on the LA run for scioto, back mid next wk
- TODO: check w/ ins agent about cargo coverage renewal
- buckeye pays slow lately?? check
""",
"2026-10-27": """tue
- did invoice for mpls load (ridgeline)
- charles says KC delivered, waiting on pod pic
- will -> coastal philly/indy 1700 + fuel. lumper prob at crossroads
- charles dvir - trailer light + mudflap. get it fixed before he leaves KC?? he has heartland in the am
- summit lane - did they pay the sept load yet? havent seen it
""",
"2026-10-28": """wed
- invoiced will's philly load to ridgeline
- will home tonight. 101 due for PM soon?
- fuel price is killing us. 6.50 avg. raise FSC on contract loads?
- john says card acting weird in amarillo
""",
"2026-10-29": """thu
- shortage on summit lane load (charles). 21/22. seal intact per charles. need to dispute before they deduct
- emailed summit lane re sept invoice. no answer
- charles back in columbus tonight
""",
"2026-10-30": """fri
- tom delivered atl, john delivered LA
- need reload out of LA for john. try ridgeline/coastal boards
- payroll fri - need settlement #s for all 4 drivers
- hackathon tmrw lol
""",
}
for day, n in NOTES.items():
    open(os.path.join(day_dir(day), f"notes_{day}.txt"), "w").write(n)
    reg(day, f"notes_{day}.txt", "owner_notes")

# =============================================================== answer key
truth_loads = []
for key, ld in L.items():
    bill = BRK[ld["bill_to"]]["name"] if ld["bill_to"].startswith("BRK") else hist_cust.loc[ld["bill_to"], "customer_name"]
    acc = []
    if key == "L1":
        acc.append(dict(type="detention", amount=l1_det_amt, minutes=l1_det_min, stop="pickup"))
    if ld.get("lumper"):
        acc.append(dict(type="lumper", amount=ld["lumper"]))
    truth_loads.append(dict(
        load_id=ld["load_id"], key=key, truck_id=ld["truck"], driver_id=ld["driver"], bill_to_id=ld["bill_to"],
        bill_to_name=bill, customer_reference=ld["broker_ref"], bol_number=ld["bol"], seal=ld["seal"],
        origin=dict(name=ld["shipper"][0], address=ld["shipper"][1], city_state_zip=ld["shipper"][2],
                    appointment=ld["pu_appt"], check_in=ld["pu_in"], check_out=ld["pu_out"]),
        destination=dict(name=ld["consignee"][0], address=ld["consignee"][1], city_state_zip=ld["consignee"][2],
                         appointment=ld["del_appt"], check_in=ld["del_in"], check_out=ld["del_out"]),
        commodity=ld["commodity"], weight_lbs=ld["weight"], pallets=ld["pallets"], loaded_miles=ld["miles"],
        linehaul=ld["linehaul"], fuel_surcharge=ld["fuel_surcharge"], rate_total=ld["rate_total"],
        accessorials=acc, amount_to_invoice=round(ld["rate_total"] + sum(a["amount"] for a in acc), 2),
        pod_received=ld["pod_uploaded"], pod_exception=ld["pod_exception"],
        status="Delivered" if ld["pod_uploaded"] else "Delivered - POD missing"))

fuel_truth = [{k: v for k, v in r.items()} for r in fuel_rows]

hist_inv = pd.read_csv(f"{HIST}/invoices.csv")
open_inv = hist_inv[hist_inv.status == "Open"].copy()
open_inv["days_since_invoice"] = (pd.Timestamp(AS_OF) - pd.to_datetime(open_inv.invoice_date)).dt.days
open_inv["days_past_due"] = (pd.Timestamp(AS_OF) - pd.to_datetime(open_inv.due_date)).dt.days
past_due = open_inv[open_inv.days_past_due > 0].sort_values("days_past_due", ascending=False)
past_due_list = past_due[["invoice_id", "load_id", "customer_id", "invoice_date", "due_date", "amount",
                          "days_since_invoice", "days_past_due"]].to_dict("records")
for p in past_due_list:
    p["customer_name"] = hist_cust.loc[p["customer_id"], "customer_name"]

amarillo = next(r for r in fuel_rows if r["city"] == "Amarillo")
kc_fuel = next(r for r in fuel_rows if r["city"] == "Kansas City")
issues = [
    dict(id="P1", type="UNBILLED_DETENTION", severity="money", load=l1["load_id"],
         detail=f"BOL shows check-in {l1['pu_in'][11:]} / out {l1['pu_out'][11:]} at pickup ({l1_det_min + 120} min). "
                f"Rate con: 2 hrs free, $65/hr. Billable {l1_det_min} min = {money(l1_det_amt)}. Owner notified broker "
                f"at 10:05 (within 30 min of free-time expiry at 09:40). Invoice draft {inv_l1_no} omits it.",
         amount=l1_det_amt, evidence=["BOL photo 10/26", "texts 10/26", "notes 10/26", f"{inv_l1_no} draft"]),
    dict(id="P2", type="BILL_TO_NAME_VARIANT", severity="data", load=l1["load_id"],
         detail=f"Invoice draft {inv_l1_no} is addressed to 'Ridgeline Freight, Chicago IL'; legal name on rate con and "
                f"in customers table is 'Ridgeline Freight Logistics LLC' (BRK001). Same entity - merge, use full "
                f"name and billing address."),
    dict(id="P3", type="RATE_MISMATCH", severity="money", load=l5["load_id"],
         detail=f"Invoice draft {inv_l5_no} bills line haul {money(l5['quoted_linehaul'])} (the first quote in owner notes); "
                f"signed rate con RFL-482355 says {money(l5['linehaul'])}. Draft total {money(l5_draft_total)} vs "
                f"rate con {money(l5['rate_total'])} -> under-billed {money(l5['rate_total'] - l5_draft_total)}.",
         amount=round(l5["rate_total"] - l5_draft_total, 2)),
    dict(id="P4", type="MISSING_POD", severity="cash", load=L["L3"]["load_id"],
         detail="Driver texted 'delivered, receiver signed' on 10/27 14:10 but no POD photo was ever uploaded. "
                "Cannot invoice Buckeye Paper Products until POD is received.",
         amount_blocked=L["L3"]["rate_total"]),
    dict(id="P5", type="POD_EXCEPTION_SHORTAGE", severity="money", load=L["L4"]["load_id"],
         detail="POD notes 'SHORT 1 PLT - rec'd 21 of 22'. BOL shows 22 pallets and seal 7730125; driver says seal "
                "intact. Rate con: shortage claims deducted unless resolved - open an OS&D dispute with Summit Lane "
                "now (seal intact = shipper count issue)."),
    dict(id="P6", type="UNINVOICED_LUMPER", severity="money", load=L["L2"]["load_id"],
         detail=f"Driver paid {money(L['L2']['lumper'])} lumper at Crossroads Grocery DC (receipt photo 10/28). Rate con "
                f"reimburses lumper at cost with receipt. Invoice for CLP-226905 should total "
                f"{money(L['L2']['rate_total'] + L['L2']['lumper'])}.", amount=L["L2"]["lumper"]),
    dict(id="P7", type="FUEL_CARD_MISMATCH", severity="fraud_or_error",
         detail=f"Card {amarillo['card']} is assigned to T102, but was used at {amarillo['station']}, Amarillo TX on "
                f"{amarillo['datetime']} with unit # 104 entered ({money(amarillo['total'])}). The same card was used "
                f"by T102 in Kansas City at {kc_fuel['datetime'][11:]} that morning (~560 mi apart). T104 was in "
                f"Amarillo then - driver D04 likely used the wrong card ('card acting weird'). Reassign the purchase "
                f"to T104 for cost/IFTA and check card custody.", amount=amarillo["total"]),
    dict(id="P8", type="DUPLICATE_RECEIPT", severity="data",
         detail=f"Same fuel receipt #{DUP['receipt_no']} (T103, Whiteland IN, {money(DUP['amount'])}) uploaded twice "
                f"({DUP['original']} and {DUP['duplicate']}). Count once.", amount=DUP["amount"]),
    dict(id="P9", type="DVIR_DEFECT_NOT_CERTIFIED", severity="compliance",
         detail="T102 post-trip DVIR 10/27 19:40 lists trailer marker lamp out and missing mud flap. 'Defects "
                "corrected' / mechanic signature blank, yet T102 was dispatched 10/28 07:00 (49 CFR 396.11 requires "
                "certification of repair before the vehicle is operated again)."),
    dict(id="P10", type="AR_PAST_DUE", severity="cash",
         detail="Open invoices past due as of 2026-10-30. Headline: INV for Summit Lane dated 2026-09-19 (Net 30, due "
                "10/19) still unpaid - 41 days since invoice. Owner notes ask about it twice.",
         invoices=past_due_list),
    dict(id="P11", type="MEDICAL_CARD_EXPIRING", severity="compliance", driver="D04",
         detail=f"{hist_drivers.loc['D04','first_name']} {hist_drivers.loc['D04','last_name']}'s DOT medical card "
                f"expires 2026-11-11 (12 days). He is in Los Angeles needing a reload - schedule the physical."),
    dict(id="P12", type="READY_TO_INVOICE", severity="cash",
         detail="Delivered with POD, no invoice yet: " + ", ".join(
             f"{L[k]['load_id']} ({L[k]['broker_ref']}, {money(L[k]['rate_total'] + (L[k].get('lumper') or 0))})"
             for k in ["L2", "L4", "L6", "L7"]) + ". L4 should be invoiced together with the shortage dispute."),
]

key = dict(as_of=str(AS_OF), carrier=CARRIER, fuel_surcharge_per_mile=FSC, loads=truth_loads, fuel_receipts=fuel_truth,
           documents=docs, planted_issues=issues)
json.dump(key, open(os.path.join(KEY, "ground_truth.json"), "w"), indent=2, default=str)
print("docs:", len(docs), "issues:", len(issues))
print("L1 det", l1_det_min, l1_det_amt, "| L5 draft", l5_draft_total, "vs", l5["rate_total"])
print("past due:", [(p["invoice_id"], p["customer_name"], p["days_past_due"]) for p in past_due_list])
