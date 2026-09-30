import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const DEFAULT_ENV_KEY = 'N8N2_API_KEY';
const API_PATH = '/api/v1/workflows';
const KEY_HEADER = 'X-N8N-API-KEY';
const FAILURE_CODE = 1;
const FIELDS = ['name', 'nodes', 'connections', 'settings'];
const OPTIONS = {
  base: { type: 'string' },
  file: { type: 'string' },
  'env-key': { type: 'string', default: DEFAULT_ENV_KEY },
};

function fail(message) {
  console.error(message);
  process.exit(FAILURE_CODE);
}

const { values } = parseArgs({ options: OPTIONS });
if (!values.base || !values.file) fail('Usage: --base <url> --file <json> [--env-key NAME]');

const apiKey = process.env[values['env-key']];
if (!apiKey) fail(`Environment variable ${values['env-key']} is not set`);

const source = JSON.parse(await readFile(values.file, 'utf8'));
const body = Object.fromEntries(FIELDS.map((field) => [field, source[field]]));

const response = await fetch(new URL(API_PATH, values.base), {
  method: 'POST',
  headers: { [KEY_HEADER]: apiKey, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

if (!response.ok) fail(`Import failed with HTTP ${response.status}`);

const created = await response.json();
console.log(`${created.id} ${created.name}`);
