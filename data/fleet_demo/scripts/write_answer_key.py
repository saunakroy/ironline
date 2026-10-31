"""Turn answer_key/ground_truth.json into planted_issues.md + CSV indexes. Usage: python3 write_answer_key.py <root>"""
import sys, json
import pandas as pd

root = sys.argv[1] if len(sys.argv) > 1 else "."
k = json.load(open(f"{root}/answer_key/ground_truth.json"))
out = ["# Planted problems - answer key", "",
       f"As of {k['as_of']}. Your end-of-day agents should surface these from the inbox + history.", ""]
for p in k["planted_issues"]:
    out.append(f"## {p['id']} · {p['type']}  ({p['severity']})")
    if p.get("load"):
        out.append(f"Load: `{p['load']}`")
    out += ["", p["detail"]]
    if p.get("amount"):
        out.append(f"\nAmount at stake: **${p['amount']:,.2f}**")
    if p.get("invoices"):
        out.append("\n| Invoice | Customer | Invoice date | Due | Amount | Days past due |\n|---|---|---|---|---|---|")
        for i in p["invoices"]:
            out.append(f"| {i['invoice_id']} | {i['customer_name']} | {i['invoice_date']} | {i['due_date']} | "
                       f"${i['amount']:,.2f} | {i['days_past_due']} |")
    out.append("")
out += ["## Demo-week loads (ground truth)", "",
        "| Load | Truck | Bill to | Ref | Lane | Miles | Line haul | FSC | Accessorials | Should invoice | POD |",
        "|---|---|---|---|---|---|---|---|---|---|---|"]
for l in k["loads"]:
    acc = ", ".join(f"{a['type']} ${a['amount']:,.2f}" for a in l["accessorials"]) or "-"
    lane = f"{l['origin']['city_state_zip'].split(',')[0]} → {l['destination']['city_state_zip'].split(',')[0]}"
    pod = "missing" if not l["pod_received"] else (l["pod_exception"] or "clean")
    out.append(f"| {l['load_id']} | {l['truck_id']} | {l['bill_to_name']} | {l['customer_reference']} | {lane} | "
               f"{l['loaded_miles']} | ${l['linehaul']:,.2f} | ${l['fuel_surcharge']:,.2f} | {acc} | "
               f"${l['amount_to_invoice']:,.2f} | {pod} |")
open(f"{root}/answer_key/planted_issues.md", "w").write("\n".join(out) + "\n")
pd.DataFrame(k["documents"]).to_csv(f"{root}/answer_key/document_index.csv", index=False)
pd.DataFrame(k["fuel_receipts"]).to_csv(f"{root}/answer_key/fuel_receipts_truth.csv", index=False)
print("wrote planted_issues.md, document_index.csv, fuel_receipts_truth.csv")
