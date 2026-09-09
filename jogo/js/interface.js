/* =========================================================
   INTERFACE — HUD, avisos, perguntas e tela do caixa (PDV)
   ========================================================= */
var UI = (function () {

  var el = {};
  var aoFecharModal = null;
  var pdvCfg = null;
  var travadoAntes = false;

  function iniciar() {
    ['hud','painelMissao','tituloMissao','listaPassos','pontos','acertos','erros','tempo',
     'mira','dica','avisos','telaInicio','telaPausa','telaFim','relatorio','modal','modalTipo',
     'modalTitulo','modalTexto','modalOpcoes','modalFeedback','modalBotoes','btnFechaModal',
     'pdv','cupom','pdvTotal','esteira','pdvPasso','pdvAjuda','btnFinalizar','btnSairPdv',
     'carregando','toque','btnAcao','gradeModulos'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

    el.btnFechaModal.addEventListener('click', function () {
      fecharModal();
      if (aoFecharModal) { var f = aoFecharModal; aoFecharModal = null; f(); }
    });
  }

  /* ---------------- HUD ---------------- */
  function mostrarHUD(v) { el.hud.classList.toggle('ativo', v); }

  function definirMissao(titulo, passos) {
    el.tituloMissao.textContent = titulo;
    el.listaPassos.innerHTML = '';
    passos.forEach(function (p) {
      var li = document.createElement('li');
      li.textContent = p;
      el.listaPassos.appendChild(li);
    });
  }

  function marcarPasso(i) {
    var li = el.listaPassos.children[i];
    if (li) li.classList.add('ok');
  }

  function atualizarPasso(i, texto) {
    var li = el.listaPassos.children[i];
    if (li) li.textContent = texto;
  }

  function status(pontos, acertos, erros) {
    el.pontos.textContent = pontos;
    el.acertos.textContent = acertos;
    el.erros.textContent = erros;
  }

  function tempo(segundos) {
    var m = Math.floor(segundos / 60), s = Math.floor(segundos % 60);
    el.tempo.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function dica(texto) {
    if (texto) { el.dica.innerHTML = texto; el.dica.style.display = 'block'; el.mira.classList.add('perto'); }
    else { el.dica.style.display = 'none'; el.mira.classList.remove('perto'); }
  }

  function aviso(texto, tipo) {
    var d = document.createElement('div');
    d.className = 'aviso ' + (tipo || '');
    d.innerHTML = texto;
    el.avisos.appendChild(d);
    setTimeout(function () {
      d.style.transition = 'opacity .4s'; d.style.opacity = '0';
      setTimeout(function () { d.remove(); }, 400);
    }, tipo === 'erro' ? 6000 : 4600);
  }

  /* ---------------- modal de pergunta ---------------- */
  function pergunta(cfg) {
    // cfg: {tipo, titulo, texto, opcoes:[{txt, certa, feedback}], aoResponder(certa, opcao)}
    el.modalTipo.textContent = cfg.tipo || 'SITUAÇÃO';
    el.modalTitulo.textContent = cfg.titulo || '';
    el.modalTexto.innerHTML = cfg.texto || '';
    el.modalOpcoes.innerHTML = '';
    el.modalFeedback.style.display = 'none';
    el.modalFeedback.className = '';
    el.modalBotoes.style.display = 'none';

    cfg.opcoes.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'opcao';
      b.textContent = o.txt;
      b.addEventListener('click', function () {
        // desabilita todas e revela o resultado
        Array.prototype.forEach.call(el.modalOpcoes.children, function (x) {
          x.style.pointerEvents = 'none';
        });
        b.classList.add(o.certa ? 'certa' : 'errada');
        if (!o.certa) {
          Array.prototype.forEach.call(el.modalOpcoes.children, function (x, i) {
            if (cfg.opcoes[i].certa) x.classList.add('certa');
          });
        }
        el.modalFeedback.textContent = o.feedback || (o.certa ? 'Isso mesmo!' : 'Atenção a esse ponto.');
        el.modalFeedback.className = o.certa ? '' : 'ruim';
        el.modalFeedback.style.display = 'block';
        el.modalBotoes.style.display = 'flex';
        if (o.certa) Som.acerto(); else Som.erro();
        aoFecharModal = function () { if (cfg.aoResponder) cfg.aoResponder(!!o.certa, o); };
      });
      el.modalOpcoes.appendChild(b);
    });

    el.modal.classList.add('ativo');
    if (typeof Jogador !== 'undefined') Jogador.liberar();
  }

  // aviso simples dentro do modal (sem opções)
  function informar(titulo, texto, tipo, aoFechar) {
    el.modalTipo.textContent = tipo || 'ORIENTAÇÃO';
    el.modalTitulo.textContent = titulo;
    el.modalTexto.innerHTML = texto;
    el.modalOpcoes.innerHTML = '';
    el.modalFeedback.style.display = 'none';
    el.modalBotoes.style.display = 'flex';
    aoFecharModal = aoFechar || null;
    el.modal.classList.add('ativo');
    if (typeof Jogador !== 'undefined') Jogador.liberar();
  }

  function fecharModal() { el.modal.classList.remove('ativo'); }
  function modalAberto() { return el.modal.classList.contains('ativo'); }

  /* ---------------- PDV (frente de caixa) ---------------- */
  function abrirPDV(cfg) {
    // cfg: {itens:[{nome,preco}], ajuda, aoFinalizar(total, lidos, faltando), aoSair}
    pdvCfg = cfg;
    cfg.lidos = []; cfg.total = 0;
    el.pdvPasso.textContent = cfg.titulo || 'FRENTE DE CAIXA';
    el.pdvAjuda.textContent = cfg.ajuda || 'Passe todos os produtos da esteira pelo leitor, um por vez.';
    el.cupom.innerHTML = '<div class="vazio">Nenhum item registrado.</div>';
    el.pdvTotal.textContent = 'R$ 0,00';
    el.esteira.innerHTML = '';
    cfg.itens.forEach(function (it, i) {
      var b = document.createElement('button');
      b.className = 'prodBtn';
      b.textContent = it.nome;
      b.addEventListener('click', function () {
        if (b.classList.contains('lido')) return;
        b.classList.add('lido');
        cfg.lidos.push(it); cfg.total += it.preco;
        Som.bip();
        if (el.cupom.querySelector('.vazio')) el.cupom.innerHTML = '';
        var linha = document.createElement('div');
        linha.className = 'item';
        linha.innerHTML = '<span>' + it.nome + '</span><span>R$ ' + it.preco.toFixed(2).replace('.', ',') + '</span>';
        el.cupom.appendChild(linha);
        el.cupom.scrollTop = el.cupom.scrollHeight;
        el.pdvTotal.textContent = 'R$ ' + cfg.total.toFixed(2).replace('.', ',');
      });
      el.esteira.appendChild(b);
    });

    el.btnFinalizar.onclick = function () {
      var faltando = cfg.itens.length - cfg.lidos.length;
      cfg.aoFinalizar(cfg.total, cfg.lidos, faltando);
    };
    el.btnSairPdv.onclick = function () { fecharPDV(); if (cfg.aoSair) cfg.aoSair(); };

    el.pdv.classList.add('ativo');
    if (typeof Jogador !== 'undefined') Jogador.liberar();
  }
  function fecharPDV() { el.pdv.classList.remove('ativo'); }
  function pdvAberto() { return el.pdv.classList.contains('ativo'); }

  /* ---------------- telas ---------------- */
  function tela(id, mostrar) {
    var t = el[id];
    if (!t) return;
    t.classList.toggle('oculto', !mostrar);
  }

  function mouseTravado(v) {
    travadoAntes = v;
    if (!v && !modalAberto() && !pdvAberto()) { /* main.js decide se pausa */ }
  }

  function esconderCarregando() { el.carregando.classList.add('oculto'); }

  function modoToque(v) { el.toque.classList.toggle('ativo', v); }

  /* ---------------- relatório final ---------------- */
  function relatorio(dados) {
    var nota = Math.max(0, Math.min(10, dados.pontos / dados.pontosMax * 10));
    var conceito = nota >= 9 ? 'Excelente — pronto para o salão'
                 : nota >= 7 ? 'Bom — revise os pontos abaixo'
                 : nota >= 5 ? 'Regular — precisa refazer o treinamento'
                             : 'Insuficiente — treinar de novo com o líder';
    var linhas = dados.competencias.map(function (c) {
      return '<tr><td>' + c.nome + '</td><td>' + (c.ok ? '✅ ' : '⚠️ ') + c.resultado + '</td></tr>';
    }).join('');

    var obs = dados.observacoes.length
      ? '<h3>PONTOS PARA MELHORAR</h3><ul>' + dados.observacoes.map(function (o) {
          return '<li>' + o + '</li>'; }).join('') + '</ul>'
      : '<h3>PARABÉNS</h3><p>Nenhum erro registrado. Rotina executada dentro do padrão da loja.</p>';

    el.relatorio.innerHTML =
      '<h1>Relatório do treinamento</h1>' +
      '<p class="sub">Supermercado e Açougue Central — resultado do funcionário</p>' +
      '<div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;margin:6px 0 14px">' +
        '<div><div class="nota">' + nota.toFixed(1) + '</div>' +
        '<div style="font-size:12px;color:#93a0ab">NOTA FINAL</div></div>' +
        '<div style="font-size:15px;font-weight:600;color:#dfe7ec">' + conceito + '</div>' +
      '</div>' +
      '<table><tr><td><b>Pontos</b></td><td>' + dados.pontos + ' de ' + dados.pontosMax + '</td></tr>' +
      '<tr><td><b>Acertos</b></td><td>' + dados.acertos + '</td></tr>' +
      '<tr><td><b>Erros</b></td><td>' + dados.erros + '</td></tr>' +
      '<tr><td><b>Tempo total</b></td><td>' + el.tempo.textContent + '</td></tr></table>' +
      '<h3>DESEMPENHO POR TAREFA</h3><table>' + linhas + '</table>' +
      obs +
      '<div class="botoes"><button class="btn" onclick="location.reload()">Fazer de novo</button></div>';
    tela('telaFim', true);
    if (typeof Jogador !== 'undefined') Jogador.liberar();
  }

  return {
    iniciar: iniciar, mostrarHUD: mostrarHUD, definirMissao: definirMissao, marcarPasso: marcarPasso,
    atualizarPasso: atualizarPasso, status: status, tempo: tempo, dica: dica, aviso: aviso,
    pergunta: pergunta, informar: informar, fecharModal: fecharModal, modalAberto: modalAberto,
    abrirPDV: abrirPDV, fecharPDV: fecharPDV, pdvAberto: pdvAberto,
    tela: tela, mouseTravado: mouseTravado, esconderCarregando: esconderCarregando,
    modoToque: modoToque, relatorio: relatorio,
    botaoAcao: function () { return el.btnAcao; },
    gradeModulos: function () { return el.gradeModulos; }
  };
})();
