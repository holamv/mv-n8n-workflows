// DRY-RUN: scan Redis y reporta key types + idle time distribution.
// NO borra nada.
const Redis = require('ioredis');

const redis = new Redis({
  host: 'redis-16865.c8.us-east-1-4.ec2.cloud.redislabs.com',
  port: 16865,
  password: 'SxA1vwSf8NvuKXknACJmEuk1ZiCjJVic',
  // Redis Cloud sin TLS por defecto en el endpoint público; cambiar a true si TLS está on
  tls: undefined,
  connectTimeout: 15000,
  maxRetriesPerRequest: 3,
});

redis.on('error', (e) => { console.error('Redis error:', e.message); });

(async () => {
  console.log('--- INFO ---');
  const info = await redis.info('memory');
  const usedHuman = info.match(/used_memory_human:(\S+)/)?.[1];
  const maxHuman = info.match(/maxmemory_human:(\S+)/)?.[1];
  console.log('used_memory:', usedHuman, '| maxmemory:', maxHuman);
  const evicted = (await redis.info('stats')).match(/evicted_keys:(\d+)/)?.[1];
  console.log('evicted_keys:', evicted);

  console.log();
  console.log('--- DBSIZE ---');
  const total = await redis.dbsize();
  console.log('total keys:', total);

  console.log();
  console.log('--- SCAN (paginado) ---');
  let cursor = '0';
  let scanned = 0;
  const prefixCounts = {};
  const ttlBuckets = { noTTL: 0, '<1min': 0, '<1h': 0, '<1d': 0, '<7d': 0, '>=7d': 0 };
  const idleBuckets = { '<1d': 0, '1-3d': 0, '3-7d': 0, '7-14d': 0, '14-30d': 0, '>30d': 0 };
  const samples = {}; // prefix → 3 example keys

  do {
    const [next, keys] = await redis.scan(cursor, 'COUNT', 1000);
    cursor = next;
    if (keys.length === 0) continue;

    // pipeline TTL + IDLETIME para batch
    const pipe = redis.pipeline();
    for (const k of keys) {
      pipe.ttl(k);
      pipe.object('IDLETIME', k);
    }
    const results = await pipe.exec();

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const ttl = results[i * 2][1];
      const idle = results[i * 2 + 1][1];
      scanned++;

      // bucket prefix
      const prefix = key.split(/[:_\/]/)[0].substring(0, 30);
      prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
      if (!samples[prefix]) samples[prefix] = [];
      if (samples[prefix].length < 3) samples[prefix].push(key);

      // TTL bucket
      if (ttl === -1) ttlBuckets.noTTL++;
      else if (ttl < 60) ttlBuckets['<1min']++;
      else if (ttl < 3600) ttlBuckets['<1h']++;
      else if (ttl < 86400) ttlBuckets['<1d']++;
      else if (ttl < 604800) ttlBuckets['<7d']++;
      else ttlBuckets['>=7d']++;

      // IDLE bucket (segundos sin acceso)
      const days = idle / 86400;
      if (days < 1) idleBuckets['<1d']++;
      else if (days < 3) idleBuckets['1-3d']++;
      else if (days < 7) idleBuckets['3-7d']++;
      else if (days < 14) idleBuckets['7-14d']++;
      else if (days < 30) idleBuckets['14-30d']++;
      else idleBuckets['>30d']++;
    }

    if (scanned % 5000 === 0) console.log(`  scanned ${scanned}/${total}...`);
  } while (cursor !== '0');

  console.log('scanned total:', scanned);

  console.log();
  console.log('--- PREFIX COUNTS (top 30) ---');
  Object.entries(prefixCounts).sort((a,b)=>b[1]-a[1]).slice(0,30).forEach(([p,c]) => {
    console.log(`  ${c.toString().padStart(7)} × "${p}"  ej: ${samples[p].slice(0,2).join(' | ')}`);
  });

  console.log();
  console.log('--- TTL DISTRIBUTION ---');
  Object.entries(ttlBuckets).forEach(([b,c]) => console.log(`  ${c.toString().padStart(7)} | TTL ${b}`));

  console.log();
  console.log('--- IDLE-TIME DISTRIBUTION (último acceso) ---');
  Object.entries(idleBuckets).forEach(([b,c]) => console.log(`  ${c.toString().padStart(7)} | idle ${b}`));

  // candidate count: keys with no TTL AND idle >= 7 days
  console.log();
  console.log('--- CANDIDATOS A LIMPIEZA (estimado) ---');
  // re-scan to count exact candidates
  cursor = '0';
  let cand7d = 0, cand14d = 0, cand30d = 0;
  do {
    const [next, keys] = await redis.scan(cursor, 'COUNT', 1000);
    cursor = next;
    if (!keys.length) continue;
    const pipe = redis.pipeline();
    for (const k of keys) {
      pipe.ttl(k);
      pipe.object('IDLETIME', k);
    }
    const results = await pipe.exec();
    for (let i = 0; i < keys.length; i++) {
      const ttl = results[i*2][1];
      const idle = results[i*2+1][1];
      if (ttl !== -1) continue; // si ya tiene TTL, dejar que expire solo
      const days = idle / 86400;
      if (days >= 7) cand7d++;
      if (days >= 14) cand14d++;
      if (days >= 30) cand30d++;
    }
  } while (cursor !== '0');
  console.log('  sin TTL e idle >=  7 días:', cand7d);
  console.log('  sin TTL e idle >= 14 días:', cand14d);
  console.log('  sin TTL e idle >= 30 días:', cand30d);

  await redis.quit();
  console.log();
  console.log('DRY-RUN OK. No se borró nada.');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
