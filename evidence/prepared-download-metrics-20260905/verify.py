from pathlib import Path
import argparse,hashlib,json
p=argparse.ArgumentParser();p.add_argument('--source-root',type=Path);a=p.parse_args()
packet=Path(__file__).resolve().parent
def verify(root,rows):
    for row in rows:
        f=root/row['path']
        assert f.resolve().is_relative_to(root.resolve()) and not f.is_symlink(), row['path']
        b=f.read_bytes()
        assert len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256'],row['path']
        if 'gitBlob' in row:assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==row['gitBlob'],row['path']
manifest=json.loads((packet/'manifest.json').read_text(encoding='utf-8'));verify(packet,manifest['files'])
result={'portableFiles':len(manifest['files']),'status':'PASS','sourceCompared':False,'limit':'Custody verification does not replay the UI or assign a grade.'}
if a.source_root:
    bindings=json.loads((packet/'source-bindings.json').read_text(encoding='utf-8'))
    verify(a.source_root,bindings['source']);verify(a.source_root,bindings['protected'])
    result.update(sourceCompared=True,sourceFiles=len(bindings['source']),protectedFiles=len(bindings['protected']))
print(json.dumps(result))
