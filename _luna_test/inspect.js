const wf=JSON.parse(require("fs").readFileSync("atc_live_20260909.json","utf8"));
const N=Object.fromEntries(wf.nodes.map(n=>[n.name,n]));
const out=(name,depth=1500)=>{const n=N[name]; if(!n) return console.log("!! missing",name); const p=JSON.parse(JSON.stringify(n.parameters)); if(p.options?.systemMessage) p.options.systemMessage="<"+p.options.systemMessage.length+" chars>"; if(p.text&&p.text.length>300) p.text=p.text.slice(0,300)+"..."; console.log("\n### "+name+" ["+n.type+" v"+n.typeVersion+"] creds="+JSON.stringify(n.credentials||{})); console.log(JSON.stringify(p).slice(0,depth));};
const succ=(name)=>(wf.connections[name]?.main||[]).flatMap((outArr,i)=>(outArr||[]).map(c=>i+"→"+c.node));
const pred=(name)=>Object.keys(wf.connections).filter(k=>JSON.stringify(wf.connections[k].main||[]).includes('"node":"'+name+'"'));
for(const s of ["WHATSAPPP","Respond ACK","If12","wp","WHATSAPP","Pais","PFinal","WHATSAPP1","If","Switch","Wait","If1","Saludo Whatsapp","Saludo Whatsapp1","Saludo Whatsapp2","Envío Imagen","Discord","Discord1","Insert row","Append row in sheet","Append row in sheet1"]) console.log(s.padEnd(22),"←",pred(s).join(","),"  →",succ(s).join(","));
["WHATSAPPP","Respond ACK","If12","wp","WHATSAPP","Perú","PFinal","Captura Texto","Code","Saludo Whatsapp","Saludo Whatsapp1","Saludo Whatsapp2","Envío Imagen","Memoria ","Memoria 1","IA INTENCIÓN CLIENTE","ATC","Ventas","Reconsumos","Insert row","Append row in sheet","Discord","Redis - MARK","Wait","Set Cooldown","Detect Asesor Derivation","Info Cliente"].forEach(n=>out(n));
const refs={}; for(const n of wf.nodes){ const s=JSON.stringify(n.parameters); for(const m of s.matchAll(/\$\('([^']+)'\)/g)) refs[m[1]]=(refs[m[1]]||0)+1; }
console.log("\n### $() refs:",JSON.stringify(refs));
