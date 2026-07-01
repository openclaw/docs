---
read_when:
    - Een kanaal-Plugin configureren (authenticatie, toegangscontrole, meerdere accounts)
    - Probleemoplossing voor configuratiesleutels per kanaal
    - DM-beleid, groepsbeleid of vermeldingsgating auditen
summary: 'Kanaalconfiguratie: toegangscontrole, koppeling, sleutels per kanaal voor Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en meer'
title: Configuratie — kanalen
x-i18n:
    generated_at: "2026-07-01T13:12:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

Configuratiesleutels per kanaal onder `channels.*`. Behandelt DM- en groepstoegang,
set-ups met meerdere accounts, vermeldingsgating en kanaalspecifieke sleutels voor Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage en de andere gebundelde channel plugins.

Zie voor agents, tools, gateway-runtime en andere sleutels op topniveau de
[Configuratiereferentie](/nl/gateway/configuration-reference).

## Kanalen

Elk kanaal start automatisch wanneer de configuratiesectie bestaat (tenzij `enabled: false`).

### DM- en groepstoegang

Alle kanalen ondersteunen DM-beleid en groepsbeleid:

| DM-beleid           | Gedrag                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (standaard) | Onbekende afzenders krijgen een eenmalige koppelingscode; eigenaar moet goedkeuren |
| `allowlist`         | Alleen afzenders in `allowFrom` (of gekoppelde toestemmingsopslag)             |
| `open`              | Alle inkomende DM's toestaan (vereist `allowFrom: ["*"]`)             |
| `disabled`          | Alle inkomende DM's negeren                                          |

| Groepsbeleid          | Gedrag                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (standaard) | Alleen groepen die overeenkomen met de geconfigureerde allowlist          |
| `open`                | Groepsallowlists omzeilen (vermeldingsgating blijft van toepassing) |
| `disabled`            | Alle groeps-/roomberichten blokkeren                          |

<Note>
`channels.defaults.groupPolicy` stelt de standaard in wanneer de `groupPolicy` van een provider niet is ingesteld.
Koppelingscodes verlopen na 1 uur. Openstaande DM-koppelingsverzoeken zijn begrensd op **3 per kanaal**.
Als een providerblok volledig ontbreekt (`channels.<provider>` afwezig), valt het groepsbeleid tijdens runtime terug op `allowlist` (fail-closed) met een opstartwaarschuwing.
</Note>

### Kanaalmodel-overschrijvingen

Gebruik `channels.modelByChannel` om specifieke kanaal-ID's of direct-message-peers aan een model vast te pinnen. Waarden accepteren `provider/model` of geconfigureerde modelaliassen. De kanaaltoewijzing is van toepassing wanneer een sessie nog geen modeloverschrijving heeft (bijvoorbeeld ingesteld via `/model`).

Voor groeps-/threadgesprekken zijn sleutels kanaalspecifieke groeps-ID's, onderwerp-ID's of kanaalnamen. Voor direct-messagegesprekken (DM) zijn sleutels peer-identifiers die zijn afgeleid van de afzenderidentiteit van het kanaal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` of `SenderId`). De exacte sleutelvorm hangt af van het kanaal:

| Kanaal  | DM-sleutelvorm         | Voorbeeld                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ruwe gebruikers-ID         | `123456789`                                  |
| Discord  | ruwe gebruikers-ID         | `987654321`                                  |
| WhatsApp | telefoonnummer of JID | `15551234567`                                |
| Matrix   | Matrix-gebruikers-ID      | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

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

DM-specifieke sleutels komen alleen overeen in direct-messagegesprekken; ze hebben geen invloed op groeps-/threadrouting.

### Kanaalstandaarden en Heartbeat

Gebruik `channels.defaults` voor gedeeld groepsbeleid en Heartbeat-gedrag voor providers:

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

- `channels.defaults.groupPolicy`: fallback-groepsbeleid wanneer een `groupPolicy` op providerniveau niet is ingesteld.
- `channels.defaults.contextVisibility`: standaardmodus voor aanvullende contextzichtbaarheid voor alle kanalen. Waarden: `all` (standaard, neem alle geciteerde/thread-/geschiedeniscontext op), `allowlist` (neem alleen context op van afzenders op de allowlist), `allowlist_quote` (hetzelfde als allowlist, maar behoud expliciete citaat-/antwoordcontext). Overschrijving per kanaal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: gezonde kanaalstatussen opnemen in Heartbeat-uitvoer.
- `channels.defaults.heartbeat.showAlerts`: verslechterde/foutstatussen opnemen in Heartbeat-uitvoer.
- `channels.defaults.heartbeat.useIndicator`: compacte Heartbeat-uitvoer in indicatorstijl renderen.

### WhatsApp

WhatsApp draait via het webkanaal van de gateway (Baileys Web). Het start automatisch wanneer er een gekoppelde sessie bestaat.

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

- Items in `bindings[]` op topniveau met `type: "acp"` configureren persistente ACP-bindingen voor WhatsApp-DM's en groepen. Gebruik een rechtstreeks E.164-nummer of WhatsApp-groep-JID in `match.peer.id`. Veldsemantiek wordt gedeeld in [ACP-agents](/nl/tools/acp-agents#persistent-channel-bindings).

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

- Uitgaande opdrachten gebruiken standaard account `default` als dat aanwezig is; anders de eerste geconfigureerde account-ID (gesorteerd).
- Optioneel `channels.whatsapp.defaultAccount` overschrijft die fallbackselectie van het standaardaccount wanneer deze overeenkomt met een geconfigureerde account-ID.
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
      streaming: "partial", // off | partial | block | progress (default: partial)
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

- Bottoken: `channels.telegram.botToken` of `channels.telegram.tokenFile` (alleen normaal bestand; symlinks geweigerd), met `TELEGRAM_BOT_TOKEN` als fallback voor het standaardaccount.
- `apiRoot` is alleen de Telegram Bot API-root. Gebruik `https://api.telegram.org` of je zelf gehoste/proxy-root, niet `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`-suffix.
- Optioneel `channels.telegram.defaultAccount` overschrijft de standaardaccountselectie wanneer deze overeenkomt met een geconfigureerde account-ID.
- Stel in set-ups met meerdere accounts (2+ account-ID's) een expliciete standaard in (`channels.telegram.defaultAccount` of `channels.telegram.accounts.default`) om fallbackrouting te vermijden; `openclaw doctor` waarschuwt wanneer dit ontbreekt of ongeldig is.
- `configWrites: false` blokkeert door Telegram geïnitieerde configuratieschrijfacties (supergroep-ID-migraties, `/config set|unset`).
- Items in `bindings[]` op topniveau met `type: "acp"` configureren persistente ACP-bindingen voor forumonderwerpen (gebruik canonieke `chatId:topic:topicId` in `match.peer.id`). Veldsemantiek wordt gedeeld in [ACP-agents](/nl/tools/acp-agents#persistent-channel-bindings).
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

- Token: `channels.discord.token`, met `DISCORD_BOT_TOKEN` als fallback voor het standaardaccount.
- Rechtstreekse uitgaande aanroepen die een expliciete Discord-`token` opgeven, gebruiken die token voor de aanroep; retry-/beleidsinstellingen voor accounts komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
- Optioneel `channels.discord.defaultAccount` overschrijft de standaardaccountselectie wanneer dit overeenkomt met een geconfigureerde account-id.
- Gebruik `user:<id>` (DM) of `channel:<id>` (guild-kanaal) voor bezorgdoelen; kale numerieke ID's worden geweigerd.
- Guild-slugs zijn kleine letters waarbij spaties zijn vervangen door `-`; kanaalsleutels gebruiken de geslugde naam (geen `#`). Geef de voorkeur aan guild-ID's.
- Berichten die door bots zijn geschreven, worden standaard genegeerd. `allowBots: true` schakelt ze in; gebruik `allowBots: "mentions"` om alleen botberichten te accepteren die de bot vermelden (eigen berichten blijven gefilterd).
- Kanalen die inkomende berichten van bots ondersteunen, kunnen gedeelde [bot-lusbescherming](/nl/channels/bot-loop-protection) gebruiken. Stel `channels.defaults.botLoopProtection` in voor basisbudgetten per paar, en overschrijf daarna alleen het kanaal of account wanneer één oppervlak andere limieten nodig heeft.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (en kanaaloverschrijvingen) laat berichten vallen die een andere gebruiker of rol vermelden maar niet de bot (met uitzondering van @everyone/@here).
- `channels.discord.mentionAliases` wijst stabiele uitgaande `@handle`-tekst toe aan Discord-gebruikers-ID's vóór verzending, zodat bekende teamgenoten deterministisch kunnen worden vermeld, zelfs wanneer de tijdelijke directory-cache leeg is. Overschrijvingen per account staan onder `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (standaard 17) splitst hoge berichten, zelfs wanneer ze minder dan 2000 tekens bevatten.
- `channels.discord.suppressEmbeds` is standaard `true`, zodat uitgaande URL's niet uitklappen tot Discord-linkvoorbeelden tenzij dit is uitgeschakeld. Expliciete `embeds`-payloads worden nog steeds normaal verzonden; toolaanroepen per bericht kunnen dit overschrijven met `suppressEmbeds`.
- `channels.discord.threadBindings` beheert Discord-threadgebonden routering:
  - `enabled`: Discord-overschrijving voor threadgebonden sessiefuncties (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, en gebonden bezorging/routering)
  - `idleHours`: Discord-overschrijving voor automatisch ontfocussen bij inactiviteit in uren (`0` schakelt uit)
  - `maxAgeHours`: Discord-overschrijving voor harde maximale leeftijd in uren (`0` schakelt uit)
  - `spawnSessions`: schakelaar voor `sessions_spawn({ thread: true })` en automatische threadaanmaak/-binding voor ACP thread-spawn (standaard: `true`)
  - `defaultSpawnContext`: native subagent-context voor threadgebonden spawns (standaard `"fork"`)
- Top-level `bindings[]`-vermeldingen met `type: "acp"` configureren persistente ACP-bindingen voor kanalen en threads (gebruik kanaal-/thread-id in `match.peer.id`). Veldsemantiek wordt gedeeld in [ACP-agenten](/nl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` stelt de accentkleur in voor Discord components v2-containers.
- `channels.discord.agentComponents.ttlMs` bepaalt hoelang verzonden Discord-componentcallbacks geregistreerd blijven. De standaardwaarde is `1800000` (30 minuten), het maximum is `86400000` (24 uur), en overschrijvingen per account staan onder `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Langere waarden houden oude knoppen/selecties/formulieren langer bruikbaar, dus geef de voorkeur aan de kortste TTL die bij de workflow past.
- `channels.discord.voice` schakelt gesprekken in Discord-spraakkanalen en optionele auto-join + LLM + TTS-overschrijvingen in. Tekst-only Discord-configuraties laten spraak standaard uit; stel `channels.discord.voice.enabled=true` in om hiervoor te kiezen.
- `channels.discord.voice.model` overschrijft optioneel het LLM-model dat wordt gebruikt voor antwoorden in Discord-spraakkanalen.
- `channels.discord.voice.daveEncryption` en `channels.discord.voice.decryptionFailureTolerance` worden doorgegeven aan DAVE-opties van `@discordjs/voice` (standaard `true` en `24`).
- `channels.discord.voice.connectTimeoutMs` beheert de initiële Ready-wachttijd van `@discordjs/voice` voor `/vc join` en auto-joinpogingen (standaard `30000`).
- `channels.discord.voice.reconnectGraceMs` bepaalt hoelang een losgekoppelde spraaksessie mag nemen om reconnect-signalering te starten voordat OpenClaw deze vernietigt (standaard `15000`).
- Discord-spraakweergave wordt niet onderbroken door een speaking-start-event van een andere gebruiker. Om feedbacklussen te vermijden, negeert OpenClaw nieuwe spraakopname terwijl TTS afspeelt.
- OpenClaw probeert daarnaast spraakontvangst te herstellen door een spraaksessie te verlaten en opnieuw te joinen na herhaalde decryptiefouten.
- `channels.discord.streaming` is de canonieke sleutel voor streammodus. Discord gebruikt standaard `streaming.mode: "progress"`, zodat tool-/werkvoortgang in één bewerkt voorbeeldbericht verschijnt; stel `streaming.mode: "off"` in om dit uit te schakelen. Legacy `streamMode`- en booleaanse `streaming`-waarden blijven runtime-aliassen; voer `openclaw doctor --fix` uit om persistente configuratie te herschrijven.
- `channels.discord.autoPresence` wijst runtime-beschikbaarheid toe aan bot-aanwezigheid (healthy => online, degraded => idle, exhausted => dnd) en staat optionele overschrijvingen voor statustekst toe.
- `channels.discord.dangerouslyAllowNameMatching` schakelt wijzigbare naam-/tagmatching opnieuw in (noodcompatibiliteitsmodus).
- `channels.discord.execApprovals`: Discord-native bezorging van exec-goedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false` of `"auto"` (standaard). In automatische modus worden exec-goedkeuringen geactiveerd wanneer goedkeurders kunnen worden opgelost uit `approvers` of `commands.ownerAllowFrom`.
  - `approvers`: Discord-gebruikers-ID's die exec-aanvragen mogen goedkeuren. Valt terug op `commands.ownerAllowFrom` wanneer weggelaten.
  - `agentFilter`: optionele allowlist met agent-ID's. Laat weg om goedkeuringen voor alle agents door te sturen.
  - `sessionFilter`: optionele sessiesleutelpatronen (substring of regex).
  - `target`: waar goedkeuringsprompts naartoe worden verzonden. `"dm"` (standaard) verzendt naar DM's van goedkeurders, `"channel"` verzendt naar het oorspronkelijke kanaal, `"both"` verzendt naar beide. Wanneer target `"channel"` bevat, zijn knoppen alleen bruikbaar door opgeloste goedkeurders.
  - `cleanupAfterResolve`: wanneer `true`, worden goedkeurings-DM's verwijderd na goedkeuring, weigering of timeout.

**Modi voor reactiemeldingen:** `off` (geen), `own` (berichten van de bot, standaard), `all` (alle berichten), `allowlist` (uit `guilds.<id>.users` op alle berichten).

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

- Serviceaccount-JSON: inline (`serviceAccount`) of op bestanden gebaseerd (`serviceAccountFile`).
- Serviceaccount SecretRef wordt ook ondersteund (`serviceAccountRef`).
- Env-fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` of `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Gebruik `spaces/<spaceId>` of `users/<userId>` voor bezorgdoelen.
- `channels.googlechat.dangerouslyAllowNameMatching` schakelt wijzigbare e-mail-principalmatching opnieuw in (noodcompatibiliteitsmodus).

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

- **Socket-modus** vereist zowel `botToken` als `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` voor env-fallback van het standaardaccount).
- **HTTP-modus** vereist `botToken` plus `signingSecret` (op rootniveau of per account).
- `socketMode` geeft transportafstemming van de Slack SDK Socket Mode door aan de openbare Bolt receiver-API. Gebruik dit alleen bij onderzoek naar ping/pong-time-outs of verouderd websocketgedrag. `clientPingTimeout` is standaard `15000`; `serverPingTimeout` en `pingPongLoggingEnabled` worden alleen doorgegeven wanneer ze zijn geconfigureerd.
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren plattetekst-
  strings of SecretRef-objecten.
- Slack-accountsnapshots tonen bron-/statusvelden per referentie, zoals
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` en, in HTTP-modus,
  `signingSecretStatus`. `configured_unavailable` betekent dat het account is
  geconfigureerd via SecretRef, maar dat het huidige opdracht-/runtimepad de
  geheime waarde niet kon oplossen.
- `configWrites: false` blokkeert door Slack geïnitieerde configuratieschrijfacties.
- Optioneel `channels.slack.defaultAccount` overschrijft de standaardaccountselectie wanneer dit overeenkomt met een geconfigureerde account-id.
- `channels.slack.streaming.mode` is de canonieke Slack-streammodussleutel. `channels.slack.streaming.nativeTransport` beheert Slacks native streamingtransport. Legacywaarden `streamMode`, booleaanse `streaming` en `nativeStreaming` blijven runtime-aliassen; voer `openclaw doctor --fix` uit om opgeslagen configuratie te herschrijven.
- `unfurlLinks` en `unfurlMedia` geven Slacks `chat.postMessage`-booleans voor link- en media-unfurling door voor botantwoorden. `unfurlLinks` is standaard `false`, zodat uitgaande botlinks niet inline uitklappen tenzij dit is ingeschakeld; `unfurlMedia` wordt weggelaten tenzij geconfigureerd. Stel een van beide waarden in op `channels.slack.accounts.<accountId>` om de waarde op topniveau voor één account te overschrijven.
- Gebruik `user:<id>` (DM) of `channel:<id>` voor afleverdoelen.

**Reactiemeldingsmodi:** `off`, `own` (standaard), `all`, `allowlist` (uit `reactionAllowlist`).

**Thread-sessie-isolatie:** `thread.historyScope` is per thread (standaard) of gedeeld over het kanaal. `thread.inheritParent` kopieert het transcript van het bovenliggende kanaal naar nieuwe threads.

- Slack native streaming plus de Slack-assistentstijl-threadstatus "is typing..." vereisen een antwoordthreaddoel. DM's op topniveau blijven standaard buiten threads, zodat ze nog steeds kunnen streamen via Slacks conceptbericht-en-bewerkvoorbeelden in plaats van de threadstijl native stream-/statuspreview te tonen.
- `typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl een antwoord loopt, en verwijdert deze na voltooiing. Gebruik een Slack-emoji-shortcode zoals `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native levering van goedkeuringsclients en autorisatie van exec-goedkeurders. Hetzelfde schema als Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-gebruikers-ID's), `agentFilter`, `sessionFilter` en `target` (`"dm"`, `"channel"` of `"both"`). Plugin-goedkeuringen kunnen dit native-clientpad gebruiken voor verzoeken die uit Slack afkomstig zijn wanneer Slack Plugin-goedkeurders worden opgelost; Slack-native Plugin-goedkeuringslevering kan ook worden ingeschakeld via `approvals.plugin` voor sessies die uit Slack afkomstig zijn of Slack-doelen. Plugin-goedkeuringen gebruiken Slack Plugin-goedkeurders uit `allowFrom` en standaardroutering, niet exec-goedkeurders.

| Actiegroep   | Standaard    | Opmerkingen                 |
| ------------ | ------------ | --------------------------- |
| reactions    | ingeschakeld | Reageren + reacties tonen   |
| messages     | ingeschakeld | Lezen/verzenden/bewerken/verwijderen |
| pins         | ingeschakeld | Vastzetten/losmaken/tonen   |
| memberInfo   | ingeschakeld | Lidgegevens                 |
| emojiList    | ingeschakeld | Aangepaste emoji-lijst      |

### Mattermost

Mattermost wordt geleverd als gebundelde Plugin in huidige OpenClaw-releases. Oudere of
aangepaste builds kunnen een huidig npm-pakket installeren met
`openclaw plugins install @openclaw/mattermost`. Controleer
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
voor de huidige dist-tags voordat u een versie vastpint.

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

Wanneer native Mattermost-opdrachten zijn ingeschakeld:

- `commands.callbackPath` moet een pad zijn (bijvoorbeeld `/api/channels/mattermost/command`), geen volledige URL.
- `commands.callbackUrl` moet verwijzen naar het OpenClaw Gateway-eindpunt en bereikbaar zijn vanaf de Mattermost-server.
- Native slash-callbacks worden geauthenticeerd met de tokens per opdracht die
  door Mattermost worden geretourneerd tijdens slash-opdrachtregistratie. Als registratie mislukt of er geen
  opdrachten zijn geactiveerd, weigert OpenClaw callbacks met
  `Unauthorized: invalid command token.`
- Voor privé-/tailnet-/interne callbackhosts kan Mattermost vereisen
  dat `ServiceSettings.AllowedUntrustedInternalConnections` de callbackhost/het callbackdomein bevat.
  Gebruik host-/domeinwaarden, geen volledige URL's.
- `channels.mattermost.configWrites`: door Mattermost geïnitieerde configuratieschrijfacties toestaan of weigeren.
- `channels.mattermost.requireMention`: `@mention` vereisen voordat in kanalen wordt gereageerd.
- `channels.mattermost.groups.<channelId>.requireMention`: overschrijving per kanaal voor vermeldingscontrole (`"*"` voor standaard).
- Optioneel `channels.mattermost.defaultAccount` overschrijft de standaardaccountselectie wanneer dit overeenkomt met een geconfigureerde account-id.

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

**Reactiemeldingsmodi:** `off`, `own` (standaard), `all`, `allowlist` (uit `reactionAllowlist`).

- `channels.signal.account`: kanaalstart vastzetten op een specifieke Signal-accountidentiteit.
- `channels.signal.configWrites`: door Signal geïnitieerde configuratieschrijfacties toestaan of weigeren.
- Optioneel `channels.signal.defaultAccount` overschrijft de standaardaccountselectie wanneer dit overeenkomt met een geconfigureerde account-id.

### iMessage

OpenClaw start `imsg rpc` (JSON-RPC via stdio). Geen daemon of poort vereist. Dit is het voorkeurs­pad voor nieuwe OpenClaw iMessage-setups wanneer de host Messages-database- en Automatisering-machtigingen kan verlenen.

BlueBubbles-ondersteuning is verwijderd. `channels.bluebubbles` is geen ondersteund runtimeconfiguratie-oppervlak in huidige OpenClaw. Migreer oude configuraties naar `channels.imessage`; gebruik [BlueBubbles-verwijdering en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) voor de korte versie en [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles) voor de volledige vertaaltabel.

Als de Gateway niet draait op de aangemelde Messages-Mac, houd `channels.imessage.enabled=true` aan en stel `channels.imessage.cliPath` in op een SSH-wrapper die `imsg "$@"` uitvoert op die Mac. Het standaard lokale `imsg`-pad is alleen voor macOS.

Voordat u vertrouwt op een SSH-wrapper voor productieverzendingen, verifieert u een uitgaande `imsg send` via precies die wrapper. Sommige macOS TCC-statussen wijzen Messages-automatisering toe aan `/usr/libexec/sshd-keygen-wrapper`, waardoor lezen en probes kunnen werken terwijl verzendingen mislukken met AppleEvents `-1743`; zie [SSH-wrapperverzendingen mislukken met AppleEvents -1743](/nl/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- Optioneel `channels.imessage.defaultAccount` overschrijft de standaardaccountselectie wanneer dit overeenkomt met een geconfigureerde account-id.

- Vereist volledige schijftoegang tot de Messages-DB.
- Geef de voorkeur aan `chat_id:<id>`-doelen. Gebruik `imsg chats --limit 20` om chats weer te geven.
- `cliPath` kan naar een SSH-wrapper verwijzen; stel `remoteHost` (`host` of `user@host`) in voor het ophalen van SCP-bijlagen.
- `attachmentRoots` en `remoteAttachmentRoots` beperken inkomende bijlagepaden (standaard: `/Users/*/Library/Messages/Attachments`).
- SCP gebruikt strikte host-keycontrole, zorg er dus voor dat de relay-hostsleutel al bestaat in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: door iMessage geïnitieerde configuratieschrijfacties toestaan of weigeren.
- `channels.imessage.sendTransport`: voorkeurs-`imsg` RPC-verzendtransport voor normale uitgaande antwoorden. `auto` (standaard) gebruikt de IMCore-bridge voor bestaande chats wanneer die draait, en valt daarna terug op AppleScript; `bridge` vereist private-API-levering; `applescript` forceert het openbare Messages-automatiseringspad.
- `channels.imessage.actions.*`: private API-acties inschakelen die ook worden begrensd door `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` staat standaard uit; stel dit in op `true` voordat u inkomende media in agentbeurten verwacht.
- Inkomend herstel na een bridge-/Gateway-herstart is automatisch (GUID-deduplicatie plus een leeftijdsgrens voor verouderde backlog). Bestaande `channels.imessage.catchup.enabled: true`-configuraties worden nog steeds gerespecteerd als verouderd compatibiliteitsprofiel.
- `channels.imessage.groups`: groepsregister en instellingen per groep. Met `groupPolicy: "allowlist"` configureert u expliciete `chat_id`-sleutels of een `"*"`-wildcardvermelding zodat groepsberichten de registerpoort kunnen passeren.
- Topniveau-`bindings[]`-vermeldingen met `type: "acp"` kunnen iMessage-gesprekken koppelen aan persistente ACP-sessies. Gebruik een genormaliseerde handle of expliciet chatdoel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gedeelde veldsemantiek: [ACP Agents](/nl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Voorbeeld van iMessage SSH-wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix is Plugin-ondersteund en wordt geconfigureerd onder `channels.matrix`.

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
- `channels.matrix.proxy` routeert Matrix HTTP-verkeer via een expliciete HTTP(S)-proxy. Benoemde accounts kunnen dit overschrijven met `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` staat private/interne homeservers toe. `proxy` en deze netwerkopt-in zijn onafhankelijke controles.
- `channels.matrix.defaultAccount` selecteert het voorkeursaccount in configuraties met meerdere accounts.
- `channels.matrix.autoJoin` staat standaard op `off`, dus uitgenodigde rooms en nieuwe DM-achtige uitnodigingen worden genegeerd totdat je `autoJoin: "allowlist"` met `autoJoinAllowlist` of `autoJoin: "always"` instelt.
- `channels.matrix.execApprovals`: Matrix-native levering van exec-goedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false` of `"auto"` (standaard). In automatische modus worden exec-goedkeuringen geactiveerd wanneer goedkeurders kunnen worden afgeleid uit `approvers` of `commands.ownerAllowFrom`.
  - `approvers`: Matrix-gebruikers-ID's (bijv. `@owner:example.org`) die exec-aanvragen mogen goedkeuren.
  - `agentFilter`: optionele allowlist met agent-ID's. Laat weg om goedkeuringen voor alle agents door te sturen.
  - `sessionFilter`: optionele sessiesleutelpatronen (substring of regex).
  - `target`: waar goedkeuringsprompts naartoe worden gestuurd. `"dm"` (standaard), `"channel"` (oorspronkelijke room) of `"both"`.
  - Overschrijvingen per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` bepaalt hoe Matrix-DM's in sessies worden gegroepeerd: `per-user` (standaard) deelt per gerouteerde peer, terwijl `per-room` elke DM-room isoleert.
- Matrix-statusprobes en live directory-lookups gebruiken hetzelfde proxybeleid als runtimeverkeer.
- De volledige Matrix-configuratie, targetingregels en installatievoorbeelden zijn gedocumenteerd in [Matrix](/nl/channels/matrix).

### Microsoft Teams

Microsoft Teams wordt ondersteund door een Plugin en geconfigureerd onder `channels.msteams`.

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
- De volledige Teams-configuratie (referenties, webhook, DM-/groepsbeleid, overschrijvingen per team/per kanaal) is gedocumenteerd in [Microsoft Teams](/nl/channels/msteams).

### IRC

IRC wordt ondersteund door een Plugin en geconfigureerd onder `channels.irc`.

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
- Optionele `channels.irc.defaultAccount` overschrijft de standaard accountselectie wanneer deze overeenkomt met een geconfigureerde account-ID.
- De volledige IRC-kanaalconfiguratie (host/poort/TLS/kanalen/allowlists/mention-gating) is gedocumenteerd in [IRC](/nl/channels/irc).

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

- `default` wordt gebruikt wanneer `accountId` is weggelaten (CLI + routering).
- Omgevingstokens gelden alleen voor het **standaard**account.
- Basiskanaalinstellingen gelden voor alle accounts, tenzij ze per account worden overschreven.
- Gebruik `bindings[].match.accountId` om elk account naar een andere agent te routeren.
- Als je een niet-standaardaccount toevoegt via `openclaw channels add` (of kanaalonboarding) terwijl je nog een enkelaccount-configuratie op kanaaltopniveau gebruikt, promoveert OpenClaw eerst accountspecifieke enkelaccountwaarden op topniveau naar de accountmap van het kanaal, zodat het oorspronkelijke account blijft werken. De meeste kanalen verplaatsen ze naar `channels.<channel>.accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaarddoel behouden.
- Bestaande kanaalgebonden bindings (zonder `accountId`) blijven overeenkomen met het standaardaccount; accountspecifieke bindings blijven optioneel.
- `openclaw doctor --fix` repareert ook gemengde vormen door accountspecifieke enkelaccountwaarden op topniveau te verplaatsen naar het gepromoveerde account dat voor dat kanaal is gekozen. De meeste kanalen gebruiken `accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaarddoel behouden.

### Andere Plugin-kanalen

Veel Plugin-kanalen worden geconfigureerd als `channels.<id>` en gedocumenteerd op hun eigen kanaalpagina's (bijvoorbeeld Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat en Twitch).
Zie de volledige kanaalindex: [Kanalen](/nl/channels).

### Mention-gating voor groepschats

Groepsberichten vereisen standaard een **mention** (metadata-mention of veilige regex-patronen). Geldt voor WhatsApp-, Telegram-, Discord-, Google Chat- en iMessage-groepschats.

Zichtbare antwoorden worden afzonderlijk beheerd. Normale groeps-, kanaal- en interne directe WebChat-aanvragen gebruiken standaard automatische definitieve levering: definitieve assistenttekst wordt geplaatst via het legacy pad voor zichtbare antwoorden. Kies `messages.visibleReplies: "message_tool"` of `messages.groupChat.visibleReplies: "message_tool"` wanneer zichtbare uitvoer alleen moet worden geplaatst nadat de agent `message(action=send)` aanroept. Als het model definitieve tekst teruggeeft zonder de message-tool aan te roepen in een opt-in modus met alleen tools, blijft die definitieve tekst privé en registreert het uitgebreide Gateway-log onderdrukte payloadmetadata.

Zichtbare antwoorden met alleen tools vereisen een model/runtime die betrouwbaar tools aanroept, en worden aanbevolen voor gedeelde omgevingsrooms op modellen van de nieuwste generatie, zoals GPT 5.5. Sommige zwakkere modellen kunnen definitieve tekst beantwoorden, maar begrijpen niet dat bron-zichtbare uitvoer met `message(action=send)` moet worden verzonden. Gebruik voor die modellen `"automatic"`, zodat de definitieve assistentbeurt het zichtbare antwoordpad is. Als het sessielog assistenttekst toont met `didSendViaMessagingTool: false`, heeft het model privé definitieve tekst geproduceerd in plaats van de message-tool aan te roepen. Schakel naar een sterker model voor tool-aanroepen voor dat kanaal, inspecteer het uitgebreide Gateway-log voor de samenvatting van de onderdrukte payload, of stel `messages.groupChat.visibleReplies: "automatic"` in om zichtbare definitieve antwoorden te gebruiken voor elke groeps-/kanaalaanvraag.

Als de message-tool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw terug op automatische zichtbare antwoorden in plaats van de respons stilzwijgend te onderdrukken. `openclaw doctor` waarschuwt voor deze mismatch.

Deze regel geldt voor normale definitieve tekst van agents. Conversation bindings die eigendom zijn van een Plugin gebruiken het teruggegeven antwoord van de eigenaar-Plugin als zichtbare respons voor geclaimde bound-thread-beurten; de Plugin hoeft voor die binding-antwoorden geen `message(action=send)` aan te roepen.

**Probleemoplossing: groeps-@mention activeert typen en daarna stilte (geen fout)**

Symptoom: een groeps-/kanaal-@mention toont de typindicator en het Gateway-log meldt `dispatch complete (queuedFinal=false, replies=0)`, maar er verschijnt geen bericht in de room. DM's naar dezelfde agent antwoorden normaal.

Oorzaak: de zichtbare-antwoordmodus voor de groep/het kanaal wordt resolved naar `"message_tool"`, dus OpenClaw voert de beurt uit maar onderdrukt de definitieve assistenttekst tenzij de agent `message(action=send)` aanroept. Er is geen `NO_REPLY`-contract in deze modus; geen message-toolaanroep betekent geen bronantwoord. Er is geen fout omdat onderdrukking het geconfigureerde gedrag is. Normale groeps- en kanaalbeurten gebruiken standaard `"automatic"`, dus dit symptoom verschijnt alleen wanneer `messages.groupChat.visibleReplies` (of globale `messages.visibleReplies`) expliciet is ingesteld op `"message_tool"`. Harness `defaultVisibleReplies` geldt hier niet — de resolver voor groep/kanaal negeert dit; het beïnvloedt alleen directe/bronchats (de Codex-harness onderdrukt directe-chatfinals op die manier).

Oplossing: kies een sterker model voor tool-aanroepen, verwijder de expliciete `"message_tool"`-overschrijving om terug te vallen op de standaard `"automatic"`, of stel `messages.groupChat.visibleReplies: "automatic"` in om zichtbare antwoorden af te dwingen voor elke groeps-/kanaalaanvraag. De Gateway hot-reloadt de `messages`-configuratie nadat het bestand is opgeslagen; herstart de Gateway alleen wanneer file watching of configuratieherladen in de deployment is uitgeschakeld.

**Mention-typen:**

- **Metadata-mentions**: Native platform-@mentions. Genegeerd in WhatsApp self-chatmodus.
- **Tekstpatronen**: Veilige regex-patronen in `agents.list[].groupChat.mentionPatterns`. Ongeldige patronen en onveilige geneste herhaling worden genegeerd.
- Mention-gating wordt alleen afgedwongen wanneer detectie mogelijk is (native mentions of ten minste één patroon).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` stelt de globale standaard in. Kanalen kunnen dit overschrijven met `channels.<channel>.historyLimit` (of per account). Stel `0` in om uit te schakelen.

`messages.groupChat.unmentionedInbound: "room_event"` dient niet-genoemde always-on groeps-/kanaalberichten in als stille roomcontext op ondersteunde kanalen. Genoemde berichten, commando's en directe berichten blijven gebruikersaanvragen. Zie [Omgevingsroom-events](/nl/channels/ambient-room-events) voor volledige Discord-, Slack- en Telegram-voorbeelden.

`messages.visibleReplies` is de globale standaard voor bron-events; `messages.groupChat.visibleReplies` overschrijft dit voor groeps-/kanaal-bron-events. Wanneer `messages.visibleReplies` niet is ingesteld, gebruiken directe/bronchats de geselecteerde runtime of harness-standaard, maar interne directe WebChat-beurten gebruiken automatische definitieve levering voor Pi/Codex-promptpariteit. Stel `messages.visibleReplies: "message_tool"` in om bewust `message(action=send)` te vereisen voor zichtbare uitvoer. Kanaal-allowlists en mention-gating bepalen nog steeds of een event wordt verwerkt.

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

Resolutie: overschrijving per DM → providerstandaard → geen limiet (alles behouden).

Ondersteund: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-chatmodus

Neem je eigen nummer op in `allowFrom` om self-chatmodus in te schakelen (negeert native @mentions, reageert alleen op tekstpatronen):

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

<Accordion title="Commandodetails">

- Dit blok configureert opdrachtoppervlakken. Zie [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde opdrachtcatalogus.
- Deze pagina is een **config-key-referentie**, niet de volledige opdrachtcatalogus. Kanaal-/Plugin-eigen opdrachten zoals QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, apparaatkoppeling `/pair`, geheugen `/dreaming`, telefoonbediening `/phone` en Talk `/voice` worden gedocumenteerd op hun kanaal-/Plugin-pagina's plus [Slash-opdrachten](/nl/tools/slash-commands).
- Tekstopdrachten moeten **zelfstandige** berichten zijn met een voorafgaande `/`.
- `native: "auto"` schakelt native opdrachten in voor Discord/Telegram en laat Slack uit.
- `nativeSkills: "auto"` schakelt native skill-opdrachten in voor Discord/Telegram en laat Slack uit.
- Overschrijf per kanaal: `channels.discord.commands.native` (bool of `"auto"`). Voor Discord slaat `false` native opdrachtregistratie en opschoning tijdens het opstarten over.
- Overschrijf native skill-registratie per kanaal met `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` voegt extra Telegram-botmenu-items toe.
- `bash: true` schakelt `! <cmd>` in voor de hostshell. Vereist `tools.elevated.enabled` en afzender in `tools.elevated.allowFrom.<channel>`.
- `config: true` schakelt `/config` in (leest/schrijft `openclaw.json`). Voor Gateway `chat.send`-clients vereisen persistente `/config set|unset`-schrijfacties ook `operator.admin`; alleen-lezen `/config show` blijft beschikbaar voor normale operatorclients met schrijfscope.
- `mcp: true` schakelt `/mcp` in voor door OpenClaw beheerde MCP-serverconfiguratie onder `mcp.servers`.
- `plugins: true` schakelt `/plugins` in voor Plugin-detectie, installatie en in-/uitschakelbediening.
- `channels.<provider>.configWrites` beperkt configuratiemutaties per kanaal (standaard: true).
- Voor kanalen met meerdere accounts beperkt `channels.<provider>.accounts.<id>.configWrites` ook schrijfacties die op dat account zijn gericht (bijvoorbeeld `/allowlist --config --account <id>` of `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` schakelt `/restart` en Gateway-herstarttoolacties uit. Standaard: `true`.
- `ownerAllowFrom` is de expliciete eigenaar-allowlist voor opdrachten die alleen voor eigenaren zijn en kanaalacties met eigenaarspoort. Deze staat los van `allowFrom`.
- `ownerDisplay: "hash"` hasht eigenaar-id's in de systeemprompt. Stel `ownerDisplaySecret` in om hashing te beheren.
- `allowFrom` is per provider. Wanneer ingesteld, is dit de **enige** autorisatiebron (kanaal-allowlists/koppeling en `useAccessGroups` worden genegeerd).
- `useAccessGroups: false` staat toe dat opdrachten toegangsbeleid voor groepen omzeilen wanneer `allowFrom` niet is ingesteld.
- Kaart van opdrachtdocumentatie:
  - ingebouwde + gebundelde catalogus: [Slash-opdrachten](/nl/tools/slash-commands)
  - kanaalspecifieke opdrachtoppervlakken: [Kanalen](/nl/channels)
  - QQ Bot-opdrachten: [QQ Bot](/nl/channels/qqbot)
  - koppelingsopdrachten: [Koppeling](/nl/channels/pairing)
  - LINE-kaartopdracht: [LINE](/nl/channels/line)
  - geheugen-dreaming: [Dreaming](/nl/concepts/dreaming)

</Accordion>

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — sleutels op topniveau
- [Configuratie — agents](/nl/gateway/config-agents)
- [Kanaaloverzicht](/nl/channels)
