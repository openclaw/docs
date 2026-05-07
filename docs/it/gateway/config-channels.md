---
read_when:
    - Configurazione di un Plugin di canale (autenticazione, controllo degli accessi, multi-account)
    - Risoluzione dei problemi relativi alle chiavi di configurazione per canale
    - Audit dei criteri DM, dei criteri di gruppo o dei controlli sulle menzioni
summary: 'Configurazione dei canali: controllo degli accessi, associazione, chiavi per canale in Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altro ancora'
title: Configurazione — canali
x-i18n:
    generated_at: "2026-05-07T01:52:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f94d41a347ade8b9447e9f31e48d46830b2faac2202823480a68b7986107176e
    source_path: gateway/config-channels.md
    workflow: 16
---

Configurazione per canale con chiavi sotto `channels.*`. Copre l'accesso a DM e gruppi,
le configurazioni multi-account, il gating delle menzioni e le chiavi per canale per Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage e gli altri Plugin di canale inclusi.

Per agent, strumenti, runtime del Gateway e altre chiavi di primo livello, consulta
[Riferimento di configurazione](/it/gateway/configuration-reference).

## Canali

Ogni canale si avvia automaticamente quando esiste la relativa sezione di configurazione (a meno che `enabled: false`).

### Accesso a DM e gruppi

Tutti i canali supportano criteri DM e criteri di gruppo:

| Criterio DM         | Comportamento                                                  |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (default) | I mittenti sconosciuti ricevono un codice di pairing monouso; il proprietario deve approvare |
| `allowlist`         | Solo mittenti in `allowFrom` (o nell'archivio dei consentiti abbinati) |
| `open`              | Consenti tutti i DM in ingresso (richiede `allowFrom: ["*"]`)  |
| `disabled`          | Ignora tutti i DM in ingresso                                 |

| Criterio di gruppo    | Comportamento                                         |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (default) | Solo gruppi che corrispondono alla allowlist configurata |
| `open`                | Ignora le allowlist di gruppo (il gating delle menzioni si applica comunque) |
| `disabled`            | Blocca tutti i messaggi di gruppo/stanza              |

<Note>
`channels.defaults.groupPolicy` imposta il valore predefinito quando `groupPolicy` di un provider non è impostato.
I codici di pairing scadono dopo 1 ora. Le richieste di pairing DM in sospeso sono limitate a **3 per canale**.
Se manca del tutto un blocco provider (`channels.<provider>` assente), il criterio di gruppo a runtime torna a `allowlist` (fail-closed) con un avviso all'avvio.
</Note>

### Override dei modelli dei canali

Usa `channels.modelByChannel` per vincolare ID di canale specifici a un modello. I valori accettano `provider/model` o alias di modello configurati. La mappatura del canale si applica quando una sessione non ha già un override del modello (per esempio, impostato tramite `/model`).

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

Usa `channels.defaults` per il criterio di gruppo e il comportamento Heartbeat condivisi tra provider:

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
- `channels.defaults.contextVisibility`: modalità predefinita di visibilità del contesto supplementare per tutti i canali. Valori: `all` (predefinito, include tutto il contesto di citazioni/thread/cronologia), `allowlist` (include solo il contesto da mittenti nella allowlist), `allowlist_quote` (come allowlist ma mantiene il contesto esplicito di citazione/risposta). Override per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include gli stati dei canali integri nell'output Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: include stati degradati/di errore nell'output Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: visualizza l'output Heartbeat in stile indicatore compatto.

### WhatsApp

WhatsApp funziona tramite il canale web del gateway (Baileys Web). Si avvia automaticamente quando esiste una sessione collegata.

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

<Accordion title="Multi-account WhatsApp">

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

- I comandi in uscita usano per impostazione predefinita l'account `default`, se presente; altrimenti il primo ID account configurato (ordinato).
- L'opzione `channels.whatsapp.defaultAccount` sovrascrive quella selezione predefinita dell'account di fallback quando corrisponde a un ID account configurato.
- La directory auth Baileys legacy a singolo account viene migrata da `openclaw doctor` in `whatsapp/default`.
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
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo file normale; i symlink vengono rifiutati), con `TELEGRAM_BOT_TOKEN` come fallback per l'account predefinito.
- `apiRoot` è solo la root della Telegram Bot API. Usa `https://api.telegram.org` o la tua root self-hosted/proxy, non `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` rimuove un suffisso finale accidentale `/bot<TOKEN>`.
- L'opzione `channels.telegram.defaultAccount` sovrascrive la selezione predefinita dell'account quando corrisponde a un ID account configurato.
- Nelle configurazioni multi-account (2+ ID account), imposta un valore predefinito esplicito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) per evitare l'instradamento di fallback; `openclaw doctor` avvisa quando manca o non è valido.
- `configWrites: false` blocca le scritture di configurazione avviate da Telegram (migrazioni degli ID dei supergruppi, `/config set|unset`).
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano binding ACP persistenti per gli argomenti dei forum (usa il formato canonico `chatId:topic:topicId` in `match.peer.id`). La semantica dei campi è condivisa in [Agent ACP](/it/tools/acp-agents#persistent-channel-bindings).
- Le anteprime di streaming di Telegram usano `sendMessage` + `editMessageText` (funziona nelle chat dirette e di gruppo).
- Criterio di retry: consulta [Criterio di retry](/it/concepts/retry).

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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` come fallback per l'account predefinito.
- Le chiamate in uscita dirette che forniscono un `token` Discord esplicito usano quel token per la chiamata; le impostazioni di tentativo/policy dell'account provengono comunque dall'account selezionato nello snapshot di runtime attivo.
- `channels.discord.defaultAccount` opzionale sostituisce la selezione dell'account predefinito quando corrisponde a un id account configurato.
- Usa `user:<id>` (DM) o `channel:<id>` (canale guild) per le destinazioni di consegna; gli ID numerici nudi vengono rifiutati.
- Gli slug delle guild sono in minuscolo con gli spazi sostituiti da `-`; le chiavi dei canali usano il nome trasformato in slug (senza `#`). Preferisci gli ID delle guild.
- I messaggi creati dai bot vengono ignorati per impostazione predefinita. `allowBots: true` li abilita; usa `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i propri messaggi restano filtrati).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e le sostituzioni a livello di canale) scarta i messaggi che menzionano un altro utente o ruolo ma non il bot (escludendo @everyone/@here).
- `channels.discord.mentionAliases` mappa il testo `@handle` stabile in uscita agli ID utente Discord prima dell'invio, così i compagni di team noti possono essere menzionati in modo deterministico anche quando la cache temporanea della directory è vuota. Le sostituzioni per account si trovano sotto `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (predefinito 17) divide i messaggi lunghi anche quando sono sotto i 2000 caratteri.
- `channels.discord.threadBindings` controlla il routing Discord vincolato ai thread:
  - `enabled`: sostituzione Discord per le funzionalità di sessione vincolate ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/routing vincolati)
  - `idleHours`: sostituzione Discord per l'auto-unfocus per inattività in ore (`0` disabilita)
  - `maxAgeHours`: sostituzione Discord per l'età massima rigida in ore (`0` disabilita)
  - `spawnSessions`: interruttore per `sessions_spawn({ thread: true })` e creazione/vincolo automatici di thread per lo spawn di thread ACP (predefinito: `true`)
  - `defaultSpawnContext`: contesto subagent nativo per gli spawn vincolati ai thread (`"fork"` per impostazione predefinita)
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano binding ACP persistenti per canali e thread (usa l'id del canale/thread in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` imposta il colore di accento per i contenitori dei componenti Discord v2.
- `channels.discord.voice` abilita le conversazioni nei canali vocali Discord e le sostituzioni opzionali di auto-join + LLM + TTS. Le configurazioni Discord solo testo lasciano la voce disattivata per impostazione predefinita; imposta `channels.discord.voice.enabled=true` per abilitarla.
- `channels.discord.voice.model` sostituisce opzionalmente il modello LLM usato per le risposte nei canali vocali Discord.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` vengono passati alle opzioni DAVE di `@discordjs/voice` (`true` e `24` per impostazione predefinita).
- `channels.discord.voice.connectTimeoutMs` controlla l'attesa iniziale di `@discordjs/voice` Ready per `/vc join` e i tentativi di auto-join (`30000` per impostazione predefinita).
- `channels.discord.voice.reconnectGraceMs` controlla per quanto tempo una sessione vocale disconnessa può impiegare per entrare nella segnalazione di riconnessione prima che OpenClaw la distrugga (`15000` per impostazione predefinita).
- OpenClaw tenta inoltre il recupero della ricezione vocale lasciando e rientrando in una sessione vocale dopo errori di decrittazione ripetuti.
- `channels.discord.streaming` è la chiave canonica della modalità stream. Discord usa per impostazione predefinita `streaming.mode: "progress"` così l'avanzamento di strumenti/lavoro appare in un unico messaggio di anteprima modificato; imposta `streaming.mode: "off"` per disabilitarlo. I valori legacy `streamMode` e booleani `streaming` restano alias di runtime; esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.
- `channels.discord.autoPresence` mappa la disponibilità di runtime alla presenza del bot (healthy => online, degraded => idle, exhausted => dnd) e consente sostituzioni opzionali del testo di stato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita il matching mutabile di nomi/tag (modalità di compatibilità break-glass).
- `channels.discord.execApprovals`: consegna nativa Discord delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare richieste exec. Usa `commands.ownerAllowFrom` come fallback quando omesso.
  - `agentFilter`: allowlist opzionale di ID agent. Ometti per inoltrare approvazioni per tutti gli agent.
  - `sessionFilter`: pattern opzionali di chiavi di sessione (sottostringa o regex).
  - `target`: dove inviare le richieste di approvazione. `"dm"` (predefinito) invia ai DM degli approvatori, `"channel"` invia al canale di origine, `"both"` invia a entrambi. Quando target include `"channel"`, i pulsanti sono utilizzabili solo dagli approvatori risolti.
  - `cleanupAfterResolve`: quando `true`, elimina i DM di approvazione dopo approvazione, negazione o timeout.

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
- Usa `spaces/<spaceId>` o `users/<userId>` per le destinazioni di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita il matching mutabile dei principal email (modalità di compatibilità break-glass).

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

- **Socket mode** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` per il fallback env dell'account predefinito).
- **Modalità HTTP** richiede `botToken` più `signingSecret` (alla radice o per account).
- `socketMode` passa la messa a punto del trasporto Socket Mode dell'SDK Slack all'API pubblica del receiver Bolt. Usalo solo quando indaghi su timeout ping/pong o comportamento websocket obsoleto.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe di testo semplice
  o oggetti SecretRef.
- Gli snapshot degli account Slack espongono campi origine/stato per credenziale, come
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in modalità HTTP,
  `signingSecretStatus`. `configured_unavailable` significa che l'account è
  configurato tramite SecretRef ma il percorso del comando/runtime corrente non è riuscito
  a risolvere il valore del segreto.
- `configWrites: false` blocca le scritture di configurazione avviate da Slack.
- `channels.slack.defaultAccount` opzionale sostituisce la selezione dell'account predefinito quando corrisponde a un id account configurato.
- `channels.slack.streaming.mode` è la chiave canonica della modalità stream di Slack. `channels.slack.streaming.nativeTransport` controlla il trasporto di streaming nativo di Slack. I valori legacy `streamMode`, booleani `streaming` e `nativeStreaming` restano alias di runtime; esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.
- Usa `user:<id>` (DM) o `channel:<id>` per le destinazioni di consegna.

**Modalità di notifica delle reazioni:** `off`, `own` (predefinito), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento delle sessioni di thread:** `thread.historyScope` è per thread (predefinito) o condiviso nel canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread.

- Lo streaming nativo Slack più lo stato di thread in stile assistente Slack "is typing..." richiedono una destinazione di thread di risposta. I DM di primo livello restano fuori thread per impostazione predefinita, quindi possono ancora trasmettere tramite anteprime bozza Slack pubblicate e modificate invece di mostrare l'anteprima stream/stato nativa in stile thread.
- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre una risposta è in esecuzione, quindi la rimuove al completamento. Usa uno shortcode emoji Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna nativa Slack delle approvazioni exec e autorizzazione degli approvatori. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` o `"both"`).

| Gruppo di azioni | Predefinito | Note                   |
| ------------ | ------- | ---------------------- |
| reactions    | abilitato | Reazioni + elenco reazioni |
| messages     | abilitato | Leggi/invia/modifica/elimina |
| pins         | abilitato | Fissa/rimuovi/elenca   |
| memberInfo   | abilitato | Informazioni membro    |
| emojiList    | abilitato | Elenco emoji personalizzate |

### Mattermost

Mattermost viene distribuito come Plugin in bundle nelle versioni correnti di OpenClaw. Le build più vecchie o
personalizzate possono installare un pacchetto npm corrente con
`openclaw plugins install @openclaw/mattermost`. Controlla
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
per i dist-tag correnti prima di fissare una versione.

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

Modalità chat: `oncall` (rispondi alle @-menzioni, predefinita), `onmessage` (ogni messaggio), `onchar` (messaggi che iniziano con il prefisso di attivazione).

Quando i comandi nativi di Mattermost sono abilitati:

- `commands.callbackPath` deve essere un percorso (per esempio `/api/channels/mattermost/command`), non un URL completo.
- `commands.callbackUrl` deve risolversi nell'endpoint del Gateway OpenClaw ed essere raggiungibile dal server Mattermost.
- I callback slash nativi sono autenticati con i token per comando restituiti
  da Mattermost durante la registrazione del comando slash. Se la registrazione non riesce o nessun
  comando viene attivato, OpenClaw rifiuta i callback con
  `Unauthorized: invalid command token.`
- Per host di callback privati/tailnet/interni, Mattermost potrebbe richiedere
  che `ServiceSettings.AllowedUntrustedInternalConnections` includa l'host/dominio di callback.
  Usa valori host/dominio, non URL completi.
- `channels.mattermost.configWrites`: consente o nega le scritture di configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiede `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: override per canale del gating tramite menzione (`"*"` per il valore predefinito).
- L'opzione facoltativa `channels.mattermost.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.

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

**Modalità di notifica delle reazioni:** `off`, `own` (predefinita), `all`, `allowlist` (da `reactionAllowlist`).

- `channels.signal.account`: vincola l'avvio del canale a un'identità account Signal specifica.
- `channels.signal.configWrites`: consente o nega le scritture di configurazione avviate da Signal.
- L'opzione facoltativa `channels.signal.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.

### BlueBubbles

BlueBubbles è il bridge iMessage legacy (supportato da Plugin, configurato sotto `channels.bluebubbles`). Le configurazioni esistenti restano supportate, ma le nuove distribuzioni iMessage di OpenClaw dovrebbero preferire `channels.imessage` quando `imsg` può essere eseguito sull'host Messages.

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

- Percorsi chiave principali trattati qui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- L'opzione facoltativa `channels.bluebubbles.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare conversazioni BlueBubbles a sessioni ACP persistenti. Usa un handle BlueBubbles o una stringa di destinazione (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica dei campi condivisi: [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).
- La configurazione completa del canale BlueBubbles e la motivazione della deprecazione sono documentate in [BlueBubbles](/it/channels/bluebubbles).

### iMessage

OpenClaw avvia `imsg rpc` (JSON-RPC su stdio). Non sono richiesti daemon o porte. Questo è il percorso preferito per le nuove configurazioni iMessage di OpenClaw quando l'host può concedere le autorizzazioni per il database Messages e Automation.

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

- L'opzione facoltativa `channels.imessage.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.

- Richiede Full Disk Access al DB Messages.
- Preferisci destinazioni `chat_id:<id>`. Usa `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; imposta `remoteHost` (`host` o `user@host`) per il recupero degli allegati tramite SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in ingresso (predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa il controllo rigoroso della chiave host, quindi assicurati che la chiave dell'host relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consente o nega le scritture di configurazione avviate da iMessage.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare conversazioni iMessage a sessioni ACP persistenti. Usa un handle normalizzato o una destinazione chat esplicita (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica dei campi condivisi: [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Esempio di wrapper SSH per iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è supportato da Plugin e configurato sotto `channels.matrix`.

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
- `channels.matrix.proxy` instrada il traffico HTTP Matrix attraverso un proxy HTTP(S) esplicito. Gli account con nome possono sovrascriverlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` consente homeserver privati/interni. `proxy` e questa adesione esplicita alla rete sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l'account preferito nelle configurazioni multi-account.
- `channels.matrix.autoJoin` usa `off` per impostazione predefinita, quindi le stanze a cui si è invitati e i nuovi inviti in stile DM vengono ignorati finché non imposti `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: recapito delle approvazioni exec nativo di Matrix e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità automatica, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (ad es. `@owner:example.org`) autorizzati ad approvare richieste exec.
  - `agentFilter`: allowlist facoltativa di ID agente. Omettila per inoltrare le approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi di chiavi sessione (sottostringa o regex).
  - `target`: dove inviare le richieste di approvazione. `"dm"` (predefinito), `"channel"` (stanza di origine) o `"both"`.
  - Override per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controlla come i DM Matrix vengono raggruppati in sessioni: `per-user` (predefinito) condivide per peer instradato, mentre `per-room` isola ogni stanza DM.
- I probe di stato Matrix e le ricerche live nella directory usano la stessa policy proxy del traffico runtime.
- La configurazione completa di Matrix, le regole di targeting e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è supportato da Plugin e configurato sotto `channels.msteams`.

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

- Percorsi chiave principali trattati qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, Webhook, policy DM/gruppo, override per team/per canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è supportato da Plugin e configurato sotto `channels.irc`.

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

- Percorsi chiave principali trattati qui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- L'opzione facoltativa `channels.irc.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/allowlist/gating tramite menzione) è documentata in [IRC](/it/channels/irc).

### Più account (tutti i canali)

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

- `default` viene usato quando `accountId` viene omesso (CLI + routing).
- I token env si applicano solo all'account **predefinito**.
- Le impostazioni di base del canale si applicano a tutti gli account, salvo override per account.
- Usa `bindings[].match.accountId` per instradare ogni account a un agente diverso.
- Se aggiungi un account non predefinito tramite `openclaw channels add` (o onboarding del canale) mentre sei ancora su una configurazione canale di primo livello a singolo account, OpenClaw promuove prima i valori di primo livello a singolo account con ambito account nella mappa degli account del canale, così l'account originale continua a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece preservare una destinazione con nome/predefinita corrispondente esistente.
- Le associazioni esistenti solo a livello di canale (senza `accountId`) continuano a corrispondere all'account predefinito; le associazioni con ambito account restano facoltative.
- `openclaw doctor --fix` ripara anche forme miste spostando i valori di primo livello a singolo account con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può invece preservare una destinazione con nome/predefinita corrispondente esistente.

### Altri canali Plugin

Molti canali Plugin sono configurati come `channels.<id>` e documentati nelle rispettive pagine canale dedicate (per esempio Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Consulta l'indice completo dei canali: [Canali](/it/channels).

### Gating tramite menzione nelle chat di gruppo

I messaggi di gruppo richiedono **la menzione** per impostazione predefinita (menzione nei metadati o pattern regex sicuri). Si applica alle chat di gruppo WhatsApp, Telegram, Discord, Google Chat e iMessage.

Le risposte visibili sono controllate separatamente. Le stanze di gruppo/canale usano per impostazione predefinita `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw continua a elaborare il turno, ma le normali risposte finali restano private e l'output visibile nella stanza richiede `message(action=send)`. Imposta `"automatic"` solo quando vuoi il comportamento legacy in cui le normali risposte vengono pubblicate di nuovo nella stanza. Per applicare lo stesso comportamento di risposta visibile solo tramite strumento anche alle chat dirette, imposta `messages.visibleReplies: "message_tool"`; anche l'harness Codex usa quel comportamento solo tramite strumento come impostazione predefinita non impostata per le chat dirette.

Le risposte visibili solo tramite strumento richiedono un modello/runtime che chiami gli strumenti in modo affidabile. Se
il log della sessione mostra testo dell'assistente con `didSendViaMessagingTool: false`, il
modello ha prodotto una risposta finale privata invece di chiamare lo strumento di messaggistica.
Passa a un modello più forte nelle chiamate agli strumenti per quel canale, oppure imposta
`messages.groupChat.visibleReplies: "automatic"` per ripristinare le risposte finali visibili legacy.

Se lo strumento dei messaggi non è disponibile secondo la policy degli strumenti attiva, OpenClaw ripiega su risposte visibili automatiche invece di sopprimere silenziosamente la risposta. `openclaw doctor` avvisa di questa mancata corrispondenza.

Il Gateway ricarica a caldo la configurazione `messages` dopo il salvataggio del file. Riavvia solo quando il controllo delle modifiche ai file o il ricaricamento della configurazione è disabilitato nella distribuzione.

**Tipi di menzione:**

- **Menzioni nei metadati**: @-menzioni native della piattaforma. Ignorate nella modalità chat con se stessi di WhatsApp.
- **Pattern di testo**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e la ripetizione annidata non sicura vengono ignorati.
- Il gating delle menzioni viene applicato solo quando il rilevamento è possibile (menzioni native o almeno un pattern).

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

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono sovrascriverlo con `channels.<channel>.historyLimit` (o per account). Imposta `0` per disabilitarlo.

`messages.visibleReplies` è il valore predefinito globale per i turni sorgente; `messages.groupChat.visibleReplies` lo sovrascrive per i turni sorgente di gruppo/canale. Quando `messages.visibleReplies` non è impostato, un harness può fornire il proprio valore predefinito per direct/source; l’harness Codex usa per impostazione predefinita `message_tool`. Le allowlist dei canali e il gating delle menzioni decidono comunque se un turno viene elaborato.

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

Risoluzione: sovrascrittura per DM → valore predefinito del provider → nessun limite (tutto conservato).

Supportati: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modalità chat con se stessi

Includi il tuo numero in `allowFrom` per abilitare la modalità chat con se stessi (ignora le @-menzioni native, risponde solo ai pattern di testo):

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

<Accordion title="Dettagli dei comandi">

- Questo blocco configura le superfici dei comandi. Per l’attuale catalogo dei comandi integrati e in bundle, consulta [Comandi slash](/it/tools/slash-commands).
- Questa pagina è un **riferimento delle chiavi di configurazione**, non il catalogo completo dei comandi. I comandi di proprietà di canali/Plugin, come QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memoria `/dreaming`, phone-control `/phone` e Talk `/voice`, sono documentati nelle rispettive pagine di canale/Plugin e in [Comandi slash](/it/tools/slash-commands).
- I comandi di testo devono essere messaggi **autonomi** con `/` iniziale.
- `native: "auto"` abilita i comandi nativi per Discord/Telegram, lasciando Slack disattivato.
- `nativeSkills: "auto"` abilita i comandi Skills nativi per Discord/Telegram, lasciando Slack disattivato.
- Sovrascrittura per canale: `channels.discord.commands.native` (booleano o `"auto"`). Per Discord, `false` salta la registrazione e la pulizia dei comandi nativi durante l’avvio.
- Sovrascrivi la registrazione delle skill native per canale con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` aggiunge voci extra al menu del bot Telegram.
- `bash: true` abilita `! <cmd>` per la shell host. Richiede `tools.elevated.enabled` e mittente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (legge/scrive `openclaw.json`). Per i client `chat.send` del Gateway, le scritture persistenti `/config set|unset` richiedono anche `operator.admin`; `/config show` in sola lettura resta disponibile ai normali client operator con ambito di scrittura.
- `mcp: true` abilita `/mcp` per la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`.
- `plugins: true` abilita `/plugins` per individuazione, installazione e controlli di abilitazione/disabilitazione dei Plugin.
- `channels.<provider>.configWrites` controlla le mutazioni della configurazione per canale (predefinito: true).
- Per i canali multi-account, `channels.<provider>.accounts.<id>.configWrites` controlla anche le scritture destinate a quell’account (ad esempio `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` disabilita `/restart` e le azioni dello strumento di riavvio del Gateway. Predefinito: `true`.
- `ownerAllowFrom` è la allowlist esplicita del proprietario per comandi/strumenti riservati al proprietario. È separata da `allowFrom`.
- `ownerDisplay: "hash"` esegue l’hash degli ID proprietario nel prompt di sistema. Imposta `ownerDisplaySecret` per controllare l’hashing.
- `allowFrom` è per provider. Quando è impostato, è l’**unica** fonte di autorizzazione (le allowlist/associazioni dei canali e `useAccessGroups` vengono ignorate).
- `useAccessGroups: false` consente ai comandi di bypassare le policy dei gruppi di accesso quando `allowFrom` non è impostato.
- Mappa della documentazione dei comandi:
  - catalogo integrato e in bundle: [Comandi slash](/it/tools/slash-commands)
  - superfici di comando specifiche del canale: [Canali](/it/channels)
  - comandi QQ Bot: [QQ Bot](/it/channels/qqbot)
  - comandi di associazione: [Associazione](/it/channels/pairing)
  - comando scheda LINE: [LINE](/it/channels/line)
  - dreaming della memoria: [Dreaming](/it/concepts/dreaming)

</Accordion>

---

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference) — chiavi di primo livello
- [Configurazione — agenti](/it/gateway/config-agents)
- [Panoramica dei canali](/it/channels)
