/* =========================================================
   TEXTURAS — tudo desenhado por código (nenhuma imagem externa).
   Assim o jogo abre offline e continua com visual detalhado.
   ========================================================= */
var Tex = (function () {

  /* ---------- utilidades de desenho ---------- */
  function tela(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return { c: c, x: c.getContext('2d') };
  }

  // granulado fino: dá "sujeira" e tira o aspecto de plástico liso
  function granulado(x, w, h, forca, alpha) {
    var img = x.getImageData(0, 0, w, h), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() - 0.5) * forca;
      d[i] += v; d[i + 1] += v; d[i + 2] += v;
      if (alpha) d[i + 3] = Math.min(255, d[i + 3]);
    }
    x.putImageData(img, 0, 0);
  }

  // manchas suaves (desgaste, marca de uso)
  function manchas(x, w, h, qtd, cor, opac, raioMax) {
    for (var i = 0; i < qtd; i++) {
      var px = Math.random() * w, py = Math.random() * h, r = 6 + Math.random() * (raioMax || 60);
      var g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba(' + cor + ',' + (opac * (0.4 + Math.random() * 0.6)).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + cor + ',0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.2832); x.fill();
    }
  }

  function textoCentro(x, txt, cx, cy, fonte, cor, maxW) {
    x.font = fonte; x.fillStyle = cor; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (maxW) x.fillText(txt, cx, cy, maxW); else x.fillText(txt, cx, cy);
  }

  function codigoBarras(x, px, py, w, h) {
    x.fillStyle = '#fff'; x.fillRect(px, py, w, h);
    var cur = px + 4;
    while (cur < px + w - 5) {
      var lw = 1 + Math.floor(Math.random() * 4);
      x.fillStyle = '#111'; x.fillRect(cur, py + 3, lw, h - 12);
      cur += lw + 1 + Math.floor(Math.random() * 4);
    }
  }

  /* ---------- conversão canvas -> textura ---------- */
  function textura(c, repX, repY, cor) {
    var t = new THREE.CanvasTexture(c);
    if (cor !== false) t.encoding = THREE.sRGBEncoding;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repX || 1, repY || 1);
    t.anisotropy = 8;
    return t;
  }

  var cache = {};
  function memo(chave, fn) {
    if (!cache[chave]) cache[chave] = fn();
    return cache[chave];
  }

  /* =========================================================
     PISO — porcelanato claro 60x60 com rejunte e brilho de uso
     ========================================================= */
  function piso() {
    return memo('piso', function () {
      var S = 1024, t = tela(S, S), x = t.x, n = 4, p = S / n;      // 4x4 placas
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var base = 214 + Math.floor(Math.random() * 12) - 6;
        x.fillStyle = 'rgb(' + base + ',' + (base - 2) + ',' + (base - 6) + ')';
        x.fillRect(i * p, j * p, p, p);
        // veios do porcelanato
        x.save(); x.beginPath(); x.rect(i * p, j * p, p, p); x.clip();
        for (var v = 0; v < 14; v++) {
          x.strokeStyle = 'rgba(160,155,148,' + (0.05 + Math.random() * 0.10) + ')';
          x.lineWidth = 1 + Math.random() * 5;
          x.beginPath();
          var sx = i * p + Math.random() * p, sy = j * p + Math.random() * p;
          x.moveTo(sx, sy);
          x.bezierCurveTo(sx + 60, sy + 40, sx - 40, sy + 120, sx + 80, sy + 200);
          x.stroke();
        }
        // brilho de reflexo do teto
        var g = x.createLinearGradient(i * p, j * p, i * p + p, j * p + p);
        g.addColorStop(0, 'rgba(255,255,255,.10)');
        g.addColorStop(.5, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(0,0,0,.05)');
        x.fillStyle = g; x.fillRect(i * p, j * p, p, p);
        x.restore();
        // rejunte
        x.strokeStyle = '#b5b0a8'; x.lineWidth = 3;
        x.strokeRect(i * p + 1.5, j * p + 1.5, p - 3, p - 3);
      }
      manchas(x, S, S, 60, '150,145,138', .10, 40);
      granulado(x, S, S, 14);
      return t.c;
    });
  }

  /* ---------- rugosidade do piso (brilho irregular) ---------- */
  function pisoRugosidade() {
    return memo('pisoR', function () {
      var S = 512, t = tela(S, S), x = t.x;
      x.fillStyle = '#4a4a4a'; x.fillRect(0, 0, S, S);
      manchas(x, S, S, 90, '255,255,255', .35, 70);
      manchas(x, S, S, 60, '0,0,0', .25, 50);
      granulado(x, S, S, 24);
      return t.c;
    });
  }

  /* =========================================================
     PAREDE — pintura clara levemente suja
     ========================================================= */
  function parede() {
    return memo('parede', function () {
      var S = 512, t = tela(S, S), x = t.x;
      var g = x.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, '#f2f1ec'); g.addColorStop(1, '#dedcd4');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      manchas(x, S, S, 40, '190,186,176', .18, 90);
      granulado(x, S, S, 10);
      return t.c;
    });
  }

  /* ---------- azulejo branco do açougue ---------- */
  function azulejo() {
    return memo('azulejo', function () {
      var S = 512, t = tela(S, S), x = t.x, n = 4, p = S / n;
      x.fillStyle = '#c9cdcd'; x.fillRect(0, 0, S, S);
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var g = x.createLinearGradient(i * p, j * p, i * p + p, j * p + p);
        g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#eef1f2');
        x.fillStyle = g; x.fillRect(i * p + 3, j * p + 3, p - 6, p - 6);
        x.strokeStyle = 'rgba(0,0,0,.06)'; x.lineWidth = 2;
        x.strokeRect(i * p + 3, j * p + 3, p - 6, p - 6);
      }
      granulado(x, S, S, 8);
      return t.c;
    });
  }

  /* ---------- forro / teto com placas e furinhos ---------- */
  function forro() {
    return memo('forro', function () {
      var S = 512, t = tela(S, S), x = t.x;
      x.fillStyle = '#e9e9e6'; x.fillRect(0, 0, S, S);
      x.fillStyle = 'rgba(0,0,0,.05)';
      for (var i = 8; i < S; i += 11) for (var j = 8; j < S; j += 11) {
        x.beginPath(); x.arc(i, j, 1.4, 0, 6.3); x.fill();
      }
      x.strokeStyle = '#b9b9b4'; x.lineWidth = 6;
      x.strokeRect(3, 3, S - 6, S - 6);
      granulado(x, S, S, 8);
      return t.c;
    });
  }

  /* ---------- metal escovado (gôndolas, freezer, balcão) ---------- */
  function metal(claro) {
    return memo('metal' + (claro ? 1 : 0), function () {
      var S = 512, t = tela(S, S), x = t.x;
      x.fillStyle = claro ? '#d6dade' : '#9aa2a8'; x.fillRect(0, 0, S, S);
      for (var i = 0; i < 2600; i++) {
        x.strokeStyle = 'rgba(255,255,255,' + (Math.random() * .10) + ')';
        x.lineWidth = Math.random() * 1.6;
        var y = Math.random() * S, w = 20 + Math.random() * 130;
        x.beginPath(); x.moveTo(Math.random() * S, y); x.lineTo(Math.random() * S + w, y); x.stroke();
      }
      manchas(x, S, S, 25, '90,95,100', .12, 40);
      granulado(x, S, S, 12);
      return t.c;
    });
  }

  /* ---------- papelão da caixa de reposição ---------- */
  function papelao() {
    return memo('papelao', function () {
      var S = 512, t = tela(S, S), x = t.x;
      x.fillStyle = '#c69a63'; x.fillRect(0, 0, S, S);
      for (var i = 0; i < S; i += 7) {
        x.fillStyle = 'rgba(120,85,45,' + (0.05 + Math.random() * .06) + ')';
        x.fillRect(i, 0, 3, S);
      }
      manchas(x, S, S, 30, '110,78,42', .18, 60);
      // fita crepe no meio
      x.fillStyle = 'rgba(226,210,180,.85)'; x.fillRect(0, S / 2 - 22, S, 44);
      granulado(x, S, S, 16);
      return t.c;
    });
  }

  /* ---------- madeira dos caixotes do hortifruti ---------- */
  function madeira() {
    return memo('madeira', function () {
      var S = 512, t = tela(S, S), x = t.x;
      x.fillStyle = '#c8a36c'; x.fillRect(0, 0, S, S);
      for (var i = 0; i < 60; i++) {
        x.strokeStyle = 'rgba(120,88,50,' + (0.05 + Math.random() * .14) + ')';
        x.lineWidth = 1 + Math.random() * 4;
        x.beginPath(); x.moveTo(0, Math.random() * S);
        x.bezierCurveTo(S * .3, Math.random() * S, S * .6, Math.random() * S, S, Math.random() * S);
        x.stroke();
      }
      granulado(x, S, S, 18);
      return t.c;
    });
  }

  /* =========================================================
     RÓTULO DE PRODUTO — embalagem com marca, nome e código
     ========================================================= */
  function rotulo(p) {
    return memo('rot_' + p.id, function () {
      var W = 384, H = 512, t = tela(W, H), x = t.x;

      // fundo com leve gradiente
      var g = x.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, p.cor2 || p.cor); g.addColorStop(1, p.cor);
      x.fillStyle = g; x.fillRect(0, 0, W, H);

      // faixa superior da marca
      x.fillStyle = 'rgba(255,255,255,.92)'; x.fillRect(0, 0, W, 92);
      textoCentro(x, (p.marca || 'VALE VERDE').toUpperCase(), W / 2, 46, 'italic 800 40px Segoe UI, Arial', '#16324a', W - 30);

      // ilustração simples do produto
      x.save();
      x.translate(W / 2, 236);
      x.fillStyle = 'rgba(255,255,255,.16)';
      x.beginPath(); x.arc(0, 0, 108, 0, 6.2832); x.fill();
      x.fillStyle = p.corIlustra || 'rgba(255,255,255,.55)';
      if (p.forma === 'grao') {
        for (var i = 0; i < 90; i++) {
          var a = Math.random() * 6.2832, r = Math.random() * 92;
          x.save(); x.translate(Math.cos(a) * r, Math.sin(a) * r * .7); x.rotate(Math.random() * 3);
          x.fillRect(-7, -3, 14, 6); x.restore();
        }
      } else if (p.forma === 'circulo') {
        x.beginPath(); x.arc(0, 0, 74, 0, 6.2832); x.fill();
        x.fillStyle = 'rgba(255,255,255,.35)';
        x.beginPath(); x.arc(-24, -26, 22, 0, 6.2832); x.fill();
      } else {
        x.fillRect(-70, -58, 140, 116);
        x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(-70, -58, 140, 26);
      }
      x.restore();

      // nome do produto
      x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 8;
      var nome = p.nome.toUpperCase().split(' ');
      var y = 372;
      for (var l = 0; l < Math.min(nome.length, 2); l++) {
        textoCentro(x, nome[l], W / 2, y, '800 46px Segoe UI, Arial', '#ffffff', W - 26);
        y += 50;
      }
      x.shadowBlur = 0;

      // peso / conteúdo
      textoCentro(x, p.peso || '1 kg', W / 2, 468, '600 26px Segoe UI, Arial', 'rgba(255,255,255,.9)');

      // faixa inferior com código de barras
      x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(0, H - 34, W, 34);
      codigoBarras(x, 18, H - 32, W - 36, 30);

      granulado(x, W, H, 8);
      return t.c;
    });
  }

  /* ---------- topo/lateral neutro das embalagens ---------- */
  function embalagemLisa(cor) {
    return memo('lisa_' + cor, function () {
      var S = 128, t = tela(S, S), x = t.x;
      x.fillStyle = cor; x.fillRect(0, 0, S, S);
      x.fillStyle = 'rgba(0,0,0,.10)'; x.fillRect(0, 0, S, 14);
      granulado(x, S, S, 10);
      return t.c;
    });
  }

  /* =========================================================
     PLACA DE PREÇO da gôndola (mesmo padrão da loja)
     ========================================================= */
  function placaPreco(nome, preco, oferta) {
    var W = 512, H = 256, t = tela(W, H), x = t.x;
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#d8d8d8'; x.lineWidth = 4; x.strokeRect(2, 2, W - 4, H - 4);

    if (oferta) { x.fillStyle = '#d92b2b'; x.fillRect(0, 0, W, 54);
      textoCentro(x, 'OFERTA', W / 2, 28, '800 34px Segoe UI, Arial', '#fff'); }

    textoCentro(x, nome.toUpperCase(), W / 2, oferta ? 92 : 64, '700 34px Segoe UI, Arial', '#1a1a1a', W - 40);

    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.fillStyle = oferta ? '#d92b2b' : '#111';
    var partes = preco.toFixed(2).split('.');
    x.font = '800 108px Segoe UI, Arial';
    var wInt = x.measureText(partes[0]).width;
    x.font = '800 56px Segoe UI, Arial';
    var wCent = x.measureText(',' + partes[1]).width;
    var xIni = W / 2 - (wInt + wCent + 44) / 2;
    x.textAlign = 'left';
    x.font = '700 40px Segoe UI, Arial'; x.fillText('R$', xIni, 178);
    x.font = '800 108px Segoe UI, Arial'; x.fillText(partes[0], xIni + 46, 196);
    x.font = '800 56px Segoe UI, Arial'; x.fillText(',' + partes[1], xIni + 46 + wInt, 160);

    x.textAlign = 'center';
    x.font = '500 22px Segoe UI, Arial'; x.fillStyle = '#666';
    x.fillText('Supermercado e Açougue Central', W / 2, 240);
    return t.c;
  }

  /* ---------- letreiro de seção pendurado ---------- */
  function letreiro(txt, cor) {
    var W = 512, H = 128, t = tela(W, H), x = t.x;
    x.fillStyle = cor || '#1b8f4d'; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(0, 0, W, 34);
    textoCentro(x, txt.toUpperCase(), W / 2, H / 2 + 4, '800 62px Segoe UI, Arial', '#fff', W - 40);
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6);
    return t.c;
  }

  /* ---------- cartaz simples de parede ---------- */
  function cartaz(titulo, linha1, linha2, cor) {
    var W = 512, H = 384, t = tela(W, H), x = t.x;
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    x.fillStyle = cor || '#1b8f4d'; x.fillRect(0, 0, W, 96);
    textoCentro(x, titulo, W / 2, 50, '800 46px Segoe UI, Arial', '#fff', W - 30);
    textoCentro(x, linha1, W / 2, 180, '700 34px Segoe UI, Arial', '#1a1a1a', W - 50);
    textoCentro(x, linha2, W / 2, 240, '500 27px Segoe UI, Arial', '#555', W - 60);
    textoCentro(x, 'Supermercado e Açougue Central', W / 2, 340, '600 22px Segoe UI, Arial', '#8a8a8a');
    x.strokeStyle = '#ddd'; x.lineWidth = 4; x.strokeRect(2, 2, W - 4, H - 4);
    return t.c;
  }

  /* ---------- etiqueta de validade colada no produto ---------- */
  function etiquetaValidade(data, vencido) {
    var W = 256, H = 128, t = tela(W, H), x = t.x;
    x.fillStyle = '#fdfdf7'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#bbb'; x.lineWidth = 3; x.strokeRect(2, 2, W - 4, H - 4);
    textoCentro(x, 'VALIDADE', W / 2, 34, '700 26px Segoe UI, Arial', '#777');
    textoCentro(x, data, W / 2, 82, '800 44px Segoe UI, Arial', vencido ? '#c81f1f' : '#111');
    return t.c;
  }

  /* ---------- vidro sujo do freezer (mapa de rugosidade) ---------- */
  function vidro() {
    return memo('vidro', function () {
      var S = 256, t = tela(S, S), x = t.x;
      x.fillStyle = '#0e0e0e'; x.fillRect(0, 0, S, S);
      manchas(x, S, S, 40, '255,255,255', .30, 40);
      granulado(x, S, S, 18);
      return t.c;
    });
  }

  /* ---------- carne / bandeja do açougue ---------- */
  function carne() {
    return memo('carne', function () {
      var S = 256, t = tela(S, S), x = t.x;
      x.fillStyle = '#8e1f24'; x.fillRect(0, 0, S, S);
      manchas(x, S, S, 50, '160,60,60', .28, 26);
      manchas(x, S, S, 40, '70,10,16', .40, 22);
      for (var i = 0; i < 34; i++) {           // gordura entremeada
        x.strokeStyle = 'rgba(240,230,214,' + (.10 + Math.random() * .22) + ')';
        x.lineWidth = 0.6 + Math.random() * 1.8;
        x.beginPath(); x.moveTo(Math.random() * S, Math.random() * S);
        x.bezierCurveTo(Math.random() * S, Math.random() * S, Math.random() * S, Math.random() * S, Math.random() * S, Math.random() * S);
        x.stroke();
      }
      granulado(x, S, S, 20);
      return t.c;
    });
  }

  /* ---------- casca de fruta/legume ---------- */
  function casca(cor, escura) {
    return memo('casca_' + cor, function () {
      var S = 256, t = tela(S, S), x = t.x;
      x.fillStyle = cor; x.fillRect(0, 0, S, S);
      manchas(x, S, S, 70, escura || '90,70,20', .22, 26);
      manchas(x, S, S, 40, '255,255,255', .18, 18);
      granulado(x, S, S, 22);
      return t.c;
    });
  }

  /* ---------- vista da rua (o que se vê pela vitrine) ---------- */
  function exterior() {
    return memo('exterior', function () {
      var W = 2048, H = 768, t = tela(W, H), x = t.x;
      // céu
      var g = x.createLinearGradient(0, 0, 0, H * 0.55);
      g.addColorStop(0, '#7fb2dd'); g.addColorStop(1, '#dbe9f2');
      x.fillStyle = g; x.fillRect(0, 0, W, H * 0.56);
      // nuvens
      for (var n = 0; n < 16; n++) {
        var nx = Math.random() * W, ny = 40 + Math.random() * 220, r = 30 + Math.random() * 70;
        var cg = x.createRadialGradient(nx, ny, 0, nx, ny, r);
        cg.addColorStop(0, 'rgba(255,255,255,.85)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = cg; x.beginPath(); x.arc(nx, ny, r, 0, 6.2832); x.fill();
      }
      // prédios e casas ao fundo
      for (var b = 0; b < 26; b++) {
        var bw = 70 + Math.random() * 150, bh = 60 + Math.random() * 190;
        var bx = b * (W / 26) - 20;
        x.fillStyle = ['#b9bec4', '#a9b0b8', '#c6c2bb', '#9aa3ab'][b % 4];
        x.fillRect(bx, H * 0.56 - bh, bw, bh);
        x.fillStyle = 'rgba(255,255,255,.35)';
        for (var jw = 0; jw < 12; jw++) {
          if (Math.random() < .4) continue;
          x.fillRect(bx + 10 + (jw % 3) * 24, H * 0.56 - bh + 14 + Math.floor(jw / 3) * 30, 14, 18);
        }
      }
      // árvores
      for (var a = 0; a < 14; a++) {
        var ax = Math.random() * W, ay = H * 0.56;
        x.fillStyle = '#6b4a2a'; x.fillRect(ax - 5, ay - 60, 10, 60);
        x.fillStyle = ['#3f7d3a', '#4f8f45', '#356b32'][a % 3];
        x.beginPath(); x.arc(ax, ay - 78, 38, 0, 6.2832); x.fill();
      }
      // asfalto do estacionamento
      var ag = x.createLinearGradient(0, H * 0.56, 0, H);
      ag.addColorStop(0, '#7d817f'); ag.addColorStop(1, '#5f6360');
      x.fillStyle = ag; x.fillRect(0, H * 0.56, W, H * 0.44);
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 5;
      for (var v = 0; v < 22; v++) {
        x.beginPath(); x.moveTo(v * 96, H * 0.72); x.lineTo(v * 96 - 26, H); x.stroke();
      }
      // carros estacionados
      var cores = ['#b33a3a', '#2f5f9e', '#e8e8e8', '#2a2a2a', '#3f7d5a', '#c9a227'];
      for (var c = 0; c < 8; c++) {
        var cx = 90 + c * 250, cy = H * 0.68 + (c % 2) * 30, cw = 150, ch = 52;
        x.fillStyle = cores[c % cores.length];
        x.beginPath(); x.moveTo(cx, cy + ch); x.lineTo(cx + 10, cy + 16);
        x.lineTo(cx + cw - 12, cy + 16); x.lineTo(cx + cw, cy + ch); x.closePath(); x.fill();
        x.fillStyle = 'rgba(30,40,50,.75)';
        x.fillRect(cx + 34, cy + 20, cw - 70, 20);
        x.fillStyle = '#1a1a1a';
        x.beginPath(); x.arc(cx + 32, cy + ch, 13, 0, 6.2832); x.fill();
        x.beginPath(); x.arc(cx + cw - 32, cy + ch, 13, 0, 6.2832); x.fill();
      }
      granulado(x, W, H, 10);
      return t.c;
    });
  }

  /* ---------- ambiente (reflexo) : céu de loja em equiretangular ---------- */
  function ambiente() {
    var t = tela(512, 256), x = t.x;
    var g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#c3ccd2'); g.addColorStop(.45, '#a7b0b6');
    g.addColorStop(.5, '#8b9298'); g.addColorStop(1, '#4a4e52');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    // luminárias do teto
    x.fillStyle = '#e8e8e6';
    for (var i = 0; i < 8; i++) x.fillRect(i * 64 + 12, 10, 40, 26);
    return t.c;
  }

  return {
    tela: tela, textura: textura, granulado: granulado, manchas: manchas,
    piso: piso, pisoRugosidade: pisoRugosidade, parede: parede, azulejo: azulejo, forro: forro,
    metal: metal, papelao: papelao, madeira: madeira, rotulo: rotulo, embalagemLisa: embalagemLisa,
    placaPreco: placaPreco, letreiro: letreiro, cartaz: cartaz, etiquetaValidade: etiquetaValidade,
    vidro: vidro, carne: carne, casca: casca, ambiente: ambiente, exterior: exterior
  };
})();
