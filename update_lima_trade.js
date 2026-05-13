// Cambios combinados:
// 1. Closer Senior Lima → corregir modalidad de remoto a Presencial Barranco UTEC
// 2. Trade Marketing → aclarar oficina base en Barranco UTEC
// 3. Ambos: agregar campo "Expectativas Salariales" al form
// 4. Ambos: mapear ese campo a la columna "Espectativas" del Sheet

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';

function putWf(id, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      host: HOST, path: '/api/v1/workflows/' + id, method: 'PUT',
      headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode, body:d}));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function replaceOrFail(html, oldStr, newStr, label) {
  if (!html.includes(oldStr)) throw new Error(`${label}: no se encontró bloque: ${oldStr.slice(0,80)}...`);
  return html.replace(oldStr, newStr);
}

const expectativasField = {
  fieldLabel: 'Expectativas Salariales',
  placeholder: 'Ej: S/ 2,500 mensuales',
  requiredField: true,
};

function addExpectativasToForm(form) {
  const already = form.parameters.formFields.values.some(f => f.fieldLabel === 'Expectativas Salariales');
  if (already) {
    console.log('  (form ya tenía el campo Expectativas — omito)');
    return;
  }
  // Insertar antes del último campo (Cargar CV) para que CV quede último
  const fields = form.parameters.formFields.values;
  const cvIdx = fields.findIndex(f => f.fieldLabel === 'Cargar CV');
  if (cvIdx > 0) {
    fields.splice(cvIdx, 0, expectativasField);
  } else {
    fields.push(expectativasField);
  }
  console.log('  form: campo Expectativas Salariales añadido');
}

function addExpectativasToSheet(sheet) {
  sheet.parameters.columns.value.Espectativas =
    "={{ $('Application Form').item.json['Expectativas Salariales'] }}";
  // Asegurar que el schema tenga la columna (para que n8n no se queje)
  const schema = sheet.parameters.columns.schema || [];
  if (!schema.some(s => s.id === 'Espectativas')) {
    schema.push({
      id: 'Espectativas',
      displayName: 'Espectativas',
      required: false,
      defaultMatch: false,
      display: true,
      type: 'string',
      canBeUsedToMatch: true,
    });
    sheet.parameters.columns.schema = schema;
  }
  console.log('  sheet: columna Espectativas mapeada');
}

// ========================= CLOSER SENIOR =========================
async function updateCloser() {
  const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/closer_pre_field.json','utf8'));
  console.log('\n=== Closer Senior Lima (W1wk2gHhfp52Tuh3) ===');
  const html = w.nodes.find(n => n.type === 'n8n-nodes-base.html');
  let h = html.parameters.html;

  // Title
  h = replaceOrFail(h,
    '<title>Únete al equipo de Manzana Verde - Closer de Ventas Remotas</title>',
    '<title>Únete al equipo de Manzana Verde - Ejecutivo de Ventas Senior Lima</title>',
    'Closer title');

  // Hero h1
  h = replaceOrFail(h,
    '<h1>Closer de Ventas<br>Remotas</h1>',
    '<h1>Ejecutivo de Ventas Senior<br>Lima</h1>',
    'Closer h1');

  // Hero h2
  h = replaceOrFail(h,
    '<h2 style="font-weight: 400; margin-top: 5px;">¡Lidera nuestra revolución saludable desde donde estés!</h2>',
    '<h2 style="font-weight: 400; margin-top: 5px;">¡Lidera nuestra revolución saludable desde nuestra oficina en Barranco!</h2>',
    'Closer h2');

  // Hero p
  h = replaceOrFail(h,
    '<p>¿Tienes ADN comercial, te apasiona el bienestar y tienes un historial comprobado reventando cuotas a través de canales remotos? ¡Esta oportunidad es para ti!</p>',
    '<p>¿Tienes ADN comercial, te apasiona el bienestar y tienes un historial comprobado reventando cuotas? Súmate a Manzana Verde y trabaja presencial desde nuestras oficinas en Barranco (UTEC).</p>',
    'Closer hero p');

  // Autonomía li
  h = replaceOrFail(h,
    '<li><strong>Autonomía y Disponibilidad:</strong> Capacidad para trabajar desde casa con alta disciplina y proactividad. Disponibilidad inmediata.</li>',
    '<li><strong>Disponibilidad Presencial:</strong> Disponibilidad para trabajar 100% presencial en nuestras oficinas de Barranco (UTEC). Residencia en Lima. Disponibilidad inmediata.</li>',
    'Closer autonomia li');

  // Laptop li — quitar la mención de remota
  h = replaceOrFail(h,
    '<li><strong>Laptop propia (Indispensable):</strong> Contar con laptop personal en buen estado para uso laboral diario (modalidad 100% remota).</li>',
    '<li><strong>Laptop propia (Indispensable):</strong> Contar con laptop personal en buen estado para uso laboral diario.</li>',
    'Closer laptop li');

  // Cierre en Canales Remotos li
  h = replaceOrFail(h,
    '<li><strong>Cierre en Canales Remotos:</strong> Gestión, seguimiento y cierre experto de ventas vía WhatsApp, llamadas telefónicas, chat y plataformas CRM.</li>',
    '<li><strong>Cierre de Ventas:</strong> Gestión, seguimiento y cierre experto de ventas presenciales en oficina y por canales digitales (WhatsApp, llamadas, CRM).</li>',
    'Closer cierre li');

  // Modalidad grid-item
  h = replaceOrFail(h,
    '<div class="grid-item"><strong>Modalidad</strong><p>100% Presencial</p></div>',
    '<div class="grid-item"><strong>Modalidad</strong><p>100% Presencial — Barranco (oficinas UTEC).</p></div>',
    'Closer modalidad grid');

  html.parameters.html = h;

  // AI prompt
  const ai = w.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.chainLlm');
  ai.parameters.text = ai.parameters.text
    .replace('Ubicación: 100% Remoto', 'Ubicación: Lima, Perú — 100% Presencial en oficinas de Manzana Verde, Barranco (UTEC)')
    .replace('Modalidad de Trabajo: Capacidad para trabajar con autonomía de manera 100% remota.',
             'Disponibilidad Presencial: Residencia en Lima y disposición para trabajar 100% presencial en oficinas Barranco (UTEC).');
  console.log('  AI prompt: ubicación + modalidad corregidas');

  // Form fields
  const form = w.nodes.find(n => n.type === 'n8n-nodes-base.formTrigger');
  addExpectativasToForm(form);

  // Sheet
  const sheet = w.nodes.find(n => n.type === 'n8n-nodes-base.googleSheets');
  addExpectativasToSheet(sheet);

  w.nodes.forEach(n => { delete n.cid; delete n.creator; });
  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
  const r = await putWf('W1wk2gHhfp52Tuh3', payload);
  console.log('  PUT:', r.status, r.status===200?'OK':r.body.slice(0,400));
  if (r.status !== 200) throw new Error('Closer PUT failed');
}

// ========================= TRADE MARKETING =========================
async function updateTrade() {
  const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/trade_pre_field.json','utf8'));
  console.log('\n=== Trade Marketing (nkZyzT9z9KhTee61) ===');
  const html = w.nodes.find(n => n.type === 'n8n-nodes-base.html');
  let h = html.parameters.html;

  // grid-item Trabajo de Campo — mencionar Barranco UTEC como base
  h = replaceOrFail(h,
    '<div class="grid-item"><strong>Trabajo de Campo</strong><p>Movilidad rotativa entre sedes (Jesús María, Encalada, Rosa Toro, Miraflores y Guardia Civil).</p></div>',
    '<div class="grid-item"><strong>Modalidad</strong><p>Presencial — Oficina base en Barranco (UTEC), con trabajo de campo rotativo entre sedes (Jesús María, Encalada, Rosa Toro, Miraflores y Guardia Civil).</p></div>',
    'Trade modalidad grid');

  html.parameters.html = h;

  // AI prompt
  const ai = w.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.chainLlm');
  ai.parameters.text = ai.parameters.text.replace(
    'Ubicación: Presencial / Terreno (Lima, Perú)',
    'Ubicación: Lima, Perú — Presencial. Oficina base en Barranco (UTEC), con trabajo de campo rotativo entre sedes de Lima.'
  );
  console.log('  AI prompt: ubicación con Barranco UTEC');

  // Form fields
  const form = w.nodes.find(n => n.type === 'n8n-nodes-base.formTrigger');
  addExpectativasToForm(form);

  // Sheet
  const sheet = w.nodes.find(n => n.type === 'n8n-nodes-base.googleSheets');
  addExpectativasToSheet(sheet);

  w.nodes.forEach(n => { delete n.cid; delete n.creator; });
  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
  const r = await putWf('nkZyzT9z9KhTee61', payload);
  console.log('  PUT:', r.status, r.status===200?'OK':r.body.slice(0,400));
  if (r.status !== 200) throw new Error('Trade PUT failed');
}

(async () => {
  try { await updateCloser(); await updateTrade(); console.log('\nDone.'); }
  catch (e) { console.error('FAIL:', e.message); process.exit(1); }
})();
