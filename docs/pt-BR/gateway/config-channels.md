---
read_when:
    - Configurando um plugin de canal (autenticação, controle de acesso, várias contas)
    - Solução de problemas das chaves de configuração por canal
    - Auditoria de política de DM, política de grupo ou controle de menções
summary: 'Configuração de canais: controle de acesso, pareamento e chaves por canal para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros'
title: Configuração — canais
x-i18n:
    generated_at: "2026-05-07T13:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10ff37f804fe3a2443372c4b195c00a4ee427ebd4c602bfb13e5040bddfaab93
    source_path: gateway/config-channels.md
    workflow: 16
---

Configuração por canal em `channels.*`. Abrange acesso por DM e grupos,
configurações de múltiplas contas, controle por menção e chaves por canal para Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage e os outros plugins de canal incluídos.

Para agentes, ferramentas, runtime do Gateway e outras chaves de nível superior, consulte
[Referência de configuração](/pt-BR/gateway/configuration-reference).

## Canais

Cada canal inicia automaticamente quando sua seção de configuração existe (a menos que `enabled: false`).

### Acesso por DM e grupo

Todos os canais oferecem suporte a políticas de DM e políticas de grupo:

| Política de DM      | Comportamento                                                 |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (padrão)  | Remetentes desconhecidos recebem um código de pareamento único; o proprietário deve aprovar |
| `allowlist`         | Apenas remetentes em `allowFrom` (ou no armazenamento de permissões pareadas) |
| `open`              | Permite todas as DMs de entrada (requer `allowFrom: ["*"]`)   |
| `disabled`          | Ignora todas as DMs de entrada                                |

| Política de grupo       | Comportamento                                           |
| ----------------------- | ------------------------------------------------------- |
| `allowlist` (padrão)    | Apenas grupos que correspondem à lista de permissões configurada |
| `open`                  | Ignora listas de permissões de grupo (o controle por menção ainda se aplica) |
| `disabled`              | Bloqueia todas as mensagens de grupo/sala               |

<Note>
`channels.defaults.groupPolicy` define o padrão quando o `groupPolicy` de um provedor não está definido.
Os códigos de pareamento expiram após 1 hora. Solicitações pendentes de pareamento por DM são limitadas a **3 por canal**.
Se um bloco de provedor estiver totalmente ausente (`channels.<provider>` ausente), a política de grupo em runtime volta para `allowlist` (falha fechada) com um aviso na inicialização.
</Note>

### Substituições de modelo por canal

Use `channels.modelByChannel` para fixar IDs de canal específicos a um modelo. Os valores aceitam `provider/model` ou aliases de modelo configurados. O mapeamento de canal se aplica quando uma sessão ainda não tem uma substituição de modelo (por exemplo, definida via `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

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
- `channels.defaults.contextVisibility`: modo padrão de visibilidade de contexto suplementar para todos os canais. Valores: `all` (padrão, inclui todo contexto citado/thread/histórico), `allowlist` (inclui apenas contexto de remetentes na lista de permissões), `allowlist_quote` (igual a allowlist, mas mantém contexto explícito de citação/resposta). Substituição por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: inclui status íntegros de canais na saída de Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: inclui status degradados/com erro na saída de Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderiza saída compacta de Heartbeat no estilo de indicador.

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

<Accordion title="WhatsApp com múltiplas contas">

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

- Comandos de saída usam por padrão a conta `default`, se presente; caso contrário, o primeiro id de conta configurado (ordenado).
- O opcional `channels.whatsapp.defaultAccount` substitui essa seleção de conta padrão de fallback quando corresponde a um id de conta configurado.
- O diretório legado de autenticação Baileys de conta única é migrado pelo `openclaw doctor` para `whatsapp/default`.
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
- O opcional `channels.telegram.defaultAccount` substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
- Em configurações de múltiplas contas (2+ ids de conta), defina um padrão explícito (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) para evitar roteamento de fallback; `openclaw doctor` avisa quando isso está ausente ou inválido.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Telegram (migrações de ID de supergrupo, `/config set|unset`).
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram vinculações ACP persistentes para tópicos de fórum (use o formato canônico `chatId:topic:topicId` em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).
- Pré-visualizações de stream do Telegram usam `sendMessage` + `editMessageText` (funciona em conversas diretas e em grupos).
- Política de nova tentativa: consulte [Política de nova tentativa](/pt-BR/concepts/retry).

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
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
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
- Chamadas diretas de saída que fornecem um `token` do Discord explícito usam esse token para a chamada; as configurações de tentativa/política da conta ainda vêm da conta selecionada no snapshot de runtime ativo.
- O `channels.discord.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde a um id de conta configurado.
- Use `user:<id>` (DM) ou `channel:<id>` (canal de guilda) para destinos de entrega; IDs numéricos sem prefixo são rejeitados.
- Slugs de guilda ficam em minúsculas com espaços substituídos por `-`; chaves de canal usam o nome com slug (sem `#`). Prefira IDs de guilda.
- Mensagens de autoria de bots são ignoradas por padrão. `allowBots: true` as habilita; use `allowBots: "mentions"` para aceitar apenas mensagens de bots que mencionem o bot (as próprias mensagens ainda são filtradas).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e substituições de canal) descarta mensagens que mencionam outro usuário ou cargo, mas não o bot (excluindo @everyone/@here).
- `channels.discord.mentionAliases` mapeia texto `@handle` estável de saída para IDs de usuário do Discord antes do envio, para que colegas de equipe conhecidos possam ser mencionados de forma determinística mesmo quando o cache de diretório transitório estiver vazio. Substituições por conta ficam em `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (padrão 17) divide mensagens altas mesmo quando têm menos de 2000 caracteres.
- `channels.discord.threadBindings` controla o roteamento vinculado a threads do Discord:
  - `enabled`: substituição do Discord para recursos de sessão vinculada a thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e entrega/roteamento vinculados)
  - `idleHours`: substituição do Discord para auto-desfoco por inatividade em horas (`0` desabilita)
  - `maxAgeHours`: substituição do Discord para idade máxima rígida em horas (`0` desabilita)
  - `spawnSessions`: alternador para `sessions_spawn({ thread: true })` e criação/vinculação automática de thread em spawn de thread ACP (padrão: `true`)
  - `defaultSpawnContext`: contexto nativo de subagente para spawns vinculados a thread (`"fork"` por padrão)
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram vinculações ACP persistentes para canais e threads (use o id de canal/thread em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` define a cor de destaque para contêineres de componentes v2 do Discord.
- `channels.discord.voice` habilita conversas em canais de voz do Discord e substituições opcionais de entrada automática + LLM + TTS. Configurações do Discord somente texto deixam voz desativada por padrão; defina `channels.discord.voice.enabled=true` para optar por ativar.
- `channels.discord.voice.model` opcionalmente substitui o modelo LLM usado para respostas em canais de voz do Discord.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` são repassados para as opções DAVE de `@discordjs/voice` (`true` e `24` por padrão).
- `channels.discord.voice.connectTimeoutMs` controla a espera inicial por Ready do `@discordjs/voice` para `/vc join` e tentativas de entrada automática (`30000` por padrão).
- `channels.discord.voice.reconnectGraceMs` controla quanto tempo uma sessão de voz desconectada pode levar para entrar em sinalização de reconexão antes que o OpenClaw a destrua (`15000` por padrão).
- A reprodução de voz do Discord não é interrompida pelo evento de início de fala de outro usuário. Para evitar loops de feedback, o OpenClaw ignora nova captura de voz enquanto o TTS está sendo reproduzido.
- O OpenClaw também tenta recuperar o recebimento de voz saindo/entrando novamente em uma sessão de voz após falhas repetidas de descriptografia.
- `channels.discord.streaming` é a chave canônica do modo de stream. O Discord usa `streaming.mode: "progress"` por padrão, para que o progresso de ferramentas/trabalho apareça em uma mensagem de prévia editada; defina `streaming.mode: "off"` para desabilitar. Valores legados de `streamMode` e `streaming` booleano permanecem como aliases de runtime; execute `openclaw doctor --fix` para reescrever a configuração persistida.
- `channels.discord.autoPresence` mapeia a disponibilidade de runtime para a presença do bot (healthy => online, degraded => idle, exhausted => dnd) e permite substituições opcionais de texto de status.
- `channels.discord.dangerouslyAllowNameMatching` reabilita correspondência mutável por nome/tag (modo de compatibilidade de emergência).
- `channels.discord.execApprovals`: entrega de aprovação de exec nativa do Discord e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, aprovações de exec são ativadas quando aprovadores podem ser resolvidos de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Discord autorizados a aprovar solicitações de exec. Usa `commands.ownerAllowFrom` como fallback quando omitido.
  - `agentFilter`: allowlist opcional de IDs de agente. Omita para encaminhar aprovações de todos os agentes.
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
- SecretRef de conta de serviço também é compatível (`serviceAccountRef`).
- Fallbacks de env: `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Use `spaces/<spaceId>` ou `users/<userId>` para destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` reabilita correspondência mutável de principal de e-mail (modo de compatibilidade de emergência).

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
- `socketMode` repassa ajustes de transporte do Socket Mode do SDK Slack para a API pública do receptor Bolt. Use apenas ao investigar timeout de ping/pong ou comportamento obsoleto de websocket.
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings de texto simples ou objetos SecretRef.
- Snapshots de conta do Slack expõem campos de origem/status por credencial, como `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, no modo HTTP, `signingSecretStatus`. `configured_unavailable` significa que a conta está configurada por SecretRef, mas o caminho atual de comando/runtime não conseguiu resolver o valor do segredo.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Slack.
- O `channels.slack.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde a um id de conta configurado.
- `channels.slack.streaming.mode` é a chave canônica do modo de stream do Slack. `channels.slack.streaming.nativeTransport` controla o transporte de streaming nativo do Slack. Valores legados de `streamMode`, `streaming` booleano e `nativeStreaming` permanecem como aliases de runtime; execute `openclaw doctor --fix` para reescrever a configuração persistida.
- Use `user:<id>` (DM) ou `channel:<id>` para destinos de entrega.

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

**Isolamento de sessão de thread:** `thread.historyScope` é por thread (padrão) ou compartilhado pelo canal. `thread.inheritParent` copia a transcrição do canal pai para novas threads.

- O streaming nativo do Slack mais o status de thread "is typing..." no estilo de assistente do Slack exigem um destino de thread de resposta. DMs de nível superior ficam fora de threads por padrão, então ainda podem transmitir por meio de prévias de rascunho publicar-e-editar do Slack em vez de mostrar a prévia nativa de stream/status no estilo de thread.
- `typingReaction` adiciona uma reação temporária à mensagem de entrada do Slack enquanto uma resposta está em andamento e a remove ao concluir. Use um shortcode de emoji do Slack, como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega de aprovação de exec nativa do Slack e autorização de aprovadores. Mesmo esquema do Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuário do Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` ou `"both"`).

| Grupo de ações | Padrão   | Observações               |
| -------------- | -------- | ------------------------- |
| reactions      | habilitado | Reagir + listar reações   |
| messages       | habilitado | Ler/enviar/editar/excluir |
| pins           | habilitado | Fixar/desafixar/listar    |
| memberInfo     | habilitado | Informações do membro     |
| emojiList      | habilitado | Lista de emojis personalizados |

### Mattermost

O Mattermost é distribuído como um Plugin integrado nas versões atuais do OpenClaw. Builds mais antigos ou personalizados podem instalar um pacote npm atual com `openclaw plugins install @openclaw/mattermost`. Verifique [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) para os dist-tags atuais antes de fixar uma versão.

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

Modos de chat: `oncall` (responde a @-menção, padrão), `onmessage` (toda mensagem), `onchar` (mensagens que começam com o prefixo acionador).

Quando comandos nativos do Mattermost estão habilitados:

- `commands.callbackPath` deve ser um caminho (por exemplo `/api/channels/mattermost/command`), não uma URL completa.
- `commands.callbackUrl` deve resolver para o endpoint do Gateway do OpenClaw e estar acessível a partir do servidor Mattermost.
- Callbacks slash nativos são autenticados com os tokens por comando retornados
  pelo Mattermost durante o registro de comandos slash. Se o registro falhar ou nenhum
  comando for ativado, o OpenClaw rejeita callbacks com
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, o Mattermost pode exigir que
  `ServiceSettings.AllowedUntrustedInternalConnections` inclua o host/domínio de callback.
  Use valores de host/domínio, não URLs completas.
- `channels.mattermost.configWrites`: permite ou nega gravações de configuração iniciadas pelo Mattermost.
- `channels.mattermost.requireMention`: exige `@mention` antes de responder em canais.
- `channels.mattermost.groups.<channelId>.requireMention`: substituição por canal para bloqueio por menção (`"*"` como padrão).
- `channels.mattermost.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.

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

- `channels.signal.account`: fixa a inicialização do canal a uma identidade de conta específica do Signal.
- `channels.signal.configWrites`: permite ou nega gravações de configuração iniciadas pelo Signal.
- `channels.signal.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.

### BlueBubbles

BlueBubbles é a ponte legada do iMessage (baseada em Plugin, configurada em `channels.bluebubbles`). Configurações existentes continuam com suporte, mas novas implantações do iMessage no OpenClaw devem preferir `channels.imessage` quando `imsg` puder ser executado no host do Messages.

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Principais caminhos de chave cobertos aqui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas do BlueBubbles a sessões ACP persistentes. Use um identificador do BlueBubbles ou uma string de destino (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica de campos compartilhados: [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).
- A configuração completa do canal BlueBubbles e a justificativa de descontinuação estão documentadas em [BlueBubbles](/pt-BR/channels/bluebubbles).

### iMessage

O OpenClaw inicia `imsg rpc` (JSON-RPC sobre stdio). Nenhum daemon ou porta é necessário. Este é o caminho preferido para novas configurações do iMessage no OpenClaw quando o host pode conceder permissões de banco de dados do Messages e Automação.

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
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.

- Exige Acesso Total ao Disco para o banco de dados do Messages.
- Prefira destinos `chat_id:<id>`. Use `imsg chats --limit 20` para listar chats.
- `cliPath` pode apontar para um wrapper SSH; defina `remoteHost` (`host` ou `user@host`) para buscar anexos por SCP.
- `attachmentRoots` e `remoteAttachmentRoots` restringem caminhos de anexos recebidos (padrão: `/Users/*/Library/Messages/Attachments`).
- SCP usa verificação estrita de chave de host, então garanta que a chave do host de retransmissão já exista em `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite ou nega gravações de configuração iniciadas pelo iMessage.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas do iMessage a sessões ACP persistentes. Use um identificador normalizado ou destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica de campos compartilhados: [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Exemplo de wrapper SSH do iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix é baseado em Plugin e configurado em `channels.matrix`.

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
- `channels.matrix.proxy` roteia o tráfego HTTP do Matrix por um proxy HTTP(S) explícito. Contas nomeadas podem substituí-lo com `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` e esta opção de rede são controles independentes.
- `channels.matrix.defaultAccount` seleciona a conta preferida em configurações com várias contas.
- `channels.matrix.autoJoin` usa `off` por padrão, então salas convidadas e novos convites no estilo DM são ignorados até você definir `autoJoin: "allowlist"` com `autoJoinAllowlist` ou `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega de aprovação de exec nativa do Matrix e autorização de aprovador.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, aprovações de exec são ativadas quando aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário Matrix (por exemplo, `@owner:example.org`) autorizados a aprovar solicitações de exec.
  - `agentFilter`: lista de permissões opcional de IDs de agente. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: para onde enviar prompts de aprovação. `"dm"` (padrão), `"channel"` (sala de origem) ou `"both"`.
  - Substituições por conta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla como DMs do Matrix são agrupadas em sessões: `per-user` (padrão) compartilha por par roteado, enquanto `per-room` isola cada sala de DM.
- Sondagens de status do Matrix e consultas ao diretório em tempo real usam a mesma política de proxy do tráfego em runtime.
- A configuração completa do Matrix, regras de direcionamento e exemplos de configuração estão documentados em [Matrix](/pt-BR/channels/matrix).

### Microsoft Teams

Microsoft Teams é baseado em Plugin e configurado em `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Principais caminhos de chave cobertos aqui: `channels.msteams`, `channels.msteams.configWrites`.
- A configuração completa do Teams (credenciais, Webhook, política de DM/grupo, substituições por equipe/por canal) está documentada em [Microsoft Teams](/pt-BR/channels/msteams).

### IRC

IRC é baseado em Plugin e configurado em `channels.irc`.

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

- Principais caminhos de chave cobertos aqui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opcional substitui a seleção de conta padrão quando corresponde a um id de conta configurado.
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
- Tokens de ambiente se aplicam apenas à conta **padrão**.
- Configurações base do canal se aplicam a todas as contas, a menos que sejam substituídas por conta.
- Use `bindings[].match.accountId` para rotear cada conta para um agente diferente.
- Se você adicionar uma conta não padrão via `openclaw channels add` (ou onboarding de canal) enquanto ainda estiver em uma configuração de canal de nível superior com uma única conta, o OpenClaw primeiro promove valores de conta única de nível superior com escopo de conta para o mapa de contas do canal para que a conta original continue funcionando. A maioria dos canais os move para `channels.<channel>.accounts.default`; o Matrix pode preservar um destino nomeado/padrão correspondente existente.
- Bindings existentes somente de canal (sem `accountId`) continuam correspondendo à conta padrão; bindings com escopo de conta permanecem opcionais.
- `openclaw doctor --fix` também repara formatos mistos movendo valores de conta única de nível superior com escopo de conta para a conta promovida escolhida para esse canal. A maioria dos canais usa `accounts.default`; o Matrix pode preservar um destino nomeado/padrão correspondente existente.

### Outros canais de Plugin

Muitos canais de Plugin são configurados como `channels.<id>` e documentados em suas páginas de canal dedicadas (por exemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Veja o índice completo de canais: [Canais](/pt-BR/channels).

### Bloqueio por menção em chat de grupo

Mensagens de grupo exigem **menção obrigatória** por padrão (menção de metadados ou padrões regex seguros). Aplica-se a chats de grupo do WhatsApp, Telegram, Discord, Google Chat e iMessage.

As respostas visíveis são controladas separadamente. Salas de grupo/canal usam por padrão `messages.groupChat.visibleReplies: "message_tool"`: o OpenClaw ainda processa o turno, mas as respostas finais normais permanecem privadas e a saída visível da sala exige `message(action=send)`. Defina `"automatic"` somente quando quiser o comportamento legado em que respostas normais são publicadas de volta na sala. Para aplicar o mesmo comportamento de resposta visível somente por ferramenta também a conversas diretas, defina `messages.visibleReplies: "message_tool"`; o harness do Codex também usa esse comportamento somente por ferramenta como padrão não definido para conversas diretas.

Respostas visíveis somente por ferramenta exigem um modelo/runtime que chame ferramentas de forma confiável. Se
o log da sessão mostrar texto do assistente com `didSendViaMessagingTool: false`, o
modelo produziu uma resposta final privada em vez de chamar a ferramenta de mensagens.
Troque para um modelo mais forte em chamadas de ferramentas para esse canal, ou defina
`messages.groupChat.visibleReplies: "automatic"` para restaurar as respostas finais
visíveis legadas.

Se a ferramenta de mensagens estiver indisponível sob a política de ferramentas ativa, o OpenClaw recorre a respostas visíveis automáticas em vez de suprimir silenciosamente a resposta. `openclaw doctor` avisa sobre essa incompatibilidade.

O gateway recarrega a configuração de `messages` a quente depois que o arquivo é salvo. Reinicie somente quando a observação de arquivos ou o recarregamento de configuração estiver desativado na implantação.

**Tipos de menção:**

- **Menções de metadados**: @-menções nativas da plataforma. Ignoradas no modo de conversa consigo mesmo do WhatsApp.
- **Padrões de texto**: Padrões regex seguros em `agents.list[].groupChat.mentionPatterns`. Padrões inválidos e repetição aninhada insegura são ignorados.
- O bloqueio por menção é imposto somente quando a detecção é possível (menções nativas ou pelo menos um padrão).

```json5
{
  messages: {
    visibleReplies: "automatic", // padrão global para conversas diretas/de origem; o harness do Codex usa message_tool como padrão para conversas diretas não definidas
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // padrão; use "automatic" para respostas finais legadas
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` define o padrão global. Canais podem substituir com `channels.<channel>.historyLimit` (ou por conta). Defina `0` para desativar.

`messages.visibleReplies` é o padrão global para turnos de origem; `messages.groupChat.visibleReplies` o substitui para turnos de origem de grupo/canal. Quando `messages.visibleReplies` não está definido, um harness pode fornecer seu próprio padrão direto/de origem; o harness do Codex usa `message_tool` por padrão. Listas de permissões de canal e bloqueio por menção ainda decidem se um turno é processado.

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

#### Modo de conversa consigo mesmo

Inclua seu próprio número em `allowFrom` para ativar o modo de conversa consigo mesmo (ignora @-menções nativas, responde apenas a padrões de texto):

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

### Comandos (tratamento de comandos no chat)

```json5
{
  commands: {
    native: "auto", // registra comandos nativos quando houver suporte
    nativeSkills: "auto", // registra comandos de skill nativos quando houver suporte
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

- Este bloco configura superfícies de comando. Para o catálogo atual de comandos integrados + empacotados, consulte [Comandos Slash](/pt-BR/tools/slash-commands).
- Esta página é uma **referência de chaves de configuração**, não o catálogo completo de comandos. Comandos pertencentes a canais/plugins, como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, pareamento de dispositivo `/pair`, memória `/dreaming`, controle de telefone `/phone` e Talk `/voice`, estão documentados em suas páginas de canal/plugin mais [Comandos Slash](/pt-BR/tools/slash-commands).
- Comandos de texto devem ser mensagens **isoladas** com `/` inicial.
- `native: "auto"` ativa comandos nativos para Discord/Telegram, deixa Slack desativado.
- `nativeSkills: "auto"` ativa comandos de skill nativos para Discord/Telegram, deixa Slack desativado.
- Substituição por canal: `channels.discord.commands.native` (bool ou `"auto"`). Para Discord, `false` pula o registro e a limpeza de comandos nativos durante a inicialização.
- Substitua o registro de skill nativo por canal com `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` adiciona entradas extras ao menu do bot do Telegram.
- `bash: true` ativa `! <cmd>` para o shell do host. Exige `tools.elevated.enabled` e remetente em `tools.elevated.allowFrom.<channel>`.
- `config: true` ativa `/config` (lê/grava `openclaw.json`). Para clientes `chat.send` do gateway, gravações persistentes de `/config set|unset` também exigem `operator.admin`; `/config show` somente leitura permanece disponível para clientes operadores normais com escopo de escrita.
- `mcp: true` ativa `/mcp` para configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`.
- `plugins: true` ativa `/plugins` para descoberta, instalação e controles de ativar/desativar plugins.
- `channels.<provider>.configWrites` controla mutações de configuração por canal (padrão: true).
- Para canais de múltiplas contas, `channels.<provider>.accounts.<id>.configWrites` também controla gravações que miram essa conta (por exemplo, `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desativa `/restart` e ações da ferramenta de reinício do gateway. Padrão: `true`.
- `ownerAllowFrom` é a lista de permissões explícita do proprietário para comandos/ferramentas exclusivos do proprietário. Ela é separada de `allowFrom`.
- `ownerDisplay: "hash"` gera hashes dos ids de proprietários no prompt do sistema. Defina `ownerDisplaySecret` para controlar o hashing.
- `allowFrom` é por provedor. Quando definido, é a **única** fonte de autorização (listas de permissões/pareamento de canal e `useAccessGroups` são ignorados).
- `useAccessGroups: false` permite que comandos ignorem políticas de grupo de acesso quando `allowFrom` não está definido.
- Mapa da documentação de comandos:
  - catálogo integrado + empacotado: [Comandos Slash](/pt-BR/tools/slash-commands)
  - superfícies de comando específicas por canal: [Canais](/pt-BR/channels)
  - comandos do QQ Bot: [QQ Bot](/pt-BR/channels/qqbot)
  - comandos de pareamento: [Pareamento](/pt-BR/channels/pairing)
  - comando de cartão LINE: [LINE](/pt-BR/channels/line)
  - dreaming da memória: [Dreaming](/pt-BR/concepts/dreaming)

</Accordion>

---

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — chaves de nível superior
- [Configuração — agentes](/pt-BR/gateway/config-agents)
- [Visão geral de canais](/pt-BR/channels)
