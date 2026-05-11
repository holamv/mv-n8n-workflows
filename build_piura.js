// Construye y crea el workflow "Filtro de CVs Ventas Senior Piura"
// clonando el de Lima (AiBbFiAM1zrcuEYL) con los cambios especificados.

const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';

const src = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/filtro_cvs_ventas_lima.json', 'utf8'));

// ---------- Mutadores ----------
const newWebhookId = () => crypto.randomUUID();
const newNodeId = () => crypto.randomUUID();

const nodes = JSON.parse(JSON.stringify(src.nodes));

// 1) Webhook landing -> /webhook/candidatoventaspiura
const wh = nodes.find(n => n.name === 'Webhook');
wh.parameters.path = 'candidatoventaspiura';
wh.webhookId = newWebhookId();
wh.id = newNodeId();

// 2) HTML (página de oferta) — reemplazo COMPLETO con datos Piura
const html = nodes.find(n => n.name === 'HTML');
html.id = newNodeId();
html.parameters.html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Únete al equipo de Manzana Verde - Ejecutivo de Ventas Senior Piura</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f7f6;
            color: #333;
        }

        .container {
            max-width: 900px;
            margin: 40px auto;
            padding: 0;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .hero {
            text-align: center;
            padding: 50px 20px;
            background-color: #4CAF50;
            color: white;
        }

        .hero h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 700;
        }

        .hero h2 {
            margin-top: 10px;
            font-weight: 400;
            font-size: 1.5em;
        }

        .hero p {
            font-size: 1.1em;
            font-weight: 300;
            max-width: 700px;
            margin: 20px auto 0;
        }

        .job-details {
            padding: 30px;
        }

        .job-details h3 {
            color: #2e7d32;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
            font-size: 1.6em;
            margin-top: 30px;
            margin-bottom: 20px;
        }

        .job-details ul {
            list-style: none;
            padding: 0;
        }

        .job-details ul li {
            background: url('https://img.icons8.com/color/16/000000/checked-2.png') no-repeat left center;
            padding-left: 30px;
            margin-bottom: 15px;
            font-size: 1.1em;
            line-height: 1.6;
            color: #555;
        }

        .benefits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .benefit-item {
            background-color: #e8f5e9;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 5px solid #4CAF50;
        }

        .benefit-item strong {
            display: block;
            margin-bottom: 10px;
            color: #2e7d32;
        }

        .apply-section {
            text-align: center;
            padding: 40px 20px;
            background-color: #f9f9f9;
            margin-top: 30px;
        }

        .apply-section p {
            font-size: 1.2em;
            margin-bottom: 25px;
        }

        .apply-button {
            display: inline-block;
            background-color: #ff9800;
            color: white;
            padding: 15px 35px;
            font-size: 1.2em;
            font-weight: 600;
            text-decoration: none;
            border-radius: 50px;
            transition: background-color 0.3s ease, transform 0.2s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .apply-button:hover {
            background-color: #f57c00;
            transform: translateY(-2px);
        }

        .footer {
            text-align: center;
            padding: 20px;
            margin-top: 40px;
            font-size: 0.9em;
            color: #777;
        }

    </style>
</head>
<body>

    <div class="container">
        <div class="hero">
            <h1>Ejecutivo de Ventas Senior - Piura</h1>
            <h2 style="font-weight: 400; margin-top: 5px;">¡Únete al equipo de <strong>Manzana Verde</strong>!</h2>
            <p>¿Tienes experiencia consolidada en ventas y te apasiona el bienestar? Buscamos un Ejecutivo Senior para liderar la venta de planes de alimentación en nuestra Franquicia de Piura.</p>
        </div>

        <div class="job-details">
            <h3>Misión del Puesto</h3>
            <p style="font-size: 1.1em; color: #555;">Lograr satisfactoriamente la venta presencial de planes de alimentación a los clientes que visitan la Franquicia de Piura de Manzana Verde, asegurando una experiencia premium y un cierre efectivo.</p>

            <h3>Funciones Principales</h3>
            <ul>
                <li>Venta presencial y orientación de nuestros planes de alimentación en oficina.</li>
                <li>Seguimiento personalizado a clientes y prospectos, brindando asesoría experta.</li>
                <li>Gestión de consultas y cierre de ventas en piso.</li>
                <li>Identificación de oportunidades de mejora en la experiencia del cliente.</li>
                <li>Elaboración de informes diarios de ventas y seguimiento de objetivos.</li>
            </ul>

            <h3>Requisitos</h3>
            <ul>
                <li>Experiencia comprobada en ventas (mínimo 3 años) — preferentemente presencial, asesoría en tienda u oficina, o ventas consultivas.</li>
                <li>Excelentes habilidades de comunicación, negociación y cierre.</li>
                <li>Residencia en Piura y disponibilidad para trabajo 100% presencial.</li>
                <li>Proactividad, autonomía y enfoque en resultados.</li>
                <li>Manejo de herramientas de ofimática y, deseable, CRM.</li>
                <li>¡Disponibilidad inmediata!</li>
            </ul>

            <h3>Te Ofrecemos</h3>
            <div class="benefits-grid">
                <div class="benefit-item"><strong>Trabajo Presencial</strong><p>En nuestra Franquicia de Piura — ambiente dinámico y enfocado en el bienestar.</p></div>
                <div class="benefit-item"><strong>Sueldo Competitivo</strong><p>Remuneración base de S/2500 + comisiones de hasta S/1200 adicionales por desempeño.</p></div>
                <div class="benefit-item"><strong>Horario Definido</strong><p>11:00 am - 8:00 pm de Lunes a Sábado. Descanso los domingos.</p></div>
                <div class="benefit-item"><strong>Crecimiento Profesional</strong><p>Oportunidades de desarrollo y línea de carrera en una empresa en expansión.</p></div>
                <div class="benefit-item"><strong>Beneficios Corporativos</strong><p>Descuentos especiales en nuestros planes de alimentación.</p></div>
                <div class="benefit-item"><strong>Misión con Propósito</strong><p>Transformamos vidas a través de la alimentación saludable.</p></div>
            </div>
        </div>

        <div class="apply-section">
            <p><strong>¡Forma parte de una misión que transforma vidas a través de la alimentación saludable!</strong></p>
            <a href="https://n8n.manzanaverde.la/form/candidatosventaspiura" target="_blank" class="apply-button">Postula Aquí</a>
        </div>
    </div>

    <footer class="footer">
        <p>&copy; 2025 Manzana Verde. Todos los derechos reservados.</p>
    </footer>

</body>
</html>`;

// 3) Respond to Webhook (sin cambios funcionales, regenero id)
const respond = nodes.find(n => n.name === 'Respond to Webhook');
respond.id = newNodeId();

// 4) Webhook1 -> /webhook/RegistroPiura
const wh1 = nodes.find(n => n.name === 'Webhook1');
wh1.parameters.path = 'RegistroPiura';
wh1.webhookId = newWebhookId();
wh1.id = newNodeId();

// 5) Edit Fields — sin cambios, regenero id
const edit = nodes.find(n => n.name === 'Edit Fields');
edit.id = newNodeId();

// 6) Application Form — nuevo path + título
const form = nodes.find(n => n.name === 'Application Form');
form.parameters.path = 'candidatosventaspiura';
form.parameters.formTitle = 'Envíe su solicitud de postulación a Manzana Verde — Piura';
form.parameters.formDescription = 'Por favor, rellene el siguiente formulario y cargue su CV para postularse al puesto de Ejecutivo de Ventas Senior en Piura.';
form.webhookId = newWebhookId();
form.id = newNodeId();

// 7) Log Candidate Submission — cambia Puesto
const logCand = nodes.find(n => n.name === 'Log Candidate Submission');
logCand.parameters.columns.value.Puesto = 'Ejecutivo de Ventas Senior - Piura';
logCand.id = newNodeId();

// 8) Add CV Analysis — sin cambios funcionales
const addCv = nodes.find(n => n.name === 'Add CV Analysis');
addCv.id = newNodeId();

// 9) JSON Output Parser — sin cambios
const parser = nodes.find(n => n.name === 'JSON Output Parser');
parser.id = newNodeId();

// 10) AI Qualification — actualizo prompt para perfil Senior + Piura presencial
const ai = nodes.find(n => n.name === 'AI Qualification');
ai.id = newNodeId();
ai.parameters.text = `=<goal>
Tu objetivo principal es evaluar el CV que es este {{ $json.text }} de un candidato comparándolo con los requisitos del puesto proporcionados. Debes determinar si el candidato está cualificado y generar una salida JSON cruda que contenga un puntaje de cualificación y una explicación concisa y basada en evidencia para dicho puntaje.
</goal>

<context>
<job_requirements>

Perfil del Puesto: Ejecutivo de Ventas Senior - Piura
Título del Puesto: Ejecutivo de Ventas Senior
Ubicación: Piura, Perú (Trabajo 100% presencial en la Franquicia de Piura)
Horario: Lunes a Sábado, 11:00 am - 8:00 pm. Descanso domingos.
Remuneración: S/2500 base + comisiones de hasta S/1200.

Sobre el Rol:
Buscamos un Ejecutivo de Ventas Senior con experiencia comprobada para liderar la venta presencial de planes de alimentación en nuestra Franquicia de Piura. Tu misión será cerrar ventas, asesorar a clientes en piso y representar la marca Manzana Verde con un servicio premium.

Responsabilidades Clave:
- Venta presencial y orientación de planes de alimentación a clientes que visitan la franquicia.
- Seguimiento personalizado a prospectos y clientes recurrentes.
- Gestión de consultas y cierre efectivo en piso.
- Identificación de oportunidades de mejora en la experiencia del cliente.
- Elaboración y presentación de informes diarios de ventas.

CRITERIOS DE EVALUACIÓN

Requisitos Esenciales (Indispensables)
- Experiencia: Mínimo 3 años de experiencia comprobada en ventas (presenciales, retail, asesoría en tienda/oficina, o ventas consultivas). NO es suficiente solo call center si no hay componente presencial o consultivo.
- Habilidades de Comunicación: Excelentes habilidades de comunicación verbal, negociación, persuasión y cierre.
- Disponibilidad presencial: Residencia en Piura o disposición clara para trabajar 100% presencial en Piura, L-Sáb 11am-8pm.
- Herramientas: Manejo de ofimática y, deseable, sistemas de gestión / CRM.

Cualificaciones Preferidas (Deseables)
- Experiencia Sectorial: Sector alimentario, nutricional, wellness, retail premium o servicios.
- Liderazgo: Experiencia liderando o coordinando equipos pequeños de ventas.
- CRM: Familiaridad con Salesforce, HubSpot u otro CRM.
- Conocimientos en Nutrición: Conocimientos o interés demostrable en nutrición y estilos de vida saludables.
- Técnicas de Venta: Conocimiento de metodologías de venta (SPIN, consultiva, etc.).
- Adaptabilidad: Experiencia en entornos dinámicos / startups / franquicias.

</job_requirements>

<qualifiaction>
# Cómo Evalúo
Mi análisis se basa en dos categorías: "Requisitos Esenciales" (indispensables) y "Cualificaciones Preferidas" (bonificaciones). Mi resultado final es un puntaje y una justificación concisa, citando evidencia específica del CV.

# Lógica de Evaluación
- El \`qualificationRate\` es un puntaje de 0.0 a 1.0.
- **Requisitos Esenciales**: Si falta uno o más, el puntaje no puede superar 0.6. Si cumple todos, el puntaje es de al menos 0.75.
- **Penalización Piura**: Si el CV NO indica residencia en Piura, región norte, o experiencia/disposición presencial clara, restar 0.15 al puntaje final (no bajar de 0.0).
- **Cualificaciones Preferidas**: Cada una que se cumple incrementa el puntaje hacia 1.0.
- La \`explanation\` debe ser un análisis puntual y directo, justificando el puntaje al citar la evidencia (o la falta de ella) del CV para cada requisito clave.
</qualifiaction>
</context>

<output_format>
Debes producir un único objeto JSON crudo. No agregues texto conversacional, saludos o explicaciones fuera de la estructura JSON. El objeto JSON debe adherirse estrictamente al siguiente formato:
\`\`\`json
{
  "explanation": "<string en español, conciso y puntual>",
  "qualificationRate": <number>
}`;

// 11) Upload file — MISMA carpeta Drive
const upload = nodes.find(n => n.name === 'Upload file');
upload.id = newNodeId();
// folderId ya apunta a 1gpcZAsqfA-xMWOQ8eO5O2DHBIAj6VBXj (CVs Candidatos Ventas) — sin cambios

// 12) Add CV Analysis1 — sin cambios funcionales
const addCv1 = nodes.find(n => n.name === 'Add CV Analysis1');
addCv1.id = newNodeId();

// 13) Merge — sin cambios
const merge = nodes.find(n => n.name === 'Merge');
merge.id = newNodeId();

// 14) If — sin cambios
const ifNode = nodes.find(n => n.name === 'If');
ifNode.id = newNodeId();

// 15) Send a message — cambia subject + body
const send = nodes.find(n => n.name === 'Send a message');
send.id = newNodeId();
send.webhookId = newWebhookId();
send.parameters.subject = "=Te invitamos a ser parte de nuestro Proceso de Selección como Ejecutivo de Ventas Senior - Piura!! - {{ $('Application Form').item.json['Nombre Completo'] }}";
send.parameters.message = "=<h1>Bienvenido a nuestro proceso de Selección para Ejecutivo de Ventas Senior - Piura</h1> <p>Te damos la bienvenida <strong>{{ $('Application Form').item.json['Nombre Completo'] }}</strong> e invitamos a continuar el proceso completando la siguiente prueba.</p>  <h3>Detalles de la Postulación:</h3> <ul>   <li><strong>URL:</strong> https://selecci-n-mv-212962882251.us-west1.run.app/</li>   <li><strong>Duración:</strong> 30 min.</li>   <li><strong>Plazo:</strong> 1 día después de recibido este mensaje.</li>   <li><strong>Modalidad:</strong> Presencial en oficinas de la Franquicia de Piura, L-Sáb 11am-8pm.</li> </ul>  <p>Te deseamos lo mejor en este proceso, da lo mejor de ti.</p>";

// 16) If1 — sin cambios
const if1 = nodes.find(n => n.name === 'If1');
if1.id = newNodeId();

// 17) Get row(s) in sheet — sin cambios
const getRows = nodes.find(n => n.name === 'Get row(s) in sheet');
getRows.id = newNodeId();

// 18) Code in JavaScript — sin cambios
const code = nodes.find(n => n.name === 'Code in JavaScript');
code.id = newNodeId();

// 19) Extract from File — sin cambios
const extract = nodes.find(n => n.name === 'Extract from File');
extract.id = newNodeId();

// 20) OpenAI Chat Model — sin cambios
const openai = nodes.find(n => n.name === 'OpenAI Chat Model');
openai.id = newNodeId();

// Limpiar campos no estándar (cid, creator) que rechaza el Public API
nodes.forEach(n => {
  delete n.cid;
  delete n.creator;
});

// ---------- Payload final ----------
const payload = {
  name: 'Filtro de CVs Ventas Senior Piura',
  nodes,
  connections: src.connections,
  settings: { executionOrder: 'v1' },
};

fs.writeFileSync('c:/Proyectos/n8n/filtro_cvs_ventas_senior_piura.json', JSON.stringify(payload, null, 2));
console.log('Payload listo. Nodos:', payload.nodes.length);

// ---------- Crear workflow ----------
const body = JSON.stringify(payload);

const req = https.request({
  host: HOST,
  path: '/api/v1/workflows',
  method: 'POST',
  headers: {
    'X-N8N-API-KEY': API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data.slice(0, 3000));
    try {
      const j = JSON.parse(data);
      if (j.id) {
        console.log('--> Workflow ID:', j.id, '| Name:', j.name, '| Active:', j.active);
      }
    } catch {}
  });
});
req.on('error', e => console.error('ERR:', e.message));
req.write(body);
req.end();
