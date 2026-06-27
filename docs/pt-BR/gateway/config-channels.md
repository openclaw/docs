---
read_when:
    - Configurando um Plugin de canal (autenticação, controle de acesso, várias contas)
    - Solução de problemas de chaves de configuração por canal
    - Auditando política de DM, política de grupo ou controle por menção
summary: 'Configuração de canais: controle de acesso, pareamento, chaves por canal em Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e mais'
title: Configuração — canais
x-i18n:
    generated_at: "2026-06-27T17:29:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

Chaves de configuração por canal em `channels.*`. Abrange acesso a DMs e grupos,
configurações com várias contas, controle por menção e chaves por canal para Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage e os outros plugins de canal incluídos.

Para agentes, ferramentas, runtime do Gateway e outras chaves de nível superior, consulte
[Referência de configuração](/pt-BR/gateway/configuration-reference).

## Canais

Cada canal inicia automaticamente quando sua seção de configuração existe (a menos que `enabled: false`).

### Acesso a DMs e grupos

Todos os canais oferecem suporte a políticas de DM e políticas de grupo:

| Política de DM      | Comportamento                                                 |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (padrão)  | Remetentes desconhecidos recebem um código de pareamento único; o proprietário deve aprovar |
| `allowlist`         | Somente remetentes em `allowFrom` (ou no armazenamento de permissões pareadas) |
| `open`              | Permite todas as DMs de entrada (requer `allowFrom: ["*"]`)   |
| `disabled`          | Ignora todas as DMs de entrada                                |

| Política de grupo     | Comportamento                                                |
| --------------------- | ------------------------------------------------------------ |
| `allowlist` (padrão)  | Somente grupos que correspondem à lista de permissões configurada |
| `open`                | Ignora listas de permissões de grupos (o controle por menção ainda se aplica) |
| `disabled`            | Bloqueia todas as mensagens de grupo/sala                    |

<Note>
`channels.defaults.groupPolicy` define o padrão quando o `groupPolicy` de um provedor não está definido.
Códigos de pareamento expiram após 1 hora. Solicitações pendentes de pareamento por DM são limitadas a **3 por canal**.
Se um bloco de provedor estiver totalmente ausente (`channels.<provider>` ausente), a política de grupo do runtime volta para `allowlist` (falha fechada) com um aviso na inicialização.
</Note>

### Substituições de modelo por canal

Use `channels.modelByChannel` para fixar IDs de canal específicos ou pares de mensagem direta a um modelo. Os valores aceitam `provider/model` ou aliases de modelo configurados. O mapeamento de canal se aplica quando uma sessão ainda não tem uma substituição de modelo (por exemplo, definida via `/model`).

Para conversas em grupo/thread, as chaves são IDs de grupo específicos do canal, IDs de tópico ou nomes de canal. Para conversas de mensagem direta (DM), as chaves são identificadores de pares derivados da identidade do remetente do canal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` ou `SenderId`). O formato exato da chave depende do canal:

| Canal    | Formato da chave de DM | Exemplo                                      |
| -------- | ---------------------- | -------------------------------------------- |
| Slack    | `user:U...`            | `user:U12345`                                |
| Telegram | ID bruto do usuário    | `123456789`                                  |
| Discord  | ID bruto do usuário    | `987654321`                                  |
| WhatsApp | número de telefone ou JID | `15551234567`                             |
| Matrix   | ID de usuário do Matrix | `@user:matrix.org`                          |
| Feishu   | `feishu:ou_...`        | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

Chaves específicas de DM só correspondem em conversas de mensagem direta; elas não afetam o roteamento de grupos/threads.

### Padrões de canal e Heartbeat

Use `channels.defaults` para comportamento compartilhado de política de grupo e Heartbeat entre provedores:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: política de grupo de fallback quando um `groupPolicy` no nível do provedor não está definido.
- `channels.defaults.contextVisibility`: modo padrão de visibilidade de contexto suplementar para todos os canais. Valores: `all` (padrão, inclui todo o contexto de citações/threads/histórico), `allowlist` (inclui apenas contexto de remetentes na lista de permissões), `allowlist_quote` (igual a allowlist, mas mantém contexto explícito de citação/resposta). Substituição por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: inclui status íntegros dos canais na saída de Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: inclui status degradados/de erro na saída de Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderiza saída de Heartbeat compacta em estilo de indicador.

### WhatsApp

O WhatsApp roda pelo canal web do Gateway (Baileys Web). Ele inicia automaticamente quando existe uma sessão vinculada.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- Entradas `bindings[]` de nível superior com `type: "acp"` configuram associações ACP persistentes para DMs e grupos do WhatsApp. Use um número direto em E.164 ou JID de grupo do WhatsApp em `match.peer.id`. A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).

<Accordion title="WhatsApp com várias contas">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Comandos de saída usam a conta `default` por padrão, se presente; caso contrário, usam o primeiro id de conta configurado (ordenado).
- O `channels.whatsapp.defaultAccount` opcional substitui essa seleção de conta padrão de fallback quando corresponde a um id de conta configurado.
- O diretório de autenticação legado do Baileys para conta única é migrado pelo `openclaw doctor` para `whatsapp/default`.
- Substituições por conta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token do bot: `channels.telegram.botToken` ou `channels.telegram.tokenFile` (somente arquivo regular; symlinks rejeitados), com `TELEGRAM_BOT_TOKEN` como fallback para a conta padrão.
- `apiRoot` é apenas a raiz da Telegram Bot API. Use `https://api.telegram.org` ou sua raiz auto-hospedada/proxy, não `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` remove um sufixo `/bot<TOKEN>` final acidental.
- O `channels.telegram.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
- Em configurações com várias contas (2+ ids de conta), defina um padrão explícito (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) para evitar roteamento de fallback; `openclaw doctor` avisa quando isso está ausente ou inválido.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Telegram (migrações de ID de supergrupo, `/config set|unset`).
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram associações ACP persistentes para tópicos de fórum (use `chatId:topic:topicId` canônico em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).
- Prévias de stream do Telegram usam `sendMessage` + `editMessageText` (funciona em chats diretos e de grupo).
- Política de repetição: consulte [Política de repetição](/pt-BR/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
        },
      },
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, com `DISCORD_BOT_TOKEN` como fallback para a conta padrão.
- Chamadas diretas de saída que fornecem um Discord `token` explícito usam esse token para a chamada; as configurações de nova tentativa/política da conta ainda vêm da conta selecionada no snapshot de runtime ativo.
- `channels.discord.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde a um id de conta configurado.
- Use `user:<id>` (DM) ou `channel:<id>` (canal de guild) para destinos de entrega; IDs numéricos simples são rejeitados.
- Slugs de guild ficam em minúsculas com espaços substituídos por `-`; chaves de canal usam o nome em formato de slug (sem `#`). Prefira IDs de guild.
- Mensagens criadas por bots são ignoradas por padrão. `allowBots: true` as habilita; use `allowBots: "mentions"` para aceitar apenas mensagens de bot que mencionem o bot (as próprias mensagens ainda são filtradas).
- Canais que aceitam mensagens de entrada criadas por bots podem usar a [proteção contra loop de bot](/pt-BR/channels/bot-loop-protection) compartilhada. Defina `channels.defaults.botLoopProtection` para orçamentos básicos de pares e substitua o canal ou a conta somente quando uma superfície precisar de limites diferentes.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e substituições por canal) descarta mensagens que mencionam outro usuário ou função, mas não o bot (excluindo @everyone/@here).
- `channels.discord.mentionAliases` mapeia texto estável de saída `@handle` para IDs de usuário do Discord antes do envio, para que colegas de equipe conhecidos possam ser mencionados de forma determinística mesmo quando o cache transitório de diretório estiver vazio. Substituições por conta ficam em `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (padrão 17) divide mensagens altas mesmo quando estão abaixo de 2000 caracteres.
- `channels.discord.suppressEmbeds` usa `true` por padrão, então URLs de saída não se expandem em prévias de links do Discord, a menos que isso seja desabilitado. Payloads `embeds` explícitos ainda são enviados normalmente; chamadas de ferramenta por mensagem podem substituir isso com `suppressEmbeds`.
- `channels.discord.threadBindings` controla o roteamento vinculado a threads do Discord:
  - `enabled`: substituição do Discord para recursos de sessão vinculados a thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e entrega/roteamento vinculados)
  - `idleHours`: substituição do Discord para auto-unfocus por inatividade em horas (`0` desabilita)
  - `maxAgeHours`: substituição do Discord para idade máxima rígida em horas (`0` desabilita)
  - `spawnSessions`: alternância para `sessions_spawn({ thread: true })` e criação/vinculação automática de thread por spawn de thread ACP (padrão: `true`)
  - `defaultSpawnContext`: contexto nativo de subagente para spawns vinculados a thread (`"fork"` por padrão)
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram vinculações ACP persistentes para canais e threads (use o id do canal/thread em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` define a cor de destaque para contêineres de componentes v2 do Discord.
- `channels.discord.agentComponents.ttlMs` controla por quanto tempo callbacks de componentes do Discord enviados permanecem registrados. O padrão é `1800000` (30 minutos), o máximo é `86400000` (24 horas), e substituições por conta ficam em `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Valores mais longos mantêm botões/seletores/formulários antigos utilizáveis por mais tempo, então prefira o TTL mais curto que se ajuste ao fluxo de trabalho.
- `channels.discord.voice` habilita conversas em canal de voz do Discord e substituições opcionais de autoentrada + LLM + TTS. Configurações do Discord somente texto deixam a voz desativada por padrão; defina `channels.discord.voice.enabled=true` para optar por usar.
- `channels.discord.voice.model` opcionalmente substitui o modelo LLM usado para respostas em canal de voz do Discord.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` são repassados para as opções DAVE de `@discordjs/voice` (`true` e `24` por padrão).
- `channels.discord.voice.connectTimeoutMs` controla a espera inicial por `Ready` do `@discordjs/voice` para tentativas de `/vc join` e autoentrada (`30000` por padrão).
- `channels.discord.voice.reconnectGraceMs` controla quanto tempo uma sessão de voz desconectada pode levar para entrar em sinalização de reconexão antes que o OpenClaw a destrua (`15000` por padrão).
- A reprodução de voz do Discord não é interrompida pelo evento de início de fala de outro usuário. Para evitar loops de feedback, o OpenClaw ignora nova captura de voz enquanto o TTS está tocando.
- O OpenClaw também tenta recuperar o recebimento de voz saindo e entrando novamente em uma sessão de voz após falhas repetidas de descriptografia.
- `channels.discord.streaming` é a chave canônica de modo de stream. O Discord usa `streaming.mode: "progress"` por padrão, para que o progresso de ferramentas/trabalho apareça em uma mensagem de prévia editada; defina `streaming.mode: "off"` para desabilitar. Valores legados `streamMode` e booleanos `streaming` permanecem aliases de runtime; execute `openclaw doctor --fix` para reescrever a configuração persistida.
- `channels.discord.autoPresence` mapeia a disponibilidade de runtime para a presença do bot (healthy => online, degraded => idle, exhausted => dnd) e permite substituições opcionais de texto de status.
- `channels.discord.dangerouslyAllowNameMatching` reabilita a correspondência mutável por nome/tag (modo de compatibilidade de emergência).
- `channels.discord.execApprovals`: entrega de aprovação de execução nativa do Discord e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, aprovações de execução são ativadas quando aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Discord autorizados a aprovar solicitações de execução. Usa `commands.ownerAllowFrom` como fallback quando omitido.
  - `agentFilter`: allowlist opcional de IDs de agente. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: para onde enviar prompts de aprovação. `"dm"` (padrão) envia para DMs dos aprovadores, `"channel"` envia para o canal de origem, `"both"` envia para ambos. Quando o destino inclui `"channel"`, os botões só podem ser usados por aprovadores resolvidos.
  - `cleanupAfterResolve`: quando `true`, exclui DMs de aprovação após aprovação, negação ou timeout.

**Modos de notificação de reação:** `off` (nenhuma), `own` (mensagens do bot, padrão), `all` (todas as mensagens), `allowlist` (de `guilds.<id>.users` em todas as mensagens).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON de conta de serviço: inline (`serviceAccount`) ou baseado em arquivo (`serviceAccountFile`).
- SecretRef de conta de serviço também é aceito (`serviceAccountRef`).
- Fallbacks de ambiente: `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Use `spaces/<spaceId>` ou `users/<userId>` para destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` reabilita a correspondência mutável por principal de e-mail (modo de compatibilidade de emergência).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      unfurlLinks: false,
      unfurlMedia: false,
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Modo Socket** exige `botToken` e `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para fallback de env da conta padrão).
- **Modo HTTP** exige `botToken` mais `signingSecret` (na raiz ou por conta).
- `socketMode` repassa o ajuste de transporte do Slack SDK Socket Mode para a API pública do receptor Bolt. Use-o somente ao investigar timeout de ping/pong ou comportamento de websocket obsoleto. `clientPingTimeout` usa `15000` por padrão; `serverPingTimeout` e `pingPongLoggingEnabled` são repassados somente quando configurados.
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings
  em texto simples ou objetos SecretRef.
- Snapshots de contas do Slack expõem campos de origem/status por credencial, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, no modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que a conta está
  configurada por meio de SecretRef, mas o caminho atual de comando/runtime não conseguiu
  resolver o valor do segredo.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Slack.
- O `channels.slack.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde a um id de conta configurado.
- `channels.slack.streaming.mode` é a chave canônica de modo de stream do Slack. `channels.slack.streaming.nativeTransport` controla o transporte de streaming nativo do Slack. Valores legados de `streamMode`, booleano `streaming` e `nativeStreaming` permanecem aliases de runtime; execute `openclaw doctor --fix` para reescrever a configuração persistida.
- `unfurlLinks` e `unfurlMedia` repassam os booleanos de prévia de links e mídia do `chat.postMessage` do Slack para respostas do bot. `unfurlLinks` usa `false` por padrão para que links de saída do bot não sejam expandidos inline, a menos que isso seja habilitado; `unfurlMedia` é omitido, a menos que seja configurado. Defina qualquer um dos valores em `channels.slack.accounts.<accountId>` para substituir o valor de nível superior para uma conta.
- Use `user:<id>` (DM) ou `channel:<id>` para destinos de entrega.

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

**Isolamento de sessão de thread:** `thread.historyScope` é por thread (padrão) ou compartilhado pelo canal. `thread.inheritParent` copia a transcrição do canal pai para novas threads.

- Streaming nativo do Slack mais o status de thread "is typing..." no estilo do assistente do Slack exigem um destino de thread de resposta. DMs de nível superior ficam fora de thread por padrão, então ainda podem transmitir por meio de prévias de rascunho com publicar e editar do Slack, em vez de mostrar a prévia de stream/status nativa no estilo de thread.
- `typingReaction` adiciona uma reação temporária à mensagem de entrada do Slack enquanto uma resposta está em execução e depois a remove na conclusão. Use um shortcode de emoji do Slack, como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega pelo cliente de aprovação nativo do Slack e autorização de aprovador de exec. Mesmo esquema do Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuários do Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` ou `"both"`). Aprovações de Plugin podem usar esse caminho de cliente nativo para solicitações originadas no Slack quando os aprovadores do Plugin Slack forem resolvidos; a entrega de aprovação de Plugin nativa do Slack também pode ser habilitada por meio de `approvals.plugin` para sessões originadas no Slack ou destinos Slack. Aprovações de Plugin usam aprovadores do Plugin Slack de `allowFrom` e roteamento padrão, não aprovadores de exec.

| Grupo de ações | Padrão    | Observações             |
| -------------- | --------- | ----------------------- |
| reações        | habilitado | Reagir + listar reações |
| mensagens      | habilitado | Ler/enviar/editar/excluir |
| pins           | habilitado | Fixar/desafixar/listar  |
| memberInfo     | habilitado | Informações de membro   |
| emojiList      | habilitado | Lista de emojis personalizados |

### Mattermost

O Mattermost é distribuído como um Plugin empacotado nas versões atuais do OpenClaw. Builds mais antigas ou
personalizadas podem instalar um pacote npm atual com
`openclaw plugins install @openclaw/mattermost`. Verifique
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
para os dist-tags atuais antes de fixar uma versão.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modos de chat: `oncall` (responder em @-menção, padrão), `onmessage` (toda mensagem), `onchar` (mensagens que começam com prefixo de gatilho).

Quando comandos nativos do Mattermost estão habilitados:

- `commands.callbackPath` deve ser um caminho (por exemplo, `/api/channels/mattermost/command`), não uma URL completa.
- `commands.callbackUrl` deve resolver para o endpoint do gateway do OpenClaw e ser acessível pelo servidor Mattermost.
- Callbacks slash nativos são autenticados com os tokens por comando retornados
  pelo Mattermost durante o registro de comandos slash. Se o registro falhar ou nenhum
  comando for ativado, o OpenClaw rejeitará callbacks com
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, o Mattermost pode exigir que
  `ServiceSettings.AllowedUntrustedInternalConnections` inclua o host/domínio de callback.
  Use valores de host/domínio, não URLs completas.
- `channels.mattermost.configWrites`: permitir ou negar gravações de configuração iniciadas pelo Mattermost.
- `channels.mattermost.requireMention`: exigir `@mention` antes de responder em canais.
- `channels.mattermost.groups.<channelId>.requireMention`: substituição por canal do bloqueio por menção (`"*"` para padrão).
- O `channels.mattermost.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde a um id de conta configurado.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

- `channels.signal.account`: fixa a inicialização do canal a uma identidade específica de conta do Signal.
- `channels.signal.configWrites`: permite ou nega gravações de configuração iniciadas pelo Signal.
- O `channels.signal.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde a um ID de conta configurado.

### iMessage

O OpenClaw inicia `imsg rpc` (JSON-RPC sobre stdio). Nenhum daemon ou porta é necessário. Esse é o caminho preferencial para novas configurações de iMessage no OpenClaw quando o host pode conceder permissões de banco de dados do Mensagens e de Automação.

O suporte ao BlueBubbles foi removido. `channels.bluebubbles` não é uma superfície de configuração de runtime compatível no OpenClaw atual. Migre configurações antigas para `channels.imessage`; use [Remoção do BlueBubbles e o caminho do iMessage com imsg](/pt-BR/announcements/bluebubbles-imessage) para a versão curta e [Vindo do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) para a tabela de tradução completa.

Se o Gateway não estiver em execução no Mac conectado ao Mensagens, mantenha `channels.imessage.enabled=true` e defina `channels.imessage.cliPath` para um wrapper SSH que execute `imsg "$@"` nesse Mac. O caminho local padrão de `imsg` é somente para macOS.

Antes de depender de um wrapper SSH para envios em produção, verifique um `imsg send` de saída por meio desse wrapper exato. Alguns estados do TCC do macOS atribuem a Automação do Mensagens a `/usr/libexec/sshd-keygen-wrapper`, o que pode fazer leituras e sondagens funcionarem enquanto envios falham com AppleEvents `-1743`; veja [Envios por wrapper SSH falham com AppleEvents -1743](/pt-BR/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- O `channels.imessage.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde a um ID de conta configurado.

- Requer Acesso Total ao Disco ao banco de dados do Mensagens.
- Prefira destinos `chat_id:<id>`. Use `imsg chats --limit 20` para listar conversas.
- `cliPath` pode apontar para um wrapper SSH; defina `remoteHost` (`host` ou `user@host`) para buscar anexos por SCP.
- `attachmentRoots` e `remoteAttachmentRoots` restringem caminhos de anexos recebidos (padrão: `/Users/*/Library/Messages/Attachments`).
- O SCP usa verificação estrita de chave de host, então garanta que a chave do host de retransmissão já exista em `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite ou nega gravações de configuração iniciadas pelo iMessage.
- `channels.imessage.sendTransport`: transporte de envio RPC `imsg` preferido para respostas normais de saída. `auto` (padrão) usa a ponte IMCore para conversas existentes quando ela está em execução, depois recorre ao AppleScript; `bridge` requer entrega por API privada; `applescript` força o caminho público de automação do Mensagens.
- `channels.imessage.actions.*`: habilita ações de API privada que também são controladas por `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` fica desativado por padrão; defina-o como `true` antes de esperar mídia recebida em turnos do agente.
- A recuperação de entradas após uma reinicialização da ponte/Gateway é automática (deduplicação por GUID mais uma barreira de idade para backlog antigo). Configurações existentes de `channels.imessage.catchup.enabled: true` ainda são respeitadas como um perfil de compatibilidade obsoleto.
- `channels.imessage.groups`: registro de grupos e configurações por grupo. Com `groupPolicy: "allowlist"`, configure chaves `chat_id` explícitas ou uma entrada curinga `"*"` para que mensagens de grupo possam passar pelo gate do registro.
- Entradas de nível superior `bindings[]` com `type: "acp"` podem vincular conversas do iMessage a sessões ACP persistentes. Use um identificador normalizado ou um destino de conversa explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica dos campos compartilhados: [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Exemplo de wrapper SSH do iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix é respaldado por Plugin e configurado em `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- A autenticação por token usa `accessToken`; a autenticação por senha usa `userId` + `password`.
- `channels.matrix.proxy` roteia o tráfego HTTP do Matrix por meio de um proxy HTTP(S) explícito. Contas nomeadas podem substituí-lo com `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` e essa adesão de rede são controles independentes.
- `channels.matrix.defaultAccount` seleciona a conta preferencial em configurações com várias contas.
- `channels.matrix.autoJoin` tem `off` como padrão, então salas com convite e novos convites no estilo DM são ignorados até você definir `autoJoin: "allowlist"` com `autoJoinAllowlist` ou `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega de aprovações de execução nativa do Matrix e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, aprovações de execução são ativadas quando os aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Matrix (por exemplo, `@owner:example.org`) autorizados a aprovar solicitações de execução.
  - `agentFilter`: lista de permissões opcional de IDs de agentes. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: para onde enviar prompts de aprovação. `"dm"` (padrão), `"channel"` (sala de origem) ou `"both"`.
  - Substituições por conta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla como DMs do Matrix são agrupadas em sessões: `per-user` (padrão) compartilha por par roteado, enquanto `per-room` isola cada sala de DM.
- Sondagens de status do Matrix e consultas ao diretório em tempo real usam a mesma política de proxy que o tráfego de runtime.
- A configuração completa do Matrix, regras de direcionamento e exemplos de configuração estão documentados em [Matrix](/pt-BR/channels/matrix).

### Microsoft Teams

Microsoft Teams é apoiado por Plugin e configurado em `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, políticas de equipe/canal:
      // consulte /channels/msteams
    },
  },
}
```

- Caminhos de chave principais cobertos aqui: `channels.msteams`, `channels.msteams.configWrites`.
- A configuração completa do Teams (credenciais, webhook, política de DM/grupo, substituições por equipe/por canal) está documentada em [Microsoft Teams](/pt-BR/channels/msteams).

### IRC

IRC é apoiado por Plugin e configurado em `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Caminhos de chave principais cobertos aqui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- O `channels.irc.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
- A configuração completa do canal IRC (host/porta/TLS/canais/listas de permissões/bloqueio por menção) está documentada em [IRC](/pt-BR/channels/irc).

### Várias contas (todos os canais)

Execute várias contas por canal (cada uma com seu próprio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` é usado quando `accountId` é omitido (CLI + roteamento).
- Tokens de env se aplicam apenas à conta **default**.
- Configurações básicas do canal se aplicam a todas as contas, a menos que sejam substituídas por conta.
- Use `bindings[].match.accountId` para rotear cada conta para um agente diferente.
- Se você adicionar uma conta não padrão via `openclaw channels add` (ou onboarding de canal) enquanto ainda estiver em uma configuração de canal de nível superior com conta única, o OpenClaw promove primeiro valores de conta única de nível superior com escopo de conta para o mapa de contas do canal, para que a conta original continue funcionando. A maioria dos canais os move para `channels.<channel>.accounts.default`; Matrix pode preservar um destino nomeado/padrão correspondente existente em vez disso.
- Bindings existentes apenas de canal (sem `accountId`) continuam correspondendo à conta padrão; bindings com escopo de conta permanecem opcionais.
- `openclaw doctor --fix` também repara formatos mistos movendo valores de conta única de nível superior com escopo de conta para a conta promovida escolhida para esse canal. A maioria dos canais usa `accounts.default`; Matrix pode preservar um destino nomeado/padrão correspondente existente em vez disso.

### Outros canais de Plugin

Muitos canais de Plugin são configurados como `channels.<id>` e documentados em suas páginas de canal dedicadas (por exemplo, Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Veja o índice completo de canais: [Canais](/pt-BR/channels).

### Bloqueio de menções em chat de grupo

Mensagens de grupo têm como padrão **exigir menção** (menção de metadados ou padrões regex seguros). Aplica-se a chats de grupo do WhatsApp, Telegram, Discord, Google Chat e iMessage.

Respostas visíveis são controladas separadamente. Solicitações normais diretas de grupo, canal e WebChat interno têm como padrão a entrega final automática: o texto final do assistente é publicado pelo caminho legado de resposta visível. Opte por `messages.visibleReplies: "message_tool"` ou `messages.groupChat.visibleReplies: "message_tool"` quando a saída visível só deve ser publicada depois que o agente chamar `message(action=send)`. Se o modelo retornar texto final sem chamar a ferramenta de mensagem em um modo somente ferramenta ativado, esse texto final permanece privado e o log detalhado do gateway registra metadados de payload suprimido.

Respostas visíveis somente por ferramenta exigem um modelo/runtime que chame ferramentas de forma confiável e são recomendadas para salas ambientes compartilhadas em modelos de geração mais recente, como GPT 5.5. Alguns modelos mais fracos conseguem responder com texto final, mas não entendem que a saída visível na origem deve ser enviada com `message(action=send)`. Para esses modelos, use `"automatic"` para que o turno final do assistente seja o caminho de resposta visível. Se o log da sessão mostrar texto do assistente com `didSendViaMessagingTool: false`, o modelo produziu texto final privado em vez de chamar a ferramenta de mensagem. Mude para um modelo mais forte em chamada de ferramentas para esse canal, inspecione o log detalhado do gateway para ver o resumo do payload suprimido ou defina `messages.groupChat.visibleReplies: "automatic"` para usar respostas finais visíveis para toda solicitação de grupo/canal.

Se a ferramenta de mensagem estiver indisponível sob a política de ferramentas ativa, o OpenClaw recorre a respostas visíveis automáticas em vez de suprimir silenciosamente a resposta. `openclaw doctor` avisa sobre essa incompatibilidade.

Esta regra se aplica ao texto final normal do agente. Bindings de conversa pertencentes a Plugins usam a resposta retornada pelo Plugin proprietário como a resposta visível para turnos de thread vinculada reivindicados; o Plugin não precisa chamar `message(action=send)` para essas respostas de binding.

**Solução de problemas: @menção de grupo aciona digitação e depois silêncio (sem erro)**

Sintoma: uma @menção de grupo/canal mostra o indicador de digitação e o log do gateway relata `dispatch complete (queuedFinal=false, replies=0)`, mas nenhuma mensagem chega à sala. DMs para o mesmo agente respondem normalmente.

Causa: o modo de resposta visível de grupo/canal resolve para `"message_tool"`, então o OpenClaw executa o turno, mas suprime o texto final do assistente, a menos que o agente chame `message(action=send)`. Não há contrato `NO_REPLY` nesse modo; sem chamada da ferramenta de mensagem significa sem resposta na origem. Não há erro porque a supressão é o comportamento configurado. Turnos normais de grupo e canal têm `"automatic"` como padrão, então esse sintoma só aparece quando `messages.groupChat.visibleReplies` (ou `messages.visibleReplies` global) está explicitamente definido como `"message_tool"`. O `defaultVisibleReplies` do harness não se aplica aqui — o resolvedor de grupo/canal o ignora; ele afeta apenas chats diretos/de origem (o harness do Codex suprime finais de chat direto dessa forma).

Correção: escolha um modelo mais forte em chamada de ferramentas, remova a substituição explícita `"message_tool"` para voltar ao padrão `"automatic"` ou defina `messages.groupChat.visibleReplies: "automatic"` para forçar respostas visíveis para toda solicitação de grupo/canal. O gateway recarrega a configuração de `messages` sem reiniciar depois que o arquivo é salvo; reinicie o gateway somente quando o monitoramento de arquivos ou o recarregamento de configuração estiver desativado na implantação.

**Tipos de menção:**

- **Menções de metadados**: @menções nativas da plataforma. Ignoradas no modo de autochat do WhatsApp.
- **Padrões de texto**: padrões regex seguros em `agents.list[].groupChat.mentionPatterns`. Padrões inválidos e repetição aninhada insegura são ignorados.
- O bloqueio por menção é aplicado somente quando a detecção é possível (menções nativas ou pelo menos um padrão).

```json5
{
  messages: {
    visibleReplies: "automatic", // força respostas finais automáticas antigas para chats diretos/de origem
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // conversas não mencionadas de sala sempre ativas viram contexto silencioso
      visibleReplies: "message_tool", // adesão; exige message(action=send) para respostas visíveis na sala
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` define o padrão global. Canais podem substituir com `channels.<channel>.historyLimit` (ou por conta). Defina `0` para desativar.

`messages.groupChat.unmentionedInbound: "room_event"` envia mensagens não mencionadas de grupo/canal sempre ativas como contexto silencioso de sala em canais compatíveis. Mensagens mencionadas, comandos e mensagens diretas continuam sendo solicitações do usuário. Veja [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events) para exemplos completos de Discord, Slack e Telegram.

`messages.visibleReplies` é o padrão global de evento de origem; `messages.groupChat.visibleReplies` o substitui para eventos de origem de grupo/canal. Quando `messages.visibleReplies` não está definido, chats diretos/de origem usam o padrão selecionado de runtime ou harness, mas turnos diretos do WebChat interno usam entrega final automática para paridade de prompt Pi/Codex. Defina `messages.visibleReplies: "message_tool"` para exigir intencionalmente `message(action=send)` para saída visível. Listas de permissões de canal e bloqueio por menção ainda decidem se um evento é processado.

#### Limites de histórico de DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Resolução: substituição por DM → padrão do provedor → sem limite (tudo retido).

Compatível com: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de autochat

Inclua seu próprio número em `allowFrom` para habilitar o modo de autochat (ignora @menções nativas, responde apenas a padrões de texto):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Comandos (tratamento de comandos de chat)

```json5
{
  commands: {
    native: "auto", // registra comandos nativos quando compatível
    nativeSkills: "auto", // registra comandos nativos de Skills quando compatível
    text: true, // analisa /commands em mensagens de chat
    bash: false, // permite ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permite /config
    mcp: false, // permite /mcp
    plugins: false, // permite /plugins
    debug: false, // permite /debug
    restart: true, // permite /restart + ferramenta de reinício do gateway
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Detalhes dos comandos">

- Este bloco configura superfícies de comando. Para o catálogo atual de comandos integrados + agrupados, consulte [Comandos de barra](/pt-BR/tools/slash-commands).
- Esta página é uma **referência de chaves de configuração**, não o catálogo completo de comandos. Comandos pertencentes a canais/plugins, como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, pareamento de dispositivo `/pair`, memória `/dreaming`, controle de telefone `/phone` e Talk `/voice`, são documentados nas páginas dos respectivos canais/plugins e em [Comandos de barra](/pt-BR/tools/slash-commands).
- Comandos de texto devem ser mensagens **independentes** com `/` inicial.
- `native: "auto"` ativa comandos nativos para Discord/Telegram e mantém Slack desativado.
- `nativeSkills: "auto"` ativa comandos nativos de Skills para Discord/Telegram e mantém Slack desativado.
- Substituir por canal: `channels.discord.commands.native` (bool ou `"auto"`). Para Discord, `false` ignora o registro e a limpeza de comandos nativos durante a inicialização.
- Substitua o registro de Skills nativas por canal com `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` adiciona entradas extras ao menu do bot do Telegram.
- `bash: true` habilita `! <cmd>` para o shell do host. Requer `tools.elevated.enabled` e remetente em `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lê/grava `openclaw.json`). Para clientes `chat.send` do Gateway, gravações persistentes de `/config set|unset` também exigem `operator.admin`; `/config show` somente leitura continua disponível para clientes operadores normais com escopo de escrita.
- `mcp: true` habilita `/mcp` para configuração de servidor MCP gerenciado pelo OpenClaw em `mcp.servers`.
- `plugins: true` habilita `/plugins` para descoberta, instalação e controles de ativação/desativação de plugins.
- `channels.<provider>.configWrites` controla mutações de configuração por canal (padrão: true).
- Para canais com várias contas, `channels.<provider>.accounts.<id>.configWrites` também controla gravações que direcionam essa conta (por exemplo, `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desabilita `/restart` e ações de ferramenta de reinicialização do Gateway. Padrão: `true`.
- `ownerAllowFrom` é a allowlist explícita de proprietários para comandos somente de proprietário e ações de canal controladas por proprietário. Ela é separada de `allowFrom`.
- `ownerDisplay: "hash"` gera hashes dos ids de proprietário no prompt do sistema. Defina `ownerDisplaySecret` para controlar o hashing.
- `allowFrom` é por provedor. Quando definido, é a **única** fonte de autorização (allowlists/pareamento de canais e `useAccessGroups` são ignorados).
- `useAccessGroups: false` permite que comandos ignorem políticas de grupo de acesso quando `allowFrom` não está definido.
- Mapa da documentação de comandos:
  - catálogo integrado + agrupado: [Comandos de barra](/pt-BR/tools/slash-commands)
  - superfícies de comando específicas de canais: [Canais](/pt-BR/channels)
  - comandos do QQ Bot: [QQ Bot](/pt-BR/channels/qqbot)
  - comandos de pareamento: [Pareamento](/pt-BR/channels/pairing)
  - comando de cartão do LINE: [LINE](/pt-BR/channels/line)
  - Dreaming de memória: [Dreaming](/pt-BR/concepts/dreaming)

</Accordion>

---

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — chaves de nível superior
- [Configuração — agentes](/pt-BR/gateway/config-agents)
- [Visão geral de canais](/pt-BR/channels)
