(() => {
  const dialog = document.getElementById('ar-dialog');
  const stage = document.getElementById('ar-stage');
  const loading = document.getElementById('ar-loading');
  const status = document.getElementById('ar-device-status');
  const start = document.getElementById('ar-start');
  const help = document.getElementById('ar-help');
  const diagnostics = document.getElementById('ar-diagnostics');
  const recheck = document.getElementById('ar-recheck');
  const link = new URL('./#ar-organizador', window.location.href).href;
  let libraryPromise, viewerPromise, viewer, loaded = false, activeSession = false;
  let supportCheck = 0, support = { session: 'checking' };

  function environment() {
    let policy = 'unknown';
    try {
      const permissions = document.permissionsPolicy || document.featurePolicy;
      if (permissions?.allowsFeature) policy = permissions.allowsFeature('xr-spatial-tracking') ? 'allowed' : 'blocked';
    } catch { /* Older browsers do not expose the effective policy. */ }
    return { secure: window.isSecureContext, embedded: window.self !== window.top, api: !!navigator.xr, policy };
  }
  async function checkSupport() {
    const current = ++supportCheck;
    const result = { ...environment(), session: 'checking' };
    support = result;
    recheck.disabled = true;
    updateSupport();
    let timer;
    try {
      result.session = !result.api ? 'missing' : await Promise.race([
        navigator.xr.isSessionSupported('immersive-ar').then(value => value ? 'supported' : 'unavailable'),
        new Promise(resolve => { timer = setTimeout(() => resolve('timeout'), 8000); })
      ]);
    } catch (error) { result.session = error.name === 'SecurityError' ? 'blocked' : 'error'; }
    finally {
      clearTimeout(timer);
      if (current === supportCheck) { recheck.disabled = false; updateSupport(); }
    }
  }

  function loadLibrary() {
    if (customElements.get('model-viewer')) return Promise.resolve();
    if (!libraryPromise) libraryPromise = import('./assets/model-viewer.min.js').then(() => customElements.whenDefined('model-viewer')).catch(error => { libraryPromise = null; throw error; });
    return libraryPromise;
  }
  function updateSupport() {
    if (!loaded || !viewer || activeSession) return;
    const supported = !!viewer.canActivateAR;
    start.hidden = !supported;
    help.hidden = supported;
    if (supported) status.textContent = 'Tu navegador ofrece realidad aumentada. Tocá “Activar cámara y colocar” para continuar.';
    else if (!support.secure) status.textContent = 'La cámara en AR necesita una conexión HTTPS segura. Abrí el enlace publicado del catálogo.';
    else if (support.policy === 'blocked' || support.session === 'blocked') status.textContent = 'Esta página tiene bloqueado el acceso a la realidad aumentada por una política de permisos. No significa que tu celular sea incompatible. Probá el enlace directo; si continúa, compartinos el diagnóstico.';
    else if (support.embedded) status.textContent = 'El catálogo está abierto dentro de otra página. Abrí el enlace directo en Chrome o Safari para comprobar AR fuera de la vista integrada.';
    else if (support.session === 'checking') status.textContent = 'Comprobando la realidad aumentada del sistema… La cámara sigue apagada.';
    else if (support.session === 'supported') status.textContent = 'El sistema informa soporte AR, pero el visor todavía no puede iniciarlo. Esperá unos segundos o recargá la página.';
    else if (support.session === 'timeout' || support.session === 'error') status.textContent = 'No pudimos completar la comprobación de AR. Reintentá o compartinos el diagnóstico; todavía no podemos confirmar la causa.';
    else status.textContent = 'La realidad aumentada no está disponible en esta sesión. En Android, revisá Servicios de Google Play para RA y Chrome. Este resultado no identifica por sí solo una incompatibilidad del teléfono.';
    document.getElementById('ar-support-note').hidden = supported;
    const labels = { checking: 'Comprobando', missing: 'API no disponible', supported: 'Disponible', unavailable: 'No disponible en esta sesión', blocked: 'Acceso bloqueado', timeout: 'Sin respuesta', error: 'No se pudo comprobar' };
    diagnostics.textContent = [
      'Diagnóstico Caoba AR · v7',
      `Conexión segura: ${support.secure ? 'Sí' : 'No'}`,
      `Página integrada: ${support.embedded ? 'Sí' : 'No'}`,
      `Permiso de seguimiento: ${{allowed:'Permitido',blocked:'Bloqueado',unknown:'No informado'}[support.policy] || 'Comprobando'}`,
      `WebXR: ${support.api ? 'Presente' : 'No disponible'}`,
      `Sesión AR del sistema: ${labels[support.session]}`,
      `Activación del visor: ${supported ? 'Disponible' : 'No disponible'}`
    ].join('\n');
  }
  async function prepareViewer() {
    if (viewer) { updateSupport(); return; }
    await loadLibrary();
    viewer = document.createElement('model-viewer');
    for (const [name, value] of Object.entries({
      src: 'assets/models/organizador-180x50x30.glb',
      alt: 'Organizador blanco aproximado, de 180 centímetros de alto, 50 de ancho y 30 de profundidad',
      ar: '', 'ar-modes': 'webxr quick-look', 'ar-scale': 'fixed', 'ar-placement': 'floor',
      'camera-controls': '', 'touch-action': 'pan-y', 'shadow-intensity': '1',
      exposure: '1', 'camera-orbit': '30deg 75deg 3.7m', 'interaction-prompt': 'none',
      loading: 'eager', reveal: 'auto',
      poster: 'assets/organizador-600.webp'
    })) viewer.setAttribute(name, value);
    // Keep one clear activation button outside the 3D viewer. No camera starts on load.
    const hiddenNativeButton = document.createElement('span');
    hiddenNativeButton.slot = 'ar-button';
    hiddenNativeButton.hidden = true;
    viewer.append(hiddenNativeButton);
    viewer.addEventListener('load', () => {
      loaded = true;
      loading.hidden = true;
      checkSupport();
      setTimeout(updateSupport, 1000);
    });
    viewer.addEventListener('error', () => {
      loaded = false;
      loading.hidden = false;
      loading.textContent = 'No se pudo cargar el modelo. Revisá la conexión y probá abrir esta página directamente en tu navegador.';
      status.textContent = 'El modelo no está disponible en este momento.';
      start.hidden = true;
      viewer?.remove();
      viewer = undefined;
    });
    viewer.addEventListener('ar-status', event => {
      const state = event.detail.status;
      activeSession = state === 'session-started' || state === 'object-placed';
      if (state === 'session-started') status.textContent = 'Mové el celular lentamente y apuntá a un piso bien iluminado.';
      else if (state === 'object-placed') status.textContent = 'Modelo colocado. Podés moverlo y girarlo; la escala está fijada a las medidas del mueble.';
      else if (state === 'failed') status.textContent = 'No se pudo iniciar la cámara en AR. Revisá los permisos o probá en Safari para iPhone o Chrome para Android compatible.';
      else if (state === 'not-presenting') { activeSession = false; updateSupport(); }
    });
    viewer.addEventListener('ar-tracking', event => {
      if (event.detail.status === 'not-tracking') status.textContent = 'El seguimiento se perdió. Apuntá a una superficie con detalles y buena luz para recuperarlo.';
    });
    viewer.addEventListener('model-visibility', updateSupport);
    stage.prepend(viewer);
  }
  async function openAR() {
    document.querySelectorAll('dialog[open]').forEach(other => { if (other !== dialog) other.close(); });
    if (!dialog.open) dialog.showModal();
    if (!viewer) {
      loading.hidden = false;
      loading.textContent = 'Preparando el organizador para tu espacio…';
      status.textContent = 'Cargando el modelo y comprobando la compatibilidad del navegador.';
      try { viewerPromise ??= prepareViewer().finally(() => { viewerPromise = null; }); await viewerPromise; }
      catch { loading.textContent = 'No se pudo iniciar el visor. Revisá la conexión y volvé a intentarlo.'; status.textContent = 'La cámara no se activó.'; }
    } else updateSupport();
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-open-ar]')) openAR();
  });
  start.addEventListener('click', async () => {
    if (!loaded || !viewer.canActivateAR) { updateSupport(); return; }
    start.disabled = true;
    try { await viewer.activateAR(); }
    catch { status.textContent = 'No se pudo iniciar AR. Revisá el permiso de cámara y la compatibilidad de tu celular.'; }
    finally { start.disabled = false; }
  });
  recheck.addEventListener('click', checkSupport);
  document.getElementById('ar-copy-diagnostics').addEventListener('click', async () => {
    const result = document.getElementById('ar-diagnostics-result');
    try { await navigator.clipboard.writeText(diagnostics.textContent); result.textContent = 'Diagnóstico copiado. Podés pegarlo en la conversación.'; }
    catch { result.textContent = 'Seleccioná el diagnóstico para copiarlo manualmente.'; }
  });
  document.getElementById('ar-copy-link').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(link); document.getElementById('ar-copy-status').textContent = 'Enlace copiado.'; }
    catch { document.getElementById('ar-copy-status').textContent = 'Podés copiar el enlace que aparece debajo del QR.'; }
  });
  document.getElementById('ar-return-studio').addEventListener('click', () => { dialog.close(); openStudio(); });
  const route = () => { if (location.hash === '#ar-organizador') openAR(); };
  window.addEventListener('hashchange', route);
  navigator.xr?.addEventListener('devicechange', () => { if (dialog.open && !activeSession) checkSupport(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && dialog.open && loaded && !activeSession) checkSupport(); });
  route();
})();
