"""Shared constants for the Ironline Freight demo dataset.

Everything here is fictional: company, brokers, shippers, MC/DOT numbers
(900xxx pattern so they cannot match a real carrier), addresses and people.
Market numbers (diesel, rates, detention, payment terms) are anchored to the
2026 sources listed in README.md.
"""
import math
from datetime import date

AS_OF = date(2026, 10, 30)          # "today" for the demo (day before the hackathon)
HISTORY_START = date(2024, 11, 1)
HISTORY_END = date(2026, 10, 24)    # history stops; demo-week paperwork starts Mon 10/26

CARRIER = {
    "name": "Ironline Freight LLC",
    "address": "2250 Refugee Rd, Columbus, OH 43207",
    "phone": "(614) 555-0142",
    "email": "dispatch@ironlinefreight.example",
    "mc": "MC-900417",
    "usdot": "USDOT 3900417",
}

BROKERS = [
    # id, legal name, short/variant names used in the wild, city, terms, quick pay
    dict(id="BRK001", name="Ridgeline Freight Logistics LLC", variants=["Ridgeline Freight", "Ridgeline", "RFL"],
         city="Chicago", state="IL", address="401 W Lake St, Ste 900, Chicago, IL 60606",
         phone="(312) 555-0188", mc="MC-900822", terms_days=30, quick_pay_pct=2.0,
         billing_email="carrierpay@ridgelinefreight.example"),
    dict(id="BRK002", name="Summit Lane Logistics Inc", variants=["Summit Lane", "Summit Lane Logistics"],
         city="Nashville", state="TN", address="1100 Broadway, Ste 300, Nashville, TN 37203",
         phone="(615) 555-0117", mc="MC-900356", terms_days=30, quick_pay_pct=3.0,
         billing_email="ap@summitlanelogistics.example"),
    dict(id="BRK003", name="Coastal Load Partners LLC", variants=["Coastal Load", "Coastal Load Partners"],
         city="Charlotte", state="NC", address="525 N Tryon St, Charlotte, NC 28202",
         phone="(704) 555-0163", mc="MC-900591", terms_days=30, quick_pay_pct=2.5,
         billing_email="invoices@coastalloadpartners.example"),
]

SHIPPER_NAMES = [
    "Buckeye Paper Products", "Scioto Valley Foods", "Great Lakes Housewares",
    "Heartland Building Supply", "Olentangy Plastics", "Tri-State Beverage Distributors",
    "Maumee Auto Parts", "Prairie Pet Nutrition", "Hocking Hills Furniture",
    "Lakeshore Packaging Co", "Midstate Appliance Supply", "Cardinal Home Goods",
]

COMMODITIES = [
    ("Paper products", 50), ("Packaged dry foods", 55), ("Housewares", 70),
    ("Building materials", 55), ("Plastic containers", 92.5), ("Canned beverages", 60),
    ("Auto parts", 85), ("Pet food", 55), ("Furniture", 125), ("Corrugated packaging", 55),
    ("Appliances", 100), ("Home goods", 77.5),
]

# Truck-stop / city points used for fuel stop locations and IFTA state miles.
# (name, state, lat, lon) - approximate coordinates.
TOWNS = [
    ("Columbus", "OH", 39.96, -83.00), ("Jeffersonville", "OH", 39.65, -83.56), ("Toledo", "OH", 41.65, -83.54),
    ("Richmond", "IN", 39.83, -84.89), ("Indianapolis", "IN", 39.77, -86.16), ("Whiteland", "IN", 39.55, -86.08),
    ("Gary", "IN", 41.60, -87.34), ("Effingham", "IL", 39.12, -88.54), ("Chicago", "IL", 41.88, -87.63),
    ("Bloomington", "IL", 40.48, -88.99), ("Kingdom City", "MO", 38.95, -91.94), ("St. Louis", "MO", 38.63, -90.20),
    ("Joplin", "MO", 37.08, -94.51), ("Kansas City", "MO", 39.10, -94.58), ("Springfield", "MO", 37.21, -93.29),
    ("Oklahoma City", "OK", 35.47, -97.52), ("Tulsa", "OK", 36.15, -95.99), ("Amarillo", "TX", 35.22, -101.83),
    ("Dallas", "TX", 32.78, -96.80), ("Houston", "TX", 29.76, -95.37), ("Texarkana", "TX", 33.43, -94.05),
    ("Abilene", "TX", 32.45, -99.73), ("El Paso", "TX", 31.76, -106.49), ("Moriarty", "NM", 34.99, -106.05),
    ("Gallup", "NM", 35.53, -108.74), ("Las Cruces", "NM", 32.32, -106.76), ("Flagstaff", "AZ", 35.20, -111.65),
    ("Kingman", "AZ", 35.19, -114.05), ("Phoenix", "AZ", 33.45, -112.07), ("Barstow", "CA", 34.90, -117.02),
    ("Los Angeles", "CA", 34.05, -118.24), ("Bakersfield", "CA", 35.37, -119.02), ("Las Vegas", "NV", 36.17, -115.14),
    ("Wells", "NV", 41.11, -114.96), ("Salt Lake City", "UT", 40.76, -111.89), ("Green River", "UT", 38.99, -110.16),
    ("Denver", "CO", 39.74, -104.99), ("Limon", "CO", 39.26, -103.69), ("Goodland", "KS", 39.35, -101.71),
    ("Salina", "KS", 38.84, -97.61), ("North Platte", "NE", 41.12, -100.77), ("Omaha", "NE", 41.26, -95.93),
    ("Walcott", "IA", 41.60, -90.77), ("Des Moines", "IA", 41.59, -93.62), ("Albert Lea", "MN", 43.65, -93.37),
    ("Minneapolis", "MN", 44.98, -93.27), ("Tomah", "WI", 43.98, -90.50), ("Milwaukee", "WI", 43.04, -87.91),
    ("Marshall", "MI", 42.27, -84.96), ("Detroit", "MI", 42.33, -83.05), ("Carlisle", "PA", 40.20, -77.19),
    ("Breezewood", "PA", 40.00, -78.24), ("Philadelphia", "PA", 39.95, -75.17), ("Bloomsbury", "NJ", 40.65, -75.08),
    ("New York", "NY", 40.71, -74.01), ("Binghamton", "NY", 42.10, -75.91), ("Hagerstown", "MD", 39.64, -77.72),
    ("Morgantown", "WV", 39.63, -79.96), ("Charleston", "WV", 38.35, -81.63), ("Wytheville", "VA", 36.95, -81.08),
    ("Richmond", "VA", 37.54, -77.44), ("Charlotte", "NC", 35.23, -80.84), ("Kenly", "NC", 35.60, -78.12),
    ("Florence", "SC", 34.20, -79.76), ("Atlanta", "GA", 33.75, -84.39), ("Tifton", "GA", 31.45, -83.51),
    ("Wildwood", "FL", 28.86, -82.04), ("Miami", "FL", 25.76, -80.19), ("Jacksonville", "FL", 30.33, -81.66),
    ("Cullman", "AL", 34.17, -86.84), ("Birmingham", "AL", 33.52, -86.80), ("Meridian", "MS", 32.36, -88.70),
    ("Memphis", "TN", 35.15, -90.05), ("Nashville", "TN", 36.16, -86.78), ("Knoxville", "TN", 35.96, -83.92),
    ("Walton", "KY", 38.88, -84.61), ("Louisville", "KY", 38.25, -85.76), ("Little Rock", "AR", 34.75, -92.29),
    ("Russellville", "AR", 35.28, -93.13), ("Shreveport", "LA", 32.52, -93.75), ("Billings", "MT", 45.78, -108.50),
    ("Missoula", "MT", 46.87, -113.99), ("Butte", "MT", 46.00, -112.53), ("Bismarck", "ND", 46.81, -100.78),
    ("Sioux Falls", "SD", 43.54, -96.73), ("Rapid City", "SD", 44.08, -103.23), ("Boise", "ID", 43.62, -116.20),
    ("Twin Falls", "ID", 42.56, -114.46), ("Pendleton", "OR", 45.67, -118.79), ("Portland", "OR", 45.52, -122.68),
    ("Seattle", "WA", 47.61, -122.33), ("Ellensburg", "WA", 46.99, -120.55), ("Spokane", "WA", 47.66, -117.43),
    ("Casper", "WY", 42.87, -106.31), ("Rawlins", "WY", 41.79, -107.24), ("Cheyenne", "WY", 41.14, -104.82),
]
CITY_COORD = {}
for n, s, la, lo in TOWNS:
    CITY_COORD.setdefault((n, s), (la, lo))

# Approximate monthly U.S. average on-highway diesel ($/gal).
# 2026 anchors from cited sources: ~$3.76 late Feb 2026, $5.37 early Aug,
# $5.85 Sep 4 (AAA record), $6.29 Sep avg (EIA), ~$6.53 Oct (EIA).
# 2024-11..2026-01 values are estimates near published EIA levels.
DIESEL_INDEX = {
    "2024-11": 3.58, "2024-12": 3.56, "2025-01": 3.66, "2025-02": 3.70, "2025-03": 3.60,
    "2025-04": 3.55, "2025-05": 3.50, "2025-06": 3.64, "2025-07": 3.74, "2025-08": 3.70,
    "2025-09": 3.72, "2025-10": 3.70, "2025-11": 3.79, "2025-12": 3.74, "2026-01": 3.80,
    "2026-02": 3.76, "2026-03": 4.15, "2026-04": 4.50, "2026-05": 4.80, "2026-06": 5.02,
    "2026-07": 5.20, "2026-08": 5.40, "2026-09": 6.25, "2026-10": 6.50,
}
# State price multipliers vs national average (CA ~+30% per Sep 2026 AAA data).
STATE_FUEL_FACTOR = {"CA": 1.30, "WA": 1.16, "OR": 1.12, "NV": 1.12, "AZ": 1.05, "PA": 1.08, "NY": 1.09,
                     "NJ": 1.04, "IL": 1.04, "MD": 1.03, "MI": 1.02, "IN": 1.01, "OH": 1.00, "WV": 1.01,
                     "TX": 0.95, "OK": 0.93, "MO": 0.95, "AR": 0.95, "KS": 0.96, "NE": 0.98, "IA": 0.98,
                     "MN": 1.00, "WI": 0.99, "TN": 0.96, "GA": 0.97, "AL": 0.96, "MS": 0.95, "LA": 0.95,
                     "FL": 1.00, "SC": 0.96, "NC": 0.99, "VA": 0.99, "KY": 0.98, "CO": 1.00, "UT": 1.02,
                     "NM": 0.98, "WY": 0.98, "MT": 1.01, "ID": 1.03, "SD": 0.98, "ND": 0.99}

FSC_BASE_PRICE = 1.25   # common DOE-indexed surcharge peg: (diesel - 1.25) / 6 mpg per mile
FSC_MPG = 6.0


def diesel_index(d):
    return DIESEL_INDEX[f"{d.year:04d}-{d.month:02d}"]


def fsc_per_mile(d):
    return round(max(0.0, (diesel_index(d) - FSC_BASE_PRICE) / FSC_MPG), 3)


def haversine(a, b):
    la1, lo1 = map(math.radians, a)
    la2, lo2 = map(math.radians, b)
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 3958.8 * 2 * math.asin(math.sqrt(h))


def nearest_town(pt):
    return min(TOWNS, key=lambda t: haversine(pt, (t[2], t[3])))


def interp(a, b, f):
    return (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)
