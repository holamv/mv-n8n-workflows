// Busca ejecuciones reales del procesador de pagos y de sus sub-workflows.
const fs=require('fs'),https=require('https');
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const g=p=>new Promise(r=>{https.get({hostname:'n8n.manzanaverde.la',path:p,headers:{'X-N8N-API-KEY':KEY},timeout:120000},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{r(JSON.parse(b))}catch{r(null)}})}).on('error',()=>r(null))});
const SUBS={'Il7WWfAJCElkQx3d':'Wallet','OwHnfNmR2dz6vknj':'Registro','74K3pRrvutW2gwtX':'Crear Pedido','2BqhLRHKtIgshEDy':'Obtener dirección'};
(async()=>{
 console.log('=== ejecuciones de los sub-workflows ===');
 for(const [id,name] of Object.entries(SUBS)){
  const l=await g(`/api/v1/executions?workflowId=${id}&limit=5`);
  const d=l?.data||[];
  console.log(`  ${name.padEnd(18)} ${String(d.length).padStart(2)} recientes  ${d.length?d.map(e=>e.startedAt.slice(5,16)+'/'+e.status).slice(0,4).join('  '):'(NINGUNA)'}`);
 }
 console.log('\n=== ejecuciones del ATC que usaron Tool_Procesador_Pagos ===');
 let ids=[];
 for(const st of ['success','error']){ let cur='';
  for(let i=0;i<3;i++){ const l=await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=${st}${cur?'&cursor='+cur:''}`);
   if(!l?.data?.length)break; ids.push(...l.data.map(e=>({id:e.id,at:e.startedAt}))); cur=l.nextCursor; if(!cur)break; } }
 console.log(`  (revisando ${ids.length} ejecuciones recientes del ATC)`);
 let found=0;
 for(let i=0;i<ids.length && found<6;i+=8){
  const b=await Promise.all(ids.slice(i,i+8).map(m=>g(`/api/v1/executions/${m.id}?includeData=true`)));
  for(const e of b){ if(!e)continue; const rd=e.data?.resultData?.runData||{};
   if(!rd['Tool_Procesador_Pagos'])continue; found++;
   const msg=String(rd['Texto Final']?.[0]?.data?.main?.[0]?.[0]?.json?.text||'').slice(0,110);
   const tools=Object.keys(rd).filter(n=>['Wallet','Registro','Crear Pedido','Registrar Pago','codigo','Datos','Datos1','Pedido','Crear Dir'].includes(n));
   const out=String(rd['Ventas']?.[0]?.data?.main?.[0]?.[0]?.json?.output||'').slice(0,120);
   console.log(`\n  exec ${e.id} ${e.startedAt.slice(0,16)} [${e.status}]`);
   console.log(`    mensaje : ${msg}`);
   console.log(`    tools   : ${tools.join(', ')||'-'}`);
   console.log(`    salida  : ${out}`);
  }}
 if(!found) console.log('  NINGUNA en la ventana revisada');
})();
