const fs=require('fs');
const V=['baseline','luna-medium','luna-low','luna-none'];
const R=Object.fromEntries(V.map(v=>[v,JSON.parse(fs.readFileSync(`_luna_test/report_${v}.json`,'utf8'))]));
const P={baseline:{in:.25,cached:.025,out:2.00},'luna-medium':{in:.20,cached:.02,out:1.20},'luna-low':{in:.20,cached:.02,out:1.20},'luna-none':{in:.20,cached:.02,out:1.20}};
const CACHE=0.92;                       // hit rate real de produccion (dashboard 7-sep)
const MES_ACTUAL=460;                   // USD/mes medidos hoy con gpt-5-mini
const b=R.baseline, pb=P.baseline;
const inCost=(tin,p)=>tin*(CACHE*p.cached+(1-CACHE)*p.in)/1e6;
const outCost=(t,p)=>t*p.out/1e6;
const baseIn=inCost(b.tokens.promptTokens,pb), baseOut=outCost(b.tokens.completionTokens,pb), baseTot=baseIn+baseOut;

console.log(`Suite: 27 turnos / 54 llamadas LLM. Cache asumido ${CACHE*100}% (el real de produccion).`);
console.log('\nvariante      in$      out$    total$   vs base   $/mes proy.   nota');
for(const v of V){
  const r=R[v],p=P[v];
  const ci=inCost(r.tokens.promptTokens,p);
  const lo=ci+outCost(r.tokens.completionTokens,p);                  // piso: reasoning=0
  const hi=v==='baseline'?lo:ci+outCost(b.tokens.completionTokens,p); // techo: reasoning igual al baseline
  const f=n=>n.toFixed(4).padStart(8);
  const pctLo=(1-lo/baseTot)*100, pctHi=(1-hi/baseTot)*100;
  const mesLo=MES_ACTUAL*lo/baseTot, mesHi=MES_ACTUAL*hi/baseTot;
  if(v==='baseline') console.log(`${v.padEnd(12)}${f(ci)}${f(lo-ci)}${f(lo)}       —     $${MES_ACTUAL} (medido)   out = ${(baseOut/baseTot*100).toFixed(0)}% del costo`);
  else console.log(`${v.padEnd(12)}${f(ci)}${f(lo-ci)}${f(lo)}  ${(pctLo).toFixed(0)}%..${(pctHi).toFixed(0)}%   $${mesLo.toFixed(0)}..$${mesHi.toFixed(0)}      reasoning no observable`);
}
console.log(`\nbaseline: ${b.tokens.completionTokens.toLocaleString()} tokens de salida, de los cuales ~${(b.tokens.completionTokens-4404).toLocaleString()} (91%) son razonamiento invisible.`);
console.log('El techo asume que Luna razona TANTO como gpt-5-mini; la latencia 2.7x menor indica que razona mucho menos.');
