/* =========================================================
   MAIN — liga tudo: renderizador, câmera, loop e interação
   ========================================================= */
(function () {

  var cena, camera, renderer, relogio;
  var refs, jogoIniciado = false, pausado = false, tempoJogo = 0;
  var alvo = null;                 // ponto de interação mais perto
  var ehToque = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  /* ---------------- inicialização ---------------- */
  function iniciar() {
    UI.iniciar();

    cena = new THREE.Scene();
    cena.background = new THREE.Color(0x9dbdd6);
    cena.fog = new THREE.Fog(0xc4d6e2, 45, 95);

    camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 120);
    cena.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // reflexos do ambiente (deixa metal, vidro e piso realistas)
    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var eq = new THREE.CanvasTexture(Tex.ambiente());
    eq.mapping = THREE.EquirectangularReflectionMapping;
    eq.encoding = THREE.sRGBEncoding;
    cena.environment = pmrem.fromEquirectangular(eq).texture;

    refs = Mundo.construir(cena);
    window.__refs = refs;                    // ajuda em testes e ajustes
    Jogador.iniciar(camera, renderer.domElement);
    relogio = new THREE.Clock();

    montarMenu();
    ligarBotoes();

    if (ehToque) { UI.modoToque(true); Jogador.definirAtivo(true); }

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    UI.esconderCarregando();
    animar();
  }

  /* ---------------- menu inicial ---------------- */
  function montarMenu() {
    var g = UI.gradeModulos();
    Missoes.LISTA.forEach(function (m, i) {
      var d = document.createElement('div');
      d.className = 'modulo';
      d.innerHTML = '<b>' + (i + 1) + '. ' + m.titulo + '</b><small>' + m.resumo + '</small>';
      g.appendChild(d);
    });
  }

  function ligarBotoes() {
    document.getElementById('btnIniciar').addEventListener('click', function () {
      Som.ligar();
      UI.tela('telaInicio', false);
      UI.mostrarHUD(true);
      jogoIniciado = true; pausado = false; tempoJogo = 0;
      Jogador.ir(0, 10.2, Math.PI);
      if (!ehToque) Jogador.travar();
      Missoes.iniciar(refs, camera);
    });

    document.getElementById('btnLivre').addEventListener('click', function () {
      Som.ligar();
      UI.tela('telaInicio', false);
      UI.mostrarHUD(true);
      jogoIniciado = true; pausado = false;
      Jogador.ir(0, 10.2, Math.PI);
      if (!ehToque) Jogador.travar();
      Missoes.modoLivre();
    });

    document.getElementById('btnContinuar').addEventListener('click', continuar);
    document.getElementById('btnReiniciar').addEventListener('click', function () { location.reload(); });

    // volta o mouse para o jogo depois de fechar uma janela
    document.getElementById('btnFechaModal').addEventListener('click', retomarMouse);
    document.getElementById('btnSairPdv').addEventListener('click', retomarMouse);

    // clicar na tela: interagir (ou retomar o controle do mouse)
    renderer.domElement.addEventListener('click', function () {
      if (!jogoIniciado || UI.modalAberto() || UI.pdvAberto()) return;
      if (!ehToque && !document.pointerLockElement) { Jogador.travar(); return; }
      interagir();
    });

    // botão de ação no celular
    UI.botaoAcao().addEventListener('touchstart', function (e) { e.preventDefault(); interagir(); });
    UI.botaoAcao().addEventListener('click', function (e) { e.preventDefault(); interagir(); });

    document.addEventListener('keydown', function (e) {
      if (!jogoIniciado) return;
      if (e.code === 'KeyE') interagir();
      if (e.code === 'Escape' && (UI.modalAberto() || UI.pdvAberto())) return;
    });

    // Esc solta o mouse -> pausa
    document.addEventListener('pointerlockchange', function () {
      if (!jogoIniciado || ehToque) return;
      if (!document.pointerLockElement && !UI.modalAberto() && !UI.pdvAberto()) pausar();
      if (document.pointerLockElement) { pausado = false; UI.tela('telaPausa', false); }
    });
  }

  function retomarMouse() {
    if (!jogoIniciado || ehToque) return;
    setTimeout(function () {
      if (!UI.modalAberto() && !UI.pdvAberto() && !pausado) {
        try { Jogador.travar(); } catch (e) { /* o clique na tela retoma */ }
      }
    }, 120);
  }

  function pausar() { pausado = true; UI.tela('telaPausa', true); }
  function continuar() {
    pausado = false; UI.tela('telaPausa', false);
    if (!ehToque) Jogador.travar();
  }

  /* ---------------- interação ---------------- */
  function acharAlvo() {
    var p = Jogador.posicao(), dir = Jogador.direcao();
    var melhor = null, melhorDist = 999;
    var lista = Mundo.interativos;
    for (var i = 0; i < lista.length; i++) {
      var it = lista[i];
      if (!it.ativo) continue;
      var dx = it.pos.x - p.x, dz = it.pos.z - p.z;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist > it.raio) continue;
      // precisa estar mais ou menos na frente do funcionário
      var dot = (dx/dist) * dir.x + (dz/dist) * dir.z;
      if (dist > 0.6 && dot < 0.25) continue;
      if (dist < melhorDist) { melhorDist = dist; melhor = it; }
    }
    return melhor;
  }

  function interagir() {
    if (!jogoIniciado || pausado || UI.modalAberto() || UI.pdvAberto()) return;
    if (alvo && alvo.acao) {
      var acao = alvo.acao;
      acao();
    }
  }

  /* ---------------- loop ---------------- */
  function animar() {
    requestAnimationFrame(animar);
    var dt = Math.min(relogio.getDelta(), 0.05);
    var t = relogio.getElapsedTime();

    var bloqueado = !jogoIniciado || pausado || UI.modalAberto() || UI.pdvAberto();
    if (ehToque) Jogador.definirAtivo(!bloqueado);

    if (!bloqueado) {
      Jogador.atualizar(dt);
      tempoJogo += dt;
      UI.tempo(tempoJogo);
    }
    Mundo.atualizar(t, dt);

    // dica de interação
    if (!bloqueado) {
      alvo = acharAlvo();
      if (alvo) UI.dica((ehToque ? 'Toque em <b>AÇÃO</b>' : 'Pressione <b>E</b>') + ' — ' + alvo.rotulo);
      else UI.dica(null);
    } else {
      UI.dica(null);
    }

    renderer.render(cena, camera);
  }

  window.addEventListener('load', iniciar);
})();
