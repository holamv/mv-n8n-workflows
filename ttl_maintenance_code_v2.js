// Minimal RESP-based Redis client to apply TTL.
// Uses only `net` (built-in) since `ioredis` is blocked in n8n sandbox.

const net = require('net');

function connectRedis(host, port, password) {
  return new Promise((resolve, reject) => {
    const sock = net.connect(port, host);
    let buf = Buffer.alloc(0);
    const pending = [];
    let connected = false;

    sock.on('error', (e) => { if (!connected) reject(e); else pending.forEach(p => p.reject(e)); });
    sock.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (pending.length > 0) {
        const parsed = parseOne(buf);
        if (parsed === null) break;
        buf = parsed.rest;
        pending.shift().resolve(parsed.value);
      }
    });
    sock.on('connect', () => {
      connected = true;
      const auth = (cb) => {
        pending.push({ resolve: cb, reject: cb });
        sock.write(encode(['AUTH', password]));
      };
      auth((res) => {
        if (res === 'OK') resolve({
          cmd: (args) => new Promise((res, rej) => { pending.push({ resolve: res, reject: rej }); sock.write(encode(args)); }),
          end: () => sock.end()
        });
        else reject(new Error('AUTH failed: ' + JSON.stringify(res)));
      });
    });
  });
}

function encode(args) {
  let s = '*' + args.length + '\r\n';
  for (const a of args) {
    const sa = String(a);
    s += '$' + Buffer.byteLength(sa) + '\r\n' + sa + '\r\n';
  }
  return s;
}

function parseOne(buf) {
  if (buf.length === 0) return null;
  const type = String.fromCharCode(buf[0]);
  const crlf = buf.indexOf('\r\n', 1);
  if (crlf === -1) return null;
  const line = buf.slice(1, crlf).toString();
  if (type === '+') return { value: line, rest: buf.slice(crlf + 2) };
  if (type === '-') return { value: new Error(line), rest: buf.slice(crlf + 2) };
  if (type === ':') return { value: parseInt(line, 10), rest: buf.slice(crlf + 2) };
  if (type === '$') {
    const len = parseInt(line, 10);
    if (len === -1) return { value: null, rest: buf.slice(crlf + 2) };
    const start = crlf + 2;
    if (buf.length < start + len + 2) return null;
    return { value: buf.slice(start, start + len).toString(), rest: buf.slice(start + len + 2) };
  }
  if (type === '*') {
    const count = parseInt(line, 10);
    if (count === -1) return { value: null, rest: buf.slice(crlf + 2) };
    let rest = buf.slice(crlf + 2);
    const arr = [];
    for (let i = 0; i < count; i++) {
      const p = parseOne(rest);
      if (p === null) return null;
      arr.push(p.value);
      rest = p.rest;
    }
    return { value: arr, rest };
  }
  return null;
}

const TTL_RULES = [
  { test: k => /^user:/.test(k), ttl: 14 * 86400, label: 'user:*' },
  { test: k => /^intencion_/.test(k), ttl: 14 * 86400, label: 'intencion_*' },
  { test: k => /^Datos_/.test(k), ttl: 30 * 86400, label: 'Datos_*' },
  { test: k => /^tpl_primer_pedido_/.test(k), ttl: 30 * 86400, label: 'tpl_primer_pedido_*' },
  { test: k => /^\d+$/.test(k), ttl: 14 * 86400, label: '<numeric_id>' },
];

const client = await connectRedis('redis-16865.c8.us-east-1-4.ec2.cloud.redislabs.com', 16865, 'SxA1vwSf8NvuKXknACJmEuk1ZiCjJVic');

const stats = {};
TTL_RULES.forEach(r => { stats[r.label] = 0; });
let cursor = '0', scanned = 0, totalApplied = 0;

try {
  do {
    const res = await client.cmd(['SCAN', cursor, 'COUNT', '1000']);
    cursor = res[0];
    const keys = res[1];
    if (!keys || keys.length === 0) continue;
    scanned += keys.length;

    for (const k of keys) {
      const rule = TTL_RULES.find(r => r.test(k));
      if (!rule) continue;
      const ttl = await client.cmd(['TTL', k]);
      if (ttl !== -1) continue;
      const out = await client.cmd(['EXPIRE', k, String(rule.ttl)]);
      if (out === 1) { stats[rule.label]++; totalApplied++; }
    }
  } while (cursor !== '0');
} finally {
  client.end();
}

return [{ json: { ts: new Date().toISOString(), scanned, totalApplied, byPattern: stats } }];
