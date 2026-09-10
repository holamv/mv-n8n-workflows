// Tasa de error por ventana horaria, antes y despues del deploy.
const fs=require('fs'),https=require('https');
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const g=p=>new Promise(r=>{https.get({hostname:'n8n.manzanaverde.la',path:p,headers:{'X-N8N-API-KEY':KEY},timeout:120000},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{r(JSON.parse(b))}catch{r(null)}})}).on('error',()=>r(null))});
(async()=>{
 const all={};
 for(const st of ['success','error']){ let cur=''; all[st]=[];
  for(let i=0;i<8;i++){ const l=await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=${st}${cur?'&cursor='+cur:''}`);
   if(!l?.data?.length)break; all[st].push(...l.data.map(e=>new Date(e.startedAt))); cur=l.nextCursor; if(!cur)break; } }
 const DEPLOY=new Date(process.argv[2]||'2026-09-09T14:07:52Z');
 // Honestidad de muestreo: 'success' es mucho mas frecuente que 'error', asi que al
 // paginar la misma cantidad de cada uno la ventana cubierta por success es MAS CORTA.
 // Si no se recorta, las horas viejas muestran solo errores => 100% falso.
 const oldestOk=all['success'].length?new Date(Math.min(...all['success'].map(d=>+d))):null;
 const oldestErr=all['error'].length?new Date(Math.min(...all['error'].map(d=>+d))):null;
 const FLOOR=oldestOk&&oldestErr?new Date(Math.max(+oldestOk,+oldestErr)):(oldestOk||oldestErr);
 for(const st of Object.keys(all)) all[st]=all[st].filter(d=>d>=FLOOR);
 console.log(`ventana con cobertura completa de ambos status: desde ${FLOOR.toISOString()}
`);
 const bucket=d=>d.toISOString().slice(0,13);
 const rows={};
 for(const [st,arr] of Object.entries(all)) for(const d of arr){
  const k=bucket(d); rows[k]=rows[k]||{ok:0,err:0}; if(st==='success')rows[k].ok++; else rows[k].err++; }
 console.log('hora UTC      exec   errores   tasa    fase');
 for(const k of Object.keys(rows).sort()){ const r=rows[k], tot=r.ok+r.err;
  const fase=new Date(k+':00:00Z')<DEPLOY?'pre ':'POST';
  console.log(`  ${k}  ${String(tot).padStart(5)} ${String(r.err).padStart(8)}   ${(r.err/tot*100).toFixed(1).padStart(5)}%  ${fase}`); }
 const pre=Object.entries(rows).filter(([k])=>new Date(k+':00:00Z')<DEPLOY).reduce((a,[,r])=>({ok:a.ok+r.ok,err:a.err+r.err}),{ok:0,err:0});
 const post=Object.entries(rows).filter(([k])=>new Date(k+':00:00Z')>=DEPLOY).reduce((a,[,r])=>({ok:a.ok+r.ok,err:a.err+r.err}),{ok:0,err:0});
 const pct=r=>(r.err/(r.ok+r.err)*100).toFixed(1);
 console.log(`\nPRE  deploy: ${pre.ok+pre.err} exec, ${pre.err} errores (${pct(pre)}%)`);
 console.log(`POST deploy: ${post.ok+post.err} exec, ${post.err} errores (${pct(post)}%)`);
})();
