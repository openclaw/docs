---
read_when:
    - Hai bisogno della semantica esatta della configurazione a livello di campo o dei valori predefiniti
    - Stai convalidando blocchi di configurazione di canale, modello, gateway o strumento
summary: Riferimento della configurazione del gateway per le chiavi principali di OpenClaw, i valori predefiniti e i link ai riferimenti dedicati dei sottosistemi
title: Riferimento della configurazione
x-i18n:
    generated_at: "2026-04-10T08:13:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6aa34e3a9096c4dabef26b9cdfda4bd7693e16da43a88c1641cfad8ba1ec237
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Riferimento della configurazione

Riferimento della configurazione principale per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configurazione](/it/gateway/configuration).

Questa pagina copre le principali superfici di configurazione di OpenClaw e rimanda ad altre pagine quando un sottosistema ha un proprio riferimento più approfondito. **Non** tenta di incorporare in linea in un'unica pagina ogni catalogo di comandi posseduto da canali/plugin o ogni impostazione approfondita di memoria/QMD.

Fonte del codice:

- `openclaw config schema` stampa lo JSON Schema live usato per la convalida e la Control UI, con i metadati bundled/plugin/channel uniti quando disponibili
- `config.schema.lookup` restituisce un singolo nodo dello schema con ambito di percorso per gli strumenti di approfondimento
- `pnpm config:docs:check` / `pnpm config:docs:gen` convalidano l'hash di baseline dei documenti di configurazione rispetto alla superficie attuale dello schema

Riferimenti approfonditi dedicati:

- [Riferimento della configurazione della memoria](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Comandi Slash](/it/tools/slash-commands) per il catalogo attuale dei comandi built-in + bundled
- pagine del canale/plugin proprietario per le superfici di comandi specifiche del canale

Il formato della configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi: OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Ogni canale si avvia automaticamente quando la sua sezione di configurazione esiste (a meno che `enabled: false`).

### Accesso DM e gruppi

Tutti i canali supportano criteri per i DM e criteri per i gruppi:

| Criterio DM         | Comportamento                                                  |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (default) | I mittenti sconosciuti ricevono un codice di pairing monouso; il proprietario deve approvare |
| `allowlist`         | Solo i mittenti in `allowFrom` (o nello store paired allow)    |
| `open`              | Consenti tutti i DM in ingresso (richiede `allowFrom: ["*"]`)  |
| `disabled`          | Ignora tutti i DM in ingresso                                  |

| Criterio gruppo       | Comportamento                                         |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (default) | Solo i gruppi che corrispondono alla allowlist configurata |
| `open`                | Bypassa le allowlist dei gruppi (il mention-gating si applica comunque) |
| `disabled`            | Blocca tutti i messaggi di gruppo/stanza              |

<Note>
`channels.defaults.groupPolicy` imposta il valore predefinito quando `groupPolicy` di un provider non è impostato.
I codici di pairing scadono dopo 1 ora. Le richieste di pairing DM in sospeso sono limitate a **3 per canale**.
Se un blocco provider manca completamente (`channels.<provider>` assente), il criterio di gruppo a runtime ricade su `allowlist` (fail-closed) con un avviso all'avvio.
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

Usa `channels.defaults` per il comportamento condiviso di group-policy e heartbeat tra i provider:

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

- `channels.defaults.groupPolicy`: criterio di gruppo di fallback quando un `groupPolicy` a livello di provider non è impostato.
- `channels.defaults.contextVisibility`: modalità predefinita di visibilità del contesto supplementare per tutti i canali. Valori: `all` (default, include tutto il contesto di citazioni/thread/cronologia), `allowlist` (include solo il contesto dai mittenti nella allowlist), `allowlist_quote` (come allowlist ma mantiene il contesto esplicito di citazione/risposta). Override per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include gli stati dei canali integri nell'output heartbeat.
- `channels.defaults.heartbeat.showAlerts`: include gli stati degradati/di errore nell'output heartbeat.
- `channels.defaults.heartbeat.useIndicator`: mostra un output heartbeat compatto in stile indicatore.

### WhatsApp

WhatsApp funziona tramite il canale web del gateway (Baileys Web). Si avvia automaticamente quando esiste una sessione collegata.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // doppia spunta blu (false in modalità self-chat)
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

- I comandi in uscita usano per default l'account `default` se presente; altrimenti il primo ID account configurato (ordinato).
- `channels.whatsapp.defaultAccount` facoltativo override quel fallback per la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- La directory di autenticazione legacy single-account di Baileys viene migrata da `openclaw doctor` in `whatsapp/default`.
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
              systemPrompt: "Rimani in tema.",
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
      streaming: "partial", // off | partial | block | progress (predefinito: off; abilita esplicitamente per evitare i limiti di frequenza delle modifiche alle anteprime)
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

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo file regolare; i symlink sono rifiutati), con `TELEGRAM_BOT_TOKEN` come fallback per l'account predefinito.
- `channels.telegram.defaultAccount` facoltativo override la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Nelle configurazioni multi-account (2+ ID account), imposta un default esplicito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) per evitare il routing di fallback; `openclaw doctor` avvisa quando manca o non è valido.
- `configWrites: false` blocca le scritture di configurazione avviate da Telegram (migrazioni degli ID dei supergroup, `/config set|unset`).
- Le voci `bindings[]` di livello superiore con `type: "acp"` configurano binding ACP persistenti per i topic del forum (usa il formato canonico `chatId:topic:topicId` in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).
- Le anteprime stream di Telegram usano `sendMessage` + `editMessageText` (funziona in chat dirette e di gruppo).
- Criterio di retry: vedi [Criterio di retry](/it/concepts/retry).

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
- Le chiamate dirette in uscita che forniscono un `token` Discord esplicito usano quel token per la chiamata; le impostazioni di retry/criterio dell'account provengono comunque dall'account selezionato nello snapshot runtime attivo.
- `channels.discord.defaultAccount` facoltativo override la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Usa `user:<id>` (DM) o `channel:<id>` (canale guild) per i target di consegna; gli ID numerici senza prefisso vengono rifiutati.
- Gli slug delle guild sono in minuscolo con gli spazi sostituiti da `-`; le chiavi dei canali usano il nome in formato slug (senza `#`). Preferisci gli ID delle guild.
- I messaggi creati dal bot vengono ignorati per default. `allowBots: true` li abilita; usa `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i propri messaggi restano comunque filtrati).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e gli override del canale) scarta i messaggi che menzionano un altro utente o ruolo ma non il bot (escludendo @everyone/@here).
- `maxLinesPerMessage` (predefinito 17) divide i messaggi lunghi in altezza anche quando restano sotto i 2000 caratteri.
- `channels.discord.threadBindings` controlla il routing associato ai thread Discord:
  - `enabled`: override Discord per le funzionalità di sessione associate ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/routing associati)
  - `idleHours`: override Discord per l'auto-unfocus per inattività in ore (`0` disabilita)
  - `maxAgeHours`: override Discord per l'età massima rigida in ore (`0` disabilita)
  - `spawnSubagentSessions`: interruttore opt-in per la creazione/associazione automatica dei thread con `sessions_spawn({ thread: true })`
- Le voci `bindings[]` di livello superiore con `type: "acp"` configurano binding ACP persistenti per canali e thread (usa l'ID del canale/thread in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` imposta il colore d'accento per i container Discord components v2.
- `channels.discord.voice` abilita le conversazioni nei canali vocali Discord e gli override facoltativi di auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` vengono passati a `@discordjs/voice` come opzioni DAVE (predefiniti `true` e `24`).
- Inoltre, OpenClaw tenta il recupero della ricezione vocale uscendo e rientrando in una sessione vocale dopo ripetuti errori di decrittazione.
- `channels.discord.streaming` è la chiave canonica per la modalità di streaming. I valori legacy `streamMode` e booleani `streaming` vengono migrati automaticamente.
- `channels.discord.autoPresence` mappa la disponibilità runtime alla presenza del bot (healthy => online, degraded => idle, exhausted => dnd) e consente override facoltativi del testo di stato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita la corrispondenza per nome/tag mutabili (modalità di compatibilità break-glass).
- `channels.discord.execApprovals`: consegna delle approvazioni exec nativa di Discord e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare le richieste exec. Se omesso, usa `commands.ownerAllowFrom` come fallback.
  - `agentFilter`: allowlist facoltativa degli ID agente. Omettila per inoltrare le approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi della chiave di sessione (sottostringa o regex).
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

- JSON dell'account di servizio: inline (`serviceAccount`) o basato su file (`serviceAccountFile`).
- È supportato anche SecretRef per l'account di servizio (`serviceAccountRef`).
- Fallback env: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` o `users/<userId>` per i target di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita la corrispondenza con il principal email mutabile (modalità di compatibilità break-glass).

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

- La **modalità Socket** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` per il fallback env dell'account predefinito).
- La **modalità HTTP** richiede `botToken` più `signingSecret` (alla radice o per account).
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe in chiaro o oggetti SecretRef.
- Gli snapshot degli account Slack espongono campi per-origine/per-stato delle credenziali come `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in modalità HTTP, `signingSecretStatus`. `configured_unavailable` significa che l'account è configurato tramite SecretRef ma il comando/percorso runtime corrente non ha potuto risolvere il valore del segreto.
- `configWrites: false` blocca le scritture di configurazione avviate da Slack.
- `channels.slack.defaultAccount` facoltativo override la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- `channels.slack.streaming.mode` è la chiave canonica per la modalità di streaming Slack. `channels.slack.streaming.nativeTransport` controlla il trasporto di streaming nativo di Slack. I valori legacy `streamMode`, booleani `streaming` e `nativeStreaming` vengono migrati automaticamente.
- Usa `user:<id>` (DM) o `channel:<id>` per i target di consegna.

**Modalità di notifica delle reazioni:** `off`, `own` (predefinito), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento della sessione thread:** `thread.historyScope` è per thread (predefinito) o condiviso nel canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread.

- Lo streaming nativo di Slack più lo stato thread in stile assistente Slack "is typing..." richiedono un target di risposta thread. I DM di livello superiore restano fuori thread per default, quindi usano `typingReaction` o la consegna normale invece dell'anteprima in stile thread.
- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre è in esecuzione una risposta, poi la rimuove al completamento. Usa uno shortcode emoji Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna delle approvazioni exec nativa di Slack e autorizzazione degli approvatori. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` o `"both"`).

| Gruppo di azioni | Predefinito | Note                    |
| ---------------- | ----------- | ----------------------- |
| reactions        | abilitato   | Reagire + elencare reazioni |
| messages         | abilitato   | Leggere/inviare/modificare/eliminare |
| pins             | abilitato   | Fissare/rimuovere/elencare |
| memberInfo       | abilitato   | Informazioni sui membri |
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
        // URL esplicito facoltativo per deployment reverse-proxy/pubblici
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modalità chat: `oncall` (risponde a @-mention, predefinito), `onmessage` (ogni messaggio), `onchar` (messaggi che iniziano con il prefisso trigger).

Quando i comandi nativi Mattermost sono abilitati:

- `commands.callbackPath` deve essere un percorso (ad esempio `/api/channels/mattermost/command`), non un URL completo.
- `commands.callbackUrl` deve risolvere verso l'endpoint del gateway OpenClaw ed essere raggiungibile dal server Mattermost.
- I callback slash nativi sono autenticati con i token per-comando restituiti da Mattermost durante la registrazione dei comandi slash. Se la registrazione fallisce o nessun comando viene attivato, OpenClaw rifiuta i callback con `Unauthorized: invalid command token.`
- Per host di callback privati/tailnet/interni, Mattermost potrebbe richiedere che `ServiceSettings.AllowedUntrustedInternalConnections` includa l'host/dominio del callback. Usa valori host/dominio, non URL completi.
- `channels.mattermost.configWrites`: consenti o nega le scritture di configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiedi `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: override per-canale del mention-gating (`"*"` per il default).
- `channels.mattermost.defaultAccount` facoltativo override la selezione dell'account predefinito quando corrisponde a un ID account configurato.

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

- `channels.signal.account`: fissa l'avvio del canale a una specifica identità account Signal.
- `channels.signal.configWrites`: consente o nega le scritture di configurazione avviate da Signal.
- `channels.signal.defaultAccount` facoltativo override la selezione dell'account predefinito quando corrisponde a un ID account configurato.

### BlueBubbles

BlueBubbles è il percorso iMessage consigliato (basato su plugin, configurato sotto `channels.bluebubbles`).

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

- Percorsi di chiavi core coperti qui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` facoltativo override la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Le voci `bindings[]` di livello superiore con `type: "acp"` possono associare conversazioni BlueBubbles a sessioni ACP persistenti. Usa un handle BlueBubbles o una stringa target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).
- La configurazione completa del canale BlueBubbles è documentata in [BlueBubbles](/it/channels/bluebubbles).

### iMessage

OpenClaw avvia `imsg rpc` (JSON-RPC su stdio). Non è richiesto alcun demone o porta.

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

- `channels.imessage.defaultAccount` facoltativo override la selezione dell'account predefinito quando corrisponde a un ID account configurato.

- Richiede l'accesso completo al disco per il DB di Messages.
- Preferisci target `chat_id:<id>`. Usa `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; imposta `remoteHost` (`host` o `user@host`) per il recupero degli allegati tramite SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in ingresso (predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa il controllo rigoroso della chiave host, quindi assicurati che la chiave host del relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consente o nega le scritture di configurazione avviate da iMessage.
- Le voci `bindings[]` di livello superiore con `type: "acp"` possono associare conversazioni iMessage a sessioni ACP persistenti. Usa un handle normalizzato o un target chat esplicito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).

<Accordion title="Esempio di wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è supportato da un'estensione ed è configurato sotto `channels.matrix`.

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

- L'autenticazione tramite token usa `accessToken`; l'autenticazione tramite password usa `userId` + `password`.
- `channels.matrix.proxy` instrada il traffico HTTP Matrix attraverso un proxy HTTP(S) esplicito. Gli account con nome possono overridearlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` consente homeserver privati/interni. `proxy` e questo opt-in di rete sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l'account preferito nelle configurazioni multi-account.
- `channels.matrix.autoJoin` ha come predefinito `off`, quindi le stanze invitate e i nuovi inviti in stile DM vengono ignorati finché non imposti `autoJoin: "allowlist"` con `autoJoinAllowlist` oppure `autoJoin: "always"`.
- `channels.matrix.execApprovals`: consegna delle approvazioni exec nativa di Matrix e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (ad esempio `@owner:example.org`) autorizzati ad approvare le richieste exec.
  - `agentFilter`: allowlist facoltativa degli ID agente. Omettila per inoltrare le approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi della chiave di sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito), `"channel"` (stanza di origine) o `"both"`.
  - Override per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controlla come i DM Matrix vengono raggruppati in sessioni: `per-user` (predefinito) condivide per peer instradato, mentre `per-room` isola ogni stanza DM.
- I probe di stato Matrix e le lookup live della directory usano lo stesso criterio proxy del traffico runtime.
- La configurazione completa di Matrix, le regole di targeting e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è supportato da un'estensione ed è configurato sotto `channels.msteams`.

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

- Percorsi di chiavi core coperti qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, webhook, criterio DM/gruppo, override per team/per canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è supportato da un'estensione ed è configurato sotto `channels.irc`.

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

- Percorsi di chiavi core coperti qui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` facoltativo override la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/allowlist/mention gating) è documentata in [IRC](/it/channels/irc).

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

- `default` viene usato quando `accountId` è omesso (CLI + routing).
- I token env si applicano solo all'account **default**.
- Le impostazioni del canale base si applicano a tutti gli account a meno che non vengano overrideate per account.
- Usa `bindings[].match.accountId` per instradare ogni account a un agente diverso.
- Se aggiungi un account non predefinito tramite `openclaw channels add` (o onboarding del canale) mentre sei ancora in una configurazione di canale top-level single-account, OpenClaw promuove prima i valori top-level single-account con ambito account nella mappa degli account del canale, così l'account originale continua a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece preservare un target con nome/default esistente corrispondente.
- I binding esistenti solo di canale (senza `accountId`) continuano a corrispondere all'account predefinito; i binding con ambito account restano facoltativi.
- `openclaw doctor --fix` ripara anche le forme miste spostando i valori top-level single-account con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può invece preservare un target con nome/default esistente corrispondente.

### Altri canali di estensione

Molti canali di estensione sono configurati come `channels.<id>` e documentati nelle rispettive pagine di canale dedicate (ad esempio Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Vedi l'indice completo dei canali: [Canali](/it/channels).

### Mention gating nelle chat di gruppo

Per default, i messaggi di gruppo **richiedono una mention** (mention nei metadati o pattern regex sicuri). Si applica alle chat di gruppo WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipi di mention:**

- **Mention nei metadati**: @-mention native della piattaforma. Ignorate in modalità self-chat di WhatsApp.
- **Pattern di testo**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- Il mention gating viene applicato solo quando il rilevamento è possibile (mention native o almeno un pattern).

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

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono overridearlo con `channels.<channel>.historyLimit` (o per account). Imposta `0` per disabilitare.

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

Risoluzione: override per DM → predefinito del provider → nessun limite (tutto mantenuto).

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
    native: "auto", // registra i comandi nativi quando supportati
    nativeSkills: "auto", // registra i comandi Skills nativi quando supportati
    text: true, // analizza i /comandi nei messaggi chat
    bash: false, // consenti ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // consenti /config
    mcp: false, // consenti /mcp
    plugins: false, // consenti /plugins
    debug: false, // consenti /debug
    restart: true, // consenti /restart + strumento di riavvio del gateway
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

- Questo blocco configura le superfici dei comandi. Per il catalogo attuale dei comandi built-in + bundled, vedi [Comandi Slash](/it/tools/slash-commands).
- Questa pagina è un **riferimento delle chiavi di configurazione**, non il catalogo completo dei comandi. I comandi posseduti da canali/plugin come QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` e Talk `/voice` sono documentati nelle rispettive pagine del canale/plugin e in [Comandi Slash](/it/tools/slash-commands).
- I comandi di testo devono essere messaggi **autonomi** con `/` iniziale.
- `native: "auto"` attiva i comandi nativi per Discord/Telegram e lascia Slack disattivato.
- `nativeSkills: "auto"` attiva i comandi Skills nativi per Discord/Telegram e lascia Slack disattivato.
- Override per canale: `channels.discord.commands.native` (bool o `"auto"`). `false` cancella i comandi registrati in precedenza.
- Override della registrazione delle Skills native per canale con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` aggiunge voci extra al menu del bot Telegram.
- `bash: true` abilita `! <cmd>` per la shell host. Richiede `tools.elevated.enabled` e il mittente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (legge/scrive `openclaw.json`). Per i client gateway `chat.send`, le scritture persistenti `/config set|unset` richiedono anche `operator.admin`; il `/config show` in sola lettura resta disponibile ai normali client operatore con ambito di scrittura.
- `mcp: true` abilita `/mcp` per la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`.
- `plugins: true` abilita `/plugins` per il rilevamento dei plugin, l'installazione e i controlli di abilitazione/disabilitazione.
- `channels.<provider>.configWrites` controlla le mutazioni di configurazione per canale (predefinito: true).
- Per i canali multi-account, `channels.<provider>.accounts.<id>.configWrites` controlla anche le scritture che hanno come target quell'account (ad esempio `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` disabilita `/restart` e le azioni dello strumento di riavvio del gateway. Predefinito: `true`.
- `ownerAllowFrom` è la allowlist esplicita del proprietario per comandi/strumenti riservati al proprietario. È separata da `allowFrom`.
- `ownerDisplay: "hash"` applica l'hash agli ID del proprietario nel prompt di sistema. Imposta `ownerDisplaySecret` per controllare l'hashing.
- `allowFrom` è per provider. Quando è impostato, è l'**unica** fonte di autorizzazione (le allowlist/pairing del canale e `useAccessGroups` vengono ignorati).
- `useAccessGroups: false` consente ai comandi di bypassare i criteri dei gruppi di accesso quando `allowFrom` non è impostato.
- Mappa della documentazione dei comandi:
  - catalogo built-in + bundled: [Comandi Slash](/it/tools/slash-commands)
  - superfici di comando specifiche del canale: [Canali](/it/channels)
  - comandi QQ Bot: [QQ Bot](/it/channels/qqbot)
  - comandi di pairing: [Pairing](/it/channels/pairing)
  - comando card di LINE: [LINE](/it/channels/line)
  - dreaming della memoria: [Dreaming](/it/concepts/dreaming)

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

Radice del repository facoltativa mostrata nella riga Runtime del prompt di sistema. Se non è impostata, OpenClaw la rileva automaticamente risalendo dalla workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist predefinita facoltativa delle Skills per gli agenti che non impostano
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

- Ometti `agents.defaults.skills` per avere Skills senza restrizioni per default.
- Ometti `agents.list[].skills` per ereditare i valori predefiniti.
- Imposta `agents.list[].skills: []` per non avere Skills.
- Un elenco `agents.list[].skills` non vuoto è l'insieme finale per quell'agente; non viene unito ai valori predefiniti.

### `agents.defaults.skipBootstrap`

Disabilita la creazione automatica dei file bootstrap della workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controlla quando i file bootstrap della workspace vengono iniettati nel prompt di sistema. Predefinito: `"always"`.

- `"continuation-skip"`: nei turni di continuazione sicuri (dopo una risposta completata dell'assistente) la reiniezione del bootstrap della workspace viene saltata, riducendo la dimensione del prompt. Le esecuzioni heartbeat e i retry dopo la compattazione ricostruiscono comunque il contesto.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Numero massimo di caratteri per file bootstrap della workspace prima del troncamento. Predefinito: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Numero massimo totale di caratteri iniettati in tutti i file bootstrap della workspace. Predefinito: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controlla il testo di avviso visibile all'agente quando il contesto bootstrap viene troncato.
Predefinito: `"once"`.

- `"off"`: non iniettare mai il testo di avviso nel prompt di sistema.
- `"once"`: inietta l'avviso una volta per ogni firma di troncamento univoca (consigliato).
- `"always"`: inietta l'avviso a ogni esecuzione quando esiste un troncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Dimensione massima in pixel del lato più lungo dell'immagine nei blocchi immagine di transcript/tool prima delle chiamate al provider.
Predefinito: `1200`.

Valori più bassi di solito riducono l'uso di vision token e la dimensione del payload della richiesta nelle esecuzioni con molti screenshot.
Valori più alti preservano più dettaglio visivo.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso orario per il contesto del prompt di sistema (non per i timestamp dei messaggi). Usa come fallback il fuso orario dell'host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato ora nel prompt di sistema. Predefinito: `auto` (preferenza del sistema operativo).

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
      params: { cacheRetention: "long" }, // parametri globali predefiniti del provider
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
  - Usato dal percorso dello strumento `image` come configurazione del suo modello vision.
  - Usato anche come routing di fallback quando il modello selezionato/predefinito non può accettare input immagine.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capability condivisa di generazione immagini e da qualsiasi futura superficie di strumenti/plugin che generi immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione immagini nativa di Gemini, `fal/fal-ai/flux/dev` per fal o `openai/gpt-image-1` per OpenAI Images.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/la chiave API del provider corrispondente (ad esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` per `openai/*`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di ID provider.
- `musicGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capability condivisa di generazione musicale e dallo strumento built-in `music_generate`.
  - Valori tipici: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.5+`.
  - Se omesso, `music_generate` può comunque dedurre un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione musicale registrati in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/la chiave API del provider corrispondente.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capability condivisa di generazione video e dallo strumento built-in `video_generate`.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Se omesso, `video_generate` può comunque dedurre un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione video registrati in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/la chiave API del provider corrispondente.
  - Il provider bundled di generazione video Qwen supporta fino a 1 video in output, 1 immagine in input, 4 video in input, 10 secondi di durata e opzioni a livello provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dallo strumento `pdf` per il routing del modello.
  - Se omesso, lo strumento PDF ricade su `imageModel`, poi sul modello risolto della sessione/predefinito.
- `pdfMaxBytesMb`: limite predefinito della dimensione PDF per lo strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo predefinito di pagine considerate dalla modalità fallback di estrazione nello strumento `pdf`.
- `verboseDefault`: livello verbose predefinito per gli agenti. Valori: `"off"`, `"on"`, `"full"`. Predefinito: `"off"`.
- `elevatedDefault`: livello predefinito di output elevated per gli agenti. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Predefinito: `"on"`.
- `model.primary`: formato `provider/model` (ad esempio `openai/gpt-5.4`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca del provider configurato per quell'esatto ID modello e solo dopo ricade sul provider predefinito configurato (comportamento di compatibilità deprecato, quindi preferisci `provider/model` esplicito). Se quel provider non espone più il modello predefinito configurato, OpenClaw ricade sul primo provider/modello configurato invece di mostrare un predefinito obsoleto di un provider rimosso.
- `models`: il catalogo dei modelli configurati e la allowlist per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifici del provider, ad esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parametri predefiniti globali del provider applicati a tutti i modelli. Impostali in `agents.defaults.params` (ad esempio `{ cacheRetention: "long" }`).
- Precedenza di merge di `params` (config): `agents.defaults.params` (base globale) viene sovrascritto da `agents.defaults.models["provider/model"].params` (per modello), poi `agents.list[].params` (ID agente corrispondente) sovrascrive per chiave. Vedi [Caching dei prompt](/it/reference/prompt-caching) per i dettagli.
- I writer di configurazione che modificano questi campi (ad esempio `/models set`, `/models set-image` e i comandi di aggiunta/rimozione fallback) salvano la forma oggetto canonica e preservano gli elenchi fallback esistenti quando possibile.
- `maxConcurrent`: numero massimo di esecuzioni parallele degli agenti tra le sessioni (ogni sessione resta comunque serializzata). Predefinito: 4.

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

Gli alias che configuri hanno sempre la precedenza sui valori predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità thinking a meno che tu non imposti `--thinking off` o definisca tu stesso `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per default per lo streaming delle chiamate agli strumenti. Imposta `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
I modelli Anthropic Claude 4.6 usano per default `adaptive` thinking quando non è impostato alcun livello di thinking esplicito.

### `agents.defaults.cliBackends`

CLI backend facoltativi per esecuzioni di fallback solo testo (senza chiamate agli strumenti). Utili come backup quando i provider API falliscono.

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

- I CLI backend sono orientati prima di tutto al testo; gli strumenti sono sempre disabilitati.
- Le sessioni sono supportate quando `sessionArg` è impostato.
- Il pass-through delle immagini è supportato quando `imageArg` accetta percorsi di file.

### `agents.defaults.systemPromptOverride`

Sostituisce l'intero prompt di sistema assemblato da OpenClaw con una stringa fissa. Impostalo a livello predefinito (`agents.defaults.systemPromptOverride`) o per agente (`agents.list[].systemPromptOverride`). I valori per agente hanno la precedenza; un valore vuoto o composto solo da spazi viene ignorato. Utile per esperimenti controllati sul prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "Sei un assistente utile.",
    },
  },
}
```

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
        includeSystemPromptSection: true, // predefinito: true; false omette la sezione Heartbeat dal prompt di sistema
        lightContext: false, // predefinito: false; true mantiene solo HEARTBEAT.md dai file bootstrap della workspace
        isolatedSession: false, // predefinito: false; true esegue ogni heartbeat in una sessione nuova (nessuna cronologia conversazione)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predefinito) | block
        target: "none", // predefinito: none | opzioni: last | whatsapp | telegram | discord | ...
        prompt: "Leggi HEARTBEAT.md se esiste...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: stringa durata (ms/s/m/h). Predefinito: `30m` (autenticazione tramite chiave API) o `1h` (autenticazione OAuth). Imposta `0m` per disabilitare.
- `includeSystemPromptSection`: quando false, omette la sezione Heartbeat dal prompt di sistema e salta l'iniezione di `HEARTBEAT.md` nel contesto bootstrap. Predefinito: `true`.
- `suppressToolErrorWarnings`: quando true, sopprime i payload di avviso di errore degli strumenti durante le esecuzioni heartbeat.
- `directPolicy`: criterio di consegna diretta/DM. `allow` (predefinito) consente la consegna diretta al target. `block` sopprime la consegna diretta al target ed emette `reason=dm-blocked`.
- `lightContext`: quando true, le esecuzioni heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file bootstrap della workspace.
- `isolatedSession`: quando true, ogni heartbeat viene eseguito in una sessione nuova senza cronologia conversazionale precedente. Stesso modello di isolamento di cron `sessionTarget: "isolated"`. Riduce il costo in token per heartbeat da ~100K a ~2-5K token.
- Per agente: imposta `agents.list[].heartbeat`. Quando un qualsiasi agente definisce `heartbeat`, **solo quegli agenti** eseguono heartbeat.
- Gli heartbeat eseguono turni completi dell'agente: intervalli più brevi consumano più token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id di un plugin provider di compaction registrato (facoltativo)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserva esattamente gli ID di deployment, gli ID ticket e le coppie host:port.", // usato quando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disabilita la reiniezione
        model: "openrouter/anthropic/claude-sonnet-4-6", // override facoltativo del modello solo per la compaction
        notifyUser: true, // invia un breve avviso quando inizia la compaction (predefinito: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "La sessione si avvicina alla compaction. Memorizza ora le memorie durevoli.",
          prompt: "Scrivi eventuali note durature in memory/YYYY-MM-DD.md; rispondi con il token silenzioso esatto NO_REPLY se non c'è nulla da memorizzare.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (riepilogo suddiviso in blocchi per cronologie lunghe). Vedi [Compaction](/it/concepts/compaction).
- `provider`: ID di un plugin provider di compaction registrato. Quando è impostato, viene chiamato `summarize()` del provider invece del riepilogo LLM built-in. In caso di errore, ricade sul built-in. Impostare un provider forza `mode: "safeguard"`. Vedi [Compaction](/it/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentiti per una singola operazione di compaction prima che OpenClaw la interrompa. Predefinito: `900`.
- `identifierPolicy`: `strict` (predefinito), `off` o `custom`. `strict` antepone una guida built-in per la conservazione di identificatori opachi durante il riepilogo della compaction.
- `identifierInstructions`: testo personalizzato facoltativo per la preservazione degli identificatori usato quando `identifierPolicy=custom`.
- `postCompactionSections`: nomi facoltativi delle sezioni H2/H3 di AGENTS.md da reiniettare dopo la compaction. Il valore predefinito è `["Session Startup", "Red Lines"]`; imposta `[]` per disabilitare la reiniezione. Quando non è impostato oppure è impostato esplicitamente a quella coppia predefinita, vengono accettate come fallback legacy anche le intestazioni precedenti `Every Session`/`Safety`.
- `model`: override facoltativo `provider/model-id` solo per il riepilogo della compaction. Usalo quando la sessione principale deve mantenere un modello ma i riepiloghi di compaction devono essere eseguiti con un altro; quando non è impostato, la compaction usa il modello primario della sessione.
- `notifyUser`: quando `true`, invia un breve avviso all'utente all'inizio della compaction (ad esempio, "Compattazione del contesto in corso..."). Disabilitato per default per mantenere la compaction silenziosa.
- `memoryFlush`: turno agentico silenzioso prima dell'auto-compaction per memorizzare ricordi durevoli. Viene saltato quando la workspace è in sola lettura.

### `agents.defaults.contextPruning`

Rimuove **i vecchi risultati degli strumenti** dal contesto in memoria prima di inviarlo al LLM. **Non** modifica la cronologia della sessione su disco.

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
        hardClear: { enabled: true, placeholder: "[Contenuto del vecchio risultato dello strumento cancellato]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamento della modalità cache-ttl">

- `mode: "cache-ttl"` abilita i passaggi di pruning.
- `ttl` controlla ogni quanto il pruning può essere eseguito di nuovo (dopo l'ultimo tocco della cache).
- Il pruning esegue prima il soft-trim dei risultati degli strumenti troppo grandi, poi se necessario cancella completamente i risultati degli strumenti più vecchi.

**Soft-trim** mantiene inizio + fine e inserisce `...` nel mezzo.

**Hard-clear** sostituisce l'intero risultato dello strumento con il placeholder.

Note:

- I blocchi immagine non vengono mai ridotti o cancellati.
- I rapporti sono basati sui caratteri (approssimativi), non su conteggi esatti di token.
- Se esistono meno di `keepLastAssistants` messaggi dell'assistente, il pruning viene saltato.

</Accordion>

Vedi [Session Pruning](/it/concepts/session-pruning) per i dettagli sul comportamento.

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

- I canali diversi da Telegram richiedono `*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
- Override del canale: `channels.<channel>.blockStreamingCoalesce` (e varianti per account). Signal/Slack/Discord/Google Chat hanno come predefinito `minChars: 1500`.
- `humanDelay`: pausa casuale tra le risposte a blocchi. `natural` = 800–2500 ms. Override per agente: `agents.list[].humanDelay`.

Vedi [Streaming](/it/concepts/streaming) per i dettagli su comportamento e suddivisione in blocchi.

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

- Valori predefiniti: `instant` per chat dirette/mention, `message` per chat di gruppo senza mention.
- Override per sessione: `session.typingMode`, `session.typingIntervalSeconds`.

Vedi [Indicatori di digitazione](/it/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandbox facoltativa per l'agente incorporato. Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa.

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
- `ssh`: runtime remoto generico basato su SSH
- `openshell`: runtime OpenShell

Quando viene selezionato `backend: "openshell"`, le impostazioni specifiche del runtime si spostano in
`plugins.entries.openshell.config`.

**Configurazione backend SSH:**

- `target`: target SSH nel formato `user@host[:port]`
- `command`: comando del client SSH (predefinito: `ssh`)
- `workspaceRoot`: root remota assoluta usata per le workspace per ambito
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti inline o SecretRef che OpenClaw materializza in file temporanei a runtime
- `strictHostKeyChecking` / `updateHostKeys`: controlli del criterio della chiave host OpenSSH

**Precedenza di autenticazione SSH:**

- `identityData` ha la precedenza su `identityFile`
- `certificateData` ha la precedenza su `certificateFile`
- `knownHostsData` ha la precedenza su `knownHostsFile`
- I valori `*Data` supportati da SecretRef vengono risolti dallo snapshot runtime attivo dei segreti prima dell'avvio della sessione sandbox

**Comportamento del backend SSH:**

- inizializza una volta la workspace remota dopo la creazione o ricreazione
- poi mantiene canonica la workspace SSH remota
- instrada `exec`, gli strumenti file e i percorsi media su SSH
- non sincronizza automaticamente con l'host le modifiche remote
- non supporta container browser sandbox

**Accesso alla workspace:**

- `none`: workspace sandbox per ambito sotto `~/.openclaw/sandboxes`
- `ro`: workspace sandbox in `/workspace`, workspace agente montata in sola lettura in `/agent`
- `rw`: workspace agente montata in lettura/scrittura in `/workspace`

**Ambito:**

- `session`: container + workspace per sessione
- `agent`: un container + workspace per agente (predefinito)
- `shared`: container e workspace condivisi (nessun isolamento tra sessioni)

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

- `mirror`: inizializza il remoto dal locale prima di `exec`, sincronizza indietro dopo `exec`; la workspace locale resta canonica
- `remote`: inizializza il remoto una volta quando la sandbox viene creata, poi mantiene canonica la workspace remota

In modalità `remote`, le modifiche locali sull'host fatte fuori da OpenClaw non vengono sincronizzate automaticamente nella sandbox dopo il passaggio di inizializzazione.
Il trasporto è SSH nella sandbox OpenShell, ma il plugin possiede il ciclo di vita della sandbox e l'eventuale sincronizzazione mirror.

**`setupCommand`** viene eseguito una volta dopo la creazione del container (tramite `sh -lc`). Richiede uscita di rete, root scrivibile e utente root.

**I container usano per default `network: "none"`**: imposta `"bridge"` (o una rete bridge personalizzata) se l'agente ha bisogno di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per default a meno che tu non imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (modalità break-glass).

**Gli allegati in ingresso** vengono preparati in `media/inbound/*` nella workspace attiva.

**`docker.binds`** monta directory host aggiuntive; i bind globali e per agente vengono uniti.

**Browser sandboxed** (`sandbox.browser.enabled`): Chromium + CDP in un container. L'URL noVNC viene iniettato nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L'accesso osservatore noVNC usa per default l'autenticazione VNC e OpenClaw emette un URL con token a breve durata (invece di esporre la password nell'URL condiviso).

- `allowHostControl: false` (predefinito) blocca le sessioni sandboxed dal prendere come target il browser host.
- `network` ha come predefinito `openclaw-sandbox-browser` (rete bridge dedicata). Imposta `bridge` solo quando vuoi esplicitamente una connettività bridge globale.
- `cdpSourceRange` limita facoltativamente l'ingresso CDP al bordo del container a un intervallo CIDR (ad esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive solo nel container del browser sandbox. Quando è impostato (incluso `[]`), sostituisce `docker.binds` per il container browser.
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
  - `--disable-extensions` (abilitato per default)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` sono
    abilitati per default e possono essere disabilitati con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se l'uso di WebGL/3D lo richiede.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` riabilita le estensioni se il tuo flusso di lavoro
    dipende da esse.
  - `--renderer-process-limit=2` può essere modificato con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; imposta `0` per usare il
    limite predefinito di Chromium.
  - più `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` è abilitato.
  - I valori predefiniti sono la baseline dell'immagine container; usa un'immagine browser personalizzata con un entrypoint personalizzato per cambiare i valori predefiniti del container.

</Accordion>

Il browser sandboxing e `sandbox.docker.binds` sono solo per Docker.

Crea le immagini:

```bash
scripts/sandbox-setup.sh           # immagine sandbox principale
scripts/sandbox-browser-setup.sh   # immagine browser facoltativa
```

### `agents.list` (override per agente)

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
        thinkingDefault: "high", // override per agente del livello di thinking
        reasoningDefault: "on", // override per agente della visibilità del reasoning
        fastModeDefault: false, // override per agente della modalità fast
        params: { cacheRetention: "none" }, // override per chiave dei params di defaults.models corrispondenti
        skills: ["docs-search"], // sostituisce agents.defaults.skills quando è impostato
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
- `default`: quando ne sono impostati più di uno, vince il primo (viene registrato un avviso). Se non ne è impostato nessuno, il predefinito è la prima voce dell'elenco.
- `model`: la forma stringa override solo `primary`; la forma oggetto `{ primary, fallbacks }` override entrambi (`[]` disabilita i fallback globali). I job cron che overrideano solo `primary` ereditano comunque i fallback predefiniti a meno che tu non imposti `fallbacks: []`.
- `params`: parametri stream per agente uniti sopra la voce del modello selezionato in `agents.defaults.models`. Usali per override specifici dell'agente come `cacheRetention`, `temperature` o `maxTokens` senza duplicare l'intero catalogo modelli.
- `skills`: allowlist facoltativa delle Skills per agente. Se omessa, l'agente eredita `agents.defaults.skills` quando è impostato; un elenco esplicito sostituisce i valori predefiniti invece di unirli, e `[]` significa nessuna Skills.
- `thinkingDefault`: valore predefinito facoltativo per agente del livello di thinking (`off | minimal | low | medium | high | xhigh | adaptive`). Override `agents.defaults.thinkingDefault` per questo agente quando non è impostato alcun override per messaggio o sessione.
- `reasoningDefault`: valore predefinito facoltativo per agente della visibilità del reasoning (`on | off | stream`). Si applica quando non è impostato alcun override di reasoning per messaggio o sessione.
- `fastModeDefault`: valore predefinito facoltativo per agente della modalità fast (`true | false`). Si applica quando non è impostato alcun override della modalità fast per messaggio o sessione.
- `runtime`: descrittore runtime facoltativo per agente. Usa `type: "acp"` con i valori predefiniti di `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l'agente deve usare per default sessioni harness ACP.
- `identity.avatar`: percorso relativo alla workspace, URL `http(s)` o URI `data:`.
- `identity` deriva i valori predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: allowlist di ID agente per `sessions_spawn` (`["*"]` = qualsiasi; predefinito: solo lo stesso agente).
- Guardrail di ereditarietà sandbox: se la sessione richiedente è sandboxed, `sessions_spawn` rifiuta i target che verrebbero eseguiti senza sandbox.
- `subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza una selezione esplicita del profilo; predefinito: false).

---

## Routing multi-agent

Esegui più agenti isolati all'interno di un unico Gateway. Vedi [Multi-Agent](/it/concepts/multi-agent).

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

### Campi di corrispondenza dei binding

- `type` (facoltativo): `route` per il routing normale (il tipo mancante usa come predefinito route), `acp` per binding di conversazioni ACP persistenti.
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

All'interno di ogni livello, vince la prima voce `bindings` corrispondente.

Per le voci `type: "acp"`, OpenClaw risolve in base all'identità esatta della conversazione (`match.channel` + account + `match.peer.id`) e non usa l'ordine dei livelli di binding route sopra.

### Profili di accesso per agente

<Accordion title="Accesso completo (nessuna sandbox)">

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

<Accordion title="Nessun accesso al filesystem (solo messaggistica)">

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

Vedi [Sandbox e strumenti multi-agent](/it/tools/multi-agent-sandbox-tools) per i dettagli sulla precedenza.

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
    parentForkMaxTokens: 100000, // salta il fork del thread padre sopra questo numero di token (0 disabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durata o false
      maxDiskBytes: "500mb", // budget rigido facoltativo
      highWaterBytes: "400mb", // target di pulizia facoltativo
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

<Accordion title="Dettagli dei campi della sessione">

- **`scope`**: strategia base di raggruppamento delle sessioni per i contesti di chat di gruppo.
  - `per-sender` (predefinito): ogni mittente ottiene una sessione isolata all'interno di un contesto di canale.
  - `global`: tutti i partecipanti in un contesto di canale condividono una singola sessione (usalo solo quando è previsto un contesto condiviso).
- **`dmScope`**: come vengono raggruppati i DM.
  - `main`: tutti i DM condividono la sessione principale.
  - `per-peer`: isola per ID mittente tra i canali.
  - `per-channel-peer`: isola per canale + mittente (consigliato per inbox multiutente).
  - `per-account-channel-peer`: isola per account + canale + mittente (consigliato per multi-account).
- **`identityLinks`**: mappa gli ID canonici ai peer con prefisso provider per la condivisione delle sessioni tra canali.
- **`reset`**: criterio di reset principale. `daily` esegue il reset all'ora locale `atHour`; `idle` esegue il reset dopo `idleMinutes`. Quando sono configurati entrambi, prevale quello che scade per primo.
- **`resetByType`**: override per tipo (`direct`, `group`, `thread`). Il legacy `dm` è accettato come alias di `direct`.
- **`parentForkMaxTokens`**: massimo `totalTokens` della sessione padre consentito quando si crea una sessione thread forked (predefinito `100000`).
  - Se il `totalTokens` del padre è superiore a questo valore, OpenClaw avvia una nuova sessione thread invece di ereditare la cronologia del transcript del padre.
  - Imposta `0` per disabilitare questa protezione e consentire sempre il fork dal padre.
- **`mainKey`**: campo legacy. Il runtime usa sempre `"main"` per il bucket principale della chat diretta.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta reciproca tra agenti durante gli scambi agent-to-agent (intero, intervallo: `0`–`5`). `0` disabilita la catena ping-pong.
- **`sendPolicy`**: corrispondenza per `channel`, `chatType` (`direct|group|channel`, con alias legacy `dm`), `keyPrefix` o `rawKeyPrefix`. Vince il primo deny.
- **`maintenance`**: controlli di pulizia + conservazione dello store delle sessioni.
  - `mode`: `warn` emette solo avvisi; `enforce` applica la pulizia.
  - `pruneAfter`: limite di età per le voci obsolete (predefinito `30d`).
  - `maxEntries`: numero massimo di voci in `sessions.json` (predefinito `500`).
  - `rotateBytes`: ruota `sessions.json` quando supera questa dimensione (predefinito `10mb`).
  - `resetArchiveRetention`: conservazione per gli archivi transcript `*.reset.<timestamp>`. Il predefinito è `pruneAfter`; imposta `false` per disabilitare.
  - `maxDiskBytes`: budget disco facoltativo per la directory delle sessioni. In modalità `warn` registra avvisi; in modalità `enforce` rimuove prima gli artefatti/le sessioni più vecchi.
  - `highWaterBytes`: target facoltativo dopo la pulizia del budget. Il predefinito è `80%` di `maxDiskBytes`.
- **`threadBindings`**: valori predefiniti globali per le funzionalità di sessione associate ai thread.
  - `enabled`: interruttore predefinito principale (i provider possono fare override; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus predefinito per inattività in ore (`0` disabilita; i provider possono fare override)
  - `maxAgeHours`: età massima rigida predefinita in ore (`0` disabilita; i provider possono fare override)

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

| Variabile         | Descrizione                 | Esempio                     |
| ----------------- | --------------------------- | --------------------------- |
| `{model}`         | Nome breve del modello      | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore completo del modello | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome del provider           | `anthropic`                 |
| `{thinkingLevel}` | Livello corrente di thinking | `high`, `low`, `off`        |
| `{identity.name}` | Nome dell'identità agente   | (uguale a `"auto"`)         |

Le variabili non distinguono tra maiuscole e minuscole. `{think}` è un alias di `{thinkingLevel}`.

### Reazione di conferma

- Il valore predefinito è `identity.emoji` dell'agente attivo, altrimenti `"👀"`. Imposta `""` per disabilitare.
- Override per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → fallback dell'identità.
- Ambito: `group-mentions` (predefinito), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: rimuove la conferma dopo la risposta su Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: abilita le reazioni di stato del ciclo di vita su Slack, Discord e Telegram.
  Su Slack e Discord, se non impostato mantiene abilitate le reazioni di stato quando le reazioni di conferma sono attive.
  Su Telegram, impostalo esplicitamente su `true` per abilitare le reazioni di stato del ciclo di vita.

### Debounce in ingresso

Raggruppa i rapidi messaggi solo testo dallo stesso mittente in un unico turno dell'agente. Media/allegati forzano lo svuotamento immediato. I comandi di controllo bypassano il debouncing.

### TTS (sintesi vocale)

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

- `auto` controlla la modalità predefinita di auto-TTS: `off`, `always`, `inbound` o `tagged`. `/tts on|off` può fare override delle preferenze locali e `/tts status` mostra lo stato effettivo.
- `summaryModel` override `agents.defaults.model.primary` per il riepilogo automatico.
- `modelOverrides` è abilitato per default; `modelOverrides.allowProvider` ha come predefinito `false` (opt-in).
- Le chiavi API usano come fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- `openai.baseUrl` override l'endpoint OpenAI TTS. L'ordine di risoluzione è config, poi `OPENAI_TTS_BASE_URL`, poi `https://api.openai.com/v1`.
- Quando `openai.baseUrl` punta a un endpoint non OpenAI, OpenClaw lo tratta come un server TTS compatibile con OpenAI e allenta la convalida di modello/voce.

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
- Le chiavi Talk legacy flat (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sono solo per compatibilità e vengono migrate automaticamente in `talk.providers.<provider>`.
- Gli ID voce usano come fallback `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` accetta stringhe in chiaro o oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna chiave API Talk.
- `providers.*.voiceAliases` consente alle direttive Talk di usare nomi descrittivi.
- `silenceTimeoutMs` controlla per quanto tempo la modalità Talk attende dopo il silenzio dell'utente prima di inviare la trascrizione. Se non impostato, mantiene la finestra di pausa predefinita della piattaforma (`700 ms su macOS e Android, 900 ms su iOS`).

---

## Strumenti

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima di `tools.allow`/`tools.deny`:

L'onboarding locale imposta per default le nuove configurazioni locali su `tools.profile: "coding"` quando non è impostato (i profili espliciti esistenti vengono preservati).

| Profilo     | Include                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | solo `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                   |

### Gruppi di strumenti

| Gruppo             | Strumenti                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` è accettato come alias di `exec`)                                           |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                    |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                             |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                     |
| `group:ui`         | `browser`, `canvas`                                                                                                       |
| `group:automation` | `cron`, `gateway`                                                                                                         |
| `group:messaging`  | `message`                                                                                                                 |
| `group:nodes`      | `nodes`                                                                                                                   |
| `group:agents`     | `agents_list`                                                                                                             |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                        |
| `group:openclaw`   | Tutti gli strumenti built-in (esclude i plugin provider)                                                                  |

### `tools.allow` / `tools.deny`

Criterio globale di allow/deny degli strumenti (vince il deny). Case-insensitive, supporta wildcard `*`. Applicato anche quando la sandbox Docker è disattivata.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe ulteriormente gli strumenti per provider o modelli specifici. Ordine: profilo base → profilo provider → allow/deny.

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

- L'override per agente (`agents.list[].tools.elevated`) può solo restringere ulteriormente.
- `/elevated on|off|ask|full` memorizza lo stato per sessione; le direttive inline si applicano a un singolo messaggio.
- `exec` elevated bypassa la sandbox e usa il percorso di escape configurato (`gateway` per default oppure `node` quando il target exec è `node`).

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

I controlli di sicurezza del loop degli strumenti sono **disabilitati per default**. Imposta `enabled: true` per attivare il rilevamento.
Le impostazioni possono essere definite globalmente in `tools.loopDetection` e overrideate per agente in `agents.list[].tools.loopDetection`.

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

- `historySize`: massima cronologia delle chiamate agli strumenti conservata per l'analisi dei loop.
- `warningThreshold`: soglia di pattern ripetuto senza avanzamento per gli avvisi.
- `criticalThreshold`: soglia ripetuta più alta per bloccare i loop critici.
- `globalCircuitBreakerThreshold`: soglia di arresto rigido per qualsiasi esecuzione senza avanzamento.
- `detectors.genericRepeat`: avvisa su chiamate ripetute allo stesso strumento/con gli stessi argomenti.
- `detectors.knownPollNoProgress`: avvisa/blocca sugli strumenti di polling noti (`process.poll`, `command_status`, ecc.).
- `detectors.pingPong`: avvisa/blocca sui pattern alternati a coppie senza avanzamento.
- Se `warningThreshold >= criticalThreshold` o `criticalThreshold >= globalCircuitBreakerThreshold`, la convalida fallisce.

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
        provider: "firecrawl", // facoltativo; omettilo per il rilevamento automatico
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
        directSend: false, // opt-in: invia direttamente al canale i contenuti music/video asincroni completati
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

<Accordion title="Campi della voce del modello media">

**Voce provider** (`type: "provider"` o omesso):

- `provider`: ID provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, ecc.)
- `model`: override dell'ID modello
- `profile` / `preferredProfile`: selezione del profilo `auth-profiles.json`

**Voce CLI** (`type: "cli"`):

- `command`: eseguibile da avviare
- `args`: argomenti con template (supporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, ecc.)

**Campi comuni:**

- `capabilities`: elenco facoltativo (`image`, `audio`, `video`). Predefiniti: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per voce.
- In caso di errore, si passa alla voce successiva.

L'autenticazione del provider segue l'ordine standard: `auth-profiles.json` → variabili env → `models.providers.*.apiKey`.

**Campi di completamento asincrono:**

- `asyncCompletion.directSend`: quando `true`, le attività completate di `music_generate`
  e `video_generate` provano prima la consegna diretta al canale. Predefinito: `false`
  (percorso legacy di wake/consegna modello della sessione richiedente).

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

Controlla quali sessioni possono essere prese come target dagli strumenti di sessione (`sessions_list`, `sessions_history`, `sessions_send`).

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
- `agent`: qualsiasi sessione appartenente all'ID agente corrente (può includere altri utenti se esegui sessioni per mittente con lo stesso ID agente).
- `all`: qualsiasi sessione. Il targeting cross-agent richiede comunque `tools.agentToAgent`.
- Limitazione sandbox: quando la sessione corrente è sandboxed e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilità viene forzata a `tree` anche se `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controlla il supporto degli allegati inline per `sessions_spawn`.

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
- I file vengono materializzati nella workspace figlia in `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
- Il contenuto degli allegati viene automaticamente redatto dalla persistenza del transcript.
- Gli input Base64 vengono convalidati con controlli rigorosi di alfabeto/padding e una protezione preventiva sulla dimensione prima della decodifica.
- I permessi dei file sono `0700` per le directory e `0600` per i file.
- La pulizia segue il criterio `cleanup`: `delete` rimuove sempre gli allegati; `keep` li conserva solo quando `retainOnSessionKeep: true`.

### `tools.experimental`

Flag sperimentali degli strumenti built-in. Disattivati per default a meno che non si applichi una regola di auto-abilitazione specifica del runtime.

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

- `planTool`: abilita lo strumento strutturato `update_plan` per il tracciamento del lavoro multi-step non banale.
- Predefinito: `false` per i provider non OpenAI. Le esecuzioni OpenAI e OpenAI Codex lo auto-abilitano quando non è impostato; imposta `false` per disabilitare questa auto-abilitazione.
- Quando è abilitato, il prompt di sistema aggiunge anche indicazioni d'uso in modo che il modello lo usi solo per lavori sostanziali e mantenga al massimo un solo passaggio `in_progress`.

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
- `runTimeoutSeconds`: timeout predefinito (secondi) per `sessions_spawn` quando la chiamata allo strumento omette `runTimeoutSeconds`. `0` significa nessun timeout.
- Criterio strumenti per subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider personalizzati e URL base

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
- Override della root della configurazione dell'agente con `OPENCLAW_AGENT_DIR` (o `PI_CODING_AGENT_DIR`, alias legacy della variabile d'ambiente).
- Precedenza di merge per ID provider corrispondenti:
  - I valori `baseUrl` non vuoti di `models.json` dell'agente hanno la precedenza.
  - I valori `apiKey` non vuoti dell'agente hanno la precedenza solo quando quel provider non è gestito da SecretRef nel contesto corrente di configurazione/auth-profile.
  - I valori `apiKey` del provider gestiti da SecretRef vengono aggiornati dai marker della sorgente (`ENV_VAR_NAME` per i riferimenti env, `secretref-managed` per i riferimenti file/exec) invece di persistere i segreti risolti.
  - I valori header del provider gestiti da SecretRef vengono aggiornati dai marker della sorgente (`secretref-env:ENV_VAR_NAME` per i riferimenti env, `secretref-managed` per i riferimenti file/exec).
  - `apiKey`/`baseUrl` dell'agente vuoti o mancanti ricadono su `models.providers` nella configurazione.
  - I valori `contextWindow`/`maxTokens` dei modelli corrispondenti usano il valore più alto tra la configurazione esplicita e i valori impliciti del catalogo.
  - I valori `contextTokens` dei modelli corrispondenti preservano un limite runtime esplicito quando presente; usalo per limitare il contesto effettivo senza modificare i metadati nativi del modello.
  - Usa `models.mode: "replace"` quando vuoi che la configurazione riscriva completamente `models.json`.
  - La persistenza dei marker è autorevole rispetto alla sorgente: i marker vengono scritti dallo snapshot di configurazione sorgente attivo (pre-risoluzione), non dai valori segreti risolti a runtime.

### Dettagli dei campi del provider

- `models.mode`: comportamento del catalogo provider (`merge` o `replace`).
- `models.providers`: mappa dei provider personalizzati indicizzata per ID provider.
- `models.providers.*.api`: adattatore di richiesta (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, ecc.).
- `models.providers.*.apiKey`: credenziale del provider (preferisci SecretRef/sostituzione env).
- `models.providers.*.auth`: strategia di autenticazione (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: per Ollama + `openai-completions`, inietta `options.num_ctx` nelle richieste (predefinito: `true`).
- `models.providers.*.authHeader`: forza il trasporto della credenziale nell'header `Authorization` quando richiesto.
- `models.providers.*.baseUrl`: URL base dell'API upstream.
- `models.providers.*.headers`: header statici aggiuntivi per routing proxy/tenant.
- `models.providers.*.request`: override di trasporto per le richieste HTTP del provider di modelli.
  - `request.headers`: header aggiuntivi (uniti ai valori predefiniti del provider). I valori accettano SecretRef.
  - `request.auth`: override della strategia di autenticazione. Modalità: `"provider-default"` (usa l'autenticazione built-in del provider), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` facoltativo).
  - `request.proxy`: override del proxy HTTP. Modalità: `"env-proxy"` (usa le variabili env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Entrambe le modalità accettano un sotto-oggetto `tls` facoltativo.
  - `request.tls`: override TLS per connessioni dirette. Campi: `ca`, `cert`, `key`, `passphrase` (tutti accettano SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: quando `true`, consente HTTPS verso `baseUrl` quando il DNS risolve in intervalli privati, CGNAT o simili, tramite la protezione SSRF del fetch HTTP del provider (opt-in dell'operatore per endpoint OpenAI-compatibili self-hosted attendibili). WebSocket usa lo stesso `request` per header/TLS ma non quel gate SSRF del fetch. Predefinito `false`.
- `models.providers.*.models`: voci esplicite del catalogo modelli del provider.
- `models.providers.*.models.*.contextWindow`: metadati della finestra di contesto nativa del modello.
- `models.providers.*.models.*.contextTokens`: limite di contesto runtime facoltativo. Usalo quando vuoi un budget di contesto effettivo più piccolo del `contextWindow` nativo del modello.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: suggerimento di compatibilità facoltativo. Per `api: "openai-completions"` con `baseUrl` non vuoto e non nativo (host diverso da `api.openai.com`), OpenClaw lo forza a `false` a runtime. `baseUrl` vuoto/omesso mantiene il comportamento OpenAI predefinito.
- `models.providers.*.models.*.compat.requiresStringContent`: suggerimento di compatibilità facoltativo per endpoint chat OpenAI-compatibili che accettano solo stringhe. Quando `true`, OpenClaw appiattisce gli array `messages[].content` di puro testo in stringhe semplici prima di inviare la richiesta.
- `plugins.entries.amazon-bedrock.config.discovery`: radice delle impostazioni di auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: attiva/disattiva la discovery implicita.
- `plugins.entries.amazon-bedrock.config.discovery.region`: regione AWS per la discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro facoltativo per ID provider per una discovery mirata.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervallo di polling per l'aggiornamento della discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: finestra di contesto di fallback per i modelli rilevati.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: massimo di token in output di fallback per i modelli rilevati.

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

Imposta `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`). Usa riferimenti `opencode/...` per il catalogo Zen o riferimenti `opencode-go/...` per il catalogo Go. Scorciatoia: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`.

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
- Per l'endpoint generale, definisci un provider personalizzato con l'override del base URL.

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

Gli endpoint Moonshot nativi dichiarano la compatibilità con l'uso dello streaming sul trasporto condiviso
`openai-completions`, e OpenClaw si basa sulle capacità dell'endpoint
più che solo sull'ID provider built-in.

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
Il catalogo modelli usa per default solo M2.7.
Nel percorso di streaming compatibile con Anthropic, OpenClaw disabilita per default il thinking di MiniMax
a meno che tu non imposti esplicitamente `thinking`. `/fast on` o
`params.fastMode: true` riscrivono `MiniMax-M2.7` in
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelli locali (LM Studio)">

Vedi [Modelli locali](/it/gateway/local-models). In breve: esegui un grande modello locale tramite LM Studio Responses API su hardware adeguato; mantieni uniti i modelli hosted per il fallback.

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

- `allowBundled`: allowlist facoltativa solo per le Skills bundled (le Skills managed/workspace non sono interessate).
- `load.extraDirs`: root aggiuntive di Skills condivise (precedenza più bassa).
- `install.preferBrew`: quando true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di ricadere su altri tipi di installer.
- `install.nodeManager`: preferenza dell'installer node per le specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` disabilita una Skills anche se bundled/installata.
- `entries.<skillKey>.apiKey`: opzione di comodità per le Skills che dichiarano una variabile env primaria (stringa in chiaro o oggetto SecretRef).

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
- La discovery accetta plugin OpenClaw nativi più bundle Codex compatibili e bundle Claude, inclusi i bundle Claude con layout predefinito senza manifest.
- **Le modifiche di configurazione richiedono un riavvio del gateway.**
- `allow`: allowlist facoltativa (si caricano solo i plugin elencati). Vince `deny`.
- `plugins.entries.<id>.apiKey`: campo di comodità per la chiave API a livello plugin (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa delle variabili env con ambito plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, il core blocca `before_prompt_build` e ignora i campi che mutano il prompt dal legacy `before_agent_start`, preservando comunque i legacy `modelOverride` e `providerOverride`. Si applica agli hook dei plugin nativi e alle directory hook fornite dai bundle supportati.
- `plugins.entries.<id>.subagent.allowModelOverride`: si fida esplicitamente di questo plugin per richiedere override per-esecuzione di `provider` e `model` per le esecuzioni dei subagenti in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist facoltativa di target canonici `provider/model` per override di subagenti attendibili. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (convalidato dallo schema del plugin OpenClaw nativo quando disponibile).
- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider Firecrawl web-fetch.
  - `apiKey`: chiave API Firecrawl (accetta SecretRef). Ricade su `plugins.entries.firecrawl.config.webSearch.apiKey`, il legacy `tools.web.fetch.firecrawl.apiKey` o la variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base dell'API Firecrawl (predefinito: `https://api.firecrawl.dev`).
  - `onlyMainContent`: estrae solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scraping in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni di xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad esempio `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di memory dreaming (sperimentale). Vedi [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: interruttore principale del dreaming (predefinito `false`).
  - `frequency`: cadenza cron per ogni sweep completo di dreaming (`"0 3 * * *"` per default).
  - Il criterio di fase e le soglie sono dettagli implementativi (non chiavi di configurazione rivolte all'utente).
- La configurazione completa della memoria si trova in [Riferimento della configurazione della memoria](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin bundle Claude abilitati possono anche contribuire con valori predefiniti Pi incorporati da `settings.json`; OpenClaw li applica come impostazioni agente sanificate, non come patch di configurazione raw di OpenClaw.
- `plugins.slots.memory`: scegli l'ID del plugin memoria attivo, oppure `"none"` per disabilitare i plugin memoria.
- `plugins.slots.contextEngine`: scegli l'ID del plugin motore di contesto attivo; il predefinito è `"legacy"` a meno che tu non installi e selezioni un altro motore.
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ha come predefinito `true` quando non è impostato (modello trusted-network).
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` per una navigazione browser rigorosamente solo pubblica.
- In modalità rigorosa, gli endpoint dei profili CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco delle reti private durante i controlli di raggiungibilità/discovery.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo attach-only (avvio/arresto/reset disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw scopra `/json/version`; usa WS(S)
  quando il provider ti fornisce un URL WebSocket diretto di DevTools.
- I profili `existing-session` sono solo host e usano Chrome MCP invece di CDP.
- I profili `existing-session` possono impostare `userDataDir` per prendere come target uno specifico
  profilo di browser basato su Chromium come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti di routing di Chrome MCP:
  azioni basate su snapshot/riferimenti invece del targeting con selettori CSS, hook di upload
  per un solo file, nessun override del timeout delle finestre di dialogo, nessun `wait --load networkidle` e nessun
  `responsebody`, esportazione PDF, intercettazione download o azioni batch.
- I profili locali gestiti `openclaw` assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  `cdpUrl` esplicitamente solo per CDP remoti.
- Ordine di auto-rilevamento: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag di avvio extra all'avvio locale di Chromium (ad esempio
  `--disable-gpu`, dimensionamento finestra o flag di debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, testo breve, URL immagine o URI data
    },
  },
}
```

- `seamColor`: colore d'accento per il chrome della UI dell'app nativa (tinta del fumetto in modalità Talk, ecc.).
- `assistant`: override dell'identità della Control UI. Ricade sull'identità dell'agente attivo.

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
      // dangerouslyAllowHostHeaderOriginFallback: false, // modalità pericolosa di fallback origine basata sull'header Host
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
      // deny HTTP aggiuntivi per /tools/invoke
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

- `mode`: `local` (esegue il gateway) oppure `remote` (si connette a un gateway remoto). Il gateway rifiuta di avviarsi se non è `local`.
- `port`: singola porta multiplexed per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) oppure `custom`.
- **Alias legacy di bind**: usa i valori di modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind `loopback` predefinito ascolta su `127.0.0.1` dentro il container. Con il networking bridge Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il gateway è irraggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Auth**: richiesta per default. I bind non loopback richiedono l'autenticazione del gateway. In pratica significa un token/password condiviso oppure un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`. La procedura guidata di onboarding genera un token per default.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi SecretRef), imposta esplicitamente `gateway.auth.mode` su `token` oppure `password`. L'avvio e i flussi di installazione/riparazione del servizio falliscono quando entrambi sono configurati e `mode` non è impostato.
- `gateway.auth.mode: "none"`: modalità esplicita senza autenticazione. Usala solo per configurazioni loopback locali attendibili; intenzionalmente non viene proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'autenticazione a un reverse proxy identity-aware e considera attendibili gli header di identità da `gateway.trustedProxies` (vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth)). Questa modalità si aspetta una sorgente proxy **non loopback**; i reverse proxy loopback sullo stesso host non soddisfano l'autenticazione trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, gli header di identità Tailscale Serve possono soddisfare l'autenticazione della Control UI/WebSocket (verificati tramite `tailscale whois`). Gli endpoint HTTP API **non** usano questa autenticazione tramite header Tailscale; seguono invece la normale modalità di autenticazione HTTP del gateway. Questo flusso senza token presuppone che l'host gateway sia attendibile. Il predefinito è `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limiter facoltativo per auth fallita. Si applica per IP client e per ambito di autenticazione (shared-secret e device-token vengono tracciati in modo indipendente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Nel percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura del fallimento. I tentativi concorrenti errati dello stesso client possono quindi far scattare il limiter sulla seconda richiesta invece di passare entrambi come semplici mismatch.
  - `gateway.auth.rateLimit.exemptLoopback` ha come predefinito `true`; impostalo su `false` quando vuoi intenzionalmente limitare anche il traffico localhost (per configurazioni di test o deployment proxy rigorosi).
- I tentativi di autenticazione WS originati dal browser sono sempre limitati con l'esenzione loopback disabilitata (difesa in profondità contro brute force localhost basata su browser).
- Su loopback, quei lockout con origine browser sono isolati per valore `Origin`
  normalizzato, quindi fallimenti ripetuti da un'origine localhost non bloccano automaticamente
  un'altra origine.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) oppure `funnel` (pubblico, richiede auth).
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per le connessioni Gateway WebSocket. Richiesta quando sono previsti client browser da origini non loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback dell'origine basato su header Host per deployment che si affidano intenzionalmente al criterio di origine dell'header Host.
- `remote.transport`: `ssh` (predefinito) oppure `direct` (ws/wss). Per `direct`, `remote.url` deve essere `ws://` oppure `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass lato client che consente `ws://` in chiaro verso IP di rete privata attendibili; il predefinito resta solo loopback per il traffico in chiaro.
- `gateway.remote.token` / `.password` sono campi di credenziali del client remoto. Non configurano da soli l'autenticazione del gateway.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS per il relay APNs esterno usato dalle build iOS ufficiali/TestFlight dopo che pubblicano registrazioni relay-backed nel gateway. Questo URL deve corrispondere all'URL del relay compilato nella build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout in millisecondi per l'invio gateway-to-relay. Il predefinito è `10000`.
- Le registrazioni relay-backed vengono delegate a una specifica identità gateway. L'app iOS associata recupera `gateway.identity.get`, include quell'identità nella registrazione relay e inoltra al gateway un grant di invio con ambito registrazione. Un altro gateway non può riutilizzare quella registrazione memorizzata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione del relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: via di fuga solo per sviluppo per URL relay HTTP loopback. Gli URL relay di produzione devono restare su HTTPS.
- `gateway.channelHealthCheckMinutes`: intervallo in minuti del monitor di salute dei canali. Imposta `0` per disabilitare globalmente i riavvii del monitor di salute. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia in minuti per socket obsoleti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitor di salute per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dai riavvii del monitor di salute mantenendo attivo il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account per i canali multi-account. Quando è impostato, ha la precedenza sull'override a livello di canale.
- I percorsi di chiamata del gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef ma non risolto, la risoluzione fallisce in modo fail-closed (nessun fallback remoto che mascheri il problema).
- `trustedProxies`: IP dei reverse proxy che terminano TLS o iniettano header del client inoltrato. Elenca solo proxy che controlli. Le voci loopback sono comunque valide per configurazioni di rilevamento proxy locale/stesso host (ad esempio Tailscale Serve o un reverse proxy locale), ma **non** rendono le richieste loopback idonee per `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, il gateway accetta `X-Real-IP` se `X-Forwarded-For` è assente. Il predefinito è `false` per un comportamento fail-closed.
- `gateway.tools.deny`: nomi di strumenti aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende la deny list predefinita).
- `gateway.tools.allow`: rimuove nomi di strumenti dalla deny list HTTP predefinita.

</Accordion>

### Endpoint OpenAI-compatibili

- Chat Completions: disabilitato per default. Abilitalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening dell'input URL per Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote vengono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero tramite URL.
- Header facoltativo di hardening della risposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (impostalo solo per origini HTTPS che controlli; vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multi-instance

Esegui più gateway su un unico host con porte e directory di stato uniche:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag di comodità: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

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
- `autoGenerate`: genera automaticamente una coppia locale di certificato/chiave self-signed quando i file espliciti non sono configurati; solo per uso locale/dev.
- `certPath`: percorso filesystem del file di certificato TLS.
- `keyPath`: percorso filesystem del file della chiave privata TLS; mantienilo con permessi limitati.
- `caPath`: percorso facoltativo del bundle CA per la verifica client o catene di trust personalizzate.

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

- `mode`: controlla come le modifiche di configurazione vengono applicate a runtime.
  - `"off"`: ignora le modifiche live; i cambiamenti richiedono un riavvio esplicito.
  - `"restart"`: riavvia sempre il processo del gateway in caso di modifica della configurazione.
  - `"hot"`: applica le modifiche in-process senza riavvio.
  - `"hybrid"` (predefinito): prova prima il reload a caldo; ricade sul riavvio se necessario.
- `debounceMs`: finestra di debounce in ms prima che le modifiche di configurazione vengano applicate (intero non negativo).
- `deferralTimeoutMs`: tempo massimo in ms di attesa delle operazioni in corso prima di forzare un riavvio (predefinito: `300000` = 5 minuti).

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
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
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

Note su convalida e sicurezza:

- `hooks.enabled=true` richiede un `hooks.token` non vuoto.
- `hooks.token` deve essere **distinto** da `gateway.auth.token`; riutilizzare il token del Gateway viene rifiutato.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (ad esempio `["hook:"]`).

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`

<Accordion title="Dettagli delle mappature">

- `match.path` corrisponde al sottopercorso dopo `/hooks` (ad esempio `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per i percorsi generici.
- I template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione hook.
  - `transform.module` deve essere un percorso relativo e restare dentro `hooks.transformsDir` (i percorsi assoluti e il traversal vengono rifiutati).
- `agentId` instrada verso un agente specifico; gli ID sconosciuti ricadono sul predefinito.
- `allowedAgentIds`: limita il routing esplicito (`*` o omesso = consenti tutto, `[]` = nega tutto).
- `defaultSessionKey`: chiave di sessione fissa facoltativa per le esecuzioni dell'agente hook senza `sessionKey` esplicito.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist facoltativa di prefissi per i valori espliciti di `sessionKey` (richiesta + mapping), ad esempio `["hook:"]`.
- `deliver: true` invia la risposta finale a un canale; `channel` ha come predefinito `last`.
- `model` override l'LLM per questa esecuzione hook (deve essere consentito se è impostato il catalogo modelli).

</Accordion>

### Integrazione Gmail

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

- Il gateway avvia automaticamente `gog gmail watch serve` all'avvio quando è configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitarlo.
- Non eseguire un `gog gmail watch serve` separato insieme al Gateway.

---

## Host canvas

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
- Bind non loopback: le route canvas richiedono l'autenticazione del Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- I Node WebView in genere non inviano header di autenticazione; dopo che un node è paired e connesso, il Gateway pubblicizza URL di capability con ambito node per l'accesso canvas/A2UI.
- Gli URL di capability sono associati alla sessione WS attiva del node e scadono rapidamente. Non viene usato un fallback basato su IP.
- Inietta il client live-reload nell'HTML servito.
- Crea automaticamente un `index.html` iniziale quando è vuoto.
- Serve anche A2UI in `/__openclaw__/a2ui/`.
- Le modifiche richiedono un riavvio del gateway.
- Disabilita il live reload per directory grandi o in caso di errori `EMFILE`.

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
- L'hostname ha come predefinito `openclaw`. Override con `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast sotto `~/.openclaw/dns/`. Per la discovery cross-network, abbinala a un server DNS (consigliato CoreDNS) + split DNS Tailscale.

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

- Le variabili env inline vengono applicate solo se nell'env del processo manca la chiave.
- File `.env`: `.env` della CWD + `~/.openclaw/.env` (nessuno dei due override le variabili esistenti).
- `shellEnv`: importa le chiavi mancanti attese dal profilo della tua shell di login.
- Vedi [Ambiente](/it/help/environment) per la precedenza completa.

### Sostituzione di variabili env

Riferisci variabili env in qualsiasi stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Corrispondono solo nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`.
- Variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Usa l'escape `$${VAR}` per un `${VAR}` letterale.
- Funziona con `$include`.

---

## Segreti

I SecretRef sono additivi: i valori in chiaro continuano a funzionare.

### `SecretRef`

Usa una sola forma oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Convalida:

- pattern di `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- pattern di id per `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: puntatore JSON assoluto (ad esempio `"/providers/openai/apiKey"`)
- pattern di id per `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Gli id `source: "exec"` non devono contenere segmenti di percorso slash-delimited `.` o `..` (ad esempio `a/../b` viene rifiutato)

### Superficie delle credenziali supportata

- Matrice canonica: [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface)
- `secrets apply` prende come target i percorsi delle credenziali supportati in `openclaw.json`.
- I riferimenti `auth-profiles.json` sono inclusi nella risoluzione runtime e nella copertura di audit.

### Configurazione dei provider di segreti

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
- Il provider `exec` richiede un `command` assoluto e usa payload di protocollo su stdin/stdout.
- Per default, i percorsi comando symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire percorsi symlink con validazione del percorso target risolto.
- Se `trustedDirs` è configurato, il controllo delle directory attendibili si applica al percorso target risolto.
- L'ambiente del processo figlio `exec` è minimo per default; passa esplicitamente le variabili richieste con `passEnv`.
- I riferimenti ai segreti vengono risolti al momento dell'attivazione in uno snapshot in memoria, poi i percorsi di richiesta leggono solo dallo snapshot.
- Il filtraggio della superficie attiva si applica durante l'attivazione: i riferimenti non risolti su superfici abilitate fanno fallire startup/reload, mentre le superfici inattive vengono saltate con diagnostica.

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

- I profili per agente sono memorizzati in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` supporta riferimenti a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per le modalità di credenziali statiche.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali di auth-profile supportate da SecretRef.
- Le credenziali runtime statiche provengono da snapshot risolti in memoria; le voci statiche legacy in `auth.json` vengono ripulite quando rilevate.
- Import legacy OAuth da `~/.openclaw/credentials/oauth.json`.
- Vedi [OAuth](/it/concepts/oauth).
- Comportamento runtime dei segreti e strumenti `audit/configure/apply`: [Gestione dei segreti](/it/gateway/secrets).

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

- `billingBackoffHours`: backoff base in ore quando un profilo fallisce per veri
  errori di fatturazione/credito insufficiente (predefinito: `5`). Un testo esplicito di fatturazione può
  comunque arrivare qui anche su risposte `401`/`403`, ma i matcher di testo
  specifici del provider restano limitati al provider che li possiede (ad esempio OpenRouter
  `Key limit exceeded`). I messaggi retryable HTTP `402` relativi a usage-window o
  limiti di spesa di organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override facoltativi per provider per le ore di billing backoff.
- `billingMaxHours`: limite in ore per la crescita esponenziale del billing backoff (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff base in minuti per fallimenti `auth_permanent` ad alta confidenza (predefinito: `10`).
- `authPermanentMaxMinutes`: limite in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: massimo numero di rotazioni dello stesso auth-profile del provider per errori di sovraccarico prima di passare al fallback del modello (predefinito: `1`). Le forme provider-busy come `ModelNotReadyException` finiscono qui.
- `overloadedBackoffMs`: ritardo fisso prima di riprovare una rotazione di provider/profilo sovraccarico (predefinito: `0`).
- `rateLimitedProfileRotations`: massimo numero di rotazioni dello stesso auth-profile del provider per errori di rate-limit prima di passare al fallback del modello (predefinito: `1`). Quel bucket `rate_limit` include testo tipico del provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

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
- `consoleLevel` passa a `debug` con `--verbose`.
- `maxFileBytes`: dimensione massima del file di log in byte prima che le scritture vengano soppresse (intero positivo; predefinito: `524288000` = 500 MB). Usa la rotazione esterna dei log per i deployment di produzione.

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

- `enabled`: interruttore principale per l'output di instrumentazione (predefinito: `true`).
- `flags`: array di stringhe flag che abilitano output di log mirati (supporta wildcard come `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: soglia di età in ms per emettere avvisi di sessione bloccata mentre una sessione resta nello stato di elaborazione.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`).
- `otel.endpoint`: URL del collector per l'esportazione OTel.
- `otel.protocol`: `"http/protobuf"` (predefinito) oppure `"grpc"`.
- `otel.headers`: header di metadati HTTP/gRPC aggiuntivi inviati con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilitano l'esportazione di trace, metriche o log.
- `otel.sampleRate`: frequenza di campionamento delle trace `0`–`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `cacheTrace.enabled`: registra snapshot di cache trace per le esecuzioni incorporate (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per il JSONL di cache trace (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa viene incluso nell'output di cache trace (tutti predefiniti: `true`).

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

- `channel`: canale di rilascio per installazioni npm/git — `"stable"`, `"beta"` o `"dev"`.
- `checkOnStart`: controlla gli aggiornamenti npm all'avvio del gateway (predefinito: `true`).
- `auto.enabled`: abilita l'aggiornamento automatico in background per le installazioni di pacchetti (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell'applicazione automatica sul canale stable (predefinito: `6`; massimo: `168`).
- `auto.stableJitterHours`: finestra aggiuntiva di distribuzione graduale sul canale stable in ore (predefinito: `12`; massimo: `168`).
- `auto.betaCheckIntervalHours`: frequenza in ore dei controlli sul canale beta (predefinito: `1`; massimo: `24`).

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
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Imposta `false` per mantenere disponibili i comandi ACP bloccando l'esecuzione.
- `backend`: ID backend runtime ACP predefinito (deve corrispondere a un plugin runtime ACP registrato).
- `defaultAgent`: ID agente target ACP di fallback quando gli spawn non specificano un target esplicito.
- `allowedAgents`: allowlist degli ID agente consentiti per le sessioni runtime ACP; vuoto significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush inattivo in ms per il testo in streaming.
- `stream.maxChunkChars`: dimensione massima del chunk prima della suddivisione della proiezione del blocco in streaming.
- `stream.repeatSuppression`: sopprime le righe di stato/strumento ripetute per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` esegue streaming incrementale; `"final_only"` effettua il buffering fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi di strumenti nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: massimo numero di caratteri di output dell'assistente proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: massimo numero di caratteri per le righe proiettate di stato/aggiornamento ACP.
- `stream.tagVisibility`: record dei nomi dei tag verso override booleani di visibilità per gli eventi in streaming.
- `runtime.ttlMinutes`: TTL di inattività in minuti per i worker di sessione ACP prima che siano idonei alla pulizia.
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

- `cli.banner.taglineMode` controlla lo stile del tagline del banner:
  - `"random"` (predefinito): tagline a rotazione, divertenti/stagionali.
  - `"default"`: tagline neutro fisso (`Tutte le tue chat, un solo OpenClaw.`).
  - `"off"`: nessun testo tagline (restano comunque mostrati titolo/versione del banner).
- Per nascondere l'intero banner (non solo i tagline), imposta la variabile env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadati scritti dai flussi guidati della CLI (`onboard`, `configure`, `doctor`):

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

Vedi i campi identity di `agents.list` in [Valori predefiniti degli agenti](#agent-defaults).

---

## Bridge (legacy, rimosso)

Le build correnti non includono più il bridge TCP. I node si connettono tramite il Gateway WebSocket. Le chiavi `bridge.*` non fanno più parte dello schema di configurazione (la convalida fallisce finché non vengono rimosse; `openclaw doctor --fix` può eliminare le chiavi sconosciute).

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
    webhook: "https://example.invalid/legacy", // fallback deprecato per i job memorizzati con notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token facoltativo per l'auth webhook in uscita
    sessionRetention: "24h", // stringa durata o false
    runLog: {
      maxBytes: "2mb", // predefinito 2_000_000 byte
      keepLines: 2000, // predefinito 2000
    },
  },
}
```

- `sessionRetention`: per quanto tempo mantenere le sessioni complete delle esecuzioni cron isolate prima della pulizia da `sessions.json`. Controlla anche la pulizia dei transcript cron archiviati ed eliminati. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: dimensione massima per file di log di esecuzione (`cron/runs/<jobId>.jsonl`) prima della pulizia. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti conservate quando viene attivata la pulizia del log di esecuzione. Predefinito: `2000`.
- `webhookToken`: bearer token usato per la consegna POST del webhook cron (`delivery.mode = "webhook"`); se omesso non viene inviato alcun header auth.
- `webhook`: URL webhook fallback legacy deprecato (http/https) usato solo per i job memorizzati che hanno ancora `notify: true`.

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

- `maxAttempts`: massimo numero di retry per i job one-shot in caso di errori transitori (predefinito: `3`; intervallo: `0`–`10`).
- `backoffMs`: array di ritardi di backoff in ms per ogni tentativo di retry (predefinito: `[30000, 60000, 300000]`; 1–10 voci).
- `retryOn`: tipi di errore che attivano i retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettilo per riprovare tutti i tipi transitori.

Si applica solo ai job cron one-shot. I job ricorrenti usano una gestione separata dei fallimenti.

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

- `enabled`: abilita gli avvisi di errore per i job cron (predefinito: `false`).
- `after`: numero di fallimenti consecutivi prima che venga emesso un avviso (intero positivo, minimo: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso job (intero non negativo).
- `mode`: modalità di consegna — `"announce"` invia tramite un messaggio di canale; `"webhook"` pubblica sul webhook configurato.
- `accountId`: account o ID canale facoltativo per limitare l'ambito della consegna dell'avviso.

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

- Destinazione predefinita per le notifiche di errore cron in tutti i job.
- `mode`: `"announce"` oppure `"webhook"`; usa come predefinito `"announce"` quando esistono dati target sufficienti.
- `channel`: override del canale per la consegna announce. `"last"` riutilizza l'ultimo canale di consegna noto.
- `to`: target announce esplicito o URL webhook. Obbligatorio per la modalità webhook.
- `accountId`: override facoltativo dell'account per la consegna.
- `delivery.failureDestination` per job override questo valore predefinito globale.
- Quando non è impostata né una destinazione di errore globale né una per job, i job che già consegnano tramite `announce` ricadono su quel target announce primario in caso di errore.
- `delivery.failureDestination` è supportato solo per i job `sessionTarget="isolated"` a meno che `delivery.mode` primario del job non sia `"webhook"`.

Vedi [Job Cron](/it/automation/cron-jobs). Le esecuzioni cron isolate sono tracciate come [attività in background](/it/automation/tasks).

---

## Variabili template del modello media

Placeholder template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo del messaggio in ingresso          |
| `{{RawBody}}`      | Corpo raw (senza wrapper di cronologia/mittente)  |
| `{{BodyStripped}}` | Corpo con le mention di gruppo rimosse            |
| `{{From}}`         | Identificatore del mittente                       |
| `{{To}}`           | Identificatore della destinazione                 |
| `{{MessageSid}}`   | ID del messaggio del canale                       |
| `{{SessionId}}`    | UUID della sessione corrente                      |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione   |
| `{{MediaUrl}}`     | Pseudo-URL del media in ingresso                  |
| `{{MediaPath}}`    | Percorso locale del media                         |
| `{{MediaType}}`    | Tipo di media (image/audio/document/…)            |
| `{{Transcript}}`   | Trascrizione audio                                |
| `{{Prompt}}`       | Prompt media risolto per le voci CLI              |
| `{{MaxChars}}`     | Caratteri massimi di output risolti per le voci CLI |
| `{{ChatType}}`     | `"direct"` oppure `"group"`                       |
| `{{GroupSubject}}` | Oggetto del gruppo (best effort)                  |
| `{{GroupMembers}}` | Anteprima dei membri del gruppo (best effort)     |
| `{{SenderName}}`   | Nome visualizzato del mittente (best effort)      |
| `{{SenderE164}}`   | Numero di telefono del mittente (best effort)     |
| `{{Provider}}`     | Suggerimento provider (whatsapp, telegram, discord, ecc.) |

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
- Array di file: deep-merge in ordine (i successivi overrideano i precedenti).
- Chiavi sibling: unite dopo le include (overrideano i valori inclusi).
- Include annidate: fino a 10 livelli di profondità.
- Percorsi: risolti relativamente al file che include, ma devono restare all'interno della directory di configurazione di livello superiore (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo se comunque si risolvono all'interno di quel confine.
- Errori: messaggi chiari per file mancanti, errori di parsing e include circolari.

---

_Correlati: [Configurazione](/it/gateway/configuration) · [Esempi di configurazione](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_
