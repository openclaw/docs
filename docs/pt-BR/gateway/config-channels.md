---
read_when:
    - Configurando um plugin de canal (autenticação, controle de acesso, múltiplas contas)
    - Solução de problemas de chaves de configuração por canal
    - Auditoria da política de DMs, da política de grupos ou do controle de menções
summary: 'Configuração de canais: controle de acesso, emparelhamento e chaves por canal no Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros.'
title: Configuração — canais
x-i18n:
    generated_at: "2026-07-16T12:28:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

Chaves de configuração por canal em `channels.*`: acesso a mensagens diretas e grupos, configurações com várias contas, exigência de menção e chaves específicas por canal para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros plugins de canal.

Para agentes, ferramentas, runtime do Gateway e outras chaves de nível superior, consulte a [referência de configuração](/pt-BR/gateway/configuration-reference).

## Canais

Cada canal é iniciado automaticamente quando sua seção de configuração existe (a menos que `enabled: false`). Telegram e iMessage são fornecidos no pacote principal `openclaw`. Outros canais oficiais (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost e outros) são instalados como plugins separados com `openclaw plugins install <spec>`; consulte [Canais](/pt-BR/channels) para ver a lista completa e as especificações de instalação.

### Acesso a mensagens diretas e grupos

Todos os canais oferecem suporte a políticas de mensagens diretas e de grupos:

| Política de mensagens diretas | Comportamento                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (padrão) | Remetentes desconhecidos recebem um código de pareamento de uso único; o proprietário deve aprovar |
| `allowlist`         | Somente remetentes em `allowFrom` (ou no armazenamento de permissões pareadas)             |
| `open`              | Permite todas as mensagens diretas recebidas (requer `allowFrom: ["*"]`)             |
| `disabled`          | Ignora todas as mensagens diretas recebidas                                          |

| Política de grupo          | Comportamento                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (padrão) | Somente grupos correspondentes à lista de permissões configurada          |
| `open`                | Ignora as listas de permissões de grupos (a exigência de menção ainda se aplica) |
| `disabled`            | Bloqueia todas as mensagens de grupos/salas                          |

<Note>
`channels.defaults.groupPolicy` define o padrão quando o `groupPolicy` de um provedor não está definido.
Os códigos de pareamento expiram após 1 hora. As solicitações de pareamento pendentes são limitadas a **3 por conta** (com escopo definido pelo canal e pelo ID da conta).
Se um bloco de provedor estiver totalmente ausente (`channels.<provider>` ausente), a política de grupo do runtime recorrerá a `allowlist` (falha de modo fechado), com um aviso na inicialização.
</Note>

### Substituições de modelo por canal

Use `channels.modelByChannel` para fixar IDs de canais específicos ou pares de mensagens diretas a um modelo. Os valores aceitam `provider/model` ou aliases de modelo configurados. O mapeamento de canais só se aplica quando uma sessão ainda não possui uma substituição de modelo ativa (por exemplo, uma definida por meio de `/model`).

Para conversas em grupos/threads, as chaves são IDs de grupos específicos do canal, IDs de tópicos ou nomes de canais. Para conversas por mensagem direta (DM), as chaves são identificadores de pares derivados da identidade do remetente do canal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` ou `SenderId`). O formato exato da chave depende do canal:

| Canal  | Formato da chave de DM         | Exemplo                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | ID bruto do usuário         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | ID de usuário do Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ID bruto do usuário         | `123456789`                                  |
| WhatsApp | número de telefone ou JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

As chaves específicas de DM correspondem somente a conversas por mensagem direta; elas não afetam o roteamento de grupos/threads.

### Padrões de canal e Heartbeat

Use `channels.defaults` para compartilhar o comportamento de políticas de grupo e Heartbeat entre provedores:

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

- `channels.defaults.groupPolicy`: política de grupo alternativa quando o `groupPolicy` no nível do provedor não está definido.
- `channels.defaults.contextVisibility`: modo padrão de visibilidade do contexto complementar para todos os canais. Valores: `all` (padrão, inclui todo o contexto de citações/threads/histórico), `allowlist` (inclui somente o contexto de remetentes na lista de permissões), `allowlist_quote` (igual à lista de permissões, mas mantém o contexto explícito de citação/resposta). Substituição por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: inclui os status dos canais íntegros na saída do Heartbeat (padrão `false`).
- `channels.defaults.heartbeat.showAlerts`: inclui status degradados/de erro na saída do Heartbeat (padrão `true`).
- `channels.defaults.heartbeat.useIndicator`: renderiza a saída compacta do Heartbeat no estilo de indicador (padrão `true`).

### WhatsApp

O WhatsApp é executado pelo canal web do Gateway (Baileys Web). Ele é iniciado automaticamente quando existe uma sessão vinculada.

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = tentar novamente para sempre
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // marcas azuis (false no modo de conversa consigo mesmo)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `web.whatsapp.keepAliveIntervalMs` (padrão `25000`), `connectTimeoutMs` (padrão `60000`) e `defaultQueryTimeoutMs` (padrão `60000`) ajustam o socket do Baileys.
- Padrões de `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0` tenta novamente para sempre, em vez de desistir.
- As entradas `bindings[]` de nível superior com `type: "acp"` configuram associações ACP persistentes para mensagens diretas e grupos do WhatsApp. Use um número direto no formato E.164 ou um JID de grupo do WhatsApp em `match.peer.id`. A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).

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

- Por padrão, os comandos de saída usam a conta `default`, se ela estiver presente; caso contrário, usam o primeiro ID de conta configurado (em ordem).
- O `channels.whatsapp.defaultAccount` opcional substitui essa seleção alternativa de conta padrão quando corresponde a um ID de conta configurado.
- O diretório de autenticação legado do Baileys para uma única conta é migrado por `openclaw doctor` para `whatsapp/default`.
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
          systemPrompt: "Mantenha as respostas breves.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Mantenha-se no tópico.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Backup do Git" },
        { command: "generate", description: "Criar uma imagem" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: { mode: "partial" }, // off | partial | block | progress (padrão: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token do bot: `channels.telegram.botToken` ou `channels.telegram.tokenFile` (somente arquivo comum; links simbólicos são rejeitados), com `TELEGRAM_BOT_TOKEN` como alternativa para a conta padrão.
- `apiRoot` é somente a raiz da API de bots do Telegram. Use `https://api.telegram.org` ou sua raiz auto-hospedada/de proxy, não `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` remove um sufixo `/bot<TOKEN>` final adicionado por engano.
- Para um servidor da API de bots auto-hospedado no modo `--local`, `trustedLocalFileRoots` lista os caminhos do host que o OpenClaw pode ler. Monte o volume de dados do servidor no host do OpenClaw e configure a raiz de dados ou o diretório por token; os caminhos do contêiner em `/var/lib/telegram-bot-api` são mapeados para essas raízes. Outros caminhos absolutos continuam sendo rejeitados.
- O `channels.telegram.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde a um ID de conta configurado.
- Em configurações com várias contas (2 ou mais IDs de conta), defina explicitamente uma conta padrão (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) para evitar o roteamento alternativo; `openclaw doctor` avisa quando ela está ausente ou é inválida.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Telegram (migrações de ID de supergrupo, `/config set|unset`).
- As entradas `bindings[]` de nível superior com `type: "acp"` configuram associações ACP persistentes para tópicos de fórum (use o `chatId:topic:topicId` canônico em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).
- As prévias de streaming do Telegram usam `sendMessage` + `editMessageText` (funciona em conversas diretas e em grupo).
- `network.dnsResultOrder` usa `"ipv4first"` por padrão para evitar falhas comuns de obtenção via IPv6.
- Política de novas tentativas: consulte [Política de novas tentativas](/pt-BR/concepts/retry).

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
              systemPrompt: "Somente respostas curtas.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (padrão do Discord: progress)
        chunkMode: "length", // length | newline
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

- Token: `channels.discord.token`, com `DISCORD_BOT_TOKEN` como alternativa para a conta padrão.
- Chamadas diretas de saída que fornecem um `token` explícito do Discord usam esse token para a chamada; as configurações de repetição/política da conta ainda vêm da conta selecionada no snapshot ativo do runtime.
- O `channels.discord.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde ao ID de uma conta configurada.
- Use `user:<id>` (DM) ou `channel:<id>` (canal do servidor) para destinos de entrega; IDs numéricos isolados são rejeitados.
- Os slugs de servidores usam letras minúsculas, com espaços substituídos por `-`; as chaves de canal usam o nome convertido em slug (sem `#`). Prefira IDs de servidores.
- Mensagens criadas por bots são ignoradas por padrão. `allowBots: true` as habilita; use `allowBots: "mentions"` para aceitar somente mensagens de bots que mencionem o bot (as próprias mensagens continuam sendo filtradas).
- Canais que aceitam mensagens de entrada criadas por bots podem usar a [proteção compartilhada contra loops de bots](/pt-BR/channels/bot-loop-protection). Defina `channels.defaults.botLoopProtection` para os limites básicos por par e substitua-os no canal ou na conta somente quando uma dessas superfícies precisar de limites diferentes.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e as substituições por canal) descarta mensagens que mencionem outro usuário ou cargo, mas não o bot (exceto @everyone/@here).
- `channels.discord.mentionAliases` mapeia o texto estável `@handle` de saída para IDs de usuários do Discord antes do envio, permitindo mencionar colegas conhecidos de forma determinística mesmo quando o cache transitório do diretório está vazio. As substituições por conta ficam em `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (padrão: `17`) divide mensagens com muitas linhas mesmo quando têm menos de 2000 caracteres.
- `channels.discord.suppressEmbeds` usa `true` por padrão, portanto URLs de saída não são expandidas em prévias de links do Discord, a menos que essa opção seja desabilitada. Payloads `embeds` explícitos continuam sendo enviados normalmente; chamadas de ferramenta por mensagem podem substituir esse comportamento com `suppressEmbeds`.
- `channels.discord.threadBindings` controla o roteamento do Discord vinculado a threads:
  - `enabled`: substituição do Discord para recursos de sessão vinculados a threads (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e entrega/roteamento vinculados)
  - `idleHours`: substituição do Discord para perda automática de foco por inatividade, em horas (`0` desabilita)
  - `maxAgeHours`: substituição do Discord para a idade máxima absoluta, em horas (`0` desabilita)
  - `spawnSessions`: opção para criação/vinculação automática de threads por `sessions_spawn({ thread: true })` e geração de threads do ACP (padrão: `true`)
  - `defaultSpawnContext`: contexto nativo do subagente para gerações vinculadas a threads (`"fork"` por padrão)
- Entradas `bindings[]` de nível superior com `type: "acp"` configuram vínculos persistentes do ACP para canais e threads (use o ID do canal/thread em `match.peer.id`). A semântica dos campos é compartilhada em [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` define a cor de destaque dos contêineres de componentes v2 do Discord.
- `channels.discord.agentComponents.ttlMs` controla por quanto tempo callbacks enviados de componentes do Discord permanecem registrados. Padrão: `1800000` (30 minutos); máximo: `86400000` (24 horas). As substituições por conta ficam em `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Prefira o TTL mais curto adequado ao fluxo de trabalho.
- `channels.discord.voice` habilita conversas em canais de voz do Discord e substituições opcionais de entrada automática + LLM + TTS. Configurações do Discord somente para texto mantêm a voz desabilitada por padrão; defina `channels.discord.voice.enabled=true` para habilitá-la.
- `channels.discord.voice.model` substitui opcionalmente o modelo de LLM usado nas respostas de canais de voz do Discord.
- `channels.discord.voice.daveEncryption` (padrão: `true`) e `channels.discord.voice.decryptionFailureTolerance` (padrão: `24`) são repassados às opções DAVE de `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` controla a espera inicial pelo estado Ready de `@discordjs/voice` para `/vc join` e tentativas de entrada automática (padrão: `30000`).
- `channels.discord.voice.reconnectGraceMs` controla quanto tempo uma sessão de voz desconectada pode levar para iniciar a sinalização de reconexão antes que o OpenClaw a encerre (padrão: `15000`).
- A reprodução de voz do Discord não é interrompida pelo evento de início de fala de outro usuário. Para evitar loops de realimentação, o OpenClaw ignora novas capturas de voz durante a reprodução de TTS.
- Além disso, o OpenClaw tenta recuperar a recepção de voz saindo e entrando novamente em uma sessão de voz após falhas repetidas de descriptografia.
- `channels.discord.streaming` é a chave canônica do modo de streaming. O padrão do Discord é `streaming.mode: "progress"`, para que o progresso de ferramentas/trabalho apareça em uma única mensagem de prévia editada; defina `streaming.mode: "off"` para desabilitá-lo. Chaves legadas simples (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) não são mais lidas durante a execução; execute `openclaw doctor --fix` para migrar a configuração persistida.
- `channels.discord.autoPresence` mapeia a disponibilidade do runtime para a presença do bot (saudável => online, degradado => idle, esgotado => dnd) e permite substituições opcionais do texto de status.
- `channels.discord.guilds.<id>.presenceEvents` encaminha chegadas de disponibilidade humana para um canal configurado do Discord como eventos de sistema do agente. Os membros elegíveis devem poder visualizar `channelId`; threads públicas herdam a visibilidade do canal pai, enquanto threads privadas também exigem participação ou Manage Threads. `users` pode restringir ainda mais esse público. Ele preenche inicialmente os membros online atuais a partir de snapshots completos de `GUILD_CREATE`, encaminha transições observadas de offline para online e trata o primeiro sinal online posterior de um membro ainda não visto como uma nova disponibilidade, sem afirmar se ele ficou online ou entrou após o snapshot. Servidores acima do limite de snapshot de 75.000 membros do Discord exigem primeiro uma atualização offline explícita. Controles de limitação: `reconnectSuppressSeconds` (janela de silêncio após uma nova sessão do Gateway enquanto o estado de presença do servidor é reconstruído; padrão: 300; `0` desabilita) e `burstLimit`/`burstWindowSeconds` (limite por servidor da taxa de eventos enfileirados com sucesso; padrão: 8 eventos por janela deslizante de 60s). Sessões retomadas não iniciam a janela de supressão de reconexão. O intervalo existente de oito horas antes de uma nova saudação por usuário permanece. Isso requer `channels.discord.intents.presence=true`, o Presence Intent privilegiado no Developer Portal do Discord e um Heartbeat de agente habilitado.
- `channels.discord.dangerouslyAllowNameMatching` reabilita a correspondência mutável por nome/tag (modo de compatibilidade emergencial).
- `channels.discord.execApprovals`: entrega de aprovação de execução nativa do Discord e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, as aprovações de execução são ativadas quando os aprovadores podem ser resolvidos a partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuários do Discord autorizados a aprovar solicitações de execução. Quando omitido, usa `commands.ownerAllowFrom` como alternativa.
  - `agentFilter`: lista de permissões opcional de IDs de agentes. Omita para encaminhar aprovações para todos os agentes.
  - `sessionFilter`: padrões opcionais de chave de sessão (substring ou expressão regular).
  - `target`: onde enviar solicitações de aprovação. `"dm"` (padrão) envia DMs aos aprovadores, `"channel"` envia ao canal de origem e `"both"` envia a ambos. Quando o destino inclui `"channel"`, os botões só podem ser usados pelos aprovadores resolvidos.
  - `cleanupAfterResolve`: quando `true`, exclui as DMs de aprovação após aprovação, negação ou expiração.

**Modos de notificação de reações:** `off` (nenhuma), `own` (mensagens do bot, padrão), `all` (todas as mensagens), `allowlist` (de `guilds.<id>.users` em todas as mensagens).

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

- JSON da conta de serviço: embutido (`serviceAccount`) ou baseado em arquivo (`serviceAccountFile`).
- Também há suporte a SecretRef da conta de serviço (`serviceAccountRef`).
- Alternativas por variável de ambiente: `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (somente para a conta padrão).
- Use `spaces/<spaceId>` ou `users/<userId>` para destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` reabilita a correspondência mutável do principal por e-mail (modo de compatibilidade emergencial).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Somente respostas curtas.",
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
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // usa a API de streaming nativa do Slack quando mode=partial
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

- O **modo Socket** exige `botToken` e `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para o fallback de ambiente da conta padrão).
- O **modo HTTP** exige `botToken` mais `signingSecret` (na raiz ou por conta).
- `enterpriseOrgInstall: true` habilita uma conta para o caminho de eventos em toda a
  organização do Slack Enterprise Grid. Na inicialização, o token do bot é verificado com `auth.test`, e
  ocorre uma falha quando o modo configurado não corresponde à identidade de instalação do Slack.
  As DMs corporativas devem ser desabilitadas ou usar `dmPolicy: "open"` com um
  `allowFrom: ["*"]` efetivo. As políticas de canais e usuários devem usar IDs estáveis do Slack;
  nomes mutáveis e prefixos de canal sem suporte causam falha na inicialização. A V1 processa apenas
  eventos diretos do Socket Mode ou HTTP `message` e `app_mention`, com respostas
  imediatas; retransmissão, comandos, interações, App Home, listeners de eventos de reação,
  fixações, ferramentas de ação, aprovações nativas, vinculações, entrega adiada e
  envios proativos não estão disponíveis. Confirmações, digitação e
  reações de status controladas pelo listener continuam disponíveis com `reactions:write`; notificações
  de reações recebidas e ferramentas de ação de reação não estão disponíveis. Consulte
  [instalações em toda a organização do Enterprise Grid](/pt-BR/channels/slack#enterprise-grid-org-wide-installs)
  para ver o manifesto de privilégio mínimo, o fluxo de configuração e todas as restrições.
- `socketMode` encaminha os ajustes de transporte do Socket Mode do SDK do Slack para a API pública do receptor Bolt. Use-o somente ao investigar tempos limite de ping/pong ou comportamento de websocket obsoleto. `clientPingTimeout` tem como padrão `15000`; `serverPingTimeout` e `pingPongLoggingEnabled` são encaminhados somente quando configurados.
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings de texto simples
  ou objetos SecretRef.
- Os snapshots de contas do Slack expõem campos de origem/status por credencial, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, no modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que a conta está
  configurada por meio de SecretRef, mas o caminho atual de comando/runtime não conseguiu
  resolver o valor do segredo.
- `configWrites: false` bloqueia gravações de configuração iniciadas pelo Slack.
- O `channels.slack.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde ao ID de uma conta configurada.
- `channels.slack.streaming.mode` é a chave canônica do modo de streaming do Slack (padrão `"partial"`). `channels.slack.streaming.nativeTransport` controla o transporte de streaming nativo do Slack (padrão `true`). Os valores legados `streamMode`, o booleano `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` e `nativeStreaming` não são mais lidos durante a execução; execute `openclaw doctor --fix` para migrar a configuração persistida para `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` e `unfurlMedia` encaminham os booleanos de expansão de links e mídia `chat.postMessage` do Slack para respostas do bot. `unfurlLinks` tem como padrão `false`, portanto os links enviados pelo bot não são expandidos em linha, a menos que isso seja habilitado; `unfurlMedia` é omitido, a menos que esteja configurado. Defina qualquer um dos valores em `channels.slack.accounts.<accountId>` para substituir o valor de nível superior para uma conta.
- Use `user:<id>` (DM) ou `channel:<id>` como destinos de entrega.

**Modos de notificação de reações:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

**Isolamento de sessão por thread:** `thread.historyScope` é por thread (padrão) ou compartilhado em todo o canal. `thread.inheritParent` copia a transcrição do canal pai para novas threads. `thread.initialHistoryLimit` (padrão `20`) limita quantas mensagens existentes da thread são buscadas quando uma nova sessão de thread é iniciada; `0` desabilita a busca do histórico da thread.

- O streaming nativo do Slack e o status de thread "is typing..." no estilo do assistente do Slack exigem um destino de thread de resposta. As DMs de nível superior permanecem fora de threads por padrão, portanto ainda podem transmitir por meio das prévias de publicação e edição de rascunho do Slack, em vez de exibir a prévia de streaming/status nativa no estilo de thread.
- `typingReaction` adiciona uma reação temporária à mensagem recebida do Slack enquanto uma resposta está em execução e a remove após a conclusão. Use um shortcode de emoji do Slack, como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega do cliente de aprovação nativo do Slack e autorização do aprovador de execução. Mesmo esquema do Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuário do Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` ou `"both"`). As aprovações de Plugin podem usar esse caminho de cliente nativo para solicitações originadas no Slack quando os aprovadores do Plugin do Slack são resolvidos; a entrega de aprovação de Plugin nativa do Slack também pode ser habilitada por meio de `approvals.plugin` para sessões originadas no Slack ou destinos do Slack. As aprovações de Plugin usam os aprovadores do Plugin do Slack definidos em `allowFrom` e o roteamento padrão, não os aprovadores de execução.

| Grupo de ações | Padrão    | Observações                     |
| -------------- | --------- | ------------------------------- |
| reactions      | habilitado | Reagir + listar reações         |
| messages       | habilitado | Ler/enviar/editar/excluir       |
| pins           | habilitado | Fixar/desafixar/listar          |
| memberInfo     | habilitado | Informações do membro           |
| emojiList      | habilitado | Lista de emojis personalizados  |

### Mattermost

O Mattermost é instalado como um Plugin separado, da mesma forma que Discord, Slack e WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Consulte [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) para verificar as dist-tags atuais antes de fixar uma versão.

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
      streaming: { chunkMode: "length" },
    },
  },
}
```

Modos de chat: `oncall` (responder mediante @menção, padrão), `onmessage` (todas as mensagens), `onchar` (mensagens que começam com o prefixo de acionamento).

Quando os comandos nativos do Mattermost estão habilitados:

- `commands.callbackPath` deve ser um caminho (por exemplo, `/api/channels/mattermost/command`), não uma URL completa.
- `commands.callbackUrl` deve resolver para o endpoint do Gateway do OpenClaw e estar acessível pelo servidor do Mattermost.
- Os callbacks de comandos de barra nativos são autenticados com os tokens por comando retornados
  pelo Mattermost durante o registro do comando de barra. Se o registro falhar ou nenhum
  comando for ativado, o OpenClaw rejeitará os callbacks com
  `Unauthorized: invalid command token.`
- Para hosts de callback privados, internos ou da tailnet, o Mattermost pode exigir
  que `ServiceSettings.AllowedUntrustedInternalConnections` inclua o host/domínio do callback.
  Use valores de host/domínio, não URLs completas.
- `channels.mattermost.configWrites`: permitir ou negar gravações de configuração iniciadas pelo Mattermost.
- `channels.mattermost.requireMention`: exigir `@mention` antes de responder nos canais.
- `channels.mattermost.groups.<channelId>.requireMention`: substituição da exigência de menção por canal (`"*"` para o padrão).
- O `channels.mattermost.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde ao ID de uma conta configurada.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // vinculação de conta opcional
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

**Modos de notificação de reações:** `off`, `own` (padrão), `all`, `allowlist` (de `reactionAllowlist`).

- `channels.signal.account`: vincula a inicialização do canal a uma identidade de conta específica do Signal.
- `channels.signal.configWrites`: permitir ou negar gravações de configuração iniciadas pelo Signal.
- O `channels.signal.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde ao ID de uma conta configurada.

### iMessage

O OpenClaw inicia `imsg rpc` (JSON-RPC por stdio). Nenhum daemon ou porta é necessário. Esse é o caminho recomendado para novas configurações do iMessage no OpenClaw quando o host pode conceder permissões para o banco de dados do Mensagens e para Automação.

O suporte ao BlueBubbles foi removido. `channels.bluebubbles` não é uma superfície de configuração de runtime compatível com o OpenClaw atual. Migre configurações antigas para `channels.imessage`; consulte [Remoção do BlueBubbles e o caminho imsg do iMessage](/pt-BR/announcements/bluebubbles-imessage) para a versão resumida e [Migração do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) para a tabela de tradução completa.

Se o Gateway não estiver sendo executado no Mac com sessão iniciada no Mensagens, mantenha `channels.imessage.enabled=true` e defina `channels.imessage.cliPath` como um wrapper SSH que execute `imsg "$@"` nesse Mac. O caminho local padrão `imsg` funciona somente no macOS.

Antes de depender de um wrapper SSH para envios em produção, verifique um `imsg send` de saída por meio desse wrapper exato. Alguns estados do TCC do macOS atribuem a Automação do Mensagens a `/usr/libexec/sshd-keygen-wrapper`, o que pode permitir o funcionamento de leituras e sondagens enquanto os envios falham com AppleEvents `-1743`; consulte a seção de solução de problemas do wrapper SSH em [iMessage](/pt-BR/channels/imessage).

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

- O `channels.imessage.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde ao ID de uma conta configurada.
- Requer Acesso Total ao Disco para o banco de dados do Mensagens.
- Prefira destinos `chat_id:<id>`. Use `imsg chats --limit 20` para listar conversas.
- `cliPath` pode apontar para um wrapper SSH; defina `remoteHost` (`host` ou `user@host`) para buscar anexos via SCP.
- `attachmentRoots` e `remoteAttachmentRoots` restringem os caminhos de anexos recebidos (padrão: `/Users/*/Library/Messages/Attachments`).
- O SCP usa verificação rigorosa da chave do host, portanto, certifique-se de que a chave do host de retransmissão já exista em `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite ou nega gravações de configuração iniciadas pelo iMessage.
- `channels.imessage.sendTransport`: transporte preferencial de envio RPC do `imsg` para respostas de saída normais. `auto` (padrão) usa a ponte IMCore para conversas existentes quando ela está em execução e, depois, recorre ao AppleScript; `bridge` exige entrega por API privada; `applescript` força o caminho público de automação do Mensagens.
- `channels.imessage.actions.*`: habilita ações de API privada que também são controladas por `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` fica desativado por padrão; defina-o como `true` antes de esperar mídia recebida nos turnos do agente.
- A recuperação de mensagens recebidas após a reinicialização de uma ponte ou do Gateway é automática (desduplicação por GUID e um limite de idade para o backlog obsoleto). As configurações `channels.imessage.catchup.enabled: true` existentes ainda são respeitadas como um perfil de compatibilidade obsoleto; `catchup` fica desativado por padrão.
- `channels.imessage.groups`: registro de grupos e configurações por grupo. Com `groupPolicy: "allowlist"`, configure chaves `chat_id` explícitas ou uma entrada curinga `"*"` para que as mensagens de grupo possam passar pelo controle do registro.
- As entradas `bindings[]` de nível superior com `type: "acp"` podem vincular conversas do iMessage a sessões ACP persistentes. Use um identificador normalizado ou um destino de conversa explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) em `match.peer.id`. Semântica dos campos compartilhados: [Agentes ACP](/pt-BR/tools/acp-agents#persistent-channel-bindings).

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
- `channels.matrix.proxy` encaminha o tráfego HTTP do Matrix por meio de um proxy HTTP(S) explícito. Contas nomeadas podem substituí-lo com `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` e essa adesão de rede são controles independentes.
- `channels.matrix.defaultAccount` seleciona a conta preferencial em configurações com várias contas.
- `channels.matrix.autoJoin` usa `"off"` por padrão, portanto, salas para as quais houve convite e novos convites no estilo de mensagens diretas são ignorados até que `autoJoin: "allowlist"` seja definido com `autoJoinAllowlist` ou `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa do Matrix para aprovação de execução e autorização de aprovadores.
  - `enabled`: `true`, `false` ou `"auto"` (padrão). No modo automático, as aprovações de execução são ativadas quando os aprovadores podem ser determinados por `approvers` ou `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuário do Matrix (por exemplo, `@owner:example.org`) autorizados a aprovar solicitações de execução.
  - `agentFilter`: lista de permissões opcional de IDs de agentes. Omita para encaminhar aprovações de todos os agentes.
  - `sessionFilter`: padrões opcionais de chaves de sessão (substring ou expressão regular).
  - `target`: para onde enviar solicitações de aprovação. `"dm"` (padrão), `"channel"` (sala de origem) ou `"both"`.
  - Substituições por conta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla como as mensagens diretas do Matrix são agrupadas em sessões: `per-user` (padrão) compartilha por par encaminhado, enquanto `per-room` isola cada sala de mensagens diretas.
- As sondagens de status do Matrix e as consultas em tempo real ao diretório usam a mesma política de proxy que o tráfego de execução.
- A configuração completa do Matrix, as regras de direcionamento e os exemplos de configuração estão documentados em [Matrix](/pt-BR/channels/matrix).

### Microsoft Teams

Microsoft Teams é baseado em Plugin e configurado em `channels.msteams`.

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

- Principais caminhos de chaves abordados aqui: `channels.msteams`, `channels.msteams.configWrites`.
- A configuração completa do Teams (credenciais, webhook, política de mensagens diretas/grupos e substituições por equipe/canal) está documentada em [Microsoft Teams](/pt-BR/channels/msteams).

### IRC

O IRC é baseado em Plugin e configurado em `channels.irc`.

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

- Principais caminhos de chaves abordados aqui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- O `channels.irc.defaultAccount` opcional substitui a seleção da conta padrão quando corresponde ao ID de uma conta configurada.
- A configuração completa do canal IRC (host/porta/TLS/canais/listas de permissões/controle por menção) está documentada em [IRC](/pt-BR/channels/irc).

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

- `default` é usado quando `accountId` é omitido (CLI + encaminhamento).
- Os tokens de ambiente se aplicam apenas à conta **padrão**.
- As configurações básicas do canal se aplicam a todas as contas, exceto quando substituídas por conta.
- Use `bindings[].match.accountId` para encaminhar cada conta a um agente diferente.
- Se uma conta não padrão for adicionada por meio de `openclaw channels add` (ou da integração do canal) enquanto ainda estiver sendo usada uma configuração de canal de nível superior com uma única conta, o OpenClaw primeiro promove os valores de nível superior com escopo de conta única para o mapa de contas do canal, para que a conta original continue funcionando. A maioria dos canais os move para `channels.<channel>.accounts.default`; o Matrix pode preservar um destino nomeado/padrão existente que corresponda.
- Os vínculos existentes apenas de canal (sem `accountId`) continuam correspondendo à conta padrão; vínculos com escopo de conta permanecem opcionais.
- `openclaw doctor --fix` também corrige formatos mistos movendo os valores de nível superior com escopo de conta única para a conta promovida escolhida para esse canal. A maioria dos canais usa `accounts.default`; o Matrix pode preservar um destino nomeado/padrão existente que corresponda.

### Outros canais de Plugin

Muitos canais de Plugin são configurados como `channels.<id>` e documentados em suas páginas dedicadas de canal (por exemplo, Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch e Zalo).
Consulte o índice completo de canais: [Canais](/pt-BR/channels).

### Controle de menções em conversas de grupo

Por padrão, mensagens de grupo **exigem menção** (menção nos metadados ou padrões seguros de expressão regular). Aplica-se a conversas de grupo do WhatsApp, Telegram, Discord, Google Chat e iMessage.

As respostas visíveis são controladas separadamente. Solicitações diretas normais de grupos, canais e WebChat interno usam, por padrão, a entrega final automática: o texto final do assistente é publicado pelo caminho legado de resposta visível. Ative `messages.visibleReplies: "message_tool"` ou `messages.groupChat.visibleReplies: "message_tool"` quando a saída visível só deva ser publicada depois que o agente chamar `message(action=send)`. Se o modelo retornar uma resposta final substancial sem chamar a ferramenta de mensagens em um modo opcional que permite somente ferramentas, esse texto final permanecerá privado, o log detalhado do Gateway registrará os metadados da carga suprimida e o OpenClaw enfileirará uma tentativa de recuperação solicitando que o modelo entregue a mesma resposta por meio de `message(action=send)`.

Respostas visíveis somente por ferramentas exigem um modelo/runtime que chame ferramentas de forma confiável e são recomendadas para salas ambientes compartilhadas em modelos de última geração, como GPT-5.6 Sol. Alguns modelos mais fracos conseguem fornecer texto final, mas não entendem que a saída visível na origem deve ser enviada com `message(action=send)`. Por padrão, o OpenClaw recupera o caso comum de uma resposta final retida somente quando ela é substancial, o turno de origem não foi um evento de sala, a política de envio não negou a entrega e nenhuma resposta à origem já foi enviada. A recuperação é limitada a uma tentativa; ela suprime a persistência da solicitação sintética de repetição e mantém essa repetição fora do agrupamento de coleta, para que não possa ser combinada com solicitações enfileiradas não relacionadas. Se a nova tentativa também ficar retida ou não puder ser enfileirada, o OpenClaw entregará apenas um diagnóstico sanitizado, como "Gerei uma resposta, mas não consegui entregá-la nesta conversa. Tente novamente." O texto final privado original nunca é marcado para entrega automática à origem. Para modelos que retêm respostas repetidamente, use `"automatic"` para que o turno final do assistente seja o caminho de resposta visível, mude para um modelo mais robusto na chamada de ferramentas, inspecione o log detalhado do Gateway para consultar o resumo da carga suprimida ou defina `messages.groupChat.visibleReplies: "automatic"` para usar respostas finais visíveis em todas as solicitações de grupo/canal.

Se a ferramenta de mensagens não estiver disponível de acordo com a política de ferramentas ativa, o OpenClaw recorrerá a respostas visíveis automáticas em vez de suprimir silenciosamente a resposta. `openclaw doctor` alerta sobre essa incompatibilidade.

Essa regra se aplica ao texto final normal do agente. Vínculos de conversas pertencentes a Plugins usam a resposta retornada pelo Plugin proprietário como resposta visível para turnos reivindicados do tópico vinculado; o Plugin não precisa chamar `message(action=send)` para essas respostas de vínculo.

**Solução de problemas: uma @menção em grupo aciona o indicador de digitação e depois não há resposta (sem erro)**

Sintoma: uma @menção em grupo/canal exibe o indicador de digitação e o log do Gateway informa `dispatch complete (queuedFinal=false, replies=0)`, mas nenhuma mensagem chega à sala. Mensagens diretas para o mesmo agente recebem respostas normalmente.

Causa: o modo de resposta visível de grupo/canal é resolvido como `"message_tool"`, portanto o OpenClaw executa o turno, mas suprime o texto final do assistente, a menos que o agente chame `message(action=send)`. Não há contrato `NO_REPLY` nesse modo; sem uma chamada à ferramenta de mensagens, o texto final original permanece privado. Para turnos de origem substanciais, o OpenClaw agora tenta uma repetição de recuperação protegida; notas curtas, silêncio explícito, eventos de sala, turnos negados pela política de envio e turnos já entregues não são repetidos. Por padrão, turnos normais de grupo e canal usam `"automatic"`, portanto esse sintoma só aparece quando `messages.groupChat.visibleReplies` (ou o `messages.visibleReplies` global) é definido explicitamente como `"message_tool"`. O `defaultVisibleReplies` do harness não se aplica aqui — o resolvedor de grupo/canal o ignora; ele afeta apenas chats diretos/de origem (o harness do Codex suprime dessa forma os resultados finais de chats diretos).

Correção: escolha um modelo mais eficaz em chamadas de ferramentas, remova a substituição explícita de `"message_tool"` para retornar ao padrão `"automatic"` ou defina `messages.groupChat.visibleReplies: "automatic"` para forçar respostas visíveis em todas as solicitações de grupo/canal. Um resultado final substancial não entregue não deve mais terminar como um sucesso silencioso; ele deve se recuperar por meio de uma repetição de `message(action=send)` ou exibir o diagnóstico sanitizado de falha na entrega. O Gateway recarrega dinamicamente a configuração de `messages` após o arquivo ser salvo; reinicie o Gateway somente quando o monitoramento de arquivos ou o recarregamento da configuração estiver desabilitado na implantação.

**Tipos de menção:**

- **Menções de metadados**: @menções nativas da plataforma. Ignoradas no modo de conversa consigo mesmo do WhatsApp.
- **Padrões de texto**: padrões de expressões regulares seguros em `agents.list[].groupChat.mentionPatterns`. Padrões inválidos e repetições aninhadas não seguras são ignorados.
- A restrição por menção só é aplicada quando a detecção é possível (menções nativas ou pelo menos um padrão).

```json5
{
  messages: {
    visibleReplies: "automatic", // força as antigas respostas finais automáticas em chats diretos/de origem
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // conversas não mencionadas e sempre ativas na sala tornam-se contexto silencioso
      visibleReplies: "message_tool", // adesão opcional; exige message(action=send) para respostas visíveis na sala
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` define o padrão global. Os canais podem substituí-lo com `channels.<channel>.historyLimit` (ou por conta). Defina `0` para desabilitar.

`messages.groupChat.unmentionedInbound: "room_event"` envia mensagens não mencionadas e sempre ativas de grupo/canal como contexto silencioso da sala nos canais compatíveis. Mensagens mencionadas, comandos e mensagens diretas continuam sendo solicitações do usuário. Consulte [Eventos de sala em segundo plano](/pt-BR/channels/ambient-room-events) para ver exemplos completos do Discord, Slack e Telegram.

`messages.visibleReplies` é o padrão global de eventos de origem; `messages.groupChat.visibleReplies` o substitui para eventos de origem de grupo/canal. Quando `messages.visibleReplies` não está definido, chats diretos/de origem usam o padrão do runtime ou harness selecionado, mas turnos diretos internos do WebChat usam entrega final automática para manter a paridade de prompts entre Pi e Codex. Defina `messages.visibleReplies: "message_tool"` para exigir intencionalmente `message(action=send)` para uma saída visível. As listas de permissões dos canais e a restrição por menção ainda determinam se um evento será processado.

#### Limites do histórico de mensagens diretas

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

Resolução: substituição por mensagem direta → padrão do provedor → sem limite (todas são mantidas).

Esse resolvedor lê `channels.<provider>.dmHistoryLimit` e `channels.<provider>.dms.<id>.historyLimit` para qualquer canal cuja chave de sessão siga o formato padrão `provider:direct:<id>` (ou o formato legado `provider:dm:<id>`), portanto funciona igualmente em canais integrados e de Plugin, não apenas em uma lista fixa.

#### Modo de conversa consigo mesmo

Inclua seu próprio número em `allowFrom` para habilitar o modo de conversa consigo mesmo (ignora @menções nativas e responde apenas a padrões de texto):

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

### Comandos (processamento de comandos de chat)

```json5
{
  commands: {
    native: "auto", // registra comandos nativos quando houver suporte
    nativeSkills: "auto", // registra comandos nativos de Skills quando houver suporte
    text: true, // analisa /commands em mensagens de chat
    bash: false, // permite ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permite /config
    mcp: false, // permite /mcp
    plugins: false, // permite /plugins
    debug: false, // permite /debug
    restart: true, // permite /restart + solicitações externas de reinicialização por SIGUSR1
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

- Este bloco configura as superfícies de comandos. Para consultar o catálogo atual de comandos integrados + incluídos, veja [Comandos de barra](/pt-BR/tools/slash-commands).
- Esta página é uma **referência de chaves de configuração**, não o catálogo completo de comandos. Comandos pertencentes a canais/Plugins, como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, pareamento de dispositivos `/pair`, memória `/dreaming`, controle de telefone `/phone` e Talk `/voice`, são documentados nas respectivas páginas de canais/Plugins e em [Comandos de barra](/pt-BR/tools/slash-commands).
- Comandos de texto devem ser mensagens **independentes** iniciadas por `/`.
- `native: "auto"` ativa comandos nativos no Discord/Telegram e os mantém desativados no Slack.
- `nativeSkills: "auto"` ativa comandos nativos de Skills no Discord/Telegram e os mantém desativados no Slack.
- Substituição por canal: `channels.discord.commands.native` (bool ou `"auto"`). No Discord, `false` ignora o registro e a limpeza de comandos nativos durante a inicialização.
- Substitua o registro de Skills nativas por canal com `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` adiciona entradas extras ao menu do bot do Telegram.
- `bash: true` habilita `! <cmd>` para o shell do host. Exige `tools.elevated.enabled` e que o remetente esteja em `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lê/grava `openclaw.json`). Para clientes `chat.send` do Gateway, gravações persistentes de `/config set|unset` também exigem `operator.admin`; `/config show` somente leitura continua disponível para clientes operadores normais com escopo de gravação.
- `mcp: true` habilita `/mcp` para a configuração de servidores MCP gerenciados pelo OpenClaw em `mcp.servers`.
- `plugins: true` habilita `/plugins` para descoberta, instalação e controles de ativação/desativação de Plugins.
- `channels.<provider>.configWrites` restringe alterações de configuração por canal (padrão: true).
- Para canais com várias contas, `channels.<provider>.accounts.<id>.configWrites` também restringe gravações direcionadas a essa conta (por exemplo, `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desabilita `/restart` e solicitações externas de reinicialização por `SIGUSR1`. Padrão: `true`.
- `ownerAllowFrom` é a lista de permissões explícita de proprietários para comandos exclusivos do proprietário e ações de canal restritas ao proprietário. Ela é separada de `allowFrom`.
- `ownerDisplay: "hash"` gera hashes dos IDs de proprietários no prompt do sistema. Defina `ownerDisplaySecret` para controlar a geração de hashes.
- `allowFrom` é específico por provedor. Quando definido, ele é a **única** fonte de autorização (as listas de permissões/pareamento do canal e `useAccessGroups` são ignorados).
- `useAccessGroups: false` permite que comandos ignorem políticas de grupos de acesso quando `allowFrom` não está definido.
- Mapa da documentação de comandos:
  - catálogo integrado + incluído: [Comandos de barra](/pt-BR/tools/slash-commands)
  - superfícies de comandos específicas de canais: [Canais](/pt-BR/channels)
  - comandos do QQ Bot: [QQ Bot](/pt-BR/channels/qqbot)
  - comandos de pareamento: [Pareamento](/pt-BR/channels/pairing)
  - comando de cartão do LINE: [LINE](/pt-BR/channels/line)
  - Dreaming da memória: [Dreaming](/pt-BR/concepts/dreaming)

</Accordion>

---

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — chaves de nível superior
- [Configuração — agentes](/pt-BR/gateway/config-agents)
- [Visão geral dos canais](/pt-BR/channels)
