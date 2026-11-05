// Dependency-free orthographic projection. Only complete measured runs become points.
const TAU = Math.PI / 180;
const DEFAULT_CAMERA = { yaw: -37 * TAU, pitch: 20 * TAU };
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

export function buildLandscapeData(rows) {
  const complete = rows.filter(row => Number.isFinite(row.latencyMs) && row.latencyMs >= 0 && Number.isFinite(row.memoryGb) && row.memoryGb >= 0 && Number.isFinite(row.successRate) && row.successRate >= 0 && row.successRate <= 100);
  const bounds = {
    latency: complete.length ? Math.max(1, ...complete.map(row => row.latencyMs)) * 1.1 : null,
    memory: complete.length ? Math.max(1, ...complete.map(row => row.memoryGb)) * 1.1 : null,
    success: 100,
  };
  return {
    bounds,
    points: complete.map(row => ({ row, position: [row.latencyMs / bounds.latency - .5, row.successRate / 100 - .5, row.memoryGb / bounds.memory - .5] })),
    pending: rows.length - complete.length,
  };
}

export function projectPoint([x, y, z], { yaw, pitch }) {
  const horizontal = Math.cos(yaw) * x + Math.sin(yaw) * z;
  const depth = -Math.sin(yaw) * x + Math.cos(yaw) * z;
  return { x: 400 + horizontal * 235, y: 225 - (Math.cos(pitch) * y - Math.sin(pitch) * depth) * 235, depth: Math.sin(pitch) * y + Math.cos(pitch) * depth };
}

function number(value) { return Number(value.toFixed(2)).toString(); }

export function createLandscape(root) {
  const query = selector => root.querySelector(selector);
  const svg = query('#landscape-svg');
  const geometry = query('#landscape-geometry');
  const tooltip = query('#landscape-tooltip');
  const camera = { ...DEFAULT_CAMERA };
  let view = '3d';
  let rows = [];
  let selected = new Set();
  let dataset = buildLandscapeData(rows);
  let drag = null;
  let currentId = null;

  function project(position) { return projectPoint(position, camera); }
  function line(a, b, className) {
    const start = project(a), end = project(b);
    return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" class="${className}"/>`;
  }
  function label(position, text, className = 'landscape-axis', anchor = 'middle') {
    const point = project(position);
    return `<text x="${point.x}" y="${point.y}" text-anchor="${anchor}" class="${className}">${escape(text)}</text>`;
  }
  function face(positions) {
    return `<polygon points="${positions.map(position => { const point = project(position); return `${point.x},${point.y}`; }).join(' ')}" class="landscape-plane"/>`;
  }
  function renderGeometry() {
    let markup = '';
    const origin = [-.5, -.5, -.5];
    if (view === '3d') {
      const faces = [
        [[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]],
        [[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]],
        [[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]],
      ];
      faces.sort((a,b) => b.reduce((sum,point)=>sum+project(point).depth,0)-a.reduce((sum,point)=>sum+project(point).depth,0));
      markup += faces.map(face).join('');
      for (let i=0;i<=4;i++) {
        const t=i/4-.5;
        markup += line([t,-.5,-.5],[t,-.5,.5],'landscape-grid');
        markup += line([-.5,-.5,t],[.5,-.5,t],'landscape-grid');
        markup += line([t,-.5,-.5],[t,.5,-.5],'landscape-grid');
        markup += line([-.5,t,-.5],[.5,t,-.5],'landscape-grid');
        markup += line([-.5,t,-.5],[-.5,t,.5],'landscape-grid');
        markup += line([-.5,-.5,t],[-.5,.5,t],'landscape-grid');
      }
      for (const x of [-.5,.5]) for (const y of [-.5,.5]) markup += line([x,y,-.5],[x,y,.5],'landscape-frame');
      for (const x of [-.5,.5]) for (const z of [-.5,.5]) markup += line([x,-.5,z],[x,.5,z],'landscape-frame');
      for (const y of [-.5,.5]) for (const z of [-.5,.5]) markup += line([-.5,y,z],[.5,y,z],'landscape-frame');
      markup += line(origin,[.62,-.5,-.5],'landscape-axis-line');
      markup += line(origin,[-.5,-.5,.62],'landscape-axis-line');
      markup += line(origin,[-.5,.62,-.5],'landscape-axis-line');
      markup += label([.83,-.6,-.5],'Latency (ms) ↓');
      markup += label([-.5,-.6,.83],'Memory (GB) ↓');
      markup += label([-.5,.68,-.5],'Success rate (%) ↑');
      if (!dataset.points.length) {
        markup += label([.83,-.72,-.5],'Scale pending','landscape-tick');
        markup += label([-.5,-.72,.83],'Scale pending','landscape-tick');
      }
      for (let i=0;i<=4;i++) {
        const t=i/4-.5;
        markup += label([-.59,t,-.53],`${i*25}%`,'landscape-tick','end');
        if(dataset.points.length) {
          markup += label([t,-.58,-.5],number(i*dataset.bounds.latency/4),'landscape-tick');
          markup += label([-.5,-.58,t],number(i*dataset.bounds.memory/4),'landscape-tick');
        }
      }
    } else {
      const memory = view === 'memory';
      const position = (horizontal, vertical) => memory ? [0,vertical,horizontal] : [horizontal,vertical,0];
      markup += face([position(-.5,-.5),position(.5,-.5),position(.5,.5),position(-.5,.5)]);
      for(let i=0;i<=4;i++) {
        const t=i/4-.5;
        markup += line(position(t,-.5),position(t,.5),'landscape-grid');
        markup += line(position(-.5,t),position(.5,t),'landscape-grid');
        markup += label(position(-.59,t),`${i*25}%`,'landscape-tick','end');
        if(dataset.points.length) markup += label(position(t,-.59),number(i*(memory?dataset.bounds.memory:dataset.bounds.latency)/4),'landscape-tick');
      }
      markup += line(position(-.5,-.5),position(.62,-.5),'landscape-axis-line');
      markup += line(position(-.5,-.5),position(-.5,.62),'landscape-axis-line');
      markup += label(position(0,-.78),memory?'Memory (GB) ↓':'Latency (ms) ↓');
      markup += label(position(-.5,.77),'Success rate (%) ↑');
      if(!dataset.points.length) markup += label(position(0,-.65),'Scale pending','landscape-tick');
    }
    const points = dataset.points.map(point => ({...point, projected:project(point.position)})).sort((a,b)=>b.projected.depth-a.projected.depth);
    markup += points.map(({row,projected})=>`<circle cx="${projected.x}" cy="${projected.y}" r="${selected.has(row.id)?8:6}" class="landscape-point ${selected.has(row.id)?'is-selected':''}" data-point="${escape(row.id)}" tabindex="0" role="button" aria-label="${escape(row.name)}: latency ${row.latencyMs} milliseconds, memory ${row.memoryGb} GB, success ${row.successRate} percent"><title>${escape(row.name)} · ${row.latencyMs} ms · ${row.memoryGb} GB · ${row.successRate}%</title></circle>`).join('');
    geometry.innerHTML = markup;
  }

  function showDetails(id) {
    const row = dataset.points.find(point=>point.row.id===id)?.row;
    if(!row) return;
    currentId=id;
    tooltip.textContent=`${row.name} · ${number(row.latencyMs)} ms · ${number(row.memoryGb)} GB · ${number(row.successRate)}% success`;
    tooltip.hidden=false;
  }
  function hideDetails() { currentId=null;tooltip.hidden=true; }
  function syncCamera() {
    query('#landscape-yaw').value=Math.round(camera.yaw/TAU);
    query('#landscape-pitch').value=Math.round(camera.pitch/TAU);
    root.querySelectorAll('[data-landscape-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.landscapeView===view)));
    hideDetails();
    renderGeometry();
  }
  function setView(next) {
    view=next;
    Object.assign(camera,next==='3d'?DEFAULT_CAMERA:{yaw:next==='memory'?Math.PI/2:0,pitch:0});
    syncCamera();
  }
  root.querySelectorAll('[data-landscape-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.landscapeView)));
  query('#landscape-reset').addEventListener('click',()=>setView('3d'));
  for(const [selector,key] of [['#landscape-yaw','yaw'],['#landscape-pitch','pitch']]) {
    query(selector).addEventListener('input',event=>{view='3d';camera[key]=Number(event.target.value)*TAU;syncCamera();});
  }
  svg.addEventListener('pointerdown',event=>{
    if(event.button!==0 || event.target.closest('[data-point]'))return;
    drag={x:event.clientX,y:event.clientY,yaw:camera.yaw,pitch:camera.pitch};
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove',event=>{
    if(!drag)return;
    view='3d';
    camera.yaw=Math.max(-Math.PI,Math.min(Math.PI,drag.yaw+(event.clientX-drag.x)*.009));
    camera.pitch=Math.max(-60*TAU,Math.min(60*TAU,drag.pitch+(event.clientY-drag.y)*.006));
    syncCamera();
  });
  const stopDrag=()=>{drag=null;};
  svg.addEventListener('pointerup',stopDrag);
  svg.addEventListener('pointercancel',stopDrag);
  svg.addEventListener('lostpointercapture',stopDrag);
  for(const type of ['pointerover','focusin','click'])svg.addEventListener(type,event=>{const point=event.target.closest('[data-point]');if(point)showDetails(point.dataset.point);});
  svg.addEventListener('pointerleave',()=>{if(!svg.contains(document.activeElement))hideDetails();});
  svg.addEventListener('focusout',event=>{if(!event.relatedTarget?.closest?.('[data-point]'))hideDetails();});
  svg.addEventListener('keydown',event=>{
    const point=event.target.closest('[data-point]');
    if(point && ['Enter',' '].includes(event.key)){event.preventDefault();showDetails(point.dataset.point);}
    if(event.key==='Escape')hideDetails();
  });

  return {
    update(nextRows, nextSelected=new Set()) {
      rows=nextRows; selected=nextSelected; dataset=buildLandscapeData(rows);
      const count=dataset.points.length;
      query('#landscape-count').textContent=`${count} measured point${count===1?'':'s'} · ${dataset.pending} pending`;
      query('#landscape-empty').hidden=count>0;
      query('#landscape-empty strong').textContent=rows.length?'Space for the first results.':'No matching configurations.';
      query('#landscape-status').textContent=count?`${count} complete measured configuration${count===1?'':'s'}. Incomplete results are excluded.`:'Waiting for complete latency, memory, and success-rate measurements.';
      query('#landscape-svg-description').textContent=`Latency in milliseconds, peak device memory in GB, and success rate from 0 to 100 percent. ${count} measured points; ${dataset.pending} unmeasured or incomplete configurations excluded. Drag to rotate or use the labeled sliders. Results also appear in the table below.`;
      const selectedRow=rows.find(row=>selected.has(row.id));
      const summary=selectedRow || (rows.length===1?rows[0]:null);
      for(const [id,key,unit] of [['latency','latencyMs','ms'],['memory','memoryGb','GB'],['success','successRate','%']]) {
        const value=summary?.[key];
        query(`#landscape-${id}`).innerHTML=`${Number.isFinite(value)?number(value):'—'} <small>${unit}</small>`;
      }
      if(currentId && !dataset.points.some(point=>point.row.id===currentId))hideDetails();
      renderGeometry();
    },
  };
}
