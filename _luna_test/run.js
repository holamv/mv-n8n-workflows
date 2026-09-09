// Arnés de carga contra el workflow de prueba. Chat local + aserciones + costo.
// Uso: node _luna_test/run.js <variant> [--conc N] [--only regex] [--chat]
const fs = require('fs'), path = require('path'), https = require('https');
const SCEN = require('./scenarios');

const VARIANT = process.argv[2] || 'baseline';
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : d; };
const CONC = parseInt(arg('--conc', '6'), 10);
const ONLY = arg('--only', null);
const SHOW_CHAT = process.argv.includes('--chat');
const URL = 'https://n8n.manzanaverde.la/webhook/luna-test-8f3a21c0-atc';
const KEY = fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md', 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];

// precios USD por 1M tokens (OpenAI, sep-2026)
const PRICE = {
  'gpt-5-mini':   { in: 0.25, cached: 0.025, out: 2.00 },
  'gpt-5.6-luna': { in: 0.20, cached: 0.02,  out: 1.20 },
};
const MODEL = VARIANT === 'baseline' ? 'gpt-5-mini' : 'gpt-5.6-luna';

const post = (payload) => new Promise((res) => {
  const data = JSON.stringify(payload);
  const t0 = Date.now();
  const req = https.request(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    timeout: 300000,
  }, r => {
    let b = ''; r.on('data', c => b += c);
    r.on('end', () => {
      const ms = Date.now() - t0;
      try { res({ ms, status: r.statusCode, ...JSON.parse(b) }); }
      catch { res({ ms, status: r.statusCode, output: null, error: 'unparseable: ' + b.slice(0, 200) }); }
    });
  });
  req.on('error', e => res({ ms: Date.now() - t0, status: 0, output: null, error: e.message }));
  req.on('timeout', () => { req.destroy(); res({ ms: Date.now() - t0, status: 0, output: null, error: 'timeout' }); });
  req.write(data); req.end();
});

const getExec = (id) => new Promise(res => {
  https.get({ hostname: 'n8n.manzanaverde.la', path: `/api/v1/executions/${id}?includeData=true`, headers: { 'X-N8N-API-KEY': KEY }, timeout: 120000 },
    r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)); } catch { res(null); } }); })
    .on('error', () => res(null));
});

function assess(text, checks) {
  const t = String(text ?? '');
  return checks.map(c => {
    let pass = true;
    if (c.must) pass = pass && c.must.test(t);
    if (c.mustNot) pass = pass && !c.mustNot.test(t);
    if (c.fn) pass = pass && !!c.fn(t);
    return { name: c.name, pass };
  });
}

async function runScenario(s) {
  const sessionId = `LT_${VARIANT}_${s.id}`;
  const turns = [];
  let prevBot = '';
  for (let i = 0; i < s.turns.length; i++) {
    const t = s.turns[i];
    const r = await post({
      id: sessionId, key: `lunatest:${sessionId}`, name: 'Cliente Prueba',
      last_input_text: t.msg, whatsapp_phone: s.phone, pais: s.pais,
      prev_bot: prevBot, prev_intent: t.prevIntent || '',
      custom_fields: { Status_user: 'lead' },
    });
    const out = r.output;
    const checks = assess(out, t.checks || []);
    if (t.expectIntent) checks.unshift({ name: `intent ~ ${t.expectIntent}`, pass: t.expectIntent.test(String(r.intent || '')) });
    const hardFail = !out || /^(input values have|Error|error:)/i.test(String(out)) || r.status !== 200;
    turns.push({ i, msg: t.msg, out, intent: r.intent, ms: r.ms, exec: r.exec_id, status: r.status, err: r.error, checks, hardFail });
    prevBot = String(out || '').slice(0, 400);
  }
  return { id: s.id, lane: s.lane, pais: s.pais, turns };
}

async function pool(items, n, fn) {
  const out = new Array(items.length); let idx = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (idx < items.length) { const i = idx++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

(async () => {
  const list = ONLY ? SCEN.filter(s => new RegExp(ONLY, 'i').test(s.id)) : SCEN;
  const totalTurns = list.reduce((a, s) => a + s.turns.length, 0);
  console.log(`\n=== ${VARIANT} | ${list.length} escenarios | ${totalTurns} turnos | concurrencia ${CONC} ===\n`);
  const t0 = Date.now();
  const results = await pool(list, CONC, async (s) => { const r = await runScenario(s); process.stdout.write('.'); return r; });
  const wall = (Date.now() - t0) / 1000;
  console.log('\n');

  // ---- latencias y fallos
  const allTurns = results.flatMap(r => r.turns.map(t => ({ ...t, sc: r.id, lane: r.lane })));
  const lat = allTurns.map(t => t.ms).sort((a, b) => a - b);
  const pct = p => lat[Math.min(lat.length - 1, Math.floor(lat.length * p))];
  const hard = allTurns.filter(t => t.hardFail);
  const failedChecks = allTurns.flatMap(t => t.checks.filter(c => !c.pass).map(c => ({ sc: t.sc, turn: t.i, name: c.name })));

  // ---- costo real desde las ejecuciones
  let tin = 0, tout = 0, calls = 0, cachedApprox = 0;
  const execIds = allTurns.map(t => t.exec).filter(Boolean);
  await pool(execIds, 8, async (id) => {
    const e = await getExec(id); if (!e) return;
    for (const runs of Object.values(e.data?.resultData?.runData || {})) {
      const j = runs?.[0]?.data?.ai_languageModel?.[0]?.[0]?.json;
      const u = j?.tokenUsage || j?.tokenUsageEstimate;
      if (u) { tin += u.promptTokens || 0; tout += u.completionTokens || 0; calls++; if (!j.tokenUsage) cachedApprox++; }
    }
  });

  const p = PRICE[MODEL];
  const costUncached = (tin / 1e6) * p.in + (tout / 1e6) * p.out;
  const costCached90 = (tin * 0.9 / 1e6) * p.cached + (tin * 0.1 / 1e6) * p.in + (tout / 1e6) * p.out;

  const report = {
    variant: VARIANT, model: MODEL, scenarios: list.length, turns: allTurns.length,
    wallSeconds: +wall.toFixed(1), concurrency: CONC,
    latency: { p50: pct(0.5), p95: pct(0.95), max: lat[lat.length - 1] },
    hardFailures: hard.length,
    checks: { total: allTurns.reduce((a, t) => a + t.checks.length, 0), failed: failedChecks.length },
    tokens: { llmCalls: calls, promptTokens: tin, completionTokens: tout, outPerCall: Math.round(tout / Math.max(1, calls)),
      estimatedOnlyCalls: cachedApprox,
      note: cachedApprox ? 'Responses API: n8n solo expone tokenUsageEstimate; los reasoning tokens NO estan contados en completionTokens' : 'tokenUsage real de la API' },
    costUSD: { suiteUncached: +costUncached.toFixed(4), suiteAtCache90: +costCached90.toFixed(4) },
    failedChecks, hardFailures_detail: hard.map(h => ({ sc: h.sc, turn: h.i, status: h.status, err: h.err, out: String(h.out).slice(0, 160) })),
    results,
  };
  fs.writeFileSync(path.join(__dirname, `report_${VARIANT}.json`), JSON.stringify(report, null, 1));

  console.log(`wall ${wall.toFixed(1)}s | latencia p50 ${report.latency.p50}ms p95 ${report.latency.p95}ms max ${report.latency.max}ms`);
  console.log(`fallos duros ${hard.length}/${allTurns.length} | checks fallados ${failedChecks.length}/${report.checks.total}`);
  console.log(`LLM calls ${calls} | prompt ${tin.toLocaleString()} | completion ${tout.toLocaleString()} (${report.tokens.outPerCall}/call)`);
  console.log(`costo suite: $${costUncached.toFixed(4)} sin cache | $${costCached90.toFixed(4)} a 90% cache`);
  if (failedChecks.length) { console.log('\nchecks fallados:'); failedChecks.forEach(f => console.log(`  ✗ [${f.sc} t${f.turn}] ${f.name}`)); }
  if (hard.length) { console.log('\nfallos duros:'); report.hardFailures_detail.forEach(h => console.log(`  ✗ [${h.sc} t${h.turn}] ${h.err || h.out}`)); }

  if (SHOW_CHAT) {
    console.log('\n\n================ CHAT LOCAL ================');
    for (const r of results) {
      console.log(`\n──────── ${r.id}  (${r.lane} · ${r.pais}) ────────`);
      for (const t of r.turns) {
        console.log(`\n  👤 ${t.msg}`);
        console.log(`  🤖 [${t.intent} · ${t.ms}ms] ${String(t.out).replace(/\n/g, '\n     ')}`);
        const bad = t.checks.filter(c => !c.pass);
        if (bad.length) console.log(`  ⚠  ${bad.map(b => b.name).join(' | ')}`);
      }
    }
  }
  console.log(`\nreporte: _luna_test/report_${VARIANT}.json`);
})();
