/* =========================================================
   MUNDO — monta a loja em 3D: piso, paredes, gôndolas,
   açougue, hortifrúti, freezers, frente de caixa e depósito.

   Planta da loja (visto de cima):
        x: -15 (oeste) ............ +15 (leste)
        z: -20 (fundo/depósito) ... +12 (entrada)

     [ HORTIFRÚTI ]   [ AÇOUGUE ]        [ DEPÓSITO ]
     ---------------- gôndolas ----------------- [FREEZERS]
                  [ CAIXA 1 ] [ CAIXA 2 ]
                        ENTRADA
   ========================================================= */
var Mundo = (function () {

  var cena, grupo;
  var colisores = [], interativos = [], iat = {}, animados = [], mat = {};

  /* ---------------- medidas gerais ---------------- */
  var GOND_COMP = 15, GOND_CX = -1.5, GOND_LARG = 1.15, GOND_ALT = 2.0;
  var PRATELEIRAS = [0.42, 0.86, 1.30, 1.74];
  var GONDOLAS = [
    { z: -5.0, secao: 'Mercearia', cor: '#1b8f4d' },
    { z: -1.5, secao: 'Bebidas',   cor: '#0277bd' },
    { z:  2.0, secao: 'Limpeza',   cor: '#6a1b9a' },
    { z:  5.5, secao: 'Higiene',   cor: '#00838f' }
  ];
  function zFrente(gz) { return gz + (GOND_LARG/2 - 0.28); }   // linha da frente da prateleira
  function zTesteira(gz) { return gz + GOND_LARG/2 + 0.006; }  // onde fica a placa de preço

  /* ---------------- catálogo de produtos ---------------- */
  var PRODUTOS = [
    { id:'arroz',    nome:'Arroz Tipo 1', marca:'Vale Verde', cor:'#1f5fa8', cor2:'#2f7fd0', peso:'5 kg',    preco:24.90, forma:'grao',    tipo:'caixa',   dim:[0.26,0.32,0.14], secao:'Mercearia' },
    { id:'feijao',   nome:'Feijão Carioca', marca:'Bom Prato', cor:'#8a2b2b', cor2:'#b34141', peso:'1 kg',   preco:8.49,  forma:'grao',    tipo:'caixa',   dim:[0.17,0.24,0.09], secao:'Mercearia' },
    { id:'macarrao', nome:'Macarrão Espaguete', marca:'Dona Rita', cor:'#e0a92b', cor2:'#f0c25a', peso:'500 g', preco:4.29, forma:'grao', tipo:'caixa', dim:[0.16,0.26,0.06], secao:'Mercearia' },
    { id:'cafe',     nome:'Café Torrado', marca:'Serra Alta',  cor:'#4a2a17', cor2:'#6d3f22', peso:'500 g',   preco:15.90, forma:'circulo', tipo:'caixa',   dim:[0.15,0.20,0.07], secao:'Mercearia' },
    { id:'acucar',   nome:'Açúcar Refinado', marca:'Doce Sol', cor:'#3f9d5a', cor2:'#57bd75', peso:'1 kg',    preco:4.99,  forma:'grao',    tipo:'caixa',   dim:[0.18,0.25,0.09], secao:'Mercearia' },
    { id:'biscoito', nome:'Biscoito Recheado', marca:'Crocante', cor:'#c5372f', cor2:'#e05a4f', peso:'400 g', preco:6.99,  forma:'circulo', tipo:'caixa',   dim:[0.20,0.16,0.07], secao:'Mercearia' },
    { id:'leite',    nome:'Leite Integral', marca:'Fazenda Boa', cor:'#1e5fae', cor2:'#4a86cf', peso:'1 L',   preco:5.49,  forma:'circulo', tipo:'caixa',   dim:[0.10,0.23,0.07], secao:'Mercearia' },
    { id:'oleo',     nome:'Óleo de Soja', marca:'Girassol',    cor:'#d9b310', cor2:'#efd050', peso:'900 ml',  preco:7.99,  forma:'circulo', tipo:'garrafa', dim:[0.045,0.26],     secao:'Mercearia' },
    { id:'milho',    nome:'Milho Verde', marca:'Horta Boa',    cor:'#e8a41c', cor2:'#f5cc55', peso:'170 g',   preco:3.29,  forma:'grao',    tipo:'lata',    dim:[0.037,0.11],     secao:'Mercearia' },
    { id:'refri',    nome:'Refrigerante Cola', marca:'Fizz',   cor:'#2b2b2b', cor2:'#7a1f1f', peso:'2 L',     preco:9.90,  forma:'circulo', tipo:'garrafa', dim:[0.055,0.32],     secao:'Bebidas' },
    { id:'suco',     nome:'Suco de Uva', marca:'Pomar',        cor:'#6b2d8a', cor2:'#9a4fc0', peso:'1 L',     preco:11.50, forma:'circulo', tipo:'garrafa', dim:[0.045,0.27],     secao:'Bebidas' },
    { id:'agua',     nome:'Água Mineral', marca:'Fonte Clara', cor:'#2f9ec4', cor2:'#7fd0e8', peso:'1,5 L',   preco:2.99,  forma:'circulo', tipo:'garrafa', dim:[0.048,0.29],     secao:'Bebidas' },
    { id:'cerveja',  nome:'Cerveja Lata', marca:'Boa Praia',   cor:'#c8a11e', cor2:'#e6c452', peso:'350 ml',  preco:3.79,  forma:'circulo', tipo:'lata',    dim:[0.033,0.12],     secao:'Bebidas' },
    { id:'sabao',    nome:'Sabão em Pó', marca:'Brilho Azul',  cor:'#1f6fb2', cor2:'#3f95d8', peso:'800 g',   preco:12.90, forma:'quadro',  tipo:'caixa',   dim:[0.22,0.28,0.09], secao:'Limpeza' },
    { id:'detergente', nome:'Detergente Neutro', marca:'Brilho Azul', cor:'#2fa04f', cor2:'#4fc06f', peso:'500 ml', preco:2.79, forma:'quadro', tipo:'garrafa', dim:[0.035,0.20], secao:'Limpeza' },
    { id:'amaciante',nome:'Amaciante Lavanda', marca:'Aconchego', cor:'#8a4fc4', cor2:'#a877dd', peso:'2 L',  preco:11.90, forma:'quadro',  tipo:'garrafa', dim:[0.06,0.30],      secao:'Limpeza' },
    { id:'agua_sanit', nome:'Água Sanitária', marca:'Brilho Azul', cor:'#e8eef2', cor2:'#c7d6de', peso:'2 L', preco:4.49, forma:'quadro',   tipo:'garrafa', dim:[0.058,0.30],     secao:'Limpeza' },
    { id:'papel',    nome:'Papel Higiênico', marca:'Neve',     cor:'#5db3e8', cor2:'#8fd0f5', peso:'4 rolos', preco:8.90,  forma:'circulo', tipo:'caixa',   dim:[0.26,0.20,0.13], secao:'Higiene' },
    { id:'sabonete', nome:'Sabonete Erva', marca:'Neve',       cor:'#7ec46a', cor2:'#a3dc92', peso:'90 g',    preco:2.19,  forma:'quadro',  tipo:'caixa',   dim:[0.10,0.07,0.05], secao:'Higiene' },
    { id:'shampoo',  nome:'Shampoo Cachos', marca:'Aconchego', cor:'#d94f8a', cor2:'#ef79a8', peso:'350 ml',  preco:14.50, forma:'circulo', tipo:'garrafa', dim:[0.04,0.22],      secao:'Higiene' },
    { id:'creme',    nome:'Creme Dental', marca:'Sorriso Bom', cor:'#e34b3f', cor2:'#f2776c', peso:'90 g',    preco:4.99,  forma:'quadro',  tipo:'caixa',   dim:[0.19,0.05,0.04], secao:'Higiene' }
  ];
  function produto(id) { for (var i=0;i<PRODUTOS.length;i++) if (PRODUTOS[i].id===id) return PRODUTOS[i]; return null; }

  /* ---------------- helpers ---------------- */
  function material(chave, opcoes) {
    if (!mat[chave]) mat[chave] = new THREE.MeshStandardMaterial(opcoes);
    return mat[chave];
  }
  function bloco(w, h, d, material, x, y, z, rotY) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    if (rotY) m.rotation.y = rotY;
    m.castShadow = true; m.receiveShadow = true;
    grupo.add(m);
    return m;
  }
  function colisor(x, z, w, d) {
    colisores.push({ x1: x - w/2, x2: x + w/2, z1: z - d/2, z2: z + d/2 });
  }
  function placaMesh(canvas, w, h, x, y, z, rotY) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: Tex.textura(canvas, 1, 1), roughness:.8, metalness:0, envMapIntensity:.3 }));
    m.position.set(x, y, z);
    if (rotY) m.rotation.y = rotY;
    grupo.add(m);
    return m;
  }
  function criarInterativo(tag, obj, pos, raio, rotulo) {
    var it = { tag: tag, obj: obj, pos: pos.clone(), raio: raio || 2.2,
               rotulo: rotulo || 'Interagir', ativo: false, acao: null };
    interativos.push(it); iat[tag] = it;
    return it;
  }

  function criarSeta() {
    var m = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 5),
      new THREE.MeshStandardMaterial({ color: 0x2ad06f, emissive: 0x1b8f4d, emissiveIntensity: 1.2, roughness:.4 }));
    m.rotation.x = Math.PI; m.visible = false;
    grupo.add(m);
    animados.push(function (t) {
      if (m.visible) { m.position.y = m.userData.baseY + Math.sin(t*3)*0.11; m.rotation.y = t*1.6; }
    });
    return m;
  }

  /* =========================================================
     PRODUTOS
     ========================================================= */
  function matRotulo(p) {
    return material('rot_' + p.id, {
      map: Tex.textura(Tex.rotulo(p), 1, 1), roughness: .48, metalness: .03, envMapIntensity: .35 });
  }
  function matLisa(p) {
    return material('lisa_' + p.id, {
      map: Tex.textura(Tex.embalagemLisa(p.cor), 1, 1), roughness: .58, metalness: .03, envMapIntensity: .3 });
  }
  function matTampa(p) {
    return material('tampa_' + p.id, { color: new THREE.Color(p.cor2 || p.cor), roughness: .5 });
  }

  // produto avulso (usado nas missões e nas mãos do funcionário)
  function criarProduto(p) {
    if (p.tipo === 'caixa') {
      var l = matLisa(p), f = matRotulo(p);
      return new THREE.Mesh(new THREE.BoxGeometry(p.dim[0], p.dim[1], p.dim[2]), [l, l, l, l, f, l]);
    }
    if (p.tipo === 'lata') {
      var topo = material('latatopo', { map: Tex.textura(Tex.metal(true),1,1), roughness:.32, metalness:.9 });
      return new THREE.Mesh(new THREE.CylinderGeometry(p.dim[0], p.dim[0], p.dim[1], 18, 1),
                            [matRotulo(p), topo, topo]);
    }
    var g = new THREE.Group();
    var corpo = new THREE.Mesh(new THREE.CylinderGeometry(p.dim[0], p.dim[0]*.96, p.dim[1]*.74, 16, 1), matRotulo(p));
    corpo.position.y = p.dim[1]*.37;
    var ombro = new THREE.Mesh(new THREE.CylinderGeometry(p.dim[0]*.34, p.dim[0], p.dim[1]*.16, 16, 1), matLisa(p));
    ombro.position.y = p.dim[1]*.82;
    var tampa = new THREE.Mesh(new THREE.CylinderGeometry(p.dim[0]*.33, p.dim[0]*.33, p.dim[1]*.10, 14, 1), matTampa(p));
    tampa.position.y = p.dim[1]*.95;
    g.add(corpo, ombro, tampa);
    return g;
  }

  function porNaPrateleira(p, x, yPrat, z, rotY) {
    var o = criarProduto(p);
    if (p.tipo === 'garrafa') o.position.set(x, yPrat, z);
    else o.position.set(x, yPrat + p.dim[1]/2, z);
    o.rotation.y = rotY || 0;
    grupo.add(o);
    return o;
  }

  /* ---------- fileiras de produto usando InstancedMesh (prateleira cheia) ---------- */
  function encherPrateleira(p, cx, comp, y, cz, lado, reservas) {
    var largura = p.tipo === 'caixa' ? p.dim[0] : p.dim[0]*2;
    var espaco = largura + 0.028;
    var qtd = Math.min(46, Math.floor((comp - 0.45) / espaco));
    var fileiras = 2, total = qtd * fileiras;
    var x0 = cx - (qtd - 1) * espaco / 2;
    var rot = lado > 0 ? 0 : Math.PI;
    var d = new THREE.Object3D();

    function reservado(x) {
      if (!reservas) return false;
      for (var r = 0; r < reservas.length; r++) {
        if (reservas[r].lado === lado && x > reservas[r].x1 && x < reservas[r].x2) return true;
      }
      return false;
    }

    var geo, alturaBase;
    if (p.tipo === 'caixa') { geo = new THREE.BoxGeometry(p.dim[0], p.dim[1], p.dim[2]); alturaBase = p.dim[1]/2; }
    else { geo = new THREE.CylinderGeometry(p.dim[0], p.dim[0], p.dim[1]*0.84, 14, 1); alturaBase = p.dim[1]*0.42; }

    var corpo = new THREE.InstancedMesh(geo, matRotulo(p), total);
    var tampas = null;
    if (p.tipo === 'garrafa') {
      tampas = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(p.dim[0]*.34, p.dim[0]*.34, p.dim[1]*0.16, 10, 1), matTampa(p), total);
    }

    var n = 0;
    for (var f = 0; f < fileiras; f++) {
      var zf = cz + lado * (0.30 - f * 0.17);
      for (var i = 0; i < qtd; i++) {
        var x = x0 + i * espaco;
        var vazio = reservado(x) || (f === 0 && Math.random() < 0.06);
        d.position.set(x, y + alturaBase + 0.02, zf);
        d.rotation.set(0, rot + (Math.random()-.5)*0.06, 0);
        d.scale.setScalar(vazio ? 0.0001 : 1);
        d.updateMatrix(); corpo.setMatrixAt(n, d.matrix);
        if (tampas) {
          d.position.y = y + p.dim[1]*0.92;
          d.updateMatrix(); tampas.setMatrixAt(n, d.matrix);
        }
        n++;
      }
    }
    corpo.instanceMatrix.needsUpdate = true;
    corpo.castShadow = false; corpo.receiveShadow = true;
    grupo.add(corpo);
    if (tampas) { tampas.instanceMatrix.needsUpdate = true; grupo.add(tampas); }
  }

  /* =========================================================
     GÔNDOLA
     ========================================================= */
  function gondola(cfg, reservas) {
    var cz = cfg.z, cx = GOND_CX, comp = GOND_COMP;
    var metalMat = material('metalGond', { map: Tex.textura(Tex.metal(true), 8, 2), roughness:.5, metalness:.5, envMapIntensity:.5 });
    var fundoMat = material('fundoGond', { map: Tex.textura(Tex.metal(false), 10, 3), roughness:.7, metalness:.35, envMapIntensity:.35 });
    var testeiraMat = material('testeira', { color: 0xf4f5f6, roughness:.55 });

    bloco(comp, GOND_ALT, 0.06, fundoMat, cx, GOND_ALT/2, cz);          // fundo
    bloco(comp, 0.16, GOND_LARG, metalMat, cx, 0.08, cz);               // rodapé
    bloco(0.06, GOND_ALT, GOND_LARG, metalMat, cx - comp/2, GOND_ALT/2, cz);
    bloco(0.06, GOND_ALT, GOND_LARG, metalMat, cx + comp/2, GOND_ALT/2, cz);
    colisor(cx, cz, comp + 0.1, GOND_LARG + 0.1);

    var lista = PRODUTOS.filter(function (p) { return p.secao === cfg.secao; });
    var prateleiras = [];

    for (var lado = -1; lado <= 1; lado += 2) {
      for (var a = 0; a < PRATELEIRAS.length; a++) {
        var y = PRATELEIRAS[a];
        bloco(comp - 0.14, 0.035, GOND_LARG/2 - 0.06, metalMat, cx, y, cz + lado*(GOND_LARG/4 + 0.02));
        bloco(comp - 0.14, 0.08, 0.02, testeiraMat, cx, y - 0.045, cz + lado*(GOND_LARG/2 - 0.01));

        var p = lista[(a * 2 + (lado > 0 ? 0 : 1)) % lista.length];
        encherPrateleira(p, cx, comp, y, cz, lado, reservas);

        // placas de preço ao longo da testeira
        for (var k = 0; k < 3; k++) {
          var px = cx - comp/2 + 1.6 + k * (comp - 3.2) / 2;
          placaMesh(Tex.placaPreco(p.nome, p.preco, false), 0.30, 0.15,
                    px, y - 0.05, cz + lado * (GOND_LARG/2 + 0.006), lado > 0 ? 0 : Math.PI);
        }
        prateleiras.push({ produto: p, y: y, lado: lado });
      }
    }

    // letreiro pendurado
    placaMesh(Tex.letreiro(cfg.secao, cfg.cor), 2.6, 0.65, cx + 4.5, 3.1, cz + 0.06);
    placaMesh(Tex.letreiro(cfg.secao, cfg.cor), 2.6, 0.65, cx + 4.5, 3.1, cz - 0.06, Math.PI);
    var haste = material('haste', { color: 0x8f979d, metalness:.7, roughness:.4 });
    bloco(0.03, 0.95, 0.03, haste, cx + 3.4, 3.6, cz);
    bloco(0.03, 0.95, 0.03, haste, cx + 5.6, 3.6, cz);

    return { z: cz, secao: cfg.secao, prateleiras: prateleiras };
  }

  /* =========================================================
     ESTRUTURA (piso, paredes, teto, luz)
     ========================================================= */
  function estrutura() {
    var pisoMat = new THREE.MeshStandardMaterial({
      map: Tex.textura(Tex.piso(), 11, 9),
      roughnessMap: Tex.textura(Tex.pisoRugosidade(), 11, 9),
      roughness: .62, metalness: .05, envMapIntensity: .35, color: 0xdcdcd8
    });
    var piso = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), pisoMat);
    piso.rotation.x = -Math.PI/2; piso.position.set(0, 0, 1);
    piso.receiveShadow = true; grupo.add(piso);

    var cimento = new THREE.MeshStandardMaterial({ color: 0x76766f, roughness:.97, metalness:.02 });
    var pisoDep = new THREE.Mesh(new THREE.PlaneGeometry(11, 10.4), cimento);
    pisoDep.rotation.x = -Math.PI/2; pisoDep.position.set(9.5, 0.002, -15);
    pisoDep.receiveShadow = true; grupo.add(pisoDep);

    var forroMat = new THREE.MeshStandardMaterial({ map: Tex.textura(Tex.forro(), 12, 9), roughness:.96, color: 0xdadad6 });
    var teto = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), forroMat);
    teto.rotation.x = Math.PI/2; teto.position.set(0, 4.2, 1); grupo.add(teto);
    var tetoDep = new THREE.Mesh(new THREE.PlaneGeometry(11, 10.4), forroMat);
    tetoDep.rotation.x = Math.PI/2; tetoDep.position.set(9.5, 3.4, -15); grupo.add(tetoDep);

    var paredeMat = new THREE.MeshStandardMaterial({ map: Tex.textura(Tex.parede(), 6, 2), roughness:.94, color: 0xdfe2e0 });
    bloco(0.3, 4.2, 22, paredeMat, -15, 2.1, 1);   colisor(-15, 1, 0.4, 22);
    bloco(0.3, 4.2, 22, paredeMat,  15, 2.1, 1);   colisor( 15, 1, 0.4, 22);
    // frente da loja: só a viga superior é de alvenaria, o resto é vitrine
    bloco(30, 0.8, 0.3, paredeMat, 0, 3.8, 12);    colisor(0, 12, 30, 0.4);
    bloco(26.2, 4.2, 0.3, paredeMat, -1.9, 2.1, -10);  colisor(-1.9, -10, 26.2, 0.4);
    bloco(1.6,  4.2, 0.3, paredeMat, 14.2, 2.1, -10);  colisor(14.2, -10, 1.6, 0.4);
    bloco(0.3, 3.4, 10.4, paredeMat, 4, 1.7, -15);   colisor(4, -15, 0.4, 10.4);
    bloco(0.3, 3.4, 10.4, paredeMat, 15, 1.7, -15);  colisor(15, -15, 0.4, 10.4);
    bloco(11.3, 3.4, 0.3, paredeMat, 9.5, 1.7, -20); colisor(9.5, -20, 11.3, 0.4);

    var batente = material('batente', { color: 0x4c5760, roughness:.6, metalness:.3 });
    bloco(2.4, 0.3, 0.34, batente, 12.3, 2.95, -10);
    bloco(0.12, 2.8, 0.34, batente, 11.2, 1.4, -10);
    bloco(0.12, 2.8, 0.34, batente, 13.5, 1.4, -10);
    placaMesh(Tex.letreiro('DEPÓSITO', '#37474f'), 1.7, 0.42, 12.3, 3.35, -9.83);

    // vitrine da frente
    var vidroMat = new THREE.MeshStandardMaterial({ color: 0x9fc0c8, roughness:.06, metalness:.15,
      transparent:true, opacity:.20, envMapIntensity:1.2 });
    var v1 = new THREE.Mesh(new THREE.BoxGeometry(28.5, 3.3, 0.06), vidroMat);
    v1.position.set(0, 1.85, 11.8); grupo.add(v1);
    var alum = material('alum', { color: 0xa9b1b7, metalness:.8, roughness:.32 });
    for (var ex = -13; ex <= 13; ex += 3.25) bloco(0.09, 3.5, 0.14, alum, ex, 1.95, 11.78);
    bloco(29.5, 0.16, 0.2, alum, 0, 3.62, 11.78);
    bloco(29.5, 0.1, 0.2, alum, 0, 0.2, 11.78);
    placaMesh(Tex.letreiro('ENTRADA', '#1b8f4d'), 3.0, 0.75, 0, 3.95, 11.6, Math.PI);

    // vista da rua (aparece através da vitrine)
    var rua = new THREE.Mesh(new THREE.PlaneGeometry(90, 26),
      new THREE.MeshBasicMaterial({ map: Tex.textura(Tex.exterior(), 1, 1) }));
    rua.position.set(0, 3.0, 28); rua.rotation.y = Math.PI; grupo.add(rua);
    var chaoRua = new THREE.Mesh(new THREE.PlaneGeometry(90, 17),
      new THREE.MeshStandardMaterial({ color: 0x747875, roughness:.96 }));
    chaoRua.rotation.x = -Math.PI/2; chaoRua.position.set(0, 0.0, 20); grupo.add(chaoRua);

    var tapete = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x232a30, roughness:1 }));
    tapete.rotation.x = -Math.PI/2; tapete.position.set(0, 0.014, 10.6);
    tapete.receiveShadow = true; grupo.add(tapete);

    var rod = material('rodape', { color: 0x39434b, roughness:.7 });
    bloco(29.7, 0.14, 0.06, rod, 0, 0.07, -9.82);
    bloco(0.06, 0.14, 21.7, rod, -14.82, 0.07, 1);
    bloco(0.06, 0.14, 21.7, rod, 14.82, 0.07, 1);

    /* ---- iluminação (mercado é claro, mas sem estourar) ---- */
    cena.add(new THREE.AmbientLight(0x9fb0c0, 0.16));
    cena.add(new THREE.HemisphereLight(0xeef4fa, 0x60666b, 0.22));

    var lumMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e8, emissiveIntensity: .75 });
    for (var lx = -11; lx <= 11; lx += 5.5)
      for (var lz = -8; lz <= 10; lz += 4.5) {
        var lum = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.07, 0.45), lumMat);
        lum.position.set(lx, 4.12, lz); grupo.add(lum);
      }

    var pontos = [[-10,-7],[-10,-1],[-10,5],[-10,10],[0,-7],[0,-1],[0,5],[0,10],
                  [10,-7],[10,-1],[10,5],[10,10]];
    for (var i = 0; i < pontos.length; i++) {
      var pl = new THREE.PointLight(0xfff2e0, 0.30, 13, 2);
      pl.position.set(pontos[i][0], 3.85, pontos[i][1]);
      cena.add(pl);
    }
    var lampDep = new THREE.PointLight(0xffeeda, 0.45, 14, 2);
    lampDep.position.set(9.5, 3.1, -15); cena.add(lampDep);
    var lumDep = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.07, 0.4), lumMat);
    lumDep.position.set(9.5, 3.32, -15); grupo.add(lumDep);

    var dir1 = new THREE.DirectionalLight(0xffffff, 0.35);
    dir1.position.set(7, 14, 9); dir1.castShadow = true;
    dir1.shadow.mapSize.set(2048, 2048);
    var c = dir1.shadow.camera;
    c.left = -20; c.right = 20; c.top = 20; c.bottom = -22; c.near = 1; c.far = 45;
    dir1.shadow.bias = -0.0006;
    cena.add(dir1); cena.add(dir1.target);
  }

  /* =========================================================
     AÇOUGUE (fundo, ao norte)
     ========================================================= */
  function acougue() {
    var azul = new THREE.MeshStandardMaterial({ map: Tex.textura(Tex.azulejo(), 8, 3), roughness:.35, metalness:.05, envMapIntensity:.5 });
    var p = new THREE.Mesh(new THREE.BoxGeometry(13, 3.2, 0.1), azul);
    p.position.set(3.5, 1.6, -9.78); p.receiveShadow = true; grupo.add(p);

    var inox = material('inox', { map: Tex.textura(Tex.metal(true), 4, 1), roughness:.34, metalness:.85, envMapIntensity:.8 });
    var vidroBalcao = new THREE.MeshStandardMaterial({ color: 0xcfe2e8, roughness:.05, metalness:.1,
      transparent:true, opacity:.22, envMapIntensity:1.2 });

    var cx = 3.5, cz = -8.3, larg = 11;
    bloco(larg, 0.95, 1.1, inox, cx, 0.475, cz);
    bloco(larg, 0.08, 1.25, inox, cx, 0.99, cz);
    colisor(cx, cz, larg + .1, 1.35);
    var v = new THREE.Mesh(new THREE.BoxGeometry(larg, 0.72, 0.04), vidroBalcao);
    v.position.set(cx, 1.30, cz + 0.54); v.rotation.x = -0.42; grupo.add(v);

    var carneMat = new THREE.MeshStandardMaterial({ map: Tex.textura(Tex.carne(), 1, 1), roughness:.55, metalness:.02 });
    var bandeja = material('bandeja', { color: 0xeceded, roughness:.45 });
    var nomes = ['Alcatra','Costela','Frango','Picanha','Coxão Mole','Linguiça','Fraldinha','Asa de Frango'];
    var precos = [42.9, 26.9, 9.9, 79.9, 38.9, 19.9, 44.9, 14.9];
    for (var i = 0; i < 8; i++) {
      var bx = cx - larg/2 + 0.9 + i * 1.35;
      bloco(1.0, 0.05, 0.6, bandeja, bx, 1.02, cz);
      var carne = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.11, 0.48), carneMat);
      carne.position.set(bx, 1.09, cz); grupo.add(carne);
      placaMesh(Tex.placaPreco(nomes[i], precos[i], i === 2), 0.30, 0.15, bx, 1.18, cz - 0.28);
    }
    for (var l = 0; l < 3; l++) {
      var luz = new THREE.PointLight(0xffd2b0, 0.38, 4.5, 2);
      luz.position.set(cx - 3.5 + l*3.5, 1.85, cz + 0.15); cena.add(luz);
    }
    placaMesh(Tex.letreiro('AÇOUGUE', '#b3261e'), 3.6, 0.9, cx, 2.6, -9.7);
    placaMesh(Tex.cartaz('CORTES DO DIA', 'Peça no balcão', 'Atendimento das 8h às 22h', '#b3261e'),
              1.1, 0.82, cx + 5.6, 1.8, -9.7);
    bloco(0.5, 0.12, 0.4, inox, cx - 4, 1.06, cz - 0.2);
    bloco(0.36, 0.26, 0.05, material('visor', { color: 0x0f1418, roughness:.3, metalness:.4 }), cx - 4, 1.25, cz - 0.33);
  }

  /* =========================================================
     HORTIFRÚTI (canto noroeste)
     ========================================================= */
  function hortifruti() {
    var mad = material('madeiraExp', { map: Tex.textura(Tex.madeira(), 2, 2), roughness:.88 });
    var itens = [
      { nome:'Laranja', cor:'#e8871e', r:0.055, escura:'150,90,10',  preco:4.99 },
      { nome:'Maçã',    cor:'#c62828', r:0.05,  escura:'110,20,20',  preco:8.90 },
      { nome:'Tomate',  cor:'#d43b25', r:0.045, escura:'120,30,20',  preco:6.49 },
      { nome:'Limão',   cor:'#9ccc3a', r:0.04,  escura:'90,110,20',  preco:7.90 },
      { nome:'Batata',  cor:'#c9a86a', r:0.05,  escura:'120,90,50',  preco:5.49 },
      { nome:'Cebola',  cor:'#d9c08a', r:0.045, escura:'140,110,60', preco:4.29 }
    ];
    var colunas = [-13.3, -10.3], linhas = [-9.0, -7.0, -5.0];
    for (var i = 0; i < itens.length; i++) {
      var bx = colunas[i % 2], bz = linhas[Math.floor(i / 2)];
      bloco(2.4, 0.72, 1.5, mad, bx, 0.36, bz); colisor(bx, bz, 2.5, 1.6);
      // tampo inclinado para a frente (o cliente vê a mercadoria)
      var tampo = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.55), mad);
      tampo.position.set(bx, 0.80, bz); tampo.rotation.x = 0.16;
      tampo.castShadow = true; tampo.receiveShadow = true; grupo.add(tampo);
      bloco(2.4, 0.22, 0.07, mad, bx, 0.79, bz + 0.76);      // borda da frente segura a fruta
      bloco(0.07, 0.17, 1.5, mad, bx - 1.2, 0.86, bz);
      bloco(0.07, 0.17, 1.5, mad, bx + 1.2, 0.86, bz);

      var frutaMat = new THREE.MeshStandardMaterial({
        map: Tex.textura(Tex.casca(itens[i].cor, itens[i].escura), 1, 1), roughness:.6, metalness:.02 });
      var r = itens[i].r, cols = Math.round(2.0 / (r * 2.3)), lins = 5, camadas = 2;
      var total = cols * lins * camadas;
      var inst = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 14, 10), frutaMat, total);
      var d = new THREE.Object3D(), n = 0;
      for (var cam = 0; cam < camadas; cam++) {
        for (var lin = 0; lin < lins; lin++) {
          for (var col = 0; col < cols; col++) {
            var dz = -0.6 + lin * 0.30 + (cam ? 0.14 : 0);
            var px = bx - 1.05 + col * (2.1 / (cols - 1)) + (lin % 2) * r * 0.6 + (cam ? r : 0);
            var py = 0.84 + 0.159 * dz + r + cam * r * 1.6;
            d.position.set(px, py, bz + dz);
            d.rotation.set(Math.random()*3, Math.random()*3, Math.random()*3);
            d.scale.setScalar(0.85 + Math.random()*0.28);
            d.updateMatrix(); inst.setMatrixAt(n++, d.matrix);
          }
        }
      }
      inst.instanceMatrix.needsUpdate = true;
      inst.castShadow = true; inst.receiveShadow = true; grupo.add(inst);
      placaMesh(Tex.placaPreco(itens[i].nome + ' kg', itens[i].preco, i === 1), 0.44, 0.22, bx, 0.5, bz + 0.81);
    }
    placaMesh(Tex.letreiro('HORTIFRÚTI', '#2e7d32'), 3.4, 0.85, -11.8, 2.6, -9.7);

    var inox = material('inox2', { map: Tex.textura(Tex.metal(true), 2, 1), roughness:.35, metalness:.85 });
    bloco(0.7, 1.0, 0.7, inox, -7.6, 0.5, -8.6); colisor(-7.6, -8.6, 0.8, 0.8);
    bloco(0.62, 0.1, 0.62, inox, -7.6, 1.05, -8.6);
    bloco(0.45, 0.3, 0.05, material('visor2', { color: 0x0e1216, roughness:.3 }), -7.6, 1.3, -8.75);
  }

  /* =========================================================
     FREEZERS (parede leste)
     ========================================================= */
  function freezers() {
    var inox = material('inoxF', { map: Tex.textura(Tex.metal(false), 2, 2), roughness:.42, metalness:.75, envMapIntensity:.7 });
    var vidroMat = new THREE.MeshStandardMaterial({ color: 0xbdd8e2, roughness:.05, metalness:.1,
      transparent:true, opacity:.25, envMapIntensity:1.3 });
    var interno = new THREE.MeshStandardMaterial({ color: 0xd2dee4, roughness:.9, emissive:0x8fb6c9, emissiveIntensity:.22 });

    for (var i = 0; i < 4; i++) {
      var z = -4.2 + i * 2.6;
      bloco(1.2, 2.4, 2.5, inox, 14.1, 1.2, z);  colisor(14.1, z, 1.3, 2.5);
      var dentro = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.0, 2.2), interno);
      dentro.position.set(14.15, 1.2, z); grupo.add(dentro);
      for (var p = 0; p < 3; p++) for (var q = 0; q < 4; q++) {
        var cx2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.2),
          material('gelado' + (q % 3), { color: [0x2f6fb2, 0xc93b2f, 0x2f9a55][q % 3], roughness:.5 }));
        cx2.position.set(14.0, 0.55 + p * 0.62, z - 0.8 + q * 0.52);
        grupo.add(cx2);
      }
      var porta = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.15, 2.3), vidroMat);
      porta.position.set(13.5, 1.2, z); grupo.add(porta);
      var lamp = new THREE.PointLight(0xcfe8f5, 0.28, 3.5, 2);
      lamp.position.set(13.9, 1.9, z); cena.add(lamp);
    }
    placaMesh(Tex.letreiro('CONGELADOS', '#0277bd'), 3.2, 0.8, 13.4, 3.0, 0.6, -Math.PI/2);
  }

  /* =========================================================
     FRENTE DE CAIXA
     ========================================================= */
  function frenteDeCaixa() {
    var lamin = material('laminado', { color: 0xdfe3e6, roughness:.45, metalness:.05 });
    var esteiraMat = material('esteira', { color: 0x1e2226, roughness:.92 });
    var inox = material('inoxC', { map: Tex.textura(Tex.metal(true), 2, 1), roughness:.4, metalness:.8 });
    var pos = [-4.5, 2.5], refs = [];

    for (var i = 0; i < 2; i++) {
      var cx = pos[i], cz = 9.2;
      bloco(1.1, 0.95, 2.8, lamin, cx, 0.475, cz); colisor(cx, cz, 1.2, 2.9);
      bloco(1.2, 0.06, 2.9, lamin, cx, 0.98, cz);
      var e = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.02, 1.7), esteiraMat);
      e.position.set(cx, 1.025, cz + 0.4); grupo.add(e);
      bloco(0.45, 0.3, 0.4, inox, cx, 1.16, cz - 1.0);
      bloco(0.5, 0.34, 0.04, material('tela', { color: 0x0f1720, emissive: 0x11402c, emissiveIntensity:.5, roughness:.25 }),
            cx, 1.55, cz - 1.05);
      bloco(0.08, 0.28, 0.08, inox, cx, 1.3, cz - 1.05);
      bloco(0.3, 0.06, 0.3, material('leitor', { color: 0x181c21, roughness:.5 }), cx, 1.04, cz - 0.6);
      var luzLeitor = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22),
        new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent:true, opacity:.5 }));
      luzLeitor.rotation.x = -Math.PI/2; luzLeitor.position.set(cx, 1.076, cz - 0.6); grupo.add(luzLeitor);
      placaMesh(Tex.letreiro('CAIXA ' + (i+1), '#1b8f4d'), 0.95, 0.24, cx, 2.35, cz - 1.4);
      bloco(0.06, 1.4, 0.06, inox, cx, 1.62, cz - 1.4);
      refs.push({ x: cx, z: cz });
    }

    for (var k = 0; k < 4; k++) carrinho(-12.6 + k * 0.55, 10.0);
    bloco(0.5, 0.8, 0.5, material('lixo', { color: 0x2b343b, roughness:.7 }), 7.0, 0.4, 10.2);
    bloco(0.22, 0.6, 0.22, material('ext', { color: 0xb71c1c, roughness:.4, metalness:.3 }), 14.4, 0.9, 9.5);
    return refs;
  }

  function carrinho(x, z) {
    var g = new THREE.Group();
    var arame = material('arame', { color: 0xaab2b8, metalness:.8, roughness:.32 });
    var cesta = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.85), arame);
    cesta.position.y = 0.65; cesta.castShadow = true; g.add(cesta);
    var cabo = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), material('caboVerm', { color: 0xc62828, roughness:.5 }));
    cabo.position.set(0, 0.95, 0.45); g.add(cabo);
    for (var i = 0; i < 4; i++) {
      var r = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), material('roda', { color: 0x1e2226, roughness:.85 }));
      r.rotation.z = Math.PI/2;
      r.position.set((i % 2 ? 0.22 : -0.22), 0.06, (i < 2 ? 0.35 : -0.35)); g.add(r);
    }
    var haste = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), arame);
    haste.position.set(0, 0.35, 0.35); g.add(haste);
    g.position.set(x, 0, z); grupo.add(g);
    return g;
  }

  /* =========================================================
     DEPÓSITO
     ========================================================= */
  function deposito() {
    var metalMat = material('metalDep', { map: Tex.textura(Tex.metal(false), 3, 2), roughness:.65, metalness:.45 });
    var papel = material('papelaoMat', { map: Tex.textura(Tex.papelao(), 1, 1), roughness:.92 });

    for (var i = 0; i < 3; i++) {
      var ex = 5.8 + i * 3.1, ez = -18.9;
      bloco(2.6, 0.1, 1.0, metalMat, ex, 0.5, ez);
      bloco(2.6, 0.1, 1.0, metalMat, ex, 1.3, ez);
      bloco(2.6, 0.1, 1.0, metalMat, ex, 2.1, ez);
      bloco(0.08, 2.4, 1.0, metalMat, ex - 1.3, 1.2, ez);
      bloco(0.08, 2.4, 1.0, metalMat, ex + 1.3, 1.2, ez);
      colisor(ex, ez, 2.7, 1.1);
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) {
        var cxa = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.6, 0.7), papel);
        cxa.position.set(ex - 0.85 + b * 0.85, 0.85 + a * 0.8, ez);
        cxa.castShadow = true; grupo.add(cxa);
      }
    }
    var mad = material('pallet', { map: Tex.textura(Tex.madeira(), 1, 1), roughness:.9 });
    for (var p = 0; p < 2; p++) {
      var px = 6.2 + p * 5, pz = -14.2;
      bloco(1.2, 0.14, 1.2, mad, px, 0.07, pz); colisor(px, pz, 1.3, 1.3);
      for (var q = 0; q < 4; q++) {
        var c2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.75), papel);
        c2.position.set(px - 0.3 + (q % 2) * 0.6, 0.44 + Math.floor(q / 2) * 0.62, pz);
        c2.castShadow = true; grupo.add(c2);
      }
    }
    placaMesh(Tex.cartaz('ATENÇÃO', 'Use os EPIs', 'Empilhe no máximo 5 caixas', '#e65100'), 1.2, 0.9, 8.0, 2.1, -19.8);
    placaMesh(Tex.cartaz('PVPS', 'Primeiro que vence,', 'primeiro que sai', '#1b8f4d'), 1.2, 0.9, 11.0, 2.1, -19.8);

    var inox = material('pia', { map: Tex.textura(Tex.metal(true), 1, 1), roughness:.32, metalness:.88 });
    bloco(0.55, 0.9, 1.1, inox, 4.6, 0.45, -12.5); colisor(4.6, -12.5, 0.65, 1.2);
    bloco(0.06, 0.3, 0.06, inox, 4.75, 1.05, -12.5);
    placaMesh(Tex.cartaz('HIGIENE', 'Lave as mãos', 'Antes de repor alimentos', '#0277bd'), 0.75, 0.56, 4.32, 1.8, -12.5, Math.PI/2);

    // caixa de reposição (missão 2)
    var caixaRep = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.8), papel);
    caixaRep.position.set(9.2, 0.31, -11.6); caixaRep.castShadow = true; grupo.add(caixaRep);
    var etiqueta = placaMesh(Tex.cartaz('ARROZ 5KG', 'Lote novo', 'Validade 10/2027', '#1b8f4d'),
                             0.5, 0.38, 9.2, 0.36, -11.19);
    criarInterativo('caixaEstoque', caixaRep, caixaRep.position, 2.2, 'Pegar a caixa de arroz');

    // rodo (missão 6)
    var rodo = new THREE.Group();
    var caboR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8), material('caboRodo', { color: 0x2f6fb2, roughness:.6 }));
    caboR.position.y = 0.7; caboR.rotation.z = 0.22; rodo.add(caboR);
    var baseR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.12), material('baseRodo', { color: 0x1b1f24, roughness:.85 }));
    baseR.position.set(-0.16, 0.04, 0); rodo.add(baseR);
    rodo.position.set(6.0, 0, -11.2); grupo.add(rodo);
    criarInterativo('rodo', rodo, rodo.position, 2.2, 'Pegar o rodo');

    // placa de piso molhado (missão 6)
    var placaPiso = new THREE.Group();
    var lado1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.02), material('placaAmarela', { color: 0xf0c419, roughness:.5 }));
    lado1.position.set(0, 0.32, 0.1); lado1.rotation.x = 0.22; placaPiso.add(lado1);
    var lado2 = lado1.clone(); lado2.position.z = -0.1; lado2.rotation.x = -0.22; placaPiso.add(lado2);
    placaPiso.position.set(6.7, 0, -11.4); grupo.add(placaPiso);
    criarInterativo('placaPiso', placaPiso, placaPiso.position, 2.2, 'Pegar a placa de piso molhado');

    return { caixaRep: caixaRep, rodo: rodo, placaPiso: placaPiso, etiqueta: etiqueta };
  }

  /* =========================================================
     PESSOAS
     ========================================================= */
  function pessoa(corCamisa, corCalca, corPele) {
    var g = new THREE.Group();
    var pele = new THREE.MeshStandardMaterial({ color: corPele, roughness:.72, envMapIntensity:.3 });
    var camisa = new THREE.MeshStandardMaterial({ color: corCamisa, roughness:.88, envMapIntensity:.3 });
    var calca = new THREE.MeshStandardMaterial({ color: corCalca, roughness:.92, envMapIntensity:.3 });
    var cabelo = new THREE.MeshStandardMaterial({ color: 0x241a14, roughness:.88, envMapIntensity:.25 });

    var tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.62, 14), camisa);
    tronco.position.y = 1.12; g.add(tronco);
    var ombros = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10), camisa);
    ombros.position.y = 1.40; ombros.scale.set(1.25, .6, .85); g.add(ombros);
    var pescoco = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.1, 10), pele);
    pescoco.position.y = 1.51; g.add(pescoco);
    var cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14), pele);
    cabeca.position.y = 1.63; cabeca.scale.set(.92, 1.12, 1); g.add(cabeca);
    var cab = new THREE.Mesh(new THREE.SphereGeometry(0.121, 18, 14), cabelo);
    cab.position.y = 1.66; cab.scale.set(.95, 1.0, 1); g.add(cab);

    var bracos = [], pernas = [];
    for (var s = -1; s <= 1; s += 2) {
      var br = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.56, 10), camisa);
      br.position.set(s * 0.245, 1.12, 0); g.add(br); bracos.push(br);
      var mao = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), pele);
      mao.position.set(s * 0.245, 0.83, 0); g.add(mao);
      var pn = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.8, 10), calca);
      pn.position.set(s * 0.10, 0.42, 0); g.add(pn); pernas.push(pn);
      var pe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x191d22, roughness:.85 }));
      pe.position.set(s * 0.10, 0.035, 0.04); g.add(pe);
    }
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.userData.pernas = pernas; g.userData.bracos = bracos;
    grupo.add(g);
    return g;
  }

  function animarCaminhada(p, t, andando) {
    var f = andando ? Math.sin(t * 7) : 0;
    p.userData.pernas[0].rotation.x = f * 0.5;
    p.userData.pernas[1].rotation.x = -f * 0.5;
    p.userData.bracos[0].rotation.x = -f * 0.4;
    p.userData.bracos[1].rotation.x = f * 0.4;
    p.position.y = andando ? Math.abs(Math.sin(t * 14)) * 0.02 : 0;
  }

  /* =========================================================
     CONSTRUÇÃO
     ========================================================= */
  function construir(_cena) {
    cena = _cena;
    grupo = new THREE.Group();
    cena.add(grupo);

    estrutura();

    // a gôndola da Mercearia guarda espaço para os itens das missões
    var reservasMercearia = [{ lado: 1, x1: -9.2, x2: -3.6 }];
    var gs = [];
    for (var i = 0; i < GONDOLAS.length; i++) {
      gs.push(gondola(GONDOLAS[i], i === 0 ? reservasMercearia : null));
    }
    var G1 = GONDOLAS[0].z;                     // Mercearia
    var zF = zFrente(G1), zT = zTesteira(G1);

    acougue();
    hortifruti();
    freezers();
    var caixas = frenteDeCaixa();
    var dep = deposito();

    /* ---------- pessoas ---------- */
    var acougueiro = pessoa(0xf2f2f2, 0x2b3a45, 0xcf9a6f);
    acougueiro.position.set(3.5, 0, -9.1); acougueiro.rotation.y = Math.PI;
    var toca = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.13, 14),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness:.9 }));
    toca.position.y = 1.75; acougueiro.add(toca);

    var operadora = pessoa(0x1b8f4d, 0x1e2a33, 0xc08657);
    operadora.position.set(-3.5, 0, 9.4); operadora.rotation.y = -Math.PI/2;

    var cliente = pessoa(0xc0392b, 0x37474f, 0xdcae86);
    cliente.position.set(-0.7, 0, 6.6); cliente.rotation.y = Math.PI;
    criarInterativo('cliente', cliente, cliente.position, 2.6, 'Atender o cliente');

    /* ---------- itens das missões ---------- */
    // 6 caixas de leite para conferir validade (prateleira do meio da Mercearia)
    var leite = produto('leite');
    var itensValidade = [];
    var datasBoas = ['09/2027', '04/2028', '07/2027', '11/2027', '02/2028', '06/2027'];
    var datasVenc  = ['05/2025', '02/2026', '12/2025', '08/2024', '01/2026', '03/2026'];
    for (var v = 0; v < 6; v++) {
      var xv = -8.7 + v * 0.62;
      var vencido = (v === 1 || v === 3 || v === 4);
      var obj = porNaPrateleira(leite, xv, PRATELEIRAS[2] + 0.02, zF, 0);
      var data = vencido ? datasVenc[v] : datasBoas[v];
      var et = placaMesh(Tex.etiquetaValidade(data, vencido), 0.13, 0.065, xv, PRATELEIRAS[2] + 0.17, zF + 0.045);
      itensValidade.push({ obj: obj, etiqueta: et, vencido: vencido, data: data, removido: false });
      criarInterativo('validade' + v, obj, obj.position, 1.5, 'Conferir a validade');
    }

    // placa de preço errada (macarrão) na prateleira de baixo
    var macarrao = produto('macarrao');
    for (var mm = 0; mm < 8; mm++) {
      porNaPrateleira(macarrao, -5.0 + mm * 0.19, PRATELEIRAS[1] + 0.02, zF, 0);
    }
    var placaErrada = placaMesh(Tex.placaPreco(macarrao.nome, 42.90, false), 0.34, 0.17,
                                -4.4, PRATELEIRAS[1] - 0.05, zT);
    criarInterativo('placaErrada', placaErrada, new THREE.Vector3(-4.4, 1.0, zF), 2.0, 'Conferir a placa de preço');

    // vão vazio para reposição (prateleira de baixo, lado esquerdo)
    var vao = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.4), new THREE.MeshBasicMaterial({ visible: false }));
    vao.position.set(-8.0, PRATELEIRAS[0] + 0.2, zF); grupo.add(vao);
    criarInterativo('vaoGondola', vao, vao.position, 2.2, 'Repor os produtos na gôndola');

    // derramamento de óleo no corredor entre Mercearia e Bebidas
    var mancha = new THREE.Mesh(new THREE.CircleGeometry(0.8, 30),
      new THREE.MeshStandardMaterial({ color: 0xe7d59a, roughness:.06, metalness:.15, transparent:true, opacity:.8 }));
    mancha.rotation.x = -Math.PI/2; mancha.position.set(-2.0, 0.018, -3.3);
    mancha.visible = false; grupo.add(mancha);
    var garrafaCaida = criarProduto(produto('oleo'));
    garrafaCaida.position.set(-2.0, 0.06, -3.3); garrafaCaida.rotation.z = Math.PI/2;
    garrafaCaida.visible = false; grupo.add(garrafaCaida);
    criarInterativo('derramamento', mancha, mancha.position, 2.4, 'Verificar o derramamento');

    // ponto do caixa 1
    var pdvAlvo = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
    pdvAlvo.position.set(-3.6, 1.1, 8.6); grupo.add(pdvAlvo);
    criarInterativo('pdv', pdvAlvo, pdvAlvo.position, 2.4, 'Assumir o caixa 1');

    var seta = criarSeta();

    /* ---------- animação ---------- */
    var estado = { cliente: { andando: false, destino: null, velocidade: 1.25, aoChegar: null } };
    animados.push(function (t, dt) {
      var c = estado.cliente;
      if (c.destino) {
        var dx = c.destino.x - cliente.position.x, dz = c.destino.z - cliente.position.z;
        var dist = Math.sqrt(dx*dx + dz*dz);
        if (dist > 0.18) {
          cliente.position.x += (dx/dist) * c.velocidade * dt;
          cliente.position.z += (dz/dist) * c.velocidade * dt;
          cliente.rotation.y = Math.atan2(dx, dz);
          c.andando = true;
        } else {
          c.destino = null; c.andando = false;
          if (c.aoChegar) { var f = c.aoChegar; c.aoChegar = null; f(); }
        }
        iat['cliente'].pos.copy(cliente.position);
      }
      animarCaminhada(cliente, t, c.andando);
      animarCaminhada(operadora, t, false);
      animarCaminhada(acougueiro, t, false);
      acougueiro.rotation.y = Math.PI + Math.sin(t * 0.6) * 0.22;
    });

    return {
      gondolas: gs, caixas: caixas, deposito: dep,
      cliente: cliente, operadora: operadora, acougueiro: acougueiro,
      estado: estado, itensValidade: itensValidade, placaErrada: placaErrada,
      mancha: mancha, garrafaCaida: garrafaCaida, vao: vao, seta: seta,
      zFrenteMercearia: zF
    };
  }

  function atualizar(t, dt) {
    for (var i = 0; i < animados.length; i++) animados[i](t, dt);
  }

  return {
    construir: construir, atualizar: atualizar,
    colisores: colisores, interativos: interativos, iat: iat,
    PRODUTOS: PRODUTOS, produto: produto,
    criarProduto: criarProduto, porNaPrateleira: porNaPrateleira,
    placaMesh: placaMesh, PRATELEIRAS: PRATELEIRAS
  };
})();
