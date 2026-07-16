---
read_when:
    - Een kanaalplugin configureren (authenticatie, toegangsbeheer, meerdere accounts)
    - Problemen met configuratiesleutels per kanaal oplossen
    - DM-beleid, groepsbeleid of vermeldingsfiltering controleren
summary: 'Kanaalconfiguratie: toegangsbeheer, koppeling en sleutels per kanaal voor Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en meer'
title: Configuratie — kanalen
x-i18n:
    generated_at: "2026-07-16T15:35:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

Configuratiesleutels per kanaal onder `channels.*`: toegang tot privéberichten en groepen, configuraties met meerdere accounts, vermeldingsvereisten en kanaalspecifieke sleutels voor Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere kanaalplugins.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) voor agents, tools, de Gateway-runtime en andere sleutels op het hoogste niveau.

## Kanalen

Elk kanaal start automatisch wanneer de bijbehorende configuratiesectie bestaat (tenzij `enabled: false`). Telegram en iMessage worden meegeleverd in het kernpakket `openclaw`. Andere officiële kanalen (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost en meer) worden als afzonderlijke plugins geïnstalleerd met `openclaw plugins install <spec>`; zie [Kanalen](/nl/channels) voor de volledige lijst en installatiespecificaties.

### Toegang tot privéberichten en groepen

Alle kanalen ondersteunen beleid voor privéberichten en groepen:

| Beleid voor privéberichten | Gedrag                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `pairing` (standaard) | Onbekende afzenders krijgen een eenmalige koppelcode; de eigenaar moet deze goedkeuren |
| `allowlist`         | Alleen afzenders in `allowFrom` (of de opslag met gekoppelde toestemmingen) |
| `open`         | Alle inkomende privéberichten toestaan (vereist `allowFrom: ["*"]`) |
| `disabled`         | Alle inkomende privéberichten negeren                            |

| Groepsbeleid               | Gedrag                                                         |
| -------------------------- | -------------------------------------------------------------- |
| `allowlist` (standaard) | Alleen groepen die overeenkomen met de geconfigureerde toestemmingslijst |
| `open`         | Groepstoestemmingslijsten omzeilen (vermeldingsvereisten blijven van toepassing) |
| `disabled`         | Alle groeps-/ruimteberichten blokkeren                         |

<Note>
`channels.defaults.groupPolicy` stelt de standaardwaarde in wanneer `groupPolicy` van een provider niet is ingesteld.
Koppelcodes verlopen na 1 uur. Het aantal openstaande koppelverzoeken is beperkt tot **3 per account** (afgebakend per kanaal en account-id).
Als een providerblok volledig ontbreekt (`channels.<provider>` ontbreekt), valt het groepsbeleid tijdens runtime terug op `allowlist` (standaard weigeren), met een waarschuwing bij het opstarten.
</Note>

### Modeloverschrijvingen per kanaal

Gebruik `channels.modelByChannel` om specifieke kanaal-id's of gesprekspartners in privéberichten aan een model te koppelen. Waarden accepteren `provider/model` of geconfigureerde modelaliassen. De kanaaltoewijzing is alleen van toepassing wanneer een sessie nog geen actieve modeloverschrijving heeft (bijvoorbeeld een die via `/model` is ingesteld).

Voor groeps-/threadgesprekken zijn de sleutels kanaalspecifieke groeps-id's, onderwerp-id's of kanaalnamen. Voor privégesprekken (DM's) zijn de sleutels identificatoren van gesprekspartners die zijn afgeleid van de afzenderidentiteit van het kanaal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` of `SenderId`). De exacte sleutelvorm hangt af van het kanaal:

| Kanaal   | Sleutelvorm voor privéberichten | Voorbeeld                                    |
| -------- | -------------------------------- | -------------------------------------------- |
| Discord  | onbewerkte gebruikers-id         | `987654321`                           |
| Feishu   | `feishu:ou_...`               | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85`                           |
| Matrix   | Matrix-gebruikers-id              | `@user:matrix.org`                           |
| Slack    | `user:U...`                | `user:U12345`                           |
| Telegram | onbewerkte gebruikers-id          | `123456789`                           |
| WhatsApp | telefoonnummer of JID             | `15551234567`                           |

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

Sleutels die specifiek zijn voor privéberichten komen alleen overeen in privégesprekken; ze hebben geen invloed op de routering van groepen/threads.

### Kanaalstandaarden en Heartbeat

Gebruik `channels.defaults` voor gedeeld groepsbeleid en Heartbeat-gedrag voor alle providers:

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

- `channels.defaults.groupPolicy`: terugvalwaarde voor het groepsbeleid wanneer `groupPolicy` op providerniveau niet is ingesteld.
- `channels.defaults.contextVisibility`: standaardmodus voor de zichtbaarheid van aanvullende context voor alle kanalen. Waarden: `all` (standaard, alle geciteerde/thread-/geschiedeniscontext opnemen), `allowlist` (alleen context van afzenders op de toestemmingslijst opnemen), `allowlist_quote` (hetzelfde als de toestemmingslijst, maar expliciete citaat-/antwoordcontext behouden). Overschrijving per kanaal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: gezonde kanaalstatussen opnemen in de Heartbeat-uitvoer (standaard `false`).
- `channels.defaults.heartbeat.showAlerts`: verslechterde/foutstatussen opnemen in de Heartbeat-uitvoer (standaard `true`).
- `channels.defaults.heartbeat.useIndicator`: compacte Heartbeat-uitvoer in indicatorstijl weergeven (standaard `true`).

### WhatsApp

WhatsApp werkt via het webkanaal van de Gateway (Baileys Web). Het start automatisch wanneer er een gekoppelde sessie bestaat.

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
      maxAttempts: 12, // 0 = retry forever
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- `web.whatsapp.keepAliveIntervalMs` (standaard `25000`), `connectTimeoutMs` (standaard `60000`) en `defaultQueryTimeoutMs` (standaard `60000`) stemmen de Baileys-socket af.
- Standaardwaarden voor `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0` blijft onbeperkt opnieuw proberen in plaats van op te geven.
- Vermeldingen op het hoogste niveau in `bindings[]` met `type: "acp"` configureren permanente ACP-koppelingen voor WhatsApp-privéberichten en -groepen. Gebruik een rechtstreeks E.164-nummer of een WhatsApp-groeps-JID in `match.peer.id`. De veldsemantiek wordt gedeeld in [ACP-agents](/nl/tools/acp-agents#persistent-channel-bindings).

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

- Uitgaande opdrachten gebruiken standaard account `default` als dit aanwezig is; anders de eerste geconfigureerde account-id (gesorteerd).
- De optionele `channels.whatsapp.defaultAccount` overschrijft die standaardselectie van het terugvalaccount wanneer deze overeenkomt met een geconfigureerde account-id.
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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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

- Bottoken: `channels.telegram.botToken` of `channels.telegram.tokenFile` (alleen een normaal bestand; symbolische koppelingen worden geweigerd), met `TELEGRAM_BOT_TOKEN` als terugvalwaarde voor het standaardaccount.
- `apiRoot` is uitsluitend de hoofd-URL van de Telegram Bot API. Gebruik `https://api.telegram.org` of je zelfgehoste/proxy-hoofd-URL, niet `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` verwijdert een onbedoeld achtervoegsel `/bot<TOKEN>` aan het einde.
- Voor een zelfgehoste Bot API-server in de modus `--local` vermeldt `trustedLocalFileRoots` de hostpaden die OpenClaw mag lezen. Koppel het gegevensvolume van de server aan de OpenClaw-host en configureer de hoofdmap voor gegevens of de map per token; containerpaden onder `/var/lib/telegram-bot-api` worden naar die hoofdmappen toegewezen. Andere absolute paden blijven geweigerd.
- De optionele `channels.telegram.defaultAccount` overschrijft de standaardaccountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- Stel in configuraties met meerdere accounts (2+ account-id's) een expliciete standaardwaarde in (`channels.telegram.defaultAccount` of `channels.telegram.accounts.default`) om terugvalroutering te voorkomen; `openclaw doctor` waarschuwt wanneer deze ontbreekt of ongeldig is.
- `configWrites: false` blokkeert door Telegram geïnitieerde configuratieschrijfbewerkingen (migraties van supergroep-id's, `/config set|unset`).
- Vermeldingen op het hoogste niveau in `bindings[]` met `type: "acp"` configureren permanente ACP-koppelingen voor forumonderwerpen (gebruik de canonieke `chatId:topic:topicId` in `match.peer.id`). De veldsemantiek wordt gedeeld in [ACP-agents](/nl/tools/acp-agents#persistent-channel-bindings).
- Telegram-streamvoorbeelden gebruiken `sendMessage` + `editMessageText` (werkt in privé- en groepschats).
- `network.dnsResultOrder` is standaard ingesteld op `"ipv4first"` om veelvoorkomende IPv6-ophaalfouten te voorkomen.
- Beleid voor nieuwe pogingen: zie [Beleid voor nieuwe pogingen](/nl/concepts/retry).

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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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

- Token: `channels.discord.token`, met `DISCORD_BOT_TOKEN` als terugvaloptie voor het standaardaccount.
- Rechtstreekse uitgaande aanroepen die een expliciete Discord-`token` opgeven, gebruiken dat token voor de aanroep; instellingen voor nieuwe pogingen en beleid van het account komen nog steeds uit het geselecteerde account in de actieve runtimesnapshot.
- De optionele `channels.discord.defaultAccount` overschrijft de standaardaccountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- Gebruik `user:<id>` (DM) of `channel:<id>` (guildkanaal) als afleverdoel; losse numerieke ID's worden geweigerd.
- Guild-slugs bestaan uit kleine letters, waarbij spaties zijn vervangen door `-`; kanaalsleutels gebruiken de naam als slug (zonder `#`). Geef de voorkeur aan guild-ID's.
- Door bots geschreven berichten worden standaard genegeerd. `allowBots: true` schakelt ze in; gebruik `allowBots: "mentions"` om alleen botberichten te accepteren die de bot vermelden (eigen berichten worden nog steeds gefilterd).
- Kanalen die inkomende, door bots geschreven berichten ondersteunen, kunnen gedeelde [bescherming tegen botlussen](/nl/channels/bot-loop-protection) gebruiken. Stel `channels.defaults.botLoopProtection` in voor basisbudgetten per paar en overschrijf daarna alleen het kanaal of account wanneer één oppervlak andere limieten nodig heeft.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (en kanaaloverschrijvingen) verwijdert berichten die een andere gebruiker of rol vermelden, maar niet de bot (met uitzondering van @everyone/@here).
- `channels.discord.mentionAliases` koppelt stabiele uitgaande `@handle`-tekst vóór verzending aan Discord-gebruikers-ID's, zodat bekende teamgenoten deterministisch kunnen worden vermeld, zelfs wanneer de tijdelijke directorycache leeg is. Overschrijvingen per account staan onder `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (standaard `17`) splitst lange berichten, zelfs wanneer ze minder dan 2000 tekens bevatten.
- `channels.discord.suppressEmbeds` is standaard `true`, zodat uitgaande URL's niet worden uitgevouwen tot Discord-linkvoorbeelden, tenzij dit wordt uitgeschakeld. Expliciete `embeds`-payloads worden nog steeds normaal verzonden; toolaanroepen per bericht kunnen dit overschrijven met `suppressEmbeds`.
- `channels.discord.threadBindings` bepaalt de aan threads gebonden routering van Discord:
  - `enabled`: Discord-overschrijving voor functies van aan threads gebonden sessies (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` en gebonden aflevering/routering)
  - `idleHours`: Discord-overschrijving voor automatisch verlies van focus na inactiviteit, in uren (`0` schakelt dit uit)
  - `maxAgeHours`: Discord-overschrijving voor de absolute maximale leeftijd in uren (`0` schakelt dit uit)
  - `spawnSessions`: schakelaar voor het automatisch maken/binden van threads door `sessions_spawn({ thread: true })` en het starten van ACP-threads (standaard: `true`)
  - `defaultSpawnContext`: systeemeigen subagentcontext voor aan threads gebonden starts (standaard `"fork"`)
- Items op het hoogste niveau in `bindings[]` met `type: "acp"` configureren permanente ACP-bindingen voor kanalen en threads (gebruik de kanaal-/thread-id in `match.peer.id`). De veldsemantiek wordt gedeeld in [ACP-agenten](/nl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` stelt de accentkleur in voor Discord-components v2-containers.
- `channels.discord.agentComponents.ttlMs` bepaalt hoelang callbacks van verzonden Discord-componenten geregistreerd blijven. Standaard `1800000` (30 minuten), maximaal `86400000` (24 uur). Overschrijvingen per account staan onder `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Gebruik bij voorkeur de kortste TTL die bij de workflow past.
- `channels.discord.voice` schakelt gesprekken in Discord-spraakkanalen en optionele overschrijvingen voor automatisch deelnemen + LLM + TTS in. Discord-configuraties met alleen tekst laten spraak standaard uitgeschakeld; stel `channels.discord.voice.enabled=true` in om dit in te schakelen.
- `channels.discord.voice.model` overschrijft optioneel het LLM-model dat wordt gebruikt voor antwoorden in Discord-spraakkanalen.
- `channels.discord.voice.daveEncryption` (standaard `true`) en `channels.discord.voice.decryptionFailureTolerance` (standaard `24`) worden doorgegeven aan de DAVE-opties van `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` bepaalt de initiële wachttijd op `@discordjs/voice` Ready voor `/vc join` en pogingen om automatisch deel te nemen (standaard `30000`).
- `channels.discord.voice.reconnectGraceMs` bepaalt hoelang een verbroken spraaksessie erover mag doen om signalering voor opnieuw verbinden te starten voordat OpenClaw deze vernietigt (standaard `15000`).
- Het afspelen van spraak in Discord wordt niet onderbroken door de gebeurtenis dat een andere gebruiker begint te spreken. Om feedbacklussen te voorkomen, negeert OpenClaw nieuwe spraakopname terwijl TTS wordt afgespeeld.
- OpenClaw probeert daarnaast de ontvangst van spraak te herstellen door een spraaksessie na herhaalde ontsleutelingsfouten te verlaten en opnieuw binnen te gaan.
- `channels.discord.streaming` is de canonieke sleutel voor de streammodus. Discord gebruikt standaard `streaming.mode: "progress"`, zodat de voortgang van tools/werk in één bewerkt voorbeeldbericht verschijnt; stel `streaming.mode: "off"` in om dit uit te schakelen. Verouderde platte sleutels (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) worden tijdens runtime niet meer gelezen; voer `openclaw doctor --fix` uit om opgeslagen configuratie te migreren.
- `channels.discord.autoPresence` koppelt runtimebeschikbaarheid aan botaanwezigheid (gezond => online, verminderd => inactief, uitgeput => niet storen) en staat optionele overschrijvingen van statustekst toe.
- `channels.discord.guilds.<id>.presenceEvents` routeert aankomsten van menselijke beschikbaarheid als agentsysteemgebeurtenissen naar één geconfigureerd Discord-kanaal. In aanmerking komende leden moeten `channelId` kunnen bekijken; openbare threads nemen de zichtbaarheid van hun bovenliggende kanaal over, terwijl privéthreads daarnaast lidmaatschap of Manage Threads vereisen. `users` kan die doelgroep verder beperken. De functie vult de huidige onlineleden vanuit volledige `GUILD_CREATE`-snapshots, routeert waargenomen overgangen van offline naar online en behandelt een eerste later onlinesignaal voor een nog niet waargenomen lid als nieuw beschikbaar, zonder te stellen of diegene online kwam of na de snapshot deelnam. Guilds boven Discords snapshotlimiet van 75.000 leden vereisen eerst een expliciete offline-update. Instellingen voor begrenzing: `reconnectSuppressSeconds` (stille periode na een nieuwe Gateway-sessie terwijl de aanwezigheidsstatus van de guild opnieuw wordt opgebouwd, standaard 300, `0` schakelt dit uit) en `burstLimit`/`burstWindowSeconds` (frequentielimiet per guild voor succesvol in de wachtrij geplaatste gebeurtenissen, standaard 8 gebeurtenissen per voortschrijdend venster van 60s). Hervatte sessies starten het onderdrukkingsvenster voor opnieuw verbinden niet. De bestaande afkoelperiode van acht uur voor opnieuw begroeten per gebruiker blijft gelden. Hiervoor zijn `channels.discord.intents.presence=true`, de bevoorrechte Presence Intent in Discords Developer Portal, en een ingeschakelde Heartbeat van de agent vereist.
- `channels.discord.dangerouslyAllowNameMatching` schakelt overeenkomsten op basis van veranderlijke namen/tags opnieuw in (compatibiliteitsmodus voor noodgevallen).
- `channels.discord.execApprovals`: systeemeigen Discord-aflevering van uitvoeringsgoedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false` of `"auto"` (standaard). In de automatische modus worden uitvoeringsgoedkeuringen geactiveerd wanneer goedkeurders kunnen worden herleid uit `approvers` of `commands.ownerAllowFrom`.
  - `approvers`: Discord-gebruikers-ID's die uitvoeringsverzoeken mogen goedkeuren. Valt terug op `commands.ownerAllowFrom` wanneer dit wordt weggelaten.
  - `agentFilter`: optionele toelatingslijst met agent-ID's. Laat dit weg om goedkeuringen voor alle agenten door te sturen.
  - `sessionFilter`: optionele patronen voor sessiesleutels (subtekenreeks of reguliere expressie).
  - `target`: waar goedkeuringsverzoeken naartoe worden verzonden. `"dm"` (standaard) verzendt ze naar DM's van goedkeurders, `"channel"` verzendt ze naar het oorspronkelijke kanaal en `"both"` verzendt ze naar beide. Wanneer het doel `"channel"` bevat, kunnen de knoppen alleen door herkende goedkeurders worden gebruikt.
  - `cleanupAfterResolve`: verwijdert, wanneer `true`, goedkeurings-DM's na goedkeuring, afwijzing of time-out.

**Modi voor reactiemeldingen:** `off` (geen), `own` (berichten van de bot, standaard), `all` (alle berichten), `allowlist` (van `guilds.<id>.users` bij alle berichten).

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

- JSON van het serviceaccount: inline (`serviceAccount`) of vanuit een bestand (`serviceAccountFile`).
- SecretRef voor het serviceaccount wordt ook ondersteund (`serviceAccountRef`).
- Terugvalopties voor omgevingsvariabelen: `GOOGLE_CHAT_SERVICE_ACCOUNT` of `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (alleen het standaardaccount).
- Gebruik `spaces/<spaceId>` of `users/<userId>` als afleverdoel.
- `channels.googlechat.dangerouslyAllowNameMatching` schakelt overeenkomsten op basis van veranderlijke e-mailprincipals opnieuw in (compatibiliteitsmodus voor noodgevallen).

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
          systemPrompt: "Alleen korte antwoorden.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // uit | eerste | alle | gebundeld
      thread: {
        historyScope: "thread", // thread | kanaal
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
        mode: "partial", // uit | gedeeltelijk | blok | voortgang
        chunkMode: "length", // lengte | nieuwe regel
        nativeTransport: true, // gebruik de native streaming-API van Slack wanneer mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | kanaal | beide
      },
    },
  },
}
```

- **Socketmodus** vereist zowel `botToken` als `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` voor terugval op de omgevingsvariabelen van het standaardaccount).
- **HTTP-modus** vereist `botToken` plus `signingSecret` (op rootniveau of per account).
- `enterpriseOrgInstall: true` meldt een account aan voor het organisatiebrede gebeurtenispad van Slack Enterprise Grid. Bij het opstarten wordt het bottoken geverifieerd met `auth.test` en
  mislukt het proces wanneer de geconfigureerde modus niet overeenkomt met de installatie-identiteit van Slack.
  Enterprise-DM's moeten zijn uitgeschakeld of `dmPolicy: "open"` gebruiken met een geldige
  `allowFrom: ["*"]`. Kanaal- en gebruikersbeleid moeten stabiele Slack-ID's gebruiken;
  veranderlijke namen en niet-ondersteunde kanaalvoorvoegsels laten het opstarten mislukken. V1 verwerkt alleen
  rechtstreekse Socket Mode- of HTTP-`message`- en `app_mention`-gebeurtenissen met onmiddellijke
  antwoorden; relay, opdrachten, interacties, App Home, listeners voor reactiegebeurtenissen,
  pins, actietools, native goedkeuringen, bindingen, uitgestelde bezorging en
  proactieve verzendingen zijn niet beschikbaar. Door de listener beheerde bevestiging, typindicatie en
  statusreacties blijven beschikbaar met `reactions:write`; meldingen van inkomende reacties
  en reactieactietools zijn niet beschikbaar. Zie
  [Organisatiebrede installaties voor Enterprise Grid](/nl/channels/slack#enterprise-grid-org-wide-installs)
  voor het manifest met minimale bevoegdheden, de configuratieworkflow en alle beperkingen.
- `socketMode` geeft de transportafstemming van de Socket Mode van de Slack SDK door aan de openbare Bolt-receiver-API. Gebruik dit alleen bij onderzoek naar ping/pong-time-outs of verouderd websocketgedrag. `clientPingTimeout` is standaard `15000`; `serverPingTimeout` en `pingPongLoggingEnabled` worden alleen doorgegeven wanneer ze zijn geconfigureerd.
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren platte-tekstreeksen
  of SecretRef-objecten.
- Momentopnamen van Slack-accounts tonen bron-/statusvelden per referentie, zoals
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` en, in HTTP-modus,
  `signingSecretStatus`. `configured_unavailable` betekent dat het account is
  geconfigureerd via SecretRef, maar dat het huidige opdracht-/runtimepad
  de geheime waarde niet kon oplossen.
- `configWrites: false` blokkeert door Slack geïnitieerde configuratiewijzigingen.
- De optionele `channels.slack.defaultAccount` overschrijft de selectie van het standaardaccount wanneer deze overeenkomt met een geconfigureerde account-ID.
- `channels.slack.streaming.mode` is de canonieke sleutel voor de Slack-streammodus (standaard `"partial"`). `channels.slack.streaming.nativeTransport` beheert het native streamingtransport van Slack (standaard `true`). Verouderde waarden voor `streamMode`, de booleaanse `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` en `nativeStreaming` worden tijdens runtime niet meer gelezen; voer `openclaw doctor --fix` uit om opgeslagen configuratie naar `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}` te migreren.
- `unfurlLinks` en `unfurlMedia` geven de booleaanse waarden van Slack voor het uitvouwen van `chat.postMessage`-links en media door voor botantwoorden. `unfurlLinks` is standaard `false`, zodat uitgaande botlinks niet inline worden uitgevouwen tenzij dit is ingeschakeld; `unfurlMedia` wordt weggelaten tenzij deze is geconfigureerd. Stel een van beide waarden in bij `channels.slack.accounts.<accountId>` om de waarde op het hoogste niveau voor één account te overschrijven.
- Gebruik `user:<id>` (DM) of `channel:<id>` voor bezorgingsdoelen.

**Modi voor reactiemeldingen:** `off`, `own` (standaard), `all`, `allowlist` (van `reactionAllowlist`).

**Isolatie van threadsessies:** `thread.historyScope` is per thread (standaard) of wordt gedeeld binnen het kanaal. `thread.inheritParent` kopieert het transcript van het bovenliggende kanaal naar nieuwe threads. `thread.initialHistoryLimit` (standaard `20`) beperkt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie begint; `0` schakelt het ophalen van threadgeschiedenis uit.

- Native streaming van Slack plus de Slack-assistentstatus "is typing..." voor threads vereisen een antwoorddoel in een thread. DM's op het hoogste niveau blijven standaard buiten threads, zodat ze nog steeds kunnen streamen via conceptvoorbeelden van Slack die worden geplaatst en bewerkt, in plaats van de native stream-/statusvoorvertoning in threadstijl te tonen.
- `typingReaction` voegt tijdelijk een reactie toe aan het inkomende Slack-bericht terwijl een antwoord wordt uitgevoerd en verwijdert deze na voltooiing. Gebruik een Slack-emoji-shortcode zoals `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native bezorging aan de goedkeuringsclient en autorisatie van uitvoeringsgoedkeurders. Hetzelfde schema als Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-gebruikers-ID's), `agentFilter`, `sessionFilter` en `target` (`"dm"`, `"channel"` of `"both"`). Plugingoedkeuringen kunnen dit native clientpad gebruiken voor aanvragen die uit Slack afkomstig zijn wanneer Slack-plugingoedkeurders worden gevonden; Slack-native bezorging van plugingoedkeuringen kan ook worden ingeschakeld via `approvals.plugin` voor sessies die uit Slack afkomstig zijn of Slack-doelen. Plugingoedkeuringen gebruiken Slack-plugingoedkeurders uit `allowFrom` en de standaardroutering, niet de uitvoeringsgoedkeurders.

| Actiegroep | Standaard    | Opmerkingen                        |
| ---------- | ------------ | ---------------------------------- |
| reactions  | ingeschakeld | Reageren + reacties weergeven      |
| messages   | ingeschakeld | Lezen/verzenden/bewerken/verwijderen |
| pins       | ingeschakeld | Vastmaken/losmaken/weergeven        |
| memberInfo | ingeschakeld | Ledeninformatie                     |
| emojiList  | ingeschakeld | Lijst met aangepaste emoji's        |

### Mattermost

Mattermost wordt als een afzonderlijke Plugin geïnstalleerd, op dezelfde manier als Discord, Slack en WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Controleer [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) op de huidige dist-tags voordat je een versie vastzet.

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
        native: true, // expliciet inschakelen
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optionele expliciete URL voor implementaties met een reverse proxy/openbare toegang
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Chatmodi: `oncall` (reageren bij een @-vermelding, standaard), `onmessage` (elk bericht), `onchar` (berichten die met een activeringsvoorvoegsel beginnen).

Wanneer native opdrachten van Mattermost zijn ingeschakeld:

- `commands.callbackPath` moet een pad zijn (bijvoorbeeld `/api/channels/mattermost/command`), geen volledige URL.
- `commands.callbackUrl` moet naar het OpenClaw Gateway-eindpunt verwijzen en bereikbaar zijn vanaf de Mattermost-server.
- Native slashcallbacks worden geverifieerd met de tokens per opdracht die Mattermost tijdens de registratie van slashopdrachten retourneert. Als de registratie mislukt of er geen opdrachten worden geactiveerd, wijst OpenClaw callbacks af met
  `Unauthorized: invalid command token.`
- Voor privé-, tailnet- of interne callbackhosts kan Mattermost vereisen
  dat `ServiceSettings.AllowedUntrustedInternalConnections` de callbackhost of het callbackdomein bevat.
  Gebruik host-/domeinwaarden, geen volledige URL's.
- `channels.mattermost.configWrites`: door Mattermost geïnitieerde configuratiewijzigingen toestaan of weigeren.
- `channels.mattermost.requireMention`: `@mention` vereisen voordat in kanalen wordt geantwoord.
- `channels.mattermost.groups.<channelId>.requireMention`: overschrijving van de vermeldingsvereiste per kanaal (`"*"` voor de standaardwaarde).
- De optionele `channels.mattermost.defaultAccount` overschrijft de selectie van het standaardaccount wanneer deze overeenkomt met een geconfigureerde account-ID.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optionele accountbinding
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

**Modi voor reactiemeldingen:** `off`, `own` (standaard), `all`, `allowlist` (van `reactionAllowlist`).

- `channels.signal.account`: het opstarten van het kanaal vastzetten op de identiteit van een specifiek Signal-account.
- `channels.signal.configWrites`: door Signal geïnitieerde configuratiewijzigingen toestaan of weigeren.
- De optionele `channels.signal.defaultAccount` overschrijft de selectie van het standaardaccount wanneer deze overeenkomt met een geconfigureerde account-ID.

### iMessage

OpenClaw start `imsg rpc` (JSON-RPC via stdio). Er is geen daemon of poort vereist. Dit is de voorkeursroute voor nieuwe OpenClaw iMessage-configuraties wanneer de host toegang kan verlenen tot de Messages-database en Automation-machtigingen.

Ondersteuning voor BlueBubbles is verwijderd. `channels.bluebubbles` is in de huidige OpenClaw geen ondersteund runtimeconfiguratievlak. Migreer oude configuraties naar `channels.imessage`; gebruik [Verwijdering van BlueBubbles en het imsg-pad voor iMessage](/nl/announcements/bluebubbles-imessage) voor de korte versie en [Overstappen van BlueBubbles](/nl/channels/imessage-from-bluebubbles) voor de volledige vertaaltabel.

Als de Gateway niet draait op de Mac waarop bij Messages is ingelogd, behoud dan `channels.imessage.enabled=true` en stel `channels.imessage.cliPath` in op een SSH-wrapper die `imsg "$@"` op die Mac uitvoert. Het standaard lokale `imsg`-pad werkt alleen op macOS.

Voordat je voor productieverzendingen op een SSH-wrapper vertrouwt, moet je een uitgaande `imsg send` via exact die wrapper verifiëren. Sommige macOS-TCC-statussen wijzen Messages Automation toe aan `/usr/libexec/sshd-keygen-wrapper`, waardoor leesbewerkingen en controles kunnen werken terwijl verzendingen mislukken met AppleEvents-`-1743`; raadpleeg het gedeelte over probleemoplossing voor de SSH-wrapper op [iMessage](/nl/channels/imessage).

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

- Optioneel overschrijft `channels.imessage.defaultAccount` de standaardaccountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- Vereist volledige schijftoegang tot de Messages-database.
- Geef de voorkeur aan `chat_id:<id>`-doelen. Gebruik `imsg chats --limit 20` om chats weer te geven.
- `cliPath` kan naar een SSH-wrapper verwijzen; stel `remoteHost` (`host` of `user@host`) in om bijlagen via SCP op te halen.
- `attachmentRoots` en `remoteAttachmentRoots` beperken paden voor inkomende bijlagen (standaard: `/Users/*/Library/Messages/Attachments`).
- SCP gebruikt strikte controle van hostsleutels; zorg er daarom voor dat de hostsleutel van de relayhost al in `~/.ssh/known_hosts` staat.
- `channels.imessage.configWrites`: schrijfopdrachten voor configuratie die vanuit iMessage worden geïnitieerd toestaan of weigeren.
- `channels.imessage.sendTransport`: voorkeurstransport voor het verzenden via `imsg`-RPC voor normale uitgaande antwoorden. `auto` (standaard) gebruikt de IMCore-bridge voor bestaande chats wanneer deze actief is en valt daarna terug op AppleScript; `bridge` vereist levering via de privé-API; `applescript` dwingt het openbare automatiseringspad van Messages af.
- `channels.imessage.actions.*`: privé-API-acties inschakelen die ook door `imsg status` / `openclaw channels status --probe` worden begrensd.
- `channels.imessage.includeAttachments` is standaard uitgeschakeld; stel dit in op `true` voordat je inkomende media in agentbeurten verwacht.
- Inkomend herstel na een herstart van de bridge/Gateway verloopt automatisch (GUID-deduplicatie plus een leeftijdsgrens voor verouderde achterstanden). Bestaande `channels.imessage.catchup.enabled: true`-configuraties worden nog steeds ondersteund als een verouderd compatibiliteitsprofiel; `catchup` is standaard uitgeschakeld.
- `channels.imessage.groups`: groepsregister en instellingen per groep. Configureer bij `groupPolicy: "allowlist"` expliciete `chat_id`-sleutels of een jokertekenvermelding `"*"`, zodat groepsberichten de registerpoort kunnen passeren.
- Vermeldingen op het hoogste niveau in `bindings[]` met `type: "acp"` kunnen iMessage-gesprekken aan permanente ACP-sessies koppelen. Gebruik in `match.peer.id` een genormaliseerde handle of een expliciet chatdoel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`). Semantiek van gedeelde velden: [ACP-agenten](/nl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Voorbeeld van een iMessage SSH-wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix wordt door een Plugin ondersteund en geconfigureerd onder `channels.matrix`.

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
- `channels.matrix.proxy` leidt Matrix-HTTP-verkeer via een expliciete HTTP(S)-proxy. Benoemde accounts kunnen dit overschrijven met `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` staat privé-/interne homeservers toe. `proxy` en deze expliciete netwerktoestemming zijn onafhankelijke instellingen.
- `channels.matrix.defaultAccount` selecteert het voorkeursaccount in configuraties met meerdere accounts.
- `channels.matrix.autoJoin` is standaard `"off"`, zodat uitnodigingen voor kamers en nieuwe DM-achtige uitnodigingen worden genegeerd totdat je `autoJoin: "allowlist"` met `autoJoinAllowlist` of `autoJoin: "always"` instelt.
- `channels.matrix.execApprovals`: Matrix-eigen levering van uitvoeringsgoedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false` of `"auto"` (standaard). In de automatische modus worden uitvoeringsgoedkeuringen geactiveerd wanneer goedkeurders vanuit `approvers` of `commands.ownerAllowFrom` kunnen worden bepaald.
  - `approvers`: Matrix-gebruikers-id's (bijvoorbeeld `@owner:example.org`) die uitvoeringsverzoeken mogen goedkeuren.
  - `agentFilter`: optionele toelatingslijst met agent-id's. Laat dit weg om goedkeuringen voor alle agenten door te sturen.
  - `sessionFilter`: optionele patronen voor sessiesleutels (subtekenreeks of reguliere expressie).
  - `target`: waar goedkeuringsprompts naartoe worden gestuurd. `"dm"` (standaard), `"channel"` (kamer van oorsprong) of `"both"`.
  - Overschrijvingen per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` bepaalt hoe Matrix-DM's in sessies worden gegroepeerd: `per-user` (standaard) deelt ze per gerouteerde gesprekspartner, terwijl `per-room` elke DM-kamer isoleert.
- Matrix-statuscontroles en live directory-opzoekingen gebruiken hetzelfde proxybeleid als runtimeverkeer.
- De volledige Matrix-configuratie, doelregels en installatievoorbeelden zijn gedocumenteerd in [Matrix](/nl/channels/matrix).

### Microsoft Teams

Microsoft Teams wordt door een Plugin ondersteund en geconfigureerd onder `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team-/kanaalbeleid:
      // zie /channels/msteams
    },
  },
}
```

- Kernsleutelpaden die hier worden behandeld: `channels.msteams`, `channels.msteams.configWrites`.
- De volledige Teams-configuratie (referenties, Webhook, DM-/groepsbeleid en overschrijvingen per team/kanaal) is gedocumenteerd in [Microsoft Teams](/nl/channels/msteams).

### IRC

IRC wordt door een Plugin ondersteund en geconfigureerd onder `channels.irc`.

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
- Optioneel overschrijft `channels.irc.defaultAccount` de standaardaccountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- De volledige configuratie van het IRC-kanaal (host/poort/TLS/kanalen/toelatingslijsten/vermeldingspoort) is gedocumenteerd in [IRC](/nl/channels/irc).

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
- Omgevingstokens zijn alleen van toepassing op het **standaardaccount**.
- Basisinstellingen voor kanalen gelden voor alle accounts, tenzij ze per account worden overschreven.
- Gebruik `bindings[].match.accountId` om elk account naar een andere agent te routeren.
- Als je via `openclaw channels add` (of kanaalonboarding) een niet-standaardaccount toevoegt terwijl je nog een kanaalconfiguratie op het hoogste niveau met één account gebruikt, promoveert OpenClaw eerst de accountgebonden waarden voor één account op het hoogste niveau naar de accountmap van het kanaal, zodat het oorspronkelijke account blijft werken. De meeste kanalen verplaatsen ze naar `channels.<channel>.accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaarddoel behouden.
- Bestaande kanaalgebonden koppelingen (zonder `accountId`) blijven overeenkomen met het standaardaccount; accountgebonden koppelingen blijven optioneel.
- `openclaw doctor --fix` repareert ook gemengde structuren door accountgebonden waarden voor één account op het hoogste niveau te verplaatsen naar het gepromoveerde account dat voor dat kanaal is gekozen. De meeste kanalen gebruiken `accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaarddoel behouden.

### Andere Plugin-kanalen

Veel Plugin-kanalen worden geconfigureerd als `channels.<id>` en gedocumenteerd op hun eigen kanaalpagina's (bijvoorbeeld Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch en Zalo).
Bekijk het volledige kanaaloverzicht: [Kanalen](/nl/channels).

### Vermeldingspoort voor groepschats

Voor groepsberichten geldt standaard dat een **vermelding vereist** is (metadatavermelding of veilige regex-patronen). Dit is van toepassing op groepschats in WhatsApp, Telegram, Discord, Google Chat en iMessage.

Zichtbare antwoorden worden afzonderlijk beheerd. Normale directe verzoeken vanuit groepen, kanalen en interne WebChat worden standaard automatisch als eindantwoord geleverd: de uiteindelijke tekst van de assistent wordt via het verouderde zichtbare antwoordpad geplaatst. Kies voor `messages.visibleReplies: "message_tool"` of `messages.groupChat.visibleReplies: "message_tool"` wanneer zichtbare uitvoer pas moet worden geplaatst nadat de agent `message(action=send)` aanroept. Als het model in een geactiveerde modus met alleen tools een inhoudelijk eindantwoord retourneert zonder de berichtentool aan te roepen, blijft die uiteindelijke tekst privé, registreert het uitgebreide Gateway-logboek metagegevens over de onderdrukte payload en plaatst OpenClaw één herstelpoging in de wachtrij waarin het model wordt gevraagd hetzelfde antwoord via `message(action=send)` te leveren.

Voor zichtbare antwoorden met alleen tools is een model/runtime vereist dat betrouwbaar tools aanroept. Dit wordt aanbevolen voor gedeelde omgevingskamers op modellen van de nieuwste generatie, zoals GPT-5.6 Sol. Sommige zwakkere modellen kunnen uiteindelijke tekst beantwoorden, maar begrijpen niet dat voor de bron zichtbare uitvoer via `message(action=send)` moet worden verzonden. OpenClaw herstelt het veelvoorkomende geval van een vastgelopen eindantwoord standaard alleen wanneer het eindantwoord inhoudelijk is, de bronbeurt geen kamergebeurtenis was, het verzendbeleid de levering niet weigerde en nog geen bronantwoord was verzonden. Het herstel is beperkt tot één poging; voor de synthetische herstelprompt wordt persistentie onderdrukt en die poging wordt buiten de verzamelbatch gehouden, zodat deze niet met niet-gerelateerde prompts in de wachtrij kan worden samengevoegd. Als de herstelpoging ook vastloopt of niet in de wachtrij kan worden geplaatst, levert OpenClaw alleen een opgeschoonde diagnose, zoals "Ik heb een antwoord gegenereerd, maar kon het niet in deze chat afleveren. Probeer het opnieuw." De oorspronkelijke privétekst van het eindantwoord wordt nooit gemarkeerd voor automatische levering aan de bron. Gebruik voor modellen die antwoorden herhaaldelijk laten vastlopen `"automatic"`, zodat de laatste assistentbeurt het zichtbare antwoordpad vormt, schakel over op een sterker model voor het aanroepen van tools, controleer het uitgebreide Gateway-logboek op de samenvatting van de onderdrukte payload of stel `messages.groupChat.visibleReplies: "automatic"` in om zichtbare eindantwoorden voor elk groeps-/kanaalverzoek te gebruiken.

Als de berichtentool volgens het actieve toolbeleid niet beschikbaar is, valt OpenClaw terug op automatische zichtbare antwoorden in plaats van het antwoord stilzwijgend te onderdrukken. `openclaw doctor` waarschuwt voor deze discrepantie.

Deze regel geldt voor normale uiteindelijke agenttekst. Gesprekskoppelingen die eigendom zijn van een Plugin gebruiken het door de betreffende Plugin geretourneerde antwoord als zichtbaar antwoord voor geclaimde beurten in gekoppelde threads; de Plugin hoeft voor die koppelingsantwoorden `message(action=send)` niet aan te roepen.

**Probleemoplossing: een @vermelding in een groep activeert typen en daarna stilte (geen fout)**

Symptoom: een @vermelding in een groep/kanaal toont de typindicator en het Gateway-logboek meldt `dispatch complete (queuedFinal=false, replies=0)`, maar er verschijnt geen bericht in de kamer. DM's aan dezelfde agent krijgen normaal antwoord.

Oorzaak: de modus voor zichtbare antwoorden in groepen/kanalen wordt omgezet naar `"message_tool"`, waardoor OpenClaw de beurt uitvoert maar de uiteindelijke assistenttekst onderdrukt, tenzij de agent `message(action=send)` aanroept. Er is in deze modus geen `NO_REPLY`-contract; zonder aanroep van de berichtentool blijft de oorspronkelijke uiteindelijke tekst privé. Voor inhoudelijke bronbeurten probeert OpenClaw nu één beveiligde herstelpoging; korte notities, expliciete stilte, ruimtegebeurtenissen, beurten die door het verzendbeleid zijn geweigerd en reeds afgeleverde beurten worden niet opnieuw geprobeerd. Normale groeps- en kanaalbeurten gebruiken standaard `"automatic"`, dus dit symptoom treedt alleen op wanneer `messages.groupChat.visibleReplies` (of globaal `messages.visibleReplies`) expliciet is ingesteld op `"message_tool"`. Harness-`defaultVisibleReplies` is hier niet van toepassing — de resolver voor groepen/kanalen negeert deze instelling; deze is alleen van invloed op directe/brongesprekken (de Codex-harness onderdrukt op die manier uiteindelijke teksten in directe gesprekken).

Oplossing: kies een model dat beter tools kan aanroepen, verwijder de expliciete `"message_tool"`-overschrijving om terug te vallen op de standaardwaarde `"automatic"`, of stel `messages.groupChat.visibleReplies: "automatic"` in om zichtbare antwoorden voor elk groeps-/kanaalverzoek af te dwingen. Een inhoudelijke, niet-afgeleverde uiteindelijke tekst hoort niet langer als stil succes te eindigen; deze hoort te worden hersteld via één `message(action=send)`-poging of de opgeschoonde diagnose voor een afleveringsfout te tonen. De Gateway laadt de `messages`-configuratie direct opnieuw nadat het bestand is opgeslagen; start de Gateway alleen opnieuw wanneer bestandsbewaking of het opnieuw laden van de configuratie in de implementatie is uitgeschakeld.

**Typen vermeldingen:**

- **Metadatavermeldingen**: Native @-vermeldingen van het platform. Worden genegeerd in de zelfchatmodus van WhatsApp.
- **Tekstpatronen**: Veilige regexpatronen in `agents.list[].groupChat.mentionPatterns`. Ongeldige patronen en onveilige geneste herhalingen worden genegeerd.
- Vermeldingsfiltering wordt alleen afgedwongen wanneer detectie mogelijk is (native vermeldingen of ten minste één patroon).

```json5
{
  messages: {
    visibleReplies: "automatic", // dwing oude automatische uiteindelijke antwoorden af voor directe/brongesprekken
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // altijd actief, niet-vermeld ruimtegeklets wordt stille context
      visibleReplies: "message_tool", // opt-in; vereist message(action=send) voor zichtbare ruimteantwoorden
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` stelt de globale standaardwaarde in. Kanalen kunnen deze overschrijven met `channels.<channel>.historyLimit` (of per account). Stel `0` in om dit uit te schakelen.

`messages.groupChat.unmentionedInbound: "room_event"` dient niet-vermelde, altijd actieve groeps-/kanaalberichten in als stille ruimtecontext op ondersteunde kanalen. Vermelde berichten, opdrachten en directe berichten blijven gebruikersverzoeken. Zie [Omgevingsgebeurtenissen in ruimtes](/nl/channels/ambient-room-events) voor volledige voorbeelden voor Discord, Slack en Telegram.

`messages.visibleReplies` is de globale standaardwaarde voor brongebeurtenissen; `messages.groupChat.visibleReplies` overschrijft deze voor groeps-/kanaalbrongebeurtenissen. Wanneer `messages.visibleReplies` niet is ingesteld, gebruiken directe/brongesprekken de geselecteerde runtime- of harnessstandaard, maar gebruiken interne directe WebChat-beurten automatische uiteindelijke aflevering voor promptpariteit met Pi/Codex. Stel `messages.visibleReplies: "message_tool"` in om opzettelijk `message(action=send)` te vereisen voor zichtbare uitvoer. Kanaaltoelatingslijsten en vermeldingsfiltering bepalen nog steeds of een gebeurtenis wordt verwerkt.

#### Geschiedenislimieten voor privéberichten

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

Resolutie: overschrijving per privégesprek → standaardwaarde van provider → geen limiet (alles wordt bewaard).

Deze resolver leest `channels.<provider>.dmHistoryLimit` en `channels.<provider>.dms.<id>.historyLimit` voor elk kanaal waarvan de sessiesleutel de standaardvorm `provider:direct:<id>` (of de verouderde vorm `provider:dm:<id>`) volgt. Daardoor werkt deze voor zowel gebundelde kanalen als Plugin-kanalen, niet alleen voor een vaste lijst.

#### Zelfchatmodus

Neem je eigen nummer op in `allowFrom` om de zelfchatmodus in te schakelen (native @-vermeldingen worden genegeerd; er wordt alleen op tekstpatronen gereageerd):

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

### Opdrachten (verwerking van chatopdrachten)

```json5
{
  commands: {
    native: "auto", // registreer native opdrachten wanneer dit wordt ondersteund
    nativeSkills: "auto", // registreer native Skills-opdrachten wanneer dit wordt ondersteund
    text: true, // parseer /opdrachten in chatberichten
    bash: false, // sta ! toe (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // sta /config toe
    mcp: false, // sta /mcp toe
    plugins: false, // sta /plugins toe
    debug: false, // sta /debug toe
    restart: true, // sta /restart + externe SIGUSR1-herstartverzoeken toe
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

- Dit blok configureert opdrachtinterfaces. Zie [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde en gebundelde opdrachtencatalogus.
- Deze pagina is een **referentie voor configuratiesleutels**, niet de volledige opdrachtencatalogus. Opdrachten die eigendom zijn van kanalen/Plugins, zoals QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, apparaatkoppeling `/pair`, geheugen `/dreaming`, telefoonbediening `/phone` en Talk `/voice`, worden gedocumenteerd op hun kanaal-/Plugin-pagina's en in [Slash-opdrachten](/nl/tools/slash-commands).
- Tekstopdrachten moeten **zelfstandige** berichten zijn met een voorafgaande `/`.
- `native: "auto"` schakelt native opdrachten in voor Discord/Telegram en laat ze uitgeschakeld voor Slack.
- `nativeSkills: "auto"` schakelt native Skills-opdrachten in voor Discord/Telegram en laat ze uitgeschakeld voor Slack.
- Overschrijf per kanaal: `channels.discord.commands.native` (booleaanse waarde of `"auto"`). Voor Discord slaat `false` de registratie en opschoning van native opdrachten tijdens het opstarten over.
- Overschrijf de registratie van native Skills per kanaal met `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` voegt extra vermeldingen toe aan het botmenu van Telegram.
- `bash: true` schakelt `! <cmd>` in voor de hostshell. Vereist `tools.elevated.enabled` en dat de afzender in `tools.elevated.allowFrom.<channel>` staat.
- `config: true` schakelt `/config` in (leest/schrijft `openclaw.json`). Voor Gateway-`chat.send`-clients vereisen persistente schrijfbewerkingen naar `/config set|unset` ook `operator.admin`; alleen-lezen `/config show` blijft beschikbaar voor normale operatorclients met schrijfrechten.
- `mcp: true` schakelt `/mcp` in voor door OpenClaw beheerde MCP-serverconfiguratie onder `mcp.servers`.
- `plugins: true` schakelt `/plugins` in voor het ontdekken en installeren van Plugins en bedieningselementen om deze in of uit te schakelen.
- `channels.<provider>.configWrites` beperkt configuratiewijzigingen per kanaal (standaard: true).
- Voor kanalen met meerdere accounts beperkt `channels.<provider>.accounts.<id>.configWrites` ook schrijfbewerkingen die op dat account zijn gericht (bijvoorbeeld `/allowlist --config --account <id>` of `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` schakelt `/restart` en externe `SIGUSR1`-herstartverzoeken uit. Standaard: `true`.
- `ownerAllowFrom` is de expliciete toelatingslijst voor eigenaren voor opdrachten die alleen voor eigenaren beschikbaar zijn en kanaalacties die tot eigenaren beperkt zijn. Deze staat los van `allowFrom`.
- `ownerDisplay: "hash"` hasht eigenaar-id's in de systeemprompt. Stel `ownerDisplaySecret` in om het hashen te regelen.
- `allowFrom` geldt per provider. Wanneer deze is ingesteld, is dit de **enige** autorisatiebron (kanaaltoelatingslijsten/-koppeling en `useAccessGroups` worden genegeerd).
- `useAccessGroups: false` staat toe dat opdrachten het beleid voor toegangsgroepen omzeilen wanneer `allowFrom` niet is ingesteld.
- Overzicht van documentatie over opdrachten:
  - ingebouwde en gebundelde catalogus: [Slash-opdrachten](/nl/tools/slash-commands)
  - kanaalspecifieke opdrachtinterfaces: [Kanalen](/nl/channels)
  - QQ Bot-opdrachten: [QQ Bot](/nl/channels/qqbot)
  - koppelingsopdrachten: [Koppeling](/nl/channels/pairing)
  - LINE-kaartopdracht: [LINE](/nl/channels/line)
  - geheugendromen: [Dreaming](/nl/concepts/dreaming)

</Accordion>

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — sleutels op het hoogste niveau
- [Configuratie — agents](/nl/gateway/config-agents)
- [Overzicht van kanalen](/nl/channels)
