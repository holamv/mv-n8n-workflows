// Inspecciona una ejecucion. Uso: node _luna_test/exec.js <execId> [--full]
const fs = require('fs'), https = require('https');
const KEY = fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md', 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const id = process.argv[2], full = process.argv.includes('--full');

https.get({ hostname: 'n8n.manzanaverde.la', path: `/api/v1/executions/${id}?includeData=true`, headers: { 'X-N8N-API-KEY': KEY }, timeout: 120000 }, r => {
  let b = ''; r.on('data', c => b += c); r.on('end', () => {
    const e = JSON.parse(b);
    const rd = e.data?.resultData?.runData || {};
    console.log('exec', e.id, e.status, e.startedAt, '->', e.stoppedAt, 'wf', e.workflowId);
    if (e.data?.resultData?.error) console.log('ERROR:', JSON.stringify(e.data.resultData.error).slice(0, 600));
    for (const [name, runs] of Object.entries(rd)) {
      const r0 = runs[0];
      const out = r0?.data?.main?.[0]?.[0]?.json ?? r0?.data?.ai_languageModel?.[0]?.[0]?.json;
      const err = r0?.error ? (r0.error.message || JSON.stringify(r0.error)).slice(0, 300) : null;
      const tok = r0?.data?.ai_languageModel?.[0]?.[0]?.json?.tokenUsage;
      console.log('\n-', name.padEnd(26), (r0?.executionTime ?? '?') + 'ms', err ? 'ERR: ' + err : '',
        tok ? 'tokens=' + JSON.stringify(tok) : '');
      if (full && out) console.log('   ', JSON.stringify(out).slice(0, 1200));
      else if (out) console.log('   ', JSON.stringify(out).slice(0, 260));
    }
  });
}).on('error', e => console.error(e));
