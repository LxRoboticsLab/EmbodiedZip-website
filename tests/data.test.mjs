import test from 'node:test';
import assert from 'node:assert/strict';
import { configurations, metrics, tasks, filterConfigurations, sortConfigurations, formatMetric, toCsv } from '../data.mjs';

test('preview dataset never invents results or integrations', () => {
  assert.equal(new Set(configurations.map(row => row.id)).size, configurations.length);
  for (const row of configurations) {
    for (const key of metrics) assert.equal(row[key], null);
    for (const key of ['model', 'hardware', 'benchmark']) assert.equal(row[key], null);
    assert.equal(row.status, 'Pending');
  }
  assert.equal(new Set(tasks.map(task => task.id)).size, tasks.length);
});
test('search combines with mode, view, and candidate benchmark filters', () => {
  assert.deepEqual(filterConfigurations(configurations, { search: '  COMBINED ' }).map(row => row.id), ['combined']);
  assert.equal(filterConfigurations(configurations, { mode: 'sync', view: 'ablation' }).length, 4);
  assert.deepEqual(filterConfigurations(configurations, { view: 'execution' }).map(row => row.id), ['baseline', 'async', 'rtc']);
  assert.equal(filterConfigurations(configurations, { search: 'does-not-exist' }).length, 0);
  assert.equal(filterConfigurations(configurations, { benchmark: 'libero' }).length, configurations.length);
  assert.equal(filterConfigurations([{ ...configurations[0], benchmark: 'calvin' }], { benchmark: 'libero' }).length, 0);
});
test('sorting puts null last in either direction and preserves source order', () => {
  const rows = [{ latencyMs: null }, { latencyMs: 30 }, { latencyMs: 0 }, { latencyMs: 10 }];
  assert.deepEqual(sortConfigurations(rows, 'latencyMs').map(row => row.latencyMs), [0, 10, 30, null]);
  assert.deepEqual(sortConfigurations(rows, 'latencyMs', 'desc').map(row => row.latencyMs), [30, 10, 0, null]);
  assert.equal(rows[0].latencyMs, null);
  assert.deepEqual(sortConfigurations(configurations, 'latencyMs'), configurations);
});
test('a measured zero is distinct from missing data', () => {
  assert.equal(formatMetric(null, 'successRate'), '—');
  assert.equal(formatMetric(0, 'successRate'), '0.0%');
  assert.equal(formatMetric(1.5, 'speedup'), '1.50×');
});
test('CSV exports filtered rows with empty unmeasured cells and safe quoting', () => {
  const csv = toCsv(filterConfigurations(configurations, { search: 'combined' }));
  assert.equal(csv.split('\r\n').length, 2);
  assert.ok(csv.includes('"Combined","sync","","","","","","","","Pending"'));
  assert.ok(toCsv([{ ...configurations[0], name: '=SUM(1,2)' }]).includes('"\'=SUM(1,2)"'));
  assert.ok(toCsv([{ ...configurations[0], name: 'Policy "A", test' }]).includes('"Policy ""A"", test"'));
});
