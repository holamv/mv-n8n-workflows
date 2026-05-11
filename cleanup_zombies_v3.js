// Cleanup zombies: borrar todas las execs status=new con ID < maxId - 200 (>15 min antiguas)
const https = require('https');
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';

function call(method, p) {
  return new Promise((res) => {
    const req = https.request({hostname:'n8n.manzanaverde.la',path:p,method,headers:{'X-N8N-API-KEY':API_KEY},timeout:20000}, r => {
      let d=''; r.on('data',c=>d+=c);
      r.on('end',()=>{ try{res({status:r.statusCode,body:JSON.parse(d)});}catch(e){res({status:r.statusCode,body:d});}});
    });
    req.on('error', e => res({status:0,body:e.message}));
    req.on('timeout',()=>{req.destroy(); res({status:'to',body:''});});
    req.end();
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // Find max ID
  const recent = await call('GET', '/api/v1/executions?limit=5');
  let maxId = 0;
  for (const e of recent.body?.data || []) { if (parseInt(e.id) > maxId) maxId = parseInt(e.id); }
  const SAFE = maxId - 200;
  console.log('Max ID: ' + maxId + ' | Safe threshold (delete id < ): ' + SAFE);

  let totalDeleted = 0;
  for (let pass = 1; pass <= 12; pass++) {
    const zombies = [];
    let cursor='';
    while (true) {
      const r = await call('GET', '/api/v1/executions?limit=250&status=new' + (cursor?'&cursor='+cursor:''));
      if (r.status !== 200 || !r.body.data) break;
      for (const e of r.body.data) {
        if (parseInt(e.id) < SAFE) zombies.push(e.id);
      }
      if (!r.body.nextCursor) break;
      cursor = r.body.nextCursor;
    }
    if (zombies.length === 0) { console.log('Pass ' + pass + ': EMPTY ✅'); break; }
    console.log('Pass ' + pass + ': ' + zombies.length + ' to delete');

    let ok=0, fail=0;
    for (let i = 0; i < zombies.length; i += 5) {
      const chunk = zombies.slice(i, i+5);
      const rs = await Promise.all(chunk.map(id => call('DELETE', '/api/v1/executions/' + id)));
      for (const r of rs) { if (r.status === 200) ok++; else fail++; }
      if ((i+chunk.length) % 500 === 0) process.stdout.write('\r  ' + (ok+fail) + '/' + zombies.length + ' ok=' + ok + ' fail=' + fail);
    }
    console.log('\n  pass ' + pass + ' done: ok=' + ok + ' fail=' + fail);
    totalDeleted += ok;
    if (ok === 0 && fail > 0) { console.log('  no progress, stopping'); break; }
    await sleep(3000);
  }
  console.log('\nTotal deleted: ' + totalDeleted);
})();
