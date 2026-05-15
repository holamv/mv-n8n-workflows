// Update the redis-ttl-maintenance workflow to use raw net (no external modules).
const https = require('https');
const fs = require('fs');
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';

const newCode = fs.readFileSync('ttl_maintenance_code_v2.js', 'utf8');

(async () => {
  // GET fresh with retry
  let wf;
  for (let i=0; i<6; i++) {
    wf = await new Promise((res,rej)=>{https.get({hostname:'n8n.manzanaverde.la',path:'/api/v1/workflows/zoKIs4SySb9BTkTe',headers:{'X-N8N-API-KEY':KEY}},(r)=>{const c=[];r.on('data',d=>c.push(d));r.on('end',()=>res(JSON.parse(Buffer.concat(c).toString())));}).on('error',rej);});
    if (wf.nodes) break;
    console.log('  retry GET (got:', JSON.stringify(wf).substring(0,80), ')');
    await new Promise(r=>setTimeout(r, 3000));
  }
  if (!wf.nodes) { console.log('GET failed after retries'); process.exit(1); }
  console.log('fetched. active:', wf.active);

  // Replace Code node jsCode
  const codeNode = wf.nodes.find(n => n.name === 'Apply TTL');
  codeNode.parameters.jsCode = newCode;
  // Keep cron at every-minute for testing
  console.log('current cron:', wf.nodes[0].parameters.rule?.interval?.[0]?.expression);

  // Deactivate
  await new Promise((res,rej)=>{const req=https.request({hostname:'n8n.manzanaverde.la',path:'/api/v1/workflows/zoKIs4SySb9BTkTe/deactivate',method:'POST',headers:{'X-N8N-API-KEY':KEY}},(r)=>{r.on('data',()=>{});r.on('end',res);});req.on('error',rej);req.end();});

  // PUT
  const payload = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: { executionOrder: 'v1' } };
  const body = JSON.stringify(payload);
  const put = await new Promise((res,rej)=>{const req=https.request({hostname:'n8n.manzanaverde.la',path:'/api/v1/workflows/zoKIs4SySb9BTkTe',method:'PUT',headers:{'X-N8N-API-KEY':KEY,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},(r)=>{const c=[];r.on('data',d=>c.push(d));r.on('end',()=>res({s:r.statusCode,b:Buffer.concat(c).toString()}));});req.on('error',rej);req.write(body);req.end();});
  console.log('put:', put.s);
  if (put.s !== 200) console.log(put.b.substring(0,500));

  // Reactivate
  const act = await new Promise((res,rej)=>{const req=https.request({hostname:'n8n.manzanaverde.la',path:'/api/v1/workflows/zoKIs4SySb9BTkTe/activate',method:'POST',headers:{'X-N8N-API-KEY':KEY}},(r)=>{const c=[];r.on('data',d=>c.push(d));r.on('end',()=>res({s:r.statusCode,b:Buffer.concat(c).toString()}));});req.on('error',rej);req.end();});
  console.log('activate:', act.s);
})().catch(e => { console.error(e); process.exit(1); });
