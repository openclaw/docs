---
read_when:
    - Configurando um Plugin de canal (autenticação, controle de acesso, várias contas)
    - Solução de problemas de chaves de configuração por canal
    - Auditando política de DM, política de grupo ou bloqueio por menção
summary: 'Configuração de canais: controle de acesso, pareamento, chaves por canal em Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e mais'
title: Configuração — canais
x-i18n:
    generated_at: "2026-04-24T05:50:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

Chaves de configuração por canal em `channels.*`. Cobre acesso por DM e grupo,
configurações com várias contas, bloqueio por menção e chaves por canal para Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage e os outros plugins de canal empacotados.

Para agentes, ferramentas, runtime do gateway e outras chaves de nível superior, consulte
[Configuration reference](/pt-BR/gateway/configuration-reference).

## Canais

Cada canal inicia automaticamente quando sua seção de configuração existe (a menos que `enabled: false`).

### Acesso por DM e grupo

Todos os canais oferecem suporte a políticas de DM e políticas de grupo:

| Política de DM       | Comportamento                                                   |
| -------------------- | --------------------------------------------------------------- |
| `pairing` (padrão)   | Remetentes desconhecidos recebem um código único de pareamento; o dono deve aprovar |
| `allowlist`          | Apenas remetentes em `allowFrom` (ou armazenamento de permissões pareadas) |
| `open`               | Permitir todas as DMs de entrada (requer `allowFrom: ["*"]`)    |
| `disabled`           | Ignorar todas as DMs de entrada                                 |

| Política de grupo      | Comportamento                                            |
| ---------------------- | -------------------------------------------------------- |
| `allowlist` (padrão)   | Apenas grupos que correspondam à allowlist configurada   |
| `open`                 | Ignorar allowlists de grupo (o bloqueio por menção ainda se aplica) |
| `disabled`             | Bloquear todas as mensagens de grupo/sala                |

<Note>
`channels.defaults.groupPolicy` define o padrão quando `groupPolicy` de um provedor não está definido.
Códigos de pareamento expiram após 1 hora. Solicitações pendentes de pareamento por DM são limitadas a **3 por canal**.
Se um bloco de provedor estiver ausente por completo (`channels.<provider>` ausente), a política de grupo em runtime usa fallback para `allowlist` (fail-closed) com um aviso na inicialização.
</Note>

### Sobrescritas de modelo por canal

Use `channels.modelByChannel` para fixar IDs de canal específicos a um modelo. Os valores aceitam `provider/model` ou aliases de modelo configurados. O mapeamento de canal se aplica quando uma sessão ainda não tem uma sobrescrita de modelo (por exemplo, definida via `/model`).

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

- `channels.defaults.groupPolicy`: política de grupo de fallback quando `groupPolicy` no nível do provedor não está definido.
- `channels.defaults.contextVisibility`: modo padrão de visibilidade de contexto suplementar para todos os canais. Valores: `all` (padrão, inclui todo o contexto citado/thread/histórico), `allowlist` (inclui apenas contexto de remetentes da allowlist), `allowlist_quote` (igual a allowlist, mas mantém contexto explícito de citação/resposta). Sobrescrita por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluir status saudáveis de canal na saída do Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: incluir status degradados/com erro na saída do Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderizar saída de Heartbeat compacta em estilo de indicador.

### WhatsApp

O WhatsApp funciona pelo canal web do gateway (Baileys Web). Ele inicia automaticamente quando existe uma sessão vinculada.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // tiques azuis (false no modo de conversa consigo mesmo)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

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

- Comandos de saída usam por padrão a conta `default` se ela existir; caso contrário, usam o primeiro ID de conta configurado (ordenado).
- `channels.whatsapp.defaultAccount` opcional sobrescreve essa seleção padrão de conta quando corresponde a um ID de conta configurado.
- O diretório legado de autenticação Baileys para conta única é migrado por `openclaw doctor` para `whatsapp/default`.
- Sobrescritas por conta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Mantenha as respostas breves.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Mantenha o foco no tópico.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Backup git" },
        { command: "generate", description: "Criar uma imagem" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (padrão: off; ative explicitamente para evitar limites de taxa em edições de prévia)
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token do bot: `channels.telegram.botToken` ou `channels.telegram.tokenFile` (apenas arquivo regular; symlinks são rejeitados), com `TELEGRAM_BOT_TOKEN` como fallback para a conta padrão.
- `channels.telegram.defaultAccount` opcional sobrescreve a seleção padrão de conta quando corresponde a um ID de conta configurado.
- Em configurações com várias contas (2+ IDs de conta), defina um padrão explícito (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) para evitar roteamento por fallback; `openclaw doctor` avisa quando isso está ausente ou inválido.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Telegram (migrações de ID de supergrupo, `/config set|unset`).
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram bindings ACP persistentes para tópicos de fórum (use o canônico `chatId:topic:topicId` em `match.peer.id`). A semântica dos campos é compartilhada em [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).
- Prévias de stream do Telegram usam `sendMessage` + `editMessageText` (funciona em chats diretos e em grupo).
- Política de nova tentativa: consulte [Retry policy](/pt-BR/concepts/retry).

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
              systemPrompt: "Respostas curtas apenas.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress é mapeado para partial no Discord)
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
        spawnSubagentSessions: false, // adesão opcional para sessions_spawn({ thread: true })
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
- Chamadas diretas de saída que fornecem um `token` explícito do Discord usam esse token para a chamada; configurações de política/nova tentativa da conta ainda vêm da conta selecionada no snapshot de runtime ativo.
- `channels.discord.defaultAccount` opcional sobrescreve a seleção padrão de conta quando corresponde a um ID de conta configurado.
- Use `user:<id>` (DM) ou `channel:<id>` (canal de servidor) para destinos de entrega; IDs numéricos sem qualificador são rejeitados.
- Slugs de servidor ficam em minúsculas com espaços substituídos por `-`; chaves de canal usam o nome em slug (sem `#`). Prefira IDs de servidor.
- Mensagens escritas por bot são ignoradas por padrão. `allowBots: true` as habilita; use `allowBots: "mentions"` para aceitar apenas mensagens de bot que mencionem o bot (mensagens próprias continuam filtradas).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e sobrescritas por canal) descarta mensagens que mencionem outro usuário ou função, mas não o bot (excluindo @everyone/@here).
- `maxLinesPerMessage` (padrão 17) divide mensagens altas mesmo quando têm menos de 2000 caracteres.
- `channels.discord.threadBindings` controla o roteamento vinculado a thread no Discord:
  - `enabled`: sobrescrita do Discord para recursos de sessão vinculada a thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e entrega/roteamento vinculados)
  - `idleHours`: sobrescrita do Discord para desfoco automático por inatividade em horas (`0` desabilita)
  - `maxAgeHours`: sobrescrita do Discord para idade máxima rígida em horas (`0` desabilita)
  - `spawnSubagentSessions`: chave de adesão opcional para criação/vinculação automática de thread em `sessions_spawn({ thread: true })`
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram bindings ACP persistentes para canais e threads (use o ID do canal/thread em `match.peer.id`). A semântica dos campos é compartilhada em [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` define a cor de destaque para contêineres de componentes v2 do Discord.
- `channels.discord.voice` habilita conversas em canais de voz do Discord e sobrescritas opcionais de entrada automática + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` são repassados para as opções DAVE de `@discordjs/voice` (`true` e `24` por padrão).
- O OpenClaw também tenta recuperar o recebimento de voz saindo e entrando novamente em uma sessão de voz após falhas repetidas de descriptografia.
- `channels.discord.streaming` é a chave canônica de modo de stream. Valores legados `streamMode` e `streaming` booleano são migrados automaticamente.
- `channels.discord.autoPresence` mapeia a disponibilidade do runtime para a presença do bot (saudável => online, degradado => idle, esgotado => dnd) e permite sobrescritas opcionais de texto de status.
- `channels.discord.dangerouslyAllowNameMatching` reabilita correspondência mutável por nome/tag (modo de compatibilidade de emergência).
- `channels.discord.execApprovals`: entrega nativa de aprovações de execução no Discord e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, aprovações de execução são ativadas quando aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Discord autorizados a aprovar solicitações de execução. Usa fallback para `commands.ownerAllowFrom` quando omitido.
  - `agentFilter`: allowlist opcional de ID de agente. Omita para encaminhar aprovações de todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão) envia para DMs dos aprovadores, `"channel"` envia para o canal de origem, `"both"` envia para ambos. Quando o alvo inclui `"channel"`, os botões só podem ser usados por aprovadores resolvidos.
  - `cleanupAfterResolve`: quando `true`, exclui DMs de aprovação após aprovação, negação ou timeout.

**Modos de notificação de reação:** `off` (nenhum), `own` (mensagens do bot, padrão), `all` (todas as mensagens), `allowlist` (de `guilds.<id>.users` em todas as mensagens).

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

- JSON da conta de serviço: inline (`serviceAccount`) ou baseado em arquivo (`serviceAccountFile`).
- SecretRef de conta de serviço também é compatível (`serviceAccountRef`).
- Fallbacks de env: `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Use `spaces/<spaceId>` ou `users/<userId>` para destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` reabilita correspondência mutável por principal de email (modo de compatibilidade de emergência).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
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
          systemPrompt: "Respostas curtas apenas.",
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
        nativeTransport: true, // usar transporte nativo de streaming do Slack quando mode=partial
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

- **Socket mode** requer `botToken` e `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para fallback por env da conta padrão).
- **HTTP mode** requer `botToken` mais `signingSecret` (na raiz ou por conta).
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings em texto simples
  ou objetos SecretRef.
- Snapshots de conta do Slack expõem campos por credencial de origem/status, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, em modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que a conta está
  configurada por SecretRef, mas o caminho atual de comando/runtime não conseguiu
  resolver o valor do segredo.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Slack.
- `channels.slack.defaultAccount` opcional sobrescreve a seleção padrão de conta quando corresponde a um ID de conta configurado.
- `channels.slack.streaming.mode` é a chave canônica de modo de stream do Slack. `channels.slack.streaming.nativeTransport` controla o transporte nativo de streaming do Slack. Valores legados `streamMode`, `streaming` booleano e `nativeStreaming` são migrados automaticamente.
- Use `user:<id>` (DM) ou `channel:<id>` para destinos de entrega.

**Modos de notificação de reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

**Isolamento de sessão por thread:** `thread.historyScope` é por thread (padrão) ou compartilhado entre o canal. `thread.inheritParent` copia a transcrição do canal pai para novas threads.

- Streaming nativo do Slack mais o status no estilo assistente do Slack "está digitando..." exigem um alvo de resposta em thread. DMs de nível superior permanecem fora de thread por padrão, então usam `typingReaction` ou entrega normal em vez da prévia em estilo thread.
- `typingReaction` adiciona uma reação temporária à mensagem de entrada do Slack enquanto uma resposta está em execução, depois a remove na conclusão. Use um shortcode de emoji do Slack, como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega nativa de aprovações de execução no Slack e autorização de aprovadores. Mesmo schema do Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuário do Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` ou `"both"`).

| Grupo de ação | Padrão      | Observações               |
| ------------- | ----------- | ------------------------- |
| reactions     | habilitado  | Reagir + listar reações   |
| messages      | habilitado  | Ler/enviar/editar/excluir |
| pins          | habilitado  | Fixar/desafixar/listar    |
| memberInfo    | habilitado  | Informações de membro     |
| emojiList     | habilitado  | Lista de emojis personalizados |

### Mattermost

Mattermost é distribuído como Plugin: `openclaw plugins install @openclaw/mattermost`.

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
        native: true, // adesão opcional
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL explícita opcional para implantações públicas/com proxy reverso
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modos de chat: `oncall` (responde em @-mention, padrão), `onmessage` (toda mensagem), `onchar` (mensagens que começam com prefixo de acionamento).

Quando comandos nativos do Mattermost estão habilitados:

- `commands.callbackPath` deve ser um caminho (por exemplo `/api/channels/mattermost/command`), não uma URL completa.
- `commands.callbackUrl` deve resolver para o endpoint do gateway do OpenClaw e ser acessível a partir do servidor Mattermost.
- Callbacks nativos de slash são autenticados com os tokens por comando retornados
  pelo Mattermost durante o registro do comando slash. Se o registro falhar ou nenhum
  comando for ativado, o OpenClaw rejeita callbacks com
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, o Mattermost pode exigir que
  `ServiceSettings.AllowedUntrustedInternalConnections` inclua o host/domínio do callback.
  Use valores de host/domínio, não URLs completas.
- `channels.mattermost.configWrites`: permitir ou negar gravações de configuração iniciadas pelo Mattermost.
- `channels.mattermost.requireMention`: exigir `@mention` antes de responder em canais.
- `channels.mattermost.groups.<channelId>.requireMention`: sobrescrita de bloqueio por menção por canal (`"*"` para padrão).
- `channels.mattermost.defaultAccount` opcional sobrescreve a seleção padrão de conta quando corresponde a um ID de conta configurado.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // binding opcional de conta
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
- `channels.signal.defaultAccount` opcional sobrescreve a seleção padrão de conta quando corresponde a um ID de conta configurado.

### BlueBubbles

BlueBubbles é o caminho recomendado para iMessage (com suporte de Plugin, configurado em `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, controles de grupo e ações avançadas:
      // consulte /channels/bluebubbles
    },
  },
}
```

- Caminhos de chave principais cobertos aqui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opcional sobrescreve a seleção padrão de conta quando corresponde a um ID de conta configurado.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas do BlueBubbles a sessões ACP persistentes. Use um identificador ou string de alvo do BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica compartilhada dos campos: [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).
- A configuração completa do canal BlueBubbles está documentada em [BlueBubbles](/pt-BR/channels/bluebubbles).

### iMessage

O OpenClaw inicia `imsg rpc` (JSON-RPC por stdio). Nenhum daemon ou porta é necessário.

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

- `channels.imessage.defaultAccount` opcional sobrescreve a seleção padrão de conta quando corresponde a um ID de conta configurado.

- Requer Full Disk Access ao banco de dados do Messages.
- Prefira alvos `chat_id:<id>`. Use `imsg chats --limit 20` para listar chats.
- `cliPath` pode apontar para um wrapper SSH; defina `remoteHost` (`host` ou `user@host`) para busca de anexos por SCP.
- `attachmentRoots` e `remoteAttachmentRoots` restringem caminhos de anexos de entrada (padrão: `/Users/*/Library/Messages/Attachments`).
- SCP usa verificação estrita de chave de host, então garanta que a chave do host relay já exista em `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite ou nega gravações de configuração iniciadas pelo iMessage.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas do iMessage a sessões ACP persistentes. Use um identificador normalizado ou alvo explícito de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica compartilhada dos campos: [ACP Agents](/pt-BR/tools/acp-agents#channel-specific-settings).

<Accordion title="Exemplo de wrapper SSH para iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix tem suporte de Plugin e é configurado em `channels.matrix`.

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
- `channels.matrix.proxy` roteia o tráfego HTTP do Matrix por um proxy HTTP(S) explícito. Contas nomeadas podem sobrescrevê-lo com `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` e essa adesão de rede são controles independentes.
- `channels.matrix.defaultAccount` seleciona a conta preferida em configurações com várias contas.
- `channels.matrix.autoJoin` usa `off` por padrão, então salas convidadas e convites novos no estilo DM são ignorados até você definir `autoJoin: "allowlist"` com `autoJoinAllowlist` ou `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa de aprovações de execução no Matrix e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, aprovações de execução são ativadas quando aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Matrix (por exemplo `@owner:example.org`) autorizados a aprovar solicitações de execução.
  - `agentFilter`: allowlist opcional de ID de agente. Omita para encaminhar aprovações de todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão), `"channel"` (sala de origem) ou `"both"`.
  - Sobrescritas por conta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla como DMs do Matrix são agrupadas em sessões: `per-user` (padrão) compartilha por peer roteado, enquanto `per-room` isola cada sala de DM.
- Sondas de status do Matrix e buscas de diretório ao vivo usam a mesma política de proxy que o tráfego em runtime.
- Configuração completa do Matrix, regras de direcionamento e exemplos de configuração estão documentados em [Matrix](/pt-BR/channels/matrix).

### Microsoft Teams

Microsoft Teams tem suporte de Plugin e é configurado em `channels.msteams`.

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
- A configuração completa do Teams (credenciais, Webhook, política de DM/grupo, sobrescritas por equipe/canal) está documentada em [Microsoft Teams](/pt-BR/channels/msteams).

### IRC

IRC tem suporte de Plugin e é configurado em `channels.irc`.

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
- `channels.irc.defaultAccount` opcional sobrescreve a seleção padrão de conta quando corresponde a um ID de conta configurado.
- A configuração completa do canal IRC (host/porta/TLS/canais/allowlists/bloqueio por menção) está documentada em [IRC](/pt-BR/channels/irc).

### Várias contas (todos os canais)

Execute várias contas por canal (cada uma com seu próprio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Bot principal",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot de alertas",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` é usado quando `accountId` é omitido (CLI + roteamento).
- Tokens de env se aplicam apenas à conta **default**.
- Configurações base do canal se aplicam a todas as contas, a menos que sejam sobrescritas por conta.
- Use `bindings[].match.accountId` para rotear cada conta para um agente diferente.
- Se você adicionar uma conta não padrão via `openclaw channels add` (ou onboarding de canal) enquanto ainda estiver em uma configuração de canal de nível superior para conta única, o OpenClaw promove primeiro os valores de conta única no nível superior com escopo de conta para o mapa de contas do canal, para que a conta original continue funcionando. A maioria dos canais os move para `channels.<channel>.accounts.default`; o Matrix pode preservar um alvo nomeado/default correspondente existente.
- Bindings existentes apenas de canal (sem `accountId`) continuam correspondendo à conta padrão; bindings com escopo de conta continuam opcionais.
- `openclaw doctor --fix` também repara formatos mistos movendo valores de conta única no nível superior com escopo de conta para a conta promovida escolhida para aquele canal. A maioria dos canais usa `accounts.default`; o Matrix pode preservar um alvo nomeado/default correspondente existente.

### Outros canais de Plugin

Muitos canais de Plugin são configurados como `channels.<id>` e documentados em suas páginas dedicadas de canal (por exemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Consulte o índice completo de canais: [Channels](/pt-BR/channels).

### Bloqueio por menção em chat de grupo

Mensagens de grupo usam **exigir menção** por padrão (menção por metadados ou padrões regex seguros). Isso se aplica a chats de grupo no WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipos de menção:**

- **Menções por metadados**: @-mentions nativos da plataforma. Ignorados no modo de conversa consigo mesmo do WhatsApp.
- **Padrões de texto**: padrões regex seguros em `agents.list[].groupChat.mentionPatterns`. Padrões inválidos e repetições aninhadas inseguras são ignorados.
- O bloqueio por menção é aplicado apenas quando a detecção é possível (menções nativas ou pelo menos um padrão).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` define o padrão global. Os canais podem sobrescrever com `channels.<channel>.historyLimit` (ou por conta). Defina `0` para desabilitar.

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

Resolução: sobrescrita por DM → padrão do provedor → sem limite (tudo é mantido).

Compatível: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de conversa consigo mesmo

Inclua seu próprio número em `allowFrom` para habilitar o modo de conversa consigo mesmo (ignora @-mentions nativos, responde apenas a padrões de texto):

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
    native: "auto", // registrar comandos nativos quando compatível
    nativeSkills: "auto", // registrar comandos nativos de Skill quando compatível
    text: true, // interpretar /commands em mensagens de chat
    bash: false, // permitir ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permitir /config
    mcp: false, // permitir /mcp
    plugins: false, // permitir /plugins
    debug: false, // permitir /debug
    restart: true, // permitir /restart + ferramenta de reinício do gateway
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

- Este bloco configura superfícies de comando. Para o catálogo atual de comandos integrados + empacotados, consulte [Slash Commands](/pt-BR/tools/slash-commands).
- Esta página é uma **referência de chaves de configuração**, não o catálogo completo de comandos. Comandos de canal/Plugin como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` e Talk `/voice` estão documentados em suas páginas de canal/Plugin e em [Slash Commands](/pt-BR/tools/slash-commands).
- Comandos de texto devem ser mensagens **independentes** com `/` no início.
- `native: "auto"` ativa comandos nativos para Discord/Telegram e mantém Slack desativado.
- `nativeSkills: "auto"` ativa comandos nativos de Skill para Discord/Telegram e mantém Slack desativado.
- Sobrescreva por canal com `channels.discord.commands.native` (bool ou `"auto"`). `false` limpa comandos previamente registrados.
- Sobrescreva o registro de Skills nativas por canal com `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` adiciona entradas extras ao menu do bot do Telegram.
- `bash: true` habilita `! <cmd>` para shell do host. Requer `tools.elevated.enabled` e remetente em `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lê/grava `openclaw.json`). Para clientes `chat.send` do gateway, gravações persistentes de `/config set|unset` também exigem `operator.admin`; `/config show` somente leitura continua disponível para clientes operadores normais com escopo de escrita.
- `mcp: true` habilita `/mcp` para configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`.
- `plugins: true` habilita `/plugins` para descoberta de Plugin, instalação e controles de habilitar/desabilitar.
- `channels.<provider>.configWrites` controla mutações de configuração por canal (padrão: true).
- Para canais com várias contas, `channels.<provider>.accounts.<id>.configWrites` também controla gravações que direcionam essa conta (por exemplo `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desabilita `/restart` e ações da ferramenta de reinício do gateway. Padrão: `true`.
- `ownerAllowFrom` é a allowlist explícita de dono para comandos/ferramentas somente do dono. Ela é separada de `allowFrom`.
- `ownerDisplay: "hash"` aplica hash aos IDs de dono no prompt do sistema. Defina `ownerDisplaySecret` para controlar o hashing.
- `allowFrom` é por provedor. Quando definido, é a **única** fonte de autorização (allowlists/pareamento do canal e `useAccessGroups` são ignorados).
- `useAccessGroups: false` permite que comandos ignorem políticas de grupo de acesso quando `allowFrom` não está definido.
- Mapa da documentação de comandos:
  - catálogo integrado + empacotado: [Slash Commands](/pt-BR/tools/slash-commands)
  - superfícies de comando específicas de canal: [Channels](/pt-BR/channels)
  - comandos do QQ Bot: [QQ Bot](/pt-BR/channels/qqbot)
  - comandos de pareamento: [Pairing](/pt-BR/channels/pairing)
  - comando de card do LINE: [LINE](/pt-BR/channels/line)
  - memory dreaming: [Dreaming](/pt-BR/concepts/dreaming)

</Accordion>

---

## Relacionados

- [Configuration reference](/pt-BR/gateway/configuration-reference) — chaves de nível superior
- [Configuration — agents](/pt-BR/gateway/config-agents)
- [Channels overview](/pt-BR/channels)
