const fs=require('fs'),https=require('https');
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const g=p=>new Promise(r=>{https.get({hostname:'n8n.manzanaverde.la',path:p,headers:{'X-N8N-API-KEY':KEY},timeout:120000},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{r(JSON.parse(b))}catch{r(null)}})}).on('error',()=>r(null))});
const WRITE=['Wallet','Registrar Pago','Crear Pedido','Registro','Crear Dir','Datos','Intencion','Borrar datos','Borrar pedido'];
(async()=>{
 let ids=[],cursor='';
 for(let i=0;i<5 && ids.length<260;i++){
  const l=await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=success${cursor?'&cursor='+cursor:''}`);
  if(!l?.data?.length)break; ids.push(...l.data.map(e=>e.id)); cursor=l.nextCursor; if(!cursor)break;}
 console.log('ejecuciones a revisar:',ids.length);
 let found=0, tokensWasted=0, callsWasted=0; const toolUse={}; const samples=[];
 for(let i=0;i<ids.length;i+=8){
  const b=await Promise.all(ids.slice(i,i+8).map(id=>g(`/api/v1/executions/${id}?includeData=true`)));
  for(const e of b){ if(!e)continue; const rd=e.data?.resultData?.runData||{};
   if(!rd['Reconsumos'])continue; found++;
   const sent=Object.keys(rd).filter(n=>/^(Saludo Whatsapp|Envío Imagen)/.test(n));
   const tools=Object.keys(rd).filter(n=>WRITE.includes(n));
   tools.forEach(t=>toolUse[t]=(toolUse[t]||0)+1);
   const j=rd['OpenAI Chat Model2']?.[0]?.data?.ai_languageModel?.[0]?.[0]?.json;
   const u=j?.tokenUsage||j?.tokenUsageEstimate; if(u){tokensWasted+=(u.promptTokens||0)+(u.completionTokens||0);callsWasted++;}
   const out=rd['Reconsumos']?.[0]?.data?.main?.[0]?.[0]?.json?.output;
   if(samples.length<4) samples.push({id:e.id,at:e.startedAt,sent:sent.join(',')||'NINGUNO',tools:tools.join(',')||'-',out:String(out||'').slice(0,220)});
  }}
 console.log(`\nejecuciones con Reconsumos: ${found}`);
 console.log(`tokens quemados por el modelo de Reconsumos: ${tokensWasted.toLocaleString()} en ${callsWasted} llamadas`);
 console.log(`\ntools con efecto ejecutadas dentro de esas corridas:`);
 Object.keys(toolUse).length?Object.entries(toolUse).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`   ${k.padEnd(18)} ${v}`)):console.log('   ninguna');
 console.log('\nmuestras (respuesta generada que NO se envio):');
 samples.forEach(s=>console.log(`\n  exec ${s.id} ${s.at}\n   envio: ${s.sent} | tools: ${s.tools}\n   texto: ${s.out}`));
})();
