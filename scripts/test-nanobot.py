import importlib.util,json,stat,tempfile
from pathlib import Path
p=Path(__file__).resolve().parents[1] / 'apps/nanobot/gateway.py'
s=importlib.util.spec_from_file_location('bootstrap',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
with tempfile.TemporaryDirectory() as d:
 home=Path(d);env={'APP_URL':'https://nanobot.example.com','OPENROUTER_API_KEY':'stand-in'}
 path=m.configure(home,env);c=json.loads(path.read_text())
 assert c['providers']['openrouter']['apiKey']=='${OPENROUTER_API_KEY}'
 assert c['channels']['websocket']['host']=='127.0.0.1'
 assert c['channels']['websocket']['trustedProxyAuth']['trustedPeerCidrs']==['127.0.0.1/32']
 assert stat.S_IMODE(path.stat().st_mode)==0o600
 c['channels']['telegram']={'enabled':False,'custom':'retained'};path.write_text(json.dumps(c))
 marker=home/'.nanobot/workspace/keep.txt';marker.parent.mkdir();marker.write_text('saved work')
 m.configure(home,{'APP_URL':'https://nanobot.example.com'})
 c=json.loads(path.read_text());assert c['providers']['openrouter']['apiKey']==''
 assert c['channels']['telegram']['custom']=='retained';assert marker.read_text()=='saved work'
 path.write_text('broken JSON')
 try:m.configure(home,env)
 except json.JSONDecodeError:pass
 else:raise AssertionError('invalid config was overwritten')
 assert path.read_text()=='broken JSON'
 print('PASS: private config, credential references/removal, preserved state, invalid config fails closed')
