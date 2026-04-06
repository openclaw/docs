---
read_when:
    - Ao configurar o Slack ou depurar o modo socket/HTTP do Slack
summary: Configuração e comportamento em tempo de execução do Slack (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-06T03:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e4ff2ce7d92276d62f4f3d3693ddb56ca163d5fdc2f1082ff7ba3421fada69c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: pronto para produção para DMs + canais por meio de integrações de app do Slack. O modo padrão é Socket Mode; o modo HTTP Events API também é compatível.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As DMs do Slack usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e guias de correção.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Socket Mode (padrão)">
    <Steps>
      <Step title="Criar app e tokens do Slack">
        Nas configurações do app do Slack:

        - habilite o **Socket Mode**
        - crie o **App Token** (`xapp-...`) com `connections:write`
        - instale o app e copie o **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Configurar o OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Fallback por variável de ambiente (somente conta padrão):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Inscrever eventos do app">
        Inscreva eventos de bot para:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Habilite também a **Messages Tab** do App Home para DMs.
      </Step>

      <Step title="Iniciar o gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Modo HTTP Events API">
    <Steps>
      <Step title="Configurar o app do Slack para HTTP">

        - defina o modo como HTTP (`channels.slack.mode="http"`)
        - copie o **Signing Secret** do Slack
        - defina a URL de requisição para Event Subscriptions + Interactivity + comando Slash no mesmo caminho de webhook (padrão `/slack/events`)

      </Step>

      <Step title="Configurar o modo HTTP do OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="Usar caminhos de webhook exclusivos para várias contas HTTP">
        O modo HTTP por conta é compatível.

        Dê a cada conta um `webhookPath` distinto para que os registros não entrem em conflito.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Checklist de manifesto e escopos

<AccordionGroup>
  <Accordion title="Exemplo de manifesto de app do Slack" defaultOpen>

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="Escopos opcionais de token de usuário (operações de leitura)">
    Se você configurar `channels.slack.userToken`, os escopos de leitura típicos são:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se você depende de leituras de pesquisa do Slack)

  </Accordion>
</AccordionGroup>

## Modelo de token

- `botToken` + `appToken` são obrigatórios para Socket Mode.
- O modo HTTP exige `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings em texto simples
  ou objetos SecretRef.
- Tokens da configuração substituem o fallback de variável de ambiente.
- O fallback por variável de ambiente `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` aplica-se apenas à conta padrão.
- `userToken` (`xoxp-...`) é somente de configuração (sem fallback por variável de ambiente) e usa comportamento somente leitura por padrão (`userTokenReadOnly: true`).
- Opcional: adicione `chat:write.customize` se quiser que as mensagens de saída usem a identidade do agente ativo (com `username` e ícone personalizados). `icon_emoji` usa a sintaxe `:emoji_name:`.

Comportamento do snapshot de status:

- A inspeção da conta Slack rastreia campos `*Source` e `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- O status é `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` significa que a conta está configurada via SecretRef
  ou outra origem de segredo não inline, mas o caminho atual de comando/tempo de execução
  não conseguiu resolver o valor real.
- No modo HTTP, `signingSecretStatus` é incluído; no Socket Mode, o
  par obrigatório é `botTokenStatus` + `appTokenStatus`.

<Tip>
Para ações/leituras de diretório, o token de usuário pode ter preferência quando configurado. Para gravações, o token de bot continua sendo o preferido; gravações com token de usuário só são permitidas quando `userTokenReadOnly: false` e o token de bot não está disponível.
</Tip>

## Ações e controles

As ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ações disponíveis nas ferramentas atuais do Slack:

| Grupo      | Padrão |
| ---------- | ------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

As ações atuais de mensagem do Slack incluem `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla o acesso por DM (legado: `channels.slack.dm.policy`):

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.slack.allowFrom` inclua `"*"`; legado: `channels.slack.dm.allowFrom`)
    - `disabled`

    Sinalizadores de DM:

    - `dm.enabled` (padrão true)
    - `channels.slack.allowFrom` (preferido)
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (DMs em grupo usam false por padrão)
    - `dm.groupChannels` (allowlist opcional de MPIM)

    Precedência de várias contas:

    - `channels.slack.accounts.default.allowFrom` aplica-se apenas à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    O pareamento em DMs usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canal">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A allowlist de canais fica em `channels.slack.channels` e deve usar IDs de canal estáveis.

    Observação de tempo de execução: se `channels.slack` estiver totalmente ausente (configuração somente por env), o tempo de execução usa `groupPolicy="allowlist"` como fallback e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Resolução de nome/ID:

    - entradas da allowlist de canais e da allowlist de DM são resolvidas na inicialização quando o acesso por token permite
    - entradas não resolvidas por nome de canal são mantidas como configuradas, mas ignoradas para roteamento por padrão
    - a autorização de entrada e o roteamento de canais usam ID primeiro por padrão; correspondência direta por nome de usuário/slug exige `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menções e usuários de canal">
    As mensagens em canais são bloqueadas por menção por padrão.

    Origens de menção:

    - menção explícita ao app (`<@botId>`)
    - padrões regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta em thread para o bot

    Controles por canal (`channels.slack.channels.<id>`; nomes apenas por resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato da chave `toolsBySender`: `id:`, `e164:`, `username:`, `name:` ou curinga `"*"`
      (chaves legadas sem prefixo ainda são mapeadas apenas para `id:`)

  </Tab>
</Tabs>

## Threads, sessões e tags de resposta

- DMs são roteadas como `direct`; canais como `channel`; MPIMs como `group`.
- Com o padrão `session.dmScope=main`, as DMs do Slack são recolhidas na sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Respostas em thread podem criar sufixos de sessão de thread (`:thread:<threadTs>`) quando aplicável.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens existentes na thread são buscadas quando uma nova sessão de thread começa (padrão `20`; defina `0` para desabilitar).

Controles de threading de resposta:

- `channels.slack.replyToMode`: `off|first|all|batched` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para chats diretos: `channels.slack.dm.replyToMode`

Há suporte para tags manuais de resposta:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Observação: `replyToMode="off"` desabilita **todo** o threading de resposta no Slack, inclusive tags explícitas `[[reply_to_*]]`. Isso difere do Telegram, em que tags explícitas ainda são respeitadas no modo `"off"`. A diferença reflete os modelos de thread das plataformas: threads do Slack ocultam mensagens do canal, enquanto respostas do Telegram continuam visíveis no fluxo principal do chat.

## Reações de confirmação

`ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem de entrada.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback para emoji da identidade do agente (`agents.list[].identity.emoji`, senão "👀")

Observações:

- O Slack espera shortcodes (por exemplo `"eyes"`).
- Use `""` para desabilitar a reação para a conta Slack ou globalmente.

## Streaming de texto

`channels.slack.streaming` controla o comportamento de visualização ao vivo:

- `off`: desabilita o streaming de visualização ao vivo.
- `partial` (padrão): substitui o texto de visualização pela saída parcial mais recente.
- `block`: acrescenta atualizações de visualização em blocos.
- `progress`: mostra texto de status de progresso durante a geração e depois envia o texto final.

`channels.slack.nativeStreaming` controla o streaming nativo de texto do Slack quando `streaming` é `partial` (padrão: `true`).

- Uma thread de resposta precisa estar disponível para que o streaming nativo de texto apareça. A seleção da thread ainda segue `replyToMode`. Sem isso, a visualização normal de rascunho é usada.
- Mídia e cargas não textuais usam entrega normal como fallback.
- Se o streaming falhar no meio da resposta, o OpenClaw usa a entrega normal como fallback para as cargas restantes.

Use a visualização de rascunho em vez do streaming nativo de texto do Slack:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Chaves legadas:

- `channels.slack.streamMode` (`replace | status_final | append`) é migrado automaticamente para `channels.slack.streaming`.
- `channels.slack.streaming` booleano é migrado automaticamente para `channels.slack.nativeStreaming`.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem recebida no Slack enquanto o OpenClaw processa uma resposta e a remove quando a execução termina. Isso é mais útil fora de respostas em thread, que usam um indicador padrão de status "está digitando...".

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Observações:

- O Slack espera shortcodes (por exemplo `"hourglass_flowing_sand"`).
- A reação é best-effort, e a limpeza é tentada automaticamente após a resposta ou a conclusão do caminho de falha.

## Mídia, fragmentação e entrega

<AccordionGroup>
  <Accordion title="Anexos recebidos">
    Anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de requisição autenticada por token) e gravados no armazenamento de mídia quando a busca é bem-sucedida e os limites de tamanho permitem.

    O limite padrão de tamanho de entrada em tempo de execução é `20MB`, a menos que seja substituído por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto e arquivos de saída">
    - fragmentos de texto usam `channels.slack.textChunkLimit` (padrão 4000)
    - `channels.slack.chunkMode="newline"` habilita divisão priorizando parágrafos
    - envios de arquivo usam as APIs de upload do Slack e podem incluir respostas em thread (`thread_ts`)
    - o limite de mídia de saída segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, os envios de canal usam padrões por tipo MIME do pipeline de mídia
  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para DMs
    - `channel:<id>` para canais

    As DMs do Slack são abertas por meio das APIs de conversa do Slack ao enviar para destinos de usuário.

  </Accordion>
</AccordionGroup>

## Comandos e comportamento de slash

- O modo automático de comandos nativos está **desativado** para o Slack (`commands.native: "auto"` não habilita comandos nativos do Slack).
- Habilite os manipuladores nativos de comando do Slack com `channels.slack.commands.native: true` (ou global `commands.native: true`).
- Quando os comandos nativos estão habilitados, registre comandos slash correspondentes no Slack (nomes `/<command>`), com uma exceção:
  - registre `/agentstatus` para o comando de status (o Slack reserva `/status`)
- Se os comandos nativos não estiverem habilitados, você poderá executar um único comando slash configurado via `channels.slack.slashCommand`.
- Os menus nativos de argumentos agora adaptam a estratégia de renderização:
  - até 5 opções: blocos de botões
  - de 6 a 100 opções: menu de seleção estático
  - mais de 100 opções: seleção externa com filtragem assíncrona de opções quando os handlers de opções de interatividade estão disponíveis
  - se os valores codificados das opções excederem os limites do Slack, o fluxo usa botões como fallback
- Para cargas longas de opções, os menus de argumentos de comando slash usam uma caixa de diálogo de confirmação antes de despachar um valor selecionado.

Configurações padrão de comando slash:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Sessões slash usam chaves isoladas:

- `agent:<agentId>:slack:slash:<userId>`

e ainda roteiam a execução do comando em relação à sessão da conversa de destino (`CommandTargetSessionKey`).

## Respostas interativas

O Slack pode renderizar controles interativos de resposta criados por agentes, mas esse recurso está desabilitado por padrão.

Habilite-o globalmente:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Ou habilite-o para apenas uma conta Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Quando habilitado, os agentes podem emitir diretivas de resposta exclusivas do Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Essas diretivas são compiladas em Slack Block Kit e encaminham cliques ou seleções de volta pelo caminho existente de evento de interação do Slack.

Observações:

- Esta é uma UI específica do Slack. Outros canais não traduzem diretivas do Slack Block Kit para seus próprios sistemas de botões.
- Os valores de callback interativos são tokens opacos gerados pelo OpenClaw, não valores brutos criados pelo agente.
- Se os blocos interativos gerados excederem os limites do Slack Block Kit, o OpenClaw usa a resposta de texto original como fallback em vez de enviar uma carga de blocos inválida.

## Aprovações de execução no Slack

O Slack pode atuar como um cliente nativo de aprovação com botões interativos e interações, em vez de usar a Web UI ou o terminal como fallback.

- Aprovações de execução usam `channels.slack.execApprovals.*` para roteamento nativo em DM/canal.
- Aprovações de plugin ainda podem ser resolvidas pela mesma superfície nativa de botões do Slack quando a solicitação já chega ao Slack e o tipo de id de aprovação é `plugin:`.
- A autorização do aprovador continua sendo aplicada: apenas usuários identificados como aprovadores podem aprovar ou negar solicitações pelo Slack.

Isso usa a mesma superfície compartilhada de botões de aprovação que outros canais. Quando `interactivity` está habilitado nas configurações do app do Slack, os prompts de aprovação são renderizados como botões Block Kit diretamente na conversa.
Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
deve incluir um comando manual `/approve` apenas quando o resultado da ferramenta disser que aprovações por chat
não estão disponíveis ou a aprovação manual for o único caminho.

Caminho de configuração:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; usa `commands.ownerAllowFrom` como fallback quando possível)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `agentFilter`, `sessionFilter`

O Slack habilita automaticamente aprovações nativas de execução quando `enabled` não está definido ou é `"auto"` e pelo menos um
aprovador é resolvido. Defina `enabled: false` para desabilitar explicitamente o Slack como cliente nativo de aprovação.
Defina `enabled: true` para forçar aprovações nativas quando aprovadores forem resolvidos.

Comportamento padrão sem configuração explícita de aprovação de execução do Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

A configuração nativa explícita do Slack só é necessária quando você quiser substituir aprovadores, adicionar filtros ou
optar pela entrega no chat de origem:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

O encaminhamento compartilhado `approvals.exec` é separado. Use-o apenas quando prompts de aprovação de execução também precisarem
ser roteados para outros chats ou destinos explícitos fora de banda. O encaminhamento compartilhado `approvals.plugin` também é
separado; botões nativos do Slack ainda podem resolver aprovações de plugin quando essas solicitações já chegam
ao Slack.

`/approve` no mesmo chat também funciona em canais e DMs do Slack que já oferecem suporte a comandos. Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals) para o modelo completo de encaminhamento de aprovações.

## Eventos e comportamento operacional

- Edições/exclusões de mensagens e broadcasts de thread são mapeados para eventos de sistema.
- Eventos de adicionar/remover reação são mapeados para eventos de sistema.
- Eventos de entrada/saída de membros, criação/renomeação de canal e adicionar/remover pin são mapeados para eventos de sistema.
- `channel_id_changed` pode migrar chaves de configuração de canal quando `configWrites` está habilitado.
- Metadados de tópico/finalidade do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- O iniciador da thread e a semeadura inicial do contexto do histórico da thread são filtrados pelas allowlists de remetente configuradas quando aplicável.
- Ações de bloco e interações de modal emitem eventos de sistema estruturados `Slack interaction: ...` com campos ricos de payload:
  - ações de bloco: valores selecionados, rótulos, valores de seletor e metadados `workflow_*`
  - eventos de modal `view_submission` e `view_closed` com metadados de canal roteados e entradas de formulário

## Ponteiros para a referência de configuração

Referência principal:

- [Referência de configuração - Slack](/pt-BR/gateway/configuration-reference#slack)

  Campos de alto sinal do Slack:
  - modo/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - acesso por DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - alternância de compatibilidade: `dangerouslyAllowNameMatching` (quebra-galho; mantenha desativado, a menos que seja necessário)
  - acesso a canais: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - operações/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas em canais">
    Verifique, nesta ordem:

    - `groupPolicy`
    - allowlist de canais (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` por canal

    Comandos úteis:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Mensagens de DM ignoradas">
    Verifique:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou legado `channels.slack.dm.policy`)
    - aprovações de pareamento / entradas de allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode não conecta">
    Valide os tokens de bot + app e a habilitação do Socket Mode nas configurações do app do Slack.

    Se `openclaw channels status --probe --json` mostrar `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, a conta Slack está
    configurada, mas o tempo de execução atual não conseguiu resolver o valor
    respaldado por SecretRef.

  </Accordion>

  <Accordion title="Modo HTTP não recebe eventos">
    Valide:

    - signing secret
    - caminho do webhook
    - URLs de requisição do Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` exclusivo por conta HTTP

    Se `signingSecretStatus: "configured_unavailable"` aparecer nos snapshots
    de conta, a conta HTTP está configurada, mas o tempo de execução atual não conseguiu
    resolver o signing secret respaldado por SecretRef.

  </Accordion>

  <Accordion title="Comandos nativos/slash não disparam">
    Verifique se sua intenção era:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos slash correspondentes registrados no Slack
    - ou modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Verifique também `commands.useAccessGroups` e as allowlists de canal/usuário.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Segurança](/pt-BR/gateway/security)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Solução de problemas](/pt-BR/channels/troubleshooting)
- [Configuração](/pt-BR/gateway/configuration)
- [Comandos slash](/pt-BR/tools/slash-commands)
