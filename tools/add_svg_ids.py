from pathlib import Path
import re


SVG_PATH = Path(__file__).resolve().parents[1] / "assets" / "images" / "zoning-map-titled.svg"


def add_id(match: re.Match[str]) -> str:
    add_id.index += 1
    tag = match.group(0)
    if "data-id=" in tag:
        return tag

    return tag.replace("<path ", f'<path data-id="{99 + add_id.index}" ', 1)


add_id.index = 0

svg = SVG_PATH.read_text(encoding="utf-8")
svg = re.sub(r"<path\b[^>]*>", add_id, svg)
SVG_PATH.write_text(svg, encoding="utf-8")

print(f"data-id={svg.count('data-id=')}")
