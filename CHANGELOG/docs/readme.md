# README command history

## 2026-10-15 — Preserve the Python module path in Bash

A developer following the README catalog-refresh or storyboard reproduction example now passes `apps/nodetasks_streamlit.py` intact. The former backslash was consumed by Bash, producing a missing `appsnodetasks_streamlit.py` target.

The same two-site Git Bash argument capture changed from four failed path checks to none; the unchanged module also parsed with Python's AST parser. This verification did not execute the app, compile bytecode, refresh the corpus or media, run benchmarks, call a provider, or grade the UI.
