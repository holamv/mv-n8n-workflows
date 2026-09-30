import { parseArgs } from 'node:util';

const API_KEY_HEADER = 'X-N8N-API-KEY';
const CREDENTIAL_TYPE = 'httpHeaderAuth';
const FAILURE_CODE = 1;
const SETTINGS_KEYS = [
  'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution',
  'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder',
];
const OPTIONS = {
  base: { type: 'string' },
  id: { type: 'string' },
  node: { type: 'string' },
  name: { type: 'string' },
  header: { type: 'string', default: 'x-api-key' },
  'env-key': { type: 'string' },
  'env-value': { type: 'string' },
};

function fail(message) {
  console.error(message);
  process.exit(FAILURE_CODE);
}

const { values } = parseArgs({ options: OPTIONS });
const required = ['base', 'id', 'node', 'name', 'env-key', 'env-value'];
if (required.some((key) => !values[key])) {
  fail('Usage: --base <url> --id <workflowId> --node <nodeName> --name <credentialName> --env-key NAME --env-value NAME [--header x-api-key]');
}
const apiKey = process.env[values['env-key']];
const secret = process.env[values['env-value']];
if (!apiKey || !secret) fail('Both environment variables must be set');

const headers = { [API_KEY_HEADER]: apiKey, 'Content-Type': 'application/json' };
const credentialBody = { name: values.name, type: CREDENTIAL_TYPE, data: { name: values.header, value: secret } };
const created = await fetch(new URL('/api/v1/credentials', values.base), { method: 'POST', headers, body: JSON.stringify(credentialBody) });
if (!created.ok) fail(`Credential failed with HTTP ${created.status}`);
const credential = await created.json();

const workflowUrl = new URL(`/api/v1/workflows/${values.id}`, values.base);
const workflow = await (await fetch(workflowUrl, { headers })).json();
const target = workflow.nodes.find((node) => node.name === values.node);
if (!target) fail(`Node ${values.node} not found`);
target.credentials = { ...(target.credentials || {}), [CREDENTIAL_TYPE]: { id: credential.id, name: credential.name } };

const settings = Object.fromEntries(SETTINGS_KEYS.filter((key) => key in (workflow.settings || {})).map((key) => [key, workflow.settings[key]]));
const body = { name: workflow.name, nodes: workflow.nodes, connections: workflow.connections, settings };
const updated = await fetch(workflowUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
if (!updated.ok) fail(`Update failed with HTTP ${updated.status}: ${await updated.text()}`);

const result = await updated.json();
const attached = result.nodes.find((node) => node.name === values.node).credentials;
console.log(`${result.id} ${values.node} credential=${credential.id} attached=${JSON.stringify(attached)}`);
