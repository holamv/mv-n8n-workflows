// Construye y crea "Filtro de CVs Ventas Senior Piura" clonando el workflow
// COORDINADOR (W1wk2gHhfp52Tuh3) — el que realmente tiene contenido de Ventas Senior.

const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';

const src = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/_coordinador.json', 'utf8'));

const newId = () => crypto.randomUUID();
const nodes = JSON.parse(JSON.stringify(src.nodes));

// 1) Webhook landing — path único
const wh = nodes.find(n => n.name === 'Webhook');
wh.parameters.path = 'EjecutivoSeniorPiura';
wh.id = newId(); wh.webhookId = newId();

// 2) HTML — reemplazo completo con datos Piura
const html = nodes.find(n => n.name === 'HTML');
html.id = newId();
html.parameters.html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Únete al equipo de Manzana Verde - Ejecutivo de Ventas Senior Piura</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

        body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; color: #333; }
        .container { max-width: 900px; margin: 40px auto; padding: 0; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .hero { text-align: center; padding: 50px 20px; background-color: #4CAF50; color: white; }
        .hero h1 { margin: 0; font-size: 2.5em; font-weight: 700; }
        .hero h2 { margin-top: 10px; font-weight: 400; font-size: 1.5em; }
        .hero p { font-size: 1.1em; font-weight: 300; max-width: 700px; margin: 20px auto 0; }
        .job-details { padding: 30px; }
        .job-details h3 { color: #2e7d32; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; font-size: 1.6em; margin-top: 30px; margin-bottom: 20px; }
        .job-details ul { list-style: none; padding: 0; }
        .job-details ul li { background: url('https://img.icons8.com/color/16/000000/checked-2.png') no-repeat left center; padding-left: 30px; margin-bottom: 15px; font-size: 1.1em; line-height: 1.6; color: #555; }
        .grid-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .grid-item { background-color: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center; border-left: 5px solid #4CAF50; }
        .grid-item strong { display: block; margin-bottom: 10px; color: #2e7d32; font-size: 1.1em; }
        .apply-section { text-align: center; padding: 40px 20px; background-color: #f9f9f9; margin-top: 30px; }
        .apply-section p { font-size: 1.2em; margin-bottom: 25px; }
        .apply-button { display: inline-block; background-color: #ff9800; color: white; padding: 15px 35px; font-size: 1.2em; font-weight: 600; text-decoration: none; border-radius: 50px; transition: background-color 0.3s ease, transform 0.2s ease; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .apply-button:hover { background-color: #f57c00; transform: translateY(-2px); }
        .footer { text-align: center; padding: 20px; margin-top: 40px; font-size: 0.9em; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>Ejecutivo de Ventas Senior<br>Piura</h1>
            <h2 style="font-weight: 400; margin-top: 5px;">¡Lidera nuestra revolución saludable en la Franquicia Piura!</h2>
            <p>¿Tienes ADN comercial, te apasiona el bienestar y tienes un historial comprobado cerrando ventas? Súmate a Manzana Verde Piura y reventemos cuotas juntos.</p>
        </div>

        <div class="job-details">

            <h3>¿Qué buscamos en ti?</h3>
            <ul>
                <li><strong>Experiencia Comercial Senior:</strong> Mínimo 3 años en ventas consultivas, presenciales, Call Center o gestión comercial B2C (preferencia en foodtech, nutrición, salud o retail premium).</li>
                <li><strong>Dominio de Cierre:</strong> Experiencia exitosa cerrando ventas en piso, telefónicas y digitales usando CRMs (HubSpot, Salesforce o similares).</li>
                <li><strong>Habilidades "Closer":</strong> Excelentes habilidades de comunicación, persuasión, seguimiento implacable y orientación absoluta al cliente.</li>
                <li><strong>Mindset de Alto Rendimiento:</strong> Actitud resiliente, tolerancia a la frustración y un fuerte enfoque en el cumplimiento de metas (¡hambre de comisiones!).</li>
                <li><strong>Disponibilidad Presencial:</strong> Residencia en Piura y disponibilidad para trabajar 100% presencial en nuestras oficinas de la Franquicia Piura. Disponibilidad inmediata.</li>
            </ul>

            <h3>Tus Retos Diarios (Funciones)</h3>
            <p style="font-size: 1.1em; color: #555; line-height: 1.6; margin-bottom: 20px;">
                <strong>Propósito:</strong> Liderar el cierre de ventas de nuestros planes de alimentación en la Franquicia Piura, convirtiendo prospectos en clientes fidelizados con una tasa de conversión sobresaliente.
            </p>
            <ul>
                <li><strong>Cierre en Piso y Canales Remotos:</strong> Atención y cierre experto de ventas presenciales, vía WhatsApp, llamadas telefónicas, chat y plataformas CRM.</li>
                <li><strong>Asesoría Estratégica:</strong> Brindar orientación personalizada entendiendo las necesidades de salud de los clientes para ofrecer el plan ideal y garantizar su retención.</li>
                <li><strong>Gestión de Pipeline:</strong> Administración eficiente de la cartera aplicando técnicas de venta cruzada (cross-selling) y aumento de valor de compra (up-selling).</li>
                <li><strong>Manejo de Objeciones:</strong> Resolución de consultas complejas y derribo de objeciones con empatía y asertividad comercial.</li>
                <li><strong>Análisis y Optimización:</strong> Identificar cuellos de botella en el embudo, proponer mejoras proactivas y elaborar reportes diarios de métricas.</li>
                <li><strong>Funciones generales:</strong> Funciones encargadas por la jefatura alineadas al puesto.</li>
            </ul>

            <h3>¿Qué te ofrecemos?</h3>
            <div class="grid-container">
                <div class="grid-item"><strong>Sueldo Base</strong><p>S/ 2,500 mensuales asegurados.</p></div>
                <div class="grid-item"><strong>Comisiones</strong><p>Hasta S/ 1,200 adicionales por superación de metas.</p></div>
                <div class="grid-item"><strong>Modalidad</strong><p>100% Presencial — Franquicia Piura.</p></div>
                <div class="grid-item"><strong>Horario</strong><p>Lunes a Sábado, 11:00 am a 8:00 pm. Descanso domingo.</p></div>
                <div class="grid-item"><strong>Beneficios</strong><p>Descuentos exclusivos en planes de alimentación.</p></div>
                <div class="grid-item"><strong>Crecimiento</strong><p>Línea de carrera en una startup líder en Latam.</p></div>
            </div>

        </div>

        <div class="apply-section">
            <p><strong>¡Súmate a Manzana Verde Piura y sé el motor de nuestras ventas!</strong></p>
            <a href="https://n8n.manzanaverde.la/form/ventassenior-piura" target="_blank" class="apply-button">Postula Aquí</a>
        </div>
    </div>

    <footer class="footer">
        <p>&copy; 2026 Manzana Verde. Todos los derechos reservados.</p>
    </footer>
</body>
</html>`;

// 3) Respond to Webhook
const respond = nodes.find(n => n.name === 'Respond to Webhook');
respond.id = newId();

// 4) Webhook1 — UUID path, regenero ambos
const wh1 = nodes.find(n => n.name === 'Webhook1');
wh1.parameters.path = newId(); // mantengo formato UUID como original
wh1.id = newId(); wh1.webhookId = newId();

// 5) Edit Fields
const ef = nodes.find(n => n.name === 'Edit Fields');
ef.id = newId();

// 6) Application Form — path único Piura
const form = nodes.find(n => n.type === 'n8n-nodes-base.formTrigger');
form.parameters.options.path = 'ventassenior-piura';
form.parameters.formTitle = 'Envíe su solicitud — Ejecutivo de Ventas Senior Piura';
form.parameters.formDescription = 'Por favor, rellene el siguiente formulario y cargue su CV para postularse al puesto de Ejecutivo de Ventas Senior en nuestra Franquicia Piura.';
form.id = newId(); form.webhookId = newId();

// 7) Add CV Analysis (Sheet) — actualizo Puesto
const sheet = nodes.find(n => n.type === 'n8n-nodes-base.googleSheets');
sheet.parameters.columns.value.Puesto = 'Ejecutivo de Ventas Senior - Piura';
sheet.id = newId();

// 8) JSON Output Parser
const parser = nodes.find(n => n.name === 'JSON Output Parser');
parser.id = newId();

// 9) Upload file — misma carpeta Drive (14ouFiAonsUn39XGQh1qfbX7w02z38gMp) ya está en el source
const upload = nodes.find(n => n.name === 'Upload file');
upload.id = newId();

// 10) Merge
const merge = nodes.find(n => n.name === 'Merge');
merge.id = newId();

// 11) If
const ifNode = nodes.find(n => n.name === 'If');
ifNode.id = newId();

// 12) Send a message (Gmail) — subject + body Piura
const gmail = nodes.find(n => n.type === 'n8n-nodes-base.gmail');
gmail.id = newId(); gmail.webhookId = newId();
gmail.parameters.subject = "=Te invitamos a ser parte de nuestro Proceso de Selección como Ejecutivo de Ventas Senior — Piura!! - {{ $('Application Form').item.json['Nombre Completo'] }}";
gmail.parameters.message = "=<h1>Bienvenido a nuestro proceso de Selección para Ejecutivo de Ventas Senior — Piura</h1> <p>Te damos la bienvenida <strong>{{ $('Application Form').item.json['Nombre Completo'] }}</strong> e invitamos a continuar el proceso completando la siguiente prueba.</p>  <h3>Detalles de la Postulación:</h3> <ul>   <li><strong>URL:</strong> https://selecci-n-mv-122128215533.us-west1.run.app/</li>   <li><strong>Duración:</strong> 30 min.</li>   <li><strong>Plazo:</strong> 1 día después de recibido este mensaje.</li>   <li><strong>Modalidad:</strong> 100% presencial en oficinas de la Franquicia Piura, L-Sáb 11am-8pm (descanso domingo).</li> </ul>  <p>Te deseamos lo mejor en este proceso, da lo mejor de ti.</p>";

// 13) Calificador IA — prompt actualizado Piura
const ai = nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.chainLlm');
ai.id = newId();
ai.parameters.text = `=<goal>
Tu objetivo principal es evaluar el CV que es este {{ $json.text }} de un candidato comparándolo con los requisitos del puesto proporcionados. Debes determinar si el candidato está cualificado y generar una salida JSON cruda que contenga un puntaje de cualificación y una explicación concisa y basada en evidencia para dicho puntaje.
</goal>

<context>
<job_requirements>

Título del Puesto: Ejecutivo de Ventas Senior - Piura
Ubicación: Piura, Perú — 100% Presencial en la Franquicia Piura.
Horario: Lunes a Sábado, 11:00 a.m. - 8:00 p.m. Descanso domingo.
Remuneración: S/2,500 base + comisiones de hasta S/1,200.

Sobre el Rol:
En Manzana Verde buscamos un Ejecutivo de Ventas Senior apasionado por las ventas y el bienestar para liderar la venta presencial de planes de alimentación en nuestra Franquicia Piura. Tu misión será cerrar ventas en piso, asesorar clientes y representar la marca con un servicio premium.

Responsabilidades Clave:

Cerrar ventas presenciales y por canales digitales/telefónicos sobre los planes de alimentación.

Realizar seguimiento personalizado y ofrecer asesoría integral basada en las necesidades de salud del cliente.

Gestionar la cartera de clientes, atendiendo y resolviendo consultas complejas sobre los planes.

Identificar proactivamente oportunidades de mejora en la experiencia del cliente y en el embudo de ventas.

Elaborar y analizar informes diarios de ventas y métricas de conversión.

CRITERIOS DE EVALUACIÓN

Requisitos Esenciales (Indispensables)
Experiencia: Mínimo 3 años comprobados como Senior en ventas (presenciales, retail/tienda, asesoría consultiva, call center o canales digitales).

Habilidades Comerciales: Excelentes habilidades de comunicación, persuasión, manejo de objeciones, cierre y orientación al cliente.

Enfoque a Resultados: Actitud resiliente, tolerancia a la frustración y un fuerte enfoque en el cumplimiento de metas comerciales.

Disponibilidad Horaria: Capacidad para trabajar de Lunes a Sábado, 11:00 a.m. - 8:00 p.m. (descanso domingo).

Disponibilidad Presencial: Residencia en Piura o disposición clara para trabajar 100% presencial en oficinas de la Franquicia Piura.

Incorporación: Disponibilidad inmediata.

Cualificaciones Preferidas (Deseables)
Conocimiento del Sector: Experiencia previa en sector alimentario, nutricional, salud/bienestar, retail premium o servicios.

CRM: Familiaridad con HubSpot, Salesforce u otro CRM.

Liderazgo: Experiencia liderando o coordinando equipos pequeños de ventas.

Proactividad Comercial: Capacidad para identificar oportunidades de mejora y proponer soluciones dentro del proceso de ventas.

Análisis de Datos: Familiaridad con la interpretación de reportes diarios y métricas de conversión.

Adaptabilidad: Experiencia en entornos dinámicos / startups / franquicias.

</job_requirements>

<qualifiaction>
# Cómo Evalúo
Mi análisis se basa en dos categorías: "Requisitos Esenciales" (indispensables) y "Cualificaciones Preferidas" (bonificaciones). Mi resultado final es un puntaje y una justificación concisa, citando evidencia específica del CV.

# Lógica de Evaluación
- El \`qualificationRate\` es un puntaje de 0.0 a 1.0.
- **Requisitos Esenciales**: Si falta uno o más, el puntaje no puede superar 0.6. Si cumple todos, el puntaje es de al menos 0.75.
- **Penalización Piura**: Si el CV NO indica residencia en Piura/región norte o disposición clara para trabajo presencial en Piura, restar 0.15 al puntaje final (no bajar de 0.0).
- **Cualificaciones Preferidas**: Cada una que se cumple aumenta el puntaje hacia 1.0.
- La \`explanation\` debe ser un análisis puntual y directo, justificando el puntaje al citar la evidencia (o la falta de ella) del CV para cada requisito.
</qualifiaction>
</context>

<output_format>
Debes producir un único objeto JSON crudo. No agregues texto conversacional, saludos o explicaciones fuera de la estructura JSON. El objeto JSON debe adherirse estrictamente al siguiente formato:
\`\`\`json
{
  "explanation": "<string en español, conciso y puntual>",
  "qualificationRate": <number>
}`;

// 14-18) Resto de nodos — solo regenerar id
['Code in JavaScript', 'Extract from File', 'OpenAI Chat Model', 'If isPDF', 'Extraer Texto DOCX'].forEach(name => {
  const n = nodes.find(x => x.name === name);
  if (n) n.id = newId();
});

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

fs.writeFileSync('c:/Proyectos/n8n/filtro_cvs_ventas_senior_piura_v2.json', JSON.stringify(payload, null, 2));
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
    if (res.statusCode !== 200) {
      console.log('Body:', data.slice(0, 2000));
      return;
    }
    try {
      const j = JSON.parse(data);
      console.log('--> Workflow ID:', j.id);
      console.log('--> Name:', j.name);
      console.log('--> Active:', j.active);
    } catch {
      console.log('Body:', data.slice(0, 1000));
    }
  });
});
req.on('error', e => console.error('ERR:', e.message));
req.write(body);
req.end();
