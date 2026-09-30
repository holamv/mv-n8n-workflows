// Evalua el canario post-deploy. Uso: node _luna_test/evaluate_canary.js "<deployISO>" [N]
// Compara ejecuciones posteriores al deploy: errores, latencia, tokens y carriles.
const fs = require('fs'), https = require('https');
const KEY = fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md', 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const DEPLOY = new Date(process.argv[2] || Date.now() - 3 * 3600e3);
const N = parseInt(process.argv[3] || '120', 10);
const g = p => new Promise(r => { https.get({ hostname: 'n8n.manzanaverde.la', path: p, headers: { 'X-N8N-API-KEY': KEY }, timeout: 120000 },
  s => { let b = ''; s.on('data', c => b += c); s.on('end', () => { try { r(JSON.parse(b)); } catch { r(null); } }); }).on('error', () => r(null)); });

(async () => {
  let cursor = '', metas = [];
  for (const st of ['success', 'error']) {
    cursor = '';
    for (let i = 0; i < 4 && metas.length < N * 2; i++) {
      const l = await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=${st}${cursor ? '&cursor=' + cursor : ''}`);
      if (!l?.data?.length) break;
      metas.push(...l.data.map(e => ({ id: e.id, status: e.status, startedAt: e.startedAt })));
      cursor = l.nextCursor; if (!cursor) break;
    }
  }
  const post = metas.filter(m => new Date(m.startedAt) > DEPLOY);
  console.log(`deploy: ${DEPLOY.toISOString()} | ejecuciones posteriores: ${post.length} (${post.filter(p => p.status === 'error').length} error)\n`);
  if (!post.length) return console.log('sin trafico posterior al deploy todavia.');

  const ids = post.slice(0, N).map(m => m.id);
  const lane = {}, send = {}, errs = [], tok = {}, dur = {};
  for (let i = 0; i < ids.length; i += 8) {
    const batch = await Promise.all(ids.slice(i, i + 8).map(id => g(`/api/v1/executions/${id}?includeData=true`)));
    for (const e of batch) {
      if (!e) continue;
      const rd = e.data?.resultData?.runData || {};
      if (e.data?.resultData?.error) errs.push({ id: e.id, msg: String(e.data.resultData.error.message || '').slice(0, 200) });
      for (const [name, runs] of Object.entries(rd)) {
        const r0 = runs?.[0];
        if (r0?.error) errs.push({ id: e.id, node: name, msg: String(r0.error.message || '').slice(0, 200) });
        if (['Ventas', 'ATC', 'Reconsumos'].includes(name)) { lane[name] = (lane[name] || 0) + 1; (dur[name] = dur[name] || []).push(r0?.executionTime || 0); }
        if (/^(Saludo Whatsapp|Envío Imagen)/.test(name)) send[name] = (send[name] || 0) + 1;
        const j = r0?.data?.ai_languageModel?.[0]?.[0]?.json;
        const u = j?.tokenUsage || j?.tokenUsageEstimate;
        if (u) { const k = tok[name] = tok[name] || { calls: 0, in: 0, out: 0, est: 0 }; k.calls++; k.in += u.promptTokens || 0; k.out += u.completionTokens || 0; if (!j.tokenUsage) k.est++; }
      }
    }
  }
  const p = (a, q) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
  console.log('agente        ejecs   p50 ms   p95 ms');
  for (const [k, v] of Object.entries(lane).sort((a, b) => b[1] - a[1]))
    console.log('  ' + k.padEnd(12) + String(v).padStart(5) + String(p(dur[k], .5)).padStart(9) + String(p(dur[k], .95)).padStart(9));
  console.log('\nenvios:', Object.entries(send).map(([k, v]) => `${k}=${v}`).join(' | ') || 'ninguno');
  console.log('\nchat model            calls   prompt      completion  (est=Responses API)');
  for (const [k, v] of Object.entries(tok))
    console.log('  ' + k.padEnd(22) + String(v.calls).padStart(5) + String(v.in.toLocaleString()).padStart(11) + String(v.out.toLocaleString()).padStart(13) + (v.est ? '  est:' + v.est : ''));
  console.log(`\nerrores: ${errs.length}`);
  const byMsg = {}; for (const e of errs) byMsg[(e.node || '') + ': ' + e.msg] = (byMsg[(e.node || '') + ': ' + e.msg] || 0) + 1;
  for (const [m, c] of Object.entries(byMsg).sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${String(c).padStart(3)}x ${m}`);
})();
