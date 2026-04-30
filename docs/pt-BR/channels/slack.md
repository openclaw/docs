---
read_when:
    - Configurando o Slack ou depurando o modo socket/HTTP do Slack
summary: Configuração do Slack e comportamento em tempo de execução (Socket Mode + URLs de solicitação HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T16:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

Pronto para produção para DMs e canais por meio de integrações de app do Slack. O modo padrão é o Socket Mode; HTTP Request URLs também são compatíveis.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    DMs do Slack usam o modo de pareamento por padrão.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Nas configurações do app do Slack, pressione o botão **[Create New App](https://api.slack.com/apps/new)**:

        - escolha **from a manifest** e selecione um workspace para seu app
        - cole o [manifesto de exemplo](#manifest-and-scope-checklist) abaixo e continue para criar
        - gere um **App-Level Token** (`xapp-...`) com `connections:write`
        - instale o app e copie o **Bot Token** (`xoxb-...`) exibido

      </Step>

      <Step title="Configure OpenClaw">

        Configuração SecretRef recomendada:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Fallback por env (somente conta padrão):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        Nas configurações do app do Slack, pressione o botão **[Create New App](https://api.slack.com/apps/new)**:

        - escolha **from a manifest** e selecione um workspace para seu app
        - cole o [manifesto de exemplo](#manifest-and-scope-checklist) e atualize as URLs antes de criar
        - salve o **Signing Secret** para verificação de requisições
        - instale o app e copie o **Bot Token** (`xoxb-...`) exibido

      </Step>

      <Step title="Configure OpenClaw">

        Configuração SecretRef recomendada:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Use caminhos de webhook exclusivos para HTTP com várias contas

        Dê a cada conta um `webhookPath` distinto (padrão `/slack/events`) para que os registros não entrem em conflito.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ajuste do transporte do Socket Mode

O OpenClaw define o tempo limite de pong do cliente SDK do Slack como 15 segundos por padrão para Socket Mode. Substitua as configurações de transporte somente quando precisar de ajustes específicos de workspace ou host:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Use isto somente para workspaces em Socket Mode que registrem tempos limite de pong/server-ping de websocket do Slack ou executem em hosts com inanição conhecida do event loop. `clientPingTimeout` é a espera pelo pong depois que o SDK envia um ping do cliente; `serverPingTimeout` é a espera pelos pings do servidor Slack. Mensagens e eventos do app continuam sendo estado da aplicação, não sinais de vivacidade do transporte.

## Checklist de manifesto e escopos

O manifesto base do app do Slack é o mesmo para Socket Mode e HTTP Request URLs. Somente o bloco `settings` (e a `url` do comando de barra) difere.

Manifesto base (padrão de Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
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

Para o modo **HTTP Request URLs**, substitua `settings` pela variante HTTP e adicione `url` a cada comando de barra. URL pública obrigatória:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Configurações adicionais do manifesto

Exponha recursos diferentes que estendem os padrões acima.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Vários [comandos de barra nativos](#commands-and-slash-behavior) podem ser usados em vez de um único comando configurado, com nuances:

    - Use `/agentstatus` em vez de `/status`, porque o comando `/status` é reservado.
    - No máximo 25 comandos de barra podem ficar disponíveis de uma vez.

    Substitua sua seção `features.slash_commands` existente por um subconjunto dos [comandos disponíveis](/pt-BR/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Use a mesma lista de `slash_commands` do Socket Mode acima e adicione `"url": "https://gateway-host.example.com/slack/events"` a cada entrada. Exemplo:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    Adicione o escopo de bot `chat:write.customize` se quiser que as mensagens de saída usem a identidade do agente ativo (nome de usuário e ícone personalizados) em vez da identidade padrão do app do Slack.

    Se você usar um ícone de emoji, o Slack espera a sintaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    Se você configurar `channels.slack.userToken`, os escopos típicos de leitura são:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se você depende de leituras de pesquisa do Slack)

  </Accordion>
</AccordionGroup>

## Modelo de tokens

- `botToken` + `appToken` são obrigatórios para o Modo Socket.
- O modo HTTP exige `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings em texto puro
  ou objetos SecretRef.
- Tokens de configuração substituem o fallback de env.
- O fallback de env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica apenas à conta padrão.
- `userToken` (`xoxp-...`) é somente por configuração (sem fallback de env) e usa comportamento somente leitura por padrão (`userTokenReadOnly: true`).

Comportamento do snapshot de status:

- A inspeção de conta do Slack rastreia campos `*Source` e `*Status` por credencial
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- O status é `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` significa que a conta está configurada por SecretRef
  ou outra fonte de segredo não inline, mas o caminho atual de comando/runtime
  não conseguiu resolver o valor real.
- No modo HTTP, `signingSecretStatus` é incluído; no Modo Socket, o
  par obrigatório é `botTokenStatus` + `appTokenStatus`.

<Tip>
Para ações/leituras de diretório, o token de usuário pode ser preferido quando configurado. Para gravações, o token do bot continua sendo preferido; gravações com token de usuário só são permitidas quando `userTokenReadOnly: false` e o token do bot está indisponível.
</Tip>

## Ações e gates

As ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ações disponíveis nas ferramentas atuais do Slack:

| Grupo      | Padrão |
| ---------- | ------ |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

As ações atuais de mensagem do Slack incluem `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`. `download-file` aceita IDs de arquivo do Slack exibidos em placeholders de arquivo de entrada e retorna prévias de imagem para imagens ou metadados de arquivo local para outros tipos de arquivo.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla o acesso por DM. `channels.slack.allowFrom` é a allowlist canônica de DM.

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.slack.allowFrom` inclua `"*"`)
    - `disabled`

    Flags de DM:

    - `dm.enabled` (padrão true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (DMs em grupo padrão false)
    - `dm.groupChannels` (allowlist opcional de MPIM)

    Precedência de várias contas:

    - `channels.slack.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` legados ainda são lidos para compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando consegue fazer isso sem alterar o acesso.

    O pareamento em DMs usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canais">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A allowlist de canais fica em `channels.slack.channels` e **deve usar IDs estáveis de canal do Slack** (por exemplo `C12345678`) como chaves de configuração.

    Nota de runtime: se `channels.slack` estiver completamente ausente (configuração somente por env), o runtime usa fallback para `groupPolicy="allowlist"` e registra um aviso (mesmo se `channels.defaults.groupPolicy` estiver definido).

    Resolução de nome/ID:

    - entradas da allowlist de canais e entradas da allowlist de DM são resolvidas na inicialização quando o acesso do token permite
    - entradas de nome de canal não resolvidas são mantidas conforme configuradas, mas ignoradas para roteamento por padrão
    - autorização de entrada e roteamento de canais usam ID primeiro por padrão; correspondência direta por nome de usuário/slug exige `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Chaves baseadas em nome (`#channel-name` ou `channel-name`) **não** correspondem em `groupPolicy: "allowlist"`. A busca de canal usa ID primeiro por padrão, então uma chave baseada em nome nunca será roteada com sucesso e todas as mensagens nesse canal serão bloqueadas silenciosamente. Isso difere de `groupPolicy: "open"`, em que a chave do canal não é necessária para roteamento e uma chave baseada em nome parece funcionar.

    Sempre use o ID do canal do Slack como chave. Para encontrá-lo: clique com o botão direito no canal no Slack → **Copiar link** — o ID (`C...`) aparece no fim da URL.

    Correto:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Incorreto (bloqueado silenciosamente em `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Menções e usuários de canal">
    Mensagens de canal exigem menção por padrão.

    Fontes de menção:

    - menção explícita ao app (`<@botId>`)
    - padrões regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta em thread ao bot (desativado quando `thread.requireExplicitMention` é `true`)

    Controles por canal (`channels.slack.channels.<id>`; nomes somente por resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato da chave `toolsBySender`: `id:`, `e164:`, `username:`, `name:` ou curinga `"*"`
      (chaves legadas sem prefixo ainda mapeiam apenas para `id:`)

    `allowBots` é conservador para canais e canais privados: mensagens de sala criadas por bot são aceitas somente quando o bot remetente está explicitamente listado na allowlist `users` dessa sala, ou quando pelo menos um ID explícito de proprietário do Slack vindo de `channels.slack.allowFrom` é atualmente membro da sala. Curingas e entradas de proprietário por nome de exibição não satisfazem a presença do proprietário. A presença do proprietário usa `conversations.members` do Slack; garanta que o app tenha o escopo de leitura correspondente ao tipo de sala (`channels:read` para canais públicos, `groups:read` para canais privados). Se a busca de membros falhar, o OpenClaw descarta a mensagem de sala criada por bot.

  </Tab>
</Tabs>

## Threads, sessões e tags de resposta

- DMs são roteadas como `direct`; canais como `channel`; MPIMs como `group`.
- Com o padrão `session.dmScope=main`, DMs do Slack convergem para a sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Respostas em thread podem criar sufixos de sessão de thread (`:thread:<threadTs>`) quando aplicável.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens de thread existentes são buscadas quando uma nova sessão de thread começa (padrão `20`; defina `0` para desativar).
- `channels.slack.thread.requireExplicitMention` (padrão `false`): quando `true`, suprime menções implícitas em thread para que o bot responda somente a menções explícitas `@bot` dentro de threads, mesmo quando o bot já participou da thread. Sem isso, respostas em uma thread com participação do bot ignoram o gate de `requireMention`.

Controles de encadeamento de respostas:

- `channels.slack.replyToMode`: `off|first|all|batched` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para chats diretos: `channels.slack.dm.replyToMode`

Tags manuais de resposta são compatíveis:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` desativa **todo** encadeamento de respostas no Slack, incluindo tags explícitas `[[reply_to_*]]`. Isso difere do Telegram, em que tags explícitas ainda são respeitadas no modo `"off"`. Threads do Slack ocultam mensagens do canal, enquanto respostas do Telegram permanecem visíveis inline.
</Note>

## Reações de confirmação

`ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem de entrada.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback de emoji da identidade do agente (`agents.list[].identity.emoji`, senão "👀")

Notas:

- O Slack espera shortcodes (por exemplo `"eyes"`).
- Use `""` para desativar a reação para a conta do Slack ou globalmente.

## Streaming de texto

`channels.slack.streaming` controla o comportamento de prévia ao vivo:

- `off`: desativa streaming de prévia ao vivo.
- `partial` (padrão): substitui o texto de prévia pela saída parcial mais recente.
- `block`: anexa atualizações de prévia em chunks.
- `progress`: mostra texto de status de progresso durante a geração e depois envia o texto final.
- `streaming.preview.toolProgress`: quando a prévia de rascunho está ativa, roteia atualizações de ferramenta/progresso para a mesma mensagem de prévia editada (padrão: `true`). Defina `false` para manter mensagens separadas de ferramenta/progresso.

`channels.slack.streaming.nativeTransport` controla o streaming de texto nativo do Slack quando `channels.slack.streaming.mode` é `partial` (padrão: `true`).

- Uma thread de resposta deve estar disponível para que o streaming de texto nativo e o status de thread do assistente do Slack apareçam. A seleção de thread ainda segue `replyToMode`.
- Raízes de canal e chat em grupo ainda podem usar a prévia de rascunho normal quando o streaming nativo está indisponível.
- DMs de nível superior do Slack permanecem fora de thread por padrão, então não mostram a prévia em estilo de thread; use respostas em thread ou `typingReaction` se quiser progresso visível ali.
- Payloads de mídia e não texto usam fallback para entrega normal.
- Finais de mídia/erro cancelam edições de prévia pendentes; finais elegíveis de texto/bloco só são descarregados quando conseguem editar a prévia no local.
- Se o streaming falhar no meio da resposta, o OpenClaw usa fallback para entrega normal dos payloads restantes.

Use prévia de rascunho em vez de streaming de texto nativo do Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Chaves legadas:

- `channels.slack.streamMode` (`replace | status_final | append`) é migrado automaticamente para `channels.slack.streaming.mode`.
- booleano `channels.slack.streaming` é migrado automaticamente para `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` legado é migrado automaticamente para `channels.slack.streaming.nativeTransport`.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem de entrada do Slack enquanto o OpenClaw está processando uma resposta, e a remove quando a execução termina. Isso é mais útil fora de respostas em thread, que usam um indicador de status padrão "is typing...".

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- O Slack espera shortcodes (por exemplo `"hourglass_flowing_sand"`).
- A reação é best-effort, e a limpeza é tentada automaticamente depois que o caminho de resposta ou falha é concluído.

## Mídia, chunking e entrega

<AccordionGroup>
  <Accordion title="Anexos de entrada">
    Anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de solicitação autenticada por token) e gravados no armazenamento de mídia quando a busca tem sucesso e os limites de tamanho permitem. Placeholders de arquivo incluem o `fileId` do Slack para que agentes possam buscar o arquivo original com `download-file`.

    Downloads usam timeouts limitados de inatividade e total. Se a recuperação do arquivo do Slack travar ou falhar, o OpenClaw continua processando a mensagem e usa fallback para o placeholder de arquivo.

    O limite de tamanho de entrada em runtime é `20MB` por padrão, salvo se substituído por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto e arquivos de saída">
    - blocos de texto usam `channels.slack.textChunkLimit` (padrão 4000)
    - `channels.slack.chunkMode="newline"` habilita a divisão priorizando parágrafos
    - envios de arquivos usam as APIs de upload do Slack e podem incluir respostas em thread (`thread_ts`)
    - o limite de mídia de saída segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, envios de canal usam os padrões por tipo MIME do pipeline de mídia

  </Accordion>

  <Accordion title="Alvos de entrega">
    Alvos explícitos preferidos:

    - `user:<id>` para DMs
    - `channel:<id>` para canais

    DMs do Slack são abertas por meio das APIs de conversa do Slack ao enviar para alvos de usuário.

  </Accordion>
</AccordionGroup>

## Comandos e comportamento de slash

Comandos slash aparecem no Slack como um único comando configurado ou como vários comandos nativos. Configure `channels.slack.slashCommand` para alterar os padrões de comando:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Comandos nativos exigem [configurações adicionais de manifesto](#additional-manifest-settings) no seu app Slack e, em vez disso, são habilitados com `channels.slack.commands.native: true` ou `commands.native: true` em configurações globais.

- O modo automático de comando nativo está **desativado** para Slack, portanto `commands.native: "auto"` não habilita comandos nativos do Slack.

```txt
/help
```

Menus de argumentos nativos usam uma estratégia de renderização adaptativa que mostra um modal de confirmação antes de despachar o valor de uma opção selecionada:

- até 5 opções: blocos de botão
- 6-100 opções: menu de seleção estático
- mais de 100 opções: seleção externa com filtragem assíncrona de opções quando handlers de opções de interatividade estão disponíveis
- limites do Slack excedidos: valores de opção codificados voltam a usar botões

```txt
/think
```

Sessões slash usam chaves isoladas como `agent:<agentId>:slack:slash:<userId>` e ainda roteiam execuções de comandos para a sessão da conversa de destino usando `CommandTargetSessionKey`.

## Respostas interativas

O Slack pode renderizar controles de resposta interativa criados pelo agente, mas esse recurso é desabilitado por padrão.

Habilite globalmente:

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

Ou habilite somente para uma conta Slack:

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

Quando habilitado, agentes podem emitir diretivas de resposta exclusivas do Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Essas diretivas são compiladas para Slack Block Kit e roteiam cliques ou seleções de volta pelo caminho de evento de interação do Slack existente.

Observações:

- Esta é uma interface de usuário específica do Slack. Outros canais não traduzem diretivas do Slack Block Kit para seus próprios sistemas de botões.
- Os valores de callback interativo são tokens opacos gerados pelo OpenClaw, não valores brutos criados pelo agente.
- Se blocos interativos gerados excederem os limites do Slack Block Kit, o OpenClaw volta para a resposta de texto original em vez de enviar uma carga de blocos inválida.

## Aprovações de exec no Slack

O Slack pode atuar como um cliente de aprovação nativo com botões interativos e interações, em vez de voltar para a interface Web ou o terminal.

- Aprovações de exec usam `channels.slack.execApprovals.*` para roteamento nativo de DM/canal.
- Aprovações de Plugin ainda podem ser resolvidas pela mesma superfície de botões nativa do Slack quando a solicitação já chega ao Slack e o tipo do id de aprovação é `plugin:`.
- A autorização do aprovador ainda é aplicada: somente usuários identificados como aprovadores podem aprovar ou negar solicitações pelo Slack.

Isso usa a mesma superfície compartilhada de botões de aprovação que outros canais. Quando `interactivity` está habilitado nas configurações do seu app Slack, prompts de aprovação são renderizados como botões do Block Kit diretamente na conversa.
Quando esses botões estão presentes, eles são a UX de aprovação principal; o OpenClaw
só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser que aprovações
por chat estão indisponíveis ou a aprovação manual é o único caminho.

Caminho de configuração:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recai para `commands.ownerAllowFrom` quando possível)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `agentFilter`, `sessionFilter`

O Slack habilita automaticamente aprovações de exec nativas quando `enabled` não está definido ou é `"auto"` e pelo menos um
aprovador é resolvido. Defina `enabled: false` para desabilitar explicitamente o Slack como cliente de aprovação nativo.
Defina `enabled: true` para forçar aprovações nativas quando aprovadores forem resolvidos.

Comportamento padrão sem configuração explícita de aprovação de exec do Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Configuração explícita nativa do Slack só é necessária quando você quer substituir aprovadores, adicionar filtros ou
aderir à entrega no chat de origem:

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

O encaminhamento compartilhado de `approvals.exec` é separado. Use-o somente quando prompts de aprovação de exec também precisarem
rotear para outros chats ou alvos explícitos fora de banda. O encaminhamento compartilhado de `approvals.plugin` também é
separado; botões nativos do Slack ainda podem resolver aprovações de Plugin quando essas solicitações já chegam
ao Slack.

`/approve` no mesmo chat também funciona em canais e DMs do Slack que já oferecem suporte a comandos. Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals) para ver o modelo completo de encaminhamento de aprovação.

## Eventos e comportamento operacional

- Edições/exclusões de mensagens são mapeadas para eventos do sistema.
- Transmissões de thread ("Também enviar para o canal" em respostas de thread) são processadas como mensagens de usuário normais.
- Eventos de adicionar/remover reação são mapeados para eventos do sistema.
- Eventos de entrada/saída de membro, canal criado/renomeado e adicionar/remover fixação são mapeados para eventos do sistema.
- `channel_id_changed` pode migrar chaves de configuração de canal quando `configWrites` está habilitado.
- Metadados de tópico/propósito do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- O contexto inicial de início de thread e histórico inicial da thread é filtrado por allowlists de remetentes configuradas quando aplicável.
- Ações de bloco e interações modais emitem eventos de sistema estruturados `Slack interaction: ...` com campos de payload ricos:
  - ações de bloco: valores selecionados, rótulos, valores de seletor e metadados `workflow_*`
  - eventos modais `view_submission` e `view_closed` com metadados de canal roteados e entradas de formulário

## Referência de configuração

Referência principal: [Referência de configuração - Slack](/pt-BR/gateway/config-channels#slack).

<Accordion title="Campos Slack de alto sinal">

- modo/autenticação: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acesso a DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- alternância de compatibilidade: `dangerouslyAllowNameMatching` (quebra-vidro; mantenha desativado, a menos que seja necessário)
- acesso a canal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- encadeamento/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operações/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas em canais">
    Verifique, na ordem:

    - `groupPolicy`
    - allowlist de canais (`channels.slack.channels`) — **as chaves devem ser IDs de canal** (`C12345678`), não nomes (`#channel-name`). Chaves baseadas em nome falham silenciosamente sob `groupPolicy: "allowlist"` porque o roteamento de canal prioriza IDs por padrão. Para encontrar um ID: clique com o botão direito no canal no Slack → **Copiar link** — o valor `C...` no fim da URL é o ID do canal.
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
    - `channels.slack.dmPolicy` (ou o legado `channels.slack.dm.policy`)
    - aprovações de pareamento / entradas de allowlist
    - eventos de DM do Slack Assistant: logs detalhados mencionando `drop message_changed`
      geralmente significam que o Slack enviou um evento de thread do Assistant editado sem um
      remetente humano recuperável nos metadados da mensagem

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode não conecta">
    Valide os tokens de bot + app e a habilitação do Socket Mode nas configurações do app Slack.

    Se `openclaw channels status --probe --json` mostrar `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, a conta Slack está
    configurada, mas o runtime atual não conseguiu resolver o valor
    baseado em SecretRef.

  </Accordion>

  <Accordion title="Modo HTTP não recebe eventos">
    Valide:

    - signing secret
    - caminho de Webhook
    - URLs de solicitação do Slack (eventos + interatividade + comandos slash)
    - `webhookPath` único por conta HTTP

    Se `signingSecretStatus: "configured_unavailable"` aparecer em snapshots de conta,
    a conta HTTP está configurada, mas o runtime atual não conseguiu
    resolver o signing secret baseado em SecretRef.

  </Accordion>

  <Accordion title="Comandos nativos/slash não disparam">
    Verifique se você pretendia usar:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos slash correspondentes registrados no Slack
    - ou modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Verifique também `commands.useAccessGroups` e allowlists de canal/usuário.

  </Accordion>
</AccordionGroup>

## Referência de visão de anexos

O Slack pode anexar mídia baixada ao turno do agente quando downloads de arquivos do Slack são bem-sucedidos e os limites de tamanho permitem. Arquivos de imagem podem passar pelo caminho de entendimento de mídia ou diretamente para um modelo de resposta com capacidade de visão; outros arquivos são mantidos como contexto de arquivo baixável em vez de serem tratados como entrada de imagem.

### Tipos de mídia compatíveis

| Tipo de mídia                  | Origem               | Comportamento atual                                                              | Observações                                                               |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Imagens JPEG / PNG / GIF / WebP | URL de arquivo Slack | Baixadas e anexadas ao turno para tratamento com capacidade de visão             | Limite por arquivo: `channels.slack.mediaMaxMb` (padrão 20 MB)            |
| Arquivos PDF                   | URL de arquivo Slack | Baixados e expostos como contexto de arquivo para ferramentas como `download-file` ou `pdf` | A entrada do Slack não converte PDFs automaticamente em entrada de visão de imagem |
| Outros arquivos                | URL de arquivo Slack | Baixados quando possível e expostos como contexto de arquivo                     | Arquivos binários não são tratados como entrada de imagem                 |
| Respostas em thread            | Arquivos do início da thread | Arquivos da mensagem raiz podem ser hidratados como contexto quando a resposta não tem mídia direta | Inícios somente com arquivo usam um placeholder de anexo                  |
| Mensagens com várias imagens   | Vários arquivos Slack | Cada arquivo é avaliado independentemente                                        | O processamento do Slack é limitado a oito arquivos por mensagem          |

### Pipeline de entrada

Quando uma mensagem do Slack com anexos de arquivo chega:

1. O OpenClaw baixa o arquivo da URL privada do Slack usando o token do bot (`xoxb-...`).
2. O arquivo é gravado no armazenamento de mídia em caso de sucesso.
3. Os caminhos de mídia baixada e os tipos de conteúdo são adicionados ao contexto de entrada.
4. Caminhos de modelo/ferramenta com suporte a imagens podem usar anexos de imagem desse contexto.
5. Arquivos que não são imagens permanecem disponíveis como metadados de arquivo ou referências de mídia para ferramentas capazes de lidar com eles.

### Herança de anexos da raiz da thread

Quando uma mensagem chega em uma thread (tem um pai `thread_ts`):

- Se a própria resposta não tiver mídia direta e a mensagem raiz incluída tiver arquivos, o Slack pode hidratar os arquivos da raiz como contexto inicial da thread.
- Anexos diretos da resposta têm precedência sobre anexos da mensagem raiz.
- Uma mensagem raiz que tem apenas arquivos e nenhum texto é representada com um placeholder de anexo para que o fallback ainda possa incluir seus arquivos.

### Tratamento de múltiplos anexos

Quando uma única mensagem do Slack contém vários anexos de arquivo:

- Cada anexo é processado independentemente pelo pipeline de mídia.
- As referências de mídia baixada são agregadas ao contexto da mensagem.
- A ordem de processamento segue a ordem dos arquivos do Slack no payload do evento.
- Uma falha no download de um anexo não bloqueia os outros.

### Limites de tamanho, download e modelo

- **Limite de tamanho**: padrão de 20 MB por arquivo. Configurável via `channels.slack.mediaMaxMb`.
- **Falhas de download**: arquivos que o Slack não consegue servir, URLs expiradas, arquivos inacessíveis, arquivos grandes demais e respostas HTML de autenticação/login do Slack são ignorados em vez de serem reportados como formatos sem suporte.
- **Modelo de visão**: a análise de imagens usa o modelo de resposta ativo quando ele oferece suporte a visão, ou o modelo de imagem configurado em `agents.defaults.imageModel`.

### Limites conhecidos

| Cenário                                  | Comportamento atual                                                               | Solução alternativa                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de arquivo do Slack expirada         | Arquivo ignorado; nenhum erro exibido                                             | Reenvie o arquivo no Slack                                                 |
| Modelo de visão não configurado          | Anexos de imagem são armazenados como referências de mídia, mas não analisados como imagens | Configure `agents.defaults.imageModel` ou use um modelo de resposta com suporte a visão |
| Imagens muito grandes (> 20 MB por padrão) | Ignoradas conforme o limite de tamanho                                            | Aumente `channels.slack.mediaMaxMb` se o Slack permitir                    |
| Anexos encaminhados/compartilhados       | Texto e mídia de imagem/arquivo hospedada no Slack são tratados em melhor esforço | Compartilhe novamente diretamente na thread do OpenClaw                    |
| Anexos PDF                               | Armazenados como contexto de arquivo/mídia, não roteados automaticamente pela visão de imagem | Use `download-file` para metadados de arquivo ou a ferramenta `pdf` para análise de PDF |

### Documentação relacionada

- [Pipeline de compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Ferramenta de PDF](/pt-BR/tools/pdf)
- Épico: [#51349](https://github.com/openclaw/openclaw/issues/51349) — ativação de visão para anexos do Slack
- Testes de regressão: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verificação ao vivo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Relacionados

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    Emparelhe um usuário do Slack ao gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pt-BR/channels/groups">
    Comportamento de canais e DMs em grupo.
  </Card>
  <Card title="Channel routing" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Security" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e hardening.
  </Card>
  <Card title="Configuration" icon="sliders" href="/pt-BR/gateway/configuration">
    Layout e precedência da configuração.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pt-BR/tools/slash-commands">
    Catálogo e comportamento de comandos.
  </Card>
</CardGroup>
