const wf=JSON.parse(require("fs").readFileSync("atc_live_20260909.json","utf8"));
const N=Object.fromEntries(wf.nodes.map(n=>[n.name,n]));
console.log("=== outputParser nodes ===");
for(const n of wf.nodes) if(/outputParser|structuredOutput/i.test(n.type)) console.log(n.name,n.type,JSON.stringify(n.parameters).slice(0,300));
console.log("\n=== all connection types present ===", [...new Set(Object.values(wf.connections).flatMap(c=>Object.keys(c)))].join(","));
const pred=(name)=>Object.keys(wf.connections).filter(k=>JSON.stringify(wf.connections[k]).includes('"node":"'+name+'"'));
const succ=(name)=>(wf.connections[name]?.main||[]).flatMap((o,i)=>(o||[]).map(c=>i+"→"+c.node));
for(const s of ["Switch1","IA INTENCIÓN CLIENTE","ATC","Ventas","Reconsumos","Redis4","Redis3","Redis6","Redis7","Redis8","Texto Final","Info ATC","Info Ventas","Info Reconsumos","Code in JavaScript","Get Email","Email Check"]) console.log(s.padEnd(24),"←",pred(s).join(",").slice(0,90),"  →",succ(s).join(",").slice(0,120));
for(const s of ["Switch1","Redis3","Redis4","Redis7","Redis8","Redis6","Get Email","Email Check","Code in JavaScript","Mensaje Final ATC"]) { const n=N[s]; if(n) console.log("\n## "+s+" ["+n.type+" v"+n.typeVersion+"]\n"+JSON.stringify(n.parameters).slice(0,900)); }
console.log("\n=== agents full params ===");
for(const a of ["IA INTENCIÓN CLIENTE","ATC","Ventas","Reconsumos","Tool_Calculadora_Planes","Tool_Procesador_Pagos"]){const n=N[a];const p=JSON.parse(JSON.stringify(n.parameters));if(p.options?.systemMessage)p.options.systemMessage="<"+p.options.systemMessage.length+">";if(p.toolDescription)p.toolDescription=p.toolDescription.slice(0,120);console.log(a,"v"+n.typeVersion,JSON.stringify(p).slice(0,600));}
