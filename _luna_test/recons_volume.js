const fs=require('fs'),https=require('https');
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const g=p=>new Promise(r=>{https.get({hostname:'n8n.manzanaverde.la',path:p,headers:{'X-N8N-API-KEY':KEY},timeout:120000},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{r(JSON.parse(b))}catch{r(null)}})}).on('error',()=>r(null))});
(async()=>{
 let ids=[],cursor='';
 for(let i=0;i<5;i++){ const l=await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=success${cursor?'&cursor='+cursor:''}`);
  if(!l?.data?.length)break; ids.push(...l.data.map(e=>({id:e.id,at:e.startedAt}))); cursor=l.nextCursor; if(!cursor)break; }
 const first=new Date(ids[ids.length-1].at), last=new Date(ids[0].at);
 const hours=(last-first)/3600e3;
 console.log(`muestra: ${ids.length} ejecuciones success | ${first.toISOString()} -> ${last.toISOString()} | ${hours.toFixed(2)} h`);
 console.log(`ritmo: ${(ids.length/hours).toFixed(1)} ejecuciones/hora  ->  ~${Math.round(ids.length/hours*24)} /dia`);
 // proporcion Reconsumos medida antes: 33/300
 const share=33/300;
 const perDay=ids.length/hours*24*share;
 console.log(`\nReconsumos = 11% de las ejecuciones (33/300)`);
 console.log(`  -> ~${Math.round(perDay)} conversaciones/dia sin respuesta`);
 console.log(`  -> ~${Math.round(perDay*93)} desde el 8-jun (93 dias)`);
 const tokPerCall=591891/33;
 const costCall=tokPerCall*(0.92*0.025+0.08*0.25)/1e6;
 console.log(`\ncosto desperdiciado: ${Math.round(tokPerCall).toLocaleString()} tok/llamada * $${costCall.toFixed(5)} = $${(costCall*perDay).toFixed(2)}/dia  (~$${(costCall*perDay*30).toFixed(0)}/mes)`);
})();
