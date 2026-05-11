
const tokens = $('Set Tokens').first().json;
const N8N_API_KEY = tokens.N8N_API_KEY;
const DISCORD_TOKEN = tokens.DISCORD_TOKEN;

const CHANNELS = {
  'leads-peru':                 '958058547067883562',
  'leads-mexico':               '958100934645383218',
  'leads-recovery-nuevos':      '1344382061363859599',
  'leads-recovery-reconsumos':  '1346134811466665984',
  'leads-peru-valiosos':        '1395774463676649502',
  'leads-mexico-valiosos':      '1395774501773639710',
  'leads-colombia-valiosos':    '1395774545368973506',
  'registros-colombia':         '969325696499482654',
};
const WORKFLOWS = {
  'Primer Contacto Leads':  '9MxNM5byLghh9ky2',
  'Seguimiento 14 dias':    'FS68xVacNF1DN9cd',
  'Contacto Primer Pedido': 's37SLqGFljbf08Js',
};
const NOTIFIER_WF = 'CI0AVz4vdAumGmuj';
const PRIMER_MENSAJE_NODES = ['Primer Mensaje','Primer Mensaje1','Primer Mensaje2','Primer Mensaje Peru','Primer Mensaje Colombia','Primer Mensaje Mexico'];

const now = new Date();
const start = new Date(now.getTime() - 12*60*60*1000);
const startISO = start.toISOString();
const endISO = now.toISOString();

function normPhone(raw) {
  if (!raw) return null;
  const d = String(raw).replace(/\D/g, '');
  if (d.length < 9 || d.length > 13) return null;
  if (d.length === 10 && /^(17|18)/.test(d)) return null;
  return d.slice(-9);
}

function extractPhones(text) {
  if (!text) return [];
  const cleaned = String(text).replace(/\d{4}-\d{2}-\d{2}[T0-9:.\sZ+-]*/g, ' ');
  const out = new Set();
  const m1 = cleaned.match(/\b\+?\d{9,13}\b/g) || [];
  for (const m of m1) {
    const k = normPhone(m);
    if (k) out.add(k);
  }
  const m2 = cleaned.match(/\+?\d{1,3}[\s\-]\d{2,4}[\s\-]\d{2,4}(?:[\s\-]?\d{0,4})?/g) || [];
  for (const m of m2) {
    const k = normPhone(m);
    if (k) out.add(k);
  }
  return [...out];
}

async function fetchDiscord(channelId) {
  const phones = new Set();
  let total = 0;
  let before = '';
  for (let page = 0; page < 4; page++) {
    const url = 'https://discord.com/api/v10/channels/' + channelId + '/messages?limit=100' + (before ? '&before=' + before : '');
    let messages;
    try {
      messages = await this.helpers.httpRequest({
        method: 'GET',
        url,
        headers: { Authorization: 'Bot ' + DISCORD_TOKEN },
        json: true,
      });
    } catch (e) { break; }
    if (!messages || !messages.length) break;
    let hitOlder = false;
    for (const m of messages) {
      if (m.timestamp < startISO) { hitOlder = true; continue; }
      if (m.timestamp >= endISO) continue;
      // Skip humans + skip already-handled error notifications
      if (!m.author || !m.author.bot) continue;
      if (m.content && /#Error_ManyChat_Contactar_Usuario/i.test(m.content)) continue;
      total++;
      const txt = (m.content || '') + ' ' + (m.embeds||[]).map(e =>
        (e.description||'') + ' ' + (e.title||'') + ' ' + (e.fields||[]).map(f => (f.name||'') + ' ' + (f.value||'')).join(' ')
      ).join(' ');
      for (const k of extractPhones(txt)) phones.add(k);
    }
    if (hitOlder || messages.length < 100) break;
    before = messages[messages.length - 1].id;
  }
  return { phones: [...phones], total };
}

async function fetchN8n(workflowId) {
  // Uses includeData=true on list endpoint - 1 call returns 100 execs WITH runData.
  const phones = new Set();
  const phoneList = [];
  let totalExecs = 0;
  const pmStats = { sent: 0, silent_failure: 0, no_pm: 0 };
  const failureSamples = [];
  let cursor;
  for (let page = 0; page < 2; page++) {
    const url = 'https://n8n.manzanaverde.la/api/v1/executions?workflowId=' + workflowId + '&limit=100&includeData=true' + (cursor ? '&cursor=' + cursor : '');
    let resp;
    try {
      resp = await this.helpers.httpRequest({
        method: 'GET',
        url,
        headers: { 'X-N8N-API-KEY': N8N_API_KEY },
        json: true,
      });
    } catch (e) { break; }
    const arr = resp.data || [];
    let hitOlder = false;
    for (const e of arr) {
      if (e.startedAt < startISO) { hitOlder = true; continue; }
      if (e.startedAt >= endISO) continue;
      totalExecs++;
      try {
        const runData = (e.data && e.data.resultData && e.data.resultData.runData) || {};
        let phoneKey = null;
        let triggerChannel = '';
        for (const tn of ['Leads','Recovery','Seguimiento','Webhook','Datos','Datos1','Datos2','Datos3']) {
          if (runData[tn] && runData[tn][0]) {
            const body = runData[tn][0].data && runData[tn][0].data.main && runData[tn][0].data.main[0] && runData[tn][0].data.main[0][0] && runData[tn][0].data.main[0][0].json && runData[tn][0].data.main[0][0].json.body;
            if (body) {
              const raw = String(body.celular || body.phone || body.number || body.from || '');
              const k = normPhone(raw);
              if (k) { phones.add(k); phoneList.push(k); phoneKey = k; }
              triggerChannel = body.discord_channel || '';
              break;
            }
          }
        }
        let pmStatus = 'no_pm', pmFailNode = null;
        for (const pmName of PRIMER_MENSAJE_NODES) {
          if (runData[pmName] && runData[pmName][0]) {
            const out = runData[pmName][0].data && runData[pmName][0].data.main && runData[pmName][0].data.main[0] && runData[pmName][0].data.main[0][0] && runData[pmName][0].data.main[0][0].json;
            if (!out) continue;
            const errVal = out.body && out.body.status === 'error';
            const httpErr = out.statusCode && out.statusCode >= 400;
            const exErr = out.error;
            if (errVal || httpErr || exErr) {
              pmStatus = 'silent_failure';
              pmFailNode = pmName;
            } else if ((out.body && out.body.status === 'success') || out.statusCode === 200) {
              pmStatus = 'sent';
            }
            break;
          }
        }
        pmStats[pmStatus]++;
        if (pmStatus === 'silent_failure') {
          failureSamples.push({ exec_id: e.id, fail_node: pmFailNode, phone: phoneKey, channel: triggerChannel });
        }
      } catch (err) {}
    }
    cursor = resp.nextCursor;
    if (hitOlder || !cursor || arr.length < 100) break;
  }
  return { phones: [...phones], phoneList, totalExecs, pmStats, failureSamples };
}

async function fetchSaturation() {
  // Measures n8n server saturation: pending queue, running, recent task-runner timeouts, avg exec duration.
  const stats = { queueNew: 0, queueRunning: 0, taskTimeouts: 0, avgPclDurMs: 0, level: 'unknown' };
  try {
    const newL = await this.helpers.httpRequest({
      method: 'GET', url: 'https://n8n.manzanaverde.la/api/v1/executions?status=new&limit=100',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }, json: true, timeout: 8000,
    });
    stats.queueNew = (newL.data || []).length;
  } catch (e) {}
  try {
    const runL = await this.helpers.httpRequest({
      method: 'GET', url: 'https://n8n.manzanaverde.la/api/v1/executions?status=running&limit=100',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }, json: true, timeout: 8000,
    });
    stats.queueRunning = (runL.data || []).length;
  } catch (e) {}
  // Count task-runner timeouts in window across PCL+ATC+Bridge
  const timeoutWfs = ['9MxNM5byLghh9ky2', 'R81I6h5KWtyNaDAy', 'VwG3AgtdDDdjC7xc'];
  let durSamples = [];
  for (const wfId of timeoutWfs) {
    try {
      const r = await this.helpers.httpRequest({
        method: 'GET', url: 'https://n8n.manzanaverde.la/api/v1/executions?workflowId=' + wfId + '&limit=100&status=error&includeData=true',
        headers: { 'X-N8N-API-KEY': N8N_API_KEY }, json: true, timeout: 12000,
      });
      for (const e of (r.data || [])) {
        if (e.startedAt < startISO) break;
        const msg = e.data && e.data.resultData && e.data.resultData.error && e.data.resultData.error.message;
        if (msg && /timed out after 60 seconds|timeout/i.test(msg)) stats.taskTimeouts++;
      }
    } catch (e) {}
    // Sample 10 successful PCL durations
    if (wfId === '9MxNM5byLghh9ky2') {
      try {
        const r = await this.helpers.httpRequest({
          method: 'GET', url: 'https://n8n.manzanaverde.la/api/v1/executions?workflowId=' + wfId + '&limit=20&status=success',
          headers: { 'X-N8N-API-KEY': N8N_API_KEY }, json: true, timeout: 8000,
        });
        for (const e of (r.data || [])) {
          if (e.startedAt < startISO || !e.stoppedAt) continue;
          durSamples.push(new Date(e.stoppedAt) - new Date(e.startedAt));
        }
      } catch (e) {}
    }
  }
  if (durSamples.length) stats.avgPclDurMs = Math.round(durSamples.reduce((a,b) => a+b, 0) / durSamples.length);
  // Saturation level heuristic
  let score = 0;
  if (stats.queueNew > 50) score += 3; else if (stats.queueNew > 20) score += 2; else if (stats.queueNew > 10) score += 1;
  if (stats.queueRunning > 30) score += 2; else if (stats.queueRunning > 15) score += 1;
  if (stats.taskTimeouts > 20) score += 3; else if (stats.taskTimeouts > 5) score += 2; else if (stats.taskTimeouts > 0) score += 1;
  if (stats.avgPclDurMs > 60000) score += 2; else if (stats.avgPclDurMs > 30000) score += 1;
  if (score === 0) stats.level = 'OK';
  else if (score <= 2) stats.level = 'BAJA';
  else if (score <= 5) stats.level = 'MEDIA';
  else if (score <= 8) stats.level = 'ALTA';
  else stats.level = 'CRITICA';
  stats.score = score;
  return stats;
}

async function fetchNotifierStats() {
  // Counts marker messages in Discord channels in audit window.
  // PARALLELIZED across 8 channels. 2 pages max per channel.
  const channelEntries = Object.entries(CHANNELS);
  const results = await Promise.all(channelEntries.map(async ([chName, channelId]) => {
    let posted = 0;
    let before = '';
    for (let p = 0; p < 2; p++) {
      const url = 'https://discord.com/api/v10/channels/' + channelId + '/messages?limit=100' + (before ? '&before=' + before : '');
      let messages;
      try {
        messages = await this.helpers.httpRequest({
          method: 'GET', url,
          headers: { Authorization: 'Bot ' + DISCORD_TOKEN },
          json: true,
        });
      } catch (e) { break; }
      if (!Array.isArray(messages) || messages.length === 0) break;
      let hitOlder = false;
      for (const m of messages) {
        if (m.timestamp < startISO) { hitOlder = true; continue; }
        if (m.timestamp >= endISO) continue;
        if (m.content && /#Error_ManyChat_Contactar_Usuario/i.test(m.content)) {
          posted++;
        }
      }
      if (hitOlder || messages.length < 100) break;
      before = messages[messages.length - 1].id;
    }
    return { chName, posted };
  }));
  let posted = 0;
  const byChannel = {};
  for (const { chName, posted: p } of results) {
    posted += p;
    if (p > 0) byChannel[chName] = p;
  }
  return { runs: 0, posted, errors: 0, byChannel };
}

const discord = {};
const allDiscordPhones = new Set();
// PARALLEL: 8 channels concurrent
const _chPromises = Object.entries(CHANNELS).map(async ([name, id]) => {
  const r = await fetchDiscord.call(this, id);
  return { name, r };
});
const n8nRes = {};
const allN8nPhones = new Set();
// PARALLEL: 3 workflows concurrent
const _wfPromises = Object.entries(WORKFLOWS).map(async ([name, id]) => {
  const r = await fetchN8n.call(this, id);
  return { name, r };
});
// PARALLEL: launch all 4 groups together (channels + workflows + notifier + saturation)
const [_chRes, _wfRes, notifierStats, saturation] = await Promise.all([
  Promise.all(_chPromises),
  Promise.all(_wfPromises),
  fetchNotifierStats.call(this),
  fetchSaturation.call(this),
]);
for (const { name, r } of _chRes) {
  discord[name] = r;
  for (const p of r.phones) allDiscordPhones.add(p);
}
for (const { name, r } of _wfRes) {
  n8nRes[name] = r;
  for (const p of r.phones) allN8nPhones.add(p);
}

const matched = [...allDiscordPhones].filter(p => allN8nPhones.has(p));
const missing = [...allDiscordPhones].filter(p => !allN8nPhones.has(p));
const cobertura = allDiscordPhones.size > 0 ? (matched.length / allDiscordPhones.size * 100).toFixed(1) : '0';

const wfBreakdown = {};
for (const [name, r] of Object.entries(n8nRes)) {
  let fromDiscord = 0, other = 0;
  for (const ph of r.phoneList) {
    if (allDiscordPhones.has(ph)) fromDiscord++;
    else other++;
  }
  wfBreakdown[name] = { fromDiscord, other, total: r.totalExecs };
}

const channelGap = {};
for (const [name, r] of Object.entries(discord)) {
  const reached = r.phones.filter(p => allN8nPhones.has(p)).length;
  const tot = r.phones.length;
  channelGap[name] = {
    total: tot,
    reached,
    gap: tot - reached,
    gapPct: tot > 0 ? Math.round((tot - reached) / tot * 100) : 0,
  };
}
const sortedGap = Object.entries(channelGap).sort((a,b) => b[1].gapPct - a[1].gapPct);

// PM aggregate
const pmTotalSent = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.sent || 0), 0);
const pmTotalFailed = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.silent_failure || 0), 0);
const pmTotalNoPm = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.no_pm || 0), 0);
const pmRate = (pmTotalSent + pmTotalFailed) > 0 ? (pmTotalSent / (pmTotalSent + pmTotalFailed) * 100).toFixed(1) : '0';

const allFailureSamples = Object.values(n8nRes).flatMap(r => r.failureSamples || []);
const failuresByChannel = {};
for (const f of allFailureSamples) {
  const c = f.channel || 'desconocido';
  failuresByChannel[c] = (failuresByChannel[c] || 0) + 1;
}

const DL = {
  display: true,
  color: '#222',
  font: { weight: 'bold', size: 12 },
};

const chartGap = {
  type: 'bar',
  data: {
    labels: ['Discord total', 'En n8n', 'Faltan en n8n'],
    datasets: [{
      label: 'Telefonos unicos',
      data: [allDiscordPhones.size, matched.length, missing.length],
      backgroundColor: ['#3498db', '#2ecc71', '#e74c3c'],
      datalabels: { anchor: 'end', align: 'top' },
    }],
  },
  options: {
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Resumen 12h (telefonos unicos)' },
      datalabels: DL,
    },
    scales: { y: { beginAtZero: true } },
  },
};

const chartCobertura = {
  type: 'bar',
  data: {
    labels: Object.keys(discord),
    datasets: [
      { label: 'Discord', data: Object.values(discord).map(r => r.phones.length), backgroundColor: '#3498db', datalabels: { anchor: 'end', align: 'top', color: '#1a5276' } },
      { label: 'En n8n', data: Object.keys(discord).map(ch => discord[ch].phones.filter(p => allN8nPhones.has(p)).length), backgroundColor: '#2ecc71', datalabels: { anchor: 'end', align: 'top', color: '#196f3d' } },
    ],
  },
  options: {
    plugins: { title: { display: true, text: 'Cobertura por canal (Discord vs n8n)' }, datalabels: DL },
    scales: { y: { beginAtZero: true } },
  },
};

const chartGapPct = {
  type: 'horizontalBar',
  data: {
    labels: sortedGap.map(([n]) => n),
    datasets: [{
      label: 'Gap %',
      data: sortedGap.map(([,v]) => v.gapPct),
      backgroundColor: sortedGap.map(([,v]) => {
        if (v.gapPct >= 70) return '#c0392b';
        if (v.gapPct >= 30) return '#e67e22';
        if (v.gapPct >= 10) return '#f1c40f';
        return '#27ae60';
      }),
      datalabels: { anchor: 'end', align: 'right', color: '#222' },
    }],
  },
  options: {
    plugins: { legend: { display: false }, title: { display: true, text: '% leads notificados que NO llegaron a n8n por canal' }, datalabels: { display: true } },
    scales: { xAxes: [{ ticks: { beginAtZero: true, max: 110 } }] },
  },
};

const chartWf = {
  type: 'bar',
  data: {
    labels: Object.keys(wfBreakdown),
    datasets: [
      { label: 'De Discord (12h)', data: Object.values(wfBreakdown).map(b => b.fromDiscord), backgroundColor: '#2ecc71', datalabels: { color: '#fff', anchor: 'center', align: 'center' } },
      { label: 'De otra fuente', data: Object.values(wfBreakdown).map(b => b.other), backgroundColor: '#95a5a6', datalabels: { color: '#fff', anchor: 'center', align: 'center' } },
    ],
  },
  options: {
    plugins: { title: { display: true, text: 'Ejecuciones por workflow (12h) - Discord vs otra fuente' }, datalabels: DL },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
  },
};

// NEW chart: WhatsApp send health
const chartWA = {
  type: 'doughnut',
  data: {
    labels: ['WhatsApp enviado', 'Silent failure (escalado a Discord)', 'No llego a Primer Mensaje'],
    datasets: [{
      data: [pmTotalSent, pmTotalFailed, pmTotalNoPm],
      backgroundColor: ['#27ae60', '#e74c3c', '#95a5a6'],
      datalabels: { color: '#fff', anchor: 'center', align: 'center' },
    }],
  },
  options: {
    plugins: { title: { display: true, text: 'Salud de envio WhatsApp (Primer Mensaje)' }, datalabels: { display: true, color: '#fff', font: { weight: 'bold', size: 14 } } },
  },
};

const QC = c => 'https://quickchart.io/chart?width=700&height=380&backgroundColor=white&c=' + encodeURIComponent(JSON.stringify(c));

const opts = { timeZone: 'America/Lima', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
const startStr = start.toLocaleString('es-PE', opts);
const endStr = now.toLocaleString('es-PE', opts);

const peores = sortedGap.filter(([,v]) => v.total >= 5 && v.gapPct >= 30).slice(0, 3);
const alertaHtml = peores.length > 0 ? (
  '<div style="background:#fdecea;border-left:4px solid #c0392b;padding:10px 14px;margin:14px 0;border-radius:4px">' +
  '<b>&#9888; Canales con gap critico (' + peores.length + '):</b><br>' +
  peores.map(([n,v]) => '&#9679; <b>' + n + '</b>: ' + v.gap + '/' + v.total + ' faltan (' + v.gapPct + '%)').join('<br>') +
  '</div>'
) : '<div style="background:#eafaf1;border-left:4px solid #27ae60;padding:10px 14px;margin:14px 0;border-radius:4px">&#10004; Todos los canales con cobertura saludable</div>';

// NEW: alert about WhatsApp send health + escalation
let waAlertHtml = '';
if (pmTotalFailed > 0) {
  const sortedByCh = Object.entries(failuresByChannel).sort((a,b) => b[1] - a[1]).slice(0, 5);
  waAlertHtml = '<div style="background:#fef5e7;border-left:4px solid #e67e22;padding:10px 14px;margin:14px 0;border-radius:4px">' +
    '<b>&#9888; ' + pmTotalFailed + ' silent failures de WhatsApp en ventana</b> (subscriber sin phone en ManyChat).<br>' +
    'Reenviados a Discord para gestion humana: <b>' + notifierStats.posted + '</b>.<br>' +
    (sortedByCh.length ? 'Distribucion por canal origen:<br>' + sortedByCh.map(([c,n]) => '&#9679; ' + c + ': ' + n).join('<br>') : '') +
    '</div>';
}

const totalExecsAll = Object.values(wfBreakdown).reduce((s,b) => s + b.total, 0);
const totalDiscordRoute = Object.values(wfBreakdown).reduce((s,b) => s + b.fromDiscord, 0);

const satColor = saturation.level === 'OK' ? '#27ae60' : saturation.level === 'BAJA' ? '#16a085' : saturation.level === 'MEDIA' ? '#f1c40f' : saturation.level === 'ALTA' ? '#e67e22' : '#c0392b';
const satHtml = '<div style="background:#f4f6f7;border-left:4px solid '+satColor+';padding:10px 14px;margin:14px 0;border-radius:4px"><b>Saturaci&oacute;n del servidor: <span style="color:'+satColor+'">'+saturation.level+'</span></b> (score '+saturation.score+'/10)<br>&#9679; Queue pending (new): <b>'+saturation.queueNew+'</b><br>&#9679; Running: <b>'+saturation.queueRunning+'</b><br>&#9679; Task-runner timeouts en ventana: <b>'+saturation.taskTimeouts+'</b><br>&#9679; PCL exec duration promedio: <b>'+(saturation.avgPclDurMs/1000).toFixed(1)+'s</b></div>';

const html = '<div style="font-family:sans-serif;max-width:760px">' +
  '<h2 style="margin-bottom:4px">Audit ATC &mdash; Resumen 12h</h2>' +
  '<p style="color:#666;margin-top:0">' + startStr + ' &rarr; ' + endStr + ' (Lima)</p>' +
  '<table style="border-collapse:collapse;width:100%;margin-bottom:8px"><tr>' +
  '<td style="padding:10px;background:#3498db;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + allDiscordPhones.size + '</b><br><small>Discord (unicos)</small></td>' +
  '<td style="padding:10px;background:#2ecc71;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + matched.length + '</b><br><small>En n8n</small></td>' +
  '<td style="padding:10px;background:#27ae60;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + pmTotalSent + '</b><br><small>WhatsApp OK</small></td>' +
  '<td style="padding:10px;background:#e74c3c;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + pmTotalFailed + '</b><br><small>Silent fail</small></td>' +
  '<td style="padding:10px;background:#e67e22;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + notifierStats.posted + '</b><br><small>Escalados</small></td>' +
  '</tr></table>' +
  '<table style="border-collapse:collapse;width:100%;margin-bottom:8px"><tr>' +
  '<td style="padding:8px;background:#34495e;color:#fff;text-align:center"><b style="font-size:16px">' + cobertura + '%</b><br><small>Cobertura Discord&rarr;n8n</small></td>' +
  '<td style="padding:8px;background:#16a085;color:#fff;text-align:center"><b style="font-size:16px">' + pmRate + '%</b><br><small>Tasa envio WhatsApp</small></td>' +
  '<td style="padding:8px;background:#7f8c8d;color:#fff;text-align:center"><b style="font-size:16px">' + notifierStats.runs + '</b><br><small>Notifier runs</small></td>' +
  '<td style="padding:8px;background:#7f8c8d;color:#fff;text-align:center"><b style="font-size:16px">' + missing.length + '</b><br><small>Faltan en n8n</small></td>' +
  '</tr></table>' +
  satHtml +
  alertaHtml +
  waAlertHtml +
  '<img src="' + QC(chartGap) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartWA) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartCobertura) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartGapPct) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartWf) + '" style="display:block;margin:16px 0;width:100%">' +
  '<div style="background:#f4f6f7;padding:10px 14px;margin-top:14px;border-radius:4px;font-size:12px;color:#555">' +
  '<b>Como leer estos numeros:</b><br>' +
  '&bull; <b>Discord (unicos)</b> = telefonos distintos notificados por bots en los 8 canales en las ultimas 12h.<br>' +
  '&bull; <b>WhatsApp OK</b> = ejecuciones n8n donde Primer Mensaje* devolvio status=success (mensaje realmente enviado).<br>' +
  '&bull; <b>Silent failure</b> = ejecuciones donde Primer Mensaje fallo (subscriber sin phone en ManyChat). NO se envio WhatsApp.<br>' +
  '&bull; <b>Escalados a Discord</b> = silent failures notificados al canal origen para gestion humana via Discord Error Notifier.<br>' +
  '&bull; <b>Tasa envio WhatsApp</b> = OK / (OK + silent failure). 100% = todos los leads que llegaron a Primer Mensaje recibieron mensaje.<br>' +
  '&bull; Total ejecuciones n8n: ' + totalExecsAll + '. De ellas, ' + totalDiscordRoute + ' vinieron de Discord-hoy.' +
  '</div>' +
  '<p style="color:#999;font-size:11px;margin-top:14px">Generado automaticamente cada 12h. n8n workflow audit-12h-resumen.</p>' +
  '</div>';

const subject = 'Audit ATC ' + endStr.slice(0,10) + ' &mdash; ' + cobertura + '% cobertura, ' + pmTotalFailed + ' silent fails, ' + notifierStats.posted + ' escalados';

return [{ json: { subject, html, totalDiscord: allDiscordPhones.size, totalN8n: allN8nPhones.size, matched: matched.length, missing: missing.length, cobertura, pmTotalSent, pmTotalFailed, pmTotalNoPm, escalated: notifierStats.posted, totalExecsAll } }];
