const fs=require('fs'),https=require('https');
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const g=p=>new Promise(r=>{https.get({hostname:'n8n.manzanaverde.la',path:p,headers:{'X-N8N-API-KEY':KEY},timeout:120000},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{r(JSON.parse(b))}catch{r(null)}})}).on('error',()=>r(null))});
(async()=>{
 const DEPLOY=new Date('2026-09-09T14:07:52Z');
 let ids=[],cur='';
 for(let i=0;i<4;i++){ const l=await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=error${cur?'&cursor='+cur:''}`);
  if(!l?.data?.length)break; ids.push(...l.data.filter(e=>new Date(e.startedAt)>DEPLOY).map(e=>({id:e.id,at:e.startedAt}))); cur=l.nextCursor; if(!cur)break; }
 console.log(`errores post-deploy: ${ids.length}\n`);
 const kinds={};
 for(let i=0;i<ids.length;i+=6){
  const b=await Promise.all(ids.slice(i,i+6).map(m=>g(`/api/v1/executions/${m.id}?includeData=true`)));
  for(const e of b){ if(!e)continue; const rd=e.data?.resultData?.runData||{};
   const top=String(e.data?.resultData?.error?.message||'').slice(0,90);
   const node=Object.entries(rd).find(([,r])=>r?.[0]?.error);
   const usedLuna=!!rd['ATC'];
   const kind=(node?.[0]||'(sin nodo)')+' :: '+(node?.[1]?.[0]?.error?.message||top||'?').slice(0,80);
   kinds[kind]=(kinds[kind]||0)+1;
   console.log(`  ${e.id} ${e.startedAt.slice(11,19)} | carril ATC(Luna): ${usedLuna?'SI':'no'} | ${kind}`);
  }}
 console.log('\nresumen por tipo:');
 for(const [k,v] of Object.entries(kinds).sort((a,b)=>b[1]-a[1])) console.log(`  ${String(v).padStart(3)}x ${k}`);
})();
