const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, mocks, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), URL, AbortSignal, ...globals });
  return exports;
}
const { DEFAULT_TARIFFS, validateTariffs } = load('lib/tariffs.ts', {});
const valid = () => JSON.parse(JSON.stringify({ ...DEFAULT_TARIFFS, version: 1 }));
function route({ authenticated = true, sameOrigin = true, currentVersion = 1, failSave = false } = {}) {
  const saved = [], invalidations = [];
  const api = load('app/api/tariffs/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    'next/cache': { revalidateTag: (...args) => invalidations.push(args) },
    '@/lib/auth': { requireAuth: async () => { if (!authenticated) throw new Error('UNAUTHORIZED'); } },
    '@/lib/request-origin': { isSameOrigin: () => sameOrigin },
    '@/lib/tariffs': { validateTariffs },
    '@/lib/sd-source-tariffs': {
      cachedSourceTariffs: async () => valid(),
      readSourceTariffRecord: async () => ({ id: 'recOriginal', snapshot: { ...valid(), version: currentVersion } }),
      saveSourceTariffs: async (...args) => { if (failSave) throw new Error('rejected'); saved.push(args); },
    },
  });
  return { api, saved, invalidations };
}
const request = value => ({ text: async () => JSON.stringify(value) });
test('Без сессии и с чужого сайта сохранение запрещено', async () => {
  for (const config of [{ authenticated: false }, { sameOrigin: false }]) {
    const { api, saved } = route(config);
    assert.equal((await api.PUT(request(valid()))).status, config.authenticated === false ? 401 : 403);
    assert.equal(saved.length, 0);
  }
});
test('Повреждённые и слишком большие условия не сохраняются', async () => {
  const { api, saved } = route();
  for (const req of [request({}), { text: async () => '{' }, { text: async () => ' '.repeat(64001) }]) assert.equal((await api.PUT(req)).status, 400);
  assert.equal(saved.length, 0);
});
test('Устаревшая версия отклоняется без записи', async () => {
  const { api, saved } = route({ currentVersion: 2 });
  assert.equal((await api.PUT(request(valid()))).status, 409);
  assert.equal(saved.length, 0);
});
test('Сохранение повышает версию и сбрасывает кеш только после успеха', async () => {
  const { api, saved, invalidations } = route();
  const result = await api.PUT(request(valid()));
  assert.equal(result.status, 200);
  assert.equal(result.body.version, 2);
  assert(Number.isFinite(Date.parse(result.body.updatedAt)));
  assert.equal(saved.length, 1);
  assert.equal(saved[0][0], 'recOriginal');
  assert.equal(saved[0][1], result.body);
  assert.equal(invalidations[0][0], 'sd-source-tariffs');
  const failing = route({ failSave: true });
  assert.equal((await failing.api.PUT(request(valid()))).status, 503);
  assert.equal(failing.invalidations.length, 0);
});
test('Тарифы читаются и сохраняются в Supabase по UUID', async () => {
  const calls = [];
  const recordId = '098166bc-833e-47b0-8273-6d98bbb2939d';
  const source = load('lib/sd-source-tariffs.ts', {
    'server-only': {}, '@/lib/tariffs': { validateTariffs },
  }, {
    process: { env: { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SECRET_KEY: 'synthetic-secret' } },
    fetch: async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (!options.method) return { ok: true, json: async () => [{ id: recordId, rules: valid() }] };
      return { ok: true };
    },
  });
  const loaded = await source.readSourceTariffRecord();
  assert.equal(loaded.id, recordId);
  assert.deepEqual(loaded.snapshot, valid());
  await source.saveSourceTariffs(recordId, valid());
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, `https://project.supabase.co/rest/v1/calculator_settings?id=eq.${recordId}`);
  assert.equal(calls[1].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[1].options.body), { rules: valid() });
  await assert.rejects(source.saveSourceTariffs('../other', valid()));
  assert.equal(calls.length, 2);
});
