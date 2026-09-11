// Revierte ATC y Ventas de gpt-5.6-luna a gpt-5-mini, CONSERVANDO la regla de
// ambito v2 y el fix del carril Reconsumos.
// Motivo: gpt-5.6 cobra cache write a 1.25x del input; gpt-5-mini no cobra write.
// Con prompts de ~35K tokens y TTL de 30 min, el sobrecosto de reescribir el cache
// supera 3x el ahorro en output.  Uso: node rollback_mini.js <in> <out>
const fs=require('fs');
const [IN,OUT]=process.argv.slice(2);
const wf=JSON.parse(fs.readFileSync(IN,'utf8'));
const before=JSON.parse(fs.readFileSync(IN,'utf8'));
const N=Object.fromEntries(wf.nodes.map(n=>[n.name,n]));
const B=Object.fromEntries(before.nodes.map(n=>[n.name,n]));
const problems=[];
const modelOf={};
for(const [src,bt] of Object.entries(wf.connections))
  for(const arr of (bt.ai_languageModel||[])) for(const c of (arr||[])) modelOf[c.node]=src;

for(const ag of ['ATC','Ventas']){
  const a=N[ag], m=N[modelOf[ag]];
  if(!a||!m){problems.push('falta '+ag);continue;}
  a.typeVersion=2;                       // Agent v3.1 -> v2 (como estaba)
  delete a.parameters.options.enableStreaming;
  m.typeVersion=1.2;
  m.parameters.model={__rl:true,mode:'list',value:'gpt-5-mini',cachedResultName:'gpt-5-mini'};
  delete m.parameters.responsesApiEnabled;
  delete m.parameters.options.reasoningEffort;
  delete m.parameters.options.promptCacheKey;
  m.retryOnFail=true; m.maxTries=5; m.waitBetweenTries=20000;   // esto SI se conserva
  console.log(`  ${ag.padEnd(8)} -> agent v2 | ${modelOf[ag]}: gpt-5-mini v1.2 (retry conservado)`);
}

// self-check: lo bueno del dia NO se pierde
for(const n of ['ATC','Ventas','Reconsumos']){
  const s=N[n].parameters.options.systemMessage||'';
  if(!s.includes('REGLA DE ÁMBITO — SOLO MANZANA VERDE')) problems.push(n+': se perdio la regla de ambito');
  if(!s.includes('SIEMPRE DENTRO DE ÁMBITO')) problems.push(n+': se perdio la v2 (excepcion asesor)');
  if(!s.startsWith('=')) problems.push(n+': se perdio el marker "="');
}
const succ=x=>(wf.connections[x]?.main||[]).flatMap((o,i)=>(o||[]).map(c=>c.node)).join(',');
if(succ('Redis6')!=='If Skip Empty 3') problems.push('se perdio el fix de Reconsumos');
if(!N['Saludo Whatsapp'].parameters.jsonBody.includes('recipient_name')) problems.push('se perdio el strip anti tool-call');
for(const n of wf.nodes) if(/lmChatOpenAi/.test(n.type) && n.parameters.model.value.startsWith('gpt-5.6'))
  problems.push('quedo un modelo en 5.6: '+n.name);
if(wf.nodes.length!==before.nodes.length) problems.push('cambio la cantidad de nodos');
if(JSON.stringify(wf.connections)!==JSON.stringify(before.connections)) problems.push('cambiaron conexiones');

fs.writeFileSync(OUT,JSON.stringify(wf,null,1));
console.log(`\nescrito ${OUT} (${wf.nodes.length} nodos)`);
const u=[...new Set(problems)];
if(u.length){console.log('PROBLEMAS:');u.forEach(p=>console.log('  -',p));process.exitCode=1;}
else console.log('self-check OK: sin 5.6, regla de ambito v2 intacta, fix Reconsumos intacto, retry conservado');
