/* =========================================================
   AUDIO — sons gerados na hora (sem arquivos externos)
   ========================================================= */
var Som = (function () {
  var ctx = null;

  function ligar() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // toca uma nota simples
  function nota(freq, dur, tipo, vol, atraso) {
    if (!ctx) return;
    var t0 = ctx.currentTime + (atraso || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = tipo || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  // ruído curto (passos, arrastar caixa)
  function ruido(dur, vol, corte) {
    if (!ctx) return;
    var n = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = corte || 900;
    var g = ctx.createGain(); g.gain.value = vol || 0.1;
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start();
  }

  return {
    ligar: ligar,
    bip:      function () { nota(2100, 0.09, 'square', 0.10); },       // leitor do caixa
    acerto:   function () { nota(660, 0.12, 'sine', 0.16); nota(990, 0.22, 'sine', 0.14, 0.10); },
    erro:     function () { nota(220, 0.22, 'sawtooth', 0.12); nota(160, 0.28, 'sawtooth', 0.10, 0.08); },
    missao:   function () { nota(523, 0.14, 'sine', 0.14); nota(659, 0.14, 'sine', 0.14, 0.12);
                            nota(784, 0.3, 'sine', 0.15, 0.24); },
    passo:    function () { ruido(0.09, 0.045, 620); },
    pegar:    function () { ruido(0.15, 0.09, 1500); nota(320, 0.08, 'triangle', 0.07); },
    porta:    function () { ruido(0.35, 0.10, 400); }
  };
})();
