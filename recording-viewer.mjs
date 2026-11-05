// Use the official versioned Rerun iframe; task recordings specify their SDK version.
export const DEFAULT_RERUN_VERSION = '0.42.0';

export function recordingUrl(value, baseUrl) {
  if (!value?.trim()) return null;
  const url = new URL(value.trim(), baseUrl);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use a public HTTP(S) recording URL without embedded credentials.');
  return url.href;
}

export function viewerUrl({ url = null, version = DEFAULT_RERUN_VERSION } = {}, baseUrl = 'https://lxroboticslab.github.io/EmbodiedZip-website/') {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Enter a Rerun SDK version such as 0.42.0.');
  const target = new URL(`https://app.rerun.io/version/${version}/`);
  target.searchParams.set('theme', 'light');
  // WebGL avoids blank WebGPU canvases on unsupported/software GPUs.
  target.searchParams.set('renderer', 'webgl');
  const source = recordingUrl(url, baseUrl);
  if (source) target.searchParams.set('url', source);
  return target.href;
}

export function createRecordingViewer(root) {
  const query = selector => root.querySelector(selector);
  const frame = query('#rerun-frame');
  const stage = query('#rerun-stage');
  const status = query('#rerun-status');
  const message = query('#rerun-message');
  const urlInput = query('#recording-url');
  const versionInput = query('#recording-version');
  const openLink = query('#rerun-open');
  let task = null;
  let activeUrl = null;
  let hasMounted = false;
  let loadTimer = 0;
  let loadedSrc = null;

  function setMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
  }
  function mount() {
    if (!activeUrl || loadedSrc === activeUrl) return;
    hasMounted = true;
    loadedSrc = activeUrl;
    clearTimeout(loadTimer);
    status.textContent = 'Opening Rerun…';
    stage.setAttribute('aria-busy', 'true');
    frame.src = activeUrl;
    loadTimer = setTimeout(() => {
      stage.setAttribute('aria-busy', 'false');
      status.textContent = 'Viewer taking longer than expected';
      setMessage('Use “Open full viewer” if the embedded viewer is slow or unavailable. Recording load errors are shown inside Rerun.');
    }, 45000);
  }
  frame.addEventListener('load', () => {
    if (!hasMounted || frame.getAttribute('src') !== loadedSrc) return;
    clearTimeout(loadTimer);
    stage.setAttribute('aria-busy', 'false');
    status.textContent = 'Rerun frame opened';
    // iframe load confirms the frame, not successful decoding of a recording.
  });
  frame.addEventListener('error', () => {
    clearTimeout(loadTimer);
    stage.setAttribute('aria-busy', 'false');
    status.textContent = 'Viewer unavailable';
    setMessage('The viewer could not open. Try “Open full viewer” or reload.', true);
  });

  function setSource(source, version, mountNow) {
    const next = viewerUrl({ url: source, version }, window.location.href);
    activeUrl = next;
    openLink.href = next;
    if (mountNow || hasMounted) mount();
  }
  function selectTask(nextTask) {
    const changed = task?.id !== nextTask.id;
    task = nextTask;
    if (!changed) return;
    const recording = task.recording;
    urlInput.value = recording?.url || '';
    versionInput.value = recording?.sdkVersion || DEFAULT_RERUN_VERSION;
    query('#recording-source').textContent = recording ? 'Task recording' : 'No published task recording';
    query('#recording-context').textContent = recording ? `${task.name} · ${recording.label || 'Published recording'}` : `${task.name} · Recording pending`;
    setMessage(recording ? 'Use the timeline to replay. Select an entity to inspect its components, or add a Dataframe view to explore logged rows.' : 'No task recording yet. Open a local .rrd inside Rerun, drag a file into its canvas, or load a recording URL below.');
    if (hasMounted) loadedSrc = null;
    try { setSource(recording?.url || null, versionInput.value, false); }
    catch (error) { setMessage(error.message, true); }
  }

  query('#recording-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const source = recordingUrl(urlInput.value, window.location.href);
      if (!source) throw new Error('Enter a recording URL to load.');
      setSource(source, versionInput.value.trim(), true);
      query('#recording-source').textContent = 'Custom recording · not a benchmark result';
      setMessage('Custom recording opened in Rerun. Check the viewer for loading status; task scores and leaderboard data are unchanged.');
    } catch (error) { setMessage(error.message, true); }
  });
  query('#rerun-reset').addEventListener('click', () => {
    loadedSrc = null;
    const current = task;
    task = null;
    selectTask(current);
    mount();
  });
  query('#rerun-fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === stage) await document.exitFullscreen();
      else if (stage.requestFullscreen) await stage.requestFullscreen();
      else throw new Error('Fullscreen is unavailable. Use “Open full viewer” instead.');
    } catch (error) { setMessage(error.message, true); }
  });
  document.addEventListener('fullscreenchange', () => query('#rerun-fullscreen').textContent = document.fullscreenElement === stage ? 'Exit fullscreen ↙' : 'Fullscreen ↗');

  // Heavy viewer/Wasm resources are fetched only as the explorer approaches.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { mount(); observer.disconnect(); }
    }, { rootMargin: '250px' });
    observer.observe(root);
  } else queueMicrotask(mount);
  window.addEventListener('pagehide', () => clearTimeout(loadTimer));
  return { selectTask };
}
