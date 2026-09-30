// Cuenta carriles y nodos de envio en las ultimas N ejecuciones de produccion.
const fs=require('fs'),https=require('https');
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const g=p=>new Promise(r=>{https.get({hostname:'n8n.manzanaverde.la',path:p,headers:{'X-N8N-API-KEY':KEY},timeout:120000},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{r(JSON.parse(b))}catch{r(null)}})}).on('error',()=>r(null))});
(async()=>{
 const N=parseInt(process.argv[2]||'60',10);
 let cursor='',ids=[];
 while(ids.length<N){ const l=await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=success${cursor?'&cursor='+cursor:''}`);
  if(!l?.data?.length) break; ids.push(...l.data.map(e=>e.id)); cursor=l.nextCursor; if(!cursor) break; }
 ids=ids.slice(0,N);
 const lane={},send={},both=[];
 for(let i=0;i<ids.length;i+=8){
  const b=await Promise.all(ids.slice(i,i+8).map(id=>g(`/api/v1/executions/${id}?includeData=true`)));
  for(const e of b){ if(!e) continue; const rd=Object.keys(e.data?.resultData?.runData||{});
   const ag=['Ventas','ATC','Reconsumos'].filter(a=>rd.includes(a));
   const sn=['Saludo Whatsapp','Saludo Whatsapp1','Saludo Whatsapp2','Envío Imagen'].filter(s=>rd.includes(s));
   for(const a of ag) lane[a]=(lane[a]||0)+1;
   for(const s of sn) send[s]=(send[s]||0)+1;
   if(ag.length) both.push({id:e.id,agents:ag.join('+'),sends:sn.join('+')||'NINGUNO'});
  }}
 console.log(`ejecuciones success analizadas: ${ids.length}\n`);
 console.log('agente ejecutado:'); for(const [k,v] of Object.entries(lane).sort((a,b)=>b[1]-a[1])) console.log('  ',k.padEnd(12),v);
 console.log('\nnodo de envio ejecutado:'); for(const [k,v] of Object.entries(send).sort((a,b)=>b[1]-a[1])) console.log('  ',k.padEnd(18),v);
 console.log('\nagente -> envio (por ejecucion):');
 const combo={}; for(const x of both) combo[x.agents+' -> '+x.sends]=(combo[x.agents+' -> '+x.sends]||0)+1;
 for(const [k,v] of Object.entries(combo).sort((a,b)=>b[1]-a[1])) console.log('  ',String(v).padStart(3),k);
})();
