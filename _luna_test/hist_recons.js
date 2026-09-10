const fs=require('fs');
const files=fs.readdirSync('.').filter(f=>/^(atc_backup_|_backup_).*\.json$/.test(f));
const rows=[];
for(const f of files){
  let w; try{ w=JSON.parse(fs.readFileSync(f,'utf8')); }catch{ continue; }
  const c=w.connections||w.data?.connections; const nodes=w.nodes||w.data?.nodes;
  if(!c||!nodes) continue;
  const has=(from,to)=>JSON.stringify(c[from]?.main||[]).includes('"node":"'+to+'"');
  const predOf=n=>Object.keys(c).filter(k=>JSON.stringify(c[k]?.main||[]).includes('"node":"'+n+'"'));
  rows.push({
    file:f,
    mtime:fs.statSync(f).mtime.toISOString().slice(0,16),
    updatedAt:(w.updatedAt||'').slice(0,16),
    'Redis6->SaludoWA': has('Redis6','Saludo Whatsapp')?'SI':'no',
    'pred(SaludoWA)': predOf('Saludo Whatsapp').join(',')||'NINGUNO',
    'Recons->':(c['Reconsumos']?.main||[]).flat().map(x=>x.node).join(',')||'-',
  });
}
rows.sort((a,b)=>(a.updatedAt||a.mtime).localeCompare(b.updatedAt||b.mtime));
console.log('archivo'.padEnd(34)+'updatedAt'.padEnd(18)+'Redis6→SaludoWA  pred(Saludo Whatsapp)');
for(const r of rows) console.log(r.file.padEnd(34)+String(r.updatedAt||r.mtime).padEnd(18)+r['Redis6->SaludoWA'].padEnd(17)+r['pred(SaludoWA)']);
