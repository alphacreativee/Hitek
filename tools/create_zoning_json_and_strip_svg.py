from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SVG_PATH = ROOT / "assets" / "images" / "zoning-map-titled.svg"
DATA_DIR = ROOT / "assets" / "data"
JSON_PATH = DATA_DIR / "zoning-villas.json"

VILLA_DEFAULTS = {
    "A": {"bedroom": 2, "floor_area": 200, "view": "Garden"},
    "B": {"bedroom": 3, "floor_area": 250, "view": "Park"},
    "C": {"bedroom": 3, "floor_area": 300, "view": "Garden"},
    "D": {"bedroom": 4, "floor_area": 350, "view": "Lake"},
    "E": {"bedroom": 4, "floor_area": 320, "view": "Beach"},
    "F": {"bedroom": 3, "floor_area": 280, "view": "Park"},
    "G": {"bedroom": 4, "floor_area": 400, "view": "Golf Course"},
}

STRIP_ATTRS = {
    "data-id",
    "data-original-d",
    "data-url",
    "data-color",
}


def villa_key(name: str) -> str:
    match = re.match(r"^[A-Z]", name)
    return match.group(0) if match else ""


ET.register_namespace("", "http://www.w3.org/2000/svg")
tree = ET.parse(SVG_PATH)
root = tree.getroot()
paths = root.findall("{http://www.w3.org/2000/svg}path")
villas = []

for index, path in enumerate(paths):
    name = path.attrib.get("data-title", "")
    villa = villa_key(name)
    defaults = VILLA_DEFAULTS.get(villa, {"bedroom": 3, "floor_area": 300, "view": "Garden"})
    villas.append(
        {
            "id": int(path.attrib.get("data-id", 100 + index)),
            "name": name,
            "villa": villa,
            "bedroom": defaults["bedroom"],
            "floor_area": defaults["floor_area"],
            "view": defaults["view"],
            "detail_url": path.attrib.get("data-url", f"./floor-plan.html?villa={name}"),
        }
    )

    for attr in STRIP_ATTRS:
        path.attrib.pop(attr, None)

DATA_DIR.mkdir(parents=True, exist_ok=True)
JSON_PATH.write_text(json.dumps(villas, ensure_ascii=False, indent=2), encoding="utf-8")
tree.write(SVG_PATH, encoding="unicode", xml_declaration=False)

print(f"villas={len(villas)}")
print(f"json={JSON_PATH}")
