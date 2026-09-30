import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const hourlyTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Hourly Trigger',
    parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 1, triggerAtMinute: 5 }] } },
    position: [240, 300]
  },
  output: [{}]
});

const readCursors = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Read Cursors',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const MONITORED = [
  { workflowId: 'AAntaw0Aa0fkDSaR', agentKey: 'pcl' },
];
const DEFAULT_BASE_URL = 'https://data-lake-mv.manzanaverde.la';
const BASE_URL_VAR = 'DATALAKE_BASE_URL';
const INGEST_PATH = '/api/datalake/agent-runs/ingest';
const STATIC_SCOPE = 'global';
const EMPTY_CURSOR = 0;

function resolveBaseUrl() {
  try {
    return $env[BASE_URL_VAR] || DEFAULT_BASE_URL;
  } catch (error) {
    return DEFAULT_BASE_URL;
  }
}

const store = $getWorkflowStaticData(STATIC_SCOPE);
const cursors = store.cursors || {};
const ingestUrl = resolveBaseUrl() + INGEST_PATH;

return MONITORED.map(({ workflowId, agentKey }) => ({
  json: {
    workflowId,
    agentKey,
    cursor: Number(cursors[workflowId] || EMPTY_CURSOR),
    ingestUrl,
  },
}));`
    },
    position: [480, 300]
  },
  output: [{ workflowId: 'AAntaw0Aa0fkDSaR', agentKey: 'pcl', cursor: 0, ingestUrl: 'https://data-lake-mv.manzanaverde.la/api/datalake/agent-runs/ingest' }]
});

const fetchExecutions = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Executions',
    parameters: {
      method: 'GET',
      url: 'https://n8n2.manzanaverde.la/api/v1/executions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'n8nApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'workflowId', value: expr('{{ $json.workflowId }}') },
          { name: 'includeData', value: 'true' },
          { name: 'limit', value: '100' }
        ]
      },
      options: {
        timeout: 120000,
        pagination: {
          pagination: {
            paginationMode: 'updateAParameterInEachRequest',
            parameters: { parameters: [{ type: 'qs', name: 'cursor', value: expr('{{ $response.body.nextCursor }}') }] },
            paginationCompleteWhen: 'other',
            completeExpression: expr('{{ !$response.body.nextCursor || $response.body.data.some(e => Number(e.id) <= Number($json.cursor)) }}'),
            limitPagesFetched: true,
            maxRequests: 4
          }
        }
      }
    },
    credentials: { n8nApi: newCredential('n8n B Public API') },
    position: [720, 300]
  },
  output: [{ data: [{ id: '1000', workflowId: 'AAntaw0Aa0fkDSaR', status: 'success', startedAt: '2026-09-30T20:04:29.670Z', stoppedAt: '2026-09-30T20:04:58.325Z' }], nextCursor: null }]
});

const summarizeExecutions = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Summarize Executions',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const crypto = require('crypto');
const INSTANCE = 'B';
const HASH_ALGORITHM = 'sha256';
const HASH_LENGTH = 32;
const NON_DIGITS = /[^0-9]/g;
const DIGEST_ENCODING = 'hex';
const EMPTY_TEXT = '';
const ZERO = 0;
const FIRST = 0;
const BATCH_SIZE = 500;
const STALE_HOURS = 6;
const MS_PER_HOUR = 3600000;
const STATUS_ERROR = 'error';
const FINISHED = ['success', 'error', 'crashed', 'canceled'];
const LM_CHANNEL = 'ai_languageModel';
const FALLBACK_NODE = 'Etiqueta Fallback';
const CURSOR_NODE = 'Read Cursors';
const KIND = {
  execution: 'execution_error',
  vision: 'vision_fallback',
  leak: 'reasoning_leak',
  empty: 'no_response',
  silent: 'silent_failure',
};
const SENDFLOW_PREFIX = 'Primer Mensaje';
const ERROR_OUTPUT_INDEX = 1;
const HTTP_BAD_REQUEST = 400;
const BAD_REQUEST_PATTERN = /(^|[^0-9])400([^0-9]|$)/;
const AGENTS = {
  AAntaw0Aa0fkDSaR: {
    key: 'pcl',
    requestNodes: ['Leads', 'Recovery'],
    hashId: true,
    webhookNodes: ['Leads', 'Recovery'],
    idPaths: [['body', 'celular'], ['body', 'phone']],
    laneNodes: [],
    agentNodes: ['AI Agent', 'AI Agent1'],
    guardNodes: [],
  },
};

const ran = (runData, name) => Boolean(runData[name]?.length);
const mainItems = (run) => (run?.data?.main || []).flat().filter(Boolean).map((item) => item.json || {});
const runOutputs = (runData, name) => (runData[name] || []).flatMap(mainItems);
const channelItems = (run) => run.data[LM_CHANNEL].flat().filter(Boolean).map((item) => item.json || {});
const isBlank = (value) => value == null || (typeof value === 'string' && !value.trim())
  || (typeof value === 'object' && !Object.keys(value).length);
const isFinished = (exec) => Boolean(exec.stoppedAt) && FINISHED.includes(exec.status);

function lmRuns(runData) {
  return Object.values(runData).flat()
    .filter((run) => run?.data?.[LM_CHANNEL])
    .map((run) => ({ run, items: channelItems(run) }));
}

function sumTokens(runs) {
  const sum = { prompt_tokens: ZERO, completion_tokens: ZERO, total_tokens: ZERO };
  for (const usage of runs.flatMap((entry) => entry.items).map((item) => item.tokenUsage).filter(Boolean)) {
    const prompt = usage.promptTokens || ZERO;
    const completion = usage.completionTokens || ZERO;
    sum.prompt_tokens += prompt;
    sum.completion_tokens += completion;
    sum.total_tokens += usage.totalTokens ?? prompt + completion;
  }
  return sum;
}

function findModel(runs) {
  for (const { run, items } of runs) {
    const fromResponse = items.find((item) => item.response?.model)?.response.model;
    const input = run.inputOverride?.[LM_CHANNEL]?.flat().filter(Boolean)[FIRST];
    const model = fromResponse || input?.json?.options?.model;
    if (model) return model;
  }
  return null;
}

function hashPhone(value) {
  const digits = String(value).replace(NON_DIGITS, EMPTY_TEXT);
  return crypto.createHash(HASH_ALGORITHM).update(digits).digest(DIGEST_ENCODING).slice(ZERO, HASH_LENGTH);
}

function conversationId(agent, runData) {
  for (const name of agent.webhookNodes) {
    const json = mainItems(runData[name]?.[FIRST])[FIRST];
    for (const path of agent.idPaths) {
      const value = path.reduce((node, key) => node?.[key], json);
      if (value != null && value !== EMPTY_TEXT) return agent.hashId ? hashPhone(value) : String(value);
    }
  }
  return null;
}

const isBadRequest = (error) => Boolean(error)
  && (String(error.httpCode) === String(HTTP_BAD_REQUEST) || BAD_REQUEST_PATTERN.test(String(error.message || EMPTY_TEXT)));
const errorOutputItems = (run) => (run?.data?.main?.[ERROR_OUTPUT_INDEX] || []).filter(Boolean).map((item) => item.json || {});

function sendFlowRejected(runData) {
  return Object.keys(runData)
    .filter((name) => name.startsWith(SENDFLOW_PREFIX))
    .flatMap((name) => runData[name])
    .some((run) => isBadRequest(run?.error) || errorOutputItems(run).some((out) => isBadRequest(out.error)));
}

function errorKind(exec, agent, runData, isRequest) {
  if (exec.status === STATUS_ERROR) return KIND.execution;
  if (sendFlowRejected(runData)) return KIND.silent;
  if (ran(runData, FALLBACK_NODE)) return KIND.vision;
  const leaked = agent.guardNodes.some((name) => runOutputs(runData, name).some((out) => out.reasoning_leak === true));
  if (leaked) return KIND.leak;
  const agentRan = agent.agentNodes.some((name) => ran(runData, name));
  const answered = agent.agentNodes.some((name) => runOutputs(runData, name).some((out) => !isBlank(out.output)));
  return isRequest && agentRan && !answered ? KIND.empty : null;
}

function summarize(exec) {
  const agent = AGENTS[exec.workflowId];
  const runData = exec.data?.resultData?.runData || {};
  const runs = lmRuns(runData);
  const isRequest = agent.requestNodes.some((name) => ran(runData, name));
  return {
    instance: INSTANCE,
    execution_id: String(exec.id),
    workflow_id: exec.workflowId,
    agent_key: agent.key,
    started_at: exec.startedAt,
    stopped_at: exec.stoppedAt,
    status: exec.status,
    is_request: isRequest,
    conversation_id: conversationId(agent, runData),
    lane: agent.laneNodes.find((name) => ran(runData, name)) || null,
    model: findModel(runs),
    ...sumTokens(runs),
    error_kind: errorKind(exec, agent, runData, isRequest),
  };
}

function nextCursor(execs, previous, nowMs) {
  const pending = (exec) => !isFinished(exec) && nowMs - Date.parse(exec.startedAt) < STALE_HOURS * MS_PER_HOUR;
  const ceiling = Math.min(...execs.filter(pending).map((exec) => Number(exec.id)), Infinity);
  const done = execs.filter((exec) => isFinished(exec) && Number(exec.id) < ceiling);
  return Math.max(previous, ...done.map((exec) => Number(exec.id)));
}

function buildBatches(pages, cursors, nowMs) {
  const byId = new Map(pages.flatMap((page) => page.data || []).map((exec) => [String(exec.id), exec]));
  const fresh = [...byId.values()].filter((exec) => AGENTS[exec.workflowId] && Number(exec.id) > cursors[exec.workflowId]);
  const next = {};
  for (const id of Object.keys(cursors)) {
    next[id] = nextCursor(fresh.filter((exec) => exec.workflowId === id), cursors[id], nowMs);
  }
  const rows = fresh.filter(isFinished).map(summarize);
  const batches = [];
  for (let start = ZERO; start < rows.length; start += BATCH_SIZE) {
    batches.push({ json: { rows: rows.slice(start, start + BATCH_SIZE), cursors: next } });
  }
  return batches;
}

const pages = $input.all().map((item) => item.json);
const cursors = Object.fromEntries($(CURSOR_NODE).all().map((item) => [item.json.workflowId, item.json.cursor]));

return buildBatches(pages, cursors, Date.now());`
    },
    position: [960, 300]
  },
  output: [{ rows: [{ instance: 'B', execution_id: '1000', workflow_id: 'AAntaw0Aa0fkDSaR', agent_key: 'pcl', started_at: '2026-09-30T20:04:29.670Z', stopped_at: '2026-09-30T20:04:58.325Z', status: 'success', is_request: true, conversation_id: '0123456789abcdef0123456789abcdef', lane: null, model: 'gpt-5-mini', prompt_tokens: 1200, completion_tokens: 300, total_tokens: 1500, error_kind: 'silent_failure' }], cursors: { AAntaw0Aa0fkDSaR: 1000 } }]
});

const ingestBatch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Ingest Batch',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Read Cursors").first().json.ingestUrl }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ { rows: $json.rows } }}'),
      options: { timeout: 60000 }
    },
    credentials: { httpHeaderAuth: newCredential('Datalake Ingest Key') },
    retryOnFail: true,
    maxTries: 3,
    position: [1200, 300]
  },
  output: [{ ok: true }]
});

const advanceCursors = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Advance Cursors',
    executeOnce: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const STATIC_SCOPE = 'global';
const SUMMARY_NODE = 'Summarize Executions';

const store = $getWorkflowStaticData(STATIC_SCOPE);
const pending = $(SUMMARY_NODE).first().json.cursors;
store.cursors = { ...(store.cursors || {}), ...pending };

return [{ json: { cursors: store.cursors } }];`
    },
    position: [1440, 300]
  },
  output: [{ cursors: { AAntaw0Aa0fkDSaR: 1000 } }]
});

export default workflow('agent-metrics-collector-b', 'Agent Metrics Collector B')
  .add(hourlyTrigger)
  .to(readCursors)
  .to(fetchExecutions)
  .to(summarizeExecutions)
  .to(ingestBatch)
  .to(advanceCursors);
