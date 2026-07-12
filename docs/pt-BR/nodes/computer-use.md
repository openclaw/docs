---
read_when:
    - Permitindo que o agente do Gateway veja e controle a área de trabalho de um Mac
    - Ativação, permissões ou segurança para uso do computador
    - Estendendo o comando de Node `computer.act` ou seus processadores
summary: Controle da área de trabalho orientado por agente em um Node macOS pareado por meio da ferramenta de computador e do comando de Node `computer.act`
title: Uso do computador
x-i18n:
    generated_at: "2026-07-12T00:06:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

O uso do computador permite que o agente do Gateway veja e controle um desktop **macOS** emparelhado: ele captura uma imagem da tela com o comando de nó existente `screen.snapshot` e controla o ponteiro e o teclado por meio de um único comando perigoso de nó, `computer.act`. O conjunto de ações segue as ações principais de uso do computador da Anthropic; o zoom opcional de `computer_20251124` não é exposto. Um modelo com capacidade de visão o controla por meio da ferramenta de agente integrada `computer`.

O agente emite um único comando uniforme, `computer.act`; ele não consegue saber como um nó o executa. Um nó macOS executa `computer.act` no próprio processo com serviços Peekaboo incorporados e primitivas restritas do CoreGraphics (permissões TCC corretas, sem processo adicional). Outras plataformas poderão executar o mesmo comando futuramente sem alterar o contrato exposto ao agente.

## Requisitos

- Um nó **macOS** emparelhado (o aplicativo OpenClaw para macOS em execução no modo de nó).
- A configuração **Permitir controle do computador** do aplicativo macOS ativada (padrão: desativada).
- Permissão **Accessibility** do macOS concedida ao OpenClaw (para injeção de eventos de ponteiro/teclado) e permissão **Screen Recording** (para `screen.snapshot`).
- O comando `computer.act` armado no Gateway (ele é perigoso e permanece desarmado por padrão).
- Um modelo de agente com capacidade de visão.
- Uma política de ferramentas que exponha `computer`. O perfil padrão `coding` não o expõe. Adicione `computer` a `tools.alsoAllow`; agentes em sandbox também precisam dele em `tools.sandbox.tools.alsoAllow`.

## A ferramenta de agente `computer`

A ferramenta integrada `computer` aceita uma ação por chamada. As coordenadas são pixels inteiros não negativos na captura de tela mais recente; o nó as converte em pontos da tela. As ações com coordenadas devem repetir o `frameId` do resultado da captura de tela, e um `screenIndex` explícito deve corresponder a esse quadro. O OpenClaw também transporta da captura de tela para a ação uma identidade de monitor emitida pelo nó; assim, uma reconexão do monitor ou alteração de geometria falha de forma segura, em vez de redirecionar silenciosamente para o mesmo índice. Essas verificações rejeitam tokens presumidos e tokens de outro quadro ou monitor entregue. Um token não garante atualidade: os aplicativos podem alterar os pixels no mesmo monitor após a captura, portanto faça uma nova captura de tela sempre que a cena puder ter mudado.

- Leitura: `screenshot`.
- Ponteiro: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (com `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Rolagem: `scroll` com `scrollDirection` (`up|down|left|right`) e `scrollAmount` (incrementos da roda).
- Teclado: `type` (texto), `key` (combinação como `cmd+shift+t` ou `Return`), `hold_key` (combinação em `text` mantida pressionada por `duration` segundos).
- Ritmo: `wait` (`duration` segundos).

As teclas modificadoras são enviadas pelo campo `text` nas ações de clique e rolagem (`shift`, `ctrl`, `alt`, `cmd`). Após uma ação de entrada, a ferramenta retorna uma nova captura de tela para que o modelo possa observar o resultado. Se houver mais de um nó com capacidade de controle do computador conectado, informe `node` explicitamente.

As capturas de tela são mantidas **somente para o modelo**: elas nunca são entregues automaticamente ao canal de chat. Trate todo o conteúdo exibido na tela como entrada não confiável; a ferramenta alerta o modelo para não seguir instruções exibidas na tela que entrem em conflito com a solicitação do usuário.

## O comando de nó `computer.act`

`computer.act` é o único comando de nó pelo qual a ferramenta encaminha entradas (`node.invoke` com `command: "computer.act"`). Ele é:

- **Perigoso por padrão**: aparece entre os comandos de nó perigosos integrados e fica excluído da lista de permissões de execução até ser armado explicitamente. Um nó macOS ainda pode declará-lo durante o emparelhamento para que a superfície seja aprovada uma única vez.
- **Exclusivo do macOS** atualmente: anunciado somente por um nó macOS que tenha **Permitir controle do computador** ativado.

As leituras reutilizam `screen.snapshot`; não há um segundo caminho de captura. Consulte [Nós de câmera e tela](/pt-BR/nodes/camera) para conhecer o comando de captura compartilhado.

## Ativar e armar

1. No aplicativo macOS, ative **Configurações → Permitir controle do computador**. Depois, abra **Configurações → Permissões** e conceda **Accessibility** e **Screen Recording** no macOS System Settings.
2. Aprove a atualização do emparelhamento no Gateway (um novo comando força um novo emparelhamento).
3. Exponha a ferramenta ao agente com capacidade de visão. Para o perfil padrão `coding`:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Agentes em sandbox também precisam desta segunda liberação:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Arme `computer.act` por um período limitado. O plugin `phone-control` expõe um grupo `computer`:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   O armamento exige `operator.admin` (ou o proprietário) e expira automaticamente. O grupo legado `/phone arm all` exclui intencionalmente o controle do desktop; use o grupo explícito `computer`. O armamento apenas alterna o que o Gateway pode invocar; o aplicativo macOS ainda aplica sua configuração **Permitir controle do computador** e as permissões do sistema operacional.

Para autorização persistente, adicione `computer.act` a `gateway.nodes.allowCommands` **e remova-o de** `gateway.nodes.denyCommands`; a lista de negação tem precedência. A autorização persistente não expira automaticamente. As entradas já presentes antes de `/phone arm` permanecem após `/phone disarm`; não converta uma concessão temporária em persistente enquanto ela estiver armada.

A autorização é deliberadamente dividida entre ativação e uso. Armar ou
configurar `computer.act` de forma persistente exige autoridade administrativa.
Depois de armado, um operador autenticado com `operator.write` pode invocar
`computer.act` por meio de `node.invoke` até que a concessão expire ou seja desarmada;
não há uma verificação administrativa por ação. Aprovar um nó que declare
`computer.act` apenas registra a superfície para que ela possa ser armada posteriormente e não
habilita a invocação por si só.

## Segurança

- Antes da autorização, todas as camadas (política de ferramentas, política de comandos do Gateway, configuração do macOS, Accessibility e Screen Recording) devem estar de acordo. Depois de armado, as ações são executadas sem confirmação por ação até a expiração ou `/phone disarm`.
- A entrada de texto é enviada um grafema por vez. Cancelamento, desconexão, pausa, desativação ou substituição do endpoint interrompe o envio antes do próximo grafema, em vez de permitir que o restante obsoleto continue.
- As capturas de tela são somente para o modelo e nunca são enviadas automaticamente ao chat (issue [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Trate o conteúdo da tela como não confiável; ele pode conter injeção de prompt.

## Relação com outros caminhos de controle do desktop

Este é o caminho controlado pelo agente. Consulte [Ponte Peekaboo](/pt-BR/platforms/mac/peekaboo) para saber como ele se relaciona com o host PeekabooBridge, o Codex Computer Use e o MCP direto `cua-driver`.
