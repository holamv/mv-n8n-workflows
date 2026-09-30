import { parseArgs } from 'node:util';

const DEFAULT_ENV_KEY = 'N8N2_API_KEY';
const API_PATH = '/api/v1/workflows';
const KEY_HEADER = 'X-N8N-API-KEY';
const FAILURE_CODE = 1;
const FIELDS = ['name', 'nodes', 'connections'];
const SETTINGS_KEYS = [
  'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution',
  'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder',
];
const OPTIONS = {
  base: { type: 'string' },
  id: { type: 'string' },
  from: { type: 'string' },
  to: { type: 'string' },
  'env-key': { type: 'string', default: DEFAULT_ENV_KEY },
};

function fail(message) {
  console.error(message);
  process.exit(FAILURE_CODE);
}

const { values } = parseArgs({ options: OPTIONS });
if (!values.base || !values.id || !values.from || !values.to) {
  fail('Usage: --base <url> --id <workflowId> --from <text> --to <text> [--env-key NAME]');
}

const apiKey = process.env[values['env-key']];
if (!apiKey) fail(`Environment variable ${values['env-key']} is not set`);

const headers = { [KEY_HEADER]: apiKey, 'Content-Type': 'application/json' };
const url = new URL(`${API_PATH}/${values.id}`, values.base);

const current = await fetch(url, { headers });
if (!current.ok) fail(`Read failed with HTTP ${current.status}`);
const source = await current.json();

const serialized = JSON.stringify(source.nodes);
const replaced = serialized.split(values.from).length - 1;
if (!replaced) fail('No node contains the text to replace');
source.nodes = JSON.parse(serialized.split(values.from).join(values.to));

const body = Object.fromEntries(FIELDS.map((field) => [field, source[field]]));
body.settings = Object.fromEntries(SETTINGS_KEYS.filter((key) => key in (source.settings || {})).map((key) => [key, source.settings[key]]));
const response = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
if (!response.ok) fail(`Update failed with HTTP ${response.status}: ${await response.text()}`);

const updated = await response.json();
const withCredentials = updated.nodes.filter((node) => node.credentials).map((node) => node.name);
console.log(`${updated.id} ${updated.name} nodesPatched=${replaced} credentialsKept=${withCredentials.join(',') || 'none'}`);
