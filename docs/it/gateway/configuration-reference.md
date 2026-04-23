---
read_when:
    - Hai bisogno della semantica esatta a livello di campo o dei valori predefiniti
    - Stai validando blocchi di configurazione di canale, modello, Gateway o strumenti
summary: Riferimento alla configurazione del Gateway per le chiavi core di OpenClaw, i valori predefiniti e i collegamenti ai riferimenti dedicati dei sottosistemi
title: Riferimento alla configurazione
x-i18n:
    generated_at: "2026-04-23T08:28:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75c7e0d88ea6eacb8a2dd41f83033da853130dc2a689950c1a188d7c4ca8f977
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Riferimento alla configurazione

Riferimento alla configurazione core per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configurazione](/it/gateway/configuration).

Questa pagina copre le principali superfici di configurazione di OpenClaw e rimanda altrove quando un sottosistema ha un proprio riferimento più approfondito. **Non** cerca di includere inline ogni catalogo di comandi gestito da canali/plugin o ogni opzione avanzata di memoria/QMD in un'unica pagina.

Fonte di verità nel codice:

- `openclaw config schema` stampa il JSON Schema live usato per la validazione e la UI Control, con i metadati bundled/plugin/channel uniti quando disponibili
- `config.schema.lookup` restituisce un nodo di schema delimitato per percorso per gli strumenti di drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` validano l'hash baseline della documentazione di configurazione rispetto alla superficie di schema corrente

Riferimenti approfonditi dedicati:

- [Riferimento alla configurazione Memory](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione Dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/it/tools/slash-commands) per l'attuale catalogo di comandi built-in + bundled
- pagine del canale/plugin proprietario per superfici di comandi specifiche del canale

Il formato di configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi — OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Ogni canale si avvia automaticamente quando esiste la sua sezione di configurazione (a meno che `enabled: false`).

### Accesso DM e di gruppo

Tutti i canali supportano policy DM e policy di gruppo:

| Policy DM            | Comportamento                                                   |
| -------------------- | --------------------------------------------------------------- |
| `pairing` (predefinita) | I mittenti sconosciuti ricevono un codice di pairing monouso; il proprietario deve approvare |
| `allowlist`          | Solo i mittenti in `allowFrom` (o nel pairing allow store)      |
| `open`               | Consenti tutti i DM in ingresso (richiede `allowFrom: ["*"]`)   |
| `disabled`           | Ignora tutti i DM in ingresso                                   |

| Policy di gruppo       | Comportamento                                              |
| ---------------------- | ---------------------------------------------------------- |
| `allowlist` (predefinita) | Solo i gruppi che corrispondono all'allowlist configurata |
| `open`                 | Ignora le allowlist di gruppo (il gate delle menzioni si applica comunque) |
| `disabled`             | Blocca tutti i messaggi di gruppo/stanza                   |

<Note>
`channels.defaults.groupPolicy` imposta il valore predefinito quando `groupPolicy` di un provider non è impostato.
I codici di pairing scadono dopo 1 ora. Le richieste di pairing DM in sospeso sono limitate a **3 per canale**.
Se un blocco provider manca del tutto (`channels.<provider>` assente), la policy di gruppo a runtime usa come fallback `allowlist` (fail-closed) con un avviso all'avvio.
</Note>

### Override del modello per canale

Usa `channels.modelByChannel` per associare ID canale specifici a un modello. I valori accettano `provider/model` o alias di modello configurati. La mappatura del canale si applica quando una sessione non ha già un override del modello (ad esempio, impostato tramite `/model`).

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

### Valori predefiniti dei canali e Heartbeat

Usa `channels.defaults` per il comportamento condiviso di policy di gruppo e Heartbeat tra provider:

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

- `channels.defaults.groupPolicy`: policy di gruppo di fallback quando `groupPolicy` a livello provider non è impostato.
- `channels.defaults.contextVisibility`: modalità predefinita di visibilità del contesto supplementare per tutti i canali. Valori: `all` (predefinito, include tutto il contesto citato/thread/cronologia), `allowlist` (include solo il contesto di mittenti in allowlist), `allowlist_quote` (come allowlist ma mantiene il contesto esplicito di citazione/risposta). Override per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include gli stati sani dei canali nell'output Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: include stati degradati/di errore nell'output Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: esegue il rendering di un output Heartbeat compatto in stile indicatore.

### WhatsApp

WhatsApp viene eseguito tramite il canale web del Gateway (Baileys Web). Si avvia automaticamente quando esiste una sessione collegata.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // spunte blu (false in modalità self-chat)
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

<Accordion title="WhatsApp multi-account">

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

- I comandi in uscita usano per impostazione predefinita l'account `default` se presente; altrimenti il primo ID account configurato (ordinato).
- `channels.whatsapp.defaultAccount` facoltativo sovrascrive quella selezione dell'account predefinito di fallback quando corrisponde a un ID account configurato.
- La directory auth legacy single-account di Baileys viene migrata da `openclaw doctor` in `whatsapp/default`.
- Override per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Mantieni le risposte brevi.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Resta in tema.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Backup Git" },
        { command: "generate", description: "Crea un'immagine" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (predefinito: off; attivare esplicitamente per evitare limiti di frequenza di anteprima/modifica)
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

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo file regolare; symlink rifiutati), con `TELEGRAM_BOT_TOKEN` come fallback per l'account predefinito.
- `channels.telegram.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Nelle configurazioni multi-account (2+ ID account), imposta un valore predefinito esplicito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) per evitare instradamento di fallback; `openclaw doctor` avvisa quando manca o non è valido.
- `configWrites: false` blocca le scritture di configurazione avviate da Telegram (migrazioni di ID supergruppo, `/config set|unset`).
- Le voci top-level `bindings[]` con `type: "acp"` configurano binding ACP persistenti per i topic del forum (usa il formato canonico `chatId:topic:topicId` in `match.peer.id`). La semantica dei campi è condivisa in [ACP Agents](/it/tools/acp-agents#channel-specific-settings).
- Le anteprime stream di Telegram usano `sendMessage` + `editMessageText` (funziona in chat dirette e di gruppo).
- Policy di retry: vedi [Policy di retry](/it/concepts/retry).

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
              systemPrompt: "Solo risposte brevi.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress corrisponde a partial su Discord)
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
        spawnSubagentSessions: false, // opt-in per sessions_spawn({ thread: true })
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` come fallback per l'account predefinito.
- Le chiamate dirette in uscita che forniscono un `token` Discord esplicito usano quel token per la chiamata; le impostazioni di retry/policy dell'account continuano a provenire dall'account selezionato nello snapshot di runtime attivo.
- `channels.discord.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Usa `user:<id>` (DM) o `channel:<id>` (canale guild) per i target di consegna; gli ID numerici non qualificati vengono rifiutati.
- Gli slug delle guild sono in minuscolo con gli spazi sostituiti da `-`; le chiavi dei canali usano il nome trasformato in slug (senza `#`). Preferisci gli ID guild.
- I messaggi scritti dal bot vengono ignorati per impostazione predefinita. `allowBots: true` li abilita; usa `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i messaggi propri restano comunque filtrati).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e gli override del canale) elimina i messaggi che menzionano un altro utente o ruolo ma non il bot (escludendo @everyone/@here).
- `maxLinesPerMessage` (predefinito 17) divide i messaggi alti anche quando restano sotto i 2000 caratteri.
- `channels.discord.threadBindings` controlla l'instradamento associato ai thread Discord:
  - `enabled`: override Discord per le funzionalità di sessione associate al thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/instradamento associati)
  - `idleHours`: override Discord per l'auto-unfocus per inattività in ore (`0` disabilita)
  - `maxAgeHours`: override Discord per l'età massima rigida in ore (`0` disabilita)
  - `spawnSubagentSessions`: interruttore opt-in per la creazione/associazione automatica del thread con `sessions_spawn({ thread: true })`
- Le voci top-level `bindings[]` con `type: "acp"` configurano binding ACP persistenti per canali e thread (usa l'ID canale/thread in `match.peer.id`). La semantica dei campi è condivisa in [ACP Agents](/it/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` imposta il colore di accento per i contenitori components v2 di Discord.
- `channels.discord.voice` abilita le conversazioni nei canali vocali Discord e gli override facoltativi di auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` vengono passati a `@discordjs/voice` come opzioni DAVE (predefiniti `true` e `24`).
- OpenClaw tenta inoltre il recupero della ricezione vocale uscendo/rientrando in una sessione vocale dopo errori ripetuti di decrittazione.
- `channels.discord.streaming` è la chiave canonica della modalità stream. I valori legacy `streamMode` e booleani `streaming` vengono migrati automaticamente.
- `channels.discord.autoPresence` mappa la disponibilità del runtime alla presenza del bot (healthy => online, degraded => idle, exhausted => dnd) e consente override facoltativi del testo di stato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita il matching modificabile per nome/tag (modalità di compatibilità break-glass).
- `channels.discord.execApprovals`: consegna nativa Discord delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare richieste exec. Se omesso, usa `commands.ownerAllowFrom` come fallback.
  - `agentFilter`: allowlist facoltativa di ID agente. Ometti per inoltrare approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi di chiave sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito) li invia ai DM degli approvatori, `"channel"` li invia al canale di origine, `"both"` li invia a entrambi. Quando il target include `"channel"`, i pulsanti sono utilizzabili solo dagli approvatori risolti.
  - `cleanupAfterResolve`: quando `true`, elimina i DM di approvazione dopo approvazione, rifiuto o timeout.

**Modalità di notifica delle reazioni:** `off` (nessuna), `own` (messaggi del bot, predefinito), `all` (tutti i messaggi), `allowlist` (da `guilds.<id>.users` su tutti i messaggi).

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

- JSON dell'account di servizio: inline (`serviceAccount`) o basato su file (`serviceAccountFile`).
- È supportato anche SecretRef dell'account di servizio (`serviceAccountRef`).
- Fallback env: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` o `users/<userId>` per i target di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita il matching modificabile del principal email (modalità di compatibilità break-glass).

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
          systemPrompt: "Solo risposte brevi.",
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
        nativeTransport: true, // usa l'API di streaming nativa di Slack quando mode=partial
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

- **Modalità socket** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` come fallback env dell'account predefinito).
- **Modalità HTTP** richiede `botToken` più `signingSecret` (alla root o per account).
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  plain text o oggetti SecretRef.
- Gli snapshot degli account Slack espongono campi di origine/stato per credenziale come
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in modalità HTTP,
  `signingSecretStatus`. `configured_unavailable` significa che l'account è
  configurato tramite SecretRef ma il percorso comando/runtime corrente non ha
  potuto risolvere il valore del segreto.
- `configWrites: false` blocca le scritture di configurazione avviate da Slack.
- `channels.slack.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- `channels.slack.streaming.mode` è la chiave canonica della modalità stream di Slack. `channels.slack.streaming.nativeTransport` controlla il trasporto di streaming nativo di Slack. I valori legacy `streamMode`, booleani `streaming` e `nativeStreaming` vengono migrati automaticamente.
- Usa `user:<id>` (DM) o `channel:<id>` per i target di consegna.

**Modalità di notifica delle reazioni:** `off`, `own` (predefinito), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento della sessione thread:** `thread.historyScope` è per-thread (predefinito) o condiviso a livello di canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread.

- Lo streaming nativo di Slack più lo stato del thread in stile assistente Slack "is typing..." richiedono un target di thread di risposta. I DM top-level restano off-thread per impostazione predefinita, quindi usano `typingReaction` o la consegna normale invece dell'anteprima in stile thread.
- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre è in esecuzione una risposta, poi la rimuove al completamento. Usa uno shortcode emoji Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna nativa Slack delle approvazioni exec e autorizzazione degli approvatori. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` o `"both"`).

| Gruppo di azioni | Predefinito | Note                     |
| ---------------- | ----------- | ------------------------ |
| reactions        | abilitato   | Reagire + elencare reazioni |
| messages         | abilitato   | Leggere/inviare/modificare/eliminare |
| pins             | abilitato   | Fissare/rimuovere/elencare |
| memberInfo       | abilitato   | Informazioni membro      |
| emojiList        | abilitato   | Elenco emoji personalizzate |

### Mattermost

Mattermost viene distribuito come plugin: `openclaw plugins install @openclaw/mattermost`.

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
        // URL esplicito facoltativo per distribuzioni reverse-proxy/pubbliche
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modalità chat: `oncall` (risponde su menzione @, predefinito), `onmessage` (ogni messaggio), `onchar` (messaggi che iniziano con prefisso trigger).

Quando i comandi nativi Mattermost sono abilitati:

- `commands.callbackPath` deve essere un percorso (ad esempio `/api/channels/mattermost/command`), non un URL completo.
- `commands.callbackUrl` deve risolvere verso l'endpoint Gateway di OpenClaw ed essere raggiungibile dal server Mattermost.
- Le callback slash native sono autenticate con i token per-comando restituiti
  da Mattermost durante la registrazione dei comandi slash. Se la registrazione fallisce o non
  viene attivato alcun comando, OpenClaw rifiuta le callback con
  `Unauthorized: invalid command token.`
- Per host callback privati/tailnet/interni, Mattermost potrebbe richiedere
  `ServiceSettings.AllowedUntrustedInternalConnections` per includere l'host/dominio della callback.
  Usa valori host/dominio, non URL completi.
- `channels.mattermost.configWrites`: consente o nega le scritture di configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiede `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: override del gate di menzione per canale (`"*"` per il predefinito).
- `channels.mattermost.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // binding account facoltativo
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

**Modalità di notifica delle reazioni:** `off`, `own` (predefinito), `all`, `allowlist` (da `reactionAllowlist`).

- `channels.signal.account`: vincola l'avvio del canale a una specifica identità account Signal.
- `channels.signal.configWrites`: consente o nega le scritture di configurazione avviate da Signal.
- `channels.signal.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.

### BlueBubbles

BlueBubbles è il percorso iMessage consigliato (supportato da plugin, configurato sotto `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, controlli di gruppo e azioni avanzate:
      // vedi /channels/bluebubbles
    },
  },
}
```

- Percorsi chiave core trattati qui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Le voci top-level `bindings[]` con `type: "acp"` possono associare conversazioni BlueBubbles a sessioni ACP persistenti. Usa un handle BlueBubbles o una stringa target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [ACP Agents](/it/tools/acp-agents#channel-specific-settings).
- La configurazione completa del canale BlueBubbles è documentata in [BlueBubbles](/it/channels/bluebubbles).

### iMessage

OpenClaw avvia `imsg rpc` (JSON-RPC su stdio). Non serve alcun daemon o porta.

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

- `channels.imessage.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.

- Richiede Full Disk Access al DB di Messages.
- Preferisci target `chat_id:<id>`. Usa `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; imposta `remoteHost` (`host` o `user@host`) per il recupero degli allegati via SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in ingresso (predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa il controllo rigoroso della host key, quindi assicurati che la host key del relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consente o nega le scritture di configurazione avviate da iMessage.
- Le voci top-level `bindings[]` con `type: "acp"` possono associare conversazioni iMessage a sessioni ACP persistenti. Usa un handle normalizzato o un target chat esplicito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [ACP Agents](/it/tools/acp-agents#channel-specific-settings).

<Accordion title="Esempio di wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è supportato da plugin ed è configurato sotto `channels.matrix`.

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

- L'autenticazione con token usa `accessToken`; l'autenticazione con password usa `userId` + `password`.
- `channels.matrix.proxy` instrada il traffico HTTP Matrix tramite un proxy HTTP(S) esplicito. Gli account con nome possono sovrascriverlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` consente homeserver privati/interni. `proxy` e questo opt-in di rete sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l'account preferito nelle configurazioni multi-account.
- `channels.matrix.autoJoin` ha come predefinito `off`, quindi le stanze invitate e i nuovi inviti in stile DM vengono ignorati finché non imposti `autoJoin: "allowlist"` con `autoJoinAllowlist` oppure `autoJoin: "always"`.
- `channels.matrix.execApprovals`: consegna nativa Matrix delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (es. `@owner:example.org`) autorizzati ad approvare richieste exec.
  - `agentFilter`: allowlist facoltativa di ID agente. Ometti per inoltrare approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi di chiave sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito), `"channel"` (stanza di origine) o `"both"`.
  - Override per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controlla come i DM Matrix vengono raggruppati in sessioni: `per-user` (predefinito) condivide per peer instradato, mentre `per-room` isola ogni stanza DM.
- Le probe di stato Matrix e le ricerche live nella directory usano la stessa policy proxy del traffico runtime.
- La configurazione completa di Matrix, le regole di targeting e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è supportato da plugin ed è configurato sotto `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, policy team/canale:
      // vedi /channels/msteams
    },
  },
}
```

- Percorsi chiave core trattati qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, webhook, policy DM/gruppo, override per-team/per-canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è supportato da plugin ed è configurato sotto `channels.irc`.

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

- Percorsi chiave core trattati qui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/allowlist/gate delle menzioni) è documentata in [IRC](/it/channels/irc).

### Multi-account (tutti i canali)

Esegui più account per canale (ciascuno con il proprio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Bot principale",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot avvisi",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` viene usato quando `accountId` è omesso (CLI + instradamento).
- I token env si applicano solo all'account **default**.
- Le impostazioni base del canale si applicano a tutti gli account salvo override per account.
- Usa `bindings[].match.accountId` per instradare ogni account a un agente diverso.
- Se aggiungi un account non predefinito tramite `openclaw channels add` (o onboarding del canale) mentre sei ancora su una configurazione top-level del canale single-account, OpenClaw promuove prima i valori top-level single-account con ambito account nella mappa account del canale, così l'account originale continua a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece mantenere un target con nome/default esistente corrispondente.
- I binding esistenti solo di canale (senza `accountId`) continuano a corrispondere all'account predefinito; i binding con ambito account restano facoltativi.
- `openclaw doctor --fix` ripara anche forme miste spostando i valori top-level single-account con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può invece mantenere un target con nome/default esistente corrispondente.

### Altri canali plugin

Molti canali plugin sono configurati come `channels.<id>` e documentati nelle rispettive pagine dedicate del canale (ad esempio Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Vedi l'indice completo dei canali: [Canali](/it/channels).

### Gate delle menzioni nella chat di gruppo

I messaggi di gruppo richiedono per impostazione predefinita una **menzione richiesta** (menzione nei metadati o pattern regex sicuri). Si applica alle chat di gruppo di WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipi di menzione:**

- **Menzioni nei metadati**: @-mention native della piattaforma. Ignorate in modalità self-chat di WhatsApp.
- **Pattern di testo**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- Il gate delle menzioni viene applicato solo quando il rilevamento è possibile (menzioni native o almeno un pattern).

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

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono sovrascriverlo con `channels.<channel>.historyLimit` (o per account). Imposta `0` per disabilitare.

#### Limiti della cronologia DM

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

Risoluzione: override per-DM → valore predefinito del provider → nessun limite (tutto conservato).

Supportati: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modalità self-chat

Includi il tuo numero in `allowFrom` per abilitare la modalità self-chat (ignora le @-mention native, risponde solo ai pattern di testo):

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

### Comandi (gestione dei comandi chat)

```json5
{
  commands: {
    native: "auto", // registra comandi nativi quando supportati
    nativeSkills: "auto", // registra comandi Skills nativi quando supportati
    text: true, // analizza /commands nei messaggi chat
    bash: false, // consenti ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // consenti /config
    mcp: false, // consenti /mcp
    plugins: false, // consenti /plugins
    debug: false, // consenti /debug
    restart: true, // consenti /restart + strumento gateway restart
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

<Accordion title="Dettagli dei comandi">

- Questo blocco configura le superfici di comando. Per l'attuale catalogo di comandi built-in + bundled, vedi [Slash Commands](/it/tools/slash-commands).
- Questa pagina è un **riferimento delle chiavi di configurazione**, non il catalogo completo dei comandi. I comandi gestiti da canali/plugin come QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` e Talk `/voice` sono documentati nelle rispettive pagine di canale/plugin più [Slash Commands](/it/tools/slash-commands).
- I comandi testuali devono essere messaggi **standalone** con `/` iniziale.
- `native: "auto"` attiva i comandi nativi per Discord/Telegram, lascia Slack disattivato.
- `nativeSkills: "auto"` attiva i comandi Skills nativi per Discord/Telegram, lascia Slack disattivato.
- Override per canale: `channels.discord.commands.native` (bool o `"auto"`). `false` cancella i comandi registrati in precedenza.
- Sovrascrivi la registrazione nativa delle Skills per canale con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` aggiunge voci extra al menu del bot Telegram.
- `bash: true` abilita `! <cmd>` per la shell host. Richiede `tools.elevated.enabled` e il mittente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (legge/scrive `openclaw.json`). Per i client `chat.send` del Gateway, le scritture persistenti `/config set|unset` richiedono anche `operator.admin`; il solo `/config show` in lettura resta disponibile ai normali client operatore con ambito di scrittura.
- `mcp: true` abilita `/mcp` per la configurazione dei server MCP gestiti da OpenClaw sotto `mcp.servers`.
- `plugins: true` abilita `/plugins` per rilevamento plugin, installazione e controlli di abilitazione/disabilitazione.
- `channels.<provider>.configWrites` controlla le mutazioni di configurazione per canale (predefinito: true).
- Per i canali multi-account, anche `channels.<provider>.accounts.<id>.configWrites` controlla le scritture che puntano a quell'account (ad esempio `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` disabilita `/restart` e le azioni dello strumento di riavvio del Gateway. Predefinito: `true`.
- `ownerAllowFrom` è l'allowlist esplicita del proprietario per comandi/strumenti riservati al proprietario. È separata da `allowFrom`.
- `ownerDisplay: "hash"` applica hash agli ID proprietario nel prompt di sistema. Imposta `ownerDisplaySecret` per controllare l'hash.
- `allowFrom` è per-provider. Quando è impostato, è l'**unica** fonte di autorizzazione (le allowlist/pairing del canale e `useAccessGroups` vengono ignorati).
- `useAccessGroups: false` consente ai comandi di bypassare le policy degli access group quando `allowFrom` non è impostato.
- Mappa della documentazione dei comandi:
  - catalogo built-in + bundled: [Slash Commands](/it/tools/slash-commands)
  - superfici di comando specifiche del canale: [Canali](/it/channels)
  - comandi QQ Bot: [QQ Bot](/it/channels/qqbot)
  - comandi di pairing: [Pairing](/it/channels/pairing)
  - comando card di LINE: [LINE](/it/channels/line)
  - Dreaming di memory: [Dreaming](/it/concepts/dreaming)

</Accordion>

---

## Valori predefiniti degli agenti

### `agents.defaults.workspace`

Predefinito: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root del repository facoltativa mostrata nella riga Runtime del prompt di sistema. Se non impostata, OpenClaw la rileva automaticamente risalendo dal workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist predefinita facoltativa di Skills per gli agenti che non impostano
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i predefiniti
      { id: "locked-down", skills: [] }, // nessuna Skills
    ],
  },
}
```

- Ometti `agents.defaults.skills` per Skills non limitate per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare i predefiniti.
- Imposta `agents.list[].skills: []` per nessuna Skills.
- Un elenco non vuoto `agents.list[].skills` è l'insieme finale per quell'agente; non viene
  unito ai predefiniti.

### `agents.defaults.skipBootstrap`

Disabilita la creazione automatica dei file bootstrap del workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controlla quando i file bootstrap del workspace vengono iniettati nel prompt di sistema. Predefinito: `"always"`.

- `"continuation-skip"`: i turni di continuazione sicuri (dopo una risposta completata dell'assistente) saltano la reiniezione del bootstrap del workspace, riducendo la dimensione del prompt. Le esecuzioni Heartbeat e i retry post-Compaction ricostruiscono comunque il contesto.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Numero massimo di caratteri per file bootstrap del workspace prima del troncamento. Predefinito: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Numero massimo totale di caratteri iniettati attraverso tutti i file bootstrap del workspace. Predefinito: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controlla il testo di avviso visibile all'agente quando il contesto bootstrap viene troncato.
Predefinito: `"once"`.

- `"off"`: non inietta mai testo di avviso nel prompt di sistema.
- `"once"`: inietta l'avviso una volta per ogni firma di troncamento univoca (consigliato).
- `"always"`: inietta l'avviso a ogni esecuzione quando esiste troncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mappa di proprietà del budget di contesto

OpenClaw ha più budget di prompt/contesto ad alto volume, e sono
intenzionalmente divisi per sottosistema invece di confluire tutti in un'unica opzione generica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale iniezione bootstrap del workspace.
- `agents.defaults.startupContext.*`:
  preludio di avvio one-shot per esecuzioni `/new` e `/reset`, inclusi i recenti file giornalieri
  `memory/*.md`.
- `skills.limits.*`:
  l'elenco compatto delle Skills iniettato nel prompt di sistema.
- `agents.defaults.contextLimits.*`:
  estratti runtime limitati e blocchi iniettati di proprietà del runtime.
- `memory.qmd.limits.*`:
  dimensionamento degli snippet di ricerca Memory indicizzati e dell'iniezione.

Usa l'override per-agente corrispondente solo quando un agente ha bisogno di un
budget diverso:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controlla il preludio di avvio del primo turno iniettato nelle esecuzioni `/new` e `/reset` senza argomenti.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Valori predefiniti condivisi per le superfici di contesto runtime limitate.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: limite predefinito dell'estratto `memory_get` prima che vengano aggiunti
  metadati di troncamento e avviso di continuazione.
- `memoryGetDefaultLines`: finestra di righe predefinita di `memory_get` quando `lines` è
  omesso.
- `toolResultMaxChars`: limite live dei risultati degli strumenti usato per i risultati persistiti e
  il recupero overflow.
- `postCompactionMaxChars`: limite dell'estratto `AGENTS.md` usato durante l'iniezione di refresh post-Compaction.

#### `agents.list[].contextLimits`

Override per-agente per le opzioni condivise `contextLimits`. I campi omessi ereditano
da `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Limite globale per l'elenco compatto delle Skills iniettato nel prompt di sistema. Questo
non influisce sulla lettura dei file `SKILL.md` on demand.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Override per-agente per il budget del prompt delle Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Dimensione massima in pixel del lato più lungo dell'immagine nei blocchi immagine di trascrizione/strumenti prima delle chiamate al provider.
Predefinito: `1200`.

Valori più bassi di solito riducono l'uso di vision-token e la dimensione del payload della richiesta per esecuzioni ricche di screenshot.
Valori più alti preservano più dettaglio visivo.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso orario per il contesto del prompt di sistema (non i timestamp dei messaggi). Usa come fallback il fuso orario dell'host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato orario nel prompt di sistema. Predefinito: `auto` (preferenza del sistema operativo).

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
        primary: "openai/gpt-image-2",
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
      params: { cacheRetention: "long" }, // parametri provider predefiniti globali
      embeddedHarness: {
        runtime: "auto", // auto | pi | ID harness registrato, ad esempio codex
        fallback: "pi", // pi | none
      },
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

- `model`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - La forma stringa imposta solo il modello primario.
  - La forma oggetto imposta il primario più i modelli di failover ordinati.
- `imageModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dal percorso dello strumento `image` come configurazione del modello vision.
  - Usato anche come instradamento di fallback quando il modello selezionato/predefinito non può accettare input immagine.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione immagini e da qualunque futura superficie tool/plugin che generi immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione immagini nativa Gemini, `fal/fal-ai/flux/dev` per fal, oppure `openai/gpt-image-2` per OpenAI Images.
  - Se selezioni direttamente un provider/model, configura anche l'autenticazione/API key del provider corrispondente (ad esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` per `openai/*`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato da auth. Prova prima il provider predefinito corrente, poi i provider di generazione immagini registrati rimanenti in ordine di provider-id.
- `musicGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione musicale e dallo strumento built-in `music_generate`.
  - Valori tipici: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oppure `minimax/music-2.5+`.
  - Se omesso, `music_generate` può comunque dedurre un provider predefinito supportato da auth. Prova prima il provider predefinito corrente, poi i provider di generazione musicale registrati rimanenti in ordine di provider-id.
  - Se selezioni direttamente un provider/model, configura anche l'autenticazione/API key del provider corrispondente.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione video e dallo strumento built-in `video_generate`.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oppure `qwen/wan2.7-r2v`.
  - Se omesso, `video_generate` può comunque dedurre un provider predefinito supportato da auth. Prova prima il provider predefinito corrente, poi i provider di generazione video registrati rimanenti in ordine di provider-id.
  - Se selezioni direttamente un provider/model, configura anche l'autenticazione/API key del provider corrispondente.
  - Il provider bundled di generazione video Qwen supporta fino a 1 video in uscita, 1 immagine in ingresso, 4 video in ingresso, durata di 10 secondi e opzioni a livello provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dallo strumento `pdf` per l'instradamento del modello.
  - Se omesso, lo strumento PDF usa come fallback `imageModel`, poi il modello di sessione/predefinito risolto.
- `pdfMaxBytesMb`: limite dimensione PDF predefinito per lo strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo di pagine considerate in modalità fallback di estrazione nello strumento `pdf`.
- `verboseDefault`: livello verbose predefinito per gli agenti. Valori: `"off"`, `"on"`, `"full"`. Predefinito: `"off"`.
- `elevatedDefault`: livello predefinito di output elevated per gli agenti. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Predefinito: `"on"`.
- `model.primary`: formato `provider/model` (es. `openai/gpt-5.4`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca di provider configurato per quell'esatto model id e solo dopo usa come fallback il provider predefinito configurato (comportamento di compatibilità deprecato, quindi preferisci l'esplicito `provider/model`). Se quel provider non espone più il modello predefinito configurato, OpenClaw usa come fallback il primo provider/model configurato invece di esporre un predefinito obsoleto di provider rimosso.
- `models`: il catalogo dei modelli configurato e allowlist per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifici del provider, ad esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
  - Modifiche sicure: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci. `config set` rifiuta sostituzioni che rimuoverebbero voci esistenti dell'allowlist a meno che tu non passi `--replace`.
  - I flussi configure/onboarding con ambito provider uniscono i modelli provider selezionati in questa mappa e preservano i provider non correlati già configurati.
- `params`: parametri provider predefiniti globali applicati a tutti i modelli. Imposta in `agents.defaults.params` (es. `{ cacheRetention: "long" }`).
- Precedenza di unione di `params` (config): `agents.defaults.params` (base globale) viene sovrascritto da `agents.defaults.models["provider/model"].params` (per-modello), poi `agents.list[].params` (ID agente corrispondente) sovrascrive per chiave. Vedi [Prompt Caching](/it/reference/prompt-caching) per i dettagli.
- `embeddedHarness`: policy predefinita di basso livello del runtime agente embedded. Usa `runtime: "auto"` per lasciare che gli harness plugin registrati rivendichino i modelli supportati, `runtime: "pi"` per forzare l'harness PI built-in oppure un ID harness registrato come `runtime: "codex"`. Imposta `fallback: "none"` per disabilitare il fallback automatico a Pi.
- I writer di configurazione che modificano questi campi (ad esempio `/models set`, `/models set-image` e i comandi di aggiunta/rimozione fallback) salvano la forma oggetto canonica e preservano gli elenchi di fallback esistenti quando possibile.
- `maxConcurrent`: numero massimo di esecuzioni parallele dell'agente tra le sessioni (ogni sessione resta comunque serializzata). Predefinito: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` controlla quale esecutore di basso livello esegue i turni degli agenti embedded.
La maggior parte delle distribuzioni dovrebbe mantenere il valore predefinito `{ runtime: "auto", fallback: "pi" }`.
Usalo quando un plugin attendibile fornisce un harness nativo, come il bundled
harness app-server Codex.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` oppure un ID harness plugin registrato. Il plugin bundled Codex registra `codex`.
- `fallback`: `"pi"` oppure `"none"`. `"pi"` mantiene l'harness PI built-in come fallback di compatibilità quando non è selezionato alcun harness plugin. `"none"` fa sì che una selezione di harness plugin mancante o non supportata fallisca invece di usare silenziosamente Pi. I fallimenti dell'harness plugin selezionato emergono sempre direttamente.
- Override d'ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` sovrascrive `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` disabilita il fallback a Pi per quel processo.
- Per distribuzioni solo Codex, imposta `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` e `embeddedHarness.fallback: "none"`.
- Questo controlla solo l'harness chat embedded. Generazione media, vision, PDF, musica, video e TTS usano comunque le rispettive impostazioni provider/model.

**Scorciatoie alias built-in** (si applicano solo quando il modello è in `agents.defaults.models`):

| Alias               | Modello                               |
| ------------------- | ------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`           |
| `sonnet`            | `anthropic/claude-sonnet-4-6`         |
| `gpt`               | `openai/gpt-5.4`                      |
| `gpt-mini`          | `openai/gpt-5.4-mini`                 |
| `gpt-nano`          | `openai/gpt-5.4-nano`                 |
| `gemini`            | `google/gemini-3.1-pro-preview`       |
| `gemini-flash`      | `google/gemini-3-flash-preview`       |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

I tuoi alias configurati hanno sempre la precedenza sui predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità thinking a meno che tu non imposti `--thinking off` o definisca tu stesso `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per impostazione predefinita per lo streaming delle chiamate tool. Imposta `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
I modelli Anthropic Claude 4.6 usano per impostazione predefinita il thinking `adaptive` quando non è impostato alcun livello di thinking esplicito.

### `agents.defaults.cliBackends`

Backend CLI facoltativi per esecuzioni di fallback solo testo (senza chiamate tool). Utili come backup quando i provider API falliscono.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- I backend CLI sono text-first; gli strumenti sono sempre disabilitati.
- Le sessioni sono supportate quando `sessionArg` è impostato.
- Il pass-through delle immagini è supportato quando `imageArg` accetta percorsi file.

### `agents.defaults.systemPromptOverride`

Sostituisce l'intero prompt di sistema assemblato da OpenClaw con una stringa fissa. Imposta a livello predefinito (`agents.defaults.systemPromptOverride`) o per agente (`agents.list[].systemPromptOverride`). I valori per-agente hanno la precedenza; un valore vuoto o composto solo da spazi viene ignorato. Utile per esperimenti controllati sul prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "Sei un assistente utile.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Overlay di prompt indipendenti dal provider applicati per famiglia di modelli. I model id della famiglia GPT-5 ricevono il contratto di comportamento condiviso tra provider; `personality` controlla solo il livello dello stile di interazione amichevole.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (predefinito) e `"on"` abilitano il livello di stile di interazione amichevole.
- `"off"` disabilita solo il livello amichevole; il contratto di comportamento GPT-5 taggato resta abilitato.
- Il valore legacy `plugins.entries.openai.config.personality` viene ancora letto quando questa impostazione condivisa non è impostata.

### `agents.defaults.heartbeat`

Esecuzioni periodiche Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disabilita
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // predefinito: true; false omette la sezione Heartbeat dal prompt di sistema
        lightContext: false, // predefinito: false; true mantiene solo HEARTBEAT.md tra i file bootstrap del workspace
        isolatedSession: false, // predefinito: false; true esegue ogni Heartbeat in una sessione nuova (senza cronologia conversazione)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predefinito) | block
        target: "none", // predefinito: none | opzioni: last | whatsapp | telegram | discord | ...
        prompt: "Leggi HEARTBEAT.md se esiste...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: stringa di durata (ms/s/m/h). Predefinito: `30m` (auth con API key) oppure `1h` (auth OAuth). Imposta `0m` per disabilitare.
- `includeSystemPromptSection`: quando è false, omette la sezione Heartbeat dal prompt di sistema e salta l'iniezione di `HEARTBEAT.md` nel contesto bootstrap. Predefinito: `true`.
- `suppressToolErrorWarnings`: quando è true, sopprime i payload di avviso degli errori degli strumenti durante le esecuzioni Heartbeat.
- `timeoutSeconds`: tempo massimo in secondi consentito per un turno agente Heartbeat prima che venga interrotto. Lascia non impostato per usare `agents.defaults.timeoutSeconds`.
- `directPolicy`: policy di consegna diretta/DM. `allow` (predefinito) consente la consegna al target diretto. `block` sopprime la consegna al target diretto ed emette `reason=dm-blocked`.
- `lightContext`: quando è true, le esecuzioni Heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` tra i file bootstrap del workspace.
- `isolatedSession`: quando è true, ogni Heartbeat viene eseguito in una sessione nuova senza cronologia conversazionale precedente. Stesso schema di isolamento di Cron `sessionTarget: "isolated"`. Riduce il costo per Heartbeat da circa 100K a circa 2-5K token.
- Per-agente: imposta `agents.list[].heartbeat`. Quando un qualunque agente definisce `heartbeat`, **solo quegli agenti** eseguono Heartbeat.
- Gli Heartbeat eseguono turni completi dell'agente — intervalli più brevi consumano più token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id di un plugin provider Compaction registrato (facoltativo)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserva esattamente gli ID di deployment, gli ID ticket e le coppie host:port.", // usato quando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disabilita la reiniezione
        model: "openrouter/anthropic/claude-sonnet-4-6", // override facoltativo del modello solo per Compaction
        notifyUser: true, // invia brevi avvisi quando Compaction inizia e termina (predefinito: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "La sessione si avvicina a Compaction. Memorizza ora i ricordi durevoli.",
          prompt: "Scrivi eventuali note durature in memory/YYYY-MM-DD.md; rispondi con il token silenzioso esatto NO_REPLY se non c'è nulla da memorizzare.",
        },
      },
    },
  },
}
```

- `mode`: `default` oppure `safeguard` (riassunto a blocchi per cronologie lunghe). Vedi [Compaction](/it/concepts/compaction).
- `provider`: ID di un plugin provider Compaction registrato. Quando impostato, viene chiamato `summarize()` del provider invece del riassunto LLM built-in. In caso di errore usa il built-in come fallback. Impostare un provider forza `mode: "safeguard"`. Vedi [Compaction](/it/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentiti per una singola operazione di Compaction prima che OpenClaw la interrompa. Predefinito: `900`.
- `identifierPolicy`: `strict` (predefinito), `off` oppure `custom`. `strict` antepone guida built-in per la conservazione di identificatori opachi durante il riassunto di Compaction.
- `identifierInstructions`: testo facoltativo personalizzato di preservazione identificatori usato quando `identifierPolicy=custom`.
- `postCompactionSections`: nomi facoltativi delle sezioni H2/H3 di AGENTS.md da reiniettare dopo Compaction. Il valore predefinito è `["Session Startup", "Red Lines"]`; imposta `[]` per disabilitare la reiniezione. Quando non impostato o impostato esplicitamente a quella coppia predefinita, vengono accettate anche le vecchie intestazioni `Every Session`/`Safety` come fallback legacy.
- `model`: override facoltativo `provider/model-id` solo per il riassunto di Compaction. Usalo quando la sessione principale deve mantenere un modello ma i riassunti di Compaction devono essere eseguiti su un altro; se non impostato, Compaction usa il modello primario della sessione.
- `notifyUser`: quando è `true`, invia brevi avvisi all'utente quando Compaction inizia e quando termina (ad esempio, "Compacting context..." e "Compaction complete"). Disabilitato per impostazione predefinita per mantenere Compaction silenzioso.
- `memoryFlush`: turno agente silenzioso prima dell'auto-Compaction per memorizzare ricordi durevoli. Saltato quando il workspace è in sola lettura.

### `agents.defaults.contextPruning`

Esegue il pruning dei **vecchi risultati degli strumenti** dal contesto in memoria prima di inviarlo all'LLM. **Non** modifica la cronologia della sessione su disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // durata (ms/s/m/h), unità predefinita: minuti
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

<Accordion title="Comportamento della modalità cache-ttl">

- `mode: "cache-ttl"` abilita i passaggi di pruning.
- `ttl` controlla quanto spesso il pruning può essere eseguito di nuovo (dopo l'ultimo tocco della cache).
- Il pruning prima esegue soft-trim dei risultati degli strumenti sovradimensionati, poi hard-clear dei risultati più vecchi se necessario.

**Soft-trim** mantiene l'inizio + la fine e inserisce `...` nel mezzo.

**Hard-clear** sostituisce l'intero risultato dello strumento con il segnaposto.

Note:

- I blocchi immagine non vengono mai troncati/cancellati.
- I rapporti sono basati sui caratteri (approssimativi), non su conteggi token esatti.
- Se esistono meno di `keepLastAssistants` messaggi dell'assistente, il pruning viene saltato.

</Accordion>

Vedi [Session Pruning](/it/concepts/session-pruning) per i dettagli di comportamento.

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (usa minMs/maxMs)
    },
  },
}
```

- I canali non-Telegram richiedono `*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
- Override del canale: `channels.<channel>.blockStreamingCoalesce` (e varianti per-account). Signal/Slack/Discord/Google Chat hanno come predefinito `minChars: 1500`.
- `humanDelay`: pausa casuale tra le risposte a blocchi. `natural` = 800–2500ms. Override per-agente: `agents.list[].humanDelay`.

Vedi [Streaming](/it/concepts/streaming) per i dettagli di comportamento + chunking.

### Indicatori di digitazione

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

- Predefiniti: `instant` per chat dirette/menzioni, `message` per chat di gruppo senza menzione.
- Override per-sessione: `session.typingMode`, `session.typingIntervalSeconds`.

Vedi [Indicatori di digitazione](/it/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing facoltativo per l'agente embedded. Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa.

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
          // Sono supportati anche SecretRef / contenuti inline:
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

<Accordion title="Dettagli della sandbox">

**Backend:**

- `docker`: runtime Docker locale (predefinito)
- `ssh`: runtime remoto generico supportato da SSH
- `openshell`: runtime OpenShell

Quando è selezionato `backend: "openshell"`, le impostazioni specifiche del runtime si spostano in
`plugins.entries.openshell.config`.

**Configurazione del backend SSH:**

- `target`: target SSH nel formato `user@host[:port]`
- `command`: comando client SSH (predefinito: `ssh`)
- `workspaceRoot`: root remota assoluta usata per i workspace per-scope
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti inline o SecretRef che OpenClaw materializza in file temporanei a runtime
- `strictHostKeyChecking` / `updateHostKeys`: opzioni di policy host-key di OpenSSH

**Precedenza auth SSH:**

- `identityData` ha precedenza su `identityFile`
- `certificateData` ha precedenza su `certificateFile`
- `knownHostsData` ha precedenza su `knownHostsFile`
- I valori `*Data` supportati da SecretRef vengono risolti dallo snapshot runtime dei segreti attivo prima che inizi la sessione sandbox

**Comportamento del backend SSH:**

- inizializza il workspace remoto una volta dopo create o recreate
- poi mantiene canonico il workspace SSH remoto
- instrada `exec`, gli strumenti file e i percorsi media tramite SSH
- non sincronizza automaticamente sull'host le modifiche remote
- non supporta container browser sandbox

**Accesso workspace:**

- `none`: workspace sandbox per-scope sotto `~/.openclaw/sandboxes`
- `ro`: workspace sandbox su `/workspace`, workspace agente montato in sola lettura su `/agent`
- `rw`: workspace agente montato in lettura/scrittura su `/workspace`

**Scope:**

- `session`: container + workspace per-sessione
- `agent`: un container + workspace per agente (predefinito)
- `shared`: container e workspace condivisi (nessun isolamento cross-sessione)

**Configurazione del plugin OpenShell:**

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
          gateway: "lab", // facoltativo
          gatewayEndpoint: "https://lab.example", // facoltativo
          policy: "strict", // ID policy OpenShell facoltativo
          providers: ["openai"], // facoltativo
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modalità OpenShell:**

- `mirror`: inizializza il remoto dal locale prima di exec, sincronizza indietro dopo exec; il workspace locale resta canonico
- `remote`: inizializza il remoto una volta quando la sandbox viene creata, poi mantiene canonico il workspace remoto

In modalità `remote`, le modifiche locali sull'host fatte fuori da OpenClaw non vengono sincronizzate automaticamente nella sandbox dopo il passaggio di seed.
Il trasporto è SSH nella sandbox OpenShell, ma il plugin gestisce il ciclo di vita della sandbox e la sincronizzazione mirror facoltativa.

**`setupCommand`** viene eseguito una volta dopo la creazione del container (tramite `sh -lc`). Richiede egress di rete, root scrivibile, utente root.

**I container hanno come predefinito `network: "none"`** — imposta `"bridge"` (o una rete bridge personalizzata) se l'agente ha bisogno di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per impostazione predefinita a meno che tu non imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Gli allegati in ingresso** vengono preparati in `media/inbound/*` nel workspace attivo.

**`docker.binds`** monta directory host aggiuntive; i bind globali e per-agente vengono uniti.

**Browser sandboxed** (`sandbox.browser.enabled`): Chromium + CDP in un container. L'URL noVNC viene iniettato nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L'accesso osservatore noVNC usa per impostazione predefinita l'autenticazione VNC e OpenClaw emette un URL con token a breve durata (invece di esporre la password nell'URL condiviso).

- `allowHostControl: false` (predefinito) blocca le sessioni sandboxed dal puntare al browser host.
- `network` ha come predefinito `openclaw-sandbox-browser` (rete bridge dedicata). Imposta `bridge` solo quando vuoi esplicitamente connettività globale bridge.
- `cdpSourceRange` limita facoltativamente l'ingresso CDP al bordo del container a un intervallo CIDR (ad esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive solo nel container browser sandbox. Quando è impostato (incluso `[]`), sostituisce `docker.binds` per il container browser.
- I valori predefiniti di avvio sono definiti in `scripts/sandbox-browser-entrypoint.sh` e ottimizzati per host container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derivato da OPENCLAW_BROWSER_CDP_PORT>`
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
  - `--disable-extensions` (abilitato per impostazione predefinita)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` sono
    abilitati per impostazione predefinita e possono essere disabilitati con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se l'uso di WebGL/3D lo richiede.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` riabilita le estensioni se il tuo flusso di lavoro
    dipende da esse.
  - `--renderer-process-limit=2` può essere cambiato con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; imposta `0` per usare il
    limite di processi predefinito di Chromium.
  - più `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` è abilitato.
  - I valori predefiniti sono la baseline dell'immagine container; usa un'immagine browser personalizzata con un entrypoint personalizzato per cambiare i valori predefiniti del container.

</Accordion>

Il sandboxing del browser e `sandbox.docker.binds` sono solo Docker.

Build delle immagini:

```bash
scripts/sandbox-setup.sh           # immagine sandbox principale
scripts/sandbox-browser-setup.sh   # immagine browser facoltativa
```

### `agents.list` (override per-agente)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Agente principale",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // oppure { primary, fallbacks }
        thinkingDefault: "high", // override per-agente del livello di thinking
        reasoningDefault: "on", // override per-agente della visibilità del reasoning
        fastModeDefault: false, // override per-agente della modalità fast
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // sovrascrive per chiave i params corrispondenti in defaults.models
        skills: ["docs-search"], // sostituisce agents.defaults.skills quando impostato
        identity: {
          name: "Samantha",
          theme: "bradipo disponibile",
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

- `id`: ID agente stabile (obbligatorio).
- `default`: quando ne sono impostati più di uno, vince il primo (viene registrato un warning). Se non ne è impostato nessuno, il predefinito è la prima voce dell'elenco.
- `model`: la forma stringa sovrascrive solo `primary`; la forma oggetto `{ primary, fallbacks }` sovrascrive entrambi (`[]` disabilita i fallback globali). I processi Cron che sovrascrivono solo `primary` continuano comunque a ereditare i fallback predefiniti a meno che tu non imposti `fallbacks: []`.
- `params`: params stream per-agente uniti sopra la voce di modello selezionata in `agents.defaults.models`. Usalo per override specifici dell'agente come `cacheRetention`, `temperature` o `maxTokens` senza duplicare l'intero catalogo modelli.
- `skills`: allowlist facoltativa di Skills per-agente. Se omesso, l'agente eredita `agents.defaults.skills` quando impostato; un elenco esplicito sostituisce i predefiniti invece di unirli, e `[]` significa nessuna Skills.
- `thinkingDefault`: livello di thinking predefinito facoltativo per-agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sovrascrive `agents.defaults.thinkingDefault` per questo agente quando non è impostato alcun override per-messaggio o sessione.
- `reasoningDefault`: visibilità predefinita facoltativa del reasoning per-agente (`on | off | stream`). Si applica quando non è impostato alcun override di reasoning per-messaggio o sessione.
- `fastModeDefault`: valore predefinito facoltativo per-agente per la modalità fast (`true | false`). Si applica quando non è impostato alcun override della modalità fast per-messaggio o sessione.
- `embeddedHarness`: override facoltativo per-agente della policy di basso livello dell'harness. Usa `{ runtime: "codex", fallback: "none" }` per rendere un agente solo Codex mentre gli altri mantengono il fallback Pi predefinito.
- `runtime`: descrittore runtime facoltativo per-agente. Usa `type: "acp"` con i valori predefiniti `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l'agente deve usare per impostazione predefinita sessioni harness ACP.
- `identity.avatar`: percorso relativo al workspace, URL `http(s)` o URI `data:`.
- `identity` deriva valori predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: allowlist di ID agente per `sessions_spawn` (`["*"]` = qualsiasi; predefinito: solo lo stesso agente).
- Protezione di ereditarietà sandbox: se la sessione richiedente è sandboxed, `sessions_spawn` rifiuta target che verrebbero eseguiti senza sandbox.
- `subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo; predefinito: false).

---

## Instradamento multi-agente

Esegui più agenti isolati dentro un singolo Gateway. Vedi [Multi-Agent](/it/concepts/multi-agent).

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

### Campi di corrispondenza del binding

- `type` (facoltativo): `route` per l'instradamento normale (tipo mancante = route), `acp` per binding di conversazioni ACP persistenti.
- `match.channel` (obbligatorio)
- `match.accountId` (facoltativo; `*` = qualsiasi account; omesso = account predefinito)
- `match.peer` (facoltativo; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facoltativo; specifici del canale)
- `acp` (facoltativo; solo per voci `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordine di corrispondenza deterministico:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (esatto, senza peer/guild/team)
5. `match.accountId: "*"` (esteso al canale)
6. Agente predefinito

Dentro ogni livello, vince la prima voce `bindings` corrispondente.

Per le voci `type: "acp"`, OpenClaw risolve per identità esatta della conversazione (`match.channel` + account + `match.peer.id`) e non usa l'ordine a livelli dei binding di route qui sopra.

### Profili di accesso per-agente

<Accordion title="Accesso completo (senza sandbox)">

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

<Accordion title="Strumenti + workspace in sola lettura">

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

<Accordion title="Nessun accesso filesystem (solo messaggistica)">

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

Vedi [Sandbox & Tools multi-agente](/it/tools/multi-agent-sandbox-tools) per i dettagli di precedenza.

---

## Sessione

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
    parentForkMaxTokens: 100000, // salta il fork del thread genitore sopra questo conteggio token (0 disabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durata oppure false
      maxDiskBytes: "500mb", // budget rigido facoltativo
      highWaterBytes: "400mb", // target di cleanup facoltativo
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // auto-unfocus predefinito per inattività in ore (`0` disabilita)
      maxAgeHours: 0, // età massima rigida predefinita in ore (`0` disabilita)
    },
    mainKey: "main", // legacy (il runtime usa sempre "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Dettagli dei campi session">

- **`scope`**: strategia base di raggruppamento delle sessioni per i contesti di chat di gruppo.
  - `per-sender` (predefinito): ogni mittente ha una sessione isolata all'interno di un contesto canale.
  - `global`: tutti i partecipanti in un contesto canale condividono una singola sessione (usalo solo quando è previsto un contesto condiviso).
- **`dmScope`**: come vengono raggruppati i DM.
  - `main`: tutti i DM condividono la sessione principale.
  - `per-peer`: isola per ID mittente tra i canali.
  - `per-channel-peer`: isola per canale + mittente (consigliato per inbox multiutente).
  - `per-account-channel-peer`: isola per account + canale + mittente (consigliato per multi-account).
- **`identityLinks`**: mappa ID canonici a peer con prefisso provider per la condivisione di sessione cross-channel.
- **`reset`**: policy di reset primaria. `daily` esegue il reset all'ora locale `atHour`; `idle` esegue il reset dopo `idleMinutes`. Quando entrambi sono configurati, prevale quello che scade per primo.
- **`resetByType`**: override per tipo (`direct`, `group`, `thread`). Il legacy `dm` è accettato come alias di `direct`.
- **`parentForkMaxTokens`**: massimo `totalTokens` della sessione genitore consentito quando si crea una sessione thread forked (predefinito `100000`).
  - Se `totalTokens` del genitore è sopra questo valore, OpenClaw avvia una nuova sessione thread invece di ereditare la cronologia della trascrizione del genitore.
  - Imposta `0` per disabilitare questa protezione e consentire sempre il forking dal genitore.
- **`mainKey`**: campo legacy. Il runtime usa sempre `"main"` per il bucket principale della chat diretta.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta reciproca tra agenti durante scambi agent-to-agent (intero, intervallo: `0`–`5`). `0` disabilita il concatenamento ping-pong.
- **`sendPolicy`**: corrispondenza per `channel`, `chatType` (`direct|group|channel`, con alias legacy `dm`), `keyPrefix` o `rawKeyPrefix`. Il primo deny vince.
- **`maintenance`**: controlli di cleanup + retention dello store sessione.
  - `mode`: `warn` emette solo avvisi; `enforce` applica il cleanup.
  - `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`).
  - `maxEntries`: numero massimo di voci in `sessions.json` (predefinito `500`).
  - `rotateBytes`: ruota `sessions.json` quando supera questa dimensione (predefinito `10mb`).
  - `resetArchiveRetention`: retention per gli archivi di trascrizione `*.reset.<timestamp>`. Predefinito uguale a `pruneAfter`; imposta `false` per disabilitare.
  - `maxDiskBytes`: budget disco facoltativo per la directory sessioni. In modalità `warn` registra avvisi; in modalità `enforce` rimuove prima gli artefatti/sessioni più vecchi.
  - `highWaterBytes`: target facoltativo dopo il cleanup del budget. Predefinito all'`80%` di `maxDiskBytes`.
- **`threadBindings`**: valori predefiniti globali per le funzionalità di sessione associate ai thread.
  - `enabled`: interruttore master predefinito (i provider possono sovrascriverlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus predefinito per inattività in ore (`0` disabilita; i provider possono sovrascriverlo)
  - `maxAgeHours`: età massima rigida predefinita in ore (`0` disabilita; i provider possono sovrascriverlo)

</Accordion>

---

## Messaggi

```json5
{
  messages: {
    responsePrefix: "🦞", // oppure "auto"
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
      debounceMs: 2000, // 0 disabilita
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefisso di risposta

Override per canale/account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Risoluzione (vince il più specifico): account → canale → globale. `""` disabilita e interrompe la cascata. `"auto"` deriva `[{identity.name}]`.

**Variabili del template:**

| Variabile         | Descrizione               | Esempio                     |
| ----------------- | ------------------------- | --------------------------- |
| `{model}`         | Nome breve del modello    | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore completo del modello | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome del provider         | `anthropic`                 |
| `{thinkingLevel}` | Livello di thinking corrente | `high`, `low`, `off`     |
| `{identity.name}` | Nome identità agente      | (uguale a `"auto"`)         |

Le variabili non distinguono tra maiuscole e minuscole. `{think}` è un alias di `{thinkingLevel}`.

### Reazione ack

- Per impostazione predefinita usa `identity.emoji` dell'agente attivo, altrimenti `"👀"`. Imposta `""` per disabilitare.
- Override per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → fallback dell'identità.
- Ambito: `group-mentions` (predefinito), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: rimuove l'ack dopo la risposta su Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: abilita le reazioni di stato del ciclo di vita su Slack, Discord e Telegram.
  Su Slack e Discord, se non impostato mantiene abilitate le reazioni di stato quando le reazioni ack sono attive.
  Su Telegram, impostalo esplicitamente a `true` per abilitare le reazioni di stato del ciclo di vita.

### Debounce in ingresso

Raggruppa rapidi messaggi di solo testo dello stesso mittente in un singolo turno agente. Media/allegati vengono flushati immediatamente. I comandi di controllo bypassano il debounce.

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

- `auto` controlla la modalità auto-TTS predefinita: `off`, `always`, `inbound` oppure `tagged`. `/tts on|off` può sovrascrivere le preferenze locali e `/tts status` mostra lo stato effettivo.
- `summaryModel` sovrascrive `agents.defaults.model.primary` per l'auto-summary.
- `modelOverrides` è abilitato per impostazione predefinita; `modelOverrides.allowProvider` ha come predefinito `false` (opt-in).
- Le API key usano come fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- `openai.baseUrl` sovrascrive l'endpoint TTS OpenAI. L'ordine di risoluzione è config, poi `OPENAI_TTS_BASE_URL`, poi `https://api.openai.com/v1`.
- Quando `openai.baseUrl` punta a un endpoint non OpenAI, OpenClaw lo tratta come un server TTS compatibile con OpenAI e allenta la validazione di modello/voce.

---

## Talk

Valori predefiniti per la modalità Talk (macOS/iOS/Android).

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

- `talk.provider` deve corrispondere a una chiave in `talk.providers` quando sono configurati più provider Talk.
- Le chiavi flat legacy di Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sono solo per compatibilità e vengono migrate automaticamente in `talk.providers.<provider>`.
- Gli ID voce usano come fallback `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` accetta stringhe plain text o oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna API key Talk.
- `providers.*.voiceAliases` consente alle direttive Talk di usare nomi amichevoli.
- `silenceTimeoutMs` controlla quanto a lungo la modalità Talk attende dopo il silenzio dell'utente prima di inviare la trascrizione. Se non impostato mantiene la finestra di pausa predefinita della piattaforma (`700 ms su macOS e Android, 900 ms su iOS`).

---

## Strumenti

### Profili degli strumenti

`tools.profile` imposta un'allowlist di base prima di `tools.allow`/`tools.deny`:

L'onboarding locale imposta per default le nuove configurazioni locali su `tools.profile: "coding"` quando non impostato (i profili espliciti esistenti vengono preservati).

| Profilo     | Include                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | solo `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                    |

### Gruppi di strumenti

| Gruppo             | Strumenti                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` è accettato come alias di `exec`)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Tutti gli strumenti built-in (esclude i plugin provider)                                                               |

### `tools.allow` / `tools.deny`

Policy globale di allow/deny degli strumenti (deny vince). Case-insensitive, supporta wildcard `*`. Applicata anche quando la sandbox Docker è disattivata.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Limita ulteriormente gli strumenti per provider o modelli specifici. Ordine: profilo base → profilo provider → allow/deny.

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

Controlla l'accesso exec elevated fuori dalla sandbox:

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

- L'override per-agente (`agents.list[].tools.elevated`) può solo restringere ulteriormente.
- `/elevated on|off|ask|full` memorizza lo stato per sessione; le direttive inline si applicano a un singolo messaggio.
- `exec` elevated bypassa la sandbox e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando il target exec è `node`).

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

I controlli di sicurezza sui loop degli strumenti sono **disabilitati per impostazione predefinita**. Imposta `enabled: true` per attivare il rilevamento.
Le impostazioni possono essere definite globalmente in `tools.loopDetection` e sovrascritte per-agente in `agents.list[].tools.loopDetection`.

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

- `historySize`: cronologia massima delle chiamate tool conservata per l'analisi dei loop.
- `warningThreshold`: soglia di pattern ripetuto senza progresso per gli avvisi.
- `criticalThreshold`: soglia ripetuta più alta per bloccare loop critici.
- `globalCircuitBreakerThreshold`: soglia hard stop per qualunque esecuzione senza progresso.
- `detectors.genericRepeat`: avvisa su chiamate ripetute stesso-tool/stessi-args.
- `detectors.knownPollNoProgress`: avvisa/blocca sui noti strumenti di polling (`process.poll`, `command_status`, ecc.).
- `detectors.pingPong`: avvisa/blocca su pattern alternati a coppie senza progresso.
- Se `warningThreshold >= criticalThreshold` oppure `criticalThreshold >= globalCircuitBreakerThreshold`, la validazione fallisce.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // oppure env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // facoltativo; ometti per auto-detect
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

Configura la comprensione dei media in ingresso (immagine/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: invia direttamente al canale musica/video asincroni completati
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

<Accordion title="Campi delle voci del modello media">

**Voce provider** (`type: "provider"` o omesso):

- `provider`: ID provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, ecc.)
- `model`: override dell'ID modello
- `profile` / `preferredProfile`: selezione del profilo `auth-profiles.json`

**Voce CLI** (`type: "cli"`):

- `command`: eseguibile da avviare
- `args`: argomenti con template (supporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, ecc.)

**Campi comuni:**

- `capabilities`: elenco facoltativo (`image`, `audio`, `video`). Valori predefiniti: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per-voce.
- In caso di errore si passa alla voce successiva.

L'autenticazione del provider segue l'ordine standard: `auth-profiles.json` → variabili env → `models.providers.*.apiKey`.

**Campi di completamento asincrono:**

- `asyncCompletion.directSend`: quando `true`, le attività asincrone completate `music_generate`
  e `video_generate` provano prima la consegna diretta al canale. Predefinito: `false`
  (percorso legacy di wake della sessione richiedente/consegna del modello).

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

Controlla quali sessioni possono essere destinate dagli strumenti sessione (`sessions_list`, `sessions_history`, `sessions_send`).

Predefinito: `tree` (sessione corrente + sessioni generate da essa, come i subagenti).

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

Note:

- `self`: solo la chiave della sessione corrente.
- `tree`: sessione corrente + sessioni generate dalla sessione corrente (subagenti).
- `agent`: qualsiasi sessione appartenente all'ID agente corrente (può includere altri utenti se esegui sessioni per-sender sotto lo stesso ID agente).
- `all`: qualsiasi sessione. Il targeting cross-agent richiede comunque `tools.agentToAgent`.
- Clamp sandbox: quando la sessione corrente è sandboxed e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilità viene forzata a `tree` anche se `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controlla il supporto agli allegati inline per `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: imposta true per consentire allegati file inline
        maxTotalBytes: 5242880, // 5 MB totali su tutti i file
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // mantiene gli allegati quando cleanup="keep"
      },
    },
  },
}
```

Note:

- Gli allegati sono supportati solo per `runtime: "subagent"`. Il runtime ACP li rifiuta.
- I file vengono materializzati nel workspace figlio in `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
- Il contenuto degli allegati viene automaticamente redatto dalla persistenza della trascrizione.
- Gli input Base64 vengono validati con controlli rigorosi su alfabeto/padding e una protezione preventiva sulla dimensione prima della decodifica.
- I permessi dei file sono `0700` per le directory e `0600` per i file.
- Il cleanup segue la policy `cleanup`: `delete` rimuove sempre gli allegati; `keep` li conserva solo quando `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag sperimentali degli strumenti built-in. Disattivati per impostazione predefinita salvo quando si applica una regola di auto-abilitazione GPT-5 strict-agentic.

```json5
{
  tools: {
    experimental: {
      planTool: true, // abilita l'update_plan sperimentale
    },
  },
}
```

Note:

- `planTool`: abilita lo strumento strutturato `update_plan` per il tracciamento del lavoro non banale a più passaggi.
- Predefinito: `false` a meno che `agents.defaults.embeddedPi.executionContract` (o un override per-agente) sia impostato su `"strict-agentic"` per un'esecuzione GPT-5-family OpenAI o OpenAI Codex. Imposta `true` per forzare l'attivazione dello strumento fuori da quell'ambito, oppure `false` per mantenerlo disattivato anche per esecuzioni GPT-5 strict-agentic.
- Quando è abilitato, il prompt di sistema aggiunge anche linee guida d'uso così il modello lo usa solo per lavoro sostanziale e mantiene al massimo un passaggio `in_progress`.

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

- `model`: modello predefinito per i subagenti generati. Se omesso, i subagenti ereditano il modello del chiamante.
- `allowAgents`: allowlist predefinita degli ID agente target per `sessions_spawn` quando l'agente richiedente non imposta il proprio `subagents.allowAgents` (`["*"]` = qualsiasi; predefinito: solo lo stesso agente).
- `runTimeoutSeconds`: timeout predefinito (secondi) per `sessions_spawn` quando la chiamata tool omette `runTimeoutSeconds`. `0` significa nessun timeout.
- Policy degli strumenti per-subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider personalizzati e base URL

OpenClaw usa il catalogo modelli built-in. Aggiungi provider personalizzati tramite `models.providers` nella configurazione o `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (predefinito) | replace
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

- Usa `authHeader: true` + `headers` per esigenze di autenticazione personalizzate.
- Sovrascrivi la root della configurazione dell'agente con `OPENCLAW_AGENT_DIR` (oppure `PI_CODING_AGENT_DIR`, alias legacy della variabile d'ambiente).
- Precedenza di merge per ID provider corrispondenti:
  - I valori `baseUrl` non vuoti di `models.json` dell'agente hanno la precedenza.
  - I valori `apiKey` non vuoti dell'agente hanno la precedenza solo quando quel provider non è gestito da SecretRef nel contesto config/auth-profile corrente.
  - I valori `apiKey` del provider gestiti da SecretRef vengono aggiornati dai marker sorgente (`ENV_VAR_NAME` per ref env, `secretref-managed` per ref file/exec) invece di persistere i segreti risolti.
  - I valori header del provider gestiti da SecretRef vengono aggiornati dai marker sorgente (`secretref-env:ENV_VAR_NAME` per ref env, `secretref-managed` per ref file/exec).
  - `apiKey`/`baseUrl` dell'agente vuoti o mancanti usano come fallback `models.providers` nella configurazione.
  - `contextWindow`/`maxTokens` del modello corrispondente usano il valore più alto tra config esplicita e valori impliciti del catalogo.
  - `contextTokens` del modello corrispondente preserva un limite runtime esplicito quando presente; usalo per limitare il contesto effettivo senza cambiare i metadati nativi del modello.
  - Usa `models.mode: "replace"` quando vuoi che la configurazione riscriva completamente `models.json`.
  - La persistenza dei marker è autorevole rispetto alla sorgente: i marker vengono scritti dallo snapshot della configurazione sorgente attiva (pre-risoluzione), non dai valori dei segreti runtime risolti.

### Dettagli dei campi provider

- `models.mode`: comportamento del catalogo provider (`merge` oppure `replace`).
- `models.providers`: mappa dei provider personalizzati con chiave provider id.
  - Modifiche sicure: usa `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oppure `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` per aggiornamenti additivi. `config set` rifiuta sostituzioni distruttive a meno che tu non passi `--replace`.
- `models.providers.*.api`: adattatore della richiesta (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, ecc.).
- `models.providers.*.apiKey`: credenziale del provider (preferisci SecretRef/sostituzione env).
- `models.providers.*.auth`: strategia di autenticazione (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: per Ollama + `openai-completions`, inietta `options.num_ctx` nelle richieste (predefinito: `true`).
- `models.providers.*.authHeader`: forza il trasporto della credenziale nell'header `Authorization` quando richiesto.
- `models.providers.*.baseUrl`: URL base dell'API upstream.
- `models.providers.*.headers`: header statici extra per instradamento proxy/tenant.
- `models.providers.*.request`: override di trasporto per le richieste HTTP del model-provider.
  - `request.headers`: header extra (uniti con i predefiniti del provider). I valori accettano SecretRef.
  - `request.auth`: override della strategia auth. Modalità: `"provider-default"` (usa l'auth built-in del provider), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` facoltativo).
  - `request.proxy`: override del proxy HTTP. Modalità: `"env-proxy"` (usa le variabili env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Entrambe le modalità accettano un sotto-oggetto `tls` facoltativo.
  - `request.tls`: override TLS per connessioni dirette. Campi: `ca`, `cert`, `key`, `passphrase` (tutti accettano SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: quando `true`, consente HTTPS verso `baseUrl` quando il DNS risolve a intervalli privati, CGNAT o simili, tramite la protezione fetch HTTP del provider (opt-in operatore per endpoint OpenAI-compatible self-hosted attendibili). WebSocket usa lo stesso `request` per header/TLS ma non quella protezione SSRF fetch. Predefinito `false`.
- `models.providers.*.models`: voci esplicite del catalogo modelli del provider.
- `models.providers.*.models.*.contextWindow`: metadati nativi della finestra di contesto del modello.
- `models.providers.*.models.*.contextTokens`: limite di contesto runtime facoltativo. Usalo quando vuoi un budget di contesto effettivo più piccolo del `contextWindow` nativo del modello.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: suggerimento facoltativo di compatibilità. Per `api: "openai-completions"` con un `baseUrl` non nativo e non vuoto (host diverso da `api.openai.com`), OpenClaw forza questo valore a `false` a runtime. `baseUrl` vuoto/omesso mantiene il comportamento OpenAI predefinito.
- `models.providers.*.models.*.compat.requiresStringContent`: suggerimento facoltativo di compatibilità per endpoint chat OpenAI-compatible solo stringa. Quando `true`, OpenClaw appiattisce gli array `messages[].content` di puro testo in stringhe semplici prima di inviare la richiesta.
- `plugins.entries.amazon-bedrock.config.discovery`: root delle impostazioni di auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: attiva/disattiva la discovery implicita.
- `plugins.entries.amazon-bedrock.config.discovery.region`: regione AWS per la discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro facoltativo provider-id per discovery mirata.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervallo di polling per l'aggiornamento della discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: finestra di contesto di fallback per i modelli scoperti.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token di output massimi di fallback per i modelli scoperti.

### Esempi di provider

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

Usa `cerebras/zai-glm-4.7` per Cerebras; `zai/glm-4.7` per Z.AI direct.

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

Imposta `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`). Usa riferimenti `opencode/...` per il catalogo Zen oppure riferimenti `opencode-go/...` per il catalogo Go. Scorciatoia: `openclaw onboard --auth-choice opencode-zen` oppure `openclaw onboard --auth-choice opencode-go`.

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

Imposta `ZAI_API_KEY`. `z.ai/*` e `z-ai/*` sono alias accettati. Scorciatoia: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint generale: `https://api.z.ai/api/paas/v4`
- Endpoint coding (predefinito): `https://api.z.ai/api/coding/paas/v4`
- Per l'endpoint generale, definisci un provider personalizzato con override di `baseUrl`.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
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
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Per l'endpoint China: `baseUrl: "https://api.moonshot.cn/v1"` oppure `openclaw onboard --auth-choice moonshot-api-key-cn`.

Gli endpoint Moonshot nativi pubblicizzano la compatibilità d'uso dello streaming sul trasporto condiviso
`openai-completions`, e OpenClaw la determina in base alle capacità dell'endpoint
piuttosto che al solo provider id built-in.

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

Compatibile con Anthropic, provider built-in. Scorciatoia: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (compatibile con Anthropic)">

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

L'URL base dovrebbe omettere `/v1` (il client Anthropic lo aggiunge). Scorciatoia: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

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

Imposta `MINIMAX_API_KEY`. Scorciatoie:
`openclaw onboard --auth-choice minimax-global-api` oppure
`openclaw onboard --auth-choice minimax-cn-api`.
Il catalogo modelli usa per impostazione predefinita solo M2.7.
Nel percorso di streaming compatibile con Anthropic, OpenClaw disabilita il thinking di MiniMax
per impostazione predefinita a meno che tu non imposti esplicitamente `thinking`. `/fast on` oppure
`params.fastMode: true` riscrive `MiniMax-M2.7` in
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelli locali (LM Studio)">

Vedi [Modelli locali](/it/gateway/local-models). In breve: esegui un grande modello locale tramite LM Studio Responses API su hardware serio; mantieni uniti i modelli hosted come fallback.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oppure stringa plain text
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist facoltativa solo per le Skills bundled (le Skills gestite/del workspace non sono interessate).
- `load.extraDirs`: root aggiuntive condivise per le Skills (precedenza più bassa).
- `install.preferBrew`: quando true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di ripiegare su altri tipi di installer.
- `install.nodeManager`: preferenza del gestore Node per le specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` disabilita una Skills anche se bundled/installata.
- `entries.<skillKey>.apiKey`: campo di convenienza per Skills che dichiarano una variabile env primaria (stringa plain text o oggetto SecretRef).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
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

- Caricati da `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, più `plugins.load.paths`.
- La discovery accetta plugin OpenClaw nativi più bundle Codex compatibili e bundle Claude, inclusi bundle Claude senza manifest con layout predefinito.
- **Le modifiche di configurazione richiedono il riavvio del Gateway.**
- `allow`: allowlist facoltativa (si caricano solo i plugin elencati). `deny` vince.
- `plugins.entries.<id>.apiKey`: campo di convenienza API key a livello plugin (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa di variabili env con ambito plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, il core blocca `before_prompt_build` e ignora i campi legacy che mutano il prompt da `before_agent_start`, preservando però i legacy `modelOverride` e `providerOverride`. Si applica agli hook dei plugin nativi e alle directory hook fornite dai bundle supportati.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente attendibile questo plugin per richiedere override `provider` e `model` per-esecuzione per esecuzioni in background di subagenti.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist facoltativa di target canonici `provider/model` per override affidabili dei subagenti. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (validato dallo schema del plugin OpenClaw nativo quando disponibile).
- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (accetta SecretRef). Usa come fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, il legacy `tools.web.fetch.firecrawl.apiKey` oppure la variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base API Firecrawl (predefinito: `https://api.firecrawl.dev`).
  - `onlyMainContent`: estrae solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scraping in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (es. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni Dreaming della Memory. Vedi [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: interruttore master Dreaming (predefinito `false`).
  - `frequency`: cadenza Cron per ogni sweep completa di Dreaming (predefinito `"0 3 * * *"`).
  - la policy di fase e le soglie sono dettagli di implementazione (non chiavi di configurazione esposte all'utente).
- La configurazione completa della Memory si trova in [Riferimento alla configurazione Memory](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin bundle Claude abilitati possono anche contribuire con valori predefiniti embedded Pi da `settings.json`; OpenClaw li applica come impostazioni agente sanificate, non come patch raw alla configurazione OpenClaw.
- `plugins.slots.memory`: scegli l'ID del plugin memory attivo, oppure `"none"` per disabilitare i plugin memory.
- `plugins.slots.contextEngine`: scegli l'ID del plugin context engine attivo; il valore predefinito è `"legacy"` a meno che tu non installi e selezioni un altro engine.
- `plugins.installs`: metadati di installazione gestiti dalla CLI usati da `openclaw plugins update`.
  - Include `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Tratta `plugins.installs.*` come stato gestito; preferisci i comandi CLI alle modifiche manuali.

Vedi [Plugin](/it/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in solo per accesso attendibile a reti private
      // allowPrivateNetwork: true, // alias legacy
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

- `evaluateEnabled: false` disabilita `act:evaluate` e `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato quando non impostato, quindi la navigazione del browser resta rigorosa per impostazione predefinita.
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando consideri intenzionalmente attendibile la navigazione browser su rete privata.
- In modalità strict, gli endpoint di profilo CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco della rete privata durante i controlli di raggiungibilità/discovery.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità strict, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo attach-only (start/stop/reset disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw scopra `/json/version`; usa WS(S)
  quando il provider ti fornisce un URL WebSocket DevTools diretto.
- I profili `existing-session` usano Chrome MCP invece di CDP e possono collegarsi
  sull'host selezionato o tramite un browser Node connesso.
- I profili `existing-session` possono impostare `userDataDir` per puntare a uno specifico
  profilo browser basato su Chromium come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti di route di Chrome MCP:
  azioni guidate da snapshot/ref invece del targeting tramite selettore CSS, hook per upload
  di un solo file, nessun override del timeout dei dialoghi, nessun `wait --load networkidle` e nessun
  `responsebody`, export PDF, intercettazione download o azioni batch.
- I profili locali gestiti `openclaw` assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  esplicitamente `cdpUrl` solo per CDP remoto.
- Ordine di auto-detect: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Servizio Control: solo loopback (porta derivata da `gateway.port`, predefinito `18791`).
- `extraArgs` aggiunge flag di avvio extra al bootstrap locale di Chromium (ad esempio
  `--disable-gpu`, dimensioni finestra o flag di debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, testo breve, URL immagine o data URI
    },
  },
}
```

- `seamColor`: colore di accento per il chrome UI dell'app nativa (tinta della bolla della modalità Talk, ecc.).
- `assistant`: override dell'identità della UI Control. Usa come fallback l'identità dell'agente attivo.

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
      // password: "your-password", // oppure OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // per mode=trusted-proxy; vedi /gateway/trusted-proxy-auth
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
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // pericoloso: consente URL embed esterni assoluti http(s)
      // allowedOrigins: ["https://control.example.com"], // richiesto per Control UI non-loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // pericolosa modalità fallback origin basata su header Host
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
    // Facoltativo. Predefinito false.
    allowRealIpFallback: false,
    tools: {
      // Deny HTTP aggiuntivi per /tools/invoke
      deny: ["browser"],
      // Rimuove strumenti dalla deny list HTTP predefinita
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

<Accordion title="Dettagli dei campi Gateway">

- `mode`: `local` (esegue il gateway) oppure `remote` (si connette a un gateway remoto). Il Gateway rifiuta di avviarsi se non è `local`.
- `port`: singola porta multiplexata per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) oppure `custom`.
- **Alias bind legacy**: usa i valori della modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` ascolta su `127.0.0.1` dentro il container. Con il networking bridge Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il gateway è irraggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Auth**: richiesta per impostazione predefinita. I bind non-loopback richiedono auth del gateway. In pratica significa un token/password condiviso oppure un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`. La procedura guidata di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi SecretRef), imposta esplicitamente `gateway.auth.mode` su `token` oppure `password`. L'avvio e i flussi di installazione/riparazione del servizio falliscono quando entrambi sono configurati e `mode` non è impostato.
- `gateway.auth.mode: "none"`: modalità esplicita senza auth. Usala solo per configurazioni attendibili locali su loopback; questa opzione intenzionalmente non viene proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'auth a un reverse proxy identity-aware e considera attendibili gli header identità da `gateway.trustedProxies` (vedi [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth)). Questa modalità si aspetta una sorgente proxy **non-loopback**; i reverse proxy loopback sullo stesso host non soddisfano l'auth trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, gli header identità di Tailscale Serve possono soddisfare l'auth di Control UI/WebSocket (verificata tramite `tailscale whois`). Gli endpoint API HTTP **non** usano questa auth con header Tailscale; seguono invece la normale modalità auth HTTP del gateway. Questo flusso senza token presume che l'host del gateway sia attendibile. Predefinito `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitatore facoltativo dei fallimenti di auth. Si applica per IP client e per scope auth (shared-secret e device-token sono tracciati separatamente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Nel percorso asincrono Tailscale Serve della Control UI, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura del fallimento. Tentativi concorrenti errati dallo stesso client possono quindi attivare il limitatore alla seconda richiesta invece che passare entrambi come semplici mismatch.
  - `gateway.auth.rateLimit.exemptLoopback` ha come predefinito `true`; imposta `false` quando vuoi intenzionalmente applicare il rate limiting anche al traffico localhost (per configurazioni di test o deployment proxy rigorosi).
- I tentativi di auth WS di origine browser vengono sempre limitati con esenzione loopback disabilitata (difesa in profondità contro brute force localhost basato su browser).
- Su loopback, quei lockout di origine browser sono isolati per valore `Origin`
  normalizzato, quindi fallimenti ripetuti da una origin localhost non bloccano automaticamente
  un'altra origin.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) oppure `funnel` (pubblico, richiede auth).
- `controlUi.allowedOrigins`: allowlist esplicita delle origin browser per le connessioni WebSocket del Gateway. Richiesta quando ci si aspettano client browser da origin non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback origin basato su header Host per deployment che fanno affidamento intenzionale sulla policy origin basata su Host header.
- `remote.transport`: `ssh` (predefinito) oppure `direct` (ws/wss). Per `direct`, `remote.url` deve essere `ws://` oppure `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass lato client che consente `ws://` in chiaro verso IP attendibili di rete privata; il predefinito resta solo loopback per plaintext.
- `gateway.remote.token` / `.password` sono campi credenziali del client remoto. Non configurano da soli l'auth del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base del relay APNs esterno usato dalle build iOS ufficiali/TestFlight dopo che pubblicano registrazioni supportate da relay al gateway. Questo URL deve corrispondere all'URL relay compilato nella build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout di invio gateway-to-relay in millisecondi. Predefinito `10000`.
- Le registrazioni supportate da relay vengono delegate a una specifica identità gateway. L'app iOS associata recupera `gateway.identity.get`, include quell'identità nella registrazione relay e inoltra al gateway un grant di invio con ambito registrazione. Un altro gateway non può riutilizzare quella registrazione memorizzata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch solo sviluppo per URL relay HTTP loopback. Gli URL relay di produzione dovrebbero restare su HTTPS.
- `gateway.channelHealthCheckMinutes`: intervallo del monitor di salute del canale in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitor di salute. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia socket obsoleta in minuti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: massimo numero di riavvii del monitor di salute per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per-canale dai riavvii del monitor di salute mantenendo abilitato il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per-account per canali multi-account. Quando impostato, ha la precedenza sull'override a livello canale.
- I percorsi di chiamata del gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è esplicitamente configurato tramite SecretRef e non risolto, la risoluzione fallisce in modalità fail-closed (nessun fallback remoto che mascheri il problema).
- `trustedProxies`: IP dei reverse proxy che terminano TLS o iniettano header forwarded-client. Elenca solo proxy che controlli. Le voci loopback sono comunque valide per configurazioni same-host proxy/rilevamento locale (ad esempio Tailscale Serve o un reverse proxy locale), ma **non** rendono le richieste loopback idonee per `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, il gateway accetta `X-Real-IP` se `X-Forwarded-For` manca. Predefinito `false` per comportamento fail-closed.
- `gateway.tools.deny`: nomi di strumenti extra bloccati per HTTP `POST /tools/invoke` (estende la deny list predefinita).
- `gateway.tools.allow`: rimuove nomi di strumenti dalla deny list HTTP predefinita.

</Accordion>

### Endpoint compatibili con OpenAI

- Chat Completions: disabilitato per impostazione predefinita. Abilitalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening dell'input URL di Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote vengono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero tramite URL.
- Header facoltativo di hardening della risposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (impostalo solo per origin HTTPS che controlli; vedi [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multi-instance

Esegui più gateway su un host con porte e state dir unici:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag di utilità: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Vedi [Gateway multipli](/it/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: abilita la terminazione TLS sul listener del gateway (HTTPS/WSS) (predefinito: `false`).
- `autoGenerate`: genera automaticamente una coppia cert/key self-signed locale quando non sono configurati file espliciti; solo per uso locale/dev.
- `certPath`: percorso filesystem del file certificato TLS.
- `keyPath`: percorso filesystem della chiave privata TLS; mantienilo con permessi limitati.
- `caPath`: percorso facoltativo del bundle CA per verifica client o catene di trust personalizzate.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: controlla come vengono applicate le modifiche di configurazione a runtime.
  - `"off"`: ignora le modifiche live; i cambiamenti richiedono un riavvio esplicito.
  - `"restart"`: riavvia sempre il processo gateway in caso di cambiamento di configurazione.
  - `"hot"`: applica le modifiche in-process senza riavviare.
  - `"hybrid"` (predefinito): prova prima l'hot reload; usa come fallback il riavvio se necessario.
- `debounceMs`: finestra di debounce in ms prima che vengano applicate le modifiche di configurazione (intero non negativo).
- `deferralTimeoutMs`: tempo massimo in ms per attendere le operazioni in corso prima di forzare un riavvio (predefinito: `300000` = 5 minuti).

---

## Hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "Da: {{messages[0].from}}\nOggetto: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` oppure `x-openclaw-token: <token>`.
I token hook nella query string vengono rifiutati.

Note su validazione e sicurezza:

- `hooks.enabled=true` richiede un `hooks.token` non vuoto.
- `hooks.token` deve essere **distinto** da `gateway.auth.token`; il riuso del token Gateway viene rifiutato.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (ad esempio `["hook:"]`).
- Se una mapping o un preset usa un `sessionKey` con template, imposta `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Le chiavi statiche delle mapping non richiedono quell'opt-in.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`
  - I valori `sessionKey` delle mapping renderizzati tramite template vengono trattati come forniti esternamente e richiedono anch'essi `hooks.allowRequestSessionKey=true`.

<Accordion title="Dettagli delle mapping">

- `match.path` corrisponde al sottopercorso dopo `/hooks` (es. `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per percorsi generici.
- I template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione hook.
  - `transform.module` deve essere un percorso relativo e rimanere entro `hooks.transformsDir` (i percorsi assoluti e il traversal vengono rifiutati).
- `agentId` instrada verso un agente specifico; gli ID sconosciuti usano come fallback quello predefinito.
- `allowedAgentIds`: limita l'instradamento esplicito (`*` o omesso = consenti tutti, `[]` = nega tutti).
- `defaultSessionKey`: chiave sessione fissa facoltativa per esecuzioni hook agent senza `sessionKey` esplicito.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` e alle chiavi sessione delle mapping guidate da template di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist facoltativa di prefissi per i valori `sessionKey` espliciti (request + mapping), ad esempio `["hook:"]`. Diventa obbligatoria quando una qualunque mapping o preset usa un `sessionKey` con template.
- `deliver: true` invia la risposta finale a un canale; `channel` ha come predefinito `last`.
- `model` sovrascrive l'LLM per questa esecuzione hook (deve essere consentito se è impostato il catalogo modelli).

</Accordion>

### Integrazione Gmail

- Il preset Gmail built-in usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se mantieni quell'instradamento per-messaggio, imposta `hooks.allowRequestSessionKey: true` e limita `hooks.allowedSessionKeyPrefixes` affinché corrispondano al namespace Gmail, ad esempio `["hook:", "hook:gmail:"]`.
- Se hai bisogno di `hooks.allowRequestSessionKey: false`, sovrascrivi il preset con un `sessionKey` statico invece del valore predefinito con template.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Il Gateway avvia automaticamente `gog gmail watch serve` all'avvio quando configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitarlo.
- Non eseguire un `gog gmail watch serve` separato insieme al Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // oppure OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS modificabili dall'agente e A2UI via HTTP sotto la porta del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo locale: mantieni `gateway.bind: "loopback"` (predefinito).
- Bind non-loopback: le route canvas richiedono auth Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- I WebView Node in genere non inviano header auth; dopo che un Node è stato associato e connesso, il Gateway pubblicizza capability URL con ambito Node per l'accesso canvas/A2UI.
- Le capability URL sono associate alla sessione WS Node attiva e scadono rapidamente. Non viene usato fallback basato su IP.
- Inietta il client live-reload nell'HTML servito.
- Crea automaticamente un file iniziale `index.html` quando è vuoto.
- Serve anche A2UI a `/__openclaw__/a2ui/`.
- I cambiamenti richiedono il riavvio del Gateway.
- Disabilita il live reload per directory grandi o errori `EMFILE`.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (predefinito): omette `cliPath` + `sshPort` dai record TXT.
- `full`: include `cliPath` + `sshPort`.
- L'hostname ha come predefinito `openclaw`. Sovrascrivilo con `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast sotto `~/.openclaw/dns/`. Per la discovery cross-network, abbinala a un server DNS (CoreDNS consigliato) + split DNS Tailscale.

Configurazione: `openclaw dns setup --apply`.

---

## Ambiente

### `env` (variabili env inline)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Le variabili env inline vengono applicate solo se l'env del processo non contiene già la chiave.
- File `.env`: `.env` della CWD + `~/.openclaw/.env` (nessuno dei due sovrascrive variabili esistenti).
- `shellEnv`: importa le chiavi attese mancanti dal profilo della tua shell di login.
- Vedi [Ambiente](/it/help/environment) per la precedenza completa.

### Sostituzione delle variabili env

Fai riferimento a variabili env in qualsiasi stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Corrispondono solo nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`.
- Variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Esegui l'escape con `$${VAR}` per un `${VAR}` letterale.
- Funziona con `$include`.

---

## Segreti

I SecretRef sono additivi: i valori plain text continuano a funzionare.

### `SecretRef`

Usa questa forma oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validazione:

- pattern `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- pattern `id` per `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` `id`: puntatore JSON assoluto (ad esempio `"/providers/openai/apiKey"`)
- pattern `id` per `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Gli `id` con `source: "exec"` non devono contenere segmenti di percorso slash-delimited `.` o `..` (ad esempio `a/../b` viene rifiutato)

### Superficie credenziali supportata

- Matrice canonica: [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface)
- `secrets apply` punta ai percorsi credenziali supportati in `openclaw.json`.
- I ref di `auth-profiles.json` sono inclusi nella risoluzione runtime e nella copertura audit.

### Configurazione dei provider segreti

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // provider env esplicito facoltativo
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Note:

- Il provider `file` supporta `mode: "json"` e `mode: "singleValue"` (`id` deve essere `"value"` in modalità singleValue).
- Il provider `exec` richiede un percorso `command` assoluto e usa payload di protocollo su stdin/stdout.
- Per impostazione predefinita, i percorsi comando symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire percorsi symlink validando comunque il percorso target risolto.
- Se `trustedDirs` è configurato, il controllo delle directory attendibili si applica al percorso target risolto.
- L'ambiente figlio `exec` è minimo per impostazione predefinita; passa esplicitamente le variabili richieste con `passEnv`.
- I SecretRef vengono risolti al momento dell'attivazione in uno snapshot in memoria, poi i percorsi di richiesta leggono solo dallo snapshot.
- Il filtraggio della superficie attiva si applica durante l'attivazione: i ref non risolti su superfici abilitate fanno fallire avvio/reload, mentre le superfici inattive vengono saltate con diagnostica.

---

## Archiviazione auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- I profili per-agente sono archiviati in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` supporta ref a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per modalità credenziali statiche.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali auth-profile supportate da SecretRef.
- Le credenziali runtime statiche provengono da snapshot risolti in memoria; le voci statiche legacy di `auth.json` vengono ripulite quando rilevate.
- Import legacy OAuth da `~/.openclaw/credentials/oauth.json`.
- Vedi [OAuth](/it/concepts/oauth).
- Comportamento del runtime dei segreti e strumenti `audit/configure/apply`: [Gestione dei segreti](/it/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff base in ore quando un profilo fallisce per veri errori
  di fatturazione/credito insufficiente (predefinito: `5`). Testi espliciti di billing possono
  comunque finire qui anche su risposte `401`/`403`, ma i matcher testuali specifici del provider
  restano delimitati al provider che li possiede (ad esempio OpenRouter
  `Key limit exceeded`). I messaggi di finestra d'uso HTTP `402` ritentabili o
  di limite di spesa organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override facoltativi per-provider per le ore di backoff billing.
- `billingMaxHours`: limite massimo in ore per la crescita esponenziale del backoff billing (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff base in minuti per fallimenti `auth_permanent` ad alta confidenza (predefinito: `10`).
- `authPermanentMaxMinutes`: limite massimo in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: massimo numero di rotazioni auth-profile dello stesso provider per errori overloaded prima di passare al fallback del modello (predefinito: `1`). Forme di provider busy come `ModelNotReadyException` finiscono qui.
- `overloadedBackoffMs`: ritardo fisso prima di ritentare una rotazione provider/profile overloaded (predefinito: `0`).
- `rateLimitedProfileRotations`: massimo numero di rotazioni auth-profile dello stesso provider per errori rate-limit prima di passare al fallback del modello (predefinito: `1`). Quel bucket `rate_limit` include testo modellato dal provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- File di log predefinito: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Imposta `logging.file` per un percorso stabile.
- `consoleLevel` sale a `debug` con `--verbose`.
- `maxFileBytes`: dimensione massima del file di log in byte prima che le scritture vengano soppresse (intero positivo; predefinito: `524288000` = 500 MB). Usa rotazione log esterna per deployment di produzione.

---

## Diagnostica

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: interruttore master per l'output di strumentazione (predefinito: `true`).
- `flags`: array di stringhe flag che abilitano output di log mirati (supporta wildcard come `"telegram.*"` oppure `"*"`).
- `stuckSessionWarnMs`: soglia di età in ms per emettere avvisi di sessione bloccata mentre una sessione resta nello stato di elaborazione.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`).
- `otel.endpoint`: URL del collector per l'esportazione OTel.
- `otel.protocol`: `"http/protobuf"` (predefinito) oppure `"grpc"`.
- `otel.headers`: header metadata HTTP/gRPC extra inviati con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilitano l'esportazione di trace, metriche o log.
- `otel.sampleRate`: frequenza di campionamento trace `0`–`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `cacheTrace.enabled`: registra snapshot di cache trace per esecuzioni embedded (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per il JSONL cache trace (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa viene incluso nell'output cache trace (tutti predefiniti: `true`).

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canale di rilascio per installazioni npm/git — `"stable"`, `"beta"` oppure `"dev"`.
- `checkOnStart`: controlla gli aggiornamenti npm all'avvio del gateway (predefinito: `true`).
- `auto.enabled`: abilita l'auto-update in background per le installazioni pacchetto (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell'auto-apply sul canale stable (predefinito: `6`; max: `168`).
- `auto.stableJitterHours`: finestra extra di distribuzione in ore per il canale stable (predefinito: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: frequenza in ore dei controlli sul canale beta (predefinito: `1`; max: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: gate globale della funzionalità ACP (predefinito: `false`).
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Imposta `false` per mantenere disponibili i comandi ACP bloccando però l'esecuzione.
- `backend`: ID backend runtime ACP predefinito (deve corrispondere a un plugin runtime ACP registrato).
- `defaultAgent`: ID agente ACP target di fallback quando gli spawn non specificano un target esplicito.
- `allowedAgents`: allowlist di ID agente consentiti per le sessioni runtime ACP; vuoto significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush idle in ms per il testo in streaming.
- `stream.maxChunkChars`: dimensione massima del blocco prima della suddivisione della proiezione del blocco in streaming.
- `stream.repeatSuppression`: sopprime righe ripetute di stato/tool per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` esegue streaming incrementale; `"final_only"` bufferizza fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi tool nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: massimo numero di caratteri di output dell'assistente proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: massimo numero di caratteri per le righe proiettate di stato/update ACP.
- `stream.tagVisibility`: record dai nomi dei tag a override booleani di visibilità per eventi in streaming.
- `runtime.ttlMinutes`: TTL idle in minuti per i worker di sessione ACP prima del cleanup idoneo.
- `runtime.installCommand`: comando di installazione facoltativo da eseguire durante il bootstrap di un ambiente runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controlla lo stile della tagline del banner:
  - `"random"` (predefinito): tagline rotanti divertenti/stagionali.
  - `"default"`: tagline neutra fissa (`All your chats, one OpenClaw.`).
  - `"off"`: nessun testo tagline (titolo/versione del banner restano mostrati).
- Per nascondere l'intero banner (non solo le tagline), imposta env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadati scritti dai flussi di configurazione guidata CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

Vedi i campi identity di `agents.list` sotto [Valori predefiniti degli agenti](#agent-defaults).

---

## Bridge (legacy, rimosso)

Le build correnti non includono più il bridge TCP. I Node si connettono tramite il WebSocket Gateway. Le chiavi `bridge.*` non fanno più parte dello schema di configurazione (la validazione fallisce finché non vengono rimosse; `openclaw doctor --fix` può eliminare le chiavi sconosciute).

<Accordion title="Configurazione bridge legacy (riferimento storico)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback deprecato per job memorizzati notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token facoltativo per auth webhook in uscita
    sessionRetention: "24h", // stringa di durata oppure false
    runLog: {
      maxBytes: "2mb", // predefinito 2_000_000 byte
      keepLines: 2000, // predefinito 2000
    },
  },
}
```

- `sessionRetention`: per quanto tempo mantenere le sessioni isolate completate delle esecuzioni Cron prima del pruning da `sessions.json`. Controlla anche il cleanup delle trascrizioni archiviate dei Cron eliminati. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: dimensione massima per file di log di esecuzione (`cron/runs/<jobId>.jsonl`) prima del pruning. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti conservate quando viene attivato il pruning del run-log. Predefinito: `2000`.
- `webhookToken`: bearer token usato per la consegna POST del webhook Cron (`delivery.mode = "webhook"`); se omesso non viene inviato alcun header auth.
- `webhook`: URL webhook legacy deprecato (http/https) usato solo per job memorizzati che hanno ancora `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: numero massimo di retry per job one-shot su errori transitori (predefinito: `3`; intervallo: `0`–`10`).
- `backoffMs`: array dei ritardi di backoff in ms per ciascun tentativo di retry (predefinito: `[30000, 60000, 300000]`; 1–10 voci).
- `retryOn`: tipi di errore che attivano i retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Ometti per ritentare tutti i tipi transitori.

Si applica solo ai job Cron one-shot. I job ricorrenti usano una gestione dei fallimenti separata.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: abilita gli avvisi di fallimento per i job Cron (predefinito: `false`).
- `after`: numero di fallimenti consecutivi prima che scatti un avviso (intero positivo, min: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso job (intero non negativo).
- `mode`: modalità di consegna — `"announce"` invia tramite messaggio di canale; `"webhook"` invia POST al webhook configurato.
- `accountId`: ID account o canale facoltativo per delimitare la consegna dell'avviso.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destinazione predefinita per le notifiche di fallimento Cron su tutti i job.
- `mode`: `"announce"` oppure `"webhook"`; il predefinito è `"announce"` quando esistono dati target sufficienti.
- `channel`: override del canale per la consegna announce. `"last"` riutilizza l'ultimo canale di consegna noto.
- `to`: target announce esplicito oppure URL webhook. Obbligatorio per la modalità webhook.
- `accountId`: override account facoltativo per la consegna.
- `delivery.failureDestination` per-job sovrascrive questo valore predefinito globale.
- Quando non è impostata né la destinazione globale né quella per-job del fallimento, i job che già consegnano tramite `announce` usano come fallback quel target announce primario in caso di errore.
- `delivery.failureDestination` è supportato solo per job `sessionTarget="isolated"` a meno che il `delivery.mode` primario del job sia `"webhook"`.

Vedi [Processi Cron](/it/automation/cron-jobs). Le esecuzioni Cron isolate vengono tracciate come [attività in background](/it/automation/tasks).

---

## Variabili template del modello media

Placeholder template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                      |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Corpo completo del messaggio in ingresso         |
| `{{RawBody}}`      | Corpo raw (senza wrapper cronologia/mittente)    |
| `{{BodyStripped}}` | Corpo con menzioni di gruppo rimosse             |
| `{{From}}`         | Identificatore del mittente                      |
| `{{To}}`           | Identificatore della destinazione                |
| `{{MessageSid}}`   | ID del messaggio di canale                       |
| `{{SessionId}}`    | UUID della sessione corrente                     |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione  |
| `{{MediaUrl}}`     | pseudo-URL del media in ingresso                 |
| `{{MediaPath}}`    | percorso locale del media                        |
| `{{MediaType}}`    | tipo di media (image/audio/document/…)           |
| `{{Transcript}}`   | trascrizione audio                               |
| `{{Prompt}}`       | prompt media risolto per le voci CLI             |
| `{{MaxChars}}`     | numero massimo di caratteri in output risolto per le voci CLI |
| `{{ChatType}}`     | `"direct"` oppure `"group"`                      |
| `{{GroupSubject}}` | oggetto del gruppo (best effort)                 |
| `{{GroupMembers}}` | anteprima membri del gruppo (best effort)        |
| `{{SenderName}}`   | nome visualizzato del mittente (best effort)     |
| `{{SenderE164}}`   | numero di telefono del mittente (best effort)    |
| `{{Provider}}`     | hint provider (whatsapp, telegram, discord, ecc.) |

---

## Include di configurazione (`$include`)

Suddividi la configurazione in più file:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamento di merge:**

- File singolo: sostituisce l'oggetto contenitore.
- Array di file: deep-merge in ordine (i successivi sovrascrivono i precedenti).
- Chiavi sibling: unite dopo gli include (sovrascrivono i valori inclusi).
- Include nidificati: fino a 10 livelli di profondità.
- Percorsi: risolti relativamente al file includente, ma devono restare dentro la directory di configurazione top-level (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo se si risolvono comunque entro quel confine.
- Le scritture di proprietà di OpenClaw che modificano una sola sezione top-level supportata da un include a file singolo scrivono direttamente in quel file incluso. Ad esempio, `plugins install` aggiorna `plugins: { $include: "./plugins.json5" }` in `plugins.json5` e lascia intatto `openclaw.json`.
- Gli include root, gli array di include e gli include con override sibling sono in sola lettura per le scritture di proprietà di OpenClaw; tali scritture falliscono in modalità fail-closed invece di appiattire la configurazione.
- Errori: messaggi chiari per file mancanti, errori di parsing e include circolari.

---

_Correlati: [Configurazione](/it/gateway/configuration) · [Esempi di configurazione](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_
