// Published values only. null means unmeasured, never zero.
export const metrics = ['successRate', 'latencyMs', 'memoryGb', 'speedup'];
const pendingMetrics = Object.fromEntries(metrics.map(key => [key, null]));
export const configurations = [
  { id: 'baseline', name: 'Original policy', note: 'Reference baseline', algorithm: 'Original', engineering: 'Original', mode: 'sync', group: 'ablation' },
  { id: 'algorithm', name: 'Algorithm only', note: 'Drafting / verification · planned', algorithm: 'Optimized', engineering: 'Original', mode: 'sync', group: 'ablation' },
  { id: 'engineering', name: 'Engineering only', note: 'Backend optimization · planned', algorithm: 'Original', engineering: 'Optimized', mode: 'sync', group: 'ablation' },
  { id: 'combined', name: 'Combined', note: 'Algorithm + engineering · planned', algorithm: 'Optimized', engineering: 'Optimized', mode: 'sync', group: 'ablation' },
  { id: 'async', name: 'Asynchronous execution', note: 'Independent inference loop · planned', algorithm: 'To be selected', engineering: 'To be selected', mode: 'async', group: 'execution' },
  { id: 'rtc', name: 'Real-time chunking', note: 'Committed action prefix · planned', algorithm: 'To be selected', engineering: 'To be selected', mode: 'rtc', group: 'execution' },
].map(row => ({ ...row, ...pendingMetrics, benchmark: null, model: null, hardware: null, status: 'Pending' }));

export const tasks = [
  { id: 'pick-place', name: 'Pick & place', icon: '◇', description: 'Observe an object, grasp it, and place it in a target region. A starting point for studying the inference-to-action loop.', criteria: 'Target pose / region · TBD' },
  { id: 'articulation', name: 'Articulation', icon: '⊞', description: 'Interact with a door, drawer, or another articulated object. Evaluate control precision as observations and actions evolve.', criteria: 'Joint / task threshold · TBD' },
  { id: 'precision', name: 'Precision manipulation', icon: '⊕', description: 'Align and manipulate objects under tighter spatial constraints. Study action consistency alongside inference efficiency.', criteria: 'Alignment tolerance · TBD' },
  { id: 'long-horizon', name: 'Long-horizon', icon: '⌁', description: 'Complete a sequence of object interactions. Examine accumulated errors, state resets, and policy continuity across a rollout.', criteria: 'Subtask completion · TBD' },
];

export const analysisMetrics = {
  latency: { title: 'Inference latency', unit: 'P50 / P95 / P99 · milliseconds ↓', tradeoff: 'Task quality vs. latency', axis: 'P50 inference latency (ms) →', explanation: 'Latency distributions will appear after baseline profiling.', region: 'DESIRED REGION ↖' },
  memory: { title: 'Peak device memory', unit: 'Same measurement scope · GB ↓', tradeoff: 'Task quality vs. memory', axis: 'Peak device memory (GB) →', explanation: 'Peak memory measurements will appear after baseline profiling.', region: 'DESIRED REGION ↖' },
  throughput: { title: 'Action throughput', unit: 'Steady state · actions / second ↑', tradeoff: 'Task quality vs. throughput', axis: 'Actions per second →', explanation: 'Throughput measurements will appear after baseline profiling.', region: 'DESIRED REGION ↗' },
};

export function filterConfigurations(rows, { search = '', mode = 'all', view = 'all', benchmark = 'all' } = {}) {
  const query = search.trim().toLowerCase();
  return rows.filter(row =>
    (!query || `${row.name} ${row.note} ${row.mode}`.toLowerCase().includes(query)) &&
    (mode === 'all' || row.mode === mode) &&
    (view === 'all' || row.group === view || (view === 'execution' && row.id === 'baseline')) &&
    (benchmark === 'all' || row.benchmark === null || row.benchmark === benchmark)
  );
}

export function sortConfigurations(rows, key, direction = 'asc') {
  if (!metrics.includes(key)) return [...rows];
  return [...rows].sort((a, b) => {
    if (a[key] === null && b[key] === null) return 0;
    if (a[key] === null) return 1;
    if (b[key] === null) return -1;
    return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
  });
}

export function formatMetric(value, key) {
  if (value === null || value === undefined) return '—';
  if (key === 'successRate') return `${value.toFixed(1)}%`;
  if (key === 'speedup') return `${value.toFixed(2)}×`;
  return value.toFixed(2);
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  // Neutralize spreadsheet formulas when exporting externally supplied labels.
  const safe = /^[=+@\-\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function toCsv(rows) {
  const fields = ['name', 'mode', 'benchmark', 'model', 'hardware', 'successRate', 'latencyMs', 'memoryGb', 'speedup', 'status'];
  const headers = ['Configuration', 'Execution', 'Benchmark', 'Model', 'Hardware', 'Success rate (%)', 'P50 latency (ms)', 'Peak device memory (GB)', 'Speedup (x)', 'Status'];
  return [headers, ...rows.map(row => fields.map(key => row[key]))].map(row => row.map(csvCell).join(',')).join('\r\n');
}
