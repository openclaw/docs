---
read_when:
    - Een kanaal-Plugin configureren (authenticatie, toegangscontrole, meerdere accounts)
    - Probleemoplossing voor configuratiesleutels per kanaal
    - Beleid voor privéberichten, groepsbeleid of toegangscontrole voor vermeldingen controleren
summary: 'Kanaalconfiguratie: toegangsbeheer, koppeling, sleutels per kanaal voor Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en meer'
title: Configuratie — kanalen
x-i18n:
    generated_at: "2026-05-01T11:17:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: bcdc5ba7dd6633749eccf27fa20f8933049061e5f11efbf315c31cd2512e055d
    source_path: gateway/config-channels.md
    workflow: 16
---

Configuratiesleutels per kanaal onder `channels.*`. Omvat DM- en groepstoegang,
setups met meerdere accounts, mention-gating en sleutels per kanaal voor Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage en de andere meegeleverde kanaalplugins.

Voor agents, tools, gateway-runtime en andere sleutels op topniveau, zie
[Configuratiereferentie](/nl/gateway/configuration-reference).

## Kanalen

Elk kanaal start automatisch wanneer de configuratiesectie ervan bestaat (tenzij `enabled: false`).

### DM- en groepstoegang

Alle kanalen ondersteunen DM-beleid en groepsbeleid:

| DM-beleid           | Gedrag                                                         |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (standaard) | Onbekende afzenders krijgen een eenmalige koppelingscode; eigenaar moet goedkeuren |
| `allowlist`         | Alleen afzenders in `allowFrom` (of gekoppelde allow-store)    |
| `open`              | Alle inkomende DM's toestaan (vereist `allowFrom: ["*"]`)      |
| `disabled`          | Alle inkomende DM's negeren                                   |

| Groepsbeleid          | Gedrag                                                |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (standaard) | Alleen groepen die overeenkomen met de geconfigureerde allowlist |
| `open`                | Groeps-allowlists omzeilen (mention-gating blijft gelden) |
| `disabled`            | Alle groeps-/roomberichten blokkeren                  |

<Note>
`channels.defaults.groupPolicy` stelt de standaard in wanneer de `groupPolicy` van een provider niet is ingesteld.
Koppelingscodes verlopen na 1 uur. Wachtende DM-koppelingsverzoeken zijn beperkt tot **3 per kanaal**.
Als een providerblok volledig ontbreekt (`channels.<provider>` afwezig), valt het runtime-groepsbeleid terug op `allowlist` (fail-closed) met een opstartwaarschuwing.
</Note>

### Modeloverschrijvingen per kanaal

Gebruik `channels.modelByChannel` om specifieke kanaal-ID's vast te zetten op een model. Waarden accepteren `provider/model` of geconfigureerde modelaliassen. De kanaalmapping wordt toegepast wanneer een sessie nog geen modeloverschrijving heeft (bijvoorbeeld ingesteld via `/model`).

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

- `channels.defaults.groupPolicy`: fallback-groepsbeleid wanneer een `groupPolicy` op providerniveau niet is ingesteld.
- `channels.defaults.contextVisibility`: standaardmodus voor zichtbaarheid van aanvullende context voor alle kanalen. Waarden: `all` (standaard, alle geciteerde/thread-/geschiedeniscontext opnemen), `allowlist` (alleen context van afzenders op de allowlist opnemen), `allowlist_quote` (hetzelfde als allowlist, maar expliciete citaat-/antwoordcontext behouden). Overschrijving per kanaal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: gezonde kanaalstatussen opnemen in Heartbeat-uitvoer.
- `channels.defaults.heartbeat.showAlerts`: gedegradeerde/foutstatussen opnemen in Heartbeat-uitvoer.
- `channels.defaults.heartbeat.useIndicator`: compacte Heartbeat-uitvoer in indicatorstijl weergeven.

### WhatsApp

WhatsApp draait via het webkanaal van de Gateway (Baileys Web). Het start automatisch wanneer er een gekoppelde sessie bestaat.

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
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
- De legacy Baileys-authenticatiemap voor één account wordt door `openclaw doctor` gemigreerd naar `whatsapp/default`.
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

- B Token: `channels.telegram.botToken` of `channels.telegram.tokenFile` (alleen regulier bestand; symlinks worden geweigerd), met `TELEGRAM_BOT_TOKEN` als fallback voor het standaardaccount.
- `apiRoot` is alleen de Telegram Bot API-root. Gebruik `https://api.telegram.org` of je zelf gehoste/proxy-root, niet `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`-suffix.
- Optioneel overschrijft `channels.telegram.defaultAccount` de standaardaccountselectie wanneer deze overeenkomt met een geconfigureerd account-ID.
- In setups met meerdere accounts (2+ account-ID's), stel je een expliciete standaard in (`channels.telegram.defaultAccount` of `channels.telegram.accounts.default`) om fallback-routering te vermijden; `openclaw doctor` waarschuwt wanneer dit ontbreekt of ongeldig is.
- `configWrites: false` blokkeert door Telegram geïnitieerde configuratieschrijfacties (supergroep-ID-migraties, `/config set|unset`).
- Items op topniveau in `bindings[]` met `type: "acp"` configureren permanente ACP-bindingen voor forumtopics (gebruik canonieke `chatId:topic:topicId` in `match.peer.id`). Veldsemantiek wordt gedeeld in [ACP Agents](/nl/tools/acp-agents#channel-specific-settings).
- Telegram-streamvoorvertoningen gebruiken `sendMessage` + `editMessageText` (werkt in directe en groepschats).
- Herhaalbeleid: zie [Herhaalbeleid](/nl/concepts/retry).

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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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
- Rechtstreekse uitgaande aanroepen die een expliciete Discord-`token` opgeven, gebruiken dat token voor de aanroep; instellingen voor accountretry/-beleid komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
- Optioneel `channels.discord.defaultAccount` overschrijft de standaardaccountselectie wanneer dit overeenkomt met een geconfigureerde account-id.
- Gebruik `user:<id>` (DM) of `channel:<id>` (guild-kanaal) voor bezorgdoelen; kale numerieke ID's worden geweigerd.
- Guild-slugs zijn kleine letters waarbij spaties zijn vervangen door `-`; kanaalsleutels gebruiken de geslugde naam (geen `#`). Geef de voorkeur aan guild-ID's.
- Berichten die door bots zijn geschreven, worden standaard genegeerd. `allowBots: true` schakelt ze in; gebruik `allowBots: "mentions"` om alleen botberichten te accepteren die de bot vermelden (eigen berichten blijven gefilterd).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (en kanaaloverschrijvingen) laat berichten vallen die een andere gebruiker of rol vermelden maar niet de bot (met uitzondering van @everyone/@here).
- `maxLinesPerMessage` (standaard 17) splitst hoge berichten, zelfs wanneer ze onder 2000 tekens blijven.
- `channels.discord.threadBindings` beheert Discord-threadgebonden routing:
  - `enabled`: Discord-overschrijving voor threadgebonden sessiefuncties (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, en gebonden bezorging/routing)
  - `idleHours`: Discord-overschrijving voor automatisch unfocusen bij inactiviteit in uren (`0` schakelt uit)
  - `maxAgeHours`: Discord-overschrijving voor harde maximumleeftijd in uren (`0` schakelt uit)
  - `spawnSubagentSessions`: opt-in-schakelaar voor automatische threadaanmaak/-binding met `sessions_spawn({ thread: true })`
- Top-level `bindings[]`-items met `type: "acp"` configureren permanente ACP-bindingen voor kanalen en threads (gebruik kanaal-/thread-id in `match.peer.id`). Veldsemantiek wordt gedeeld in [ACP-agenten](/nl/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` stelt de accentkleur in voor Discord components v2-containers.
- `channels.discord.voice` schakelt Discord-spraakkanaalgesprekken in en optionele auto-join + LLM + TTS-overschrijvingen.
- `channels.discord.voice.model` overschrijft optioneel het LLM-model dat wordt gebruikt voor Discord-spraakkanaalantwoorden.
- `channels.discord.voice.daveEncryption` en `channels.discord.voice.decryptionFailureTolerance` worden doorgegeven aan `@discordjs/voice` DAVE-opties (standaard `true` en `24`).
- `channels.discord.voice.connectTimeoutMs` beheert de initiële `@discordjs/voice` Ready-wachttijd voor `/vc join` en auto-join-pogingen (standaard `30000`).
- `channels.discord.voice.reconnectGraceMs` beheert hoe lang een verbroken spraaksessie mag doen over het starten van reconnect-signalering voordat OpenClaw deze vernietigt (standaard `15000`).
- OpenClaw probeert daarnaast spraakontvangst te herstellen door een spraaksessie te verlaten en opnieuw te joinen na herhaalde decryptiefouten.
- `channels.discord.streaming` is de canonieke sleutel voor streammodus. Legacy `streamMode`- en booleaanse `streaming`-waarden worden automatisch gemigreerd.
- `channels.discord.autoPresence` koppelt runtime-beschikbaarheid aan bot presence (healthy => online, degraded => idle, exhausted => dnd) en staat optionele overschrijvingen van statustekst toe.
- `channels.discord.dangerouslyAllowNameMatching` schakelt veranderlijke naam-/tagmatching opnieuw in (break-glass-compatibiliteitsmodus).
- `channels.discord.execApprovals`: Discord-native bezorging van exec-goedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false`, of `"auto"` (standaard). In automatische modus worden exec-goedkeuringen geactiveerd wanneer goedkeurders kunnen worden herleid uit `approvers` of `commands.ownerAllowFrom`.
  - `approvers`: Discord-gebruikers-ID's die exec-aanvragen mogen goedkeuren. Valt terug op `commands.ownerAllowFrom` wanneer weggelaten.
  - `agentFilter`: optionele allowlist met agent-ID's. Laat weg om goedkeuringen voor alle agents door te sturen.
  - `sessionFilter`: optionele sessiesleutelpatronen (substring of regex).
  - `target`: waar goedkeuringsprompts naartoe worden gestuurd. `"dm"` (standaard) stuurt naar DM's van goedkeurders, `"channel"` stuurt naar het oorspronkelijke kanaal, `"both"` stuurt naar beide. Wanneer target `"channel"` bevat, zijn knoppen alleen bruikbaar door herleide goedkeurders.
  - `cleanupAfterResolve`: verwijdert goedkeurings-DM's na goedkeuring, afwijzing of timeout wanneer `true`.

**Meldingsmodi voor reacties:** `off` (geen), `own` (berichten van de bot, standaard), `all` (alle berichten), `allowlist` (uit `guilds.<id>.users` voor alle berichten).

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
- Serviceaccount SecretRef wordt ook ondersteund (`serviceAccountRef`).
- Env-fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` of `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Gebruik `spaces/<spaceId>` of `users/<userId>` voor bezorgdoelen.
- `channels.googlechat.dangerouslyAllowNameMatching` schakelt veranderlijke e-mail-principalmatching opnieuw in (break-glass-compatibiliteitsmodus).

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
- `socketMode` geeft transportafstemming van Slack SDK Socket Mode door aan de publieke Bolt receiver API. Gebruik dit alleen bij onderzoek naar ping-/pong-timeouts of verouderd websocketgedrag.
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren platte-tekststrings
  of SecretRef-objecten.
- Slack-accountsnapshots stellen per-referentie bron-/statusvelden beschikbaar, zoals
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` en, in HTTP-modus,
  `signingSecretStatus`. `configured_unavailable` betekent dat het account is
  geconfigureerd via SecretRef, maar dat het huidige commando-/runtimepad
  de geheime waarde niet kon herleiden.
- `configWrites: false` blokkeert door Slack geïnitieerde configuratieschrijfacties.
- Optioneel `channels.slack.defaultAccount` overschrijft de standaardaccountselectie wanneer dit overeenkomt met een geconfigureerde account-id.
- `channels.slack.streaming.mode` is de canonieke sleutel voor Slack-streammodus. `channels.slack.streaming.nativeTransport` beheert Slacks native streamingtransport. Legacy `streamMode`-, booleaanse `streaming`- en `nativeStreaming`-waarden worden automatisch gemigreerd.
- Gebruik `user:<id>` (DM) of `channel:<id>` voor bezorgdoelen.

**Meldingsmodi voor reacties:** `off`, `own` (standaard), `all`, `allowlist` (uit `reactionAllowlist`).

**Isolatie van threadsessies:** `thread.historyScope` is per thread (standaard) of gedeeld over het kanaal. `thread.inheritParent` kopieert het transcript van het bovenliggende kanaal naar nieuwe threads.

- Slack native streaming plus de Slack assistant-achtige threadstatus "is typing..." vereisen een reply-threaddoel. Top-level DM's blijven standaard buiten threads, dus gebruiken ze in plaats van de thread-achtige preview `typingReaction` of normale bezorging.
- `typingReaction` voegt een tijdelijke reactie toe aan het binnenkomende Slack-bericht terwijl een antwoord wordt uitgevoerd, en verwijdert deze daarna bij voltooiing. Gebruik een Slack-emoji-shortcode zoals `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native bezorging van exec-goedkeuringen en autorisatie van goedkeurders. Zelfde schema als Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-gebruikers-ID's), `agentFilter`, `sessionFilter` en `target` (`"dm"`, `"channel"` of `"both"`).

| Actiegroep | Standaard | Opmerkingen                  |
| ------------ | ------- | ---------------------- |
| reactions    | ingeschakeld | Reageren + reacties weergeven |
| messages     | ingeschakeld | Lezen/verzenden/bewerken/verwijderen  |
| pins         | ingeschakeld | Vastzetten/losmaken/weergeven         |
| memberInfo   | ingeschakeld | Lidgegevens            |
| emojiList    | ingeschakeld | Lijst met aangepaste emoji      |

### Mattermost

Mattermost wordt geleverd als gebundelde plugin in huidige OpenClaw-releases. Oudere of
aangepaste builds kunnen een huidig npm-pakket installeren met
`openclaw plugins install @openclaw/mattermost`; als npm meldt dat het
pakket dat eigendom is van OpenClaw is verouderd, gebruik dan de gebundelde plugin of een lokale checkout
totdat een nieuwer npm-pakket wordt gepubliceerd.

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

Chatmodi: `oncall` (reageert op @-vermelding, standaard), `onmessage` (elk bericht), `onchar` (berichten die beginnen met triggerprefix).

Wanneer native Mattermost-commando's zijn ingeschakeld:

- `commands.callbackPath` moet een pad zijn (bijvoorbeeld `/api/channels/mattermost/command`), geen volledige URL.
- `commands.callbackUrl` moet naar het OpenClaw Gateway-eindpunt verwijzen en bereikbaar zijn vanaf de Mattermost-server.
- Native slash-callbacks worden geauthenticeerd met de tokens per opdracht die
  door Mattermost worden teruggegeven tijdens de registratie van slash-opdrachten. Als registratie mislukt of er geen
  opdrachten worden geactiveerd, weigert OpenClaw callbacks met
  `Unauthorized: invalid command token.`
- Voor private/tailnet/interne callbackhosts kan Mattermost vereisen dat
  `ServiceSettings.AllowedUntrustedInternalConnections` de callbackhost/het callbackdomein bevat.
  Gebruik host-/domeinwaarden, geen volledige URL's.
- `channels.mattermost.configWrites`: Mattermost-geinitieerde configuratieschrijfacties toestaan of weigeren.
- `channels.mattermost.requireMention`: `@mention` vereisen voordat er in kanalen wordt geantwoord.
- `channels.mattermost.groups.<channelId>.requireMention`: per-kanaals overschrijving voor mention-gating (`"*"` voor standaard).
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

**Modi voor reactiemeldingen:** `off`, `own` (standaard), `all`, `allowlist` (uit `reactionAllowlist`).

- `channels.signal.account`: kanaalstart vastzetten op een specifieke Signal-accountidentiteit.
- `channels.signal.configWrites`: door Signal geinitieerde configuratieschrijfacties toestaan of weigeren.
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

- Belangrijkste kernpaden die hier worden behandeld: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optionele `channels.bluebubbles.defaultAccount` overschrijft de standaard accountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- Bovenliggende `bindings[]`-items met `type: "acp"` kunnen BlueBubbles-gesprekken koppelen aan persistente ACP-sessies. Gebruik een BlueBubbles-handle of doeltekenreeks (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gedeelde veldsemantiek: [ACP-agenten](/nl/tools/acp-agents#channel-specific-settings).
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

- Vereist Full Disk Access tot de Messages-DB.
- Geef de voorkeur aan `chat_id:<id>`-doelen. Gebruik `imsg chats --limit 20` om chats weer te geven.
- `cliPath` kan naar een SSH-wrapper verwijzen; stel `remoteHost` (`host` of `user@host`) in voor het ophalen van SCP-bijlagen.
- `attachmentRoots` en `remoteAttachmentRoots` beperken inkomende bijlagepaden (standaard: `/Users/*/Library/Messages/Attachments`).
- SCP gebruikt strikte host-key-controle, dus zorg ervoor dat de sleutel van de relayhost al bestaat in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: door iMessage geinitieerde configuratieschrijfacties toestaan of weigeren.
- Bovenliggende `bindings[]`-items met `type: "acp"` kunnen iMessage-gesprekken koppelen aan persistente ACP-sessies. Gebruik een genormaliseerde handle of expliciet chatdoel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gedeelde veldsemantiek: [ACP-agenten](/nl/tools/acp-agents#channel-specific-settings).

<Accordion title="Voorbeeld van iMessage SSH-wrapper">

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` staat private/interne homeservers toe. `proxy` en deze netwerk-opt-in zijn onafhankelijke controles.
- `channels.matrix.defaultAccount` selecteert het voorkeursaccount in configuraties met meerdere accounts.
- `channels.matrix.autoJoin` is standaard `off`, dus uitgenodigde rooms en nieuwe DM-achtige uitnodigingen worden genegeerd totdat je `autoJoin: "allowlist"` met `autoJoinAllowlist` of `autoJoin: "always"` instelt.
- `channels.matrix.execApprovals`: Matrix-native levering van exec-goedkeuringen en autorisatie van goedkeurders.
  - `enabled`: `true`, `false` of `"auto"` (standaard). In auto-modus worden exec-goedkeuringen geactiveerd wanneer goedkeurders kunnen worden herleid uit `approvers` of `commands.ownerAllowFrom`.
  - `approvers`: Matrix-gebruikers-ID's (bijv. `@owner:example.org`) die exec-aanvragen mogen goedkeuren.
  - `agentFilter`: optionele allowlist voor agent-ID's. Weglaten om goedkeuringen voor alle agenten door te sturen.
  - `sessionFilter`: optionele sessiesleutelpatronen (substring of regex).
  - `target`: waar goedkeuringsprompts naartoe worden gestuurd. `"dm"` (standaard), `"channel"` (oorspronkelijke room) of `"both"`.
  - Overschrijvingen per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` bepaalt hoe Matrix-DM's in sessies worden gegroepeerd: `per-user` (standaard) deelt per gerouteerde peer, terwijl `per-room` elke DM-room isoleert.
- Matrix-statusprobes en live directory-lookups gebruiken hetzelfde proxybeleid als runtimeverkeer.
- Volledige Matrix-configuratie, targetregels en installatievoorbeelden zijn gedocumenteerd in [Matrix](/nl/channels/matrix).

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

- Belangrijkste kernpaden die hier worden behandeld: `channels.msteams`, `channels.msteams.configWrites`.
- Volledige Teams-configuratie (referenties, Webhook, DM-/groepsbeleid, overschrijvingen per team/per kanaal) is gedocumenteerd in [Microsoft Teams](/nl/channels/msteams).

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

- Belangrijkste kernpaden die hier worden behandeld: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Optionele `channels.irc.defaultAccount` overschrijft de standaard accountselectie wanneer deze overeenkomt met een geconfigureerde account-id.
- Volledige IRC-kanaalconfiguratie (host/poort/TLS/kanalen/allowlists/mention-gating) is gedocumenteerd in [IRC](/nl/channels/irc).

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
- Env-tokens zijn alleen van toepassing op het **standaard** account.
- Basiskanaalinstellingen gelden voor alle accounts tenzij ze per account worden overschreven.
- Gebruik `bindings[].match.accountId` om elk account naar een andere agent te routeren.
- Als je via `openclaw channels add` (of kanaalonboarding) een niet-standaard account toevoegt terwijl je nog een kanaalconfiguratie op topniveau met een enkel account gebruikt, promoveert OpenClaw eerst account-scoped single-account-waarden op topniveau naar de kanaalaccountmap, zodat het oorspronkelijke account blijft werken. De meeste kanalen verplaatsen ze naar `channels.<channel>.accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaard doel behouden.
- Bestaande kanaal-only bindings (zonder `accountId`) blijven overeenkomen met het standaard account; account-scoped bindings blijven optioneel.
- `openclaw doctor --fix` repareert ook gemengde vormen door account-scoped single-account-waarden op topniveau te verplaatsen naar het gepromoveerde account dat voor dat kanaal is gekozen. De meeste kanalen gebruiken `accounts.default`; Matrix kan in plaats daarvan een bestaand overeenkomend benoemd/standaard doel behouden.

### Andere Plugin-kanalen

Veel Plugin-kanalen worden geconfigureerd als `channels.<id>` en gedocumenteerd op hun eigen kanaalpagina's (bijvoorbeeld Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat en Twitch).
Zie de volledige kanaalindex: [Kanalen](/nl/channels).

### Mention-gating voor groepschats

Groepsberichten vereisen standaard **mention verplicht** (metadata-mention of veilige regex-patronen). Van toepassing op WhatsApp, Telegram, Discord, Google Chat en iMessage-groepschats.

Zichtbare antwoorden worden apart beheerd. Groeps-/kanaalrooms gebruiken standaard `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw verwerkt de beurt nog steeds, maar normale eindantwoorden blijven prive en zichtbare roomuitvoer vereist `message(action=send)`. Stel `"automatic"` alleen in wanneer je het legacygedrag wilt waarbij normale antwoorden terug naar de room worden geplaatst. Om hetzelfde tool-only gedrag voor zichtbare antwoorden ook op directe chats toe te passen, stel je `messages.visibleReplies: "message_tool"` in.

Als de berichttool niet beschikbaar is onder het actieve toolbeleid, valt OpenClaw terug op automatische zichtbare antwoorden in plaats van de reactie stil te onderdrukken. `openclaw doctor` waarschuwt voor deze mismatch.

De Gateway laadt de `messages`-configuratie opnieuw zodra het bestand is opgeslagen. Herstart alleen wanneer bestandsbewaking of configuratieherladen in de deployment is uitgeschakeld.

**Mention-typen:**

- **Metadata-mentions**: Native platform-@-mentions. Genegeerd in WhatsApp-zelfchatmodus.
- **Tekstpatronen**: Veilige regex-patronen in `agents.list[].groupChat.mentionPatterns`. Ongeldige patronen en onveilige geneste herhaling worden genegeerd.
- Mention-gating wordt alleen afgedwongen wanneer detectie mogelijk is (native mentions of ten minste een patroon).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
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

`messages.visibleReplies` is de globale standaard voor bronbeurten; `messages.groupChat.visibleReplies` overschrijft dit voor bronbeurten in groepen/kanalen. Kanaal-allowlists en mention-gating bepalen nog steeds of een beurt wordt verwerkt.

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

Resolutie: per-DM-overschrijving → providerstandaard → geen limiet (alles bewaard).

Ondersteund: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Zelfchatmodus

Neem je eigen nummer op in `allowFrom` om de zelfchatmodus in te schakelen (negeert native @-mentions, reageert alleen op tekstpatronen):

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

- Dit blok configureert opdrachtoppervlakken. Zie [Slash Commands](/nl/tools/slash-commands) voor de huidige ingebouwde en gebundelde opdrachtcatalogus.
- Deze pagina is een **config-keyreferentie**, niet de volledige opdrachtcatalogus. Kanaal-/Plugin-eigen opdrachten zoals QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, apparaatkoppeling `/pair`, geheugen `/dreaming`, telefoonbediening `/phone` en Talk `/voice` zijn gedocumenteerd op hun kanaal-/Plugin-pagina's plus [Slash Commands](/nl/tools/slash-commands).
- Tekstopdrachten moeten **zelfstandige** berichten zijn met een voorafgaande `/`.
- `native: "auto"` schakelt native opdrachten in voor Discord/Telegram, en laat Slack uit.
- `nativeSkills: "auto"` schakelt native Skills-opdrachten in voor Discord/Telegram, en laat Slack uit.
- Overschrijf per kanaal: `channels.discord.commands.native` (bool of `"auto"`). `false` wist eerder geregistreerde opdrachten.
- Overschrijf native Skills-registratie per kanaal met `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` voegt extra Telegram-botmenu-items toe.
- `bash: true` schakelt `! <cmd>` in voor de hostshell. Vereist `tools.elevated.enabled` en afzender in `tools.elevated.allowFrom.<channel>`.
- `config: true` schakelt `/config` in (leest/schrijft `openclaw.json`). Voor Gateway-`chat.send`-clients vereisen persistente `/config set|unset`-schrijfacties ook `operator.admin`; alleen-lezen `/config show` blijft beschikbaar voor normale operatorclients met schrijfbereik.
- `mcp: true` schakelt `/mcp` in voor door OpenClaw beheerde MCP-serverconfiguratie onder `mcp.servers`.
- `plugins: true` schakelt `/plugins` in voor Plugin-ontdekking, installatie en bediening voor inschakelen/uitschakelen.
- `channels.<provider>.configWrites` bewaakt configuratiemutaties per kanaal (standaard: true).
- Voor kanalen met meerdere accounts bewaakt `channels.<provider>.accounts.<id>.configWrites` ook schrijfacties die op dat account zijn gericht (bijvoorbeeld `/allowlist --config --account <id>` of `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` schakelt `/restart` en Gateway-herstarttoolacties uit. Standaard: `true`.
- `ownerAllowFrom` is de expliciete owner-allowlist voor opdrachten/tools die alleen voor de owner zijn. Deze staat los van `allowFrom`.
- `ownerDisplay: "hash"` hasht owner-id's in de systeemprompt. Stel `ownerDisplaySecret` in om hashing te regelen.
- `allowFrom` is per provider. Wanneer ingesteld, is dit de **enige** autorisatiebron (kanaal-allowlists/koppeling en `useAccessGroups` worden genegeerd).
- `useAccessGroups: false` staat opdrachten toe om access-group-beleid te omzeilen wanneer `allowFrom` niet is ingesteld.
- Kaart met opdrachtdocumentatie:
  - ingebouwde en gebundelde catalogus: [Slash Commands](/nl/tools/slash-commands)
  - kanaalspecifieke opdrachtoppervlakken: [Kanalen](/nl/channels)
  - QQ Bot-opdrachten: [QQ Bot](/nl/channels/qqbot)
  - koppelingsopdrachten: [Koppelen](/nl/channels/pairing)
  - LINE-kaartopdracht: [LINE](/nl/channels/line)
  - geheugen-dreaming: [Dreaming](/nl/concepts/dreaming)

</Accordion>

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — sleutels op topniveau
- [Configuratie — agents](/nl/gateway/config-agents)
- [Kanalenoverzicht](/nl/channels)
