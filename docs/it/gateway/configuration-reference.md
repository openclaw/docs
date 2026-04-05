---
read_when:
    - Hai bisogno della semantica esatta o dei valori predefiniti dei campi di configurazione a livello di singolo campo
    - Stai convalidando blocchi di configurazione di canale, modello, gateway o strumenti
summary: Riferimento completo per ogni chiave di configurazione di OpenClaw, i valori predefiniti e le impostazioni dei canali
title: Riferimento della configurazione
x-i18n:
    generated_at: "2026-04-05T13:57:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c5d834a3c25363509e27701bb30d302782c7286a7df286c9be5978fc36e6a4e
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Riferimento della configurazione

Ogni campo disponibile in `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configurazione](/gateway/configuration).

Il formato della configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi — OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Ogni canale si avvia automaticamente quando esiste la relativa sezione di configurazione (a meno che `enabled: false`).

### Accesso DM e gruppi

Tutti i canali supportano criteri per i DM e criteri per i gruppi:

| Criterio DM         | Comportamento                                                   |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (predefinito) | I mittenti sconosciuti ricevono un codice di pairing monouso; il proprietario deve approvare |
| `allowlist`         | Solo i mittenti in `allowFrom` (o nell'archivio consentiti associato) |
| `open`              | Consente tutti i DM in entrata (richiede `allowFrom: ["*"]`)    |
| `disabled`          | Ignora tutti i DM in entrata                                    |

| Criterio di gruppo    | Comportamento                                           |
| --------------------- | ------------------------------------------------------- |
| `allowlist` (predefinito) | Solo i gruppi che corrispondono all'allowlist configurata |
| `open`                | Bypassa le allowlist dei gruppi (il vincolo della menzione si applica comunque) |
| `disabled`            | Blocca tutti i messaggi di gruppo/stanza                |

<Note>
`channels.defaults.groupPolicy` imposta il criterio predefinito quando `groupPolicy` di un provider non è impostato.
I codici di pairing scadono dopo 1 ora. Le richieste di pairing DM in sospeso sono limitate a **3 per canale**.
Se un blocco provider manca del tutto (`channels.<provider>` assente), a runtime il criterio di gruppo ricade su `allowlist` (fail-closed) con un avviso all'avvio.
</Note>

### Override del modello per canale

Usa `channels.modelByChannel` per fissare specifici ID di canale a un modello. I valori accettano `provider/model` o alias di modello configurati. La mappatura del canale si applica quando una sessione non ha già un override del modello (ad esempio impostato tramite `/model`).

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

### Valori predefiniti dei canali e heartbeat

Usa `channels.defaults` per il comportamento condiviso di criterio di gruppo e heartbeat tra i provider:

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

- `channels.defaults.groupPolicy`: criterio di gruppo di fallback quando `groupPolicy` a livello di provider non è impostato.
- `channels.defaults.contextVisibility`: modalità predefinita di visibilità del contesto supplementare per tutti i canali. Valori: `all` (predefinito, include tutto il contesto citato/thread/cronologia), `allowlist` (include solo il contesto di mittenti in allowlist), `allowlist_quote` (come allowlist ma mantiene il contesto esplicito di citazione/risposta). Override per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include gli stati sani dei canali nell'output dell'heartbeat.
- `channels.defaults.heartbeat.showAlerts`: include gli stati degradati/errore nell'output dell'heartbeat.
- `channels.defaults.heartbeat.useIndicator`: mostra un output heartbeat compatto in stile indicatore.

### WhatsApp

WhatsApp viene eseguito tramite il canale web del gateway (Baileys Web). Si avvia automaticamente quando esiste una sessione collegata.

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
- L'opzionale `channels.whatsapp.defaultAccount` sovrascrive quella selezione predefinita dell'account di fallback quando corrisponde a un ID account configurato.
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
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (predefinito: off; abilita esplicitamente per evitare limiti di frequenza delle modifiche alle anteprime)
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

- Token bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo file regolari; i symlink vengono rifiutati), con `TELEGRAM_BOT_TOKEN` come fallback per l'account predefinito.
- L'opzionale `channels.telegram.defaultAccount` sovrascrive la selezione predefinita dell'account quando corrisponde a un ID account configurato.
- Nelle configurazioni multi-account (2+ ID account), imposta un predefinito esplicito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) per evitare instradamento di fallback; `openclaw doctor` avvisa quando manca o non è valido.
- `configWrites: false` blocca le scritture di configurazione avviate da Telegram (migrazioni ID supergruppo, `/config set|unset`).
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano binding ACP persistenti per i topic del forum (usa il formato canonico `chatId:topic:topicId` in `match.peer.id`). La semantica dei campi è condivisa in [ACP Agents](/tools/acp-agents#channel-specific-settings).
- Le anteprime stream di Telegram usano `sendMessage` + `editMessageText` (funziona nelle chat dirette e di gruppo).
- Criterio di retry: vedi [Criterio di retry](/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
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
      replyToMode: "off", // off | first | all
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
      streaming: "off", // off | partial | block | progress (progress viene mappato a partial su Discord)
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
        spawnSubagentSessions: false, // opt-in per `sessions_spawn({ thread: true })`
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
- Le chiamate dirette in uscita che forniscono un `token` Discord esplicito usano quel token per la chiamata; le impostazioni di retry/criterio dell'account continuano comunque a provenire dall'account selezionato nello snapshot runtime attivo.
- L'opzionale `channels.discord.defaultAccount` sovrascrive la selezione predefinita dell'account quando corrisponde a un ID account configurato.
- Usa `user:<id>` (DM) o `channel:<id>` (canale guild) per i target di consegna; gli ID numerici nudi vengono rifiutati.
- Gli slug delle guild sono in minuscolo con gli spazi sostituiti da `-`; le chiavi dei canali usano il nome in forma slug (senza `#`). Preferisci gli ID guild.
- I messaggi creati dai bot vengono ignorati per impostazione predefinita. `allowBots: true` li abilita; usa `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i propri messaggi restano comunque filtrati).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e gli override del canale) scarta i messaggi che menzionano un altro utente o ruolo ma non il bot (escludendo @everyone/@here).
- `maxLinesPerMessage` (predefinito 17) divide i messaggi molto alti anche quando sono sotto i 2000 caratteri.
- `channels.discord.threadBindings` controlla l'instradamento vincolato ai thread di Discord:
  - `enabled`: override Discord per le funzioni di sessione vincolate ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/instradamento associati)
  - `idleHours`: override Discord per l'auto-unfocus da inattività in ore (`0` disabilita)
  - `maxAgeHours`: override Discord per l'età massima rigida in ore (`0` disabilita)
  - `spawnSubagentSessions`: interruttore opt-in per la creazione/associazione automatica dei thread di `sessions_spawn({ thread: true })`
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano binding ACP persistenti per canali e thread (usa l'id di canale/thread in `match.peer.id`). La semantica dei campi è condivisa in [ACP Agents](/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` imposta il colore di accento per i contenitori Discord components v2.
- `channels.discord.voice` abilita le conversazioni nei canali vocali Discord e gli override opzionali auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` vengono passati alle opzioni DAVE di `@discordjs/voice` (`true` e `24` per impostazione predefinita).
- OpenClaw inoltre tenta il recupero della ricezione vocale uscendo/rientrando in una sessione vocale dopo ripetuti errori di decrittazione.
- `channels.discord.streaming` è la chiave canonica per la modalità stream. Le legacy `streamMode` e i valori booleani `streaming` vengono migrati automaticamente.
- `channels.discord.autoPresence` mappa la disponibilità runtime sulla presenza del bot (healthy => online, degraded => idle, exhausted => dnd) e consente override opzionali del testo di stato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita il matching per nome/tag mutabile (modalità compatibilità break-glass).
- `channels.discord.execApprovals`: consegna nativa Discord delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare le richieste exec. Se omesso, usa `commands.ownerAllowFrom`.
  - `agentFilter`: allowlist facoltativa di ID agente. Ometti per inoltrare approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi per chiavi di sessione (substring o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito) invia ai DM degli approvatori, `"channel"` invia al canale di origine, `"both"` invia a entrambi. Quando il target include `"channel"`, i pulsanti sono utilizzabili solo dagli approvatori risolti.
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

- JSON dell'account di servizio: inline (`serviceAccount`) o da file (`serviceAccountFile`).
- È supportato anche SecretRef per l'account di servizio (`serviceAccountRef`).
- Fallback env: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` o `users/<userId>` per i target di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita il matching mutabile del principal email (modalità compatibilità break-glass).

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
      replyToMode: "off", // off | first | all
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
      streaming: "partial", // off | partial | block | progress (modalità anteprima)
      nativeStreaming: true, // usa l'API di streaming nativa di Slack quando streaming=partial
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

- **Socket mode** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` come fallback env dell'account predefinito).
- **HTTP mode** richiede `botToken` più `signingSecret` (alla radice o per account).
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  in chiaro o oggetti SecretRef.
- Gli snapshot degli account Slack espongono campi per sorgente/stato per credenziale come
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in HTTP mode,
  `signingSecretStatus`. `configured_unavailable` significa che l'account è
  configurato tramite SecretRef ma il percorso di comando/runtime corrente non ha
  potuto risolvere il valore del segreto.
- `configWrites: false` blocca le scritture di configurazione avviate da Slack.
- L'opzionale `channels.slack.defaultAccount` sovrascrive la selezione predefinita dell'account quando corrisponde a un ID account configurato.
- `channels.slack.streaming` è la chiave canonica della modalità stream. La legacy `streamMode` e i valori booleani `streaming` vengono migrati automaticamente.
- Usa `user:<id>` (DM) o `channel:<id>` per i target di consegna.

**Modalità di notifica delle reazioni:** `off`, `own` (predefinito), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento delle sessioni thread:** `thread.historyScope` è per-thread (predefinito) o condiviso a livello di canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread.

- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in entrata mentre è in corso una risposta, quindi la rimuove al completamento. Usa uno shortcode emoji di Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna nativa Slack delle approvazioni exec e autorizzazione degli approvatori. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` o `"both"`).

| Gruppo di azioni | Predefinito | Note                     |
| ---------------- | ----------- | ------------------------ |
| reactions        | abilitato   | Reagire + elencare reazioni |
| messages         | abilitato   | Leggere/inviare/modificare/eliminare |
| pins             | abilitato   | Fissare/rimuovere/elencare |
| memberInfo       | abilitato   | Informazioni sui membri  |
| emojiList        | abilitato   | Elenco emoji personalizzate |

### Mattermost

Mattermost è distribuito come plugin: `openclaw plugins install @openclaw/mattermost`.

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
        // URL esplicito facoltativo per deployment dietro reverse proxy/pubblici
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modalità chat: `oncall` (risponde su @-mention, predefinito), `onmessage` (ogni messaggio), `onchar` (messaggi che iniziano con un prefisso trigger).

Quando i comandi nativi di Mattermost sono abilitati:

- `commands.callbackPath` deve essere un percorso (ad esempio `/api/channels/mattermost/command`), non un URL completo.
- `commands.callbackUrl` deve risolversi all'endpoint gateway di OpenClaw ed essere raggiungibile dal server Mattermost.
- Le callback slash native sono autenticate con i token per-comando restituiti
  da Mattermost durante la registrazione del comando slash. Se la registrazione fallisce o nessun
  comando viene attivato, OpenClaw rifiuta le callback con
  `Unauthorized: invalid command token.`
- Per host di callback privati/tailnet/interni, Mattermost può richiedere
  che `ServiceSettings.AllowedUntrustedInternalConnections` includa l'host/dominio di callback.
  Usa valori host/dominio, non URL completi.
- `channels.mattermost.configWrites`: consente o nega le scritture di configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiede `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: override per canale del vincolo della menzione (`"*"` per il predefinito).
- L'opzionale `channels.mattermost.defaultAccount` sovrascrive la selezione predefinita dell'account quando corrisponde a un ID account configurato.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // associazione account facoltativa
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
- L'opzionale `channels.signal.defaultAccount` sovrascrive la selezione predefinita dell'account quando corrisponde a un ID account configurato.

### BlueBubbles

BlueBubbles è il percorso iMessage consigliato (basato su plugin, configurato sotto `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, percorso webhook, controlli gruppi e azioni avanzate:
      // vedi /channels/bluebubbles
    },
  },
}
```

- Percorsi chiave core trattati qui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- L'opzionale `channels.bluebubbles.defaultAccount` sovrascrive la selezione predefinita dell'account quando corrisponde a un ID account configurato.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare le conversazioni BlueBubbles a sessioni ACP persistenti. Usa un handle BlueBubbles o una stringa target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [ACP Agents](/tools/acp-agents#channel-specific-settings).
- La configurazione completa del canale BlueBubbles è documentata in [BlueBubbles](/it/channels/bluebubbles).

### iMessage

OpenClaw avvia `imsg rpc` (JSON-RPC su stdio). Non è richiesto alcun daemon o porta.

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

- L'opzionale `channels.imessage.defaultAccount` sovrascrive la selezione predefinita dell'account quando corrisponde a un ID account configurato.

- Richiede Accesso completo al disco per il database Messaggi.
- Preferisci target `chat_id:<id>`. Usa `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; imposta `remoteHost` (`host` o `user@host`) per il recupero allegati via SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in entrata (predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa il controllo rigoroso della chiave host, quindi assicurati che la chiave host del relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consente o nega le scritture di configurazione avviate da iMessage.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare conversazioni iMessage a sessioni ACP persistenti. Usa un handle normalizzato o un target chat esplicito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [ACP Agents](/tools/acp-agents#channel-specific-settings).

<Accordion title="Esempio di wrapper SSH per iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è supportato da extension ed è configurato sotto `channels.matrix`.

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

- L'autenticazione token usa `accessToken`; l'autenticazione password usa `userId` + `password`.
- `channels.matrix.proxy` instrada il traffico HTTP Matrix tramite un proxy HTTP(S) esplicito. Gli account nominati possono sovrascriverlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.allowPrivateNetwork` consente homeserver privati/interni. `proxy` e `allowPrivateNetwork` sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l'account preferito nelle configurazioni multi-account.
- `channels.matrix.execApprovals`: consegna nativa Matrix delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (es. `@owner:example.org`) autorizzati ad approvare le richieste exec.
  - `agentFilter`: allowlist facoltativa di ID agente. Ometti per inoltrare approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi per chiavi di sessione (substring o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito), `"channel"` (stanza di origine) o `"both"`.
  - Override per account: `channels.matrix.accounts.<id>.execApprovals`.
- Le probe di stato Matrix e le ricerche live nella directory usano lo stesso criterio proxy del traffico runtime.
- La configurazione completa di Matrix, le regole di targeting e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è supportato da extension ed è configurato sotto `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, criteri team/canale:
      // vedi /channels/msteams
    },
  },
}
```

- Percorsi chiave core trattati qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, webhook, criterio DM/gruppo, override per-team/per-canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è supportato da extension ed è configurato sotto `channels.irc`.

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
- L'opzionale `channels.irc.defaultAccount` sovrascrive la selezione predefinita dell'account quando corrisponde a un ID account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/allowlist/vincolo della menzione) è documentata in [IRC](/it/channels/irc).

### Multi-account (tutti i canali)

Esegui più account per canale (ognuno con il proprio `accountId`):

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
- Se aggiungi un account non predefinito tramite `openclaw channels add` (o onboarding del canale) mentre sei ancora su una configurazione canale single-account di primo livello, OpenClaw promuove prima i valori single-account di primo livello con ambito account nella mappa account del canale così l'account originale continua a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece preservare un target nominato/predefinito esistente corrispondente.
- I binding esistenti solo a livello di canale (senza `accountId`) continuano a corrispondere all'account predefinito; i binding con ambito account restano facoltativi.
- `openclaw doctor --fix` ripara anche forme miste spostando i valori single-account di primo livello con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può preservare un target nominato/predefinito esistente corrispondente.

### Altri canali extension

Molti canali extension sono configurati come `channels.<id>` e documentati nelle rispettive pagine dedicate (ad esempio Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Vedi l'indice completo dei canali: [Canali](/it/channels).

### Vincolo della menzione nelle chat di gruppo

I messaggi di gruppo richiedono per impostazione predefinita una **menzione obbligatoria** (metadati di menzione o pattern regex sicuri). Si applica a WhatsApp, Telegram, Discord, Google Chat e chat di gruppo iMessage.

**Tipi di menzione:**

- **Menzioni nei metadati**: @-mention native della piattaforma. Ignorate in modalità self-chat di WhatsApp.
- **Pattern di testo**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- Il vincolo della menzione viene applicato solo quando il rilevamento è possibile (menzioni native o almeno un pattern).

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

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono sovrascriverlo con `channels.<channel>.historyLimit` (o per-account). Imposta `0` per disabilitare.

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

Risoluzione: override per-DM → predefinito provider → nessun limite (tutto mantenuto).

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
    text: true, // analizza /commands nei messaggi chat
    bash: false, // consente ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // consente /config
    debug: false, // consente /debug
    restart: false, // consente /restart + strumento di riavvio gateway
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Dettagli dei comandi">

- I comandi testuali devono essere messaggi **standalone** con `/` iniziale.
- `native: "auto"` attiva i comandi nativi per Discord/Telegram, lascia Slack disattivato.
- Override per canale: `channels.discord.commands.native` (bool o `"auto"`). `false` cancella i comandi registrati in precedenza.
- `channels.telegram.customCommands` aggiunge voci extra al menu bot di Telegram.
- `bash: true` abilita `! <cmd>` per la shell host. Richiede `tools.elevated.enabled` e mittente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (letture/scritture di `openclaw.json`). Per i client gateway `chat.send`, le scritture persistenti `/config set|unset` richiedono anche `operator.admin`; la sola lettura `/config show` resta disponibile ai normali client operatore con ambito di scrittura.
- `channels.<provider>.configWrites` controlla le mutazioni di configurazione per canale (predefinito: true).
- Per i canali multi-account, `channels.<provider>.accounts.<id>.configWrites` controlla anche le scritture rivolte a quell'account (ad esempio `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` è per-provider. Quando impostato, è l'**unica** fonte di autorizzazione (allowlist/pairing del canale e `useAccessGroups` vengono ignorati).
- `useAccessGroups: false` consente ai comandi di bypassare i criteri access-group quando `allowFrom` non è impostato.

</Accordion>

---

## Valori predefiniti dell'agente

### `agents.defaults.workspace`

Predefinito: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Radice repository facoltativa mostrata nella riga Runtime del prompt di sistema. Se non impostata, OpenClaw la rileva automaticamente risalendo dal workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist predefinita facoltativa di Skills per agenti che non impostano
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i valori predefiniti
      { id: "locked-down", skills: [] }, // nessuna Skills
    ],
  },
}
```

- Ometti `agents.defaults.skills` per Skills senza restrizioni per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare i valori predefiniti.
- Imposta `agents.list[].skills: []` per nessuna Skills.
- Un elenco non vuoto `agents.list[].skills` è l'insieme finale per quell'agente; non viene unito ai valori predefiniti.

### `agents.defaults.skipBootstrap`

Disabilita la creazione automatica dei file bootstrap del workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

Numero massimo di caratteri per file bootstrap del workspace prima del troncamento. Predefinito: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Numero massimo totale di caratteri inseriti in tutti i file bootstrap del workspace. Predefinito: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controlla il testo di avviso visibile all'agente quando il contesto bootstrap viene troncato.
Predefinito: `"once"`.

- `"off"`: non inserire mai testo di avviso nel prompt di sistema.
- `"once"`: inserisce l'avviso una volta per ogni firma di troncamento univoca (consigliato).
- `"always"`: inserisce l'avviso a ogni esecuzione quando esiste troncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Dimensione massima in pixel del lato più lungo dell'immagine nei blocchi immagine di trascrizione/strumento prima delle chiamate al provider.
Predefinito: `1200`.

Valori più bassi di solito riducono l'uso di vision-token e la dimensione del payload della richiesta nelle esecuzioni ricche di screenshot.
Valori più alti preservano più dettaglio visivo.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso orario per il contesto del prompt di sistema (non per i timestamp dei messaggi). Ricade sul fuso orario dell'host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato ora nel prompt di sistema. Predefinito: `auto` (preferenza OS).

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
      params: { cacheRetention: "long" }, // parametri provider globali predefiniti
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

- `model`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - La forma stringa imposta solo il modello primario.
  - La forma oggetto imposta il primario più i modelli di failover ordinati.
- `imageModel`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - Usato dal percorso dello strumento `image` come configurazione del vision-model.
  - Usato anche come fallback di instradamento quando il modello selezionato/predefinito non può accettare input immagine.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione immagini e da qualsiasi futura superficie tool/plugin che generi immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione nativa di immagini Gemini, `fal/fal-ai/flux/dev` per fal oppure `openai/gpt-image-1` per OpenAI Images.
  - Se selezioni direttamente un provider/modello, configura anche la relativa autenticazione/provider API key (ad esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` per `openai/*`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di provider-id.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione video.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Impostalo esplicitamente prima di usare la generazione video condivisa. A differenza di `imageGenerationModel`, il runtime della generazione video non deduce ancora un provider predefinito.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/provider API key corrispondente.
  - Il provider bundled Qwen per la generazione video supporta attualmente fino a 1 video in uscita, 1 immagine in input, 4 video in input, durata di 10 secondi e opzioni a livello provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - Usato dallo strumento `pdf` per l'instradamento del modello.
  - Se omesso, lo strumento PDF ricade su `imageModel`, poi sul modello risolto della sessione/predefinito.
- `pdfMaxBytesMb`: limite dimensione PDF predefinito per lo strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo di pagine predefinito considerato dalla modalità di fallback per l'estrazione nello strumento `pdf`.
- `verboseDefault`: livello verbose predefinito per gli agenti. Valori: `"off"`, `"on"`, `"full"`. Predefinito: `"off"`.
- `elevatedDefault`: livello predefinito di output elevated per gli agenti. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Predefinito: `"on"`.
- `model.primary`: formato `provider/model` (es. `openai/gpt-5.4`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca configured-provider per quell'esatto model id e solo dopo ricade sul provider predefinito configurato (comportamento legacy deprecato di compatibilità, quindi preferisci `provider/model` esplicito). Se quel provider non espone più il modello predefinito configurato, OpenClaw ricade sul primo provider/modello configurato invece di mostrare un predefinito obsoleto di un provider rimosso.
- `models`: catalogo modelli configurato e allowlist per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifici del provider, ad esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parametri provider globali predefiniti applicati a tutti i modelli. Impostati in `agents.defaults.params` (es. `{ cacheRetention: "long" }`).
- Precedenza di merge di `params` (config): `agents.defaults.params` (base globale) viene sovrascritto da `agents.defaults.models["provider/model"].params` (per-modello), poi `agents.list[].params` (agent id corrispondente) sovrascrive per chiave. Vedi [Prompt Caching](/reference/prompt-caching) per i dettagli.
- Gli editor di configurazione che mutano questi campi (ad esempio `/models set`, `/models set-image` e i comandi aggiungi/rimuovi fallback) salvano la forma oggetto canonica e preservano gli elenchi fallback esistenti quando possibile.
- `maxConcurrent`: numero massimo di esecuzioni parallele dell'agente tra sessioni (ogni sessione resta comunque serializzata). Predefinito: 4.

**Scorciatoie alias built-in** (si applicano solo quando il modello è in `agents.defaults.models`):

| Alias               | Modello                                |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

I tuoi alias configurati hanno sempre la precedenza sui predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità thinking a meno che tu non imposti `--thinking off` o definisca tu stesso `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per impostazione predefinita per lo streaming delle chiamate agli strumenti. Imposta `agents.defaults.models["zai/<model>"].params.tool_stream` a `false` per disabilitarlo.
I modelli Anthropic Claude 4.6 usano per impostazione predefinita il thinking `adaptive` quando non è impostato un livello di thinking esplicito.

### `agents.defaults.cliBackends`

CLI backends facoltativi per esecuzioni di fallback solo testo (senza chiamate a strumenti). Utili come backup quando i provider API falliscono.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

- I CLI backends sono text-first; gli strumenti sono sempre disabilitati.
- Le sessioni sono supportate quando `sessionArg` è impostato.
- Il pass-through delle immagini è supportato quando `imageArg` accetta percorsi file.

### `agents.defaults.heartbeat`

Esecuzioni heartbeat periodiche.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disabilita
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // predefinito: false; true mantiene solo HEARTBEAT.md tra i file bootstrap del workspace
        isolatedSession: false, // predefinito: false; true esegue ogni heartbeat in una sessione nuova (senza cronologia della conversazione)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predefinito) | block
        target: "none", // predefinito: none | opzioni: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: stringa durata (ms/s/m/h). Predefinito: `30m` (autenticazione API-key) o `1h` (autenticazione OAuth). Imposta `0m` per disabilitare.
- `suppressToolErrorWarnings`: quando true, sopprime i payload di avviso per errori degli strumenti durante le esecuzioni heartbeat.
- `directPolicy`: criterio di consegna diretta/DM. `allow` (predefinito) consente la consegna diretta al target. `block` sopprime la consegna diretta al target ed emette `reason=dm-blocked`.
- `lightContext`: quando true, le esecuzioni heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` tra i file bootstrap del workspace.
- `isolatedSession`: quando true, ogni esecuzione heartbeat viene eseguita in una sessione nuova senza cronologia della conversazione precedente. Stesso schema di isolamento di `sessionTarget: "isolated"` per cron. Riduce il costo di token per heartbeat da ~100K a ~2-5K token.
- Per-agente: imposta `agents.list[].heartbeat`. Quando qualunque agente definisce `heartbeat`, **solo quegli agenti** eseguono heartbeat.
- Gli heartbeat eseguono turni completi dell'agente — intervalli più brevi consumano più token.

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
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // usato quando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disabilita il reinserimento
        model: "openrouter/anthropic/claude-sonnet-4-6", // override facoltativo del modello solo per la compattazione
        notifyUser: true, // invia un breve avviso quando la compattazione inizia (predefinito: false)
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

- `mode`: `default` o `safeguard` (riepilogo a blocchi per cronologie lunghe). Vedi [Compattazione](/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentiti per una singola operazione di compattazione prima che OpenClaw la interrompa. Predefinito: `900`.
- `identifierPolicy`: `strict` (predefinito), `off` o `custom`. `strict` antepone istruzioni integrate per la conservazione di identificatori opachi durante il riepilogo della compattazione.
- `identifierInstructions`: testo facoltativo personalizzato per la conservazione degli identificatori usato quando `identifierPolicy=custom`.
- `postCompactionSections`: nomi facoltativi di sezioni AGENTS.md H2/H3 da reinserire dopo la compattazione. Predefinito `["Session Startup", "Red Lines"]`; imposta `[]` per disabilitare il reinserimento. Quando non impostato o impostato esplicitamente a quella coppia predefinita, vengono accettati come fallback legacy anche i vecchi heading `Every Session`/`Safety`.
- `model`: override facoltativo `provider/model-id` solo per il riepilogo della compattazione. Usalo quando la sessione principale deve mantenere un modello ma i riepiloghi di compattazione devono essere eseguiti su un altro; se non impostato, la compattazione usa il modello primario della sessione.
- `notifyUser`: quando `true`, invia un breve avviso all'utente quando la compattazione inizia (ad esempio, "Compacting context..."). Disabilitato per impostazione predefinita per mantenere silenziosa la compattazione.
- `memoryFlush`: turno agentico silenzioso prima della compattazione automatica per memorizzare ricordi durevoli. Saltato quando il workspace è di sola lettura.

### `agents.defaults.contextPruning`

Riduce **vecchi risultati degli strumenti** dal contesto in memoria prima dell'invio all'LLM. **Non** modifica la cronologia della sessione su disco.

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
- `ttl` controlla con quale frequenza il pruning può essere eseguito di nuovo (dopo l'ultimo accesso alla cache).
- Il pruning riduce prima in modo soft i risultati degli strumenti troppo grandi, poi svuota completamente i risultati degli strumenti più vecchi se necessario.

**Soft-trim** mantiene inizio + fine e inserisce `...` al centro.

**Hard-clear** sostituisce l'intero risultato dello strumento con il placeholder.

Note:

- I blocchi immagine non vengono mai ridotti/svuotati.
- I rapporti sono basati sui caratteri (approssimativi), non su conteggi esatti di token.
- Se esistono meno di `keepLastAssistants` messaggi assistant, il pruning viene saltato.

</Accordion>

Vedi [Potatura delle sessioni](/concepts/session-pruning) per i dettagli sul comportamento.

### Streaming a blocchi

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

- I canali non Telegram richiedono `*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
- Override per canale: `channels.<channel>.blockStreamingCoalesce` (e varianti per-account). Signal/Slack/Discord/Google Chat usano per impostazione predefinita `minChars: 1500`.
- `humanDelay`: pausa casuale tra risposte a blocchi. `natural` = 800–2500ms. Override per-agente: `agents.list[].humanDelay`.

Vedi [Streaming](/concepts/streaming) per comportamento + dettagli del chunking.

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
- Override per sessione: `session.typingMode`, `session.typingIntervalSeconds`.

Vedi [Indicatori di digitazione](/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing facoltativo per l'agente incorporato. Vedi [Sandboxing](/gateway/sandboxing) per la guida completa.

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
          // Sono supportati anche SecretRefs / contenuti inline:
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
- `ssh`: runtime remoto generico basato su SSH
- `openshell`: runtime OpenShell

Quando è selezionato `backend: "openshell"`, le impostazioni specifiche del runtime si spostano in
`plugins.entries.openshell.config`.

**Configurazione backend SSH:**

- `target`: target SSH nel formato `user@host[:port]`
- `command`: comando client SSH (predefinito: `ssh`)
- `workspaceRoot`: radice remota assoluta usata per i workspace per-ambito
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti inline o SecretRefs che OpenClaw materializza in file temporanei a runtime
- `strictHostKeyChecking` / `updateHostKeys`: controlli del criterio di chiave host OpenSSH

**Precedenza autenticazione SSH:**

- `identityData` ha precedenza su `identityFile`
- `certificateData` ha precedenza su `certificateFile`
- `knownHostsData` ha precedenza su `knownHostsFile`
- I valori `*Data` supportati da SecretRef vengono risolti dallo snapshot runtime dei segreti attivo prima dell'avvio della sessione sandbox

**Comportamento backend SSH:**

- inizializza il workspace remoto una volta dopo la creazione o ricreazione
- poi mantiene canonico il workspace SSH remoto
- instrada `exec`, gli strumenti file e i percorsi media tramite SSH
- non sincronizza automaticamente sul host le modifiche remote
- non supporta contenitori browser nella sandbox

**Accesso al workspace:**

- `none`: workspace sandbox per-ambito sotto `~/.openclaw/sandboxes`
- `ro`: workspace sandbox in `/workspace`, workspace agente montato in sola lettura in `/agent`
- `rw`: workspace agente montato lettura/scrittura in `/workspace`

**Ambito:**

- `session`: contenitore + workspace per-sessione
- `agent`: un contenitore + workspace per agente (predefinito)
- `shared`: contenitore e workspace condivisi (nessun isolamento cross-sessione)

**Configurazione plugin OpenShell:**

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
          policy: "strict", // id criterio OpenShell facoltativo
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

- `mirror`: inizializza il remoto dal locale prima di exec, sincronizza di nuovo dopo exec; il workspace locale resta canonico
- `remote`: inizializza il remoto una volta quando la sandbox viene creata, poi mantiene canonico il workspace remoto

In modalità `remote`, le modifiche locali sull'host fatte fuori da OpenClaw non vengono sincronizzate automaticamente nella sandbox dopo il passaggio iniziale.
Il trasporto avviene via SSH nella sandbox OpenShell, ma il plugin possiede il ciclo di vita della sandbox e la sincronizzazione mirror facoltativa.

**`setupCommand`** viene eseguito una volta dopo la creazione del contenitore (tramite `sh -lc`). Richiede uscita di rete, root scrivibile, utente root.

**I contenitori usano per impostazione predefinita `network: "none"`** — imposta `"bridge"` (o una rete bridge personalizzata) se l'agente ha bisogno di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per impostazione predefinita a meno che tu non imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Gli allegati in entrata** vengono preparati in `media/inbound/*` nel workspace attivo.

**`docker.binds`** monta directory host aggiuntive; i bind globali e per-agente vengono uniti.

**Browser sandboxed** (`sandbox.browser.enabled`): Chromium + CDP in un contenitore. L'URL noVNC viene inserito nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L'accesso osservatore noVNC usa per impostazione predefinita l'autenticazione VNC e OpenClaw emette un URL con token a breve durata (invece di esporre la password nell'URL condiviso).

- `allowHostControl: false` (predefinito) blocca le sessioni sandboxed dal prendere di mira il browser host.
- `network` usa per impostazione predefinita `openclaw-sandbox-browser` (rete bridge dedicata). Imposta `bridge` solo quando vuoi esplicitamente connettività bridge globale.
- `cdpSourceRange` limita facoltativamente l'ingresso CDP al bordo del contenitore a un intervallo CIDR (ad esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive solo nel contenitore browser sandbox. Quando impostato (incluso `[]`), sostituisce `docker.binds` per il contenitore browser.
- I valori predefiniti di avvio sono definiti in `scripts/sandbox-browser-entrypoint.sh` e ottimizzati per host container:
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
  - `--disable-extensions` (abilitato per impostazione predefinita)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` sono
    abilitati per impostazione predefinita e possono essere disabilitati con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se l'uso di WebGL/3D lo richiede.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` riabilita le extension se il tuo workflow
    ne dipende.
  - `--renderer-process-limit=2` può essere modificato con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; imposta `0` per usare il
    limite di processi predefinito di Chromium.
  - più `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` è abilitato.
  - I predefiniti sono la baseline dell'immagine del contenitore; usa un'immagine browser personalizzata con un entrypoint personalizzato per cambiare i valori predefiniti del contenitore.

</Accordion>

Il browser sandboxing e `sandbox.docker.binds` attualmente sono solo Docker.

Crea le immagini:

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
        fastModeDefault: false, // override per-agente della fast mode
        params: { cacheRetention: "none" }, // sovrascrive per chiave i defaults.models.params corrispondenti
        skills: ["docs-search"], // sostituisce agents.defaults.skills quando impostato
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

- `id`: ID agente stabile (obbligatorio).
- `default`: quando più elementi sono impostati, vince il primo (viene registrato un avviso). Se nessuno è impostato, la voce predefinita è il primo elemento dell'elenco.
- `model`: la forma stringa sovrascrive solo `primary`; la forma oggetto `{ primary, fallbacks }` sovrascrive entrambi (`[]` disabilita i fallback globali). I job cron che sovrascrivono solo `primary` continuano comunque a ereditare i fallback predefiniti a meno che non imposti `fallbacks: []`.
- `params`: parametri stream per-agente uniti sopra la voce modello selezionata in `agents.defaults.models`. Usalo per override specifici dell'agente come `cacheRetention`, `temperature` o `maxTokens` senza duplicare l'intero catalogo modelli.
- `skills`: allowlist facoltativa di Skills per-agente. Se omessa, l'agente eredita `agents.defaults.skills` quando impostato; un elenco esplicito sostituisce i predefiniti invece di unirsi, e `[]` significa nessuna Skills.
- `thinkingDefault`: valore predefinito facoltativo per-agente del livello di thinking (`off | minimal | low | medium | high | xhigh | adaptive`). Sovrascrive `agents.defaults.thinkingDefault` per questo agente quando non è impostato alcun override per-messaggio o per-sessione.
- `reasoningDefault`: valore predefinito facoltativo per-agente della visibilità del reasoning (`on | off | stream`). Si applica quando non è impostato alcun override di reasoning per-messaggio o per-sessione.
- `fastModeDefault`: valore predefinito facoltativo per-agente per la fast mode (`true | false`). Si applica quando non è impostato alcun override di fast-mode per-messaggio o per-sessione.
- `runtime`: descrittore runtime facoltativo per-agente. Usa `type: "acp"` con i valori predefiniti `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l'agente deve usare per impostazione predefinita sessioni ACP harness.
- `identity.avatar`: percorso relativo al workspace, URL `http(s)` o URI `data:`.
- `identity` deriva i predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: allowlist di ID agente per `sessions_spawn` (`["*"]` = qualunque; predefinito: solo lo stesso agente).
- Guardia di ereditarietà della sandbox: se la sessione richiedente è sandboxed, `sessions_spawn` rifiuta target che verrebbero eseguiti senza sandbox.
- `subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo; predefinito: false).

---

## Instradamento multi-agent

Esegui più agenti isolati all'interno di un unico Gateway. Vedi [Multi-Agent](/concepts/multi-agent).

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

- `type` (facoltativo): `route` per l'instradamento normale (tipo mancante = route), `acp` per binding persistenti delle conversazioni ACP.
- `match.channel` (obbligatorio)
- `match.accountId` (facoltativo; `*` = qualunque account; omesso = account predefinito)
- `match.peer` (facoltativo; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facoltativo; specifici del canale)
- `acp` (facoltativo; solo per voci `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordine di corrispondenza deterministico:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (esatto, senza peer/guild/team)
5. `match.accountId: "*"` (a livello di canale)
6. Agente predefinito

All'interno di ciascun livello, vince la prima voce `bindings` corrispondente.

Per le voci `type: "acp"`, OpenClaw risolve per identità esatta della conversazione (`match.channel` + account + `match.peer.id`) e non usa l'ordine dei livelli di route binding sopra.

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

<Accordion title="Strumenti + workspace di sola lettura">

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

Vedi [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) per i dettagli di precedenza.

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
    parentForkMaxTokens: 100000, // salta il fork del thread padre sopra questo conteggio token (0 disabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durata o false
      maxDiskBytes: "500mb", // hard budget facoltativo
      highWaterBytes: "400mb", // target di pulizia facoltativo
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // predefinito auto-unfocus da inattività in ore (`0` disabilita)
      maxAgeHours: 0, // predefinita età massima rigida in ore (`0` disabilita)
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

<Accordion title="Dettagli dei campi della sessione">

- **`scope`**: strategia base di raggruppamento delle sessioni per i contesti di chat di gruppo.
  - `per-sender` (predefinito): ogni mittente ottiene una sessione isolata all'interno di un contesto canale.
  - `global`: tutti i partecipanti in un contesto canale condividono una singola sessione (usalo solo quando il contesto condiviso è intenzionale).
- **`dmScope`**: come vengono raggruppati i DM.
  - `main`: tutti i DM condividono la sessione principale.
  - `per-peer`: isola per ID mittente tra i canali.
  - `per-channel-peer`: isola per canale + mittente (consigliato per inbox multiutente).
  - `per-account-channel-peer`: isola per account + canale + mittente (consigliato per multi-account).
- **`identityLinks`**: mappa gli ID canonici a peer con prefisso provider per la condivisione cross-channel delle sessioni.
- **`reset`**: criterio di reset primario. `daily` resetta a `atHour` in ora locale; `idle` resetta dopo `idleMinutes`. Quando entrambi sono configurati, prevale quello che scade per primo.
- **`resetByType`**: override per tipo (`direct`, `group`, `thread`). La legacy `dm` è accettata come alias di `direct`.
- **`parentForkMaxTokens`**: `totalTokens` massimo della sessione padre consentito quando si crea una sessione thread forked (predefinito `100000`).
  - Se `totalTokens` del padre è sopra questo valore, OpenClaw avvia una sessione thread nuova invece di ereditare la cronologia della trascrizione del padre.
  - Imposta `0` per disabilitare questa guardia e consentire sempre il fork dal padre.
- **`mainKey`**: campo legacy. Il runtime usa ora sempre `"main"` per il bucket principale delle chat dirette.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta reciproca tra agenti negli scambi agent-to-agent (intero, intervallo: `0`–`5`). `0` disabilita la catena ping-pong.
- **`sendPolicy`**: corrispondenza per `channel`, `chatType` (`direct|group|channel`, con alias legacy `dm`), `keyPrefix` o `rawKeyPrefix`. Vince il primo deny.
- **`maintenance`**: controlli di pulizia + retention dell'archivio sessioni.
  - `mode`: `warn` emette solo avvisi; `enforce` applica la pulizia.
  - `pruneAfter`: soglia di età per voci stale (predefinito `30d`).
  - `maxEntries`: numero massimo di voci in `sessions.json` (predefinito `500`).
  - `rotateBytes`: ruota `sessions.json` quando supera questa dimensione (predefinito `10mb`).
  - `resetArchiveRetention`: retention per gli archivi di trascrizione `*.reset.<timestamp>`. Predefinito uguale a `pruneAfter`; imposta `false` per disabilitare.
  - `maxDiskBytes`: budget disco facoltativo per la directory delle sessioni. In modalità `warn` registra avvisi; in modalità `enforce` rimuove prima gli artefatti/sessioni più vecchi.
  - `highWaterBytes`: target facoltativo dopo la pulizia del budget. Predefinito `80%` di `maxDiskBytes`.
- **`threadBindings`**: valori predefiniti globali per le funzioni di sessione vincolate ai thread.
  - `enabled`: interruttore master predefinito (i provider possono sovrascriverlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: valore predefinito di auto-unfocus da inattività in ore (`0` disabilita; i provider possono sovrascrivere)
  - `maxAgeHours`: valore predefinito di età massima rigida in ore (`0` disabilita; i provider possono sovrascrivere)

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

Risoluzione (vince il più specifico): account → canale → globale. `""` disabilita e arresta la cascata. `"auto"` deriva `[{identity.name}]`.

**Variabili template:**

| Variabile         | Descrizione               | Esempio                     |
| ----------------- | ------------------------- | --------------------------- |
| `{model}`         | Nome corto del modello    | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore completo del modello | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome provider             | `anthropic`                 |
| `{thinkingLevel}` | Livello di thinking corrente | `high`, `low`, `off`     |
| `{identity.name}` | Nome identity dell'agente | (uguale a `"auto"`)         |

Le variabili non distinguono tra maiuscole e minuscole. `{think}` è un alias di `{thinkingLevel}`.

### Ack reaction

- Predefinita all'`identity.emoji` dell'agente attivo, altrimenti `"👀"`. Imposta `""` per disabilitare.
- Override per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → fallback identity.
- Ambito: `group-mentions` (predefinito), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: rimuove l'ack dopo la risposta su Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: abilita le reaction di stato del ciclo di vita su Slack, Discord e Telegram.
  Su Slack e Discord, se non impostato mantiene abilitate le reaction di stato quando le ack reaction sono attive.
  Su Telegram, impostalo esplicitamente a `true` per abilitare le reaction di stato del ciclo di vita.

### Debounce in entrata

Raggruppa rapidi messaggi di testo provenienti dallo stesso mittente in un singolo turno dell'agente. I media/allegati vengono inoltrati immediatamente. I comandi di controllo bypassano il debouncing.

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

- `auto` controlla l'auto-TTS. `/tts off|always|inbound|tagged` sovrascrive per sessione.
- `summaryModel` sovrascrive `agents.defaults.model.primary` per il riepilogo automatico.
- `modelOverrides` è abilitato per impostazione predefinita; `modelOverrides.allowProvider` è predefinito `false` (opt-in).
- Le API key ricadono su `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- `openai.baseUrl` sovrascrive l'endpoint OpenAI TTS. L'ordine di risoluzione è config, poi `OPENAI_TTS_BASE_URL`, poi `https://api.openai.com/v1`.
- Quando `openai.baseUrl` punta a un endpoint non-OpenAI, OpenClaw lo tratta come un server TTS compatibile OpenAI e allenta la convalida di modello/voce.

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
- Le chiavi legacy piatte di Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sono solo per compatibilità e vengono migrate automaticamente in `talk.providers.<provider>`.
- Gli ID voce ricadono su `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` accetta stringhe in chiaro o oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna API key Talk.
- `providers.*.voiceAliases` consente alle direttive Talk di usare nomi amichevoli.
- `silenceTimeoutMs` controlla per quanto tempo la modalità Talk attende dopo il silenzio dell'utente prima di inviare la trascrizione. Se non impostato, mantiene la finestra di pausa predefinita della piattaforma (`700 ms su macOS e Android, 900 ms su iOS`).

---

## Strumenti

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima di `tools.allow`/`tools.deny`:

L'onboarding locale imposta per default le nuove configurazioni locali su `tools.profile: "coding"` quando non è impostato (i profili espliciti esistenti vengono preservati).

| Profilo     | Include                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `minimal`   | solo `session_status`                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                    |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                 |

### Gruppi di strumenti

| Gruppo             | Strumenti                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` è accettato come alias di `exec`)                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                   |
| `group:automation` | `cron`, `gateway`                                                                                                     |
| `group:messaging`  | `message`                                                                                                             |
| `group:nodes`      | `nodes`                                                                                                               |
| `group:agents`     | `agents_list`                                                                                                         |
| `group:media`      | `image`, `image_generate`, `tts`                                                                                      |
| `group:openclaw`   | Tutti gli strumenti built-in (esclude i plugin provider)                                                              |

### `tools.allow` / `tools.deny`

Criterio globale allow/deny per gli strumenti (deny vince). Case-insensitive, supporta wildcard `*`. Applicato anche quando la sandbox Docker è disattivata.

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
- `/elevated on|off|ask|full` memorizza lo stato per sessione; le direttive inline si applicano al singolo messaggio.
- L'`exec` elevated bypassa la sandbox e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando il target exec è `node`).

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

I controlli di sicurezza dei loop degli strumenti sono **disabilitati per impostazione predefinita**. Imposta `enabled: true` per attivare il rilevamento.
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

- `historySize`: cronologia massima delle chiamate agli strumenti mantenuta per l'analisi dei loop.
- `warningThreshold`: soglia di pattern ripetuti senza avanzamento per gli avvisi.
- `criticalThreshold`: soglia ripetuta più alta per bloccare loop critici.
- `globalCircuitBreakerThreshold`: soglia di arresto rigido per qualsiasi esecuzione senza avanzamento.
- `detectors.genericRepeat`: avvisa su chiamate ripetute stesso-strumento/stessi-argomenti.
- `detectors.knownPollNoProgress`: avvisa/blocca strumenti poll noti (`process.poll`, `command_status`, ecc.).
- `detectors.pingPong`: avvisa/blocca pattern alternati di coppie senza avanzamento.
- Se `warningThreshold >= criticalThreshold` o `criticalThreshold >= globalCircuitBreakerThreshold`, la convalida fallisce.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // o env BRAVE_API_KEY
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

Configura la comprensione dei media in entrata (immagine/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
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

- `provider`: id provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, ecc.)
- `model`: override del model id
- `profile` / `preferredProfile`: selezione profilo `auth-profiles.json`

**Voce CLI** (`type: "cli"`):

- `command`: eseguibile da lanciare
- `args`: argomenti template (supporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, ecc.)

**Campi comuni:**

- `capabilities`: elenco facoltativo (`image`, `audio`, `video`). Predefiniti: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per-voce.
- I fallimenti ricadono sulla voce successiva.

L'autenticazione provider segue l'ordine standard: `auth-profiles.json` → variabili env → `models.providers.*.apiKey`.

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

Controlla quali sessioni possono essere prese di mira dagli strumenti di sessione (`sessions_list`, `sessions_history`, `sessions_send`).

Predefinito: `tree` (sessione corrente + sessioni generate da essa, come i subagent).

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
- `tree`: sessione corrente + sessioni generate dalla sessione corrente (subagent).
- `agent`: qualunque sessione appartenente all'agent id corrente (può includere altri utenti se esegui sessioni per-mittente sotto lo stesso agent id).
- `all`: qualunque sessione. Il targeting cross-agent richiede comunque `tools.agentToAgent`.
- Clamp della sandbox: quando la sessione corrente è sandboxed e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilità viene forzata a `tree` anche se `tools.sessions.visibility="all"`.

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
- Gli input base64 vengono convalidati con controlli rigorosi su alfabeto/padding e una guardia di dimensione pre-decodifica.
- I permessi dei file sono `0700` per le directory e `0600` per i file.
- La pulizia segue il criterio `cleanup`: `delete` rimuove sempre gli allegati; `keep` li conserva solo quando `retainOnSessionKeep: true`.

### `tools.experimental`

Flag degli strumenti built-in sperimentali. Disattivati per impostazione predefinita, salvo quando si applica una regola di auto-enable specifica del runtime.

```json5
{
  tools: {
    experimental: {
      planTool: true, // abilita update_plan sperimentale
    },
  },
}
```

Note:

- `planTool`: abilita lo strumento strutturato `update_plan` per il tracciamento del lavoro non banale in più passaggi.
- Predefinito: `false` per i provider non-OpenAI. Le esecuzioni OpenAI e OpenAI Codex lo abilitano automaticamente.
- Quando è abilitato, il prompt di sistema aggiunge anche linee guida d'uso in modo che il modello lo usi solo per lavori sostanziali e mantenga al massimo un passaggio `in_progress`.

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

- `model`: modello predefinito per i sub-agent generati. Se omesso, i sub-agent ereditano il modello del chiamante.
- `allowAgents`: allowlist predefinita degli agent id target per `sessions_spawn` quando l'agente richiedente non imposta un proprio `subagents.allowAgents` (`["*"]` = qualunque; predefinito: solo lo stesso agente).
- `runTimeoutSeconds`: timeout predefinito (secondi) per `sessions_spawn` quando la chiamata allo strumento omette `runTimeoutSeconds`. `0` significa nessun timeout.
- Criterio strumenti per-subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

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
- Sovrascrivi la radice di configurazione dell'agente con `OPENCLAW_AGENT_DIR` (oppure `PI_CODING_AGENT_DIR`, alias legacy di variabile env).
- Precedenza di merge per provider ID corrispondenti:
  - I valori `baseUrl` non vuoti di `models.json` dell'agente hanno la precedenza.
  - I valori `apiKey` non vuoti dell'agente hanno la precedenza solo quando quel provider non è gestito da SecretRef nel contesto corrente di configurazione/auth-profile.
  - I valori `apiKey` del provider gestiti da SecretRef vengono aggiornati dai marker della sorgente (`ENV_VAR_NAME` per env ref, `secretref-managed` per file/exec ref) invece di persistere i segreti risolti.
  - I valori header del provider gestiti da SecretRef vengono aggiornati dai marker della sorgente (`secretref-env:ENV_VAR_NAME` per env ref, `secretref-managed` per file/exec ref).
  - `apiKey`/`baseUrl` dell'agente vuoti o mancanti ricadono su `models.providers` nella configurazione.
  - `contextWindow`/`maxTokens` del modello corrispondente usano il valore più alto tra la configurazione esplicita e i valori impliciti del catalogo.
  - `contextTokens` del modello corrispondente preserva un cap runtime esplicito quando presente; usalo per limitare il contesto effettivo senza modificare i metadati nativi del modello.
  - Usa `models.mode: "replace"` quando vuoi che la configurazione riscriva completamente `models.json`.
  - La persistenza dei marker è autorevole rispetto alla sorgente: i marker vengono scritti dallo snapshot di configurazione sorgente attivo (pre-risoluzione), non dai valori segreti risolti a runtime.

### Dettagli dei campi provider

- `models.mode`: comportamento del catalogo provider (`merge` o `replace`).
- `models.providers`: mappa provider personalizzati indicizzata per provider id.
- `models.providers.*.api`: adattatore di richiesta (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, ecc).
- `models.providers.*.apiKey`: credenziale provider (preferisci SecretRef/sostituzione env).
- `models.providers.*.auth`: strategia di autenticazione (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: per Ollama + `openai-completions`, inserisce `options.num_ctx` nelle richieste (predefinito: `true`).
- `models.providers.*.authHeader`: forza il trasporto della credenziale nell'header `Authorization` quando necessario.
- `models.providers.*.baseUrl`: URL base dell'API upstream.
- `models.providers.*.headers`: header statici extra per proxy/instradamento tenant.
- `models.providers.*.request`: override di trasporto per richieste HTTP del model-provider.
  - `request.headers`: header extra (uniti ai predefiniti del provider). I valori accettano SecretRef.
  - `request.auth`: override della strategia auth. Modalità: `"provider-default"` (usa l'autenticazione built-in del provider), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` facoltativo).
  - `request.proxy`: override del proxy HTTP. Modalità: `"env-proxy"` (usa variabili env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Entrambe le modalità accettano un sotto-oggetto `tls` facoltativo.
  - `request.tls`: override TLS per connessioni dirette. Campi: `ca`, `cert`, `key`, `passphrase` (tutti accettano SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: voci esplicite del catalogo modelli provider.
- `models.providers.*.models.*.contextWindow`: metadati della finestra di contesto nativa del modello.
- `models.providers.*.models.*.contextTokens`: cap runtime facoltativo del contesto. Usalo quando vuoi un budget di contesto effettivo più piccolo della `contextWindow` nativa del modello.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: hint di compatibilità facoltativo. Per `api: "openai-completions"` con `baseUrl` non nativo e non vuoto (host diverso da `api.openai.com`), OpenClaw lo forza a `false` a runtime. `baseUrl` vuoto/omesso mantiene il comportamento predefinito OpenAI.
- `plugins.entries.amazon-bedrock.config.discovery`: radice delle impostazioni di auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: attiva/disattiva il discovery implicito.
- `plugins.entries.amazon-bedrock.config.discovery.region`: regione AWS per il discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro facoltativo provider-id per discovery mirato.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervallo di polling per l'aggiornamento del discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: finestra di contesto di fallback per i modelli scoperti.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token massimi di output di fallback per i modelli scoperti.

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

Usa `cerebras/zai-glm-4.7` per Cerebras; `zai/glm-4.7` per Z.AI diretto.

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

Imposta `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`). Usa riferimenti `opencode/...` per il catalogo Zen oppure `opencode-go/...` per il catalogo Go. Scorciatoia: `openclaw onboard --auth-choice opencode-zen` oppure `openclaw onboard --auth-choice opencode-go`.

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
- Per l'endpoint generale, definisci un provider personalizzato con override del base URL.

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

Per l'endpoint Cina: `baseUrl: "https://api.moonshot.cn/v1"` oppure `openclaw onboard --auth-choice moonshot-api-key-cn`.

Gli endpoint Moonshot nativi pubblicizzano la compatibilità dell'uso in streaming sul trasporto condiviso
`openai-completions`, e OpenClaw ora si basa sulle capacità dell'endpoint
anziché sul solo provider id built-in.

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

<Accordion title="Synthetic (compatibile Anthropic)">

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

Il base URL deve omettere `/v1` (il client Anthropic lo aggiunge). Scorciatoia: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (diretto)">

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
Il catalogo modelli ora usa per impostazione predefinita solo M2.7.
Sul percorso di streaming compatibile Anthropic, OpenClaw disabilita per impostazione predefinita il thinking di MiniMax
a meno che tu non imposti esplicitamente `thinking`. `/fast on` o
`params.fastMode: true` riscrive `MiniMax-M2.7` in
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelli locali (LM Studio)">

Vedi [Modelli locali](/gateway/local-models). In breve: esegui un grande modello locale tramite l'API LM Studio Responses su hardware adeguato; mantieni i modelli hosted uniti per il fallback.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oppure stringa in chiaro
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist facoltativa solo per le Skills bundled (le Skills gestite/workspace non sono interessate).
- `load.extraDirs`: radici Skills condivise extra (precedenza più bassa).
- `install.preferBrew`: quando true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di ricadere su altri tipi di installer.
- `install.nodeManager`: preferenza del gestore node per gli spec `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` disabilita una Skills anche se bundled/installata.
- `entries.<skillKey>.apiKey`: campo di comodo per la API key di Skills che dichiarano una variabile env primaria (stringa in chiaro o oggetto SecretRef).

---

## Plugin

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

- Caricati da `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` e `plugins.load.paths`.
- Il discovery accetta plugin nativi OpenClaw oltre a bundle compatibili Codex e Claude, inclusi bundle Claude senza manifest con layout predefinito.
- **Le modifiche di configurazione richiedono un riavvio del gateway.**
- `allow`: allowlist facoltativa (vengono caricati solo i plugin elencati). `deny` ha la precedenza.
- `plugins.entries.<id>.apiKey`: campo di comodo a livello plugin per la API key (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa delle variabili env con ambito plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, il core blocca `before_prompt_build` e ignora i campi legacy di mutazione del prompt da `before_agent_start`, preservando comunque i legacy `modelOverride` e `providerOverride`. Si applica ai plugin hook nativi e alle directory hook fornite da bundle supportati.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente affidabile questo plugin per richiedere override per-esecuzione di `provider` e `model` per esecuzioni subagent in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist facoltativa dei target canonici `provider/model` per override trusted dei subagent. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (convalidato dallo schema del plugin nativo OpenClaw quando disponibile).
- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider Firecrawl per web-fetch.
  - `apiKey`: API key Firecrawl (accetta SecretRef). Ricade su `plugins.entries.firecrawl.config.webSearch.apiKey`, la legacy `tools.web.fetch.firecrawl.apiKey` o la variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base dell'API Firecrawl (predefinito: `https://api.firecrawl.dev`).
  - `onlyMainContent`: estrae solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout in secondi per la richiesta di scraping (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad esempio `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di memory dreaming (sperimentale). Vedi [Dreaming](/concepts/memory-dreaming) per modalità e soglie.
  - `mode`: preset di cadenza del dreaming (`"off"`, `"core"`, `"rem"`, `"deep"`). Predefinito: `"off"`.
  - `cron`: override facoltativo dell'espressione cron per la pianificazione del dreaming.
  - `timezone`: fuso orario per la valutazione della pianificazione (ricade su `agents.defaults.userTimezone`).
  - `limit`: numero massimo di candidati da promuovere per ciclo.
  - `minScore`: soglia minima del punteggio pesato per la promozione.
  - `minRecallCount`: soglia minima del conteggio di recall.
  - `minUniqueQueries`: soglia minima del numero di query distinte.
- I plugin bundle Claude abilitati possono anche contribuire con predefiniti embedded Pi da `settings.json`; OpenClaw li applica come impostazioni agente sanificate, non come patch grezze della configurazione OpenClaw.
- `plugins.slots.memory`: scegli l'id del plugin memory attivo, oppure `"none"` per disabilitare i plugin memory.
- `plugins.slots.contextEngine`: scegli l'id del plugin context engine attivo; il predefinito è `"legacy"` a meno che tu non installi e selezioni un altro engine.
- `plugins.installs`: metadati di installazione gestiti dalla CLI usati da `openclaw plugins update`.
  - Include `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Tratta `plugins.installs.*` come stato gestito; preferisci i comandi CLI alle modifiche manuali.

Vedi [Plugin](/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // modalità trusted-network predefinita
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` usa per impostazione predefinita `true` quando non impostato (modello trusted-network).
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` per una navigazione browser rigorosa solo-pubblica.
- In modalità rigorosa, gli endpoint di profilo CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco delle reti private durante i controlli di raggiungibilità/discovery.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo attach-only (start/stop/reset disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw rilevi `/json/version`; usa WS(S)
  quando il tuo provider ti fornisce direttamente un URL WebSocket DevTools.
- I profili `existing-session` sono solo host e usano Chrome MCP invece di CDP.
- I profili `existing-session` possono impostare `userDataDir` per puntare a uno specifico
  profilo browser basato su Chromium come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti del percorso Chrome MCP:
  azioni basate su snapshot/ref invece del targeting tramite selettori CSS, hook di upload a file singolo, nessun override del timeout delle finestre di dialogo, nessun `wait --load networkidle` e niente `responsebody`, esportazione PDF, intercettazione download o azioni batch.
- I profili locali gestiti `openclaw` assegnano automaticamente `cdpPort` e `cdpUrl`; imposta `cdpUrl` esplicitamente solo per CDP remoto.
- Ordine di auto-rilevamento: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag extra all'avvio locale di Chromium (ad esempio
  `--disable-gpu`, dimensione finestra o flag di debug).

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

- `seamColor`: colore di accento per il chrome UI dell'app nativa (tinta della bolla Talk Mode, ecc.).
- `assistant`: override dell'identità della Control UI. Ricade sull'identity dell'agente attivo.

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
      // allowedOrigins: ["https://control.example.com"], // richiesto per Control UI non loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modalità pericolosa di fallback dell'origine basata su header Host
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
      // Deny aggiuntivi per HTTP /tools/invoke
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

<Accordion title="Dettagli dei campi del gateway">

- `mode`: `local` (esegui gateway) o `remote` (connettiti a un gateway remoto). Il gateway rifiuta di avviarsi se non è `local`.
- `port`: singola porta multiplexed per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) o `custom`.
- **Alias bind legacy**: usa i valori della modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` ascolta su `127.0.0.1` all'interno del contenitore. Con il networking bridge Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il gateway non è raggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Auth**: richiesta per impostazione predefinita. I bind non loopback richiedono autenticazione gateway. In pratica significa un token/password condiviso o un reverse proxy con consapevolezza dell'identità con `gateway.auth.mode: "trusted-proxy"`. La procedura di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi SecretRefs), imposta esplicitamente `gateway.auth.mode` su `token` o `password`. L'avvio e i flussi di installazione/riparazione del servizio falliscono quando entrambi sono configurati e `mode` non è impostato.
- `gateway.auth.mode: "none"`: modalità esplicita senza autenticazione. Usala solo per configurazioni locali trusted su local loopback; intenzionalmente non viene proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'autenticazione a