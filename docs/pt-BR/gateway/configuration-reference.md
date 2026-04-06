---
read_when:
    - Você precisa da semântica exata de configuração em nível de campo ou dos valores padrão
    - Você está validando blocos de configuração de canal, modelo, gateway ou ferramenta
summary: Referência completa de todas as chaves de configuração do OpenClaw, padrões e configurações de canais
title: Referência de configuração
x-i18n:
    generated_at: "2026-04-06T03:12:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aa6b24b593f6f07118817afabea4cc7842aca6b7c5602b45f479b40c1685230
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Referência de configuração

Todos os campos disponíveis em `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuração](/pt-BR/gateway/configuration).

O formato da configuração é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando omitidos.

---

## Canais

Cada canal é iniciado automaticamente quando sua seção de configuração existe (a menos que `enabled: false`).

### Acesso a DMs e grupos

Todos os canais oferecem suporte a políticas de DM e políticas de grupo:

| Política de DM      | Comportamento                                                |
| ------------------- | ------------------------------------------------------------ |
| `pairing` (padrão)  | Remetentes desconhecidos recebem um código de pareamento único; o proprietário deve aprovar |
| `allowlist`         | Apenas remetentes em `allowFrom` (ou no armazenamento de permissões pareadas) |
| `open`              | Permitir todas as DMs recebidas (requer `allowFrom: ["*"]`)  |
| `disabled`          | Ignorar todas as DMs recebidas                               |

| Política de grupo     | Comportamento                                          |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (padrão)  | Apenas grupos que correspondem à allowlist configurada |
| `open`                | Ignora as allowlists de grupo (o bloqueio por menção ainda se aplica) |
| `disabled`            | Bloqueia todas as mensagens de grupo/sala              |

<Note>
`channels.defaults.groupPolicy` define o padrão quando `groupPolicy` de um provedor não está definido.
Os códigos de pareamento expiram após 1 hora. Solicitações pendentes de pareamento por DM são limitadas a **3 por canal**.
Se um bloco de provedor estiver totalmente ausente (`channels.<provider>` ausente), a política de grupo em tempo de execução usa `allowlist` como fallback (fail-closed) com um aviso na inicialização.
</Note>

### Substituições de modelo por canal

Use `channels.modelByChannel` para fixar IDs específicos de canal a um modelo. Os valores aceitam `provider/model` ou aliases de modelo configurados. O mapeamento de canal é aplicado quando uma sessão ainda não tem uma substituição de modelo (por exemplo, definida por `/model`).

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

### Padrões de canal e heartbeat

Use `channels.defaults` para comportamento compartilhado de política de grupo e heartbeat entre provedores:

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

- `channels.defaults.groupPolicy`: política de grupo de fallback quando um `groupPolicy` em nível de provedor não está definido.
- `channels.defaults.contextVisibility`: modo padrão de visibilidade de contexto suplementar para todos os canais. Valores: `all` (padrão, inclui todo o contexto citado/thread/histórico), `allowlist` (inclui apenas contexto de remetentes na allowlist), `allowlist_quote` (igual a allowlist, mas mantém contexto explícito de citação/resposta). Substituição por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: inclui status saudáveis de canal na saída de heartbeat.
- `channels.defaults.heartbeat.showAlerts`: inclui status degradados/com erro na saída de heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderiza a saída de heartbeat em estilo de indicador compacto.

### WhatsApp

O WhatsApp funciona pelo canal web do gateway (Baileys Web). Ele é iniciado automaticamente quando existe uma sessão vinculada.

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

- Comandos de saída usam a conta `default` por padrão, se ela existir; caso contrário, usam o primeiro `account id` configurado (ordenado).
- `channels.whatsapp.defaultAccount` é opcional e substitui essa seleção padrão de conta quando corresponde a um `account id` configurado.
- O diretório legado de autenticação Baileys de conta única é migrado por `openclaw doctor` para `whatsapp/default`.
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
      streaming: "partial", // off | partial | block | progress (default: off; ative explicitamente para evitar limites de taxa de edição de pré-visualização)
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

- Token do bot: `channels.telegram.botToken` ou `channels.telegram.tokenFile` (somente arquivo normal; symlinks são rejeitados), com `TELEGRAM_BOT_TOKEN` como fallback para a conta padrão.
- `channels.telegram.defaultAccount` é opcional e substitui a seleção padrão de conta quando corresponde a um `account id` configurado.
- Em configurações com várias contas (2+ `account ids`), defina um padrão explícito (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) para evitar roteamento por fallback; `openclaw doctor` emite um aviso quando isso está ausente ou inválido.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Telegram (migrações de ID de supergrupo, `/config set|unset`).
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram associações ACP persistentes para tópicos de fórum (use o `chatId:topic:topicId` canônico em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#channel-specific-settings).
- As pré-visualizações de stream do Telegram usam `sendMessage` + `editMessageText` (funciona em chats diretos e em grupo).
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
        spawnSubagentSessions: false, // opt-in para sessions_spawn({ thread: true })
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
- Chamadas diretas de saída que fornecem um `token` explícito do Discord usam esse token na chamada; configurações de repetição/política da conta ainda vêm da conta selecionada no snapshot ativo do tempo de execução.
- `channels.discord.defaultAccount` é opcional e substitui a seleção padrão de conta quando corresponde a um `account id` configurado.
- Use `user:<id>` (DM) ou `channel:<id>` (canal de guild) para destinos de entrega; IDs numéricos sem prefixo são rejeitados.
- Slugs de guild ficam em minúsculas com espaços substituídos por `-`; chaves de canal usam o nome em slug (sem `#`). Prefira IDs de guild.
- Mensagens criadas pelo bot são ignoradas por padrão. `allowBots: true` as habilita; use `allowBots: "mentions"` para aceitar apenas mensagens de bot que mencionem o bot (as próprias mensagens ainda são filtradas).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e substituições em nível de canal) descarta mensagens que mencionam outro usuário ou cargo, mas não o bot (excluindo @everyone/@here).
- `maxLinesPerMessage` (padrão 17) divide mensagens altas mesmo quando ficam abaixo de 2000 caracteres.
- `channels.discord.threadBindings` controla o roteamento vinculado a threads no Discord:
  - `enabled`: substituição do Discord para recursos de sessão vinculados a thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e entrega/roteamento vinculados)
  - `idleHours`: substituição do Discord para desfoco automático por inatividade em horas (`0` desabilita)
  - `maxAgeHours`: substituição do Discord para idade máxima rígida em horas (`0` desabilita)
  - `spawnSubagentSessions`: chave opt-in para criação automática/vinculação de thread com `sessions_spawn({ thread: true })`
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram associações ACP persistentes para canais e threads (use o id do canal/thread em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` define a cor de destaque para contêineres de componentes v2 do Discord.
- `channels.discord.voice` habilita conversas em canais de voz do Discord e substituições opcionais de auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` são repassados para as opções DAVE do `@discordjs/voice` (`true` e `24` por padrão).
- O OpenClaw também tenta recuperação de recebimento de voz saindo/entrando novamente em uma sessão de voz após falhas repetidas de descriptografia.
- `channels.discord.streaming` é a chave canônica de modo de stream. Valores legados `streamMode` e booleanos `streaming` são migrados automaticamente.
- `channels.discord.autoPresence` mapeia a disponibilidade em tempo de execução para a presença do bot (saudável => online, degradado => idle, esgotado => dnd) e permite substituições opcionais de texto de status.
- `channels.discord.dangerouslyAllowNameMatching` reabilita correspondência por nome/tag mutáveis (modo de compatibilidade break-glass).
- `channels.discord.execApprovals`: entrega nativa de aprovação de execução no Discord e autorização de aprovador.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, aprovações de execução são ativadas quando aprovadores podem ser resolvidos de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Discord autorizados a aprovar solicitações de execução. Usa `commands.ownerAllowFrom` como fallback quando omitido.
  - `agentFilter`: allowlist opcional de IDs de agentes. Omita para encaminhar aprovações de todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão) envia para DMs dos aprovadores, `"channel"` envia para o canal de origem, `"both"` envia para ambos. Quando o destino inclui `"channel"`, os botões só podem ser usados por aprovadores resolvidos.
  - `cleanupAfterResolve`: quando `true`, exclui DMs de aprovação após aprovação, negação ou timeout.

**Modos de notificação por reação:** `off` (nenhum), `own` (mensagens do bot, padrão), `all` (todas as mensagens), `allowlist` (de `guilds.<id>.users` em todas as mensagens).

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
- SecretRef para conta de serviço também é compatível (`serviceAccountRef`).
- Fallbacks por env: `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Use `spaces/<spaceId>` ou `users/<userId>` para destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` reabilita correspondência por principal de email mutável (modo de compatibilidade break-glass).

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
      streaming: "partial", // off | partial | block | progress (modo de pré-visualização)
      nativeStreaming: true, // usar API nativa de streaming do Slack quando streaming=partial
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

- **Modo Socket** requer `botToken` e `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para fallback por env da conta padrão).
- **Modo HTTP** requer `botToken` e `signingSecret` (na raiz ou por conta).
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings em texto simples
  ou objetos SecretRef.
- Snapshots de conta do Slack expõem campos de origem/status por credencial, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, no modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que a conta está
  configurada via SecretRef, mas o caminho atual de comando/tempo de execução não conseguiu
  resolver o valor do segredo.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Slack.
- `channels.slack.defaultAccount` é opcional e substitui a seleção padrão de conta quando corresponde a um `account id` configurado.
- `channels.slack.streaming` é a chave canônica de modo de stream. Valores legados `streamMode` e booleanos `streaming` são migrados automaticamente.
- Use `user:<id>` (DM) ou `channel:<id>` para destinos de entrega.

**Modos de notificação por reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

**Isolamento de sessão por thread:** `thread.historyScope` é por thread (padrão) ou compartilhado por canal. `thread.inheritParent` copia a transcrição do canal pai para novas threads.

- `typingReaction` adiciona uma reação temporária à mensagem recebida no Slack enquanto uma resposta está em execução e a remove ao concluir. Use um shortcode de emoji do Slack, como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega nativa de aprovação de execução no Slack e autorização de aprovador. Mesmo esquema do Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuário do Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` ou `"both"`).

| Grupo de ações | Padrão      | Observações               |
| -------------- | ----------- | ------------------------- |
| reactions      | habilitado  | Reagir + listar reações   |
| messages       | habilitado  | Ler/enviar/editar/excluir |
| pins           | habilitado  | Fixar/desafixar/listar    |
| memberInfo     | habilitado  | Informações de membro     |
| emojiList      | habilitado  | Lista de emojis customizados |

### Mattermost

Mattermost é distribuído como plugin: `openclaw plugins install @openclaw/mattermost`.

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
        // URL explícita opcional para implantações com reverse proxy/públicas
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modos de chat: `oncall` (responde a @menção, padrão), `onmessage` (toda mensagem), `onchar` (mensagens que começam com o prefixo de gatilho).

Quando os comandos nativos do Mattermost estão habilitados:

- `commands.callbackPath` deve ser um caminho (por exemplo `/api/channels/mattermost/command`), não uma URL completa.
- `commands.callbackUrl` deve resolver para o endpoint do gateway OpenClaw e ser acessível a partir do servidor Mattermost.
- Callbacks nativos de slash são autenticados com os tokens por comando retornados
  pelo Mattermost durante o registro do comando slash. Se o registro falhar ou nenhum
  comando for ativado, o OpenClaw rejeita callbacks com
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, o Mattermost pode exigir
  que `ServiceSettings.AllowedUntrustedInternalConnections` inclua o host/domínio do callback.
  Use valores de host/domínio, não URLs completas.
- `channels.mattermost.configWrites`: permitir ou negar gravações de configuração iniciadas pelo Mattermost.
- `channels.mattermost.requireMention`: exigir `@mention` antes de responder em canais.
- `channels.mattermost.groups.<channelId>.requireMention`: substituição por canal para bloqueio por menção (`"*"` para padrão).
- `channels.mattermost.defaultAccount` é opcional e substitui a seleção padrão de conta quando corresponde a um `account id` configurado.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // associação opcional de conta
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

**Modos de notificação por reação:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

- `channels.signal.account`: fixa a inicialização do canal a uma identidade específica de conta Signal.
- `channels.signal.configWrites`: permite ou nega gravações de configuração iniciadas pelo Signal.
- `channels.signal.defaultAccount` é opcional e substitui a seleção padrão de conta quando corresponde a um `account id` configurado.

### BlueBubbles

BlueBubbles é o caminho recomendado para iMessage (com plugin, configurado em `channels.bluebubbles`).

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
- `channels.bluebubbles.defaultAccount` é opcional e substitui a seleção padrão de conta quando corresponde a um `account id` configurado.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas BlueBubbles a sessões ACP persistentes. Use um identificador BlueBubbles ou string de destino (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica compartilhada dos campos: [Agentes ACP](/pt-BR/tools/acp-agents#channel-specific-settings).
- A configuração completa do canal BlueBubbles está documentada em [BlueBubbles](/pt-BR/channels/bluebubbles).

### iMessage

O OpenClaw inicia `imsg rpc` (JSON-RPC sobre stdio). Não é necessário daemon nem porta.

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

- `channels.imessage.defaultAccount` é opcional e substitui a seleção padrão de conta quando corresponde a um `account id` configurado.

- Requer Full Disk Access ao banco de dados do Messages.
- Prefira destinos `chat_id:<id>`. Use `imsg chats --limit 20` para listar chats.
- `cliPath` pode apontar para um wrapper SSH; defina `remoteHost` (`host` ou `user@host`) para buscar anexos por SCP.
- `attachmentRoots` e `remoteAttachmentRoots` restringem caminhos de anexos recebidos (padrão: `/Users/*/Library/Messages/Attachments`).
- O SCP usa verificação estrita de chave de host, portanto garanta que a chave do host relay já exista em `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite ou nega gravações de configuração iniciadas pelo iMessage.
- Entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas iMessage a sessões ACP persistentes. Use um identificador normalizado ou destino explícito de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica compartilhada dos campos: [Agentes ACP](/pt-BR/tools/acp-agents#channel-specific-settings).

<Accordion title="Exemplo de wrapper SSH para iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

O Matrix usa extensão e é configurado em `channels.matrix`.

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
- `channels.matrix.allowPrivateNetwork` permite homeservers privados/internos. `proxy` e `allowPrivateNetwork` são controles independentes.
- `channels.matrix.defaultAccount` seleciona a conta preferida em configurações com várias contas.
- `channels.matrix.execApprovals`: entrega nativa de aprovação de execução no Matrix e autorização de aprovador.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, aprovações de execução são ativadas quando aprovadores podem ser resolvidos de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Matrix (por exemplo `@owner:example.org`) autorizados a aprovar solicitações de execução.
  - `agentFilter`: allowlist opcional de IDs de agentes. Omita para encaminhar aprovações de todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou regex).
  - `target`: onde enviar prompts de aprovação. `"dm"` (padrão), `"channel"` (sala de origem) ou `"both"`.
  - Substituições por conta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla como DMs do Matrix são agrupadas em sessões: `per-user` (padrão) compartilha por peer roteado, enquanto `per-room` isola cada sala de DM.
- Sondas de status do Matrix e buscas em diretório ao vivo usam a mesma política de proxy do tráfego em tempo de execução.
- A configuração completa do Matrix, regras de destino e exemplos de configuração estão documentados em [Matrix](/pt-BR/channels/matrix).

### Microsoft Teams

Microsoft Teams usa extensão e é configurado em `channels.msteams`.

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

IRC usa extensão e é configurado em `channels.irc`.

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
- `channels.irc.defaultAccount` é opcional e substitui a seleção padrão de conta quando corresponde a um `account id` configurado.
- A configuração completa do canal IRC (host/porta/TLS/canais/allowlists/bloqueio por menção) está documentada em [IRC](/pt-BR/channels/irc).

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
- Tokens por env aplicam-se apenas à conta **default**.
- Configurações base do canal aplicam-se a todas as contas, a menos que sejam substituídas por conta.
- Use `bindings[].match.accountId` para rotear cada conta para um agente diferente.
- Se você adicionar uma conta não padrão via `openclaw channels add` (ou onboarding de canal) enquanto ainda estiver em uma configuração de canal de conta única no nível superior, o OpenClaw primeiro promove valores de conta única no nível superior com escopo de conta para o mapa de contas do canal, para que a conta original continue funcionando. A maioria dos canais move esses valores para `channels.<channel>.accounts.default`; o Matrix pode preservar um destino nomeado/default existente correspondente.
- Bindings existentes somente de canal (sem `accountId`) continuam correspondendo à conta padrão; bindings com escopo de conta permanecem opcionais.
- `openclaw doctor --fix` também corrige formatos mistos movendo valores de conta única de nível superior com escopo de conta para a conta promovida escolhida para esse canal. A maioria dos canais usa `accounts.default`; o Matrix pode preservar um destino nomeado/default existente correspondente.

### Outros canais de extensão

Muitos canais de extensão são configurados como `channels.<id>` e documentados em suas páginas dedicadas de canal (por exemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk e Twitch).
Consulte o índice completo de canais: [Canais](/pt-BR/channels).

### Bloqueio por menção em chats de grupo

Mensagens de grupo usam **exigir menção** por padrão (menção por metadados ou padrões regex seguros). Aplica-se a WhatsApp, Telegram, Discord, Google Chat e chats em grupo do iMessage.

**Tipos de menção:**

- **Menções por metadados**: @menções nativas da plataforma. Ignoradas no modo de conversa consigo mesmo do WhatsApp.
- **Padrões de texto**: padrões regex seguros em `agents.list[].groupChat.mentionPatterns`. Padrões inválidos e repetição aninhada insegura são ignorados.
- O bloqueio por menção só é aplicado quando a detecção é possível (menções nativas ou pelo menos um padrão).

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

`messages.groupChat.historyLimit` define o padrão global. Os canais podem substituir com `channels.<channel>.historyLimit` (ou por conta). Defina `0` para desabilitar.

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

Resolução: substituição por DM → padrão do provedor → sem limite (todos mantidos).

Compatível com: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de conversa consigo mesmo

Inclua seu próprio número em `allowFrom` para habilitar o modo de conversa consigo mesmo (ignora @menções nativas, responde apenas a padrões de texto):

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

### Comandos (tratamento de comandos em chat)

```json5
{
  commands: {
    native: "auto", // registrar comandos nativos quando compatível
    text: true, // analisar /commands em mensagens de chat
    bash: false, // permitir ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permitir /config
    debug: false, // permitir /debug
    restart: false, // permitir /restart + ferramenta de reinício do gateway
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Detalhes dos comandos">

- Comandos de texto devem ser mensagens **autônomas** com `/` no início.
- `native: "auto"` ativa comandos nativos para Discord/Telegram, mas deixa o Slack desativado.
- Substitua por canal: `channels.discord.commands.native` (bool ou `"auto"`). `false` limpa comandos registrados anteriormente.
- `channels.telegram.customCommands` adiciona entradas extras ao menu do bot do Telegram.
- `bash: true` habilita `! <cmd>` para o shell do host. Requer `tools.elevated.enabled` e remetente em `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lê/grava `openclaw.json`). Para clientes `chat.send` do gateway, gravações persistentes `/config set|unset` também exigem `operator.admin`; `/config show` somente leitura continua disponível para clientes normais de operador com escopo de escrita.
- `channels.<provider>.configWrites` controla mutações de configuração por canal (padrão: true).
- Para canais com várias contas, `channels.<provider>.accounts.<id>.configWrites` também controla gravações direcionadas a essa conta (por exemplo `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` é por provedor. Quando definido, é a **única** origem de autorização (allowlists de canal/pareamento e `useAccessGroups` são ignorados).
- `useAccessGroups: false` permite que comandos ignorem políticas de grupo de acesso quando `allowFrom` não está definido.

</Accordion>

---

## Padrões de agente

### `agents.defaults.workspace`

Padrão: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raiz opcional do repositório exibida na linha Runtime do prompt do sistema. Se não estiver definida, o OpenClaw detecta automaticamente subindo a partir do workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist padrão opcional de Skills para agentes que não definem
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // herda github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui os padrões
      { id: "locked-down", skills: [] }, // sem Skills
    ],
  },
}
```

- Omita `agents.defaults.skills` para Skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para nenhuma Skill.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final para esse agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desabilita a criação automática de arquivos bootstrap do workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por arquivo bootstrap do workspace antes de truncar. Padrão: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres injetados em todos os arquivos bootstrap do workspace. Padrão: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla o texto de aviso visível ao agente quando o contexto bootstrap é truncado.
Padrão: `"once"`.

- `"off"`: nunca injeta texto de aviso no prompt do sistema.
- `"once"`: injeta o aviso uma vez por assinatura de truncamento única (recomendado).
- `"always"`: injeta aviso em toda execução quando houver truncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamanho máximo em pixels do lado mais longo da imagem em blocos de imagem de transcrição/ferramenta antes de chamadas ao provedor.
Padrão: `1200`.

Valores menores normalmente reduzem o uso de tokens de visão e o tamanho do payload da requisição em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso horário para o contexto do prompt do sistema (não para timestamps de mensagem). Usa o fuso horário do host como fallback.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora no prompt do sistema. Padrão: `auto` (preferência do SO).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // parâmetros globais padrão do provedor
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - O formato string define apenas o modelo principal.
  - O formato objeto define o principal e modelos de failover ordenados.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como sua configuração de modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não aceita entrada de imagem.
- `imageGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagem e por qualquer futura superfície de ferramenta/plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração nativa de imagem do Gemini, `fal/fal-ai/flux/dev` para fal ou `openai/gpt-image-1` para OpenAI Images.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API correspondente do provedor (por exemplo `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` para `openai/*`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de imagem em ordem de `provider-id`.
- `musicGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de música e pela ferramenta embutida `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.5+`.
  - Se omitido, `music_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de música em ordem de `provider-id`.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API correspondente do provedor.
- `videoGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo e pela ferramenta embutida `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de vídeo em ordem de `provider-id`.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API correspondente do provedor.
  - O provedor empacotado de geração de vídeo Qwen atualmente suporta até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, duração de 10 segundos e opções em nível de provedor `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta PDF usa `imageModel` como fallback e depois o modelo resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: número máximo padrão de páginas consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível verbose padrão para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo `openai/gpt-5.4`). Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provedor configurado para esse id exato de modelo e só então usa o provedor padrão configurado como fallback (comportamento de compatibilidade obsoleto, então prefira `provider/model` explícito). Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw usa o primeiro provedor/modelo configurado como fallback em vez de exibir um padrão obsoleto de provedor removido.
- `models`: catálogo de modelos configurado e allowlist para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específicos do provedor, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parâmetros globais padrão do provedor aplicados a todos os modelos. Defina em `agents.defaults.params` (por exemplo `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (configuração): `agents.defaults.params` (base global) é substituído por `agents.defaults.models["provider/model"].params` (por modelo) e depois `agents.list[].params` (ID de agente correspondente) substitui por chave. Consulte [Prompt Caching](/pt-BR/reference/prompt-caching) para detalhes.
- Gravadores de configuração que alteram esses campos (por exemplo `/models set`, `/models set-image` e comandos de adicionar/remover fallback) salvam o formato canônico de objeto e preservam listas de fallback existentes quando possível.
- `maxConcurrent`: máximo de execuções paralelas de agente entre sessões (cada sessão ainda é serializada). Padrão: 4.

**Atalhos de alias embutidos** (aplicam-se apenas quando o modelo está em `agents.defaults.models`):

| Alias               | Modelo                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Seus aliases configurados sempre prevalecem sobre os padrões.

Modelos Z.AI GLM-4.x habilitam automaticamente o modo thinking, a menos que você defina `--thinking off` ou defina `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Modelos Z.AI habilitam `tool_stream` por padrão para streaming de chamadas de ferramenta. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desabilitar.
Modelos Anthropic Claude 4.6 usam `adaptive` thinking por padrão quando nenhum nível explícito de thinking está definido.

- Sessões compatíveis quando `sessionArg` está definido.
- Pass-through de imagem compatível quando `imageArg` aceita caminhos de arquivo.

### `agents.defaults.heartbeat`

Execuções periódicas de heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m desabilita
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos bootstrap do workspace
        isolatedSession: false, // padrão: false; true executa cada heartbeat em uma sessão nova (sem histórico de conversa)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (padrão) | block
        target: "none", // padrão: none | opções: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: string de duração (ms/s/m/h). Padrão: `30m` (autenticação por API key) ou `1h` (autenticação OAuth). Defina `0m` para desabilitar.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de ferramenta durante execuções de heartbeat.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega direta ao destino. `block` suprime entrega direta ao destino e emite `reason=dm-blocked`.
- `lightContext`: quando true, execuções de heartbeat usam contexto bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos bootstrap do workspace.
- `isolatedSession`: quando true, cada execução de heartbeat acontece em uma sessão nova, sem histórico anterior de conversa. Mesmo padrão de isolamento de cron `sessionTarget: "isolated"`. Reduz o custo de tokens por heartbeat de ~100K para ~2-5K tokens.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **apenas esses agentes** executam heartbeats.
- Heartbeats executam turnos completos do agente — intervalos menores queimam mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // usado quando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] desabilita reinjeção
        model: "openrouter/anthropic/claude-sonnet-4-6", // substituição opcional de modelo somente para compactação
        notifyUser: true, // envia um aviso breve quando a compactação começa (padrão: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` ou `safeguard` (sumarização em partes para históricos longos). Consulte [Compactação](/pt-BR/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitidos para uma única operação de compactação antes de o OpenClaw abortá-la. Padrão: `900`.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` prefixa orientação embutida de retenção de identificadores opacos durante a sumarização de compactação.
- `identifierInstructions`: texto opcional customizado de preservação de identificadores usado quando `identifierPolicy=custom`.
- `postCompactionSections`: nomes opcionais de seções H2/H3 de AGENTS.md a serem reinjetadas após a compactação. Padrão: `["Session Startup", "Red Lines"]`; defina `[]` para desabilitar reinjeção. Quando não definido ou definido explicitamente para esse par padrão, cabeçalhos antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: substituição opcional de `provider/model-id` apenas para sumarização de compactação. Use isso quando a sessão principal deve manter um modelo, mas os resumos de compactação devem rodar em outro; quando não definido, a compactação usa o modelo principal da sessão.
- `notifyUser`: quando `true`, envia um aviso breve ao usuário quando a compactação começa (por exemplo, "Compacting context..."). Desabilitado por padrão para manter a compactação silenciosa.
- `memoryFlush`: turno agêntico silencioso antes da autocompactação para armazenar memórias duráveis. Ignorado quando o workspace é somente leitura.

### `agents.defaults.contextPruning`

Remove **resultados antigos de ferramentas** do contexto em memória antes de enviar ao LLM. **Não** modifica o histórico da sessão em disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duração (ms/s/m/h), unidade padrão: minutos
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamento do modo cache-ttl">

- `mode: "cache-ttl"` habilita passes de poda.
- `ttl` controla com que frequência a poda pode ocorrer novamente (após o último toque no cache).
- A poda primeiro faz soft-trim de resultados grandes de ferramenta, depois hard-clear de resultados mais antigos se necessário.

**Soft-trim** mantém o início + o fim e insere `...` no meio.

**Hard-clear** substitui todo o resultado da ferramenta pelo placeholder.

Observações:

- Blocos de imagem nunca são truncados/limpos.
- As proporções são baseadas em caracteres (aproximadas), não em contagem exata de tokens.
- Se existirem menos de `keepLastAssistants` mensagens do assistente, a poda é ignorada.

</Accordion>

Consulte [Poda de sessão](/pt-BR/concepts/session-pruning) para detalhes do comportamento.

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Canais não Telegram exigem `*.blockStreaming: true` explícito para habilitar respostas em bloco.
- Substituições por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam `minChars: 1500` por padrão.
- `humanDelay`: pausa aleatória entre respostas em bloco. `natural` = 800–2500ms. Substituição por agente: `agents.list[].humanDelay`.

Consulte [Streaming](/pt-BR/concepts/streaming) para comportamento + detalhes de fragmentação.

### Indicadores de digitação

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Padrões: `instant` para chats diretos/menções, `message` para chats em grupo sem menção.
- Substituições por sessão: `session.typingMode`, `session.typingIntervalSeconds`.

Consulte [Indicadores de digitação](/pt-BR/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opcional para o agente embutido. Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / conteúdos inline também são compatíveis:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detalhes do sandbox">

**Backend:**

- `docker`: runtime local Docker (padrão)
- `ssh`: runtime remoto genérico via SSH
- `openshell`: runtime OpenShell

Quando `backend: "openshell"` é selecionado, configurações específicas do runtime vão para
`plugins.entries.openshell.config`.

**Configuração do backend SSH:**

- `target`: destino SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para workspaces por escopo
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados ao OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdos inline ou SecretRefs que o OpenClaw materializa em arquivos temporários em tempo de execução
- `strictHostKeyChecking` / `updateHostKeys`: controles da política de chave de host do OpenSSH

**Precedência de autenticação SSH:**

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Valores `*Data` com SecretRef são resolvidos a partir do snapshot ativo do runtime de segredos antes de a sessão de sandbox começar

**Comportamento do backend SSH:**

- semeia o workspace remoto uma vez após criar ou recriar
- depois mantém o workspace remoto SSH como canônico
- roteia `exec`, ferramentas de arquivo e caminhos de mídia via SSH
- não sincroniza automaticamente mudanças remotas de volta ao host
- não oferece suporte a contêineres de navegador em sandbox

**Acesso ao workspace:**

- `none`: workspace do sandbox por escopo em `~/.openclaw/sandboxes`
- `ro`: workspace do sandbox em `/workspace`, workspace do agente montado como somente leitura em `/agent`
- `rw`: workspace do agente montado com leitura/gravação em `/workspace`

**Escopo:**

- `session`: contêiner + workspace por sessão
- `agent`: um contêiner + workspace por agente (padrão)
- `shared`: contêiner e workspace compartilhados (sem isolamento entre sessões)

**Configuração do plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id opcional de política OpenShell
          providers: ["openai"], // opcional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo OpenShell:**

- `mirror`: semeia o remoto a partir do local antes do exec, sincroniza de volta após o exec; o workspace local continua canônico
- `remote`: semeia o remoto uma vez quando o sandbox é criado e depois mantém o workspace remoto como canônico

No modo `remote`, edições locais no host feitas fora do OpenClaw não são sincronizadas automaticamente para o sandbox após a etapa de seed.
O transporte é SSH para dentro do sandbox OpenShell, mas o plugin é dono do ciclo de vida do sandbox e da sincronização opcional em modo mirror.

**`setupCommand`** executa uma vez após a criação do contêiner (via `sh -lc`). Requer saída de rede, raiz gravável, usuário root.

**Contêineres usam `network: "none"` por padrão** — defina `"bridge"` (ou uma rede bridge customizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Anexos recebidos** são colocados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; binds globais e por agente são mesclados.

**Navegador em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. A URL do noVNC é injetada no prompt do sistema. Não requer `browser.enabled` em `openclaw.json`.
O acesso de observador no noVNC usa autenticação VNC por padrão e o OpenClaw emite uma URL com token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) bloqueia sessões em sandbox de apontarem para o navegador do host.
- `network` usa `openclaw-sandbox-browser` por padrão (rede bridge dedicada). Defina `bridge` apenas quando quiser explicitamente conectividade global de bridge.
- `cdpSourceRange` opcionalmente restringe a entrada CDP na borda do contêiner a um intervalo CIDR (por exemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner do navegador em sandbox. Quando definido (inclusive `[]`), ele substitui `docker.binds` para o contêiner do navegador.
- Os padrões de inicialização são definidos em `scripts/sandbox-browser-entrypoint.sh` e ajustados para hosts de contêiner:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (habilitado por padrão)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` são
    habilitados por padrão e podem ser desabilitados com
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se o uso de WebGL/3D exigir isso.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` reabilita extensões se seu fluxo
    depender delas.
  - `--renderer-process-limit=2` pode ser alterado com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o
    limite de processo padrão do Chromium.
  - mais `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` estiver habilitado.
  - Os padrões são a base da imagem de contêiner; use uma imagem de navegador customizada com um
    entrypoint customizado para alterar os padrões do contêiner.

</Accordion>

Sandboxing de navegador e `sandbox.docker.binds` atualmente são somente Docker.

Construir imagens:

```bash
scripts/sandbox-setup.sh           # imagem principal do sandbox
scripts/sandbox-browser-setup.sh   # imagem opcional do navegador
```

### `agents.list` (substituições por agente)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // ou { primary, fallbacks }
        thinkingDefault: "high", // substituição por agente para nível de thinking
        reasoningDefault: "on", // substituição por agente para visibilidade de reasoning
        fastModeDefault: false, // substituição por agente para fast mode
        params: { cacheRetention: "none" }, // substitui matching defaults.models params por chave
        skills: ["docs-search"], // substitui agents.defaults.skills quando definido
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id estável do agente (obrigatório).
- `default`: quando vários são definidos, o primeiro prevalece (aviso registrado). Se nenhum estiver definido, a primeira entrada da lista é o padrão.
- `model`: o formato string substitui apenas `primary`; o formato objeto `{ primary, fallbacks }` substitui ambos (`[]` desabilita fallbacks globais). Jobs cron que substituem apenas `primary` ainda herdam fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use isso para substituições específicas do agente, como `cacheRetention`, `temperature` ou `maxTokens`, sem duplicar todo o catálogo de modelos.
- `skills`: allowlist opcional de Skills por agente. Se omitido, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa nenhuma Skill.
- `thinkingDefault`: thinking opcional padrão por agente (`off | minimal | low | medium | high | xhigh | adaptive`). Substitui `agents.defaults.thinkingDefault` para esse agente quando não há substituição por mensagem ou sessão.
- `reasoningDefault`: visibilidade padrão opcional de reasoning por agente (`on | off | stream`). Aplica-se quando não há substituição de reasoning por mensagem ou sessão.
- `fastModeDefault`: padrão opcional por agente para fast mode (`true | false`). Aplica-se quando não há substituição de fast-mode por mensagem ou sessão.
- `runtime`: descritor opcional de runtime por agente. Use `type: "acp"` com padrões `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar por padrão sessões do harness ACP.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- `identity` deriva padrões: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: allowlist de ids de agentes para `sessions_spawn` (`["*"]` = qualquer; padrão: apenas o mesmo agente).
- Proteção de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que rodariam sem sandbox.
- `subagents.requireAgentId`: quando true, bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil; padrão: false).

---

## Roteamento multiagente

Execute vários agentes isolados dentro de um Gateway. Consulte [Multi-Agent](/pt-BR/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Campos de correspondência de binding

- `type` (opcional): `route` para roteamento normal (type ausente assume route), `acp` para associações persistentes de conversa ACP.
- `match.channel` (obrigatório)
- `match.accountId` (opcional; `*` = qualquer conta; omitido = conta padrão)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específico do canal)
- `acp` (opcional; apenas para entradas `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordem determinística de correspondência:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exato, sem peer/guild/team)
5. `match.accountId: "*"` (canal inteiro)
6. Agente padrão

Dentro de cada nível, a primeira entrada correspondente em `bindings` prevalece.

Para entradas `type: "acp"`, o OpenClaw resolve pela identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem de níveis de route binding acima.

### Perfis de acesso por agente

<Accordion title="Acesso total (sem sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Ferramentas + workspace somente leitura">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Sem acesso ao sistema de arquivos (somente mensagens)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Consulte [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para detalhes de precedência.

---

## Sessão

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // ignora fork de thread pai acima desse número de tokens (0 desabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duração ou false
      maxDiskBytes: "500mb", // orçamento rígido opcional
      highWaterBytes: "400mb", // alvo opcional de limpeza
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // padrão de desfoco automático por inatividade em horas (`0` desabilita)
      maxAgeHours: 0, // padrão de idade máxima rígida em horas (`0` desabilita)
    },
    mainKey: "main", // legado (o runtime sempre usa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalhes dos campos de sessão">

- **`scope`**: estratégia base de agrupamento de sessão para contextos de chat em grupo.
  - `per-sender` (padrão): cada remetente recebe uma sessão isolada dentro de um contexto de canal.
  - `global`: todos os participantes em um contexto de canal compartilham uma única sessão (use apenas quando o contexto compartilhado for intencional).
- **`dmScope`**: como as DMs são agrupadas.
  - `main`: todas as DMs compartilham a sessão principal.
  - `per-peer`: isola por id do remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada multiusuário).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para várias contas).
- **`identityLinks`**: mapeia ids canônicos para peers com prefixo de provedor para compartilhamento de sessão entre canais.
- **`reset`**: política principal de redefinição. `daily` redefine em `atHour` no horário local; `idle` redefine após `idleMinutes`. Quando ambos estão configurados, o que expirar primeiro prevalece.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). O legado `dm` é aceito como alias de `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` permitido para a sessão pai ao criar uma sessão de thread bifurcada (padrão `100000`).
  - Se o `totalTokens` do pai estiver acima desse valor, o OpenClaw inicia uma sessão de thread nova em vez de herdar o histórico de transcrição da sessão pai.
  - Defina `0` para desabilitar essa proteção e sempre permitir fork do pai.
- **`mainKey`**: campo legado. O runtime agora sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: máximo de turnos de resposta entre agentes durante trocas agente-para-agente (inteiro, intervalo: `0`–`5`). `0` desabilita encadeamento ping-pong.
- **`sendPolicy`**: correspondência por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira regra deny prevalece.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessão.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica a limpeza.
  - `pruneAfter`: corte de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`).
  - `rotateBytes`: rotaciona `sessions.json` quando excede esse tamanho (padrão `10mb`).
  - `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>`. Usa `pruneAfter` por padrão; defina `false` para desabilitar.
  - `maxDiskBytes`: orçamento opcional de disco para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após limpeza por orçamento. Usa `80%` de `maxDiskBytes` por padrão.
- **`threadBindings`**: padrões globais para recursos de sessão vinculados a thread.
  - `enabled`: chave mestre padrão (provedores podem substituir; o Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: padrão de desfoco automático por inatividade em horas (`0` desabilita; provedores podem substituir)
  - `maxAgeHours`: padrão de idade máxima rígida em horas (`0` desabilita; provedores podem substituir)

</Accordion>

---

## Mensagens

```json5
{
  messages: {
    responsePrefix: "🦞", // ou "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 desabilita
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefixo de resposta

Substituições por canal/conta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolução (o mais específico prevalece): conta → canal → global. `""` desabilita e interrompe a cascata. `"auto"` deriva `[{identity.name}]`.

**Variáveis de template:**

| Variável          | Descrição              | Exemplo                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo   | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provedor       | `anthropic`                 |
| `{thinkingLevel}` | Nível atual de thinking | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente | (igual a `"auto"`)          |

As variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de confirmação

- Usa `identity.emoji` do agente ativo por padrão; caso contrário `"👀"`. Defina `""` para desabilitar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove ack após resposta em Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: habilita reações de status de ciclo de vida em Slack, Discord e Telegram.
  Em Slack e Discord, deixar sem definir mantém reações de status habilitadas quando reações de ack estão ativas.
  No Telegram, defina explicitamente como `true` para habilitar reações de status de ciclo de vida.

### Debounce de entrada

Agrupa mensagens rápidas somente de texto do mesmo remetente em um único turno do agente. Mídia/anexos descarregam imediatamente. Comandos de controle ignoram debounce.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` controla auto-TTS. `/tts off|always|inbound|tagged` substitui por sessão.
- `summaryModel` substitui `agents.defaults.model.primary` para auto-summary.
- `modelOverrides` é habilitado por padrão; `modelOverrides.allowProvider` usa `false` por padrão (opt-in).
- Chaves de API usam `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY` como fallback.
- `openai.baseUrl` substitui o endpoint OpenAI TTS. A ordem de resolução é configuração, depois `OPENAI_TTS_BASE_URL` e depois `https://api.openai.com/v1`.
- Quando `openai.baseUrl` aponta para um endpoint que não é OpenAI, o OpenClaw o trata como servidor TTS compatível com OpenAI e relaxa a validação de modelo/voz.

---

## Talk

Padrões para o modo Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários provedores Talk estão configurados.
- Chaves legadas planas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) são compatíveis apenas por legado e são migradas automaticamente para `talk.providers.<provider>`.
- IDs de voz usam `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID` como fallback.
- `providers.*.apiKey` aceita strings em texto simples ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` aplica-se somente quando nenhuma chave de API Talk está configurada.
- `providers.*.voiceAliases` permite que diretivas de Talk usem nomes amigáveis.
- `silenceTimeoutMs` controla quanto tempo o modo Talk espera após o silêncio do usuário antes de enviar a transcrição. Quando não definido, mantém a janela de pausa padrão da plataforma (`700 ms no macOS e Android, 900 ms no iOS`).

---

## Ferramentas

### Perfis de ferramentas

`tools.profile` define uma allowlist base antes de `tools.allow`/`tools.deny`:

O onboarding local define novas configurações locais com `tools.profile: "coding"` por padrão quando não definido (perfis explícitos existentes são preservados).

| Perfil      | Inclui                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | apenas `session_status`                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                    |
| `full`      | Sem restrição (igual a não definir)                                                                                           |

### Grupos de ferramentas

| Grupo              | Ferramentas                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` é aceito como alias de `exec`)                                                   |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                        |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`     |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                 |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                         |
| `group:ui`         | `browser`, `canvas`                                                                                                           |
| `group:automation` | `cron`, `gateway`                                                                                                             |
| `group:messaging`  | `message`                                                                                                                     |
| `group:nodes`      | `nodes`                                                                                                                       |
| `group:agents`     | `agents_list`                                                                                                                 |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                            |
| `group:openclaw`   | Todas as ferramentas embutidas (exclui plugins de provedor)                                                                   |

### `tools.allow` / `tools.deny`

Política global de permitir/negar ferramentas (deny prevalece). Não diferencia maiúsculas de minúsculas, oferece suporte a curingas `*`. Aplicada mesmo quando o sandbox Docker está desativado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe ainda mais ferramentas para provedores ou modelos específicos. Ordem: perfil base → perfil do provedor → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Controla acesso elevado de exec fora do sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- A substituição por agente (`agents.list[].tools.elevated`) só pode restringir ainda mais.
- `/elevated on|off|ask|full` armazena estado por sessão; diretivas inline aplicam-se a uma única mensagem.
- `exec` elevado ignora o sandboxing e usa o caminho de escape configurado (`gateway` por padrão ou `node` quando o destino de exec é `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Verificações de segurança contra loops de ferramentas ficam **desabilitadas por padrão**. Defina `enabled: true` para ativar a detecção.
As configurações podem ser definidas globalmente em `tools.loopDetection` e substituídas por agente em `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: máximo de histórico de chamadas de ferramenta mantido para análise de loop.
- `warningThreshold`: limite de padrão repetitivo sem progresso para avisos.
- `criticalThreshold`: limite repetitivo maior para bloquear loops críticos.
- `globalCircuitBreakerThreshold`: limite rígido para parar qualquer execução sem progresso.
- `detectors.genericRepeat`: avisa sobre chamadas repetidas da mesma ferramenta/com os mesmos argumentos.
- `detectors.knownPollNoProgress`: avisa/bloqueia ferramentas de polling conhecidas (`process.poll`, `command_status` etc.).
- `detectors.pingPong`: avisa/bloqueia padrões alternados em pares sem progresso.
- Se `warningThreshold >= criticalThreshold` ou `criticalThreshold >= globalCircuitBreakerThreshold`, a validação falha.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // ou BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opcional; omita para detecção automática
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Configura entendimento de mídia recebida (imagem/áudio/vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: envia tarefas assíncronas de música/vídeo concluídas diretamente ao canal
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Campos de entrada de modelo de mídia">

**Entrada de provedor** (`type: "provider"` ou omitido):

- `provider`: id do provedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq` etc.)
- `model`: substituição de id de modelo
- `profile` / `preferredProfile`: seleção de perfil em `auth-profiles.json`

**Entrada CLI** (`type: "cli"`):

- `command`: executável a ser chamado
- `args`: args com template (suporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` etc.)

**Campos comuns:**

- `capabilities`: lista opcional (`image`, `audio`, `video`). Padrões: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: substituições por entrada.
- Falhas usam a próxima entrada como fallback.

A autenticação do provedor segue a ordem padrão: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**Campos de conclusão assíncrona:**

- `asyncCompletion.directSend`: quando `true`, tarefas assíncronas concluídas de `music_generate`
  e `video_generate` tentam primeiro entrega direta ao canal. Padrão: `false`
  (caminho legado de despertar sessão solicitante/entrega por modelo).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Controla quais sessões podem ser direcionadas pelas ferramentas de sessão (`sessions_list`, `sessions_history`, `sessions_send`).

Padrão: `tree` (sessão atual + sessões geradas por ela, como subagentes).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Observações:

- `self`: apenas a chave da sessão atual.
- `tree`: sessão atual + sessões geradas pela sessão atual (subagentes).
- `agent`: qualquer sessão pertencente ao id atual do agente (pode incluir outros usuários se você usar sessões por remetente sob o mesmo id de agente).
- `all`: qualquer sessão. Direcionamento entre agentes ainda exige `tools.agentToAgent`.
- Restrição de sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, a visibilidade é forçada para `tree` mesmo se `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controla suporte a anexos inline para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: defina true para permitir anexos de arquivo inline
        maxTotalBytes: 5242880, // 5 MB total em todos os arquivos
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB por arquivo
        retainOnSessionKeep: false, // mantém anexos quando cleanup="keep"
      },
    },
  },
}
```

Observações:

- Anexos são compatíveis apenas com `runtime: "subagent"`. O runtime ACP os rejeita.
- Arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/` com um `.manifest.json`.
- O conteúdo do anexo é automaticamente redigido da persistência da transcrição.
- Entradas base64 são validadas com verificações estritas de alfabeto/padding e proteção de tamanho antes da decodificação.
- Permissões de arquivo são `0700` para diretórios e `0600` para arquivos.
- A limpeza segue a política `cleanup`: `delete` sempre remove anexos; `keep` só os mantém quando `retainOnSessionKeep: true`.

### `tools.experimental`

Flags experimentais de ferramentas embutidas. Desativadas por padrão, a menos que uma regra de autoativação específica do runtime se aplique.

```json5
{
  tools: {
    experimental: {
      planTool: true, // habilita update_plan experimental
    },
  },
}
```

Observações:

- `planTool`: habilita a ferramenta estruturada `update_plan` para rastrear trabalho de várias etapas não trivial.
- Padrão: `false` para provedores não OpenAI. Execuções OpenAI e OpenAI Codex a habilitam automaticamente.
- Quando habilitada, o prompt do sistema também adiciona orientação de uso para que o modelo a use apenas em trabalho substancial e mantenha no máximo uma etapa `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modelo padrão para subagentes gerados. Se omitido, subagentes herdam o modelo do chamador.
- `allowAgents`: allowlist padrão de ids de agentes-alvo para `sessions_spawn` quando o agente solicitante não define seu próprio `subagents.allowAgents` (`["*"]` = qualquer; padrão: apenas o mesmo agente).
- `runTimeoutSeconds`: timeout padrão (segundos) para `sessions_spawn` quando a chamada da ferramenta omite `runTimeoutSeconds`. `0` significa sem timeout.
- Política de ferramenta por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provedores personalizados e base URLs

O OpenClaw usa o catálogo embutido de modelos. Adicione provedores personalizados via `models.providers` na configuração ou em `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (padrão) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Use `authHeader: true` + `headers` para necessidades de autenticação personalizadas.
- Substitua a raiz de configuração do agente com `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, um alias legado de variável de ambiente).
- Precedência de mesclagem para IDs de provedor correspondentes:
  - Valores `baseUrl` não vazios em `models.json` do agente prevalecem.
  - Valores `apiKey` não vazios do agente prevalecem apenas quando esse provedor não é gerenciado por SecretRef no contexto atual de config/auth-profile.
  - Valores `apiKey` de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec) em vez de persistir segredos resolvidos.
  - Valores de header de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec).
  - `apiKey`/`baseUrl` vazios ou ausentes no agente usam `models.providers` na configuração como fallback.
  - `contextWindow`/`maxTokens` de modelos correspondentes usam o valor mais alto entre configuração explícita e valores implícitos do catálogo.
  - `contextTokens` de modelos correspondentes preserva um limite explícito de runtime quando presente; use-o para limitar o contexto efetivo sem mudar metadados nativos do modelo.
  - Use `models.mode: "replace"` quando quiser que a configuração reescreva completamente `models.json`.
  - A persistência de marcador é autoritativa pela origem: marcadores são gravados a partir do snapshot ativo da configuração de origem (pré-resolução), não de valores secretos resolvidos em runtime.

### Detalhes dos campos do provedor

- `models.mode`: comportamento do catálogo de provedor (`merge` ou `replace`).
- `models.providers`: mapa de provedores personalizados, indexado por id do provedor.
- `models.providers.*.api`: adaptador de requisição (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` etc).
- `models.providers.*.apiKey`: credencial do provedor (prefira SecretRef/substituição por env).
- `models.providers.*.auth`: estratégia de autenticação (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, injeta `options.num_ctx` nas requisições (padrão: `true`).
- `models.providers.*.authHeader`: força o transporte da credencial no header `Authorization` quando necessário.
- `models.providers.*.baseUrl`: URL base da API upstream.
- `models.providers.*.headers`: headers estáticos extras para roteamento de proxy/tenant.
- `models.providers.*.request`: substituições de transporte para requisições HTTP do provedor de modelo.
  - `request.headers`: headers extras (mesclados com padrões do provedor). Valores aceitam SecretRef.
  - `request.auth`: substituição de estratégia de autenticação. Modos: `"provider-default"` (usa autenticação embutida do provedor), `"authorization-bearer"` (com `token`), `"header"` (com `headerName`, `value`, `prefix` opcional).
  - `request.proxy`: substituição de proxy HTTP. Modos: `"env-proxy"` (usa env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (com `url`). Ambos os modos aceitam um subobjeto opcional `tls`.
  - `request.tls`: substituição TLS para conexões diretas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceitam SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: entradas explícitas do catálogo de modelos do provedor.
- `models.providers.*.models.*.contextWindow`: metadados nativos de janela de contexto do modelo.
- `models.providers.*.models.*.contextTokens`: limite opcional de contexto em runtime. Use isso quando quiser um orçamento efetivo de contexto menor do que o `contextWindow` nativo do modelo.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: dica opcional de compatibilidade. Para `api: "openai-completions"` com `baseUrl` não vazio e não nativo (host diferente de `api.openai.com`), o OpenClaw força isso para `false` em runtime. `baseUrl` vazio/omitido mantém o comportamento padrão da OpenAI.
- `plugins.entries.amazon-bedrock.config.discovery`: raiz das configurações de auto-descoberta do Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: liga/desliga descoberta implícita.
- `plugins.entries.amazon-bedrock.config.discovery.region`: região AWS para descoberta.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional de provider-id para descoberta direcionada.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de polling para atualização da descoberta.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: janela de contexto de fallback para modelos descobertos.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: máximo de tokens de saída de fallback para modelos descobertos.

### Exemplos de provedores

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Use `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para Z.AI direto.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Defina `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`). Use refs `opencode/...` para o catálogo Zen ou refs `opencode-go/...` para o catálogo Go. Atalho: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Defina `ZAI_API_KEY`. `z.ai/*` e `z-ai/*` são aliases aceitos. Atalho: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint geral: `https://api.z.ai/api/paas/v4`
- Endpoint de coding (padrão): `https://api.z.ai/api/coding/paas/v4`
- Para o endpoint geral, defina um provedor personalizado com substituição de base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Para o endpoint da China: `baseUrl: "https://api.moonshot.cn/v1"` ou `openclaw onboard --auth-choice moonshot-api-key-cn`.

Os endpoints nativos Moonshot anunciam compatibilidade de uso de streaming no transporte compartilhado
`openai-completions`, e o OpenClaw agora baseia isso nas
capacidades do endpoint em vez de apenas no provider id embutido.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Compatível com Anthropic, provedor embutido. Atalho: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (compatível com Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

A base URL deve omitir `/v1` (o cliente Anthropic acrescenta isso). Atalho: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direto)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Defina `MINIMAX_API_KEY`. Atalhos:
`openclaw onboard --auth-choice minimax-global-api` ou
`openclaw onboard --auth-choice minimax-cn-api`.
O catálogo de modelos agora usa M2.7 apenas por padrão.
No caminho de streaming compatível com Anthropic, o OpenClaw desabilita o thinking do MiniMax
por padrão, a menos que você defina `thinking` explicitamente. `/fast on` ou
`params.fastMode: true` reescreve `MiniMax-M2.7` para
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelos locais (LM Studio)">

Consulte [Modelos locais](/pt-BR/gateway/local-models). Resumindo: execute um modelo local grande via API Responses do LM Studio em hardware robusto; mantenha modelos hospedados mesclados para fallback.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto simples
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opcional apenas para Skills embutidas (Skills gerenciadas/do workspace não são afetadas).
- `load.extraDirs`: raízes extras de Skills compartilhadas (menor precedência).
- `install.preferBrew`: quando true, prefere instaladores Homebrew quando `brew` está
  disponível, antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desabilita uma Skill mesmo que esteja embutida/instalada.
- `entries.<skillKey>.apiKey`: campo de conveniência de API key para Skills que declaram uma variável de ambiente primária (string em texto simples ou objeto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Carregados de `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` e `plugins.load.paths`.
- A descoberta aceita plugins nativos do OpenClaw e bundles compatíveis do Codex e Claude, inclusive bundles do Claude sem manifesto no layout padrão.
- **Mudanças de configuração exigem reinício do gateway.**
- `allow`: allowlist opcional (somente os plugins listados são carregados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniência de API key em nível de plugin (quando compatível com o plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o núcleo bloqueia `before_prompt_build` e ignora campos que alteram o prompt de `before_agent_start` legado, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks nativos de plugin e diretórios de hook fornecidos por bundles compatíveis.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste plugin para solicitar substituições por execução de `provider` e `model` para execuções em segundo plano de subagente.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de alvos canônicos `provider/model` para substituições confiáveis de subagente. Use `"*"` apenas quando quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo plugin (validado pelo schema nativo do plugin OpenClaw quando disponível).
- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de web-fetch Firecrawl.
  - `apiKey`: chave de API Firecrawl (aceita SecretRef). Usa `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` legado ou a variável de ambiente `FIRECRAWL_API_KEY` como fallback.
  - `baseUrl`: URL base da API Firecrawl (padrão: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrai apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima de cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: timeout da requisição de scrape em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do xAI X Search (busca web Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo Grok a usar para busca (por exemplo `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de dreaming de memória (experimental). Consulte [Dreaming](/concepts/dreaming) para fases e limites.
  - `enabled`: chave mestre de dreaming (padrão `false`).
  - `frequency`: cadência cron para cada varredura completa de dreaming (`"0 3 * * *"` por padrão).
  - política de fases e limites são detalhes de implementação (não são chaves de configuração voltadas ao usuário).
- Plugins de bundle Claude habilitados também podem contribuir com padrões embutidos de Pi a partir de `settings.json`; o OpenClaw os aplica como configurações sanitizadas do agente, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolhe o id do plugin de memória ativo, ou `"none"` para desabilitar plugins de memória.
- `plugins.slots.contextEngine`: escolhe o id do plugin de mecanismo de contexto ativo; usa `"legacy"` por padrão até você instalar e selecionar outro mecanismo.
- `plugins.installs`: metadados de instalação gerenciados pela CLI usados por `openclaw plugins update`.
  - Inclui `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trate `plugins.installs.*` como estado gerenciado; prefira comandos da CLI em vez de edições manuais.

Consulte [Plugins](/pt-BR/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // modo padrão de rede confiável
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` desabilita `act:evaluate` e `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` usa `true` por padrão quando não definido (modelo de rede confiável).
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` para navegação estritamente pública no browser.
- No modo estrito, endpoints remotos de perfil CDP (`profiles.*.cdpUrl`) ficam sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/descoberta.
- `ssrfPolicy.allowPrivateNetwork` permanece compatível como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente attach (start/stop/reset desabilitados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor lhe der uma URL direta de DevTools WebSocket.
- Perfis `existing-session` são apenas do host e usam Chrome MCP em vez de CDP.
- Perfis `existing-session` podem definir `userDataDir` para apontar a um perfil
  específico de navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais de rota do Chrome MCP:
  ações por snapshot/ref em vez de seleção por seletor CSS, hooks de upload de um arquivo,
  sem substituições de timeout de diálogo, sem `wait --load networkidle` e sem
  `responsebody`, exportação PDF, interceptação de download ou ações em lote.
- Perfis locais gerenciados `openclaw` atribuem automaticamente `cdpPort` e `cdpUrl`; defina
  `cdpUrl` explicitamente apenas para CDP remoto.
- Ordem de autodetecção: navegador padrão se for baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Serviço de controle: somente loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização ao Chromium local (por exemplo
  `--disable-gpu`, tamanho de janela ou flags de depuração).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texto curto, URL de imagem ou data URI
    },
  },
}
```

- `seamColor`: cor de destaque para o chrome da UI nativa do app (matiz da bolha do modo Talk etc.).
- `assistant`: substituição de identidade da Control UI. Usa a identidade do agente ativo como fallback.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // ou OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // para mode=trusted-proxy; consulte /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // obrigatório para Control UI fora de loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo perigoso de fallback de origem por Host header
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Opcional. Padrão false.
    allowRealIpFallback: false,
    tools: {
      // Negações HTTP adicionais em /tools/invoke
      deny: ["browser"],
      // Remove ferramentas da lista padrão de negação HTTP
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detalhes dos campos do gateway">

- `mode`: `local` (executa gateway) ou `remote` (conecta a gateway remoto). O Gateway se recusa a iniciar a menos que seja `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (apenas IP Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind padrão `loopback` escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Auth**: exigida por padrão. Binds fora de loopback exigem autenticação do gateway. Na prática, isso significa um token/senha compartilhado ou um reverse proxy com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados ao mesmo tempo (inclusive via SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. A inicialização e os fluxos de instalação/reparo do serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use apenas em configurações confiáveis de local loopback; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação a um reverse proxy com reconhecimento de identidade e confia em headers de identidade vindos de `gateway.trustedProxies` (consulte [Autenticação com proxy confiável](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **fora de loopback**; reverse proxies na mesma máquina via loopback não satisfazem a autenticação trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, headers de identidade do Tailscale Serve podem satisfazer a autenticação da Control UI/WebSocket (verificado via `tailscale whois`). Endpoints da API HTTP **não** usam essa autenticação por header do Tailscale; eles seguem o modo normal de auth HTTP do gateway. Esse fluxo sem token pressupõe que o host do gateway é confiável. Usa `true` por padrão quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de auth. Aplica-se por IP do cliente e por escopo de auth (segredo compartilhado e token de dispositivo são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono de Control UI via Tailscale Serve, tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes do registro da falha. Tentativas ruins concorrentes do mesmo cliente podem, portanto, acionar o limitador na segunda requisição em vez de ambas passarem como meras divergências.
  - `gateway.auth.rateLimit.exemptLoopback` usa `true` por padrão; defina `false` quando quiser intencionalmente que tráfego localhost também passe por rate limit (para configurações de teste ou implantações rígidas com proxy).
- Tentativas de autenticação WS originadas do navegador sempre são limitadas com a isenção de loopback desabilitada (defesa em profundidade contra força bruta localhost via navegador).
- Em loopback, esses bloqueios por origem de navegador são isolados por valor
  `Origin` normalizado, para que falhas repetidas de uma origem localhost não
  bloqueiem automaticamente uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind em loopback) ou `funnel` (público, exige auth).
- `controlUi.allowedOrigins`: allowlist explícita de origem do navegador para conexões WebSocket do Gateway. Obrigatória quando clientes de navegador são esperados fora de origens loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem por Host header para implantações que dependem intencionalmente de política de origem baseada em Host header.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição break-glass do lado do cliente que permite `ws://` em texto simples para IPs privados confiáveis; o padrão continua sendo texto simples apenas em loopback.
- `gateway.remote.token` / `.password` são campos de credencial do cliente remoto. Eles não configuram a autenticação do gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS para o relay APNs externo usado por builds oficiais/TestFlight iOS depois que eles publicam registros baseados em relay para o gateway. Essa URL deve corresponder à URL do relay compilada na build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout de envio do gateway para o relay em milissegundos. Padrão: `10000`.
- Registros baseados em relay são delegados a uma identidade específica do gateway. O app iOS emparelhado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha um grant de envio com escopo de registro ao gateway. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias por env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch somente para desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de saúde do canal em minutos. Defina `0` para desabilitar reinícios globais do monitor de saúde. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinícios do monitor de saúde por canal/conta em uma hora contínua. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out por canal para reinícios do monitor de saúde, mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com várias contas. Quando definido, tem precedência sobre a substituição em nível de canal.
- Caminhos locais de chamada do gateway podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha em modo fechado (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de reverse proxy que terminam TLS ou injetam headers de cliente encaminhado. Liste apenas proxies sob seu controle. Entradas loopback ainda são válidas para configurações de detecção local/proxy na mesma máquina (por exemplo Tailscale Serve ou um reverse proxy local), mas **não** tornam requisições loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.tools.deny`: nomes extras de ferramentas bloqueadas para HTTP `POST /tools/invoke` (estende a lista padrão de negação).
- `gateway.tools.allow`: remove nomes de ferramentas da lista padrão de negação HTTP.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desabilitado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Endurecimento de entrada por URL da Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlists vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desabilitar busca por URL.
- Header opcional de endurecimento de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS sob seu controle; consulte [Autenticação com proxy confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de várias instâncias

Execute vários gateways em um único host com portas e diretórios de estado exclusivos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --