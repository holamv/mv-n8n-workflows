// Busca el workflow de Trade Marketing inspeccionando el HTML de cada Filtro de CVs
const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';

const candidates = [
  { id: 'AiBbFiAM1zrcuEYL', name: 'Filtro de CVs Ventas' },
  { id: 'vLrigp2Zib4cpyIn', name: 'Filtro de CVs Analista de MKT' },
  { id: '3fyLwVRBrgexCyOC', name: 'Filtro de CVs Analista de MKT Performace' },
  { id: 'lNgkjp3RLeccAQok', name: 'Filtro de CVs LIDER DE OPERACIONES ON DEMAND' },
  { id: 'nkZyzT9z9KhTee61', name: 'Filtro de CVs LIDER DE TRADE' },
  { id: 'W1wk2gHhfp52Tuh3', name: 'Filtro de CVs COORDINADOR DE OPERACIONES SR COL' },
  { id: 'kdp16nRANJMtrD1W', name: 'Filtro de CVs CHEF EJECUTIVO LATAM' },
];

const fetchWf = (id) => new Promise((resolve, reject) => {
  https.request({
    host: 'n8n.manzanaverde.la', path: '/api/v1/workflows/' + id,
    headers: { 'X-N8N-API-KEY': API_KEY },
  }, (res) => {
    let d=''; res.on('data', c=>d+=c); res.on('end', ()=>{ try{resolve(JSON.parse(d))}catch(e){reject(e)} });
  }).on('error', reject).end();
});

(async () => {
  for (const c of candidates) {
    try {
      const w = await fetchWf(c.id);
      const html = w.nodes.find(n => n.type === 'n8n-nodes-base.html');
      const ai = w.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.chainLlm');
      const titleMatch = html?.parameters?.html?.match(/<title>(.*?)<\/title>/);
      const h1Match = html?.parameters?.html?.match(/<h1>([\s\S]*?)<\/h1>/);
      const salaryHits = html?.parameters?.html?.match(/S\/\s*[\d,.]+/g) || [];
      const tradeHit = /trade/i.test(html?.parameters?.html || '') || /trade/i.test(ai?.parameters?.text || '');
      console.log('---', c.id, '|', c.name, '---');
      console.log('  Title:', titleMatch?.[1]);
      console.log('  H1:   ', h1Match?.[1]?.replace(/<br>/g, ' ').trim());
      console.log('  Salaries in HTML:', salaryHits.join(' | '));
      console.log('  Mentions "trade":', tradeHit);
      console.log('  Active:', w.active);
    } catch (e) { console.log('ERR', c.id, e.message); }
  }
})();
