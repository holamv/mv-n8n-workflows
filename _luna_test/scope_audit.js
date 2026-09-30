// Audita cuantas respuestas post-deploy fueron rechazo de ambito y con que pregunta.
const fs=require('fs'),https=require('https');
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const DEPLOY=new Date(process.argv[2]||'2026-09-09T14:07:52Z');
const g=p=>new Promise(r=>{https.get({hostname:'n8n.manzanaverde.la',path:p,headers:{'X-N8N-API-KEY':KEY},timeout:120000},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{r(JSON.parse(b))}catch{r(null)}})}).on('error',()=>r(null))});
const RECHAZO=/solo puedo ayudarte con temas de Manzana Verde/i;
(async()=>{
 let metas=[];
 for(const st of ['success','error']){ let cur='';
  for(let i=0;i<3;i++){ const l=await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=${st}${cur?'&cursor='+cur:''}`);
   if(!l?.data?.length)break; metas.push(...l.data.map(e=>({id:e.id,at:e.startedAt,st:e.status}))); cur=l.nextCursor; if(!cur)break; } }
 const post=metas.filter(m=>new Date(m.at)>DEPLOY);
 let total=0, rechazos=[], sendErr=[];
 for(let i=0;i<post.length;i+=8){
  const b=await Promise.all(post.slice(i,i+8).map(m=>g(`/api/v1/executions/${m.id}?includeData=true`)));
  for(const e of b){ if(!e)continue; const rd=e.data?.resultData?.runData||{};
   const agent=['ATC','Ventas','Reconsumos'].find(a=>rd[a]); if(!agent) continue; total++;
   const out=String(rd[agent]?.[0]?.data?.main?.[0]?.[0]?.json?.output||'');
   const msg=String(rd['Texto Final']?.[0]?.data?.main?.[0]?.[0]?.json?.text||'');
   if(RECHAZO.test(out)) rechazos.push({id:e.id,agent,msg:msg.slice(0,180)});
   for(const s of ['Saludo Whatsapp','Saludo Whatsapp1','Saludo Whatsapp2'])
    if(rd[s]?.[0]?.error) sendErr.push({id:e.id,node:s,msg:String(rd[s][0].error.message).slice(0,80)});
  }}
 console.log(`respuestas de agentes post-deploy: ${total}`);
 console.log(`rechazos por REGLA DE ÁMBITO: ${rechazos.length} (${(rechazos.length/Math.max(1,total)*100).toFixed(1)}%)\n`);
 rechazos.forEach(r=>console.log(`  [${r.agent} exec ${r.id}] cliente dijo: "${r.msg}"`));
 console.log(`\nerrores de envio: ${sendErr.length}`);
 sendErr.forEach(s=>console.log(`  exec ${s.id} ${s.node}: ${s.msg}`));
})();
