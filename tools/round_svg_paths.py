from __future__ import annotations

from html import escape
from math import hypot
from pathlib import Path
import re


SVG_PATH = Path(__file__).resolve().parents[1] / "assets" / "images" / "zoning-map-titled.svg"
RADIUS = 4.0


def fmt(value: float) -> str:
    return f"{value:.3f}".rstrip("0").rstrip(".")


def parse_points(path_data: str) -> list[tuple[float, float]]:
    tokens = [match.group(0) for match in re.finditer(r"([MLHVZ])|(-?\d+(?:\.\d+)?)", path_data)]
    points: list[tuple[float, float]] = []
    command = ""
    x = y = 0.0
    start_x = start_y = 0.0
    index = 0

    while index < len(tokens):
        if re.match(r"^[A-Z]$", tokens[index]):
            command = tokens[index]
            index += 1

        if command in {"M", "L"}:
            x = float(tokens[index])
            y = float(tokens[index + 1])
            index += 2
            if command == "M":
                start_x, start_y = x, y
                command = "L"
            points.append((x, y))
        elif command == "H":
            x = float(tokens[index])
            index += 1
            points.append((x, y))
        elif command == "V":
            y = float(tokens[index])
            index += 1
            points.append((x, y))
        elif command == "Z":
            points.append((start_x, start_y))
            command = ""
        else:
            raise ValueError(f"Unsupported path command in: {path_data[:80]}")

    if len(points) > 1 and points[0] == points[-1]:
        points.pop()

    return points


def point_towards(
    start: tuple[float, float],
    target: tuple[float, float],
    distance: float,
) -> tuple[float, float]:
    dx = target[0] - start[0]
    dy = target[1] - start[1]
    length = hypot(dx, dy)
    if length == 0:
        return start
    ratio = distance / length
    return start[0] + dx * ratio, start[1] + dy * ratio


def rounded_path(path_data: str, radius: float) -> str:
    points = parse_points(path_data)
    if len(points) < 3:
        return path_data

    rounded: list[tuple[tuple[float, float], tuple[float, float]]] = []

    for index, point in enumerate(points):
        previous_point = points[index - 1]
        next_point = points[(index + 1) % len(points)]
        previous_length = hypot(point[0] - previous_point[0], point[1] - previous_point[1])
        next_length = hypot(point[0] - next_point[0], point[1] - next_point[1])
        corner_radius = min(radius, previous_length / 2, next_length / 2)

        in_point = point_towards(point, previous_point, corner_radius)
        out_point = point_towards(point, next_point, corner_radius)
        rounded.append((in_point, out_point))

    commands = [f"M{fmt(rounded[0][1][0])} {fmt(rounded[0][1][1])}"]

    for index in range(1, len(points)):
        in_point, out_point = rounded[index]
        point = points[index]
        commands.append(f"L{fmt(in_point[0])} {fmt(in_point[1])}")
        commands.append(
            f"Q{fmt(point[0])} {fmt(point[1])} {fmt(out_point[0])} {fmt(out_point[1])}"
        )

    first_in_point = rounded[0][0]
    first_point = points[0]
    first_out_point = rounded[0][1]
    commands.append(f"L{fmt(first_in_point[0])} {fmt(first_in_point[1])}")
    commands.append(
        f"Q{fmt(first_point[0])} {fmt(first_point[1])} {fmt(first_out_point[0])} {fmt(first_out_point[1])}"
    )
    commands.append("Z")
    return "".join(commands)


def update_path(match: re.Match[str]) -> str:
    tag = match.group(0)
    original_match = re.search(r'data-original-d="([^"]+)"', tag)
    d_match = re.search(r'\sd="([^"]+)"', tag)
    if not d_match:
        return tag

    current_d = d_match.group(1)
    original_d = original_match.group(1) if original_match and "Q" not in original_match.group(1) else current_d
    new_d = rounded_path(original_d, RADIUS)

    if original_match:
        tag = tag[: original_match.start(1)] + escape(original_d) + tag[original_match.end(1) :]
        d_match = re.search(r'\sd="([^"]+)"', tag)
        tag = tag[: d_match.start(1)] + new_d + tag[d_match.end(1) :]
        return tag

    tag = tag.replace("<path ", f'<path data-original-d="{escape(original_d)}" ', 1)
    d_match = re.search(r'\sd="([^"]+)"', tag)
    return tag[: d_match.start(1)] + new_d + tag[d_match.end(1) :]


svg = SVG_PATH.read_text(encoding="utf-8")
svg = re.sub(r"<path\b[^>]*>", update_path, svg)
SVG_PATH.write_text(svg, encoding="utf-8")

print(f"rounded_paths={svg.count('data-original-d=')}")
