---
read_when:
    - Een kanaal-Plugin configureren (authenticatie, toegangscontrole, meerdere accounts)
    - Probleemoplossing voor configuratiesleutels per kanaal
    - Controleren van DM-beleid, groepsbeleid of vermeldingsbeperking
summary: 'Kanaalconfiguratie: toegangsbeheer, koppeling, sleutels per kanaal voor Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en meer'
title: Configuratie — kanalen
x-i18n:
    generated_at: "2026-05-04T07:05:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57dcc0b5148324ea6fdee51b7b6e97ec7bd7dc3ca89518ab0816fe4172feefbc
    source_path: gateway/config-channels.md
    workflow: 16
---

Configuratiesleutels per kanaal onder `channels.*`. Behandelt DM- en groepstoegang,
set-ups met meerdere accounts, mention-gating en sleutels per kanaal voor Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage en de andere gebundelde kanaalplugins.

Voor agents, tools, Gateway-runtime en andere sleutels op topniveau, zie
[Configuratiereferentie](/nl/gateway/configuration-reference).

## Kanalen

Elk kanaal start automatisch wanneer de configuratiesectie bestaat (tenzij `enabled: false`).

### DM- en groepstoegang

Alle kanalen ondersteunen DM-beleid en groepsbeleid:

| DM-beleid           | Gedrag                                                        |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (standaard) | Onbekende afzenders krijgen een eenmalige koppelingscode; eigenaar moet goedkeuren |
| `allowlist`         | Alleen afzenders in `allowFrom` (of gekoppelde allow-store)   |
| `open`              | Alle inkomende DM's toestaan (vereist `allowFrom: ["*"]`)     |
| `disabled`          | Alle inkomende DM's negeren                                  |

| Groepsbeleid          | Gedrag                                               |
| --------------------- | ---------------------------------------------------- |
| `allowlist` (standaard) | Alleen groepen die overeenkomen met de geconfigureerde allowlist |
| `open`                | Groepsallowlists omzeilen (mention-gating blijft van toepassing) |
| `disabled`            | Alle groeps-/roomberichten blokkeren                 |

<Note>
`channels.defaults.groupPolicy` stelt de standaard in wanneer de `groupPolicy` van een provider niet is ingesteld.
Koppelingscodes verlopen na 1 uur. Openstaande DM-koppelingsverzoeken zijn beperkt tot **3 per kanaal**.
Als een providerblok volledig ontbreekt (`channels.<provider>` ontbreekt), valt het groepsbeleid tijdens runtime terug op `allowlist` (fail-closed) met een opstartwaarschuwing.
</Note>

### Modeloverschrijvingen per kanaal

Gebruik `channels.modelByChannel` om specifieke kanaal-ID's vast te zetten op een model. Waarden accepteren `provider/model` of geconfigureerde modelaliassen. De kanaaltoewijzing wordt toegepast wanneer een sessie nog geen modeloverschrijving heeft (bijvoorbeeld ingesteld via `/model`).

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

### Kanaalstandaarden en Heartbeat

Gebruik `channels.defaults` voor gedeeld groepsbeleid en Heartbeat-gedrag tussen providers:

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

- `channels.defaults.groupPolicy`: terugvalbeleid voor groepen wanneer een `groupPolicy` op providerniveau niet is ingesteld.
- `channels.defaults.contextVisibility`: standaardmodus voor zichtbaarheid van aanvullende context voor alle kanalen. Waarden: `all` (standaard, alle geciteerde/thread-/geschiedeniscontext opnemen), `allowlist` (alleen context opnemen van afzenders op de allowlist), `allowlist_quote` (hetzelfde als allowlist maar expliciete citaat-/antwoordcontext behouden). Overschrijving per kanaal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: gezonde kanaalstatussen opnemen in Heartbeat-uitvoer.
- `channels.defaults.heartbeat.showAlerts`: gedegradeerde/foutstatussen opnemen in Heartbeat-uitvoer.
- `channels.defaults.heartbeat.useIndicator`: compacte indicatorstijl-Heartbeat-uitvoer weergeven.

### WhatsApp

WhatsApp draait via het webkanaal van de Gateway (Baileys Web). Het start automatisch wanneer er een gekoppelde sessie bestaat.

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

<Accordion title="WhatsApp met meerdere accounts">

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

- Uitgaande opdrachten gebruiken standaard account `default` als dat aanwezig is; anders de eerste geconfigureerde account-id (gesorteerd).
- Optionele `channels.whatsapp.defaultAccount` overschrijft die terugvalselectie voor het standaardaccount wanneer deze overeenkomt met een geconfigureerde account-id.
- Verouderde Baileys-authenticatiemap voor één account wordt door `openclaw doctor` gemigreerd naar `whatsapp/default`.
- Overschrijvingen per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Bottoken: `channels.telegram.botToken` of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks geweigerd), met `TELEGRAM_BOT_TOKEN` als terugval voor het standaardaccount.
- `apiRoot` is alleen de Telegram Bot API-root. Gebruik `https://api.telegram.org` of je zelfgehoste/proxy-root, niet `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`-suffix.
- Optionele `channels.telegram.defaultAccount` overschrijft de standaardaccountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- Stel in set-ups met meerdere accounts (2+ account-id's) een expliciete standaard in (`channels.telegram.defaultAccount` of `channels.telegram.accounts.default`) om terugvalroutering te vermijden; `openclaw doctor` waarschuwt wanneer dit ontbreekt of ongeldig is.
- `configWrites: false` blokkeert door Telegram geïnitieerde configuratieschrijfacties (supergroep-ID-migraties, `/config set|unset`).
- Items op topniveau in `bindings[]` met `type: "acp"` configureren persistente ACP-bindingen voor forumonderwerpen (gebruik canonieke `chatId:topic:topicId` in `match.peer.id`). Veldsemantiek wordt gedeeld in [ACP-agents](/nl/tools/acp-agents#persistent-channel-bindings).
- Telegram-streamvoorbeelden gebruiken `sendMessage` + `editMessageText` (werkt in directe en groepschats).
- Retrybeleid: zie [Retrybeleid](/nl/concepts/retry).

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
      streaming: "off", // off | partial | block | progress
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

- Token: `channels.discord.token`, met `DISCORD_BOT_TOKEN` als fallback voor het standaardaccount.
- Directe uitgaande aanroepen die een expliciete Discord `token` leveren, gebruiken die token voor de aanroep; accountinstellingen voor opnieuw proberen/beleid komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
- Optioneel `channels.discord.defaultAccount` overschrijft de standaardaccountselectie wanneer dit overeenkomt met een geconfigureerde account-id.
- Gebruik `user:<id>` (DM) of `channel:<id>` (guild-kanaal) voor bezorgdoelen; losse numerieke ID's worden geweigerd.
- Guild-slugs zijn kleine letters waarbij spaties zijn vervangen door `-`; kanaalsleutels gebruiken de gesluggificeerde naam (zonder `#`). Geef de voorkeur aan guild-ID's.
- Berichten die door bots zijn opgesteld, worden standaard genegeerd. `allowBots: true` schakelt ze in; gebruik `allowBots: "mentions"` om alleen botberichten te accepteren die de bot vermelden (eigen berichten worden nog steeds gefilterd).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (en kanaaloverschrijvingen) verwijdert berichten die een andere gebruiker of rol vermelden maar niet de bot (met uitzondering van @everyone/@here).
- `channels.discord.mentionAliases` koppelt stabiele uitgaande `@handle`-tekst aan Discord-gebruikers-ID's voordat er wordt verzonden, zodat bekende teamgenoten deterministisch kunnen worden vermeld, zelfs wanneer de tijdelijke directorycache leeg is. Overschrijvingen per account staan onder `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (standaard 17) splitst hoge berichten, zelfs wanneer ze minder dan 2000 tekens bevatten.
- `channels.discord.threadBindings` beheert thread-gebonden routering voor Discord:
  - `enabled`: Discord-overschrijving voor thread-gebonden sessiefuncties (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, en gebonden bezorging/routering)
  - `idleHours`: Discord-overschrijving voor automatisch ontfocussen bij inactiviteit in uren (`0` schakelt uit)
  - `maxAgeHours`: Discord-overschrijving voor harde maximale leeftijd in uren (`0` schakelt uit)
  - `spawnSessions`: schakelaar voor `sessions_spawn({ thread: true })` en automatisch maken/binden van threads bij ACP-thread-spawn (standaard: `true`)
  - `defaultSpawnContext`: native subagent-context voor thread-gebonden spawns (standaard `"fork"`)
- Top-level `bindings[]`-items met `type: "acp"` configureren persistente ACP-bindingen voor kanalen en threads (gebruik kanaal-/thread-id in `match.peer.id`). Veldsemantiek wordt gedeeld in [ACP Agents](/nl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` stelt de accentkleur in voor Discord-components v2-containers.
- `channels.discord.voice` schakelt Discord-spraakkanaalgesprekken en optionele overschrijvingen voor automatisch deelnemen + LLM + TTS in. Tekst-only Discord-configuraties laten spraak standaard uit; stel `channels.discord.voice.enabled=true` in om je aan te melden.
- `channels.discord.voice.model` overschrijft optioneel het LLM-model dat wordt gebruikt voor antwoorden in Discord-spraakkanalen.
- `channels.discord.voice.daveEncryption` en `channels.discord.voice.decryptionFailureTolerance` worden doorgegeven aan DAVE-opties van `@discordjs/voice` (standaard `true` en `24`).
- `channels.discord.voice.connectTimeoutMs` beheert de initiële Ready-wachttijd van `@discordjs/voice` voor `/vc join` en pogingen tot automatisch deelnemen (standaard `30000`).
- `channels.discord.voice.reconnectGraceMs` bepaalt hoe lang een verbroken spraaksessie mag duren om reconnect-signalering te bereiken voordat OpenClaw deze vernietigt (standaard `15000`).
- OpenClaw probeert daarnaast spraakontvangst te herstellen door een spraaksessie na herhaalde decryptiefouten te verlaten en opnieuw deel te nemen.
- `channels.discord.streaming` is de canonieke sleutel voor streammodus. Verouderde `streamMode`- en booleaanse `streaming`-waarden worden automatisch gemigreerd.
- `channels.discord.autoPresence` koppelt runtime-beschikbaarheid aan bot-aanwezigheid (healthy => online, degraded => idle, exhausted => dnd) en staat optionele overschrijvingen van statustekst toe.
- `channels.discord.dangerouslyAllowNameMatching` schakelt veranderlijke naam-/tag-matching opnieuw in (compatibiliteitsmodus voor noodgevallen).
- `channels.discord.execApprovals`: Discord-native bezorging van exec-goedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false` of `"auto"` (standaard). In auto-modus worden exec-goedkeuringen geactiveerd wanneer goedkeurders kunnen worden opgelost uit `approvers` of `commands.ownerAllowFrom`.
  - `approvers`: Discord-gebruikers-ID's die exec-aanvragen mogen goedkeuren. Valt terug op `commands.ownerAllowFrom` wanneer weggelaten.
  - `agentFilter`: optionele allowlist met agent-ID's. Laat weg om goedkeuringen voor alle agents door te sturen.
  - `sessionFilter`: optionele sessiesleutelpatronen (substring of regex).
  - `target`: waar goedkeuringsprompts naartoe worden gestuurd. `"dm"` (standaard) stuurt naar DM's van goedkeurders, `"channel"` stuurt naar het oorspronkelijke kanaal, `"both"` stuurt naar beide. Wanneer target `"channel"` bevat, zijn knoppen alleen bruikbaar door opgeloste goedkeurders.
  - `cleanupAfterResolve`: wanneer `true`, verwijdert goedkeurings-DM's na goedkeuring, afwijzing of time-out.

**Reactiemeldingsmodi:** `off` (geen), `own` (berichten van de bot, standaard), `all` (alle berichten), `allowlist` (uit `guilds.<id>.users` voor alle berichten).

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

- Serviceaccount-JSON: inline (`serviceAccount`) of op bestand gebaseerd (`serviceAccountFile`).
- Serviceaccount-SecretRef wordt ook ondersteund (`serviceAccountRef`).
- Env-fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` of `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Gebruik `spaces/<spaceId>` of `users/<userId>` voor bezorgdoelen.
- `channels.googlechat.dangerouslyAllowNameMatching` schakelt veranderlijke e-mail-principal-matching opnieuw in (compatibiliteitsmodus voor noodgevallen).

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

- **Socket mode** vereist zowel `botToken` als `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` voor de env-fallback van het standaardaccount).
- **HTTP-modus** vereist `botToken` plus `signingSecret` (op rootniveau of per account).
- `socketMode` geeft transportafstemming voor Slack SDK Socket Mode door aan de publieke Bolt receiver-API. Gebruik dit alleen bij onderzoek naar ping/pong-time-outs of verouderd websocket-gedrag.
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren plaintext
  strings of SecretRef-objecten.
- Slack-accountsnapshots tonen bron-/statusvelden per credential, zoals
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` en, in HTTP-modus,
  `signingSecretStatus`. `configured_unavailable` betekent dat het account is
  geconfigureerd via SecretRef, maar dat het huidige commando-/runtime-pad de
  secretwaarde niet kon oplossen.
- `configWrites: false` blokkeert door Slack geïnitieerde configuratieschrijfacties.
- Optioneel `channels.slack.defaultAccount` overschrijft de standaardaccountselectie wanneer dit overeenkomt met een geconfigureerde account-id.
- `channels.slack.streaming.mode` is de canonieke sleutel voor de Slack-streammodus. `channels.slack.streaming.nativeTransport` beheert het native streamingtransport van Slack. Verouderde `streamMode`-, booleaanse `streaming`- en `nativeStreaming`-waarden worden automatisch gemigreerd.
- Gebruik `user:<id>` (DM) of `channel:<id>` voor bezorgdoelen.

**Reactiemeldingsmodi:** `off`, `own` (standaard), `all`, `allowlist` (uit `reactionAllowlist`).

**Thread-sessie-isolatie:** `thread.historyScope` is per thread (standaard) of gedeeld over kanaal. `thread.inheritParent` kopieert het transcript van het bovenliggende kanaal naar nieuwe threads.

- Slack-native streaming plus de Slack-assistant-achtige threadstatus "is aan het typen..." vereisen een antwoordthreaddoel. Top-level DM's blijven standaard buiten threads, zodat ze nog steeds kunnen streamen via Slack-concept-post-and-editvoorvertoningen in plaats van de thread-achtige native stream-/statusvoorvertoning te tonen.
- `typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl een antwoord loopt en verwijdert die daarna bij voltooiing. Gebruik een Slack-emoji-shortcode zoals `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native bezorging van exec-goedkeuringen en autorisatie van goedkeurders. Zelfde schema als Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-gebruikers-ID's), `agentFilter`, `sessionFilter` en `target` (`"dm"`, `"channel"` of `"both"`).

| Actiegroep   | Standaard    | Opmerkingen                   |
| ------------ | ------------ | ----------------------------- |
| reactions    | ingeschakeld | Reageren + reacties weergeven |
| messages     | ingeschakeld | Lezen/verzenden/bewerken/verwijderen |
| pins         | ingeschakeld | Vastmaken/losmaken/weergeven  |
| memberInfo   | ingeschakeld | Lidgegevens                   |
| emojiList    | ingeschakeld | Aangepaste emoji-lijst        |

### Mattermost

Mattermost wordt in huidige OpenClaw-releases geleverd als gebundelde Plugin. Oudere of
aangepaste builds kunnen een huidig npm-pakket installeren met
`openclaw plugins install @openclaw/mattermost`. Controleer
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
voor de huidige dist-tags voordat je een versie vastzet.

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

Chatmodi: `oncall` (reageren op @-vermelding, standaard), `onmessage` (elk bericht), `onchar` (berichten die beginnen met triggerprefix).

Wanneer native Mattermost-commando's zijn ingeschakeld:

- `commands.callbackPath` moet een pad zijn (bijvoorbeeld `/api/channels/mattermost/command`), geen volledige URL.
- `commands.callbackUrl` moet naar het OpenClaw Gateway-eindpunt verwijzen en bereikbaar zijn vanaf de Mattermost-server.
- Native slash-callbacks worden geauthenticeerd met de tokens per opdracht die door Mattermost worden geretourneerd tijdens de registratie van slash-opdrachten. Als registratie mislukt of er geen opdrachten zijn geactiveerd, weigert OpenClaw callbacks met `Unauthorized: invalid command token.`
- Voor private/tailnet/interne callbackhosts kan Mattermost vereisen dat `ServiceSettings.AllowedUntrustedInternalConnections` de callbackhost/het callbackdomein bevat. Gebruik host-/domeinwaarden, geen volledige URL's.
- `channels.mattermost.configWrites`: sta door Mattermost geïnitieerde configuratieschrijfacties toe of weiger ze.
- `channels.mattermost.requireMention`: vereis `@mention` voordat er in kanalen wordt geantwoord.
- `channels.mattermost.groups.<channelId>.requireMention`: override per kanaal voor vermeldingsgating (`"*"` voor standaard).
- Optionele `channels.mattermost.defaultAccount` overschrijft de standaard accountselectie wanneer deze overeenkomt met een geconfigureerde account-id.

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

**Reactiemeldingsmodi:** `off`, `own` (standaard), `all`, `allowlist` (van `reactionAllowlist`).

- `channels.signal.account`: pin het opstarten van het kanaal aan een specifieke Signal-accountidentiteit.
- `channels.signal.configWrites`: sta door Signal geïnitieerde configuratieschrijfacties toe of weiger ze.
- Optionele `channels.signal.defaultAccount` overschrijft de standaard accountselectie wanneer deze overeenkomt met een geconfigureerde account-id.

### BlueBubbles

BlueBubbles is het aanbevolen iMessage-pad (Plugin-ondersteund, geconfigureerd onder `channels.bluebubbles`).

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

- Kernsleutelpaden die hier worden behandeld: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optionele `channels.bluebubbles.defaultAccount` overschrijft de standaard accountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- Top-level `bindings[]`-vermeldingen met `type: "acp"` kunnen BlueBubbles-gesprekken binden aan persistente ACP-sessies. Gebruik een BlueBubbles-handle of doelstring (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gedeelde veldsemantiek: [ACP-agenten](/nl/tools/acp-agents#persistent-channel-bindings).
- De volledige BlueBubbles-kanaalconfiguratie is gedocumenteerd in [BlueBubbles](/nl/channels/bluebubbles).

### iMessage

OpenClaw start `imsg rpc` (JSON-RPC via stdio). Geen daemon of poort vereist.

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

- Optionele `channels.imessage.defaultAccount` overschrijft de standaard accountselectie wanneer deze overeenkomt met een geconfigureerde account-id.

- Vereist Volledige schijftoegang tot de Messages-DB.
- Geef de voorkeur aan `chat_id:<id>`-doelen. Gebruik `imsg chats --limit 20` om chats weer te geven.
- `cliPath` kan naar een SSH-wrapper verwijzen; stel `remoteHost` (`host` of `user@host`) in voor het ophalen van SCP-bijlagen.
- `attachmentRoots` en `remoteAttachmentRoots` beperken inkomende bijlagepaden (standaard: `/Users/*/Library/Messages/Attachments`).
- SCP gebruikt strikte host-sleutelcontrole, dus zorg dat de sleutel van de relayhost al bestaat in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: sta door iMessage geïnitieerde configuratieschrijfacties toe of weiger ze.
- Top-level `bindings[]`-vermeldingen met `type: "acp"` kunnen iMessage-gesprekken binden aan persistente ACP-sessies. Gebruik een genormaliseerde handle of expliciet chatdoel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gedeelde veldsemantiek: [ACP-agenten](/nl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="iMessage SSH wrapper example">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix is Plugin-ondersteund en geconfigureerd onder `channels.matrix`.

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

- Tokenauthenticatie gebruikt `accessToken`; wachtwoordauthenticatie gebruikt `userId` + `password`.
- `channels.matrix.proxy` routeert Matrix-HTTP-verkeer via een expliciete HTTP(S)-proxy. Benoemde accounts kunnen dit overschrijven met `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` staat private/interne homeservers toe. `proxy` en deze netwerkopt-in zijn onafhankelijke besturingen.
- `channels.matrix.defaultAccount` selecteert het voorkeursaccount in setups met meerdere accounts.
- `channels.matrix.autoJoin` staat standaard op `off`, dus uitgenodigde rooms en nieuwe DM-achtige uitnodigingen worden genegeerd totdat je `autoJoin: "allowlist"` met `autoJoinAllowlist` of `autoJoin: "always"` instelt.
- `channels.matrix.execApprovals`: Matrix-native levering van uitvoeringsgoedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false` of `"auto"` (standaard). In automatische modus worden uitvoeringsgoedkeuringen geactiveerd wanneer goedkeurders kunnen worden opgelost uit `approvers` of `commands.ownerAllowFrom`.
  - `approvers`: Matrix-gebruikers-ID's (bijv. `@owner:example.org`) die uitvoeringsverzoeken mogen goedkeuren.
  - `agentFilter`: optionele allowlist met agent-ID's. Laat weg om goedkeuringen voor alle agenten door te sturen.
  - `sessionFilter`: optionele sessiesleutelpatronen (substring of regex).
  - `target`: waar goedkeuringsprompts naartoe worden gestuurd. `"dm"` (standaard), `"channel"` (oorspronkelijke room) of `"both"`.
  - Overrides per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` bepaalt hoe Matrix-DM's in sessies worden gegroepeerd: `per-user` (standaard) deelt op basis van gerouteerde peer, terwijl `per-room` elke DM-room isoleert.
- Matrix-statusprobes en live directory-lookups gebruiken hetzelfde proxybeleid als runtime-verkeer.
- Volledige Matrix-configuratie, targetingregels en setupvoorbeelden zijn gedocumenteerd in [Matrix](/nl/channels/matrix).

### Microsoft Teams

Microsoft Teams is Plugin-ondersteund en geconfigureerd onder `channels.msteams`.

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

- Kernsleutelpaden die hier worden behandeld: `channels.msteams`, `channels.msteams.configWrites`.
- Volledige Teams-configuratie (referenties, Webhook, DM-/groepsbeleid, overrides per team/per kanaal) is gedocumenteerd in [Microsoft Teams](/nl/channels/msteams).

### IRC

IRC is Plugin-ondersteund en geconfigureerd onder `channels.irc`.

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

- Kernsleutelpaden die hier worden behandeld: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Optionele `channels.irc.defaultAccount` overschrijft de standaard accountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- Volledige IRC-kanaalconfiguratie (host/poort/TLS/kanalen/allowlists/vermeldingsgating) is gedocumenteerd in [IRC](/nl/channels/irc).

### Meerdere accounts (alle kanalen)

Voer meerdere accounts per kanaal uit (elk met een eigen `accountId`):

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

- `default` wordt gebruikt wanneer `accountId` is weggelaten (CLI + routing).
- Env-tokens gelden alleen voor het **standaard** account.
- Basiskanaalinstellingen gelden voor alle accounts, tenzij ze per account worden overschreven.
- Gebruik `bindings[].match.accountId` om elk account naar een andere agent te routeren.
- Als je een niet-standaard account toevoegt via `openclaw channels add` (of kanaalonboarding) terwijl je nog een top-level kanaalconfiguratie met één account gebruikt, promoveert OpenClaw eerst account-scoped top-level waarden voor één account naar de accountmap van het kanaal, zodat het oorspronkelijke account blijft werken. De meeste kanalen verplaatsen ze naar `channels.<channel>.accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaard doel behouden.
- Bestaande kanaal-only bindings (zonder `accountId`) blijven overeenkomen met het standaard account; account-scoped bindings blijven optioneel.
- `openclaw doctor --fix` herstelt ook gemengde vormen door account-scoped top-level waarden voor één account te verplaatsen naar het gepromoveerde account dat voor dat kanaal is gekozen. De meeste kanalen gebruiken `accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaard doel behouden.

### Andere Plugin-kanalen

Veel Plugin-kanalen worden geconfigureerd als `channels.<id>` en gedocumenteerd op hun eigen kanaalpagina's (bijvoorbeeld Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat en Twitch).
Zie de volledige kanaalindex: [Kanalen](/nl/channels).

### Vermeldingsgating voor groepschats

Groepsberichten vereisen standaard een **vermelding** (metadatavermelding of veilige regex-patronen). Geldt voor WhatsApp, Telegram, Discord, Google Chat en iMessage-groepschats.

Zichtbare antwoorden worden apart geregeld. Groeps-/kanaalrooms staan standaard op `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw verwerkt de beurt nog steeds, maar normale eindantwoorden blijven privé en zichtbare room-uitvoer vereist `message(action=send)`. Stel `"automatic"` alleen in wanneer je het legacy-gedrag wilt waarbij normale antwoorden terug naar de room worden geplaatst. Om hetzelfde tool-only gedrag voor zichtbare antwoorden ook op directe chats toe te passen, stel je `messages.visibleReplies: "message_tool"` in; de Codex-harness gebruikt dat tool-only gedrag ook als zijn niet-ingestelde standaard voor directe chats.

Tool-only zichtbare antwoorden vereisen een model/runtime die betrouwbaar tools aanroept. Als het sessielog assistenttekst toont met `didSendViaMessagingTool: false`, heeft het model een privé-eindantwoord geproduceerd in plaats van de message tool aan te roepen. Schakel over naar een sterker tool-aanroepend model voor dat kanaal, of stel `messages.groupChat.visibleReplies: "automatic"` in om legacy zichtbare eindantwoorden te herstellen.

Als de message tool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw terug op automatische zichtbare antwoorden in plaats van de reactie stil te onderdrukken. `openclaw doctor` waarschuwt voor deze mismatch.

De Gateway hot-reloadt de `messages`-configuratie nadat het bestand is opgeslagen. Herstart alleen wanneer file watching of config reload in de deployment is uitgeschakeld.

**Vermeldingstypen:**

- **Metadatavermeldingen**: Native platform-@-vermeldingen. Genegeerd in WhatsApp-zelfchatmodus.
- **Tekstpatronen**: Veilige regex-patronen in `agents.list[].groupChat.mentionPatterns`. Ongeldige patronen en onveilige geneste herhaling worden genegeerd.
- Vermeldingsfiltering wordt alleen afgedwongen wanneer detectie mogelijk is (native vermeldingen of ten minste één patroon).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` stelt de globale standaard in. Kanalen kunnen dit overschrijven met `channels.<channel>.historyLimit` (of per account). Stel in op `0` om uit te schakelen.

`messages.visibleReplies` is de globale standaard voor source-turns; `messages.groupChat.visibleReplies` overschrijft deze voor groeps-/kanaal-source-turns. Wanneer `messages.visibleReplies` niet is ingesteld, kan een harness zijn eigen standaard voor direct/source leveren; de Codex-harness gebruikt standaard `message_tool`. Kanaal-allowlists en vermeldingsfiltering bepalen nog steeds of een turn wordt verwerkt.

#### DM-geschiedenislimieten

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

Resolutie: per-DM-overschrijving → providerstandaard → geen limiet (alles behouden).

Ondersteund: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Zelfchatmodus

Neem je eigen nummer op in `allowFrom` om zelfchatmodus in te schakelen (negeert native @-vermeldingen, reageert alleen op tekstpatronen):

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

### Commando's (afhandeling van chatcommando's)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
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

<Accordion title="Command details">

- Dit blok configureert commandosurfaces. Zie [Slash Commands](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde commandocatalogus.
- Deze pagina is een **configuratiesleutelreferentie**, niet de volledige commandocatalogus. Commando's die eigendom zijn van kanalen/Plugins, zoals QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` en Talk `/voice`, zijn gedocumenteerd op hun kanaal-/Plugin-pagina's plus [Slash Commands](/nl/tools/slash-commands).
- Tekstcommando's moeten **zelfstandige** berichten zijn met een voorafgaande `/`.
- `native: "auto"` schakelt native commando's in voor Discord/Telegram, en laat Slack uit.
- `nativeSkills: "auto"` schakelt native Skills-commando's in voor Discord/Telegram, en laat Slack uit.
- Overschrijf per kanaal: `channels.discord.commands.native` (bool of `"auto"`). Voor Discord slaat `false` registratie en opschoning van native commando's tijdens het opstarten over.
- Overschrijf native Skills-registratie per kanaal met `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` voegt extra Telegram-botmenu-items toe.
- `bash: true` schakelt `! <cmd>` in voor de hostshell. Vereist `tools.elevated.enabled` en afzender in `tools.elevated.allowFrom.<channel>`.
- `config: true` schakelt `/config` in (leest/schrijft `openclaw.json`). Voor Gateway-`chat.send`-clients vereisen persistente `/config set|unset`-schrijfacties ook `operator.admin`; alleen-lezen `/config show` blijft beschikbaar voor normale operatorclients met schrijfbereik.
- `mcp: true` schakelt `/mcp` in voor OpenClaw-beheerde MCP-serverconfiguratie onder `mcp.servers`.
- `plugins: true` schakelt `/plugins` in voor Plugin-ontdekking, installatie en besturing voor inschakelen/uitschakelen.
- `channels.<provider>.configWrites` begrenst configuratiemutaties per kanaal (standaard: true).
- Voor multi-accountkanalen begrenst `channels.<provider>.accounts.<id>.configWrites` ook schrijfacties die op dat account zijn gericht (bijvoorbeeld `/allowlist --config --account <id>` of `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` schakelt `/restart` en Gateway-herstarttoolacties uit. Standaard: `true`.
- `ownerAllowFrom` is de expliciete owner-allowlist voor owner-only commando's/tools. Deze staat los van `allowFrom`.
- `ownerDisplay: "hash"` hasht owner-id's in de systeemprompt. Stel `ownerDisplaySecret` in om hashing te beheren.
- `allowFrom` is per provider. Wanneer ingesteld, is dit de **enige** autorisatiebron (kanaal-allowlists/koppeling en `useAccessGroups` worden genegeerd).
- `useAccessGroups: false` staat toe dat commando's toegangsgroepbeleid omzeilen wanneer `allowFrom` niet is ingesteld.
- Commandodocumentatiekaart:
  - ingebouwde + gebundelde catalogus: [Slash Commands](/nl/tools/slash-commands)
  - kanaalspecifieke commandosurfaces: [Kanalen](/nl/channels)
  - QQ Bot-commando's: [QQ Bot](/nl/channels/qqbot)
  - koppelingscommando's: [Koppeling](/nl/channels/pairing)
  - LINE-kaartcommando: [LINE](/nl/channels/line)
  - memory dreaming: [Dreaming](/nl/concepts/dreaming)

</Accordion>

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — sleutels op topniveau
- [Configuratie — agents](/nl/gateway/config-agents)
- [Kanalenoverzicht](/nl/channels)
