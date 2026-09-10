// Recalcula tokens/costo de un reporte ya corrido, sin volver a gastar en LLM.
const fs=require('fs'),path=require('path'),https=require('https');
const V=process.argv[2];
const KEY=fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md','utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const P={'baseline':{m:'gpt-5-mini',in:0.25,cached:0.025,out:2.00},'luna-medium':{m:'gpt-5.6-luna',in:0.20,cached:0.02,out:1.20},'luna-low':{m:'gpt-5.6-luna',in:0.20,cached:0.02,out:1.20},'luna-none':{m:'gpt-5.6-luna',in:0.20,cached:0.02,out:1.20}}[V];
const rp=path.join(__dirname,`report_${V}.json`);
const rep=JSON.parse(fs.readFileSync(rp,'utf8'));
const ids=rep.results.flatMap(r=>r.turns.map(t=>t.exec)).filter(Boolean);
const get=id=>new Promise(res=>{https.get({hostname:'n8n.manzanaverde.la',path:`/api/v1/executions/${id}?includeData=true`,headers:{'X-N8N-API-KEY':KEY},timeout:120000},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>{try{res(JSON.parse(b))}catch{res(null)}})}).on('error',()=>res(null))});
(async()=>{
 let tin=0,tout=0,calls=0,est=0,perNode={};
 for(let i=0;i<ids.length;i+=8){
  const batch=await Promise.all(ids.slice(i,i+8).map(get));
  for(const e of batch){ if(!e) continue;
   for(const [name,runs] of Object.entries(e.data?.resultData?.runData||{})){
    const j=runs?.[0]?.data?.ai_languageModel?.[0]?.[0]?.json; if(!j) continue;
    const u=j.tokenUsage||j.tokenUsageEstimate; if(!u) continue;
    tin+=u.promptTokens||0; tout+=u.completionTokens||0; calls++; if(!j.tokenUsage) est++;
    const k=perNode[name]=perNode[name]||{calls:0,in:0,out:0}; k.calls++; k.in+=u.promptTokens||0; k.out+=u.completionTokens||0;
   }}}
 const cUn=(tin/1e6)*P.in+(tout/1e6)*P.out, c90=(tin*0.9/1e6)*P.cached+(tin*0.1/1e6)*P.in+(tout/1e6)*P.out;
 rep.tokens={llmCalls:calls,promptTokens:tin,completionTokens:tout,outPerCall:Math.round(tout/Math.max(1,calls)),estimatedOnlyCalls:est,
   note:est?'Responses API: n8n solo expone tokenUsageEstimate; reasoning tokens NO contados':'tokenUsage real'};
 rep.costUSD={suiteUncached:+cUn.toFixed(4),suiteAtCache90:+c90.toFixed(4)};
 rep.perNode=perNode;
 fs.writeFileSync(rp,JSON.stringify(rep,null,1));
 console.log(V,'| calls',calls,'(estimate-only',est+')','| prompt',tin.toLocaleString(),'| completion',tout.toLocaleString(),'('+Math.round(tout/Math.max(1,calls))+'/call)');
 console.log('  costo suite: $'+cUn.toFixed(4),'sin cache | $'+c90.toFixed(4),'a 90% cache');
 for(const [n,k] of Object.entries(perNode)) console.log('   ',n.padEnd(22),k.calls,'calls  in',k.in.toLocaleString(),' out',k.out.toLocaleString());
})();
