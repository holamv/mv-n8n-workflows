// Cuantas conversaciones vienen de Instagram y cuantas logran enviar.
const fs=require('fs'),https=require('https');
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const g=p=>new Promise(r=>{https.get({hostname:'n8n.manzanaverde.la',path:p,headers:{'X-N8N-API-KEY':KEY},timeout:120000},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{r(JSON.parse(b))}catch{r(null)}})}).on('error',()=>r(null))});
(async()=>{
 let ids=[];
 for(const st of ['success','error']){ let cur='';
  for(let i=0;i<2;i++){ const l=await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=${st}${cur?'&cursor='+cur:''}`);
   if(!l?.data?.length)break; ids.push(...l.data.map(e=>e.id)); cur=l.nextCursor; if(!cur)break; } }
 const stat={instagram:{total:0,enviado:0,fallo:0},whatsapp:{total:0,enviado:0,fallo:0}};
 for(let i=0;i<ids.length;i+=8){
  const b=await Promise.all(ids.slice(i,i+8).map(id=>g(`/api/v1/executions/${id}?includeData=true`)));
  for(const e of b){ if(!e)continue; const rd=e.data?.resultData?.runData||{};
   const f=rd['WHATSAPP1']?.[0]?.data?.main?.[0]?.[0]?.json?.fuente || rd['WHATSAPP']?.[0]?.data?.main?.[0]?.[0]?.json?.fuente;
   if(!f||!stat[f])continue;
   const sends=['Saludo Whatsapp','Saludo Whatsapp1','Saludo Whatsapp2','Envío Imagen'].filter(n=>rd[n]);
   if(!sends.length)continue;
   stat[f].total++;
   const err=sends.some(n=>rd[n][0]?.error);
   if(err)stat[f].fallo++; else stat[f].enviado++;
  }}
 console.log('fuente      intentos  enviados  fallidos   tasa de fallo');
 for(const [k,v] of Object.entries(stat))
  console.log(`  ${k.padEnd(10)}${String(v.total).padStart(8)}${String(v.enviado).padStart(10)}${String(v.fallo).padStart(10)}   ${v.total?(v.fallo/v.total*100).toFixed(1):0}%`);
})();
