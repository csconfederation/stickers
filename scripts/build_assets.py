#!/usr/bin/env python3
"""Generate teams/manifest.json and WebP thumbnails from teams/<PREFIX>/*.png.

Runs at deploy time: designers upload PNGs through the GitHub UI and can't run
scripts. Exits non-zero on an unreadable PNG so a broken upload fails the deploy.
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

THUMB_SIZE = 480
READ_ERRORS = (OSError, SyntaxError, ValueError, Image.DecompressionBombError)


def make_thumb(src: Path, dest: Path) -> None:
    with Image.open(src) as im:
        im.load()  # open() is lazy; a truncated PNG only fails here
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if im.has_transparency_data else "RGB")
        # thumbnail() keeps the aspect ratio and never upscales.
        im.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.LANCZOS, reducing_gap=None)
        im.save(dest, "WEBP", quality=82, method=4)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "root",
        nargs="?",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="repo root (default: parent of scripts/)",
    )
    teams_dir = parser.parse_args().root / "teams"
    if not teams_dir.is_dir():
        sys.exit(f"error: {teams_dir} not found")

    for thumbs_dir in teams_dir.glob("*/thumbs"):
        shutil.rmtree(thumbs_dir)

    manifest = {}
    errors = []
    thumb_bytes = 0
    for team in sorted(p for p in teams_dir.iterdir() if p.is_dir()):
        pngs = sorted(p.name for p in team.glob("*.png") if p.is_file())
        if not pngs:
            continue
        manifest[team.name] = pngs
        (team / "thumbs").mkdir()
        for name in pngs:
            dest = team / "thumbs" / (Path(name).stem + ".webp")
            try:
                make_thumb(team / name, dest)
            except READ_ERRORS as e:
                errors.append(f"{team / name}: {type(e).__name__}: {e}")
            else:
                thumb_bytes += dest.stat().st_size

    if errors:
        print("error: could not build thumbnails for:", file=sys.stderr)
        for line in errors:
            print(f"  {line}", file=sys.stderr)
        return 1
    if not manifest:
        print(f"error: no team PNGs found under {teams_dir}", file=sys.stderr)
        return 1

    (teams_dir / "manifest.json").write_text(
        json.dumps({"teams": manifest}, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(
        f"{len(manifest)} teams, {sum(len(names) for names in manifest.values())} PNGs, "
        f"{thumb_bytes:,} thumbnail bytes"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
