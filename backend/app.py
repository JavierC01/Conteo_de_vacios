"""Flask server: serves the frontend and exposes the analysis API."""

from __future__ import annotations

from pathlib import Path

from flask import Flask, Response, jsonify, request, send_from_directory
from PIL import UnidentifiedImageError

from .analysis import AnalysisParams, analyze, runs_csv, table_csv

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
MAX_UPLOAD_MB = 50

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024


def _params_from_form() -> AnalysisParams:
    f = request.form
    return AnalysisParams(
        method=f.get("method", "otsu"),
        threshold=int(f.get("threshold", 128)),
        polarity=f.get("polarity", "dark"),
        smoothing=int(f.get("smoothing", 0)),
        bin_width=int(f.get("bin_width", 1)),
    )


def _run(with_overlay: bool) -> dict:
    upload = request.files.get("image")
    if upload is None or upload.filename == "":
        raise ValueError("no image uploaded (field 'image')")
    return analyze(upload.stream, _params_from_form(), with_overlay=with_overlay)


@app.errorhandler(ValueError)
@app.errorhandler(UnidentifiedImageError)
def _bad_request(err):
    msg = "unsupported or corrupt image" if isinstance(err, UnidentifiedImageError) else str(err)
    return jsonify(error=msg), 400


@app.errorhandler(413)
def _too_large(_err):
    return jsonify(error=f"image larger than {MAX_UPLOAD_MB} MB"), 413


@app.post("/api/analyze")
def api_analyze():
    result = _run(with_overlay=True)
    result.pop("_mask")
    return jsonify(result)


@app.post("/api/export/<kind>")
def api_export(kind: str):
    if kind not in ("table", "runs"):
        return jsonify(error="kind must be 'table' or 'runs'"), 404
    result = _run(with_overlay=False)
    body = table_csv(result["table"]) if kind == "table" else runs_csv(result["_mask"])
    return Response(body, mimetype="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="voids_{kind}.csv"'})


@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/<path:path>")
def static_files(path: str):
    return send_from_directory(FRONTEND_DIR, path)


if __name__ == "__main__":
    app.run(debug=True)
