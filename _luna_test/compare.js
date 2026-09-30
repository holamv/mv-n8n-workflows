const fs=require('fs');
const V=['baseline','luna-medium','luna-low','luna-none'];
const R=Object.fromEntries(V.map(v=>[v,JSON.parse(fs.readFileSync(`_luna_test/report_${v}.json`,'utf8'))]));
const tok=s=>Math.round(String(s||'').length/4);

console.log('=== RESUMEN ===');
console.log('metric'.padEnd(26)+V.map(v=>v.padStart(14)).join(''));
const row=(n,f)=>console.log(n.padEnd(26)+V.map(v=>String(f(R[v])).padStart(14)).join(''));
row('wall (s)',r=>r.wallSeconds);
row('latencia p50 (ms)',r=>r.latency.p50);
row('latencia p95 (ms)',r=>r.latency.p95);
row('latencia max (ms)',r=>r.latency.max);
row('fallos duros',r=>r.hardFailures+'/'+r.turns);
row('checks fallados',r=>r.checks.failed+'/'+r.checks.total);
row('prompt tokens',r=>r.tokens.promptTokens.toLocaleString());
row('completion (reportado)',r=>r.tokens.completionTokens.toLocaleString());
const vis=v=>R[v].results.flatMap(s=>s.turns).reduce((a,t)=>a+tok(t.out),0);
row('texto visible (~tokens)',r=>{const v=V.find(x=>R[x]===r);return vis(v).toLocaleString()});
row('reasoning inferido',r=>{const v=V.find(x=>R[x]===r);const d=r.tokens.completionTokens-vis(v);return v==='baseline'?d.toLocaleString():'no medible'});
row('largo resp. promedio',r=>{const v=V.find(x=>R[x]===r);const t=R[v].results.flatMap(s=>s.turns);return Math.round(t.reduce((a,x)=>a+String(x.out||'').length,0)/t.length)+' ch'});

console.log('\n=== CHECKS FALLADOS POR VARIANTE ===');
const all=new Set(V.flatMap(v=>R[v].failedChecks.map(f=>f.sc+' t'+f.turn+' :: '+f.name)));
for(const k of [...all].sort()){
  console.log(k.padEnd(58)+V.map(v=>(R[v].failedChecks.some(f=>f.sc+' t'+f.turn+' :: '+f.name===k)?'  ✗ FALLA':'  ok    ')).join(''));
}

console.log('\n=== INTENCIONES (clasificador) ===');
for(const s of R.baseline.results){
  const line=V.map(v=>{const t=R[v].results.find(x=>x.id===s.id).turns[0];return String(t.intent).padEnd(22)});
  if(new Set(line.map(x=>x.trim())).size>1) console.log('  DIFIERE '+s.id.padEnd(26)+line.join(''));
}

const SHOW=process.argv.slice(2);
for(const id of SHOW){
  console.log('\n\n######## '+id+' ########');
  for(const v of V){ const s=R[v].results.find(x=>x.id===id); if(!s)continue;
    for(const t of s.turns){ console.log(`\n--- ${v} [${t.intent} ${t.ms}ms] ---\n👤 ${t.msg}\n🤖 ${String(t.out).slice(0,1100)}`);
      const bad=t.checks.filter(c=>!c.pass); if(bad.length)console.log('⚠ '+bad.map(b=>b.name).join(' | ')); } }
}
