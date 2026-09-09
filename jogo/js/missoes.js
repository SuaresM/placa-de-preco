/* =========================================================
   MISSÕES — as tarefas do dia a dia da loja
   ========================================================= */
var Missoes = (function () {

  var refs, camera;
  var atual = null, indice = -1;
  var pontos = 0, acertos = 0, erros = 0;
  var competencias = [], observacoes = [];
  var carregando = null;      // objeto que o funcionário está segurando
  var PONTOS_MAX = 0;

  /* ---------------- utilidades ---------------- */
  function ativar(tag, rotulo, acao) {
    var it = Mundo.iat[tag];
    if (!it) return;
    it.ativo = true; it.rotulo = rotulo; it.acao = acao;
  }
  function desativar(tag) {
    var it = Mundo.iat[tag];
    if (it) { it.ativo = false; it.acao = null; }
  }
  function apontar(tag) {
    var seta = refs.seta;
    if (!tag) { seta.visible = false; return; }
    var it = Mundo.iat[tag];
    if (!it) { seta.visible = false; return; }
    seta.position.set(it.pos.x, it.pos.y + 0.75, it.pos.z);
    seta.userData.baseY = it.pos.y + 0.75;
    seta.visible = true;
  }

  function ganhar(p, msg) {
    pontos += p; acertos++;
    if (msg) UI.aviso('✅ ' + msg + ' <b>+' + p + '</b>');
    Som.acerto();
    atualizarHUD();
  }
  function falhar(msg, observacao) {
    erros++;
    if (msg) UI.aviso('⚠️ ' + msg, 'erro');
    if (observacao) observacoes.push(observacao);
    Som.erro();
    atualizarHUD();
  }
  function atualizarHUD() { UI.status(pontos, acertos, erros); }

  function passo(i) { UI.marcarPasso(i); }

  /* ---------------- objeto carregado nas mãos ---------------- */
  function segurar(tipo) {
    largar();
    var g = new THREE.Group();
    if (tipo === 'caixa') {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.45),
        new THREE.MeshStandardMaterial({ map: Tex.textura(Tex.papelao(), 1, 1), roughness: .9 }));
      g.add(m);
      g.position.set(0.0, -0.52, -0.72);
      g.rotation.set(0.12, 0.2, 0);
    } else if (tipo === 'placa') {
      var p = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xf5c518, roughness: .5 }));
      g.add(p);
      g.position.set(0.42, -0.48, -0.7);
      g.rotation.set(0.2, -0.3, 0.15);
    } else if (tipo === 'rodo') {
      var cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.0, 8),
        new THREE.MeshStandardMaterial({ color: 0x2f6fb2, roughness: .6 }));
      cabo.rotation.z = 0.5; g.add(cabo);
      var base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 0.09),
        new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: .8 }));
      base.position.set(-0.24, -0.44, 0); g.add(base);
      g.position.set(0.45, -0.35, -0.8);
    }
    camera.add(g);
    carregando = { tipo: tipo, obj: g };
    Som.pegar();
  }
  function largar() {
    if (carregando) { camera.remove(carregando.obj); carregando = null; }
  }

  /* =========================================================
     MISSÃO 1 — PLACA DE PREÇO
     ========================================================= */
  var M1 = {
    id: 'placa',
    titulo: 'Abertura: conferir a placa de preço',
    competencia: 'Precificação',
    resumo: 'Encontrar a placa com preço errado na gôndola e corrigir conforme o sistema.',
    passos: ['Ir até o corredor da Mercearia', 'Conferir a placa do macarrão', 'Corrigir o preço'],
    pontosMax: 100,
    iniciar: function () {
      UI.informar('Bom dia! Loja abrindo',
        'Antes de abrir as portas, a primeira rotina é conferir as placas de preço da gôndola.<br><br>' +
        'Um cliente reclamou do preço do <b>Macarrão Espaguete 500g</b> no corredor da <b>Mercearia</b> ' +
        '(o primeiro corredor à esquerda). Vá até lá e confira a placa.', 'TAREFA 1');
      ativar('placaErrada', 'Conferir a placa de preço', function () {
        passo(0); passo(1);
        UI.pergunta({
          tipo: 'PRECIFICAÇÃO',
          titulo: 'Placa divergente do sistema',
          texto: 'No sistema, o <b>Macarrão Espaguete 500g</b> está cadastrado a <b>R$ 4,29</b>. ' +
                 'A placa na gôndola mostra <b>R$ 42,90</b>. Qual a atitude correta?',
          opcoes: [
            { txt: 'Trocar a placa pelo preço correto do sistema (R$ 4,29) agora mesmo', certa: true,
              feedback: 'Correto. A placa é a informação oficial para o cliente. Preço errado na gôndola gera reclamação, perda de venda e problema no Procon.' },
            { txt: 'Deixar como está — no caixa vai sair o preço certo mesmo', certa: false,
              feedback: 'Errado. O cliente decide a compra pela placa. Se o preço da placa está maior, ele desiste ou reclama; se está menor, a loja é obrigada a vender pelo menor.' },
            { txt: 'Escrever o preço à mão em cima da placa', certa: false,
              feedback: 'Errado. Placa escrita à mão passa má impressão e confunde. Imprima a placa nova no padrão da loja.' }
          ],
          aoResponder: function (certa) {
            if (certa) {
              // troca a textura da placa pelo preço certo
              var novo = Tex.textura(Tex.placaPreco('Macarrão Espaguete', 4.29, false), 1, 1);
              refs.placaErrada.material.map = novo;
              refs.placaErrada.material.needsUpdate = true;
              ganhar(60, 'Placa corrigida no padrão da loja');
            } else {
              falhar('Placa continuou errada', 'Precificação: deixar placa divergente do sistema na gôndola.');
            }
            passo(2);
            desativar('placaErrada'); apontar(null);
            // segunda pergunta: regra do menor preço
            setTimeout(function () {
              UI.pergunta({
                tipo: 'ATENDIMENTO',
                titulo: 'E se o cliente já estiver no caixa?',
                texto: 'O cliente chega no caixa e o sistema cobra <b>R$ 6,90</b>, mas a placa da gôndola dizia <b>R$ 4,29</b>. O que fazer?',
                opcoes: [
                  { txt: 'Vender pelo menor preço (o da placa) e avisar o responsável para corrigir', certa: true,
                    feedback: 'Isso mesmo. O Código de Defesa do Consumidor garante o menor preço anunciado. Depois é só corrigir a placa ou o cadastro.' },
                  { txt: 'Cobrar o preço do sistema, porque a placa estava desatualizada', certa: false,
                    feedback: 'Errado. Vale o menor preço anunciado ao cliente. Cobrar mais gera reclamação e multa.' },
                  { txt: 'Cancelar o item e pedir para o cliente escolher outro produto', certa: false,
                    feedback: 'Errado. Isso irrita o cliente e a loja perde a venda sem necessidade.' }
                ],
                aoResponder: function (c) {
                  if (c) ganhar(40, 'Boa! Menor preço anunciado é direito do cliente');
                  else falhar('Regra do menor preço não aplicada', 'Atendimento: desconhece a regra do menor preço anunciado.');
                  concluir(true);
                }
              });
            }, 350);
          }
        });
      });
      apontar('placaErrada');
    }
  };

  /* =========================================================
     MISSÃO 2 — REPOSIÇÃO COM PVPS
     ========================================================= */
  var M2 = {
    id: 'reposicao',
    titulo: 'Reposição de gôndola (PVPS)',
    competencia: 'Reposição',
    resumo: 'Buscar a caixa no depósito e repor a gôndola na ordem certa de validade.',
    passos: ['Pegar a caixa de arroz no depósito', 'Levar até a gôndola da Mercearia', 'Repor usando o PVPS'],
    pontosMax: 100,
    iniciar: function () {
      UI.informar('Reposição',
        'A gôndola da Mercearia está com um vão vazio de <b>Arroz 5kg</b>.<br><br>' +
        'Vá até o <b>depósito</b> (porta no fundo à direita da loja), pegue a caixa de arroz e reponha a gôndola.',
        'TAREFA 2');
      ativar('caixaEstoque', 'Pegar a caixa de arroz', function () {
        segurar('caixa');
        refs.deposito.caixaRep.visible = false;
        refs.deposito.etiqueta.visible = false;
        desativar('caixaEstoque');
        passo(0);
        UI.aviso('📦 Caixa de arroz nas mãos. Volte para o corredor da Mercearia.', 'info');
        ativar('vaoGondola', 'Repor os produtos na gôndola', function () {
          passo(1);
          UI.pergunta({
            tipo: 'REPOSIÇÃO',
            titulo: 'Como organizar na prateleira?',
            texto: 'Na gôndola já existem 4 pacotes com validade <b>05/2026</b>. Na caixa nova, a validade é <b>10/2027</b>. Como repor?',
            opcoes: [
              { txt: 'Puxar os antigos para a frente e colocar os novos atrás (PVPS)', certa: true,
                feedback: 'Correto! PVPS: Primeiro que Vence, Primeiro que Sai. Assim o produto antigo vende primeiro e a loja não perde mercadoria.' },
              { txt: 'Colocar os novos na frente, que ficam mais bonitos', certa: false,
                feedback: 'Errado. Os antigos ficam parados no fundo e vencem — é assim que a loja tem quebra e prejuízo.' },
              { txt: 'Misturar tudo, o cliente escolhe o que quiser', certa: false,
                feedback: 'Errado. Sem ordem de validade, produto vencido acaba chegando na mão do cliente.' }
            ],
            aoResponder: function (certa) {
              // repõe visualmente os produtos no vão
              var arroz = Mundo.produto('arroz');
              for (var i = 0; i < 4; i++) {
                Mundo.porNaPrateleira(arroz, refs.vao.position.x - 0.45 + i * 0.30,
                                      Mundo.PRATELEIRAS[0] + 0.02, refs.vao.position.z, 0);
              }
              largar();
              desativar('vaoGondola'); apontar(null);
              passo(2);
              if (certa) ganhar(70, 'Gôndola reposta com PVPS');
              else falhar('Reposição fora do padrão PVPS', 'Reposição: não aplicou o PVPS (primeiro que vence, primeiro que sai).');

              setTimeout(function () {
                UI.pergunta({
                  tipo: 'ORGANIZAÇÃO',
                  titulo: 'Terminou a reposição. E agora?',
                  texto: 'Sobrou a caixa de papelão vazia no corredor. O que fazer?',
                  opcoes: [
                    { txt: 'Levar a caixa vazia para o depósito e deixar o corredor livre', certa: true,
                      feedback: 'Correto. Corredor com caixa atrapalha o cliente, dá acidente e passa imagem de loja bagunçada.' },
                    { txt: 'Deixar embaixo da gôndola, depois alguém recolhe', certa: false,
                      feedback: 'Errado. "Depois" vira nunca. Quem repõe é quem recolhe.' },
                    { txt: 'Empurrar a caixa para o corredor do lado', certa: false,
                      feedback: 'Errado. O problema só muda de lugar e o risco de tropeço continua.' }
                  ],
                  aoResponder: function (c) {
                    if (c) ganhar(30, 'Corredor limpo e liberado');
                    else falhar('Corredor ficou com obstáculo', 'Organização: deixou caixa vazia no corredor de venda.');
                    concluir(true);
                  }
                });
              }, 350);
            }
          });
          apontar('vaoGondola');
        });
        apontar('vaoGondola');
      });
      apontar('caixaEstoque');
    }
  };

  /* =========================================================
     MISSÃO 3 — CONFERÊNCIA DE VALIDADE
     ========================================================= */
  var M3 = {
    id: 'validade',
    titulo: 'Conferência de validade',
    competencia: 'Qualidade e validade',
    resumo: 'Conferir as caixas de leite e retirar da gôndola só o que estiver vencido.',
    passos: ['Conferir os 6 leites da gôndola', 'Retirar os vencidos', 'Dar destino aos vencidos'],
    pontosMax: 100,
    iniciar: function () {
      var hoje = '09/2026';
      UI.informar('Conferência de validade',
        'Hoje é <b>setembro de 2026</b>. Confira as <b>6 caixas de leite</b> na terceira prateleira da ' +
        'Mercearia (lado esquerdo do corredor).<br><br>Retire da gôndola <b>apenas</b> o que estiver vencido. ' +
        'Chegue perto de cada caixa para ler a etiqueta de validade.', 'TAREFA 3');

      var vencidosRestantes = 0;
      refs.itensValidade.forEach(function (it) { if (it.vencido) vencidosRestantes++; });
      var totalVencidos = vencidosRestantes;
      var enganos = 0;

      refs.itensValidade.forEach(function (it, i) {
        ativar('validade' + i, 'Conferir validade', function () {
          if (it.removido) return;
          if (it.vencido) {
            it.obj.visible = false; it.etiqueta.visible = false; it.removido = true;
            vencidosRestantes--;
            desativar('validade' + i);
            ganhar(20, 'Vencido retirado (validade ' + it.data + ')');
            passo(0);
            if (vencidosRestantes === 0) {
              passo(1); apontar(null);
              for (var k = 0; k < refs.itensValidade.length; k++) desativar('validade' + k);
              setTimeout(function () {
                UI.pergunta({
                  tipo: 'QUALIDADE',
                  titulo: 'Destino do produto vencido',
                  texto: 'Você retirou ' + totalVencidos + ' caixas vencidas da gôndola. O que fazer com elas?',
                  opcoes: [
                    { txt: 'Separar em local identificado, registrar a quebra no sistema e avisar o responsável', certa: true,
                      feedback: 'Correto. Produto vencido nunca volta para a gôndola: é registrado como quebra/perda e separado para descarte ou devolução ao fornecedor.' },
                    { txt: 'Jogar no lixo comum sem registrar', certa: false,
                      feedback: 'Errado. Sem registro a loja não sabe quanto perde nem cobra o fornecedor. A perda tem que aparecer no sistema.' },
                    { txt: 'Colocar em promoção com desconto', certa: false,
                      feedback: 'Errado e proibido. Vender produto vencido é infração grave e coloca a saúde do cliente em risco.' }
                  ],
                  aoResponder: function (c) {
                    passo(2);
                    if (c) ganhar(40 - enganos * 10, 'Destino correto do produto vencido');
                    else falhar('Destino errado do produto vencido',
                                'Qualidade: não sabe o procedimento de quebra/perda de produto vencido.');
                    concluir(true);
                  }
                });
              }, 400);
            } else {
              proximoVencido();
            }
          } else {
            enganos++;
            falhar('Esse leite está dentro da validade (' + it.data + '). Não retire produto bom da gôndola.',
                   'Validade: retirou produto dentro do prazo (perda de venda).');
          }
        });
      });

      function proximoVencido() {
        for (var i = 0; i < refs.itensValidade.length; i++) {
          if (refs.itensValidade[i].vencido && !refs.itensValidade[i].removido) { apontar('validade' + i); return; }
        }
        apontar(null);
      }
      // sem seta: o funcionário precisa conferir item por item
      apontar(null);
      UI.aviso('👀 Leia a etiqueta de validade de cada caixa antes de decidir.', 'info');
    }
  };

  /* =========================================================
     MISSÃO 4 — ATENDIMENTO AO CLIENTE
     ========================================================= */
  var M4 = {
    id: 'atendimento',
    titulo: 'Atendimento ao cliente',
    competencia: 'Atendimento',
    resumo: 'Receber o cliente, levar até o produto e fechar o atendimento do jeito certo.',
    passos: ['Falar com o cliente', 'Levar o cliente até o produto', 'Encerrar o atendimento'],
    pontosMax: 100,
    iniciar: function () {
      UI.informar('Cliente na loja',
        'Um cliente entrou e está parado perto da frente de caixa procurando alguma coisa.<br><br>' +
        'Vá até ele e atenda.', 'TAREFA 4');
      ativar('cliente', 'Falar com o cliente', function () {
        desativar('cliente'); apontar(null);
        passo(0);
        UI.pergunta({
          tipo: 'ATENDIMENTO',
          titulo: 'Como você aborda o cliente?',
          texto: 'O cliente está parado no corredor olhando para os lados, com cara de quem procura um produto.',
          opcoes: [
            { txt: '"Bom dia! Posso ajudar a encontrar alguma coisa?"', certa: true,
              feedback: 'Correto. Cumprimentar e oferecer ajuda é o padrão. Cliente perdido na loja compra menos.' },
            { txt: 'Esperar ele pedir ajuda, para não incomodar', certa: false,
              feedback: 'Errado. Quem trabalha no salão tem que se antecipar. Muitos clientes vão embora sem perguntar.' },
            { txt: '"Fala aí, o que cê tá procurando?"', certa: false,
              feedback: 'Errado. Intimidade demais afasta o cliente. Trate com educação e sem gíria.' }
          ],
          aoResponder: function (c1) {
            if (c1) ganhar(30, 'Boa abordagem');
            else falhar('Abordagem fora do padrão', 'Atendimento: abordagem inadequada ao cliente.');

            setTimeout(function () {
              UI.pergunta({
                tipo: 'ATENDIMENTO',
                titulo: '"Onde fica o sabão em pó?"',
                texto: 'O sabão em pó fica no corredor de <b>Limpeza</b>, no meio da loja. O que você responde?',
                opcoes: [
                  { txt: '"Fica no corredor de Limpeza, vou te levar até lá."', certa: true,
                    feedback: 'Correto. Levar o cliente até o produto aumenta a venda e mostra atenção. Nunca só apontar de longe.' },
                  { txt: '"É ali no fundo, ó." (apontando de longe)', certa: false,
                    feedback: 'Errado. O cliente se perde, desiste e ainda leva má impressão da loja.' },
                  { txt: '"Não sei, pergunta pra outra pessoa."', certa: false,
                    feedback: 'Errado. Nunca devolva o problema para o cliente. Se não souber, descubra e volte com a resposta.' }
                ],
                aoResponder: function (c2) {
                  if (c2) ganhar(35, 'Cliente acompanhado até o produto');
                  else falhar('Cliente ficou sem orientação', 'Atendimento: não acompanhou o cliente até o produto.');
                  passo(1);
                  // cliente caminha até o corredor de limpeza
                  refs.estado.cliente.destino = { x: 1.5, z: 3.9 };
                  refs.estado.cliente.aoChegar = function () {
                    UI.aviso('🧍 O cliente chegou no corredor de Limpeza e está pegando o produto.', 'info');
                    setTimeout(function () {
                      UI.pergunta({
                        tipo: 'ATENDIMENTO',
                        titulo: 'Fechando o atendimento',
                        texto: 'O cliente pegou o sabão e pergunta se a loja tem entrega em casa. A loja não faz entrega. O que você diz?',
                        opcoes: [
                          { txt: '"Hoje a gente não faz entrega, mas posso te ajudar a levar até o carro. Precisa de mais alguma coisa?"', certa: true,
                            feedback: 'Correto. Diga o que a loja NÃO faz sempre junto com o que ela PODE fazer, e ofereça ajuda extra.' },
                          { txt: '"Não fazemos." e sair andando', certa: false,
                            feedback: 'Errado. Resposta seca encerra a conversa e derruba a chance de vender mais.' },
                          { txt: '"Acho que faz sim, pergunta no caixa."', certa: false,
                            feedback: 'Errado. Nunca dê informação que você não tem certeza — o cliente volta bravo depois.' }
                        ],
                        aoResponder: function (c3) {
                          passo(2);
                          if (c3) ganhar(35, 'Atendimento encerrado com qualidade');
                          else falhar('Encerramento fraco do atendimento', 'Atendimento: encerrou o atendimento sem oferecer alternativa.');
                          concluir(true);
                        }
                      });
                    }, 700);
                  };
                }
              });
            }, 350);
          }
        });
      });
      apontar('cliente');
    }
  };

  /* =========================================================
     MISSÃO 5 — FRENTE DE CAIXA
     ========================================================= */
  var M5 = {
    id: 'caixa',
    titulo: 'Operação de caixa',
    competencia: 'Frente de caixa',
    resumo: 'Registrar a compra, receber o pagamento e dar o troco certo.',
    passos: ['Assumir o caixa 1', 'Registrar todos os itens', 'Receber e dar o troco'],
    pontosMax: 100,
    iniciar: function () {
      UI.informar('Frente de caixa',
        'A operadora do <b>Caixa 1</b> saiu para o intervalo e o cliente está esperando.<br><br>' +
        'Vá até o caixa 1 (perto da entrada) e finalize a compra.', 'TAREFA 5');

      var itens = [
        { nome: 'Arroz Tipo 1 5kg',      preco: 24.90 },
        { nome: 'Feijão Carioca 1kg',    preco: 8.49 },
        { nome: 'Óleo de Soja 900ml',    preco: 7.99 },
        { nome: 'Leite Integral 1L',     preco: 5.49 },
        { nome: 'Detergente Neutro',     preco: 2.79 },
        { nome: 'Café Torrado 500g',     preco: 15.90 }
      ];
      var total = itens.reduce(function (s, i) { return s + i.preco; }, 0);   // 65,56

      function abrirCaixa() {
        desativar('pdv'); apontar(null); passo(0);
        UI.abrirPDV({
          titulo: 'CAIXA 1 — COMPRA DO CLIENTE',
          itens: itens,
          aoFinalizar: function (somado, lidos, faltando) {
            if (faltando > 0) {
              falhar('Faltaram ' + faltando + ' item(ns) sem registrar. Nunca finalize a compra com produto sem passar pelo leitor.',
                     'Frente de caixa: finalizou a compra com item não registrado (perda de estoque e prejuízo).');
              return;
            }
            UI.fecharPDV();
            passo(1);
            ganhar(30, 'Todos os itens registrados — total R$ ' + total.toFixed(2).replace('.', ','));

            setTimeout(function () {
              UI.pergunta({
                tipo: 'FRENTE DE CAIXA',
                titulo: 'Troco',
                texto: 'O total ficou em <b>R$ ' + total.toFixed(2).replace('.', ',') +
                       '</b>. O cliente paga com <b>R$ 100,00</b> em dinheiro. Quanto é o troco?',
                opcoes: [
                  { txt: 'R$ 34,44', certa: true, feedback: 'Certo. 100,00 − 65,56 = 34,44. Confira sempre a nota que recebeu e conte o troco na frente do cliente.' },
                  { txt: 'R$ 35,44', certa: false, feedback: 'Errado. 100,00 − 65,56 = 34,44. Troco errado gera quebra de caixa no fim do turno.' },
                  { txt: 'R$ 44,34', certa: false, feedback: 'Errado. 100,00 − 65,56 = 34,44. Confira sempre na tela antes de abrir a gaveta.' }
                ],
                aoResponder: function (c) {
                  passo(2);
                  if (c) ganhar(40, 'Troco correto');
                  else falhar('Troco errado', 'Frente de caixa: erro de troco (risco de quebra de caixa).');

                  setTimeout(function () {
                    UI.pergunta({
                      tipo: 'FRENTE DE CAIXA',
                      titulo: 'Situação no caixa',
                      texto: 'Na hora de fechar, o cliente diz que desistiu de um item e pede para tirar da compra, mas o item já foi registrado. O que fazer?',
                      opcoes: [
                        { txt: 'Chamar o responsável para fazer o cancelamento do item pelo sistema', certa: true,
                          feedback: 'Correto. Cancelamento de item tem que ser feito com autorização e ficar registrado. E o produto volta para a gôndola.' },
                        { txt: 'Só entregar o produto e cobrar sem ele — depois se ajeita', certa: false,
                          feedback: 'Errado. O caixa fecha com diferença e o estoque fica errado.' },
                        { txt: 'Falar que não dá para cancelar e o cliente tem que levar', certa: false,
                          feedback: 'Errado. O cliente pode desistir do item. Basta seguir o procedimento de cancelamento.' }
                      ],
                      aoResponder: function (c2) {
                        if (c2) ganhar(30, 'Procedimento de cancelamento correto');
                        else falhar('Procedimento de cancelamento errado', 'Frente de caixa: não segue o procedimento de cancelamento de item.');
                        concluir(true);
                      }
                    });
                  }, 350);
                }
              });
            }, 300);
          },
          aoSair: function () {
            UI.aviso('Você saiu do caixa. Volte para finalizar a compra do cliente.', 'erro');
            ativar('pdv', 'Voltar para o caixa 1', abrirCaixa);
            apontar('pdv');
          }
        });
      }

      ativar('pdv', 'Assumir o caixa 1', abrirCaixa);
      apontar('pdv');
    }
  };

  /* =========================================================
     MISSÃO 6 — SEGURANÇA E LIMPEZA
     ========================================================= */
  var M6 = {
    id: 'seguranca',
    titulo: 'Segurança: derramamento no corredor',
    competencia: 'Segurança e limpeza',
    resumo: 'Sinalizar e limpar um derramamento seguindo a ordem correta.',
    passos: ['Pegar a placa e o rodo no depósito', 'Sinalizar o local', 'Limpar o piso', 'Registrar a quebra'],
    pontosMax: 100,
    iniciar: function () {
      refs.mancha.visible = true;
      refs.garrafaCaida.visible = true;
      var temMaterial = false, sinalizado = false;

      UI.informar('Atenção — risco de queda',
        'Uma garrafa de óleo caiu e quebrou no corredor entre a Mercearia e as Bebidas. ' +
        'O piso está escorregadio e tem cliente circulando.<br><br>' +
        'Resolva a situação na <b>ordem certa</b>.', 'TAREFA 6');

      function pegarMaterial() {
        temMaterial = true;
        segurar('placa');
        desativar('placaPiso'); desativar('rodo');
        refs.deposito.placaPiso.visible = false;
        refs.deposito.rodo.visible = false;
        passo(0);
        UI.aviso('🧰 Placa de sinalização e rodo em mãos. Vá até o derramamento.', 'info');
        ativar('derramamento', 'Sinalizar o local', limparOuSinalizar);
        apontar('derramamento');
      }

      function limparOuSinalizar() {
        if (!sinalizado) {
          sinalizado = true;
          // coloca a placa no chão, ao lado da mancha
          refs.deposito.placaPiso.visible = true;
          refs.deposito.placaPiso.position.set(refs.mancha.position.x + 0.9, 0, refs.mancha.position.z);
          segurar('rodo');
          passo(1);
          ganhar(35, 'Local sinalizado antes de limpar');
          Mundo.iat['derramamento'].rotulo = 'Limpar o piso com o rodo';
        } else {
          refs.mancha.visible = false;
          refs.garrafaCaida.visible = false;
          largar();
          desativar('derramamento'); apontar(null);
          passo(2);
          ganhar(35, 'Piso limpo e seguro');
          setTimeout(function () {
            UI.pergunta({
              tipo: 'SEGURANÇA',
              titulo: 'Fechando a ocorrência',
              texto: 'O piso está limpo. E agora, o que ainda falta fazer?',
              opcoes: [
                { txt: 'Registrar a quebra do produto no sistema e só tirar a placa quando o piso secar', certa: true,
                  feedback: 'Correto. A perda tem que entrar no sistema e a placa fica até secar — piso úmido ainda escorrega.' },
                { txt: 'Tirar a placa na hora e seguir o trabalho', certa: false,
                  feedback: 'Errado. Piso ainda úmido é risco de queda. Cliente que cai na loja é problema sério.' },
                { txt: 'Não registrar nada, foi só uma garrafa', certa: false,
                  feedback: 'Errado. Toda quebra é registrada, senão o estoque fica errado e a loja não enxerga a perda.' }
              ],
              aoResponder: function (c) {
                passo(3);
                if (c) ganhar(30, 'Ocorrência registrada corretamente');
                else falhar('Ocorrência mal encerrada', 'Segurança: não registrou a quebra / retirou a sinalização cedo demais.');
                concluir(true);
              }
            });
          }, 400);
        }
      }

      ativar('placaPiso', 'Pegar a placa de sinalização e o rodo', pegarMaterial);
      ativar('rodo', 'Pegar a placa de sinalização e o rodo', pegarMaterial);

      // se tentar limpar antes de buscar o material: erro de procedimento
      ativar('derramamento', 'Verificar o derramamento', function () {
        if (temMaterial) { limparOuSinalizar(); return; }
        falhar('Nunca limpe sem sinalizar. Busque primeiro a placa de piso molhado e o rodo no depósito.',
               'Segurança: tentou limpar o derramamento sem sinalizar a área.');
        UI.informar('Ordem correta',
          '1. Isolar/sinalizar a área com a placa de piso molhado<br>' +
          '2. Limpar o produto e secar o piso<br>' +
          '3. Registrar a quebra no sistema<br>' +
          '4. Retirar a placa só depois que o piso secar<br><br>' +
          'Vá ao <b>depósito</b> pegar a placa e o rodo.', 'PROCEDIMENTO');
        apontar('placaPiso');
      });
      apontar('placaPiso');
    }
  };

  var LISTA = [M1, M2, M3, M4, M5, M6];

  /* ---------------- controle geral ---------------- */
  function iniciar(_refs, _camera) {
    refs = _refs; camera = _camera;
    pontos = 0; acertos = 0; erros = 0; indice = -1;
    competencias = []; observacoes = [];
    PONTOS_MAX = LISTA.reduce(function (s, m) { return s + m.pontosMax; }, 0);
    atualizarHUD();
    proxima();
  }

  function concluir(ok) {
    if (!atual) return;
    competencias.push({
      nome: atual.competencia,
      ok: ok && erros === atual.errosNoInicio,
      resultado: (erros === atual.errosNoInicio) ? 'Sem erros' : (erros - atual.errosNoInicio) + ' erro(s)'
    });
    Som.missao();
    UI.aviso('🏁 Tarefa concluída: <b>' + atual.titulo + '</b>');
    setTimeout(proxima, 900);
  }

  function proxima() {
    indice++;
    if (indice >= LISTA.length) { fim(); return; }
    atual = LISTA[indice];
    atual.errosNoInicio = erros;
    UI.definirMissao((indice + 1) + '/' + LISTA.length + ' — ' + atual.titulo, atual.passos);
    atual.iniciar();
  }

  function fim() {
    atual = null;
    UI.relatorio({
      pontos: pontos, pontosMax: PONTOS_MAX, acertos: acertos, erros: erros,
      competencias: competencias, observacoes: observacoes
    });
  }

  function modoLivre() {
    UI.definirMissao('Modo livre', ['Ande pela loja e conheça as seções']);
    atual = null;
  }

  return {
    LISTA: LISTA, iniciar: iniciar, modoLivre: modoLivre,
    emMissao: function () { return !!atual; }
  };
})();
