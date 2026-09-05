import argparse, hashlib, json
from pathlib import Path, PurePosixPath

parser=argparse.ArgumentParser(description="Verify the portable static reflow supplement and optional current source")
parser.add_argument("--source-root",type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parent
manifest_path=root/"manifest.json"
assert manifest_path.stat().st_size<4*1024*1024,"oversized manifest"
manifest=json.loads(manifest_path.read_text(encoding="utf-8"))
def check(base,entry):
    rel=PurePosixPath(entry["path"])
    assert not rel.is_absolute() and ".." not in rel.parts and "\\" not in entry["path"] and ":" not in entry["path"],entry["path"]
    path=base.joinpath(*rel.parts)
    assert path.resolve().is_relative_to(base.resolve()),entry["path"]
    assert path.is_file() and path.stat().st_size==entry["bytes"],entry["path"]
    assert hashlib.sha256(path.read_bytes()).hexdigest()==entry["sha256"],entry["path"]
assert len(manifest["files"])<2000
for entry in manifest["files"]:check(root,entry)
if args.source_root:
    for entry in manifest["source"]+manifest["protected"]:check(args.source_root,entry)
print(json.dumps({"status":"PASS","payloads":len(manifest["files"]),"source":len(manifest["source"]) if args.source_root else "NOT_REQUESTED","protected":len(manifest["protected"]) if args.source_root else "NOT_REQUESTED","scope":"Exact retained bytes only; not rerun runtime proof or a readiness grade"}))
