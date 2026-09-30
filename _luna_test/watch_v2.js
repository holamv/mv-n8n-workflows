// Vigila la regla de ambito v2 + el canario ATC. Uso: node _luna_test/watch_v2.js "<isoDeployV2>" <minutos>
const { execSync } = require('child_process');
const DEPLOY = process.argv[2], MIN = parseInt(process.argv[3] || '40', 10);
const END = Date.now() + MIN * 60e3;
(async () => {
  while (true) {
    console.log('\n===== ' + new Date().toISOString() + ' =====');
    try { console.log(execSync(`node _luna_test/scope_audit.js "${DEPLOY}"`, { encoding: 'utf8', timeout: 590000 })); }
    catch (e) { console.log('audit fallo: ' + String(e.message).slice(0, 200)); }
    if (Date.now() >= END) break;
    await new Promise(r => setTimeout(r, 15 * 60e3));
  }
  console.log('\n===== fin de la vigilancia de la regla v2 =====');
})();
