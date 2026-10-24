"""Void-pixel analysis for wood images.

A "void" pixel is one that belongs to a non-fiber space (vessel lumen, pore,
crack...). Voids are separated from fibers with a grayscale threshold; the
result is a boolean mask from which per-column (X) statistics are computed.

Coordinates follow image convention: x grows to the right, y grows downward
(y = 0 is the top row).
"""

from __future__ import annotations

import base64
import csv
import io
from dataclasses import dataclass, asdict
from typing import BinaryIO

import numpy as np
from PIL import Image, ImageFilter

POLARITIES = ("dark", "light")
METHODS = ("otsu", "manual")

OVERLAY_RGB = (227, 73, 72)
OVERLAY_ALPHA = 0.55


@dataclass(frozen=True)
class AnalysisParams:
    method: str = "otsu"        # "otsu" | "manual"
    threshold: int = 128        # used only when method == "manual"
    polarity: str = "dark"      # "dark": void = pixel <= t ; "light": void = pixel > t
    smoothing: int = 0          # median filter size (0 = off, odd >= 3)
    bin_width: int = 1          # columns grouped per frequency-table row

    def validated(self) -> "AnalysisParams":
        if self.method not in METHODS:
            raise ValueError(f"method must be one of {METHODS}")
        if self.polarity not in POLARITIES:
            raise ValueError(f"polarity must be one of {POLARITIES}")
        if not 0 <= self.threshold <= 255:
            raise ValueError("threshold must be between 0 and 255")
        if self.smoothing and (self.smoothing < 3 or self.smoothing % 2 == 0):
            raise ValueError("smoothing must be 0 or an odd number >= 3")
        if self.bin_width < 1:
            raise ValueError("bin_width must be >= 1")
        return self


def load_grayscale(source: BinaryIO | str, smoothing: int = 0) -> np.ndarray:
    """Open an image and return it as a uint8 (H, W) grayscale array."""
    img = Image.open(source)
    img = img.convert("L")
    if smoothing:
        img = img.filter(ImageFilter.MedianFilter(smoothing))
    return np.asarray(img, dtype=np.uint8)


def otsu_threshold(gray: np.ndarray) -> int:
    """Otsu's method: threshold that maximises between-class variance."""
    hist = np.bincount(gray.ravel(), minlength=256).astype(np.float64)
    total = hist.sum()
    if total == 0:
        return 0
    levels = np.arange(256)
    weight_bg = np.cumsum(hist)
    weight_fg = total - weight_bg
    cum_mean = np.cumsum(hist * levels)
    mean_total = cum_mean[-1]
    with np.errstate(divide="ignore", invalid="ignore"):
        mean_bg = cum_mean / weight_bg
        mean_fg = (mean_total - cum_mean) / weight_fg
        between = weight_bg * weight_fg * (mean_bg - mean_fg) ** 2
    between = np.nan_to_num(between)
    return int(np.argmax(between))


def void_mask(gray: np.ndarray, threshold: int, polarity: str) -> np.ndarray:
    """Boolean (H, W) mask, True where the pixel is a void."""
    if polarity == "dark":
        return gray <= threshold
    return gray > threshold


def column_runs(mask: np.ndarray) -> np.ndarray:
    """Contiguous vertical void segments.

    Returns an (N, 4) int array of rows ``[x, y_start, y_end, length]`` sorted by
    x then y, where ``y_end`` is inclusive.
    """
    h, w = mask.shape
    padded = np.zeros((w, h + 2), dtype=np.int8)
    padded[:, 1:-1] = mask.T
    diff = np.diff(padded, axis=1)
    starts = np.argwhere(diff == 1)   # (x, y_start)
    ends = np.argwhere(diff == -1)    # (x, y_end + 1)
    lengths = ends[:, 1] - starts[:, 1]
    return np.column_stack([starts[:, 0], starts[:, 1], ends[:, 1] - 1, lengths])


def frequency_table(mask: np.ndarray, bin_width: int = 1) -> dict[str, list]:
    """Per-column (or per-bin of columns) void statistics.

    Columns of the result (all lists of equal length, one entry per bin):
      x_start, x_end         inclusive column range of the bin
      void_px                absolute frequency: void pixels in the bin
      rel_freq               void_px / total void pixels in the image
      cum_freq               cumulative rel_freq, left to right
      void_ratio             void_px / pixels in the bin (porosity of the strip)
      y_min, y_max, y_mean   vertical position of void pixels (None if no voids)
      segments               number of contiguous vertical void runs
    """
    h, w = mask.shape
    counts = mask.sum(axis=0).astype(np.int64)
    rows = np.arange(h, dtype=np.int64)[:, None]
    y_sum = (mask * rows).sum(axis=0)

    any_void = counts > 0
    y_min = np.where(any_void, mask.argmax(axis=0), -1)
    y_max = np.where(any_void, h - 1 - mask[::-1].argmax(axis=0), -1)

    runs = column_runs(mask)
    segs = np.bincount(runs[:, 0], minlength=w) if len(runs) else np.zeros(w, np.int64)

    starts = np.arange(0, w, bin_width)
    ends = np.minimum(starts + bin_width, w) - 1
    b_counts = np.add.reduceat(counts, starts)
    b_ysum = np.add.reduceat(y_sum, starts)
    b_segs = np.add.reduceat(segs, starts)
    big = np.iinfo(np.int64).max
    b_ymin = np.minimum.reduceat(np.where(any_void, y_min, big), starts)
    b_ymax = np.maximum.reduceat(y_max, starts)

    total = int(counts.sum())
    rel = b_counts / total if total else np.zeros(len(starts))
    widths = ends - starts + 1
    has = b_counts > 0
    y_mean = np.divide(b_ysum, b_counts, out=np.zeros(len(starts)), where=has)

    def opt(arr, cast):
        return [cast(v) if ok else None for v, ok in zip(arr, has)]

    return {
        "x_start": starts.tolist(),
        "x_end": ends.tolist(),
        "void_px": b_counts.tolist(),
        "rel_freq": np.round(rel, 6).tolist(),
        "cum_freq": np.round(np.cumsum(rel), 6).tolist(),
        "void_ratio": np.round(b_counts / (widths * h), 6).tolist(),
        "y_min": opt(b_ymin, int),
        "y_max": opt(b_ymax, int),
        "y_mean": opt(np.round(y_mean, 2), float),
        "segments": b_segs.tolist(),
    }


def overlay_png(gray: np.ndarray, mask: np.ndarray) -> bytes:
    """Grayscale image with void pixels tinted, encoded as PNG."""
    rgb = np.repeat(gray[:, :, None], 3, axis=2).astype(np.float32)
    tint = np.array(OVERLAY_RGB, dtype=np.float32)
    rgb[mask] = rgb[mask] * (1 - OVERLAY_ALPHA) + tint * OVERLAY_ALPHA
    buf = io.BytesIO()
    Image.fromarray(rgb.astype(np.uint8), "RGB").save(buf, format="PNG")
    return buf.getvalue()


def analyze(source: BinaryIO | str, params: AnalysisParams | None = None,
            with_overlay: bool = True) -> dict:
    """Full pipeline: load -> threshold -> mask -> frequency table."""
    params = (params or AnalysisParams()).validated()
    gray = load_grayscale(source, params.smoothing)
    t = otsu_threshold(gray) if params.method == "otsu" else params.threshold
    mask = void_mask(gray, t, params.polarity)
    h, w = mask.shape
    total_void = int(mask.sum())

    result = {
        "params": asdict(params),
        "threshold_used": t,
        "width": w,
        "height": h,
        "total_px": w * h,
        "void_px": total_void,
        "void_ratio": round(total_void / (w * h), 6) if w * h else 0.0,
        "table": frequency_table(mask, params.bin_width),
        "_mask": mask,
    }
    if with_overlay:
        result["overlay_png_b64"] = base64.b64encode(overlay_png(gray, mask)).decode()
    return result


TABLE_FIELDS = ("x_start", "x_end", "void_px", "rel_freq", "cum_freq",
                "void_ratio", "y_min", "y_max", "y_mean", "segments")


def table_csv(table: dict[str, list]) -> str:
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(TABLE_FIELDS)
    writer.writerows(zip(*(table[f] for f in TABLE_FIELDS)))
    return out.getvalue()


def runs_csv(mask: np.ndarray) -> str:
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(("x", "y_start", "y_end", "length"))
    writer.writerows(column_runs(mask).tolist())
    return out.getvalue()
