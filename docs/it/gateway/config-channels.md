---
read_when:
    - Configurare un Plugin di canale (autenticazione, controllo degli accessi, multi-account)
    - Risolvere problemi delle chiavi di configurazione per canale
    - Verificare policy DM, policy dei gruppi o gating delle menzioni
summary: 'Configurazione dei canali: controllo degli accessi, pairing, chiavi per canale in Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri ancora'
title: Configurazione — canali
x-i18n:
    generated_at: "2026-04-24T08:39:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

Chiavi di configurazione per canale sotto `channels.*`. Copre accesso DM e gruppi,
configurazioni multi-account, gating delle menzioni e chiavi per canale per Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage e gli altri Plugin di canale inclusi.

Per agenti, strumenti, runtime del gateway e altre chiavi di primo livello, vedi
[Riferimento della configurazione](/it/gateway/configuration-reference).

## Canali

Ogni canale si avvia automaticamente quando esiste la sua sezione di configurazione (a meno che `enabled: false`).

### Accesso DM e gruppi

Tutti i canali supportano policy DM e policy di gruppo:

| Policy DM           | Comportamento                                                     |
| ------------------- | ----------------------------------------------------------------- |
| `pairing` (predefinito) | I mittenti sconosciuti ricevono un codice di pairing monouso; il proprietario deve approvare |
| `allowlist`         | Solo i mittenti in `allowFrom` (o archivio allow paired)          |
| `open`              | Consente tutti i DM in ingresso (richiede `allowFrom: ["*"]`)     |
| `disabled`          | Ignora tutti i DM in ingresso                                     |

| Policy di gruppo       | Comportamento                                          |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (predefinito) | Solo i gruppi che corrispondono all’allowlist configurata |
| `open`                 | Bypassa le allowlist di gruppo (il gating delle menzioni si applica comunque) |
| `disabled`             | Blocca tutti i messaggi di gruppo/stanza               |

<Note>
`channels.defaults.groupPolicy` imposta il valore predefinito quando `groupPolicy` di un provider non è impostato.
I codici di pairing scadono dopo 1 ora. Le richieste di pairing DM in sospeso sono limitate a **3 per canale**.
Se un blocco provider manca del tutto (`channels.<provider>` assente), la policy di gruppo a runtime usa come fallback `allowlist` (fail-closed) con un avviso all’avvio.
</Note>

### Override del modello per canale

Usa `channels.modelByChannel` per fissare ID canale specifici a un modello. I valori accettano `provider/model` oppure alias di modello configurati. La mappatura del canale si applica quando una sessione non ha già un override del modello (per esempio, impostato tramite `/model`).

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

Usa `channels.defaults` per comportamento condiviso di policy di gruppo e Heartbeat tra provider:

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

- `channels.defaults.groupPolicy`: policy di gruppo di fallback quando una `groupPolicy` a livello provider non è impostata.
- `channels.defaults.contextVisibility`: modalità di visibilità del contesto supplementare predefinita per tutti i canali. Valori: `all` (predefinito, include tutto il contesto citato/thread/cronologia), `allowlist` (include solo contesto da mittenti in allowlist), `allowlist_quote` (come allowlist ma mantiene il contesto esplicito di citazione/risposta). Override per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include stati dei canali sani nell’output Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: include stati degradati/di errore nell’output Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: rende un output Heartbeat compatto in stile indicatore.

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

- I comandi in uscita usano come predefinito l’account `default` se presente; altrimenti il primo ID account configurato (ordinato).
- L’opzionale `channels.whatsapp.defaultAccount` sostituisce quella selezione dell’account predefinito di fallback quando corrisponde a un ID account configurato.
- La directory di autenticazione legacy Baileys single-account viene migrata da `openclaw doctor` in `whatsapp/default`.
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
      streaming: "partial", // off | partial | block | progress (predefinito: off; attivalo esplicitamente per evitare rate limit sulle modifiche dell’anteprima)
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

- Token del bot: `channels.telegram.botToken` oppure `channels.telegram.tokenFile` (solo file regolari; symlink rifiutati), con `TELEGRAM_BOT_TOKEN` come fallback per l’account predefinito.
- L’opzionale `channels.telegram.defaultAccount` sostituisce la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- Nelle configurazioni multi-account (2+ ID account), imposta un valore predefinito esplicito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) per evitare l’instradamento di fallback; `openclaw doctor` avvisa quando manca o non è valido.
- `configWrites: false` blocca le scritture di configurazione avviate da Telegram (migrazioni ID supergruppo, `/config set|unset`).
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano binding ACP persistenti per gli argomenti del forum (usa il canonico `chatId:topic:topicId` in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).
- Le anteprime di streaming Telegram usano `sendMessage` + `editMessageText` (funziona in chat dirette e di gruppo).
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
              systemPrompt: "Short answers only.",
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` come fallback per l’account predefinito.
- Le chiamate dirette in uscita che forniscono un `token` Discord esplicito usano quel token per la chiamata; le impostazioni di retry/policy dell’account provengono comunque dall’account selezionato nello snapshot di runtime attivo.
- L’opzionale `channels.discord.defaultAccount` sostituisce la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- Usa `user:<id>` (DM) oppure `channel:<id>` (canale guild) per le destinazioni di consegna; gli ID numerici semplici vengono rifiutati.
- Gli slug delle guild sono minuscoli con gli spazi sostituiti da `-`; le chiavi dei canali usano il nome in forma slug (senza `#`). Preferisci gli ID delle guild.
- I messaggi creati dai bot vengono ignorati per impostazione predefinita. `allowBots: true` li abilita; usa `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i propri messaggi vengono comunque filtrati).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e gli override a livello di canale) scarta i messaggi che menzionano un altro utente o ruolo ma non il bot (escludendo @everyone/@here).
- `maxLinesPerMessage` (predefinito 17) divide i messaggi alti anche quando restano sotto 2000 caratteri.
- `channels.discord.threadBindings` controlla l’instradamento associato ai thread Discord:
  - `enabled`: override Discord per le funzionalità di sessione associate al thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/instradamento associati)
  - `idleHours`: override Discord per l’auto-unfocus da inattività in ore (`0` disabilita)
  - `maxAgeHours`: override Discord per età massima rigida in ore (`0` disabilita)
  - `spawnSubagentSessions`: interruttore opt-in per la creazione/associazione automatica di thread da `sessions_spawn({ thread: true })`
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano binding ACP persistenti per canali e thread (usa l’ID di canale/thread in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` imposta il colore di accento per i contenitori Discord components v2.
- `channels.discord.voice` abilita conversazioni nei canali vocali Discord e override opzionali di auto-join + TTS.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` vengono inoltrati alle opzioni DAVE di `@discordjs/voice` (`true` e `24` per impostazione predefinita).
- OpenClaw tenta inoltre il recupero della ricezione vocale uscendo/rientrando in una sessione vocale dopo ripetuti errori di decrittazione.
- `channels.discord.streaming` è la chiave canonica della modalità di streaming. I valori legacy `streamMode` e booleani `streaming` vengono migrati automaticamente.
- `channels.discord.autoPresence` mappa la disponibilità del runtime alla presenza del bot (healthy => online, degraded => idle, exhausted => dnd) e consente override opzionali del testo di stato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita la corrispondenza con nomi/tag modificabili (modalità di compatibilità di emergenza).
- `channels.discord.execApprovals`: consegna nativa Discord delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` oppure `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare richieste exec. Usa come fallback `commands.ownerAllowFrom` se omesso.
  - `agentFilter`: allowlist opzionale di ID agente. Ometti per inoltrare approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern opzionali di chiave di sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito) li invia nei DM degli approvatori, `"channel"` li invia nel canale di origine, `"both"` li invia in entrambi. Quando la destinazione include `"channel"`, i pulsanti sono utilizzabili solo dagli approvatori risolti.
  - `cleanupAfterResolve`: quando `true`, elimina i DM di approvazione dopo approvazione, rifiuto o timeout.

**Modalità di notifica delle reazioni:** `off` (nessuna), `own` (messaggi del bot, predefinita), `all` (tutti i messaggi), `allowlist` (da `guilds.<id>.users` su tutti i messaggi).

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

- JSON dell’account di servizio: inline (`serviceAccount`) oppure da file (`serviceAccountFile`).
- È supportato anche SecretRef per l’account di servizio (`serviceAccountRef`).
- Fallback env: `GOOGLE_CHAT_SERVICE_ACCOUNT` oppure `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` oppure `users/<userId>` per le destinazioni di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita la corrispondenza con email principal modificabili (modalità di compatibilità di emergenza).

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

- **Socket mode** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` come fallback env per l’account predefinito).
- **HTTP mode** richiede `botToken` più `signingSecret` (alla radice o per account).
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  plaintext oppure oggetti SecretRef.
- Gli snapshot degli account Slack espongono campi di sorgente/stato per credenziale come
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in modalità HTTP,
  `signingSecretStatus`. `configured_unavailable` significa che l’account è
  configurato tramite SecretRef ma l’attuale percorso comando/runtime non ha potuto
  risolvere il valore del segreto.
- `configWrites: false` blocca le scritture di configurazione avviate da Slack.
- L’opzionale `channels.slack.defaultAccount` sostituisce la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- `channels.slack.streaming.mode` è la chiave canonica della modalità di streaming Slack. `channels.slack.streaming.nativeTransport` controlla il trasporto di streaming nativo di Slack. I valori legacy `streamMode`, booleani `streaming` e `nativeStreaming` vengono migrati automaticamente.
- Usa `user:<id>` (DM) oppure `channel:<id>` per le destinazioni di consegna.

**Modalità di notifica delle reazioni:** `off`, `own` (predefinita), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento della sessione thread:** `thread.historyScope` è per-thread (predefinito) oppure condiviso nel canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread.

- Lo streaming nativo Slack più lo stato thread in stile assistente Slack “is typing...” richiedono una destinazione di risposta nel thread. I DM di primo livello restano fuori thread per impostazione predefinita, quindi usano `typingReaction` o la consegna normale invece dell’anteprima in stile thread.
- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre è in esecuzione una risposta, poi la rimuove al completamento. Usa uno shortcode emoji Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna nativa Slack delle approvazioni exec e autorizzazione degli approvatori. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` oppure `"both"`).

| Gruppo azione | Predefinito | Note                       |
| ------------- | ----------- | -------------------------- |
| reactions     | abilitato   | Reagire + elencare reazioni |
| messages      | abilitato   | Leggere/inviare/modificare/eliminare |
| pins          | abilitato   | Fissare/rimuovere/elencare |
| memberInfo    | abilitato   | Informazioni membro        |
| emojiList     | abilitato   | Elenco emoji personalizzate |

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
        // URL esplicito opzionale per deployment dietro reverse proxy/pubblici
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modalità chat: `oncall` (risponde a @-mention, predefinita), `onmessage` (ogni messaggio), `onchar` (messaggi che iniziano con il prefisso trigger).

Quando i comandi nativi Mattermost sono abilitati:

- `commands.callbackPath` deve essere un percorso (per esempio `/api/channels/mattermost/command`), non un URL completo.
- `commands.callbackUrl` deve risolversi verso l’endpoint gateway OpenClaw ed essere raggiungibile dal server Mattermost.
- Le callback slash native sono autenticate con i token per comando restituiti
  da Mattermost durante la registrazione del comando slash. Se la registrazione fallisce o nessun
  comando viene attivato, OpenClaw rifiuta le callback con
  `Unauthorized: invalid command token.`
- Per host di callback privati/tailnet/interni, Mattermost può richiedere che
  `ServiceSettings.AllowedUntrustedInternalConnections` includa l’host/dominio della callback.
  Usa valori host/dominio, non URL completi.
- `channels.mattermost.configWrites`: consenti o nega scritture di configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiede `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: override per canale del gating delle menzioni (`"*"` per il predefinito).
- L’opzionale `channels.mattermost.defaultAccount` sostituisce la selezione dell’account predefinito quando corrisponde a un ID account configurato.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // binding account opzionale
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

**Modalità di notifica delle reazioni:** `off`, `own` (predefinita), `all`, `allowlist` (da `reactionAllowlist`).

- `channels.signal.account`: fissa l’avvio del canale a una specifica identità account Signal.
- `channels.signal.configWrites`: consente o nega scritture di configurazione avviate da Signal.
- L’opzionale `channels.signal.defaultAccount` sostituisce la selezione dell’account predefinito quando corrisponde a un ID account configurato.

### BlueBubbles

BlueBubbles è il percorso iMessage consigliato (supportato da Plugin, configurato sotto `channels.bluebubbles`).

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

- Percorsi chiave core coperti qui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- L’opzionale `channels.bluebubbles.defaultAccount` sostituisce la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare conversazioni BlueBubbles a sessioni ACP persistenti. Usa un handle BlueBubbles o una stringa target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).
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

- L’opzionale `channels.imessage.defaultAccount` sostituisce la selezione dell’account predefinito quando corrisponde a un ID account configurato.

- Richiede Full Disk Access al database di Messages.
- Preferisci destinazioni `chat_id:<id>`. Usa `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; imposta `remoteHost` (`host` oppure `user@host`) per il recupero allegati tramite SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in ingresso (predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa un controllo rigoroso della chiave host, quindi assicurati che la chiave host del relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consente o nega scritture di configurazione avviate da iMessage.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare conversazioni iMessage a sessioni ACP persistenti. Usa un handle normalizzato o una destinazione chat esplicita (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).

<Accordion title="Esempio di wrapper SSH per iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è supportato da Plugin ed è configurato sotto `channels.matrix`.

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
- `channels.matrix.proxy` instrada il traffico HTTP Matrix attraverso un proxy HTTP(S) esplicito. Gli account con nome possono sostituirlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` consente homeserver privati/interni. `proxy` e questo opt-in di rete sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l’account preferito nelle configurazioni multi-account.
- `channels.matrix.autoJoin` usa come predefinito `off`, quindi le stanze invitate e i nuovi inviti in stile DM vengono ignorati finché non imposti `autoJoin: "allowlist"` con `autoJoinAllowlist` oppure `autoJoin: "always"`.
- `channels.matrix.execApprovals`: consegna nativa Matrix delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` oppure `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (es. `@owner:example.org`) autorizzati ad approvare richieste exec.
  - `agentFilter`: allowlist opzionale di ID agente. Ometti per inoltrare approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern opzionali di chiave di sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito), `"channel"` (stanza di origine) oppure `"both"`.
  - Override per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controlla come i DM Matrix vengono raggruppati nelle sessioni: `per-user` (predefinito) condivisione per peer instradato, mentre `per-room` isola ogni stanza DM.
- I probe di stato Matrix e le ricerche live nella directory usano la stessa policy proxy del traffico runtime.
- La configurazione completa di Matrix, le regole di targeting e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è supportato da Plugin ed è configurato sotto `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, policy team/channel:
      // vedi /channels/msteams
    },
  },
}
```

- Percorsi chiave core coperti qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, webhook, policy DM/gruppi, override per team/per canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è supportato da Plugin ed è configurato sotto `channels.irc`.

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

- Percorsi chiave core coperti qui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- L’opzionale `channels.irc.defaultAccount` sostituisce la selezione dell’account predefinito quando corrisponde a un ID account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/allowlist/gating delle menzioni) è documentata in [IRC](/it/channels/irc).

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

- `default` viene usato quando `accountId` è omesso (CLI + instradamento).
- I token env si applicano solo all’account **default**.
- Le impostazioni base del canale si applicano a tutti gli account salvo override per account.
- Usa `bindings[].match.accountId` per instradare ciascun account verso un agente diverso.
- Se aggiungi un account non predefinito tramite `openclaw channels add` (o onboarding del canale) mentre sei ancora in una configurazione top-level del canale single-account, OpenClaw promuove prima i valori single-account top-level con ambito account nella mappa account del canale così l’account originale continua a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece preservare una destinazione nominata/predefinita esistente corrispondente.
- I binding esistenti solo-canale (senza `accountId`) continuano a corrispondere all’account predefinito; i binding con ambito account restano opzionali.
- `openclaw doctor --fix` ripara anche forme miste spostando i valori single-account top-level con ambito account nell’account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può invece preservare una destinazione nominata/predefinita esistente corrispondente.

### Altri canali Plugin

Molti canali Plugin sono configurati come `channels.<id>` e documentati nelle loro pagine canale dedicate (per esempio Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Vedi l’indice completo dei canali: [Channels](/it/channels).

### Gating delle menzioni nelle chat di gruppo

I messaggi di gruppo richiedono per impostazione predefinita una **menzione obbligatoria** (menzione nei metadati o pattern regex sicuri). Si applica a chat di gruppo WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipi di menzione:**

- **Menzioni nei metadati**: @-mention native della piattaforma. Ignorate nella modalità self-chat di WhatsApp.
- **Pattern di testo**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- Il gating delle menzioni viene applicato solo quando il rilevamento è possibile (menzioni native o almeno un pattern).

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

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono sostituirlo con `channels.<channel>.historyLimit` (oppure per account). Imposta `0` per disabilitare.

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

Risoluzione: override per DM → predefinito del provider → nessun limite (tutto conservato).

Supportato da: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

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
    text: true, // analizza i /comandi nei messaggi chat
    bash: false, // consente ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // consente /config
    mcp: false, // consente /mcp
    plugins: false, // consente /plugins
    debug: false, // consente /debug
    restart: true, // consente /restart + strumento di riavvio del gateway
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

- Questo blocco configura le superfici dei comandi. Per l’attuale catalogo di comandi integrati + inclusi, vedi [Slash Commands](/it/tools/slash-commands).
- Questa pagina è un **riferimento delle chiavi di configurazione**, non il catalogo completo dei comandi. I comandi posseduti da canale/Plugin come QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` e Talk `/voice` sono documentati nelle rispettive pagine di canale/Plugin più [Slash Commands](/it/tools/slash-commands).
- I comandi di testo devono essere messaggi **autonomi** con `/` iniziale.
- `native: "auto"` attiva i comandi nativi per Discord/Telegram e lascia Slack disattivato.
- `nativeSkills: "auto"` attiva i comandi Skills nativi per Discord/Telegram e lascia Slack disattivato.
- Override per canale: `channels.discord.commands.native` (bool oppure `"auto"`). `false` cancella i comandi precedentemente registrati.
- Sostituisci la registrazione nativa degli Skills per canale con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` aggiunge voci extra al menu del bot Telegram.
- `bash: true` abilita `! <cmd>` per la shell host. Richiede `tools.elevated.enabled` e mittente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (legge/scrive `openclaw.json`). Per i client `chat.send` del gateway, le scritture persistenti `/config set|unset` richiedono anche `operator.admin`; il comando in sola lettura `/config show` resta disponibile ai normali client operatore con scope di scrittura.
- `mcp: true` abilita `/mcp` per la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`.
- `plugins: true` abilita `/plugins` per discovery, installazione e controlli di abilitazione/disabilitazione dei Plugin.
- `channels.<provider>.configWrites` controlla le mutazioni di configurazione per canale (predefinito: true).
- Per i canali multi-account, `channels.<provider>.accounts.<id>.configWrites` controlla anche le scritture che hanno come destinazione quell’account (per esempio `/allowlist --config --account <id>` oppure `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` disabilita `/restart` e le azioni dello strumento di riavvio del gateway. Predefinito: `true`.
- `ownerAllowFrom` è l’allowlist esplicita del proprietario per comandi/strumenti riservati al proprietario. È separata da `allowFrom`.
- `ownerDisplay: "hash"` esegue l’hash degli ID proprietario nel prompt di sistema. Imposta `ownerDisplaySecret` per controllare l’hash.
- `allowFrom` è per provider. Quando è impostato, è l’**unica** fonte di autorizzazione (le allowlist/pairing del canale e `useAccessGroups` vengono ignorati).
- `useAccessGroups: false` consente ai comandi di bypassare le policy dei gruppi di accesso quando `allowFrom` non è impostato.
- Mappa della documentazione dei comandi:
  - catalogo integrato + incluso: [Slash Commands](/it/tools/slash-commands)
  - superfici di comando specifiche del canale: [Channels](/it/channels)
  - comandi QQ Bot: [QQ Bot](/it/channels/qqbot)
  - comandi pairing: [Pairing](/it/channels/pairing)
  - comando LINE card: [LINE](/it/channels/line)
  - memory dreaming: [Dreaming](/it/concepts/dreaming)

</Accordion>

---

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference) — chiavi di primo livello
- [Configurazione — agenti](/it/gateway/config-agents)
- [Panoramica dei canali](/it/channels)
