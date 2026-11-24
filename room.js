(() => {
  const dialog = document.getElementById('room-dialog');
  const stage = document.getElementById('room-stage');
  const video = document.getElementById('room-video');
  const photo = document.getElementById('room-photo');
  const canvas = document.getElementById('room-model');
  const start = document.getElementById('room-camera');
  const stop = document.getElementById('room-stop');
  const photoInput = document.getElementById('room-file');
  const status = document.getElementById('room-status');
  const size = document.getElementById('room-size');
  const angle = document.getElementById('room-angle');
  const directLink = document.getElementById('room-direct-link');

  const initial = { x: 0.5, y: 0.82, size: 56, angle: 26 };
  const placement = { ...initial };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let draw, rendererPromise, frame, stream, photoUrl, drag, opener;
  let cameraAttempt = 0;
  let photoAttempt = 0;

  function render() {
    if (frame || !draw || !dialog.open) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      if (dialog.open) draw(placement);
    });
  }

  function resetPlacement() {
    Object.assign(placement, initial);
    size.value = initial.size;
    angle.value = initial.angle;
    render();
  }

  function prepareModel() {
    if (draw) { render(); return; }
    rendererPromise ??= import('./room-render.js').then(({ createRoomRenderer }) => {
      draw = createRoomRenderer(canvas);
      render();
    }).catch(() => {
      rendererPromise = undefined;
      if (dialog.open) status.textContent = 'No se pudo mostrar el modelo 3D. Probá recargar la página o usar otro navegador.';
    });
  }

  function stopCamera() {
    cameraAttempt++;
    const previous = stream;
    stream = undefined;
    previous?.getTracks().forEach(track => track.stop());
    video.pause();
    video.srcObject = null;
    video.hidden = true;
    stop.hidden = true;
    stop.textContent = 'Apagar cámara';
    start.hidden = false;
    start.disabled = false;
  }

  function clearPhoto() {
    photoAttempt++;
    photo.hidden = true;
    photo.removeAttribute('src');
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = undefined;
  }

  function cameraBlocked() {
    const policy = document.permissionsPolicy || document.featurePolicy;
    return policy?.allowsFeature?.('camera') === false;
  }

  function cameraError(error) {
    if (cameraBlocked() || window.self !== window.top) {
      directLink.hidden = false;
      return 'La vista integrada no pudo acceder a la cámara. Abrí el enlace directo en Chrome o usá una foto.';
    }
    switch (error.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Revisá el permiso de cámara del catálogo en tu navegador y volvé a intentar. También podés usar una foto.';
      case 'NotFoundError':
        return 'El navegador no encontró una cámara disponible. Podés usar una foto de tu espacio.';
      case 'NotReadableError':
        return 'La cámara no está disponible. Cerrá las otras apps que la estén usando y probá de nuevo.';
      default:
        return 'No se pudo iniciar la cámara. Volvé a intentar o usá una foto.';
    }
  }

  start.addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getUserMedia || cameraBlocked()) {
      directLink.hidden = false;
      status.textContent = 'La cámara no está disponible en esta vista. Abrí el catálogo en tu navegador o usá una foto.';
      return;
    }
    const attempt = ++cameraAttempt;
    photoAttempt++;
    start.disabled = true;
    stop.hidden = false;
    stop.textContent = 'Cancelar acceso';
    status.textContent = 'Esperando acceso a la cámara…';

    try {
      const input = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 960 }, height: { ideal: 720 } }
      });
      if (attempt !== cameraAttempt || !dialog.open || document.hidden) {
        input.getTracks().forEach(track => track.stop());
        return;
      }
      stream = input;
      for (const track of input.getVideoTracks()) {
        track.addEventListener('ended', () => {
          if (stream !== input) return;
          stopCamera();
          status.textContent = 'Se cerró la cámara. Podés volver a encenderla o usar una foto.';
        }, { once: true });
      }
      video.srcObject = input;
      await video.play();
      if (stream !== input || !dialog.open) return;
      clearPhoto();
      video.hidden = false;
      start.hidden = true;
      stop.textContent = 'Apagar cámara';
      directLink.hidden = true;
      status.textContent = 'Cámara encendida. Arrastrá el mueble hasta el lugar que quieras probar.';
    } catch (error) {
      if (attempt !== cameraAttempt || !dialog.open) return;
      stopCamera();
      status.textContent = cameraError(error);
    }
  });

  stop.addEventListener('click', () => {
    stopCamera();
    status.textContent = 'Cámara apagada.';
    start.focus();
  });

  document.getElementById('room-pick-photo').addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    photoInput.value = '';
    if (!file || !dialog.open) return;
    if (file.size > 24 * 1024 * 1024) {
      status.textContent = 'Elegí una foto de hasta 24 MB.';
      return;
    }
    const attempt = ++photoAttempt;
    stopCamera();
    const url = URL.createObjectURL(file);
    const candidate = new Image();
    candidate.src = url;
    try {
      await candidate.decode();
    } catch {
      URL.revokeObjectURL(url);
      if (attempt === photoAttempt && dialog.open) status.textContent = 'No se pudo abrir esa foto. Probá con JPG, PNG o WebP.';
      return;
    }
    if (attempt !== photoAttempt || !dialog.open) { URL.revokeObjectURL(url); return; }
    clearPhoto();
    photoUrl = url;
    photo.src = url;
    photo.hidden = false;
    status.textContent = 'Foto lista. Arrastrá el mueble y ajustá el tamaño y el giro.';
  });

  function moveTo(x, y) {
    placement.x = clamp(x, 0.05, 0.95);
    placement.y = clamp(y, 0.2, 0.97);
    render();
  }

  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: placement.x, y: placement.y };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    moveTo(drag.x + (event.clientX - drag.startX) / stage.clientWidth, drag.y + (event.clientY - drag.startY) / stage.clientHeight);
  });
  stage.addEventListener('lostpointercapture', () => { drag = undefined; });
  stage.addEventListener('keydown', event => {
    const moves = { ArrowLeft: [-0.025, 0], ArrowRight: [0.025, 0], ArrowUp: [0, -0.025], ArrowDown: [0, 0.025] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveTo(placement.x + move[0], placement.y + move[1]);
  });
  size.addEventListener('input', () => { placement.size = Number(size.value); render(); });
  angle.addEventListener('input', () => { placement.angle = Number(angle.value); render(); });
  document.getElementById('room-reset').addEventListener('click', resetPlacement);
  new ResizeObserver(render).observe(stage);

  function openRoom(trigger) {
    if (dialog.open) return;
    stopCamera();
    clearPhoto();
    opener = trigger;
    dialog.showModal();
    resetPlacement();
    status.textContent = 'Activá la cámara o elegí una foto para empezar.';
    directLink.hidden = true;
    prepareModel();
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-room]');
    if (trigger) openRoom(trigger);
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    stopCamera();
    clearPhoto();
    drag = undefined;
    if (opener?.isConnected && opener.getClientRects().length) opener.focus();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && (stream || start.disabled)) {
      stopCamera();
      status.textContent = 'La cámara se apagó al salir de la pestaña.';
    }
  });
  window.addEventListener('pagehide', () => { stopCamera(); clearPhoto(); });
  function route() {
    if (location.hash === '#camara-organizador') openRoom();
  }
  window.addEventListener('hashchange', route);
  route();
})();
