"""Verify included evidence bytes; optional comparison with historical source."""
import argparse, hashlib, json
from pathlib import Path
p = argparse.ArgumentParser()
p.add_argument("--source-root", type=Path)
a = p.parse_args()
root = Path(__file__).resolve().parent
m = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
def check(base, row):
    path = (base / row["path"]).resolve(strict=True)
    if not path.is_relative_to(base.resolve()) or not path.is_file():
        raise SystemExit("Invalid evidence path: " + row["path"])
    data = path.read_bytes()
    actual = (len(data), hashlib.sha256(data).hexdigest(), hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest())
    if actual != (row["bytes"], row["sha256"], row["gitBlobSha1"]):
        raise SystemExit("Byte mismatch: " + row["path"])
for row in m["payloads"]:
    check(root, row)
actual = {x.relative_to(root).as_posix() for x in root.rglob("*") if x.is_file()}
expected = {r["path"] for r in m["payloads"]} | {"manifest.json"}
if actual != expected:
    raise SystemExit("Unexpected or missing packet files")
if a.source_root:
    source = json.loads((root / "worker/source-freeze.json").read_text(encoding="utf-8"))
    for row in source["source"]:
        check(a.source_root, row)
print(json.dumps({"status": "PASS", "payloads": len(m["payloads"]), "historicalSourceChecked": bool(a.source_root), "localOnlyBytesVerified": False}))
