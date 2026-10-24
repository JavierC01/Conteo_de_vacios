import io

import numpy as np
from PIL import Image

from backend.analysis import (AnalysisParams, analyze, column_runs, frequency_table,
                              otsu_threshold, void_mask)
from backend.app import app


def make_png(arr: np.ndarray) -> io.BytesIO:
    buf = io.BytesIO()
    Image.fromarray(arr.astype(np.uint8), "L").save(buf, format="PNG")
    buf.seek(0)
    return buf


def sample_mask() -> np.ndarray:
    # 6 rows x 4 cols; column 1 has two runs, column 3 has none.
    m = np.zeros((6, 4), dtype=bool)
    m[0:2, 0] = True
    m[1, 1] = True
    m[3:5, 1] = True
    m[5, 2] = True
    return m


def test_column_runs():
    runs = column_runs(sample_mask())
    assert runs.tolist() == [[0, 0, 1, 2], [1, 1, 1, 1], [1, 3, 4, 2], [2, 5, 5, 1]]


def test_frequency_table_per_column():
    t = frequency_table(sample_mask())
    assert t["void_px"] == [2, 3, 1, 0]
    assert t["segments"] == [1, 2, 1, 0]
    assert t["y_min"] == [0, 1, 5, None]
    assert t["y_max"] == [1, 4, 5, None]
    assert t["y_mean"] == [0.5, round(8 / 3, 2), 5.0, None]
    assert t["cum_freq"][-1] == 1.0


def test_frequency_table_binned():
    t = frequency_table(sample_mask(), bin_width=3)
    assert t["x_start"] == [0, 3]
    assert t["x_end"] == [2, 3]
    assert t["void_px"] == [6, 0]
    assert t["y_min"] == [0, None]
    assert t["y_max"] == [5, None]
    assert t["void_ratio"] == [round(6 / 18, 6), 0.0]


def test_otsu_and_polarity():
    gray = np.array([[10, 10, 200, 200]], dtype=np.uint8)
    t = otsu_threshold(gray)
    assert 10 <= t < 200
    assert void_mask(gray, t, "dark").tolist() == [[True, True, False, False]]
    assert void_mask(gray, t, "light").tolist() == [[False, False, True, True]]


def test_analyze_manual_threshold():
    arr = np.full((4, 3), 220)
    arr[:, 1] = 20
    r = analyze(make_png(arr), AnalysisParams(method="manual", threshold=100))
    assert r["void_px"] == 4
    assert r["table"]["void_px"] == [0, 4, 0]


def test_api_analyze_and_export():
    client = app.test_client()
    arr = np.full((4, 3), 220)
    arr[0, 0] = 10
    resp = client.post("/api/analyze", data={"image": (make_png(arr), "a.png")})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["void_px"] == 1 and "_mask" not in body

    resp = client.post("/api/export/runs", data={"image": (make_png(arr), "a.png")})
    assert resp.data.decode().splitlines() == ["x,y_start,y_end,length", "0,0,0,1"]


def test_api_rejects_missing_image():
    assert app.test_client().post("/api/analyze").status_code == 400
