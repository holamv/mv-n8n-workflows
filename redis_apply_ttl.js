// Aplica TTL a keys sin TTL existentes según patrón.
// Idempotente: si una key ya tiene TTL, la salta.
const Redis = require('ioredis');

const redis = new Redis({
  host: 'redis-16865.c8.us-east-1-4.ec2.cloud.redislabs.com',
  port: 16865,
  password: 'SxA1vwSf8NvuKXknACJmEuk1ZiCjJVic',
  connectTimeout: 15000,
  maxRetriesPerRequest: 3,
});
redis.on('error', e => console.error('Redis error:', e.message));

// Reglas de TTL por patrón (en segundos)
const TTL_RULES = [
  { test: k => /^user:/.test(k),               ttl: 14 * 86400, label: 'user:* (chat memory)' },
  { test: k => /^intencion_/.test(k),          ttl: 14 * 86400, label: 'intencion_*' },
  { test: k => /^Datos_/.test(k),              ttl: 30 * 86400, label: 'Datos_*' },
  { test: k => /^tpl_primer_pedido_/.test(k),  ttl: 30 * 86400, label: 'tpl_primer_pedido_*' },
  { test: k => /^consulta_dedup_/.test(k),     ttl: 3600,       label: 'consulta_dedup_*' },
];

(async () => {
  const startDb = await redis.dbsize();
  console.log('--- START ---');
  console.log('dbsize:', startDb);
  console.log();

  let cursor = '0', scanned = 0;
  const stats = {}; // label → {applied, skippedHasTTL, skippedNoMatch}
  for (const r of TTL_RULES) stats[r.label] = { applied: 0, skippedHasTTL: 0 };
  const unmatched = { count: 0, samples: [] };

  do {
    const [next, keys] = await redis.scan(cursor, 'COUNT', 1000);
    cursor = next;
    if (!keys.length) continue;
    scanned += keys.length;

    // batch TTL check
    const ttlPipe = redis.pipeline();
    for (const k of keys) ttlPipe.ttl(k);
    const ttlRes = await ttlPipe.exec();

    // build EXPIRE batch
    const expirePipe = redis.pipeline();
    const expiringKeys = [];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const ttl = ttlRes[i][1];
      const rule = TTL_RULES.find(r => r.test(k));
      if (!rule) {
        if (ttl === -1) {
          unmatched.count++;
          if (unmatched.samples.length < 10) unmatched.samples.push(k);
        }
        continue;
      }
      if (ttl !== -1) { stats[rule.label].skippedHasTTL++; continue; }
      expirePipe.expire(k, rule.ttl);
      expiringKeys.push({ key: k, label: rule.label });
    }

    if (expiringKeys.length > 0) {
      const res = await expirePipe.exec();
      for (let i = 0; i < expiringKeys.length; i++) {
        if (res[i][1] === 1) stats[expiringKeys[i].label].applied++;
      }
    }

    if (scanned % 2000 === 0) console.log(`  ...scanned ${scanned}/${startDb}`);
  } while (cursor !== '0');

  console.log('scanned total:', scanned);
  console.log();
  console.log('--- TTL APLICADO ---');
  for (const [label, s] of Object.entries(stats)) {
    if (s.applied || s.skippedHasTTL) {
      console.log(`  ${label}: applied=${s.applied}, skipped(had TTL)=${s.skippedHasTTL}`);
    }
  }

  console.log();
  console.log('--- KEYS SIN TTL Y SIN MATCH (no se tocaron) ---');
  console.log('count:', unmatched.count);
  unmatched.samples.forEach(k => console.log(' ', k));

  await redis.quit();
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
