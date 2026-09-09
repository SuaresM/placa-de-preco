/* =========================================================
   JOGADOR — visão em primeira pessoa, movimento e colisão
   ========================================================= */
var Jogador = (function () {

  var camera, dom;
  var ativo = false;
  var ALTURA = 1.68, RAIO = 0.34;
  var vel = new THREE.Vector3();
  var teclas = {};
  var yaw = Math.PI, pitch = 0;          // começa olhando para o fundo da loja
  var euler = new THREE.Euler(0, 0, 0, 'YXZ');
  var passoAcum = 0, balanco = 0;
  var toque = { ativo: false, dx: 0, dy: 0, olharId: null, ox: 0, oy: 0 };
  var SENS = 0.0022;

  function iniciar(_camera, _dom) {
    camera = _camera; dom = _dom;
    camera.position.set(0, ALTURA, 10);

    document.addEventListener('keydown', function (e) {
      teclas[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    });
    document.addEventListener('keyup', function (e) { teclas[e.code] = false; });

    document.addEventListener('pointerlockchange', function () {
      var travado = document.pointerLockElement === dom;
      ativo = travado;
      if (typeof UI !== 'undefined') UI.mouseTravado(travado);
    });

    document.addEventListener('mousemove', function (e) {
      if (document.pointerLockElement !== dom) return;
      yaw   -= (e.movementX || 0) * SENS;
      pitch -= (e.movementY || 0) * SENS;
      pitch = Math.max(-1.35, Math.min(1.35, pitch));
    });

    iniciarToque();
  }

  /* ---------------- controles de toque (celular/tablet) ---------------- */
  function iniciarToque() {
    var base = document.getElementById('base'), manete = document.getElementById('manete');
    var idJoy = null, cx = 0, cy = 0;

    function inicioJoy(e) {
      var t = e.changedTouches[0];
      idJoy = t.identifier;
      var r = base.getBoundingClientRect();
      cx = r.left + r.width/2; cy = r.top + r.height/2;
      e.preventDefault();
    }
    function moveJoy(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === idJoy) {
          var dx = (t.clientX - cx) / 55, dy = (t.clientY - cy) / 55;
          var m = Math.sqrt(dx*dx + dy*dy);
          if (m > 1) { dx /= m; dy /= m; }
          toque.dx = dx; toque.dy = dy;
          manete.style.transform = 'translate(' + (dx*32) + 'px,' + (dy*32) + 'px)';
        } else if (t.identifier === toque.olharId) {
          yaw   -= (t.clientX - toque.ox) * 0.005;
          pitch -= (t.clientY - toque.oy) * 0.005;
          pitch = Math.max(-1.35, Math.min(1.35, pitch));
          toque.ox = t.clientX; toque.oy = t.clientY;
        }
      }
      e.preventDefault();
    }
    function fimJoy(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === idJoy) { idJoy = null; toque.dx = toque.dy = 0; manete.style.transform = ''; }
        if (t.identifier === toque.olharId) toque.olharId = null;
      }
    }
    base.addEventListener('touchstart', inicioJoy, { passive: false });
    document.addEventListener('touchmove', moveJoy, { passive: false });
    document.addEventListener('touchend', fimJoy);
    document.addEventListener('touchcancel', fimJoy);

    // arrastar na tela para olhar
    dom.addEventListener('touchstart', function (e) {
      if (toque.olharId === null) {
        var t = e.changedTouches[0];
        toque.olharId = t.identifier; toque.ox = t.clientX; toque.oy = t.clientY;
      }
    }, { passive: true });
  }

  /* ---------------- colisão simples com caixas ---------------- */
  function colide(x, z) {
    var c = Mundo.colisores;
    for (var i = 0; i < c.length; i++) {
      if (x > c[i].x1 - RAIO && x < c[i].x2 + RAIO &&
          z > c[i].z1 - RAIO && z < c[i].z2 + RAIO) return true;
    }
    return false;
  }

  function atualizar(dt) {
    // direção desejada
    var frente = 0, lado = 0;
    if (ativo) {
      if (teclas['KeyW'] || teclas['ArrowUp'])    frente += 1;
      if (teclas['KeyS'] || teclas['ArrowDown'])  frente -= 1;
      if (teclas['KeyA'] || teclas['ArrowLeft'])  lado   -= 1;
      if (teclas['KeyD'] || teclas['ArrowRight']) lado   += 1;
    }
    if (toque.dx || toque.dy) { frente += -toque.dy; lado += toque.dx; }

    var m = Math.sqrt(frente*frente + lado*lado);
    if (m > 1) { frente /= m; lado /= m; }

    var correndo = teclas['ShiftLeft'] || teclas['ShiftRight'];
    var velocidade = correndo ? 4.6 : 2.7;

    // move relativo à direção do olhar
    var sin = Math.sin(yaw), cos = Math.cos(yaw);
    var alvoX = (lado * cos - frente * sin) * velocidade;
    var alvoZ = (-lado * sin - frente * cos) * velocidade;

    // suavização (inércia leve)
    vel.x += (alvoX - vel.x) * Math.min(1, dt * 12);
    vel.z += (alvoZ - vel.z) * Math.min(1, dt * 12);

    var px = camera.position.x, pz = camera.position.z;
    var nx = px + vel.x * dt, nz = pz + vel.z * dt;
    if (!colide(nx, pz)) px = nx; else vel.x = 0;
    if (!colide(px, nz)) pz = nz; else vel.z = 0;

    // limites gerais do prédio
    px = Math.max(-14.5, Math.min(14.5, px));
    pz = Math.max(-19.5, Math.min(11.4, pz));

    camera.position.x = px; camera.position.z = pz;

    // balanço da caminhada + som dos passos
    var andando = Math.sqrt(vel.x*vel.x + vel.z*vel.z);
    balanco += dt * andando * 2.4;
    camera.position.y = ALTURA + Math.sin(balanco * 2) * 0.022;
    passoAcum += andando * dt;
    if (passoAcum > 1.5) { passoAcum = 0; Som.passo(); }

    euler.set(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
  }

  return {
    iniciar: iniciar,
    atualizar: atualizar,
    travar: function () { dom.requestPointerLock && dom.requestPointerLock(); },
    liberar: function () { document.exitPointerLock && document.exitPointerLock(); },
    estaAtivo: function () { return ativo; },
    definirAtivo: function (v) { ativo = v; },
    posicao: function () { return camera.position; },
    direcao: function () { return new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); },
    ir: function (x, z, angulo) {
      camera.position.x = x; camera.position.z = z;
      if (angulo !== undefined) yaw = angulo;
    }
  };
})();
