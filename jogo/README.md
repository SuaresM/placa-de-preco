# Treinamento 3D — Supermercado e Açougue Central

Jogo em **primeira pessoa** para treinar funcionários na rotina da loja.
O funcionário anda pelo supermercado virtual (mercearia, bebidas, limpeza, higiene,
açougue, hortifrúti, freezers, frente de caixa e depósito) e executa as tarefas do dia a dia.

## Como abrir

Basta abrir o arquivo **`index.html`** no navegador (Chrome ou Edge, no computador).
Não precisa instalar nada e não precisa de internet — tudo já está na pasta.

```
jogo/
  index.html        <- abrir este arquivo
  js/               <- código do jogo
  vendor/three.js   <- biblioteca 3D (offline)
```

Para usar em vários computadores da loja, é só copiar a pasta `jogo` inteira.

## Controles

| Ação | Computador | Celular / tablet |
|---|---|---|
| Andar | W A S D | direcional na esquerda |
| Olhar | mover o mouse | arrastar o dedo na tela |
| Interagir | tecla **E** ou clique | botão verde **AÇÃO** |
| Correr | Shift | — |
| Pausar / soltar o mouse | Esc | — |

Ao começar, o navegador prende o cursor na tela (visão em primeira pessoa).
Se o mouse escapar, é só clicar na tela para voltar.

## As 6 tarefas do treinamento

| # | Tarefa | O que o funcionário aprende |
|---|---|---|
| 1 | Conferir a placa de preço | Placa tem que bater com o sistema; regra do menor preço anunciado |
| 2 | Reposição de gôndola | PVPS (primeiro que vence, primeiro que sai) e corredor livre |
| 3 | Conferência de validade | Ler a etiqueta, retirar só o vencido, registrar a quebra |
| 4 | Atendimento ao cliente | Abordagem, levar o cliente até o produto, encerrar bem |
| 5 | Operação de caixa | Registrar todos os itens, troco correto, cancelamento de item |
| 6 | Segurança e limpeza | Sinalizar antes de limpar, secar o piso, registrar a perda |

No fim aparece um **relatório com nota de 0 a 10**, acertos, erros, tempo e os
pontos que o funcionário precisa melhorar. Serve para o líder acompanhar quem já
está pronto para o salão.

Existe também o **Modo livre**, só para o funcionário novo conhecer a loja sem cobrança.

## Como mudar o conteúdo do treinamento

- **Perguntas, respostas e explicações:** arquivo `js/missoes.js`.
  Cada tarefa tem `titulo`, `passos` e as perguntas com `opcoes`
  (a opção certa é a que tem `certa: true`) e o `feedback` que aparece depois da resposta.
- **Produtos, preços e seções da loja:** lista `PRODUTOS` no início de `js/mundo.js`.
- **Itens e valores da compra do caixa:** dentro da missão 5, em `js/missoes.js`.
- **Layout da loja (gôndolas, açougue, caixas):** `js/mundo.js`.

## Observações técnicas

- Feito com Three.js (versão local, na pasta `vendor`), sem imagens externas:
  piso, embalagens, placas de preço, carnes e frutas são desenhados por código.
- Funciona offline. Precisa de um computador com placa de vídeo comum (roda em notebook simples).
