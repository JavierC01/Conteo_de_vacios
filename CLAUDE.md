# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Counts **void pixels** (non-fiber spaces: vessel lumens, pores, cracks) in wood images and builds a frequency table **per image column X**, including the vertical position (y) of the voids in each column.

## Commands

The virtualenv is managed with `uv`, and the commands below run from the repo root:

```sh
uv venv .venv && uv pip install -p .venv -r requirements.txt -r requirements-dev.txt

.venv/bin/flask --app backend.app run --debug          # web UI at http://127.0.0.1:5000
.venv/bin/python -m backend.cli IMAGE --out table.csv  # headless; --runs, --overlay, --bin-width, --method manual --threshold N, --polarity light
.venv/bin/python -m pytest -q                           # all tests
.venv/bin/python -m pytest -q tests/test_analysis.py::test_column_runs   # single test
```

There is no frontend build step, bundler, or npm. The browser loads the frontend directly as native ES modules, and Flask serves it as static files.

## Architecture

**Backend (`backend/`)**
- All image math lives in `analysis.py`, which is pure numpy/Pillow with no Flask. The pipeline runs grayscale (+ optional median filter) → threshold (Otsu or manual) → boolean void mask → `frequency_table()` (per-column or per-bin stats, vectorized with `np.add.reduceat`) and `column_runs()` (contiguous vertical void segments `[x, y_start, y_end(inclusive), length]`).
- Coordinates follow image convention: y = 0 is the **top** row.
- `analyze()` returns the raw mask under the private key `_mask`. Callers must pop it before serializing it to JSON (see `app.py`).
- `app.py` is **stateless**. `/api/analyze` and `/api/export/<table|runs>` each receive the image again as multipart (`image` field plus params), so the frontend re-uploads the file for each CSV export. Form field names match the `AnalysisParams` fields.
- `cli.py` is a thin wrapper over the same `analyze()`.

**Frontend (`frontend/`): atomic design in vanilla JS and CSS**
- `js/atoms` → `molecules` → `organisms` → `templates` → `pages`. A component may only import from its own level or lower ones. Every component is a function that takes a props object and returns an element. Organisms that need an imperative API return `{ el, ...methods }` instead (e.g. `UploadPanel.setBusy`, `ImageViewer.highlight`).
- `js/lib/dom.js` provides `h()`/`s()` (HTML/SVG element factories: `on*` props become listeners and `class` sets the attribute) plus number formatters.
- `js/services/api.js` is the only module that talks to the backend.
- `pages/home.js` owns the state and wiring. Hovering the chart or a table row calls `ImageViewer.highlight(xStart, xEnd)` to draw a column band over the image.
- The CSS mirrors the same layers (`css/main.css` @imports `tokens → base → atoms → molecules → organisms → templates`). Class prefixes are `a-`, `m-`, `o-`, `t-` and `p-` by layer. Colors and spacing come only from the custom properties in `tokens.css`, which also defines the dark-mode values.
- `organisms/column-chart.js` is hand-rolled SVG. It draws rounded bars when each bin is at least 4px wide and a line + 10% area wash otherwise.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
