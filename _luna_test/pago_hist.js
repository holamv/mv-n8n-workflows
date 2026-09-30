const fs=require('fs'),https=require('https');
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const g=p=>new Promise(r=>{https.get({hostname:'n8n.manzanaverde.la',path:p,headers:{'X-N8N-API-KEY':KEY},timeout:120000},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{r(JSON.parse(b))}catch{r(null)}})}).on('error',()=>r(null))});
(async()=>{
 let ids=[];
 for(const st of ['success','error']){ let cur='';
  for(let i=0;i<6;i++){ const l=await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=${st}${cur?'&cursor='+cur:''}`);
   if(!l?.data?.length)break; ids.push(...l.data.map(e=>({id:e.id,at:e.startedAt}))); cur=l.nextCursor; if(!cur)break; } }
 const oldest=ids.length?ids[ids.length-1].at:'-';
 console.log(`  revisadas ${ids.length} ejecuciones, la mas vieja ${oldest}`);
 const hits={imagen:0,etiquetaPago:0,procesador:0,gemini:0};
 const samples=[];
 for(let i=0;i<ids.length;i+=8){
  const b=await Promise.all(ids.slice(i,i+8).map(m=>g(`/api/v1/executions/${m.id}?includeData=true`)));
  for(const e of b){ if(!e)continue; const rd=e.data?.resultData?.runData||{};
   if(rd['Analyze an image']||rd['Analyze an image - Flash']) hits.gemini++;
   if(rd['Imagen']) hits.imagen++;
   if(rd['Tool_Procesador_Pagos']) hits.procesador++;
   const txt=String(rd['Texto Final']?.[0]?.data?.main?.[0]?.[0]?.json?.text||'');
   if(/Etiqueta:\s*Pago/i.test(txt)){ hits.etiquetaPago++; if(samples.length<3) samples.push({id:e.id,at:e.startedAt,txt:txt.slice(0,200)}); }
  }}
 console.log('  nodo Imagen (descarga media) :',hits.imagen);
 console.log('  Gemini analiza imagen        :',hits.gemini);
 console.log('  mensaje con "Etiqueta: Pago" :',hits.etiquetaPago);
 console.log('  Tool_Procesador_Pagos        :',hits.procesador);
 samples.forEach(s=>console.log(`\n   exec ${s.id} ${s.at.slice(0,16)}\n    ${s.txt}`));
})();
