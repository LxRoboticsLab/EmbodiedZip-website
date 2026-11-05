import { configurations, tasks, analysisMetrics, filterConfigurations, sortConfigurations, formatMetric, toCsv } from './data.mjs';

const $ = selector => document.querySelector(selector);
const state = { search: '', mode: 'all', view: 'all', benchmark: 'all', sortKey: null, direction: 'asc', selected: new Set() };
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const announce = message => { $('#announcement').textContent = message; };

function visibleRows() {
  return sortConfigurations(filterConfigurations(configurations, state), state.sortKey, state.direction);
}

function renderTable() {
  const rows = visibleRows();
  $('#leaderboard-body').innerHTML = rows.map(row => `<tr>
    <td class="compare-column"><input type="checkbox" data-compare="${escape(row.id)}" aria-label="Compare ${escape(row.name)}" ${state.selected.has(row.id) ? 'checked' : ''} ${state.selected.size >= 3 && !state.selected.has(row.id) ? 'disabled' : ''}></td>
    <td><span class="configuration-name"><span class="config-icon ${row.id === 'baseline' ? 'base' : ''}"></span>${escape(row.name)}</span><span class="configuration-note">${escape(row.note)}</span></td>
    <td><span class="mode-label">${escape(row.mode.toUpperCase())}</span></td>
    ${['successRate', 'latencyMs', 'memoryGb', 'speedup'].map(key => `<td class="${row[key] === null ? 'pending-cell' : ''}" ${row[key] === null ? 'aria-label="Unmeasured"' : ''}>${formatMetric(row[key], key)}</td>`).join('')}
    <td><span class="row-status">${escape(row.status)}</span></td>
  </tr>`).join('');
  $('#table-empty').hidden = rows.length > 0;
  $('#result-count').textContent = `${rows.length} planned configuration${rows.length === 1 ? '' : 's'} · 0 published runs`;
  renderComparison();
}

function renderComparison() {
  const rows = configurations.filter(row => state.selected.has(row.id));
  $('#comparison').hidden = rows.length === 0;
  $('#comparison-content').innerHTML = `<div class="comparison-grid">${rows.map(row => `<article class="comparison-item"><h4>${escape(row.name)}</h4><p>Algorithm: ${escape(row.algorithm)}</p><p>Engineering: ${escape(row.engineering)}</p><p>Execution: ${escape(row.mode.toUpperCase())}</p><p>Model / benchmark: not selected</p><strong>Measurements pending</strong></article>`).join('')}</div>`;
}

$('#search').addEventListener('input', event => { state.search = event.target.value; renderTable(); });
$('#execution').addEventListener('change', event => { state.mode = event.target.value; renderTable(); });
$('#benchmark').addEventListener('change', event => { state.benchmark = event.target.value; renderTable(); announce('Candidate benchmark selected. Configurations remain unassigned; no benchmark results are available.'); });

// Tab groups support arrow-key navigation and the Home/End keys.
function setupTabs(selector, onSelect) {
  const buttons = [...document.querySelectorAll(selector)];
  function select(button) {
    buttons.forEach(item => { item.setAttribute('aria-selected', String(item === button)); item.tabIndex = item === button ? 0 : -1; });
    onSelect(button);
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next !== undefined) { event.preventDefault(); select(buttons[next]); buttons[next].focus(); }
    });
  });
}
setupTabs('[data-view]', button => { state.view = button.dataset.view; $('#results-panel').setAttribute('aria-labelledby', button.id); renderTable(); });

document.querySelectorAll('[data-sort]').forEach(button => {
  button.addEventListener('click', () => {
    state.direction = state.sortKey === button.dataset.sort && state.direction === 'asc' ? 'desc' : 'asc';
    state.sortKey = button.dataset.sort;
    document.querySelectorAll('[data-sort]').forEach(item => { item.closest('th').setAttribute('aria-sort', item === button ? (state.direction === 'asc' ? 'ascending' : 'descending') : 'none'); });
    renderTable();
    announce('Sort updated. Unmeasured values stay last; all current measurements are pending.');
  });
});

$('#leaderboard-body').addEventListener('change', event => {
  const input = event.target.closest('[data-compare]');
  if (!input) return;
  if (input.checked && state.selected.size < 3) state.selected.add(input.dataset.compare);
  else state.selected.delete(input.dataset.compare);
  renderTable();
  const replacement = document.querySelector(`[data-compare="${input.dataset.compare}"]`);
  replacement?.focus();
  announce(`${state.selected.size} configurations selected. Maximum three.`);
});
$('#clear-comparison').addEventListener('click', () => { state.selected.clear(); renderTable(); document.querySelector('[data-compare]')?.focus(); announce('Comparison cleared.'); });
$('#export-csv').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob(['\uFEFF', toCsv(visibleRows())], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'embodiedzip-planned-configurations.csv';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('Exported visible planned configurations. Unmeasured results are empty cells.');
});

$('#task-buttons').innerHTML = tasks.map((task, index) => `<button type="button" data-task="${task.id}" aria-pressed="${index === 0}" aria-controls="task-name task-description task-criteria scene-task-name"><span aria-hidden="true">${task.icon}</span>${task.name}</button>`).join('');
$('#task-matrix').innerHTML = tasks.map(task => `<tr><td>${task.name}</td>${Array.from({ length: 4 }, () => '<td aria-label="Unmeasured">—</td>').join('')}</tr>`).join('');
function selectTask(id) {
  const task = tasks.find(item => item.id === id);
  $('#task-name').textContent = task.name;
  $('#task-description').textContent = task.description;
  $('#task-criteria').textContent = task.criteria;
  $('#scene-task-name').textContent = task.name;
  document.querySelectorAll('[data-task]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.task === id)));
}
$('#task-buttons').addEventListener('click', event => { const button = event.target.closest('[data-task]'); if (button) { selectTask(button.dataset.task); announce(`Selected ${tasks.find(task => task.id === button.dataset.task).name}. Recordings and results pending.`); } });
selectTask(tasks[0].id);

setupTabs('[data-metric]', button => {
  const metric = analysisMetrics[button.dataset.metric];
  $('#analysis-panel').setAttribute('aria-labelledby', button.id);
  $('#distribution-title').textContent = metric.title;
  $('#distribution-unit').textContent = metric.unit;
  $('#tradeoff-title').textContent = metric.tradeoff;
  $('#tradeoff-unit').textContent = metric.axis;
  $('#chart-explanation').textContent = metric.explanation;
  $('.quadrant-note').textContent = metric.region;
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const entry = entries.filter(item => item.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!entry) return;
    document.querySelectorAll('.contents nav a').forEach(link => {
      const active = link.getAttribute('href') === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-10% 0px -40% 0px', threshold: [0, .1, .5] });
  document.querySelectorAll('.content>.section[id]').forEach(section => observer.observe(section));
}
renderTable();
