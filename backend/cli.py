"""Command-line entry point: analyse an image without the web UI.

    python -m backend.cli image.png --out table.csv [--runs runs.csv] [--overlay out.png]
"""

from __future__ import annotations

import argparse
import base64
import sys

from .analysis import AnalysisParams, METHODS, POLARITIES, analyze, runs_csv, table_csv


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Count void pixels per column in a wood image.")
    p.add_argument("image")
    p.add_argument("--method", choices=METHODS, default="otsu")
    p.add_argument("--threshold", type=int, default=128, help="used with --method manual")
    p.add_argument("--polarity", choices=POLARITIES, default="dark",
                   help="whether voids are darker or lighter than fibers")
    p.add_argument("--smoothing", type=int, default=0, help="median filter size (odd, 0=off)")
    p.add_argument("--bin-width", type=int, default=1, help="columns per table row")
    p.add_argument("--out", help="frequency table CSV (default: stdout)")
    p.add_argument("--runs", help="write vertical void segments CSV")
    p.add_argument("--overlay", help="write PNG with voids highlighted")
    a = p.parse_args(argv)

    params = AnalysisParams(a.method, a.threshold, a.polarity, a.smoothing, a.bin_width)
    result = analyze(a.image, params, with_overlay=bool(a.overlay))

    table = table_csv(result["table"])
    if a.out:
        with open(a.out, "w", newline="") as fh:
            fh.write(table)
    else:
        sys.stdout.write(table)
    if a.runs:
        with open(a.runs, "w", newline="") as fh:
            fh.write(runs_csv(result["_mask"]))
    if a.overlay:
        with open(a.overlay, "wb") as fh:
            fh.write(base64.b64decode(result["overlay_png_b64"]))

    print(f"{result['width']}x{result['height']} px, threshold {result['threshold_used']}, "
          f"void {result['void_px']} px ({result['void_ratio']:.2%})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
