from pathlib import Path
import re


SVG_PATH = Path(__file__).resolve().parents[1] / "assets" / "images" / "zoning-map-titled.svg"


def add_url(match: re.Match[str]) -> str:
    tag = match.group(0)
    if "data-url=" in tag:
        return tag

    title_match = re.search(r'data-title="([^"]+)"', tag)
    if not title_match:
        return tag

    url = f"./floor-plan.html?villa={title_match.group(1)}"
    return tag.replace("<path ", f'<path data-url="{url}" ', 1)


svg = SVG_PATH.read_text(encoding="utf-8")
svg = re.sub(r"<path\b[^>]*>", add_url, svg)
SVG_PATH.write_text(svg, encoding="utf-8")

print(f"data-url={svg.count('data-url=')}")
