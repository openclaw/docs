---
read_when:
    - Een kanaal-Plugin configureren (authenticatie, toegangscontrole, meerdere accounts)
    - Probleemoplossing voor configuratiesleutels per kanaal
    - DM-beleid, groepsbeleid of vermeldingsgating auditen
summary: 'Kanaalconfiguratie: toegangscontrole, koppeling, sleutels per kanaal voor Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en meer'
title: Configuratie — kanalen
x-i18n:
    generated_at: "2026-06-27T17:31:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

Configuratiesleutels per kanaal onder `channels.*`. Behandelt DM- en groepstoegang,
setups met meerdere accounts, mention gating en kanaalspecifieke sleutels voor Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage en de andere meegeleverde kanaalplugins.

Voor agents, tools, Gateway-runtime en andere sleutels op het hoogste niveau, zie
[Configuratiereferentie](/nl/gateway/configuration-reference).

## Kanalen

Elk kanaal start automatisch wanneer de configuratiesectie ervan bestaat (tenzij `enabled: false`).

### DM- en groepstoegang

Alle kanalen ondersteunen DM-beleid en groepsbeleid:

| DM-beleid           | Gedrag                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| `pairing` (standaard) | Onbekende afzenders krijgen een eenmalige koppelcode; eigenaar moet goedkeuren |
| `allowlist`         | Alleen afzenders in `allowFrom` (of gekoppelde toelatingsopslag)         |
| `open`              | Alle inkomende DM's toestaan (vereist `allowFrom: ["*"]`)                |
| `disabled`          | Alle inkomende DM's negeren                                             |

| Groepsbeleid          | Gedrag                                                |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (standaard) | Alleen groepen die overeenkomen met de geconfigureerde allowlist |
| `open`                | Groepsallowlists omzeilen (mention gating blijft van toepassing) |
| `disabled`            | Alle groeps-/ruimberichten blokkeren                  |

<Note>
`channels.defaults.groupPolicy` stelt de standaard in wanneer de `groupPolicy` van een provider niet is ingesteld.
Koppelcodes verlopen na 1 uur. Openstaande DM-koppelingsverzoeken zijn beperkt tot **3 per kanaal**.
Als een providerblok volledig ontbreekt (`channels.<provider>` afwezig), valt het groepsbeleid tijdens runtime terug op `allowlist` (fail-closed) met een opstartwaarschuwing.
</Note>

### Modeloverschrijvingen per kanaal

Gebruik `channels.modelByChannel` om specifieke kanaal-ID's of direct-message-peers aan een model vast te pinnen. Waarden accepteren `provider/model` of geconfigureerde modelaliassen. De kanaaltoewijzing wordt toegepast wanneer een sessie nog geen modeloverschrijving heeft (bijvoorbeeld ingesteld via `/model`).

Voor groeps-/threadgesprekken zijn sleutels kanaalspecifieke groeps-ID's, topic-ID's of kanaalnamen. Voor direct-message-gesprekken (DM) zijn sleutels peer-ID's die zijn afgeleid van de afzenderidentiteit van het kanaal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` of `SenderId`). De exacte sleutelvorm hangt af van het kanaal:

| Kanaal   | DM-sleutelvorm      | Voorbeeld                                    |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | onbewerkt gebruikers-ID | `123456789`                              |
| Discord  | onbewerkt gebruikers-ID | `987654321`                              |
| WhatsApp | telefoonnummer of JID | `15551234567`                              |
| Matrix   | Matrix-gebruikers-ID | `@user:matrix.org`                         |
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

DM-specifieke sleutels komen alleen overeen in direct-message-gesprekken; ze hebben geen invloed op groeps-/threadroutering.

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
- `channels.defaults.contextVisibility`: standaard zichtbaarheidsmodus voor aanvullende context voor alle kanalen. Waarden: `all` (standaard, neem alle geciteerde/thread-/geschiedeniscontext op), `allowlist` (neem alleen context op van afzenders op de allowlist), `allowlist_quote` (hetzelfde als allowlist maar behoud expliciete quote-/antwoordcontext). Overschrijving per kanaal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: gezonde kanaalstatussen opnemen in Heartbeat-uitvoer.
- `channels.defaults.heartbeat.showAlerts`: gedegradeerde/foutstatussen opnemen in Heartbeat-uitvoer.
- `channels.defaults.heartbeat.useIndicator`: compacte Heartbeat-uitvoer in indicatorstijl renderen.

### WhatsApp

WhatsApp loopt via het webkanaal van de Gateway (Baileys Web). Het start automatisch wanneer er een gekoppelde sessie bestaat.

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

- Items op het hoogste niveau in `bindings[]` met `type: "acp"` configureren persistente ACP-bindingen voor WhatsApp-DM's en groepen. Gebruik een rechtstreeks E.164-nummer of WhatsApp-groeps-JID in `match.peer.id`. Veldsemantiek wordt gedeeld in [ACP-agents](/nl/tools/acp-agents#persistent-channel-bindings).

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

- Uitgaande opdrachten gebruiken standaard account `default` als dat aanwezig is; anders het eerste geconfigureerde account-ID (gesorteerd).
- Optioneel overschrijft `channels.whatsapp.defaultAccount` die fallbackselectie van het standaardaccount wanneer deze overeenkomt met een geconfigureerd account-ID.
- De verouderde Baileys-authenticatiemap voor één account wordt door `openclaw doctor` gemigreerd naar `whatsapp/default`.
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

- Bottoken: `channels.telegram.botToken` of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks worden geweigerd), met `TELEGRAM_BOT_TOKEN` als fallback voor het standaardaccount.
- `apiRoot` is alleen de root van de Telegram Bot API. Gebruik `https://api.telegram.org` of je zelf gehoste/proxy-root, niet `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`-suffix.
- Optioneel overschrijft `channels.telegram.defaultAccount` de selectie van het standaardaccount wanneer deze overeenkomt met een geconfigureerd account-ID.
- Stel in setups met meerdere accounts (2+ account-ID's) een expliciete standaard in (`channels.telegram.defaultAccount` of `channels.telegram.accounts.default`) om fallbackroutering te vermijden; `openclaw doctor` waarschuwt wanneer dit ontbreekt of ongeldig is.
- `configWrites: false` blokkeert door Telegram geïnitieerde configuratieschrijfacties (supergroup-ID-migraties, `/config set|unset`).
- Items op het hoogste niveau in `bindings[]` met `type: "acp"` configureren persistente ACP-bindingen voor forumtopics (gebruik canonieke `chatId:topic:topicId` in `match.peer.id`). Veldsemantiek wordt gedeeld in [ACP-agents](/nl/tools/acp-agents#persistent-channel-bindings).
- Telegram-streamvoorbeelden gebruiken `sendMessage` + `editMessageText` (werkt in directe en groepschats).
- Retry-beleid: zie [Retrybeleid](/nl/concepts/retry).

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
- Rechtstreekse uitgaande aanroepen die een expliciete Discord-`token` opgeven, gebruiken die token voor de aanroep; accountinstellingen voor opnieuw proberen/beleid blijven afkomstig van het geselecteerde account in de actieve runtime-snapshot.
- Optionele `channels.discord.defaultAccount` overschrijft de standaardaccountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- Gebruik `user:<id>` (DM) of `channel:<id>` (guild-kanaal) voor bezorgdoelen; kale numerieke ID's worden geweigerd.
- Guild-slugs zijn kleine letters waarbij spaties zijn vervangen door `-`; kanaalsleutels gebruiken de gesluggede naam (geen `#`). Geef de voorkeur aan guild-ID's.
- Berichten die door bots zijn opgesteld, worden standaard genegeerd. `allowBots: true` schakelt ze in; gebruik `allowBots: "mentions"` om alleen botberichten te accepteren die de bot vermelden (eigen berichten worden nog steeds gefilterd).
- Kanalen die inkomende berichten van bots ondersteunen, kunnen gedeelde [botlusbescherming](/nl/channels/bot-loop-protection) gebruiken. Stel `channels.defaults.botLoopProtection` in voor basispaarbudgetten en overschrijf daarna alleen het kanaal of account wanneer één oppervlak andere limieten nodig heeft.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (en kanaaloverschrijvingen) laat berichten vallen die een andere gebruiker of rol vermelden maar niet de bot (met uitzondering van @everyone/@here).
- `channels.discord.mentionAliases` koppelt stabiele uitgaande `@handle`-tekst aan Discord-gebruikers-ID's vóór verzending, zodat bekende teamgenoten deterministisch kunnen worden vermeld, zelfs wanneer de tijdelijke directorycache leeg is. Overschrijvingen per account staan onder `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (standaard 17) splitst hoge berichten, zelfs wanneer ze onder 2000 tekens blijven.
- `channels.discord.suppressEmbeds` staat standaard op `true`, zodat uitgaande URL's niet worden uitgebreid tot Discord-linkvoorbeelden tenzij dit is uitgeschakeld. Expliciete `embeds`-payloads worden nog steeds normaal verzonden; toolaanroepen per bericht kunnen dit overschrijven met `suppressEmbeds`.
- `channels.discord.threadBindings` beheert Discord-threadgebonden routering:
  - `enabled`: Discord-overschrijving voor threadgebonden sessiefuncties (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en gebonden bezorging/routering)
  - `idleHours`: Discord-overschrijving voor automatisch ontfocussen bij inactiviteit in uren (`0` schakelt uit)
  - `maxAgeHours`: Discord-overschrijving voor harde maximale leeftijd in uren (`0` schakelt uit)
  - `spawnSessions`: schakelaar voor `sessions_spawn({ thread: true })` en automatische ACP-threadaanmaak/-binding bij thread-spawn (standaard: `true`)
  - `defaultSpawnContext`: native subagentcontext voor threadgebonden spawns (standaard `"fork"`)
- Toplevel `bindings[]`-items met `type: "acp"` configureren permanente ACP-bindingen voor kanalen en threads (gebruik kanaal-/thread-id in `match.peer.id`). Veldsemantiek wordt gedeeld in [ACP-agenten](/nl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` stelt de accentkleur in voor Discord-components v2-containers.
- `channels.discord.agentComponents.ttlMs` bepaalt hoelang verzonden callbacks van Discord-componenten geregistreerd blijven. De standaard is `1800000` (30 minuten), het maximum is `86400000` (24 uur), en overschrijvingen per account staan onder `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Langere waarden houden oude knoppen/selecties/formulieren langer bruikbaar, dus geef de voorkeur aan de kortste TTL die bij de workflow past.
- `channels.discord.voice` schakelt gesprekken in Discord-spraakkanelen en optionele auto-join + LLM + TTS-overschrijvingen in. Tekstuele Discord-configuraties laten spraak standaard uit; stel `channels.discord.voice.enabled=true` in om mee te doen.
- `channels.discord.voice.model` overschrijft optioneel het LLM-model dat wordt gebruikt voor antwoorden in Discord-spraakkanalen.
- `channels.discord.voice.daveEncryption` en `channels.discord.voice.decryptionFailureTolerance` worden doorgegeven aan DAVE-opties van `@discordjs/voice` (standaard `true` en `24`).
- `channels.discord.voice.connectTimeoutMs` beheert de initiële wachttijd op `@discordjs/voice` Ready voor `/vc join` en auto-join-pogingen (standaard `30000`).
- `channels.discord.voice.reconnectGraceMs` bepaalt hoelang een verbroken spraaksessie mag doen over het starten van reconnect-signalering voordat OpenClaw deze vernietigt (standaard `15000`).
- Discord-spraakweergave wordt niet onderbroken door een spreekstartgebeurtenis van een andere gebruiker. Om feedbacklussen te voorkomen negeert OpenClaw nieuwe spraakopname terwijl TTS afspeelt.
- OpenClaw probeert daarnaast spraakontvangst te herstellen door een spraaksessie te verlaten en opnieuw te joinen na herhaalde decryptiefouten.
- `channels.discord.streaming` is de canonieke sleutel voor streammodus. Discord gebruikt standaard `streaming.mode: "progress"`, zodat tool-/werkvoortgang in één bewerkt voorbeeldbericht verschijnt; stel `streaming.mode: "off"` in om dit uit te schakelen. Verouderde waarden `streamMode` en booleaanse `streaming` blijven runtime-aliassen; voer `openclaw doctor --fix` uit om opgeslagen configuratie te herschrijven.
- `channels.discord.autoPresence` koppelt runtime-beschikbaarheid aan botpresence (healthy => online, degraded => idle, exhausted => dnd) en staat optionele overschrijvingen van statustekst toe.
- `channels.discord.dangerouslyAllowNameMatching` schakelt veranderlijke naam-/tagmatching opnieuw in (noodcompatibiliteitsmodus).
- `channels.discord.execApprovals`: Discord-native bezorging van exec-goedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false` of `"auto"` (standaard). In automatische modus worden exec-goedkeuringen geactiveerd wanneer goedkeurders kunnen worden herleid uit `approvers` of `commands.ownerAllowFrom`.
  - `approvers`: Discord-gebruikers-ID's die exec-aanvragen mogen goedkeuren. Valt terug op `commands.ownerAllowFrom` wanneer weggelaten.
  - `agentFilter`: optionele allowlist voor agent-ID's. Laat weg om goedkeuringen voor alle agenten door te sturen.
  - `sessionFilter`: optionele sessiesleutelpatronen (substring of regex).
  - `target`: waar goedkeuringsprompts naartoe moeten worden gestuurd. `"dm"` (standaard) stuurt naar DM's van goedkeurders, `"channel"` stuurt naar het oorspronkelijke kanaal, `"both"` stuurt naar beide. Wanneer target `"channel"` bevat, zijn knoppen alleen bruikbaar door herleide goedkeurders.
  - `cleanupAfterResolve`: wanneer `true`, verwijdert goedkeurings-DM's na goedkeuring, afwijzing of timeout.

**Reactiemeldingsmodi:** `off` (geen), `own` (berichten van de bot, standaard), `all` (alle berichten), `allowlist` (uit `guilds.<id>.users` op alle berichten).

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

- Serviceaccount-JSON: inline (`serviceAccount`) of gebaseerd op een bestand (`serviceAccountFile`).
- Serviceaccount SecretRef wordt ook ondersteund (`serviceAccountRef`).
- Env-fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` of `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Gebruik `spaces/<spaceId>` of `users/<userId>` voor bezorgdoelen.
- `channels.googlechat.dangerouslyAllowNameMatching` schakelt veranderlijke matching van e-mailprincipals opnieuw in (noodcompatibiliteitsmodus).

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

- **Socket-modus** vereist zowel `botToken` als `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` voor de standaard account-env-fallback).
- **HTTP-modus** vereist `botToken` plus `signingSecret` (op rootniveau of per account).
- `socketMode` geeft Slack SDK Socket Mode-transportafstemming door aan de publieke Bolt receiver API. Gebruik dit alleen bij onderzoek naar ping/pong-time-outs of verouderd websocketgedrag. `clientPingTimeout` heeft standaard `15000`; `serverPingTimeout` en `pingPongLoggingEnabled` worden alleen doorgegeven wanneer ze zijn geconfigureerd.
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren platte-tekststrings
  of SecretRef-objecten.
- Slack-accountsnapshots tonen bron/statusvelden per credential, zoals
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` en, in HTTP-modus,
  `signingSecretStatus`. `configured_unavailable` betekent dat het account is
  geconfigureerd via SecretRef, maar dat het huidige opdracht-/runtimepad de
  secretwaarde niet kon oplossen.
- `configWrites: false` blokkeert door Slack geïnitieerde configschrijfacties.
- Optioneel `channels.slack.defaultAccount` overschrijft de standaard accountselectie wanneer het overeenkomt met een geconfigureerde account-id.
- `channels.slack.streaming.mode` is de canonieke Slack-streammodussleutel. `channels.slack.streaming.nativeTransport` beheert Slacks native streamingtransport. Legacy `streamMode`-, booleaanse `streaming`- en `nativeStreaming`-waarden blijven runtime-aliassen; voer `openclaw doctor --fix` uit om opgeslagen config te herschrijven.
- `unfurlLinks` en `unfurlMedia` geven Slacks `chat.postMessage`-booleans voor link- en media-unfurling door voor botantwoorden. `unfurlLinks` is standaard `false`, zodat uitgaande botlinks niet inline uitklappen tenzij dit is ingeschakeld; `unfurlMedia` wordt weggelaten tenzij geconfigureerd. Stel een van beide waarden in op `channels.slack.accounts.<accountId>` om de top-level waarde voor één account te overschrijven.
- Gebruik `user:<id>` (DM) of `channel:<id>` voor afleverdoelen.

**Reactiemeldingsmodi:** `off`, `own` (standaard), `all`, `allowlist` (uit `reactionAllowlist`).

**Threadsessie-isolatie:** `thread.historyScope` is per-thread (standaard) of gedeeld over het kanaal. `thread.inheritParent` kopieert het transcript van het bovenliggende kanaal naar nieuwe threads.

- Slack native streaming plus de Slack assistant-achtige threadstatus "is typing..." vereisen een antwoordthreaddoel. Top-level DM's blijven standaard buiten threads, zodat ze nog steeds kunnen streamen via Slack-concept-post-en-bewerkvoorbeelden in plaats van de native stream/status-preview in threadstijl te tonen.
- `typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl een antwoord loopt, en verwijdert die na voltooiing. Gebruik een Slack-emoji-shortcode zoals `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native levering aan de approval-client en autorisatie van exec-goedkeurders. Zelfde schema als Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-gebruikers-ID's), `agentFilter`, `sessionFilter` en `target` (`"dm"`, `"channel"` of `"both"`). Plugin-goedkeuringen kunnen dit native-clientpad gebruiken voor verzoeken vanuit Slack wanneer Slack Plugin-goedkeurders worden opgelost; Slack-native levering van Plugin-goedkeuringen kan ook worden ingeschakeld via `approvals.plugin` voor sessies vanuit Slack of Slack-doelen. Plugin-goedkeuringen gebruiken Slack Plugin-goedkeurders uit `allowFrom` en standaardroutering, niet exec-goedkeurders.

| Actiegroep | Standaard | Notities              |
| ---------- | --------- | --------------------- |
| reactions  | enabled   | Reageer + reacties tonen |
| messages   | enabled   | Lezen/verzenden/bewerken/verwijderen |
| pins       | enabled   | Vastzetten/losmaken/tonen |
| memberInfo | enabled   | Lidinformatie         |
| emojiList  | enabled   | Aangepaste emoji-lijst |

### Mattermost

Mattermost wordt als gebundelde Plugin meegeleverd in huidige OpenClaw-releases. Oudere of
aangepaste builds kunnen een actueel npm-pakket installeren met
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

Chatmodi: `oncall` (reageer op @-vermelding, standaard), `onmessage` (elk bericht), `onchar` (berichten die beginnen met triggerprefix).

Wanneer native Mattermost-opdrachten zijn ingeschakeld:

- `commands.callbackPath` moet een pad zijn (bijvoorbeeld `/api/channels/mattermost/command`), geen volledige URL.
- `commands.callbackUrl` moet naar het OpenClaw Gateway-eindpunt verwijzen en bereikbaar zijn vanaf de Mattermost-server.
- Native slash-callbacks worden geauthenticeerd met de per-opdracht-tokens die
  Mattermost retourneert tijdens slash command-registratie. Als registratie mislukt of er geen
  opdrachten worden geactiveerd, wijst OpenClaw callbacks af met
  `Unauthorized: invalid command token.`
- Voor private/tailnet/interne callbackhosts kan Mattermost vereisen dat
  `ServiceSettings.AllowedUntrustedInternalConnections` de callbackhost/het callbackdomein bevat.
  Gebruik host-/domeinwaarden, geen volledige URL's.
- `channels.mattermost.configWrites`: sta door Mattermost geïnitieerde configschrijfacties toe of weiger ze.
- `channels.mattermost.requireMention`: vereis `@mention` voordat in kanalen wordt geantwoord.
- `channels.mattermost.groups.<channelId>.requireMention`: overschrijving per kanaal voor vermeldingscontrole (`"*"` voor standaard).
- Optioneel `channels.mattermost.defaultAccount` overschrijft de standaard accountselectie wanneer het overeenkomt met een geconfigureerde account-id.

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

- `channels.signal.account`: pin kanaalstart aan een specifieke Signal-accountidentiteit.
- `channels.signal.configWrites`: sta door Signal geïnitieerde configschrijfacties toe of weiger ze.
- Optioneel `channels.signal.defaultAccount` overschrijft de standaard accountselectie wanneer het overeenkomt met een geconfigureerde account-id.

### iMessage

OpenClaw start `imsg rpc` (JSON-RPC via stdio). Geen daemon of poort vereist. Dit is het voorkeurspad voor nieuwe OpenClaw iMessage-setups wanneer de host Messages-database- en Automation-machtigingen kan verlenen.

BlueBubbles-ondersteuning is verwijderd. `channels.bluebubbles` is geen ondersteund runtime-configoppervlak in huidige OpenClaw. Migreer oude configs naar `channels.imessage`; gebruik [BlueBubbles-verwijdering en het imsg iMessage-pad](/nl/announcements/bluebubbles-imessage) voor de korte versie en [Overstappen vanaf BlueBubbles](/nl/channels/imessage-from-bluebubbles) voor de volledige vertaaltabel.

Als de Gateway niet draait op de ingelogde Messages-Mac, laat `channels.imessage.enabled=true` staan en stel `channels.imessage.cliPath` in op een SSH-wrapper die `imsg "$@"` op die Mac uitvoert. Het standaard lokale `imsg`-pad is alleen voor macOS.

Voordat je op een SSH-wrapper vertrouwt voor productieverzendingen, verifieer je een uitgaande `imsg send` via exact die wrapper. Sommige macOS TCC-statussen wijzen Messages Automation toe aan `/usr/libexec/sshd-keygen-wrapper`, waardoor leesacties en probes kunnen werken terwijl verzendingen mislukken met AppleEvents `-1743`; zie [SSH-wrapperverzendingen mislukken met AppleEvents -1743](/nl/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- Optioneel `channels.imessage.defaultAccount` overschrijft de standaard accountselectie wanneer het overeenkomt met een geconfigureerde account-id.

- Vereist Full Disk Access tot de Messages-DB.
- Geef de voorkeur aan `chat_id:<id>`-doelen. Gebruik `imsg chats --limit 20` om chats te tonen.
- `cliPath` kan naar een SSH-wrapper verwijzen; stel `remoteHost` (`host` of `user@host`) in voor het ophalen van SCP-bijlagen.
- `attachmentRoots` en `remoteAttachmentRoots` beperken inkomende bijlagepaden (standaard: `/Users/*/Library/Messages/Attachments`).
- SCP gebruikt strikte host-key-controle, dus zorg dat de relayhostsleutel al bestaat in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: sta door iMessage geïnitieerde configschrijfacties toe of weiger ze.
- `channels.imessage.sendTransport`: voorkeurs-`imsg` RPC-verzendtransport voor normale uitgaande antwoorden. `auto` (standaard) gebruikt de IMCore-bridge voor bestaande chats wanneer die draait, en valt daarna terug op AppleScript; `bridge` vereist levering via private API; `applescript` forceert het publieke Messages-automatiseringspad.
- `channels.imessage.actions.*`: schakel private API-acties in die ook worden bewaakt door `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` staat standaard uit; zet dit op `true` voordat je inkomende media in agentbeurten verwacht.
- Inkomend herstel na een bridge-/Gateway-herstart is automatisch (GUID-dedupe plus een leeftijdsgrens voor verouderde backlog). Bestaande `channels.imessage.catchup.enabled: true`-configs worden nog steeds gerespecteerd als verouderd compatibiliteitsprofiel.
- `channels.imessage.groups`: groepsregister en instellingen per groep. Met `groupPolicy: "allowlist"` configureer je expliciete `chat_id`-sleutels of een `"*"`-wildcardvermelding, zodat groepsberichten de registerpoort kunnen passeren.
- Top-level `bindings[]`-vermeldingen met `type: "acp"` kunnen iMessage-gesprekken aan persistente ACP-sessies binden. Gebruik een genormaliseerde handle of expliciet chatdoel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gedeelde veldsemantiek: [ACP Agents](/nl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Voorbeeld van iMessage SSH-wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix wordt ondersteund door een Plugin en geconfigureerd onder `channels.matrix`.

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` staat private/interne homeservers toe. `proxy` en deze netwerk-opt-in zijn onafhankelijke controles.
- `channels.matrix.defaultAccount` selecteert het voorkeursaccount in configuraties met meerdere accounts.
- `channels.matrix.autoJoin` staat standaard op `off`, waardoor uitgenodigde rooms en nieuwe DM-achtige uitnodigingen worden genegeerd totdat je `autoJoin: "allowlist"` met `autoJoinAllowlist` of `autoJoin: "always"` instelt.
- `channels.matrix.execApprovals`: Matrix-native levering van exec-goedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false` of `"auto"` (standaard). In automatische modus worden exec-goedkeuringen geactiveerd wanneer goedkeurders kunnen worden opgelost uit `approvers` of `commands.ownerAllowFrom`.
  - `approvers`: Matrix-gebruikers-ID's (bijv. `@owner:example.org`) die exec-verzoeken mogen goedkeuren.
  - `agentFilter`: optionele allowlist voor agent-ID's. Laat weg om goedkeuringen voor alle agents door te sturen.
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

- Hier behandelde kernsleutelpaden: `channels.msteams`, `channels.msteams.configWrites`.
- De volledige Teams-configuratie (referenties, Webhook, DM-/groepsbeleid, overschrijvingen per team/per kanaal) is gedocumenteerd in [Microsoft Teams](/nl/channels/msteams).

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

- Hier behandelde kernsleutelpaden: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Optioneel `channels.irc.defaultAccount` overschrijft de standaard accountselectie wanneer dit overeenkomt met een geconfigureerd account-ID.
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
- Als je een niet-standaardaccount toevoegt via `openclaw channels add` (of kanaalonboarding) terwijl je nog een top-level kanaalconfiguratie met één account gebruikt, promoveert OpenClaw eerst account-scoped top-level waarden voor één account naar de accountmap van het kanaal, zodat het oorspronkelijke account blijft werken. De meeste kanalen verplaatsen ze naar `channels.<channel>.accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaarddoel behouden.
- Bestaande channel-only bindings (zonder `accountId`) blijven overeenkomen met het standaardaccount; account-scoped bindings blijven optioneel.
- `openclaw doctor --fix` repareert ook gemengde vormen door account-scoped top-level waarden voor één account te verplaatsen naar het gepromoveerde account dat voor dat kanaal is gekozen. De meeste kanalen gebruiken `accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaarddoel behouden.

### Andere Plugin-kanalen

Veel Plugin-kanalen worden geconfigureerd als `channels.<id>` en gedocumenteerd op hun eigen kanaalpagina's (bijvoorbeeld Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat en Twitch).
Zie de volledige kanaalindex: [Kanalen](/nl/channels).

### Mention-gating voor groepschats

Groepsberichten vereisen standaard een **mention** (metadata-mention of veilige regex-patronen). Geldt voor groepschats in WhatsApp, Telegram, Discord, Google Chat en iMessage.

Zichtbare antwoorden worden apart beheerd. Normale groeps-, kanaal- en interne directe WebChat-verzoeken gebruiken standaard automatische definitieve levering: definitieve assistenttekst wordt geplaatst via het verouderde zichtbare-antwoordpad. Kies `messages.visibleReplies: "message_tool"` of `messages.groupChat.visibleReplies: "message_tool"` wanneer zichtbare uitvoer alleen mag worden geplaatst nadat de agent `message(action=send)` aanroept. Als het model definitieve tekst retourneert zonder de berichttool aan te roepen in een opt-in tool-only modus, blijft die definitieve tekst privé en registreert de uitgebreide Gateway-log onderdrukte payloadmetadata.

Tool-only zichtbare antwoorden vereisen een model/runtime die betrouwbaar tools aanroept en worden aanbevolen voor gedeelde ambient rooms op modellen van de nieuwste generatie, zoals GPT 5.5. Sommige zwakkere modellen kunnen definitieve tekst beantwoorden, maar begrijpen niet dat source-zichtbare uitvoer met `message(action=send)` moet worden verzonden. Gebruik voor die modellen `"automatic"`, zodat de definitieve assistentbeurt het zichtbare-antwoordpad is. Als het sessielog assistenttekst toont met `didSendViaMessagingTool: false`, heeft het model privé definitieve tekst geproduceerd in plaats van de berichttool aan te roepen. Schakel voor dat kanaal over naar een sterker tool-aanroepend model, inspecteer de uitgebreide Gateway-log voor de samenvatting van de onderdrukte payload, of stel `messages.groupChat.visibleReplies: "automatic"` in om zichtbare definitieve antwoorden te gebruiken voor elk groeps-/kanaalverzoek.

Als de berichttool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw terug op automatische zichtbare antwoorden in plaats van het antwoord stil te onderdrukken. `openclaw doctor` waarschuwt voor deze mismatch.

Deze regel geldt voor normale definitieve tekst van de agent. Conversatiebindings die eigendom zijn van een Plugin gebruiken het door de eigenaar-Plugin geretourneerde antwoord als de zichtbare reactie voor geclaimde bound-thread-beurten; de Plugin hoeft `message(action=send)` niet aan te roepen voor die bindingsantwoorden.

**Probleemoplossing: groeps-@mention activeert typen en daarna stilte (geen fout)**

Symptoom: een groeps-/kanaal-@mention toont de typindicator en de Gateway-log meldt `dispatch complete (queuedFinal=false, replies=0)`, maar er verschijnt geen bericht in de room. DM's naar dezelfde agent antwoorden normaal.

Oorzaak: de zichtbare-antwoordmodus voor groep/kanaal wordt opgelost naar `"message_tool"`, dus OpenClaw voert de beurt uit maar onderdrukt de definitieve assistenttekst tenzij de agent `message(action=send)` aanroept. Er is geen `NO_REPLY`-contract in deze modus; geen berichttool-aanroep betekent geen bronantwoord. Er is geen fout, omdat onderdrukking het geconfigureerde gedrag is. Normale groeps- en kanaalbeurten staan standaard op `"automatic"`, dus dit symptoom verschijnt alleen wanneer `messages.groupChat.visibleReplies` (of globale `messages.visibleReplies`) expliciet is ingesteld op `"message_tool"`. Harness `defaultVisibleReplies` is hier niet van toepassing — de groep-/kanaalresolver negeert dit; het beïnvloedt alleen directe/source-chats (de Codex-harness onderdrukt op die manier definitieve directe-chatantwoorden).

Oplossing: kies een sterker tool-aanroepend model, verwijder de expliciete `"message_tool"`-overschrijving om terug te vallen op de standaard `"automatic"`, of stel `messages.groupChat.visibleReplies: "automatic"` in om zichtbare antwoorden af te dwingen voor elk groeps-/kanaalverzoek. De Gateway laadt de `messages`-configuratie hot-reload nadat het bestand is opgeslagen; herstart de Gateway alleen wanneer file watching of configuratieherladen is uitgeschakeld in de deployment.

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

`messages.groupChat.unmentionedInbound: "room_event"` verzendt niet-genoemde altijd-aan groeps-/kanaalberichten als stille roomcontext op ondersteunde kanalen. Genoemde berichten, opdrachten en directe berichten blijven gebruikersverzoeken. Zie [Ambient room events](/nl/channels/ambient-room-events) voor volledige voorbeelden voor Discord, Slack en Telegram.

`messages.visibleReplies` is de globale standaard voor source-events; `messages.groupChat.visibleReplies` overschrijft dit voor groeps-/kanaal-source-events. Wanneer `messages.visibleReplies` niet is ingesteld, gebruiken directe/source-chats de geselecteerde runtime- of harnessstandaard, maar interne directe WebChat-beurten gebruiken automatische definitieve levering voor Pi/Codex-promptpariteit. Stel `messages.visibleReplies: "message_tool"` in om bewust `message(action=send)` te vereisen voor zichtbare uitvoer. Kanaal-allowlists en mention-gating bepalen nog steeds of een event wordt verwerkt.

#### Geschiedenislimieten voor DM's

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

Resolutie: overschrijving per DM → providerstandaard → geen limiet (alles bewaard).

Ondersteund: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-chatmodus

Neem je eigen nummer op in `allowFrom` om self-chatmodus in te schakelen (negeert native @-mentions, reageert alleen op tekstpatronen):

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

### Opdrachten (afhandeling van chatopdrachten)

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

<Accordion title="Opdrachtdetails">

- Dit blok configureert command-oppervlakken. Zie [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde command-catalogus.
- Deze pagina is een **config-sleutelreferentie**, niet de volledige command-catalogus. Kanaal-/Plugin-eigen commands zoals QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` en Talk `/voice` worden gedocumenteerd op hun kanaal-/Plugin-pagina's plus [Slash-opdrachten](/nl/tools/slash-commands).
- Tekstcommands moeten **zelfstandige** berichten zijn met een voorafgaande `/`.
- `native: "auto"` schakelt native commands in voor Discord/Telegram en laat Slack uit.
- `nativeSkills: "auto"` schakelt native skill-commands in voor Discord/Telegram en laat Slack uit.
- Per kanaal overschrijven: `channels.discord.commands.native` (bool of `"auto"`). Voor Discord slaat `false` native commandregistratie en opschoning tijdens het opstarten over.
- Overschrijf native skill-registratie per kanaal met `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` voegt extra Telegram-botmenu-items toe.
- `bash: true` schakelt `! <cmd>` in voor de host-shell. Vereist `tools.elevated.enabled` en afzender in `tools.elevated.allowFrom.<channel>`.
- `config: true` schakelt `/config` in (leest/schrijft `openclaw.json`). Voor Gateway-`chat.send`-clients vereisen persistente `/config set|unset`-schrijfacties ook `operator.admin`; alleen-lezen `/config show` blijft beschikbaar voor normale operatorclients met schrijfbereik.
- `mcp: true` schakelt `/mcp` in voor door OpenClaw beheerde MCP-serverconfiguratie onder `mcp.servers`.
- `plugins: true` schakelt `/plugins` in voor Plugin-detectie, installatie en bediening voor inschakelen/uitschakelen.
- `channels.<provider>.configWrites` begrenst configuratiewijzigingen per kanaal (standaard: true).
- Voor kanalen met meerdere accounts begrenst `channels.<provider>.accounts.<id>.configWrites` ook schrijfacties die op dat account zijn gericht (bijvoorbeeld `/allowlist --config --account <id>` of `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` schakelt `/restart` en Gateway-herstarttoolacties uit. Standaard: `true`.
- `ownerAllowFrom` is de expliciete eigenaar-allowlist voor alleen-eigenaar-commands en door eigenaar begrensde kanaalacties. Deze staat los van `allowFrom`.
- `ownerDisplay: "hash"` hasht eigenaar-id's in de systeemprompt. Stel `ownerDisplaySecret` in om hashing te beheren.
- `allowFrom` is per provider. Wanneer ingesteld, is dit de **enige** autorisatiebron (kanaal-allowlists/koppeling en `useAccessGroups` worden genegeerd).
- `useAccessGroups: false` laat commands access-group-beleid omzeilen wanneer `allowFrom` niet is ingesteld.
- Commanddocumentatiekaart:
  - ingebouwde + gebundelde catalogus: [Slash-opdrachten](/nl/tools/slash-commands)
  - kanaalspecifieke command-oppervlakken: [Kanalen](/nl/channels)
  - QQ Bot-commands: [QQ Bot](/nl/channels/qqbot)
  - koppelingscommands: [Koppeling](/nl/channels/pairing)
  - LINE-kaartcommand: [LINE](/nl/channels/line)
  - memory dreaming: [Dreaming](/nl/concepts/dreaming)

</Accordion>

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — sleutels op topniveau
- [Configuratie — agents](/nl/gateway/config-agents)
- [Kanalenoverzicht](/nl/channels)
