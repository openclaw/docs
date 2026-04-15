---
read_when:
    - Hai bisogno della semantica esatta della configurazione a livello di campo o dei valori predefiniti
    - Stai convalidando blocchi di configurazione di canali, modelli, Gateway o strumenti
summary: Riferimento della configurazione del Gateway per le chiavi principali di OpenClaw, i valori predefiniti e i link ai riferimenti dedicati dei sottosistemi
title: Riferimento della configurazione
x-i18n:
    generated_at: "2026-04-15T19:41:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bdb0f3e56e4a4d767fb4d6150526ae9b3926ef5b213b458001f41d02762436d
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Riferimento della configurazione

Riferimento della configurazione principale per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configuration](/it/gateway/configuration).

Questa pagina copre le principali superfici di configurazione di OpenClaw e rimanda altrove quando un sottosistema ha un proprio riferimento più approfondito. **Non** cerca di includere in linea ogni catalogo di comandi di canali/plugin o ogni parametro avanzato di memoria/QMD in un’unica pagina.

Fonte di verità del codice:

- `openclaw config schema` stampa lo JSON Schema live usato per la convalida e la UI di controllo, con i metadati bundled/plugin/channel uniti quando disponibili
- `config.schema.lookup` restituisce un singolo nodo dello schema con ambito di percorso per gli strumenti di analisi dettagliata
- `pnpm config:docs:check` / `pnpm config:docs:gen` convalidano l’hash di baseline della documentazione di configurazione rispetto alla superficie corrente dello schema

Riferimenti approfonditi dedicati:

- [Riferimento della configurazione della memoria](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione di Dreaming in `plugins.entries.memory-core.config.dreaming`
- [Comandi slash](/it/tools/slash-commands) per il catalogo corrente dei comandi built-in + bundled
- pagine del canale/plugin proprietario per le superfici di comando specifiche del canale

Il formato della configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi: OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Ogni canale si avvia automaticamente quando la relativa sezione di configurazione esiste (a meno che `enabled: false`).

### Accesso DM e di gruppo

Tutti i canali supportano criteri per i DM e criteri per i gruppi:

| Criterio DM         | Comportamento                                                   |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | I mittenti sconosciuti ricevono un codice di associazione monouso; il proprietario deve approvare |
| `allowlist`         | Solo i mittenti in `allowFrom` (o nell’archivio allow dei pair effettuati) |
| `open`              | Consenti tutti i DM in entrata (richiede `allowFrom: ["*"]`)    |
| `disabled`          | Ignora tutti i DM in entrata                                    |

| Criterio di gruppo    | Comportamento                                         |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (default) | Solo i gruppi che corrispondono alla allowlist configurata |
| `open`                | Ignora le allowlist dei gruppi (si applica comunque il gating per menzioni) |
| `disabled`            | Blocca tutti i messaggi di gruppo/stanza              |

<Note>
`channels.defaults.groupPolicy` imposta il valore predefinito quando `groupPolicy` di un provider non è impostato.
I codici di pairing scadono dopo 1 ora. Le richieste di pairing DM in sospeso sono limitate a **3 per canale**.
Se un blocco provider manca completamente (`channels.<provider>` assente), a runtime il criterio di gruppo ricade su `allowlist` (fail-closed) con un avviso all’avvio.
</Note>

### Override del modello per canale

Usa `channels.modelByChannel` per associare ID di canale specifici a un modello. I valori accettano `provider/model` o alias di modelli configurati. La mappatura del canale si applica quando una sessione non ha già un override del modello (ad esempio impostato tramite `/model`).

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

Usa `channels.defaults` per il comportamento condiviso di criteri di gruppo e Heartbeat tra i provider:

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

- `channels.defaults.groupPolicy`: criterio di gruppo di fallback quando `groupPolicy` a livello provider non è impostato.
- `channels.defaults.contextVisibility`: modalità predefinita di visibilità del contesto supplementare per tutti i canali. Valori: `all` (predefinito, include tutto il contesto di citazioni/thread/cronologia), `allowlist` (include solo il contesto dei mittenti nella allowlist), `allowlist_quote` (come allowlist ma mantiene il contesto esplicito di citazione/risposta). Override per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include gli stati dei canali integri nell’output di Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: include gli stati degradati/di errore nell’output di Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: visualizza un output di Heartbeat compatto in stile indicatore.

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

- I comandi in uscita usano per impostazione predefinita l’account `default` se presente; altrimenti il primo ID account configurato (ordinato).
- `channels.whatsapp.defaultAccount` facoltativo sovrascrive quella selezione dell’account predefinito di fallback quando corrisponde a un ID account configurato.
- La directory di autenticazione legacy Baileys a account singolo viene migrata da `openclaw doctor` in `whatsapp/default`.
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo file regolare; i symlink vengono rifiutati), con `TELEGRAM_BOT_TOKEN` come fallback per l’account predefinito.
- `channels.telegram.defaultAccount` facoltativo sovrascrive la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- Nelle configurazioni multi-account (2+ ID account), imposta un valore predefinito esplicito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) per evitare il routing di fallback; `openclaw doctor` avvisa quando manca o non è valido.
- `configWrites: false` blocca le scritture di configurazione avviate da Telegram (migrazioni ID supergruppo, `/config set|unset`).
- Le voci `bindings[]` di livello superiore con `type: "acp"` configurano binding ACP persistenti per i topic del forum (usa il formato canonico `chatId:topic:topicId` in `match.peer.id`). La semantica dei campi è condivisa in [ACP Agents](/it/tools/acp-agents#channel-specific-settings).
- Le anteprime di stream di Telegram usano `sendMessage` + `editMessageText` (funziona nelle chat dirette e di gruppo).
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` come fallback per l’account predefinito.
- Le chiamate dirette in uscita che forniscono un `token` Discord esplicito usano quel token per la chiamata; le impostazioni di retry/criterio dell’account continuano comunque a provenire dall’account selezionato nello snapshot runtime attivo.
- `channels.discord.defaultAccount` facoltativo sovrascrive la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- Usa `user:<id>` (DM) o `channel:<id>` (canale guild) per i target di consegna; gli ID numerici senza prefisso vengono rifiutati.
- Gli slug delle guild sono in minuscolo con gli spazi sostituiti da `-`; le chiavi dei canali usano il nome in formato slug (senza `#`). Preferisci gli ID delle guild.
- I messaggi creati dal bot vengono ignorati per impostazione predefinita. `allowBots: true` li abilita; usa `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i propri messaggi restano comunque filtrati).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e gli override a livello di canale) scarta i messaggi che menzionano un altro utente o ruolo ma non il bot (esclusi @everyone/@here).
- `maxLinesPerMessage` (predefinito 17) suddivide i messaggi molto alti anche quando sono sotto i 2000 caratteri.
- `channels.discord.threadBindings` controlla il routing associato ai thread Discord:
  - `enabled`: override Discord per le funzionalità di sessione associate ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/routing associati)
  - `idleHours`: override Discord per l’auto-unfocus dopo inattività in ore (`0` disabilita)
  - `maxAgeHours`: override Discord per l’età massima rigida in ore (`0` disabilita)
  - `spawnSubagentSessions`: interruttore opt-in per la creazione/associazione automatica di thread con `sessions_spawn({ thread: true })`
- Le voci `bindings[]` di livello superiore con `type: "acp"` configurano binding ACP persistenti per canali e thread (usa l’id del canale/thread in `match.peer.id`). La semantica dei campi è condivisa in [ACP Agents](/it/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` imposta il colore di accento per i contenitori Discord components v2.
- `channels.discord.voice` abilita le conversazioni nei canali vocali Discord e gli override facoltativi di auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` vengono passati a `@discordjs/voice` come opzioni DAVE (`true` e `24` per impostazione predefinita).
- OpenClaw inoltre prova a ripristinare la ricezione vocale uscendo e rientrando in una sessione vocale dopo ripetuti errori di decrittazione.
- `channels.discord.streaming` è la chiave canonica della modalità stream. I valori legacy `streamMode` e booleani `streaming` vengono migrati automaticamente.
- `channels.discord.autoPresence` mappa la disponibilità runtime alla presenza del bot (healthy => online, degraded => idle, exhausted => dnd) e consente override facoltativi del testo di stato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita il matching su nome/tag mutabili (modalità di compatibilità break-glass).
- `channels.discord.execApprovals`: consegna nativa su Discord delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare le richieste exec. Se omesso, usa `commands.ownerAllowFrom` come fallback.
  - `agentFilter`: allowlist facoltativa di ID agent. Ometti per inoltrare le approvazioni per tutti gli agent.
  - `sessionFilter`: pattern facoltativi per le chiavi di sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito) invia ai DM degli approvatori, `"channel"` invia al canale di origine, `"both"` invia a entrambi. Quando il target include `"channel"`, i pulsanti possono essere usati solo dagli approvatori risolti.
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

- JSON dell’account di servizio: inline (`serviceAccount`) o basato su file (`serviceAccountFile`).
- È supportato anche SecretRef dell’account di servizio (`serviceAccountRef`).
- Fallback env: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` o `users/<userId>` per i target di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita il matching su principal email mutabili (modalità di compatibilità break-glass).

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

- **La modalità Socket** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` come fallback env dell’account predefinito).
- **La modalità HTTP** richiede `botToken` più `signingSecret` (alla radice o per account).
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe in chiaro o oggetti SecretRef.
- Gli snapshot degli account Slack espongono campi per sorgente/stato delle credenziali per credenziale come `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in modalità HTTP, `signingSecretStatus`. `configured_unavailable` significa che l’account è configurato tramite SecretRef ma il percorso di comando/runtime corrente non ha potuto risolvere il valore del secret.
- `configWrites: false` blocca le scritture di configurazione avviate da Slack.
- `channels.slack.defaultAccount` facoltativo sovrascrive la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- `channels.slack.streaming.mode` è la chiave canonica della modalità stream per Slack. `channels.slack.streaming.nativeTransport` controlla il trasporto streaming nativo di Slack. I valori legacy `streamMode`, booleani `streaming` e `nativeStreaming` vengono migrati automaticamente.
- Usa `user:<id>` (DM) o `channel:<id>` per i target di consegna.

**Modalità di notifica delle reazioni:** `off`, `own` (predefinito), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento della sessione del thread:** `thread.historyScope` è per-thread (predefinito) o condiviso nel canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread.

- Lo streaming nativo di Slack più lo stato thread in stile assistente Slack "is typing..." richiedono un target di risposta nel thread. I DM di primo livello restano per impostazione predefinita fuori thread, quindi usano `typingReaction` o la consegna normale invece dell’anteprima in stile thread.
- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in entrata mentre è in corso una risposta, poi la rimuove al completamento. Usa uno shortcode emoji Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna nativa su Slack delle approvazioni exec e autorizzazione degli approvatori. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` o `"both"`).

| Gruppo di azioni | Predefinito | Note                     |
| ---------------- | ----------- | ------------------------ |
| reactions        | abilitato   | Reagisci + elenca reazioni |
| messages         | abilitato   | Leggi/invia/modifica/elimina |
| pins             | abilitato   | Aggiungi/rimuovi pin/elenca |
| memberInfo       | abilitato   | Informazioni membro      |
| emojiList        | abilitato   | Elenco emoji personalizzate |

### Mattermost

Mattermost viene distribuito come Plugin: `openclaw plugins install @openclaw/mattermost`.

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
        // URL esplicito facoltativo per deployment con reverse proxy/pubblici
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
- `commands.callbackUrl` deve risolversi verso l’endpoint Gateway OpenClaw ed essere raggiungibile dal server Mattermost.
- I callback slash nativi sono autenticati con i token per comando restituiti da Mattermost durante la registrazione dei comandi slash. Se la registrazione fallisce o nessun comando viene attivato, OpenClaw rifiuta i callback con `Unauthorized: invalid command token.`
- Per host di callback privati/tailnet/interni, Mattermost può richiedere che `ServiceSettings.AllowedUntrustedInternalConnections` includa l’host/dominio del callback. Usa valori host/dominio, non URL completi.
- `channels.mattermost.configWrites`: consenti o nega le scritture di configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiede `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: override per canale del gating per menzione (`"*"` per il valore predefinito).
- `channels.mattermost.defaultAccount` facoltativo sovrascrive la selezione dell’account predefinito quando corrisponde a un ID account configurato.

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

- `channels.signal.account`: vincola l’avvio del canale a una specifica identità account Signal.
- `channels.signal.configWrites`: consenti o nega le scritture di configurazione avviate da Signal.
- `channels.signal.defaultAccount` facoltativo sovrascrive la selezione dell’account predefinito quando corrisponde a un ID account configurato.

### BlueBubbles

BlueBubbles è il percorso iMessage consigliato (basato su Plugin, configurato in `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls e azioni avanzate:
      // vedi /channels/bluebubbles
    },
  },
}
```

- I percorsi chiave core coperti qui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` facoltativo sovrascrive la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- Le voci `bindings[]` di livello superiore con `type: "acp"` possono associare conversazioni BlueBubbles a sessioni ACP persistenti. Usa un handle BlueBubbles o una stringa target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [ACP Agents](/it/tools/acp-agents#channel-specific-settings).
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

- `channels.imessage.defaultAccount` facoltativo sovrascrive la selezione dell’account predefinito quando corrisponde a un ID account configurato.

- Richiede l’accesso completo al disco per il database di Messages.
- Preferisci target `chat_id:<id>`. Usa `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; imposta `remoteHost` (`host` o `user@host`) per il recupero degli allegati tramite SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in entrata (predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa un controllo rigoroso della chiave host, quindi assicurati che la chiave host del relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consenti o nega le scritture di configurazione avviate da iMessage.
- Le voci `bindings[]` di livello superiore con `type: "acp"` possono associare conversazioni iMessage a sessioni ACP persistenti. Usa un handle normalizzato o un target chat esplicito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [ACP Agents](/it/tools/acp-agents#channel-specific-settings).

<Accordion title="Esempio di wrapper SSH per iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è basato su estensione ed è configurato in `channels.matrix`.

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

- L’autenticazione con token usa `accessToken`; l’autenticazione con password usa `userId` + `password`.
- `channels.matrix.proxy` instrada il traffico HTTP Matrix tramite un proxy HTTP(S) esplicito. Gli account con nome possono sovrascriverlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` consente homeserver privati/interni. `proxy` e questo opt-in di rete sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l’account preferito nelle configurazioni multi-account.
- `channels.matrix.autoJoin` è impostato per impostazione predefinita su `off`, quindi le stanze invitate e i nuovi inviti in stile DM vengono ignorati finché non imposti `autoJoin: "allowlist"` con `autoJoinAllowlist` oppure `autoJoin: "always"`.
- `channels.matrix.execApprovals`: consegna nativa su Matrix delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (ad es. `@owner:example.org`) autorizzati ad approvare le richieste exec.
  - `agentFilter`: allowlist facoltativa di ID agent. Ometti per inoltrare le approvazioni per tutti gli agent.
  - `sessionFilter`: pattern facoltativi per le chiavi di sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito), `"channel"` (stanza di origine) oppure `"both"`.
  - Override per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controlla come i DM Matrix vengono raggruppati in sessioni: `per-user` (predefinito) condivide per peer instradato, mentre `per-room` isola ogni stanza DM.
- I probe di stato Matrix e le ricerche live nella directory usano lo stesso criterio proxy del traffico runtime.
- La configurazione completa di Matrix, le regole di targeting e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è basato su estensione ed è configurato in `channels.msteams`.

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

- I percorsi chiave core coperti qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, webhook, criterio DM/gruppo, override per team/per canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è basato su estensione ed è configurato in `channels.irc`.

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

- I percorsi chiave core coperti qui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` facoltativo sovrascrive la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/allowlist/gating per menzione) è documentata in [IRC](/it/channels/irc).

### Multi-account (tutti i canali)

Esegui più account per canale (ognuno con il proprio `accountId`):

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

- `default` viene usato quando `accountId` è omesso (CLI + routing).
- I token env si applicano solo all’account **default**.
- Le impostazioni base del canale si applicano a tutti gli account, salvo override per account.
- Usa `bindings[].match.accountId` per instradare ogni account a un agent diverso.
- Se aggiungi un account non predefinito tramite `openclaw channels add` (o onboarding del canale) mentre sei ancora su una configurazione del canale top-level a account singolo, OpenClaw promuove prima i valori top-level a account singolo con ambito account nella mappa degli account del canale, così l’account originale continua a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece preservare un target con nome/predefinito esistente corrispondente.
- I binding esistenti solo-canale (senza `accountId`) continuano a corrispondere all’account predefinito; i binding con ambito account restano facoltativi.
- `openclaw doctor --fix` ripara anche le forme miste spostando i valori top-level a account singolo con ambito account nell’account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può invece preservare un target con nome/predefinito esistente corrispondente.

### Altri canali di estensione

Molti canali di estensione sono configurati come `channels.<id>` e documentati nelle rispettive pagine dedicate del canale (ad esempio Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Vedi l’indice completo dei canali: [Channels](/it/channels).

### Gating per menzione nelle chat di gruppo

Per impostazione predefinita, i messaggi di gruppo **richiedono una menzione** (menzione nei metadati o pattern regex sicuri). Si applica alle chat di gruppo di WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipi di menzione:**

- **Menzioni nei metadati**: @-mention native della piattaforma. Ignorate nella modalità self-chat di WhatsApp.
- **Pattern di testo**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- Il gating per menzione viene applicato solo quando il rilevamento è possibile (menzioni native o almeno un pattern).

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

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono sovrascriverlo con `channels.<channel>.historyLimit` (o per account). Imposta `0` per disabilitarlo.

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

Risoluzione: override per-DM → valore predefinito del provider → nessun limite (tutto mantenuto).

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

### Comandi (gestione dei comandi in chat)

```json5
{
  commands: {
    native: "auto", // registra i comandi nativi quando supportati
    nativeSkills: "auto", // registra i comandi Skills nativi quando supportati
    text: true, // analizza /commands nei messaggi di chat
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

- Questo blocco configura le superfici di comando. Per il catalogo corrente dei comandi built-in + bundled, vedi [Slash Commands](/it/tools/slash-commands).
- Questa pagina è un **riferimento delle chiavi di configurazione**, non il catalogo completo dei comandi. I comandi di proprietà del canale/plugin come QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` e Talk `/voice` sono documentati nelle rispettive pagine del canale/plugin e in [Slash Commands](/it/tools/slash-commands).
- I comandi testuali devono essere messaggi **autonomi** con `/` iniziale.
- `native: "auto"` attiva i comandi nativi per Discord/Telegram, lascia Slack disattivato.
- `nativeSkills: "auto"` attiva i comandi Skills nativi per Discord/Telegram, lascia Slack disattivato.
- Override per canale: `channels.discord.commands.native` (bool o `"auto"`). `false` cancella i comandi registrati in precedenza.
- Sovrascrivi la registrazione nativa delle Skills per canale con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` aggiunge voci extra al menu del bot Telegram.
- `bash: true` abilita `! <cmd>` per la shell host. Richiede `tools.elevated.enabled` e mittente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (legge/scrive `openclaw.json`). Per i client `chat.send` del gateway, le scritture persistenti `/config set|unset` richiedono anche `operator.admin`; il comando di sola lettura `/config show` resta disponibile ai normali client operator con ambito di scrittura.
- `mcp: true` abilita `/mcp` per la configurazione del server MCP gestito da OpenClaw in `mcp.servers`.
- `plugins: true` abilita `/plugins` per il rilevamento dei plugin, l’installazione e i controlli di abilitazione/disabilitazione.
- `channels.<provider>.configWrites` regola le mutazioni di configurazione per canale (predefinito: true).
- Per i canali multi-account, `channels.<provider>.accounts.<id>.configWrites` regola anche le scritture che hanno come target quell’account (ad esempio `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` disabilita `/restart` e le azioni dello strumento di riavvio del gateway. Predefinito: `true`.
- `ownerAllowFrom` è la allowlist esplicita del proprietario per comandi/strumenti riservati al proprietario. È separata da `allowFrom`.
- `ownerDisplay: "hash"` applica l’hash agli ID del proprietario nel prompt di sistema. Imposta `ownerDisplaySecret` per controllare l’hashing.
- `allowFrom` è per provider. Quando è impostato, è l’**unica** fonte di autorizzazione (le allowlist/pairing del canale e `useAccessGroups` vengono ignorati).
- `useAccessGroups: false` consente ai comandi di bypassare i criteri dei gruppi di accesso quando `allowFrom` non è impostato.
- Mappa della documentazione dei comandi:
  - catalogo built-in + bundled: [Slash Commands](/it/tools/slash-commands)
  - superfici di comando specifiche del canale: [Channels](/it/channels)
  - comandi QQ Bot: [QQ Bot](/it/channels/qqbot)
  - comandi di pairing: [Pairing](/it/channels/pairing)
  - comando card di LINE: [LINE](/it/channels/line)
  - Dreaming della memory: [Dreaming](/it/concepts/dreaming)

</Accordion>

---

## Valori predefiniti degli agent

### `agents.defaults.workspace`

Predefinito: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Radice opzionale del repository mostrata nella riga Runtime del prompt di sistema. Se non impostata, OpenClaw la rileva automaticamente risalendo dalla workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist predefinita facoltativa di Skills per gli agent che non impostano `agents.list[].skills`.

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

- Ometti `agents.defaults.skills` per avere Skills senza restrizioni per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare i valori predefiniti.
- Imposta `agents.list[].skills: []` per non avere alcuna Skills.
- Un elenco `agents.list[].skills` non vuoto è l’insieme finale per quell’agent; non viene unito ai valori predefiniti.

### `agents.defaults.skipBootstrap`

Disabilita la creazione automatica dei file bootstrap della workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controlla quando i file bootstrap della workspace vengono iniettati nel prompt di sistema. Predefinito: `"always"`.

- `"continuation-skip"`: i turni di continuazione sicura (dopo una risposta completata dell’assistente) saltano la re-iniezione del bootstrap della workspace, riducendo la dimensione del prompt. Le esecuzioni di Heartbeat e i retry post-Compaction ricostruiscono comunque il contesto.

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

Controlla il testo di avviso visibile all’agent quando il contesto bootstrap viene troncato.
Predefinito: `"once"`.

- `"off"`: non iniettare mai il testo di avviso nel prompt di sistema.
- `"once"`: inietta l’avviso una sola volta per ogni firma di troncamento univoca (consigliato).
- `"always"`: inietta l’avviso a ogni esecuzione quando esiste un troncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mappa di proprietà del budget di contesto

OpenClaw ha più budget ad alto volume per prompt/contesto, e sono intenzionalmente suddivisi per sottosistema invece di confluire tutti in un unico parametro generico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale iniezione bootstrap della workspace.
- `agents.defaults.startupContext.*`:
  preludio di avvio one-shot di `/new` e `/reset`, inclusi i file recenti
  `memory/*.md` giornalieri.
- `skills.limits.*`:
  l’elenco compatto di Skills iniettato nel prompt di sistema.
- `agents.defaults.contextLimits.*`:
  estratti runtime delimitati e blocchi iniettati di proprietà del runtime.
- `memory.qmd.limits.*`:
  dimensionamento degli snippet indicizzati di ricerca memoria e dell’iniezione.

Usa l’override corrispondente per agent solo quando un agent richiede un budget diverso:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controlla il preludio di avvio del primo turno iniettato nelle esecuzioni `/new` e `/reset` senza parametri.

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

Valori predefiniti condivisi per le superfici di contesto runtime delimitate.

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

- `memoryGetMaxChars`: limite predefinito dell’estratto `memory_get` prima che vengano aggiunti i metadati di troncamento e l’avviso di continuazione.
- `memoryGetDefaultLines`: finestra di righe predefinita di `memory_get` quando `lines` è omesso.
- `toolResultMaxChars`: limite live dei risultati degli strumenti usato per i risultati persistiti e il recupero da overflow.
- `postCompactionMaxChars`: limite dell’estratto di AGENTS.md usato durante l’iniezione di refresh post-Compaction.

#### `agents.list[].contextLimits`

Override per agent dei parametri condivisi `contextLimits`. I campi omessi ereditano da `agents.defaults.contextLimits`.

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

Limite globale per l’elenco compatto di Skills iniettato nel prompt di sistema. Non influisce sulla lettura dei file `SKILL.md` su richiesta.

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

Override per agent del budget del prompt delle Skills.

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

Dimensione massima in pixel del lato più lungo dell’immagine nei blocchi immagine di transcript/tool prima delle chiamate al provider.
Predefinito: `1200`.

Valori più bassi in genere riducono l’uso di vision token e la dimensione del payload della richiesta per esecuzioni ricche di screenshot.
Valori più alti preservano più dettaglio visivo.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso orario per il contesto del prompt di sistema (non per i timestamp dei messaggi). Usa come fallback il fuso orario dell’host.

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
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
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
  - Usato anche come routing di fallback quando il modello selezionato/predefinito non può accettare input immagine.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla funzionalità condivisa di generazione immagini e da qualunque futura superficie di strumenti/plugin che generi immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione immagini nativa di Gemini, `fal/fal-ai/flux/dev` per fal o `openai/gpt-image-1` per OpenAI Images.
  - Se selezioni direttamente un provider/modello, configura anche l’autenticazione/la chiave API del provider corrispondente (ad esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` per `openai/*`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato dall’autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di provider-id.
- `musicGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla funzionalità condivisa di generazione musicale e dallo strumento built-in `music_generate`.
  - Valori tipici: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.5+`.
  - Se omesso, `music_generate` può comunque dedurre un provider predefinito supportato dall’autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione musicale registrati in ordine di provider-id.
  - Se selezioni direttamente un provider/modello, configura anche l’autenticazione/la chiave API del provider corrispondente.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla funzionalità condivisa di generazione video e dallo strumento built-in `video_generate`.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Se omesso, `video_generate` può comunque dedurre un provider predefinito supportato dall’autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione video registrati in ordine di provider-id.
  - Se selezioni direttamente un provider/modello, configura anche l’autenticazione/la chiave API del provider corrispondente.
  - Il provider bundled di generazione video Qwen supporta fino a 1 video in output, 1 immagine in input, 4 video in input, durata di 10 secondi e opzioni a livello provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dallo strumento `pdf` per il routing del modello.
  - Se omesso, lo strumento PDF usa come fallback `imageModel`, poi il modello risolto della sessione/predefinito.
- `pdfMaxBytesMb`: limite predefinito delle dimensioni PDF per lo strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo predefinito di pagine considerate dalla modalità fallback di estrazione nello strumento `pdf`.
- `verboseDefault`: livello verbose predefinito per gli agent. Valori: `"off"`, `"on"`, `"full"`. Predefinito: `"off"`.
- `elevatedDefault`: livello predefinito di output elevato per gli agent. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Predefinito: `"on"`.
- `model.primary`: formato `provider/model` (ad es. `openai/gpt-5.4`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca del provider configurato per quell’esatto ID modello, e solo dopo torna al provider predefinito configurato (comportamento di compatibilità deprecato, quindi preferisci `provider/model` esplicito). Se quel provider non espone più il modello predefinito configurato, OpenClaw usa come fallback il primo provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso.
- `models`: il catalogo dei modelli configurati e la allowlist per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifici del provider, ad esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parametri provider globali predefiniti applicati a tutti i modelli. Impostali in `agents.defaults.params` (ad es. `{ cacheRetention: "long" }`).
- Precedenza di unione di `params` (config): `agents.defaults.params` (base globale) viene sovrascritto da `agents.defaults.models["provider/model"].params` (per modello), poi `agents.list[].params` (ID agent corrispondente) sovrascrive per chiave. Vedi [Prompt Caching](/it/reference/prompt-caching) per i dettagli.
- `embeddedHarness`: criterio predefinito del runtime embedded dell’agent a basso livello. Usa `runtime: "auto"` per lasciare che gli harness dei plugin registrati prendano in carico i modelli supportati, `runtime: "pi"` per forzare l’harness PI built-in oppure un ID harness registrato come `runtime: "codex"`. Imposta `fallback: "none"` per disabilitare il fallback automatico a PI.
- I writer di configurazione che modificano questi campi (ad esempio `/models set`, `/models set-image` e i comandi di aggiunta/rimozione dei fallback) salvano la forma oggetto canonica e preservano gli elenchi di fallback esistenti quando possibile.
- `maxConcurrent`: numero massimo di esecuzioni parallele degli agent tra le sessioni (ogni sessione resta comunque serializzata). Predefinito: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` controlla quale esecutore a basso livello esegue i turni embedded dell’agent.
La maggior parte delle installazioni dovrebbe mantenere il valore predefinito `{ runtime: "auto", fallback: "pi" }`.
Usalo quando un plugin affidabile fornisce un harness nativo, come l’harness bundled del server app Codex.

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

- `runtime`: `"auto"`, `"pi"` oppure un ID harness di plugin registrato. Il plugin bundled Codex registra `codex`.
- `fallback`: `"pi"` oppure `"none"`. `"pi"` mantiene l’harness PI built-in come fallback di compatibilità. `"none"` fa fallire la selezione di harness plugin mancanti o non supportati invece di usare silenziosamente PI.
- Override di ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` sovrascrive `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` disabilita il fallback PI per quel processo.
- Per installazioni solo Codex, imposta `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` e `embeddedHarness.fallback: "none"`.
- Questo controlla solo l’harness chat embedded. Generazione media, vision, PDF, musica, video e TTS continuano a usare le rispettive impostazioni provider/modello.

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

Gli alias configurati da te hanno sempre la precedenza sui valori predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità thinking a meno che tu non imposti `--thinking off` o definisca tu stesso `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per impostazione predefinita per lo streaming delle chiamate agli strumenti. Imposta `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
I modelli Anthropic Claude 4.6 usano per impostazione predefinita thinking `adaptive` quando non è impostato alcun livello di thinking esplicito.

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

Sostituisce l’intero prompt di sistema assemblato da OpenClaw con una stringa fissa. Impostalo a livello predefinito (`agents.defaults.systemPromptOverride`) o per agent (`agents.list[].systemPromptOverride`). I valori per agent hanno la precedenza; un valore vuoto o composto solo da spazi viene ignorato. Utile per esperimenti controllati sul prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

Esecuzioni periodiche di Heartbeat.

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
        isolatedSession: false, // predefinito: false; true esegue ogni heartbeat in una sessione nuova (nessuna cronologia della conversazione)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predefinito) | block
        target: "none", // predefinito: none | opzioni: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: stringa di durata (ms/s/m/h). Predefinito: `30m` (autenticazione con chiave API) oppure `1h` (autenticazione OAuth). Imposta `0m` per disabilitare.
- `includeSystemPromptSection`: quando è false, omette la sezione Heartbeat dal prompt di sistema e salta l’iniezione di `HEARTBEAT.md` nel contesto bootstrap. Predefinito: `true`.
- `suppressToolErrorWarnings`: quando è true, sopprime i payload di avviso degli errori degli strumenti durante le esecuzioni di Heartbeat.
- `timeoutSeconds`: tempo massimo in secondi consentito per un turno agent Heartbeat prima che venga interrotto. Lascialo non impostato per usare `agents.defaults.timeoutSeconds`.
- `directPolicy`: criterio di consegna diretta/DM. `allow` (predefinito) consente la consegna a target diretto. `block` sopprime la consegna a target diretto ed emette `reason=dm-blocked`.
- `lightContext`: quando è true, le esecuzioni di Heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file bootstrap della workspace.
- `isolatedSession`: quando è true, ogni esecuzione di Heartbeat avviene in una sessione nuova senza cronologia di conversazione precedente. Stesso schema di isolamento del Cron `sessionTarget: "isolated"`. Riduce il costo in token per Heartbeat da ~100K a ~2-5K token.
- Per agent: imposta `agents.list[].heartbeat`. Quando un qualunque agent definisce `heartbeat`, **solo quegli agent** eseguono Heartbeat.
- Gli Heartbeat eseguono turni agent completi: intervalli più brevi consumano più token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id di un Plugin provider di Compaction registrato (facoltativo)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // usato quando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disabilita la re-iniezione
        model: "openrouter/anthropic/claude-sonnet-4-6", // override facoltativo del modello solo per la Compaction
        notifyUser: true, // invia un breve avviso quando inizia la Compaction (predefinito: false)
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

- `mode`: `default` oppure `safeguard` (riepilogo a blocchi per cronologie lunghe). Vedi [Compaction](/it/concepts/compaction).
- `provider`: id di un Plugin provider di Compaction registrato. Quando è impostato, viene chiamato `summarize()` del provider invece del riepilogo LLM built-in. In caso di errore, torna al built-in. Impostare un provider forza `mode: "safeguard"`. Vedi [Compaction](/it/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentiti per una singola operazione di Compaction prima che OpenClaw la interrompa. Predefinito: `900`.
- `identifierPolicy`: `strict` (predefinito), `off` oppure `custom`. `strict` antepone indicazioni built-in per la conservazione di identificatori opachi durante il riepilogo di Compaction.
- `identifierInstructions`: testo facoltativo personalizzato per la preservazione degli identificatori usato quando `identifierPolicy=custom`.
- `postCompactionSections`: nomi facoltativi di sezioni H2/H3 di AGENTS.md da re-iniettare dopo la Compaction. Il valore predefinito è `["Session Startup", "Red Lines"]`; imposta `[]` per disabilitare la re-iniezione. Quando non è impostato o è impostato esplicitamente a quella coppia predefinita, anche le intestazioni meno recenti `Every Session`/`Safety` sono accettate come fallback legacy.
- `model`: override facoltativo `provider/model-id` solo per il riepilogo di Compaction. Usalo quando la sessione principale deve mantenere un modello ma i riepiloghi di Compaction devono essere eseguiti con un altro; se non impostato, la Compaction usa il modello primario della sessione.
- `notifyUser`: quando `true`, invia un breve avviso all’utente quando inizia la Compaction (ad esempio, "Compacting context..."). Disabilitato per impostazione predefinita per mantenere la Compaction silenziosa.
- `memoryFlush`: turno agentico silenzioso prima dell’auto-Compaction per archiviare ricordi durevoli. Saltato quando la workspace è in sola lettura.

### `agents.defaults.contextPruning`

Esegue il pruning dei **vecchi risultati degli strumenti** dal contesto in memoria prima dell’invio all’LLM. **Non** modifica la cronologia della sessione su disco.

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
- `ttl` controlla con quale frequenza il pruning può essere eseguito di nuovo (dopo l’ultimo aggiornamento della cache).
- Il pruning prima tronca in modo soft i risultati degli strumenti troppo grandi, poi li cancella in modo hard se necessario.

**Soft-trim** mantiene l’inizio + la fine e inserisce `...` nel mezzo.

**Hard-clear** sostituisce l’intero risultato dello strumento con il segnaposto.

Note:

- I blocchi immagine non vengono mai troncati/cancellati.
- I rapporti si basano sui caratteri (approssimativi), non su conteggi esatti di token.
- Se esistono meno di `keepLastAssistants` messaggi assistant, il pruning viene saltato.

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

- I canali non Telegram richiedono `*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
- Override per canale: `channels.<channel>.blockStreamingCoalesce` (e varianti per account). Signal/Slack/Discord/Google Chat usano per impostazione predefinita `minChars: 1500`.
- `humanDelay`: pausa casuale tra risposte a blocchi. `natural` = 800–2500ms. Override per agent: `agents.list[].humanDelay`.

Vedi [Streaming](/it/concepts/streaming) per i dettagli su comportamento + chunking.

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

- Valori predefiniti: `instant` per chat dirette/menzioni, `message` per chat di gruppo senza menzione.
- Override per sessione: `session.typingMode`, `session.typingIntervalSeconds`.

Vedi [Typing Indicators](/it/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandbox facoltativo per l’agent embedded. Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa.

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

<Accordion title="Dettagli del sandbox">

**Backend:**

- `docker`: runtime Docker locale (predefinito)
- `ssh`: runtime remoto generico basato su SSH
- `openshell`: runtime OpenShell

Quando è selezionato `backend: "openshell"`, le impostazioni specifiche del runtime vengono spostate in
`plugins.entries.openshell.config`.

**Configurazione del backend SSH:**

- `target`: target SSH nel formato `user@host[:port]`
- `command`: comando del client SSH (predefinito: `ssh`)
- `workspaceRoot`: radice remota assoluta usata per le workspace per-scope
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti inline o SecretRef che OpenClaw materializza in file temporanei a runtime
- `strictHostKeyChecking` / `updateHostKeys`: parametri di criterio delle chiavi host OpenSSH

**Precedenza dell’autenticazione SSH:**

- `identityData` ha la precedenza su `identityFile`
- `certificateData` ha la precedenza su `certificateFile`
- `knownHostsData` ha la precedenza su `knownHostsFile`
- I valori `*Data` supportati da SecretRef vengono risolti dallo snapshot runtime attivo dei secret prima dell’avvio della sessione sandbox

**Comportamento del backend SSH:**

- inizializza la workspace remota una volta dopo create o recreate
- poi mantiene canonica la workspace SSH remota
- instrada `exec`, gli strumenti file e i percorsi media su SSH
- non sincronizza automaticamente le modifiche remote sull’host
- non supporta container browser sandbox

**Accesso alla workspace:**

- `none`: workspace sandbox per-scope sotto `~/.openclaw/sandboxes`
- `ro`: workspace sandbox in `/workspace`, workspace dell’agent montata in sola lettura in `/agent`
- `rw`: workspace dell’agent montata in lettura/scrittura in `/workspace`

**Scope:**

- `session`: container + workspace per sessione
- `agent`: un container + workspace per agent (predefinito)
- `shared`: container e workspace condivisi (nessun isolamento tra sessioni)

**Configurazione del Plugin OpenShell:**

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

- `mirror`: inizializza il remoto dal locale prima di exec, sincronizza indietro dopo exec; la workspace locale resta canonica
- `remote`: inizializza il remoto una volta quando il sandbox viene creato, poi mantiene canonica la workspace remota

In modalità `remote`, le modifiche locali sull’host fatte fuori da OpenClaw non vengono sincronizzate automaticamente nel sandbox dopo il passaggio di inizializzazione.
Il trasporto avviene tramite SSH verso il sandbox OpenShell, ma il Plugin gestisce il ciclo di vita del sandbox e l’eventuale sincronizzazione mirror.

**`setupCommand`** viene eseguito una volta dopo la creazione del container (tramite `sh -lc`). Richiede uscita di rete, root scrivibile, utente root.

**Per impostazione predefinita i container usano `network: "none"`** — imposta `"bridge"` (o una rete bridge personalizzata) se l’agent necessita di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per impostazione predefinita a meno che tu non imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Gli allegati in entrata** vengono preparati in `media/inbound/*` nella workspace attiva.

**`docker.binds`** monta directory host aggiuntive; i bind globali e per-agent vengono uniti.

**Browser sandboxed** (`sandbox.browser.enabled`): Chromium + CDP in un container. L’URL noVNC viene iniettato nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L’accesso osservatore noVNC usa per impostazione predefinita l’autenticazione VNC e OpenClaw emette un URL con token a breve durata (invece di esporre la password nell’URL condiviso).

- `allowHostControl: false` (predefinito) impedisce alle sessioni sandboxed di puntare al browser host.
- `network` usa per impostazione predefinita `openclaw-sandbox-browser` (rete bridge dedicata). Imposta `bridge` solo quando desideri esplicitamente una connettività bridge globale.
- `cdpSourceRange` limita facoltativamente l’ingresso CDP al bordo del container a un intervallo CIDR (ad esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive solo nel container del browser sandboxed. Quando è impostato (incluso `[]`), sostituisce `docker.binds` per il container del browser.
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se l’uso di WebGL/3D lo richiede.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` riabilita le estensioni se il tuo flusso di lavoro
    ne dipende.
  - `--renderer-process-limit=2` può essere modificato con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; imposta `0` per usare il
    limite di processi predefinito di Chromium.
  - più `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` è abilitato.
  - I valori predefiniti sono la baseline dell’immagine container; usa un’immagine browser personalizzata con un entrypoint personalizzato per cambiare i valori predefiniti del container.

</Accordion>

Il sandboxing del browser e `sandbox.docker.binds` sono disponibili solo con Docker.

Crea le immagini:

```bash
scripts/sandbox-setup.sh           # immagine sandbox principale
scripts/sandbox-browser-setup.sh   # immagine browser facoltativa
```

### `agents.list` (override per agent)

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
        model: "anthropic/claude-opus-4-6", // oppure { primary, fallbacks }
        thinkingDefault: "high", // override per-agent del livello di thinking
        reasoningDefault: "on", // override per-agent della visibilità del reasoning
        fastModeDefault: false, // override per-agent della modalità veloce
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // sovrascrive per chiave i params di defaults.models corrispondenti
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

- `id`: ID agent stabile (obbligatorio).
- `default`: quando ne sono impostati più di uno, vince il primo (viene registrato un avviso). Se nessuno è impostato, il predefinito è la prima voce dell’elenco.
- `model`: la forma stringa sovrascrive solo `primary`; la forma oggetto `{ primary, fallbacks }` sovrascrive entrambi (`[]` disabilita i fallback globali). I job Cron che sovrascrivono solo `primary` ereditano comunque i fallback predefiniti a meno che non imposti `fallbacks: []`.
- `params`: params stream per-agent uniti sopra la voce modello selezionata in `agents.defaults.models`. Usalo per override specifici dell’agent come `cacheRetention`, `temperature` o `maxTokens` senza duplicare l’intero catalogo dei modelli.
- `skills`: allowlist facoltativa di Skills per agent. Se omessa, l’agent eredita `agents.defaults.skills` quando impostato; un elenco esplicito sostituisce i valori predefiniti invece di unirsi ad essi, e `[]` significa nessuna Skills.
- `thinkingDefault`: livello di thinking predefinito facoltativo per agent (`off | minimal | low | medium | high | xhigh | adaptive`). Sovrascrive `agents.defaults.thinkingDefault` per questo agent quando non è impostato alcun override per messaggio o sessione.
- `reasoningDefault`: visibilità predefinita facoltativa del reasoning per agent (`on | off | stream`). Si applica quando non è impostato alcun override di reasoning per messaggio o sessione.
- `fastModeDefault`: valore predefinito facoltativo per agent per la modalità veloce (`true | false`). Si applica quando non è impostato alcun override della modalità veloce per messaggio o sessione.
- `embeddedHarness`: override facoltativo per-agent del criterio dell’harness a basso livello. Usa `{ runtime: "codex", fallback: "none" }` per rendere un agent solo-Codex mentre gli altri agent mantengono il fallback PI predefinito.
- `runtime`: descrittore runtime facoltativo per-agent. Usa `type: "acp"` con i valori predefiniti `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l’agent deve usare per impostazione predefinita sessioni harness ACP.
- `identity.avatar`: percorso relativo alla workspace, URL `http(s)` o URI `data:`.
- `identity` deriva valori predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: allowlist di ID agent per `sessions_spawn` (`["*"]` = qualunque; predefinito: solo lo stesso agent).
- Guardrail di ereditarietà sandbox: se la sessione richiedente è sandboxed, `sessions_spawn` rifiuta i target che verrebbero eseguiti senza sandbox.
- `subagents.requireAgentId`: quando è true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo; predefinito: false).

---

## Routing multi-agent

Esegui più agent isolati all’interno di un singolo Gateway. Vedi [Multi-Agent](/it/concepts/multi-agent).

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

- `type` (facoltativo): `route` per il routing normale (l’assenza di type equivale a route), `acp` per binding ACP persistenti delle conversazioni.
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
5. `match.accountId: "*"` (esteso a tutto il canale)
6. Agent predefinito

All’interno di ogni livello, vince la prima voce `bindings` corrispondente.

Per le voci `type: "acp"`, OpenClaw risolve in base all’identità esatta della conversazione (`match.channel` + account + `match.peer.id`) e non usa l’ordine a livelli del route binding sopra.

### Profili di accesso per-agent

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

Vedi [Multi-Agent Sandbox & Tools](/it/tools/multi-agent-sandbox-tools) per i dettagli sulla precedenza.

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
      resetArchiveRetention: "30d", // durata oppure false
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
  - `per-sender` (predefinito): ogni mittente ottiene una sessione isolata all’interno di un contesto di canale.
  - `global`: tutti i partecipanti in un contesto di canale condividono un’unica sessione (usalo solo quando è previsto un contesto condiviso).
- **`dmScope`**: come vengono raggruppati i DM.
  - `main`: tutti i DM condividono la sessione principale.
  - `per-peer`: isola per ID mittente tra i canali.
  - `per-channel-peer`: isola per canale + mittente (consigliato per inbox multiutente).
  - `per-account-channel-peer`: isola per account + canale + mittente (consigliato per multi-account).
- **`identityLinks`**: mappa gli ID canonici ai peer con prefisso provider per la condivisione delle sessioni tra canali.
- **`reset`**: criterio di reset principale. `daily` esegue il reset a `atHour` ora locale; `idle` esegue il reset dopo `idleMinutes`. Quando entrambi sono configurati, prevale quello che scade per primo.
- **`resetByType`**: override per tipo (`direct`, `group`, `thread`). Il legacy `dm` è accettato come alias di `direct`.
- **`parentForkMaxTokens`**: numero massimo di `totalTokens` della sessione padre consentito quando si crea una sessione thread forked (predefinito `100000`).
  - Se `totalTokens` del padre è superiore a questo valore, OpenClaw avvia una nuova sessione thread invece di ereditare la cronologia del transcript del padre.
  - Imposta `0` per disabilitare questo guardrail e consentire sempre il fork dal padre.
- **`mainKey`**: campo legacy. Il runtime usa sempre `"main"` per il bucket principale delle chat dirette.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta reciproca tra agent durante gli scambi agent-to-agent (intero, intervallo: `0`–`5`). `0` disabilita la catena ping-pong.
- **`sendPolicy`**: corrispondenza per `channel`, `chatType` (`direct|group|channel`, con alias legacy `dm`), `keyPrefix` o `rawKeyPrefix`. Il primo deny ha la precedenza.
- **`maintenance`**: controlli di pulizia + retention dell’archivio sessioni.
  - `mode`: `warn` emette solo avvisi; `enforce` applica la pulizia.
  - `pruneAfter`: soglia temporale per le voci obsolete (predefinito `30d`).
  - `maxEntries`: numero massimo di voci in `sessions.json` (predefinito `500`).
  - `rotateBytes`: ruota `sessions.json` quando supera questa dimensione (predefinito `10mb`).
  - `resetArchiveRetention`: retention per gli archivi transcript `*.reset.<timestamp>`. Per impostazione predefinita usa `pruneAfter`; imposta `false` per disabilitarla.
  - `maxDiskBytes`: budget disco facoltativo della directory sessioni. In modalità `warn` registra avvisi; in modalità `enforce` rimuove prima gli artifact/sessioni più vecchi.
  - `highWaterBytes`: target facoltativo dopo la pulizia del budget. Per impostazione predefinita è l’`80%` di `maxDiskBytes`.
- **`threadBindings`**: valori predefiniti globali per le funzionalità di sessione associate ai thread.
  - `enabled`: interruttore predefinito principale (i provider possono sovrascriverlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus predefinito per inattività in ore (`0` disabilita; i provider possono sovrascriverlo)
  - `maxAgeHours`: età massima rigida predefinita in ore (`0` disabilita; i provider possono sovrascriverla)

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

| Variabile         | Descrizione            | Esempio                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nome breve del modello | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore completo del modello | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome del provider      | `anthropic`                 |
| `{thinkingLevel}` | Livello di thinking corrente | `high`, `low`, `off`        |
| `{identity.name}` | Nome identità agent    | (uguale a `"auto"`)         |

Le variabili non distinguono tra maiuscole e minuscole. `{think}` è un alias di `{thinkingLevel}`.

### Reazione di ack

- Per impostazione predefinita usa `identity.emoji` dell’agent attivo, altrimenti `"👀"`. Imposta `""` per disabilitare.
- Override per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → fallback dell’identità.
- Scope: `group-mentions` (predefinito), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: rimuove l’ack dopo la risposta su Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: abilita le reazioni di stato del ciclo di vita su Slack, Discord e Telegram.
  Su Slack e Discord, se non impostato mantiene abilitate le reazioni di stato quando le reazioni ack sono attive.
  Su Telegram, impostalo esplicitamente su `true` per abilitare le reazioni di stato del ciclo di vita.

### Debounce in entrata

Raggruppa i rapidi messaggi solo testo dello stesso mittente in un unico turno agent. I media/allegati forzano lo svuotamento immediato. I comandi di controllo bypassano il debounce.

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

- `auto` controlla la modalità auto-TTS predefinita: `off`, `always`, `inbound` o `tagged`. `/tts on|off` può sovrascrivere le preferenze locali e `/tts status` mostra lo stato effettivo.
- `summaryModel` sovrascrive `agents.defaults.model.primary` per l’auto-summary.
- `modelOverrides` è abilitato per impostazione predefinita; `modelOverrides.allowProvider` è per impostazione predefinita `false` (opt-in).
- Le chiavi API usano come fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- `openai.baseUrl` sovrascrive l’endpoint TTS OpenAI. L’ordine di risoluzione è config, poi `OPENAI_TTS_BASE_URL`, poi `https://api.openai.com/v1`.
- Quando `openai.baseUrl` punta a un endpoint non OpenAI, OpenClaw lo tratta come un server TTS compatibile OpenAI e allenta la convalida di modello/voce.

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
- Le chiavi Talk flat legacy (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sono solo per compatibilità e vengono migrate automaticamente in `talk.providers.<provider>`.
- Gli ID voce usano come fallback `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` accetta stringhe in chiaro o oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna chiave API Talk.
- `providers.*.voiceAliases` consente alle direttive Talk di usare nomi descrittivi.
- `silenceTimeoutMs` controlla per quanto tempo la modalità Talk attende dopo il silenzio dell’utente prima di inviare la trascrizione. Se non impostato, mantiene la finestra di pausa predefinita della piattaforma (`700 ms su macOS e Android, 900 ms su iOS`).

---

## Strumenti

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima di `tools.allow`/`tools.deny`:

L’onboarding locale imposta per default le nuove configurazioni locali su `tools.profile: "coding"` quando non è impostato (i profili espliciti esistenti vengono preservati).

| Profilo     | Include                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | solo `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                   |

### Gruppi di strumenti

| Gruppo             | Strumenti                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` è accettato come alias di `exec`)                                            |
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

Criterio globale di allow/deny degli strumenti (deny ha la precedenza). Non distingue tra maiuscole e minuscole, supporta wildcard `*`. Si applica anche quando il sandbox Docker è disattivato.

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

Controlla l’accesso exec elevato fuori dal sandbox:

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

- L’override per-agent (`agents.list[].tools.elevated`) può solo restringere ulteriormente.
- `/elevated on|off|ask|full` memorizza lo stato per sessione; le direttive inline si applicano a un singolo messaggio.
- `exec` elevato bypassa il sandbox e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando il target exec è `node`).

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
Le impostazioni possono essere definite globalmente in `tools.loopDetection` e sovrascritte per-agent in `agents.list[].tools.loopDetection`.

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

- `historySize`: cronologia massima delle chiamate agli strumenti conservata per l’analisi dei loop.
- `warningThreshold`: soglia dei pattern ripetuti senza progresso per gli avvisi.
- `criticalThreshold`: soglia più alta di ripetizione per bloccare i loop critici.
- `globalCircuitBreakerThreshold`: soglia di arresto rigido per qualunque esecuzione senza progresso.
- `detectors.genericRepeat`: avvisa su chiamate ripetute stesso strumento/stessi argomenti.
- `detectors.knownPollNoProgress`: avvisa/blocca gli strumenti di polling noti (`process.poll`, `command_status`, ecc.).
- `detectors.pingPong`: avvisa/blocca i pattern di coppia alternata senza progresso.
- Se `warningThreshold >= criticalThreshold` oppure `criticalThreshold >= globalCircuitBreakerThreshold`, la convalida fallisce.

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
        provider: "firecrawl", // facoltativo; ometti per il rilevamento automatico
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
      asyncCompletion: {
        directSend: false, // opt-in: invia direttamente al canale il risultato finale asincrono di musica/video
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

<Accordion title="Campi delle voci di modello media">

**Voce provider** (`type: "provider"` o omesso):

- `provider`: ID provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, ecc.)
- `model`: override dell’ID modello
- `profile` / `preferredProfile`: selezione del profilo `auth-profiles.json`

**Voce CLI** (`type: "cli"`):

- `command`: eseguibile da eseguire
- `args`: argomenti templateizzati (supporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, ecc.)

**Campi comuni:**

- `capabilities`: elenco facoltativo (`image`, `audio`, `video`). Valori predefiniti: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per voce.
- In caso di errore, si passa alla voce successiva.

L’autenticazione del provider segue l’ordine standard: `auth-profiles.json` → variabili env → `models.providers.*.apiKey`.

**Campi di completamento asincrono:**

- `asyncCompletion.directSend`: quando `true`, i task asincroni completati `music_generate`
  e `video_generate` provano prima la consegna diretta sul canale. Predefinito: `false`
  (percorso legacy di riattivazione della sessione richiedente/consegna del modello).

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

Controlla quali sessioni possono essere usate come target dagli strumenti di sessione (`sessions_list`, `sessions_history`, `sessions_send`).

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
- `agent`: qualunque sessione appartenente all’ID agent corrente (può includere altri utenti se esegui sessioni per-sender sotto lo stesso ID agent).
- `all`: qualunque sessione. Il targeting cross-agent richiede comunque `tools.agentToAgent`.
- Clamp sandbox: quando la sessione corrente è sandboxed e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilità viene forzata a `tree` anche se `tools.sessions.visibility="all"`.

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
        retainOnSessionKeep: false, // conserva gli allegati quando cleanup="keep"
      },
    },
  },
}
```

Note:

- Gli allegati sono supportati solo per `runtime: "subagent"`. Il runtime ACP li rifiuta.
- I file vengono materializzati nella workspace figlia in `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
- Il contenuto degli allegati viene automaticamente redatto dalla persistenza del transcript.
- Gli input Base64 vengono convalidati con controlli rigorosi su alfabeto/padding e una protezione sulla dimensione prima della decodifica.
- I permessi dei file sono `0700` per le directory e `0600` per i file.
- La pulizia segue il criterio `cleanup`: `delete` rimuove sempre gli allegati; `keep` li conserva solo quando `retainOnSessionKeep: true`.

### `tools.experimental`

Flag sperimentali per strumenti built-in. Disattivati per impostazione predefinita salvo quando si applica una regola di auto-abilitazione GPT-5 strict-agentic.

```json5
{
  tools: {
    experimental: {
      planTool: true, // abilita l’update_plan sperimentale
    },
  },
}
```

Note:

- `planTool`: abilita lo strumento strutturato `update_plan` per il tracciamento di lavori non banali in più fasi.
- Predefinito: `false` a meno che `agents.defaults.embeddedPi.executionContract` (o un override per-agent) sia impostato su `"strict-agentic"` per un’esecuzione OpenAI o OpenAI Codex della famiglia GPT-5. Imposta `true` per forzare l’attivazione dello strumento fuori da tale ambito, oppure `false` per mantenerlo disattivato anche nelle esecuzioni GPT-5 strict-agentic.
- Quando abilitato, il prompt di sistema aggiunge anche indicazioni d’uso così il modello lo utilizza solo per lavori sostanziali e mantiene al massimo una fase `in_progress`.

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
- `allowAgents`: allowlist predefinita degli ID agent target per `sessions_spawn` quando l’agent richiedente non imposta il proprio `subagents.allowAgents` (`["*"]` = qualunque; predefinito: solo lo stesso agent).
- `runTimeoutSeconds`: timeout predefinito (secondi) per `sessions_spawn` quando la chiamata dello strumento omette `runTimeoutSeconds`. `0` significa nessun timeout.
- Criterio strumenti per-subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider personalizzati e URL base

OpenClaw usa il catalogo built-in dei modelli. Aggiungi provider personalizzati tramite `models.providers` nella configurazione o `~/.openclaw/agents/<agentId>/agent/models.json`.

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
- Sovrascrivi la radice della configurazione agent con `OPENCLAW_AGENT_DIR` (oppure `PI_CODING_AGENT_DIR`, alias legacy della variabile d’ambiente).
- Precedenza di unione per ID provider corrispondenti:
  - I valori `baseUrl` non vuoti di `models.json` dell’agent hanno la precedenza.
  - I valori `apiKey` non vuoti dell’agent hanno la precedenza solo quando quel provider non è gestito da SecretRef nel contesto corrente di config/auth-profile.
  - I valori `apiKey` del provider gestiti da SecretRef vengono aggiornati dai marker di origine (`ENV_VAR_NAME` per i riferimenti env, `secretref-managed` per i riferimenti file/exec) invece di persistere i secret risolti.
  - I valori header del provider gestiti da SecretRef vengono aggiornati dai marker di origine (`secretref-env:ENV_VAR_NAME` per i riferimenti env, `secretref-managed` per i riferimenti file/exec).
  - `apiKey`/`baseUrl` dell’agent vuoti o mancanti usano come fallback `models.providers` nella configurazione.
  - I valori `contextWindow`/`maxTokens` dei modelli corrispondenti usano il valore più alto tra la configurazione esplicita e i valori impliciti del catalogo.
  - I valori `contextTokens` dei modelli corrispondenti preservano un limite runtime esplicito quando presente; usalo per limitare il contesto effettivo senza cambiare i metadati nativi del modello.
  - Usa `models.mode: "replace"` quando vuoi che la configurazione riscriva completamente `models.json`.
  - La persistenza dei marker è autorevole rispetto alla sorgente: i marker vengono scritti dallo snapshot di configurazione attiva della sorgente (pre-risoluzione), non dai valori secret risolti a runtime.

### Dettagli dei campi del provider

- `models.mode`: comportamento del catalogo provider (`merge` oppure `replace`).
- `models.providers`: mappa dei provider personalizzati con chiave provider id.
- `models.providers.*.api`: adattatore di richiesta (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, ecc.).
- `models.providers.*.apiKey`: credenziale del provider (preferisci SecretRef/sostituzione env).
- `models.providers.*.auth`: strategia di autenticazione (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: per Ollama + `openai-completions`, inietta `options.num_ctx` nelle richieste (predefinito: `true`).
- `models.providers.*.authHeader`: forza il trasporto della credenziale nell’header `Authorization` quando richiesto.
- `models.providers.*.baseUrl`: URL base dell’API upstream.
- `models.providers.*.headers`: header statici aggiuntivi per il routing proxy/tenant.
- `models.providers.*.request`: override di trasporto per le richieste HTTP del model-provider.
  - `request.headers`: header aggiuntivi (uniti ai valori predefiniti del provider). I valori accettano SecretRef.
  - `request.auth`: override della strategia di autenticazione. Modalità: `"provider-default"` (usa l’autenticazione built-in del provider), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` facoltativo).
  - `request.proxy`: override del proxy HTTP. Modalità: `"env-proxy"` (usa le variabili env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Entrambe le modalità accettano un sotto-oggetto `tls` facoltativo.
  - `request.tls`: override TLS per connessioni dirette. Campi: `ca`, `cert`, `key`, `passphrase` (tutti accettano SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: quando `true`, consente HTTPS verso `baseUrl` quando il DNS risolve verso intervalli privati, CGNAT o simili, tramite la protezione HTTP fetch SSRF del provider (opt-in dell’operatore per endpoint OpenAI-compatibili self-hosted affidabili). WebSocket usa lo stesso `request` per header/TLS ma non quella protezione fetch SSRF. Predefinito `false`.
- `models.providers.*.models`: voci esplicite del catalogo modelli del provider.
- `models.providers.*.models.*.contextWindow`: metadati nativi della finestra di contesto del modello.
- `models.providers.*.models.*.contextTokens`: limite runtime facoltativo del contesto. Usalo quando vuoi un budget di contesto effettivo più piccolo del `contextWindow` nativo del modello.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: hint di compatibilità facoltativo. Per `api: "openai-completions"` con `baseUrl` non vuoto e non nativo (host diverso da `api.openai.com`), OpenClaw lo forza a `false` a runtime. Un `baseUrl` vuoto/omesso mantiene il comportamento OpenAI predefinito.
- `models.providers.*.models.*.compat.requiresStringContent`: hint di compatibilità facoltativo per endpoint chat OpenAI-compatibili che accettano solo stringhe. Quando `true`, OpenClaw appiattisce gli array puramente testuali `messages[].content` in stringhe semplici prima di inviare la richiesta.
- `plugins.entries.amazon-bedrock.config.discovery`: radice delle impostazioni di auto-discovery di Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: attiva/disattiva il discovery implicito.
- `plugins.entries.amazon-bedrock.config.discovery.region`: regione AWS per il discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro facoltativo provider-id per discovery mirato.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervallo di polling per l’aggiornamento del discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: finestra di contesto di fallback per i modelli rilevati.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token massimi di output di fallback per i modelli rilevati.

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

Imposta `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`). Usa riferimenti `opencode/...` per il catalogo Zen o riferimenti `opencode-go/...` per il catalogo Go. Scorciatoia: `openclaw onboard --auth-choice opencode-zen` oppure `openclaw onboard --auth-choice opencode-go`.

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
- Per l’endpoint generale, definisci un provider personalizzato con l’override del base URL.

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

Per l’endpoint China: `baseUrl: "https://api.moonshot.cn/v1"` oppure `openclaw onboard --auth-choice moonshot-api-key-cn`.

Gli endpoint Moonshot nativi dichiarano la compatibilità d’uso dello streaming sul trasporto condiviso
`openai-completions`, e OpenClaw basa questo comportamento sulle capacità dell’endpoint
anziché solo sull’ID provider built-in.

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
Il catalogo modelli usa per impostazione predefinita solo M2.7.
Sul percorso streaming compatibile con Anthropic, OpenClaw disabilita il thinking di MiniMax
per impostazione predefinita a meno che tu non imposti esplicitamente `thinking`. `/fast on` oppure
`params.fastMode: true` riscrive `MiniMax-M2.7` in
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelli locali (LM Studio)">

Vedi [Local Models](/it/gateway/local-models). In breve: esegui un grande modello locale tramite LM Studio Responses API su hardware adeguato; mantieni uniti i modelli hosted per il fallback.

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

- `allowBundled`: allowlist facoltativa solo per le Skills bundled (le Skills managed/workspace non sono influenzate).
- `load.extraDirs`: radici condivise aggiuntive per le Skills (precedenza più bassa).
- `install.preferBrew`: quando è true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di passare ad altri tipi di installer.
- `install.nodeManager`: preferenza dell’installer node per le specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` disabilita una Skills anche se bundled/installata.
- `entries.<skillKey>.apiKey`: comodità per le Skills che dichiarano una variabile env primaria (stringa in chiaro o oggetto SecretRef).

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

- Caricati da `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, più `plugins.load.paths`.
- Il discovery accetta Plugin OpenClaw nativi più bundle Codex compatibili e bundle Claude, inclusi i bundle Claude senza manifest con layout predefinito.
- **Le modifiche alla configurazione richiedono un riavvio del gateway.**
- `allow`: allowlist facoltativa (vengono caricati solo i plugin elencati). `deny` ha la precedenza.
- `plugins.entries.<id>.apiKey`: campo di comodità a livello plugin per chiavi API (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa delle variabili env con ambito plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, il core blocca `before_prompt_build` e ignora i campi legacy che mutano il prompt da `before_agent_start`, preservando comunque i legacy `modelOverride` e `providerOverride`. Si applica agli hook dei plugin nativi e alle directory hook fornite dai bundle supportati.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente affidabile questo plugin per richiedere override per-esecuzione di `provider` e `model` per esecuzioni subagent in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist facoltativa di target canonici `provider/model` per override affidabili dei subagent. Usa `"*"` solo quando vuoi intenzionalmente consentire qualunque modello.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (convalidato dallo schema del Plugin OpenClaw nativo quando disponibile).
- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider web-fetch Firecrawl.
  - `apiKey`: chiave API Firecrawl (accetta SecretRef). Usa come fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, il legacy `tools.web.fetch.firecrawl.apiKey` o la variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base dell’API Firecrawl (predefinito: `https://api.firecrawl.dev`).
  - `onlyMainContent`: estrae solo il contenuto principale delle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scraping in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad es. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di Dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: interruttore principale di Dreaming (predefinito `false`).
  - `frequency`: cadenza Cron per ogni sweep completo di Dreaming (predefinito `"0 3 * * *"`).
  - il criterio di fase e le soglie sono dettagli di implementazione (non chiavi di configurazione rivolte all’utente).
- La configurazione completa della memoria si trova in [Riferimento della configurazione della memoria](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin bundle Claude abilitati possono anche contribuire con valori predefiniti embedded Pi da `settings.json`; OpenClaw li applica come impostazioni agent sanificate, non come patch raw della configurazione OpenClaw.
- `plugins.slots.memory`: scegli l’ID del plugin memoria attivo oppure `"none"` per disabilitare i plugin memoria.
- `plugins.slots.contextEngine`: scegli l’ID del plugin context engine attivo; il valore predefinito è `"legacy"` a meno che tu non installi e selezioni un altro motore.
- `plugins.installs`: metadati di installazione gestiti dalla CLI usati da `openclaw plugins update`.
  - Include `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Tratta `plugins.installs.*` come stato gestito; preferisci i comandi CLI alle modifiche manuali.

Vedi [Plugins](/it/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt-in solo per accesso affidabile a reti private
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
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando intendi fidarti esplicitamente della navigazione del browser su reti private.
- In modalità rigorosa, gli endpoint del profilo CDP remoto (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco delle reti private durante i controlli di raggiungibilità/discovery.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo attach-only (start/stop/reset disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw rilevi `/json/version`; usa WS(S)
  quando il provider ti fornisce un URL WebSocket DevTools diretto.
- I profili `existing-session` sono solo host e usano Chrome MCP invece di CDP.
- I profili `existing-session` possono impostare `userDataDir` per puntare a un profilo
  specifico di browser basato su Chromium come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti del percorso Chrome MCP:
  azioni guidate da snapshot/ref invece del targeting tramite selettori CSS, hook di upload
  a file singolo, nessun override del timeout per dialog, nessun `wait --load networkidle` e nessuna
  `responsebody`, esportazione PDF, intercettazione dei download o azioni batch.
- I profili locali gestiti `openclaw` assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  esplicitamente `cdpUrl` solo per CDP remoto.
- Ordine di auto-rilevamento: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinito `18791`).
- `extraArgs` aggiunge flag di avvio extra all’avvio locale di Chromium (ad esempio
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

- `seamColor`: colore di accento per la UI chrome dell’app nativa (tinta del fumetto Talk Mode, ecc.).
- `assistant`: override dell’identità della UI di controllo. Usa come fallback l’identità dell’agent attivo.

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
      // allowExternalEmbedUrls: false, // pericoloso: consente URL embed http(s) esterni assoluti
      // allowedOrigins: ["https://control.example.com"], // richiesto per UI di controllo non loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // pericolosa modalità di fallback origine tramite header Host
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

<Accordion title="Dettagli dei campi del Gateway">

- `mode`: `local` (esegue il gateway) oppure `remote` (si connette a un gateway remoto). Il Gateway rifiuta di avviarsi se non è `local`.
- `port`: singola porta multiplexata per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) oppure `custom`.
- **Alias bind legacy**: usa i valori di modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` ascolta su `127.0.0.1` all’interno del container. Con il networking bridge di Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il gateway non è raggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Auth**: richiesta per impostazione predefinita. I bind non loopback richiedono l’autenticazione del gateway. In pratica questo significa un token/password condiviso oppure un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`. Per impostazione predefinita, la procedura guidata di onboarding genera un token.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi SecretRef), imposta esplicitamente `gateway.auth.mode` su `token` o `password`. I flussi di avvio e di installazione/riparazione del servizio falliscono quando entrambi sono configurati e la modalità non è impostata.
- `gateway.auth.mode: "none"`: modalità esplicita senza autenticazione. Usala solo per configurazioni affidabili di local loopback; intenzionalmente non è proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l’autenticazione a un reverse proxy identity-aware e si fida degli header di identità da `gateway.trustedProxies` (vedi [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth)). Questa modalità si aspetta una sorgente proxy **non loopback**; i reverse proxy loopback sullo stesso host non soddisfano l’autenticazione trusted-proxy.
- `gateway.auth.allowTailscale`: quando è `true`, gli header di identità di Tailscale Serve possono soddisfare l’autenticazione della UI di controllo/WebSocket (verificata tramite `tailscale whois`). Gli endpoint HTTP API **non** usano quell’autenticazione header Tailscale; seguono invece la normale modalità auth HTTP del gateway. Questo flusso senza token presuppone che l’host del gateway sia affidabile. Il valore predefinito è `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limiter facoltativo dei tentativi auth falliti. Si applica per IP client e per ambito auth (secret condiviso e token dispositivo sono tracciati indipendentemente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Sul percorso async Tailscale Serve Control UI, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura del fallimento. Tentativi errati concorrenti dallo stesso client possono quindi attivare il limiter sulla seconda richiesta invece di passare entrambi come semplici mismatch.
  - `gateway.auth.rateLimit.exemptLoopback` è per impostazione predefinita `true`; impostalo su `false` quando vuoi intenzionalmente limitare anche il traffico localhost (per configurazioni di test o deployment proxy rigorosi).
- I tentativi di autenticazione WS originati dal browser sono sempre soggetti a throttling con l’esenzione loopback disabilitata (difesa in profondità contro la forza bruta localhost basata su browser).
- Su loopback, quei lockout originati dal browser sono isolati per valore `Origin`
  normalizzato, quindi fallimenti ripetuti da un’origine localhost non bloccano automaticamente
  un’altra origine.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) oppure `funnel` (pubblico, richiede auth).
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per le connessioni WebSocket del Gateway. Richiesta quando sono previsti client browser da origini non loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback dell’origine tramite header Host per deployment che si basano intenzionalmente su tale criterio.
- `remote.transport`: `ssh` (predefinito) oppure `direct` (ws/wss). Per `direct`, `remote.url` deve essere `ws://` oppure `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass lato client che consente `ws://` in chiaro verso IP di rete privata affidabili; il valore predefinito resta solo loopback per il traffico in chiaro.
- `gateway.remote.token` / `.password` sono campi credenziali del client remoto. Da soli non configurano l’autenticazione del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base del relay APNs esterno usato dalle build iOS ufficiali/TestFlight dopo che pubblicano registrazioni supportate dal relay sul gateway. Questo URL deve corrispondere all’URL relay compilato nella build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout in millisecondi per l’invio dal gateway al relay. Predefinito: `10000`.
- Le registrazioni supportate dal relay sono delegate a una specifica identità gateway. L’app iOS associata recupera `gateway.identity.get`, include tale identità nella registrazione relay e inoltra al gateway una grant di invio con ambito registrazione. Un altro gateway non può riutilizzare quella registrazione memorizzata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch solo sviluppo per URL relay HTTP loopback. Gli URL relay di produzione devono restare su HTTPS.
- `gateway.channelHealthCheckMinutes`: intervallo del monitor di salute dei canali in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitor di salute. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia in minuti per socket stale. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitor di salute per canale/account in un’ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dai riavvii del monitor di salute mantenendo il monitor globale abilitato.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per-account per i canali multi-account. Quando impostato, ha la precedenza sull’override a livello canale.
- I percorsi di chiamata del gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modalità fail-closed (nessun fallback remoto che mascheri il problema).
- `trustedProxies`: IP dei reverse proxy che terminano TLS o iniettano header client inoltrati. Elenca solo proxy sotto il tuo controllo. Le voci loopback restano valide per configurazioni di rilevamento locale/proxy sullo stesso host (ad esempio Tailscale Serve o un reverse proxy locale), ma **non** rendono le richieste loopback idonee a `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, il gateway accetta `X-Real-IP` se `X-Forwarded-For` è assente. Predefinito `false` per comportamento fail-closed.
- `gateway.tools.deny`: nomi di strumenti aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende la deny list predefinita).
- `gateway.tools.allow`: rimuove nomi di strumenti dalla deny list HTTP predefinita.

</Accordion>

### Endpoint compatibili con OpenAI

- Chat Completions: disabilitato per impostazione predefinita. Abilitalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Hardening dell’input URL di Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote sono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero via URL.
- Header facoltativo di hardening della risposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (impostalo solo per origini HTTPS sotto il tuo controllo; vedi [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multi-instance

Esegui più gateway su un host con porte e directory di stato univoche:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag di comodo: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Vedi [Multiple Gateways](/it/gateway/multiple-gateways).

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
- `autoGenerate`: genera automaticamente una coppia cert/key locale self-signed quando non sono configurati file espliciti; solo per uso locale/dev.
- `certPath`: percorso filesystem del file del certificato TLS.
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

- `mode`: controlla come vengono applicate a runtime le modifiche di configurazione.
  - `"off"`: ignora le modifiche live; i cambiamenti richiedono un riavvio esplicito.
  - `"restart"`: riavvia sempre il processo gateway a ogni modifica di configurazione.
  - `"hot"`: applica i cambiamenti in-process senza riavvio.
  - `"hybrid"` (predefinito): prova prima l’hot reload; se necessario torna al riavvio.
- `debounceMs`: finestra di debounce in ms prima dell’applicazione delle modifiche di configurazione (intero non negativo).
- `deferralTimeoutMs`: tempo massimo in ms per attendere il completamento delle operazioni in corso prima di forzare un riavvio (predefinito: `300000` = 5 minuti).

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
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
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
- `hooks.token` deve essere **distinto** da `gateway.auth.token`; il riutilizzo del token Gateway viene rifiutato.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, vincola `hooks.allowedSessionKeyPrefixes` (ad esempio `["hook:"]`).

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta è accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`

<Accordion title="Dettagli delle mapping">

- `match.path` corrisponde al sottopercorso dopo `/hooks` (ad esempio `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per i percorsi generici.
- I template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un’azione hook.
  - `transform.module` deve essere un percorso relativo e restare all’interno di `hooks.transformsDir` (i percorsi assoluti e il traversal vengono rifiutati).
- `agentId` instrada a un agent specifico; gli ID sconosciuti usano come fallback quello predefinito.
- `allowedAgentIds`: limita il routing esplicito (`*` o omesso = consenti tutti, `[]` = nega tutti).
- `defaultSessionKey`: chiave di sessione fissa facoltativa per le esecuzioni hook agent senza `sessionKey` esplicita.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist facoltativa di prefissi per i valori espliciti di `sessionKey` (richiesta + mapping), ad esempio `["hook:"]`.
- `deliver: true` invia la risposta finale a un canale; `channel` usa come predefinito `last`.
- `model` sovrascrive l’LLM per questa esecuzione hook (deve essere consentito se è impostato il catalogo modelli).

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

- Il Gateway avvia automaticamente `gog gmail watch serve` al boot quando è configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitarlo.
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

- Serve HTML/CSS/JS modificabili dall’agent e A2UI via HTTP sotto la porta del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo locale: mantieni `gateway.bind: "loopback"` (predefinito).
- Bind non loopback: le route canvas richiedono l’autenticazione del Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- I Node WebView in genere non inviano header auth; dopo che un node è associato e connesso, il Gateway pubblicizza URL capability con ambito node per l’accesso a canvas/A2UI.
- Gli URL capability sono associati alla sessione WS attiva del node e scadono rapidamente. Non viene usato il fallback basato su IP.
- Inietta il client live-reload nell’HTML servito.
- Crea automaticamente un `index.html` iniziale quando è vuoto.
- Serve anche A2UI in `/__openclaw__/a2ui/`.
- Le modifiche richiedono un riavvio del gateway.
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
- L’hostname predefinito è `openclaw`. Sovrascrivilo con `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast in `~/.openclaw/dns/`. Per il discovery cross-network, abbinala a un server DNS (CoreDNS consigliato) + DNS split Tailscale.

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

- Le variabili env inline vengono applicate solo se nel processo env manca la chiave.
- File `.env`: `.env` della CWD + `~/.openclaw/.env` (nessuno dei due sovrascrive le variabili esistenti).
- `shellEnv`: importa le chiavi mancanti previste dal profilo della tua shell di login.
- Vedi [Environment](/it/help/environment) per la precedenza completa.

### Sostituzione di variabili env

Fai riferimento alle variabili env in qualunque stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Vengono riconosciuti solo i nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`.
- Variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Effettua l’escape con `$${VAR}` per un `${VAR}` letterale.
- Funziona con `$include`.

---

## Secret

I ref dei secret sono additivi: i valori in chiaro continuano a funzionare.

### `SecretRef`

Usa una sola forma oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Convalida:

- pattern `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- pattern id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: puntatore JSON assoluto (ad esempio `"/providers/openai/apiKey"`)
- pattern id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- gli id `source: "exec"` non devono contenere segmenti di percorso `.` o `..` separati da slash (ad esempio `a/../b` viene rifiutato)

### Superficie credenziali supportata

- Matrice canonica: [SecretRef Credential Surface](/it/reference/secretref-credential-surface)
- `secrets apply` ha come target i percorsi credenziali supportati in `openclaw.json`.
- I ref di `auth-profiles.json` sono inclusi nella risoluzione runtime e nella copertura di audit.

### Configurazione dei provider secret

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
- Per impostazione predefinita, i percorsi dei comandi symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire percorsi symlink con convalida del percorso target risolto.
- Se `trustedDirs` è configurato, il controllo trusted-dir si applica al percorso target risolto.
- L’ambiente figlio `exec` è minimo per impostazione predefinita; passa esplicitamente le variabili richieste con `passEnv`.
- I ref dei secret vengono risolti al momento dell’attivazione in uno snapshot in memoria, poi i percorsi di richiesta leggono solo quello snapshot.
- Il filtro della superficie attiva si applica durante l’attivazione: i ref irrisolti su superfici abilitate fanno fallire avvio/reload, mentre le superfici inattive vengono saltate con diagnostica.

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

- I profili per-agent sono archiviati in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` supporta ref a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per modalità di credenziali statiche.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali auth-profile basate su SecretRef.
- Le credenziali runtime statiche provengono da snapshot risolti in memoria; le voci statiche legacy `auth.json` vengono ripulite quando rilevate.
- Le importazioni OAuth legacy provengono da `~/.openclaw/credentials/oauth.json`.
- Vedi [OAuth](/it/concepts/oauth).
- Comportamento runtime dei secret e strumenti `audit/configure/apply`: [Secrets Management](/it/gateway/secrets).

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

- `billingBackoffHours`: backoff base in ore quando un profilo fallisce a causa di veri errori
  di fatturazione/credito insufficiente (predefinito: `5`). Testi espliciti relativi alla fatturazione possono
  comunque finire qui anche su risposte `401`/`403`, ma i matcher testuali
  specifici del provider restano limitati al provider che li possiede (ad esempio OpenRouter
  `Key limit exceeded`). I messaggi retryable HTTP `402` relativi a finestre d’uso o
  limiti di spesa di organization/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override facoltativi per-provider per le ore di backoff di fatturazione.
- `billingMaxHours`: limite massimo in ore per la crescita esponenziale del backoff di fatturazione (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff base in minuti per errori `auth_permanent` ad alta confidenza (predefinito: `10`).
- `authPermanentMaxMinutes`: limite massimo in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: numero massimo di rotazioni dello stesso auth-profile provider per errori di overload prima di passare al fallback del modello (predefinito: `1`). Le forme provider-busy come `ModelNotReadyException` finiscono qui.
- `overloadedBackoffMs`: ritardo fisso prima di ritentare una rotazione di provider/profilo sovraccarico (predefinito: `0`).
- `rateLimitedProfileRotations`: numero massimo di rotazioni dello stesso auth-profile provider per errori di rate limit prima di passare al fallback del modello (predefinito: `1`). Quel bucket di rate limit include testo modellato dal provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

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
- `maxFileBytes`: dimensione massima del file di log in byte prima che le scritture vengano soppresse (intero positivo; predefinito: `524288000` = 500 MB). Usa la rotazione dei log esterna per i deployment di produzione.

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

- `enabled`: interruttore principale per l’output di strumentazione (predefinito: `true`).
- `flags`: array di stringhe flag che abilita output di log mirati (supporta wildcard come `"telegram.*"` oppure `"*"`).
- `stuckSessionWarnMs`: soglia di età in ms per emettere avvisi di sessione bloccata mentre una sessione resta nello stato di elaborazione.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`).
- `otel.endpoint`: URL del collector per l’esportazione OTel.
- `otel.protocol`: `"http/protobuf"` (predefinito) oppure `"grpc"`.
- `otel.headers`: header di metadati HTTP/gRPC aggiuntivi inviati con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilita l’esportazione di trace, metriche o log.
- `otel.sampleRate`: frequenza di campionamento delle trace `0`–`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `cacheTrace.enabled`: registra snapshot di cache trace per esecuzioni embedded (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per il JSONL di cache trace (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa è incluso nell’output di cache trace (tutti predefiniti: `true`).

---

## Aggiornamento

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
- `checkOnStart`: controlla gli aggiornamenti npm quando il gateway si avvia (predefinito: `true`).
- `auto.enabled`: abilita l’auto-aggiornamento in background per le installazioni del pacchetto (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell’applicazione automatica sul canale stable (predefinito: `6`; massimo: `168`).
- `auto.stableJitterHours`: finestra aggiuntiva in ore per distribuire gradualmente il rollout del canale stable (predefinito: `12`; massimo: `168`).
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

- `enabled`: feature gate globale ACP (predefinito: `false`).
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Imposta `false` per mantenere disponibili i comandi ACP bloccando però l’esecuzione.
- `backend`: ID backend runtime ACP predefinito (deve corrispondere a un Plugin runtime ACP registrato).
- `defaultAgent`: ID agent ACP target di fallback quando le generazioni non specificano un target esplicito.
- `allowedAgents`: allowlist degli ID agent consentiti per le sessioni runtime ACP; vuoto significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush inattivo in ms per il testo streamato.
- `stream.maxChunkChars`: dimensione massima del chunk prima della suddivisione della proiezione del blocco streamato.
- `stream.repeatSuppression`: sopprime per turno righe ripetute di stato/strumenti (predefinito: `true`).
- `stream.deliveryMode`: `"live"` invia in streaming incrementale; `"final_only"` bufferizza fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi di strumenti nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: numero massimo di caratteri di output assistant proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: numero massimo di caratteri per righe proiettate di stato/aggiornamento ACP.
- `stream.tagVisibility`: record dai nomi dei tag agli override booleani di visibilità per gli eventi streamati.
- `runtime.ttlMinutes`: TTL di inattività in minuti per i worker di sessione ACP prima che possano essere ripuliti.
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
  - `"random"` (predefinito): tagline a rotazione divertenti/stagionali.
  - `"default"`: tagline neutra fissa (`All your chats, one OpenClaw.`).
  - `"off"`: nessun testo tagline (restano comunque mostrati titolo/versione del banner).
- Per nascondere l’intero banner (non solo le tagline), imposta la variabile env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadati scritti dai flussi CLI di configurazione guidata (`onboard`, `configure`, `doctor`):

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

## Identità

Vedi i campi identity di `agents.list` in [Valori predefiniti degli agent](#agent-defaults).

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
    webhook: "https://example.invalid/legacy", // fallback deprecato per i job salvati con notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token facoltativo per l’auth webhook in uscita
    sessionRetention: "24h", // stringa di durata oppure false
    runLog: {
      maxBytes: "2mb", // predefinito 2_000_000 byte
      keepLines: 2000, // predefinito 2000
    },
  },
}
```

- `sessionRetention`: per quanto tempo mantenere le sessioni completate delle esecuzioni Cron isolate prima del pruning da `sessions.json`. Controlla anche la pulizia dei transcript Cron eliminati archiviati. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: dimensione massima per file di log di esecuzione (`cron/runs/<jobId>.jsonl`) prima del pruning. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti mantenute quando viene attivato il pruning del run-log. Predefinito: `2000`.
- `webhookToken`: bearer token usato per la consegna POST del webhook Cron (`delivery.mode = "webhook"`); se omesso non viene inviato alcun header auth.
- `webhook`: URL webhook legacy deprecato (http/https) usato solo per i job salvati che hanno ancora `notify: true`.

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

- `maxAttempts`: numero massimo di retry per i job one-shot su errori transitori (predefinito: `3`; intervallo: `0`–`10`).
- `backoffMs`: array di ritardi di backoff in ms per ciascun tentativo di retry (predefinito: `[30000, 60000, 300000]`; 1–10 voci).
- `retryOn`: tipi di errore che attivano i retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Ometti per ritentare tutti i tipi transitori.

Si applica solo ai job Cron one-shot. I job ricorrenti usano una gestione dei guasti separata.

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

- `enabled`: abilita gli avvisi di errore per i job Cron (predefinito: `false`).
- `after`: numero di errori consecutivi prima che venga inviato un avviso (intero positivo, minimo: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso job (intero non negativo).
- `mode`: modalità di consegna — `"announce"` invia tramite un messaggio di canale; `"webhook"` esegue un POST verso il webhook configurato.
- `accountId`: ID account o canale facoltativo per limitare l’ambito della consegna dell’avviso.

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

- Destinazione predefinita per le notifiche di errore Cron per tutti i job.
- `mode`: `"announce"` oppure `"webhook"`; usa come predefinito `"announce"` quando esistono dati target sufficienti.
- `channel`: override del canale per la consegna announce. `"last"` riutilizza l’ultimo canale di consegna noto.
- `to`: target announce esplicito o URL webhook. Obbligatorio per la modalità webhook.
- `accountId`: override facoltativo dell’account per la consegna.
- `delivery.failureDestination` per-job sovrascrive questo valore predefinito globale.
- Quando né la destinazione di errore globale né quella per-job sono impostate, i job che già consegnano tramite `announce` usano come fallback quel target announce primario anche in caso di errore.
- `delivery.failureDestination` è supportato solo per job `sessionTarget="isolated"` a meno che il `delivery.mode` primario del job non sia `"webhook"`.

Vedi [Cron Jobs](/it/automation/cron-jobs). Le esecuzioni Cron isolate sono tracciate come [background tasks](/it/automation/tasks).

---

## Variabili template del modello media

Placeholder template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                     |
| ------------------ | ----------------------------------------------- |
| `{{Body}}`         | Corpo completo del messaggio in entrata         |
| `{{RawBody}}`      | Corpo raw (senza wrapper cronologia/mittente)   |
| `{{BodyStripped}}` | Corpo con le menzioni di gruppo rimosse         |
| `{{From}}`         | Identificatore del mittente                     |
| `{{To}}`           | Identificatore della destinazione               |
| `{{MessageSid}}`   | ID del messaggio del canale                     |
| `{{SessionId}}`    | UUID della sessione corrente                    |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione |
| `{{MediaUrl}}`     | Pseudo-URL del media in entrata                 |
| `{{MediaPath}}`    | Percorso locale del media                       |
| `{{MediaType}}`    | Tipo di media (image/audio/document/…)          |
| `{{Transcript}}`   | Trascrizione audio                              |
| `{{Prompt}}`       | Prompt media risolto per le voci CLI            |
| `{{MaxChars}}`     | Numero massimo di caratteri in output risolto per le voci CLI |
| `{{ChatType}}`     | `"direct"` oppure `"group"`                     |
| `{{GroupSubject}}` | Oggetto del gruppo (best effort)                |
| `{{GroupMembers}}` | Anteprima dei membri del gruppo (best effort)   |
| `{{SenderName}}`   | Nome visualizzato del mittente (best effort)    |
| `{{SenderE164}}`   | Numero di telefono del mittente (best effort)   |
| `{{Provider}}`     | Hint del provider (whatsapp, telegram, discord, ecc.) |

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

**Comportamento di unione:**

- File singolo: sostituisce l’oggetto contenitore.
- Array di file: deep-merge in ordine (i successivi sovrascrivono i precedenti).
- Chiavi sibling: unite dopo gli include (sovrascrivono i valori inclusi).
- Include annidati: fino a 10 livelli di profondità.
- Percorsi: risolti relativamente al file che include, ma devono restare all’interno della directory di configurazione di livello superiore (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo se si risolvono comunque all’interno di quel confine.
- Errori: messaggi chiari per file mancanti, errori di parsing e include circolari.

---

_Correlati: [Configuration](/it/gateway/configuration) · [Configuration Examples](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_
