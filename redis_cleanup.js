// CLEANUP: borra (1) keys de tests viejos y (2) keys de conversación sin TTL idle >= 7d.
// USA pipeline para batch eficiente. Reporta progreso.
const Redis = require('ioredis');

const redis = new Redis({
  host: 'redis-16865.c8.us-east-1-4.ec2.cloud.redislabs.com',
  port: 16865,
  password: 'SxA1vwSf8NvuKXknACJmEuk1ZiCjJVic',
  connectTimeout: 15000,
  maxRetriesPerRequest: 3,
});
redis.on('error', e => console.error('Redis error:', e.message));

const IDLE_THRESHOLD_DAYS = 7;
const IDLE_THRESHOLD_SEC = IDLE_THRESHOLD_DAYS * 86400;

// Patrones a borrar siempre (batch 1)
const TEST_PATTERNS = [/^T\d{10}_/, /^OPT\d{10}_/, /^STRESS_/, /^test_/, /^ST_/, /^URL_test_/, /^ls_/];
const TEST_PREFIX_GLOBS = ['T1774384076_*', 'OPT1774384340_*', 'STRESS_*', 'test_*', 'ST_*', 'URL_test_*', 'ls_*'];

// Patrones para batch 2 (idle >= 7d sin TTL)
const CONV_PATTERN = /^(user:|intencion_|Datos_)/;

async function memBefore() {
  const info = await redis.info('memory');
  return info.match(/used_memory_human:(\S+)/)?.[1];
}

(async () => {
  const memStart = await memBefore();
  const dbStart = await redis.dbsize();
  console.log('--- START ---');
  console.log('memory:', memStart, '| dbsize:', dbStart);
  console.log();

  // ───── BATCH 1: TESTS ─────
  console.log('=== BATCH 1: TESTS ===');
  let cursor = '0';
  const testKeys = [];
  do {
    const [next, keys] = await redis.scan(cursor, 'COUNT', 1000);
    cursor = next;
    for (const k of keys) {
      if (TEST_PATTERNS.some(re => re.test(k))) testKeys.push(k);
    }
  } while (cursor !== '0');
  console.log('keys de test encontradas:', testKeys.length);

  let deleted1 = 0;
  for (let i = 0; i < testKeys.length; i += 500) {
    const batch = testKeys.slice(i, i + 500);
    if (batch.length) {
      const n = await redis.del(...batch);
      deleted1 += n;
    }
  }
  console.log('eliminadas:', deleted1);
  console.log();

  // ───── BATCH 2: CONVERSACIONES IDLE >= 7d sin TTL ─────
  console.log(`=== BATCH 2: CONVERSACIONES idle >= ${IDLE_THRESHOLD_DAYS}d sin TTL ===`);
  cursor = '0';
  let scanned = 0, candidates = 0, deleted2 = 0;
  const byPrefix = {};
  let batch = [];

  do {
    const [next, keys] = await redis.scan(cursor, 'COUNT', 1000);
    cursor = next;
    if (!keys.length) continue;
    scanned += keys.length;

    // Filter only conv keys
    const convKeys = keys.filter(k => CONV_PATTERN.test(k));
    if (!convKeys.length) continue;

    // batch TTL + IDLETIME
    const pipe = redis.pipeline();
    for (const k of convKeys) { pipe.ttl(k); pipe.object('IDLETIME', k); }
    const res = await pipe.exec();

    for (let i = 0; i < convKeys.length; i++) {
      const ttl = res[i*2][1];
      const idle = res[i*2+1][1];
      if (ttl !== -1) continue;
      if (idle < IDLE_THRESHOLD_SEC) continue;
      candidates++;
      const prefix = convKeys[i].split(/[:_]/)[0];
      byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
      batch.push(convKeys[i]);
      if (batch.length >= 500) {
        const n = await redis.del(...batch);
        deleted2 += n;
        batch = [];
        if (deleted2 % 2000 === 0) console.log(`  ...deleted ${deleted2}`);
      }
    }
  } while (cursor !== '0');

  if (batch.length) { const n = await redis.del(...batch); deleted2 += n; }
  console.log('candidatos identificados:', candidates);
  console.log('eliminados:', deleted2);
  console.log('por prefijo:', JSON.stringify(byPrefix));
  console.log();

  // ───── FINAL ─────
  const memEnd = await memBefore();
  const dbEnd = await redis.dbsize();
  console.log('--- END ---');
  console.log('memory:', memStart, '→', memEnd);
  console.log('dbsize:', dbStart, '→', dbEnd, `(borrado: ${dbStart - dbEnd})`);
  console.log('total borrado:', deleted1 + deleted2);

  await redis.quit();
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
